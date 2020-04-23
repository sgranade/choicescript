"use strict";

const http = require('http');
const path = require('path');
const {URL} = require('url');
const fs = require('fs');
const child_process = require('child_process');
const date = require('date-and-time');
const officegen = require('officegen');
const nodeCleanup = require('node-cleanup');

const dir = __dirname;

const settingsFilename = path.normalize(`${dir}/serve.json`);


var saveTranscript = false;
var docxTranscript = false;

// See if we have environment settings
try {
  if (fs.existsSync(settingsFilename)) {
    console.log(`Loading settings from ${settingsFilename}`);
    const rawdata = fs.readFileSync(settingsFilename);
    const settings = JSON.parse(rawdata);
    if (settings.transcript !== undefined) {
      saveTranscript = settings.transcript;
    }
    if (settings.docx !== undefined) {
      docxTranscript = settings.docx;
    }
  }
}
catch (err) {
  console.log(err);
}

var argv = require('minimist')(process.argv.slice(2));
if (argv.help || argv.h) {
  console.log("Usage: serve [options]\n\nOptions:\n\t--transcript\tSave a transcript of the session\n\t--docx\t\tCreate an MS Word .docx transcript instead of a plain-text transcript");
  process.exit(0);
}
if (argv.transcript) {
  saveTranscript = true;
}
if (argv.docx) {
  docxTranscript = true;
}


let base;

const mimeTypes = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.txt': 'text/plain',
}

const now = new Date();
var transcriptFilename = date.format(now, "[transcript-]YYYY-MM-DDTHH-mm-ss");
let previousTranscriptLineWasBlank = false;
let nextTranscriptMessageNumber = 0;
let transcriptQueue = [];

let transcriptStream = undefined;
let transcriptDocx = undefined;
let currentParagraph = undefined;

if (saveTranscript) {
  if (docxTranscript) {
    transcriptFilename += ".docx";
    transcriptDocx = officegen('docx');
    transcriptDocx.on ('error', function ( err ) {
      console.log ( err );
    });
    currentParagraph = transcriptDocx.createP();
  }
  else {
    transcriptFilename += ".txt";
    transcriptStream = fs.createWriteStream(transcriptFilename);
  }
}

// Add a line to a .docx transcript
function addToDocxTranscript(line) {
  // Collapse multiple blank lines into a single one
  if (line.trim() == "") {
    previousTranscriptLineWasBlank = true;
  }
  else {
    if (previousTranscriptLineWasBlank) {
      currentParagraph = transcriptDocx.createP();
    }
    else {
      currentParagraph.addLineBreak();
    }
    currentParagraph.addText(line);
    if (line.startsWith("*finish")) {
      transcriptDocx.putPageBreak();
    }
    previousTranscriptLineWasBlank = false;
  }
}

// Add a line to a plain text transcript
function addToTextTranscript(line) {
  // Collapse multiple blank lines into a single one
  if (line.trim() == "") {
    previousTranscriptLineWasBlank = true;
  }
  else {
    if (previousTranscriptLineWasBlank) {
      transcriptStream.write("\n");
    }
    transcriptStream.write(line+"\n");
    previousTranscriptLineWasBlank = false;
  }
}

function addToTranscript(line) {
  if (docxTranscript) {
    addToDocxTranscript(line);
  }
  else {
    addToTextTranscript(line);
  }
}


// Process the transcript queue. If force is true, process the whole queue
function processTranscriptQueue(force = false) {
  if (transcriptQueue.length != 0) {
    transcriptQueue.sort(function(a, b) {
      return a.messageNumber - b.messageNumber;
    });

    // Don't get more than 10 messages ahead of the nextTranscriptMessageNumber
    if (transcriptQueue[transcriptQueue.length - 1].messageNumber > nextTranscriptMessageNumber + 10) {
      console.log("Got 10 messages behind in the transcript. Skipping ahead.");
      nextTranscriptMessageNumber = transcriptQueue[0].messageNumber;
    }

    while (transcriptQueue.length != 0 && (force || transcriptQueue[0].messageNumber <= nextTranscriptMessageNumber)) {
      let message = transcriptQueue.shift();
      addToTranscript(message.line);
      nextTranscriptMessageNumber = message.messageNumber + 1;
    }
  }
}

