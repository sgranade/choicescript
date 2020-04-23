"use strict";

const fs = require('fs');
const {exec} = require('pkg');
const nodeCleanup = require('node-cleanup');

const settingsFilename = './serve.json';

let settings = {
    "transcript": false,
    "docx": false
}

var argv = require('minimist')(process.argv.slice(2));
if (argv.help || argv.h) {
  console.log("Usage: serve-compile [options]\n\nOptions:\n\t--transcript\tSave a transcript of the session\n\t--docx\t\tCreate an MS Word .docx transcript instead of a plain-text transcript");
  process.exit(0);
}
if (argv.transcript) {
  settings.transcript = true;
}
if (argv.docx) {
  settings.docx = true;
}

// Save our settings file
let settingsJson = JSON.stringify(settings);
fs.writeFileSync(settingsFilename, settingsJson);

nodeCleanup(function (exitCode, signal) {
    try {
        fs.unlinkSync(settingsFilename);
    }
    catch (err) {
        // do nothing
    }
});

// Compile
let execArgs = '--targets host --output mygame .'.split(' ');
(async function() {
    await exec(execArgs);
}());