// Process a transcript message
// Transcript message is in JSON format and contains "line" (the text to add to the transcript)
// and "messageNumber" (a monotonically-increasing number to let messages be re-assembled)
function processTranscriptMessage(messageString) {
  var message;
  // Parse the JSON message
  try {
    message = JSON.parse(messageString);
  }
  catch(err) {
    if (name == "Syntax Error") {
      console.log("Bad transcript JSON: "+messageString);
      return;
    }
    else {
      throw(err);
    }
  }

  if (nextTranscriptMessageNumber === undefined) {
    nextTranscriptMessageNumber = message.messageNumber;
  }

  // Since the messages may not come through in order, push the new message on the queue and process
  transcriptQueue.push(message);
  processTranscriptQueue();
}

// Receive a transcript JSON message delivered through AJAX via POST
function receiveTranscriptMessage(request, response) {
  // Aggregate the data from the request
  let msg = "";
  request.on('data', chunk => {
    msg += chunk;
  });
  request.on('end', () => {
    processTranscriptMessage(msg);
    response.statusCode = 201;
    response.end();
  });
}

const requestHandler = (request, response) => {
  const requestUrl = new URL(request.url, base);
  const requestPath = requestUrl.pathname;

  // Handle transcript broadcasts
  if (request.method === 'POST' && requestPath == '/post-transcript') {
    receiveTranscriptMessage(request, response);
    return;
  }

  let requestFile = path.normalize(`${dir}/${requestPath}`);
  if (!requestFile.startsWith(dir)) {
    response.statusCode = 400;
    response.end();
    return;
  } else if (requestFile.endsWith(path.sep)) {
    requestFile += 'index.html';
  }
  const stream = fs.createReadStream(requestFile);
  const streamError = e => {
    if (e.code === 'ENOENT') {
      response.statusCode = 404;
      response.end('File not found');
    } else if (e.code === 'EISDIR') {
      response.statusCode = 301;
      response.setHeader('Location', requestUrl.pathname + '/');
      response.end();
    } else {
      response.statusCode = 500;
      response.end('Error loading file');
      console.log(e);
    }
  };
  stream.on('error', streamError);
  const mimeType = mimeTypes[path.extname(requestFile).toLowerCase()];
  if (mimeType) {
    response.setHeader('Content-Type', mimeType);
  }
  response.setHeader('Cache-Control', 'max-age=0');
  stream.pipe(response);
}

nodeCleanup(function (exitCode, signal) {
  if (!saveTranscript) {
    return;
  }

  console.log("Finalizing queue");
  processTranscriptQueue(true);

  if (docxTranscript && transcriptDocx !== undefined) {
    let stream = fs.createWriteStream(transcriptFilename);
    // Because generating the document happens asynchronously, wait for
    // it to finish, then force kill the node process
    stream.on('close', function() {
      console.log(`Wrote transcript to ${transcriptFilename}`);
      process.kill(process.pid, signal);
    });
    stream.on('error', function() {
      console.log(err);
      process.kill(process.pid, signal);
    });
    transcriptDocx.generate(stream);  
    nodeCleanup.uninstall();
    return false;
  }
  else if (transcriptStream !== undefined) {
    transcriptStream.destroy();
  }
});

const server = http.createServer(requestHandler);

function openUrl(url) {
  switch(process.platform) {
    case "win32": {
      child_process.execFile('cmd', ['/c', 'start', '""', url.replace(/&/g, "^&")]);
      break;
    }
    case "darwin": {
      child_process.execFile('open', [url]);
      break;
    }
  }
}

server.listen({port: 0, host:'127.0.0.1'}, (err) => {
  if (saveTranscript) {
    base = `http://localhost:${server.address().port}/index-transcript.html`;
  }
  else {
    base = `http://localhost:${server.address().port}/index.html`;
  }
  console.log(`server is ready: ${base}`);
  console.log(`Press Ctrl-C or close this window to stop the server`);
  openUrl(base);
});
