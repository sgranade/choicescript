/*
 * Copyright 2010 by Dan Fabulich.
 * 
 * Dan Fabulich licenses this file to you under the
 * ChoiceScript License, Version 1.0 (the "License"); you may
 * not use this file except in compliance with the License. 
 * You may obtain a copy of the License at
 * 
 *  http://www.choiceofgames.com/LICENSE-1.0.txt
 * 
 * See the License for the specific language governing
 * permissions and limitations under the License.
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied.
 */

// usage: randomtest num=10000 game=mygame seed=0 delay=false trial=false

path = require('path');

var csPath = "";
var projectPath = "";
var outFileStream;
var outFilePath;
var isRhino = false;
var iterations = 10;
var gameName = "mygame";
var randomSeed = 0;
var delay = false;
var showCoverage = true;
var isTrial = null;
var showText = false;
// logText is distinct from showText so I can track when the user *really* doesn't want to see any text
var logText = true;
var highlightGenderPronouns = false;
var showChoices = true;
var avoidUsedOptions = true;
var recordBalance = false;
var saveStats = false;
var outputFile = undefined;
var slurps = {}
function parseArgs(args) {
	for (var i = 0; i < args.length; i++) {
		var parts = args[i].split("=");
		if (parts.length !== 2) throw new Error("Couldn't parse argument " + (i + 1) + ": " + args[i]);
		var name = parts[0];
		var value = parts[1];
		if (name === "num") {
			iterations = value;
		} else if (name === "game") {
			gameName = value;
		} else if (name === "project") {
			projectPath = value;
		} else if (name === "cs") {
			csPath = value;
		} else if (name === "output") {
			outFilePath = value;
		} else if (name === "seed") {
			randomSeed = value;
		} else if (name === "delay") {
			delay = (value !== "false");
		} else if (name === "trial") {
			isTrial = (value !== "false");
		} else if (name === "showText") {
			showText = (value !== "false");
		} else if (name === "avoidUsedOptions") {
			avoidUsedOptions = (value !== "false");
		} else if (name === "showChoices") {
			showChoices = (value !== "false");
		} else if (name === "showCoverage") {
			showCoverage = (value !== "false");
		} else if (name === "recordBalance") {
			recordBalance = (value !== "false");
		} else if (name === "saveStats") {
			saveStats = (value !== "false");
		} else if (name === "outputFile") {
			outputFile = value;
		}
	}
	if (isTrial === null) {
		isTrial = !!process.env.TRIAL;
	}
	if (showText) showCoverage = false;
	if (recordBalance) {
		showText = false;
		showChoices = false;
		showCoverage = false;
		avoidUsedOptions = false;
	}
	if (outputFile) {
		var fs = require('fs');
		var output = fs.openSync(outputFile, 'w');
		console.log = function (msg) {
			countWords(msg);
			fs.writeSync(output, msg + '\n');
		}
		var oldError = console.error;
		console.error = function (msg) {
			oldError(msg);
			fs.writeSync(output, msg + '\n');
		}
	}
}
function createJSImportPaths() {
	// If csPath isn't set, assume we're using the CS repo layout and not the one for VS Code
	if (!csPath) {
		csPath = "web";
		myGameJSPath = path.join(csPath, "mygame");
		headlessJSPath = "";
		seedrandomJSPath = "";
		if (!projectPath) projectPath = path.join(myGameJSPath, "scenes");
	}
	else {
		myGameJSPath = csPath;
		headlessJSPath = csPath;
		seedrandomJSPath = csPath;
	}
}

var wordCount = 0;

function countWords(msg) {
	if (!msg.split) msg = "" + msg;
	var words = msg.split(/\s+/);
	for (var i = 0; i < words.length; i++) {
		if (words[i].trim()) wordCount++;
	}
}

if (typeof console != "undefined") {
	var oldLog = console.log;
	console.log = function (msg) {
		if (outFileStream)
			outFileStream.write(msg + '\n', 'utf8');
		else
			oldLog(msg);
		countWords(msg);
	};
}


if (typeof importScripts != "undefined") {
	console = {
		log: function (msg) {
			if (typeof msg == "string") {
				postMessage({ msg: msg.replace(/\n/g, '[n/]') });
				countWords(msg);
			} else if (msg.stack && msg.message) {
				postMessage({ msg: msg.message, stack: msg.stack });
			} else {
				postMessage({ msg: JSON.stringify(msg) });
			}
		}
	};

	if (typeof Scene === 'undefined') {
		importScripts("web/scene.js", "web/navigator.js", "web/util.js", "web/mygame/mygame.js", "seedrandom.js");
	}

	_global = this;

	slurpFile = function slurpFile(url) {
		url = "file://" + url; // CJW: necessary to force latest versions of nwjs to treat/load as file
		xhr = new XMLHttpRequest();
		xhr.open("GET", url, false);
		try {
			xhr.send();
			if (xhr.status && xhr.status != 200) {
				throw new Error("Couldn't open " + url + " with status " + xhr.status);
			}
			doneLoading();
			return xhr.responseText;
		} catch (x) {
			doneLoading();
			console.log("RANDOMTEST FAILED");
			console.log("ERROR: couldn't open " + url);
			if (typeof window != "undefined" && window.location.protocol == "file:" && /Chrome/.test(navigator.userAgent)) {
				console.log("We're sorry, Google Chrome has blocked ChoiceScript from functioning.  (\"file:\" URLs cannot " +
					"load files in Chrome.)  ChoiceScript works just fine in Chrome, but only on a published website like " +
					"choiceofgames.com.  For the time being, please try another browser like Mozilla Firefox.");
			}
			throw new Error("Couldn't open " + url);
		}
	};

	slurpFileLines = function slurpFileLines(url) {
		return slurpFile(url).split(/\r?\n/);
	};

	doneLoading = function doneLoading() { };

	changeTitle = function changeTitle() { };

	printFooter = function () { };
	printShareLinks = function () { };
	printLink = function () { };
	showPassword = function () { };

	isRegistered = function () { return false; };
	isRegisterAllowed = function () { return false; };
	isRestorePurchasesSupported = function () { return false; };
	isFullScreenAdvertisingSupported = function () { return false; };
	areSaveSlotsSupported = function () { return false; };

	initStore = function initStore() { return false; };

	nav.setStartingStatsClone(stats);
	delay = true;
	onmessage = function (event) {
		if (projectPath == "") projectPath = event.data.projectPath;
		iterations = event.data.iterations;
		randomSeed = event.data.randomSeed;
		showCoverage = event.data.showCoverage;
		showText = event.data.showText;
		showChoices = event.data.showChoices;
		highlightGenderPronouns = event.data.highlightGenderPronouns;
		avoidUsedOptions = event.data.avoidUsedOptions;
		recordBalance = event.data.recordBalance;
		if (event.data.sceneContent) {
			for (scene in event.data.sceneContent) {
				slurps[path.join(projectPath, scene)] = event.data.sceneContent[scene];
			}
		}

		if (event.data.showText) {
			var lineBuffer = [];

			printx = function printx(msg) {
				lineBuffer.push(msg);
			};
			println = function println(msg) {
				lineBuffer.push(msg);
				console.log(lineBuffer.join(""));
				lineBuffer = [];
			};
			printParagraph = function printParagraph(msg) {
				if (msg === null || msg === undefined || msg === "") return;
				println(msg);
				console.log("");
			};
		}
		randomtest();
	};
} else if (typeof java == "undefined" && typeof args == "undefined") {
	args = process.argv;
	args.shift();
	args.shift();
	if (!args.length) {
		delay = true;
		var readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
		var question = function (prompt, defaultAnswer) {
			return new Promise(function (resolve) {
				readline.question(prompt + " [" + defaultAnswer + "] ", function (answer) {
					if (answer === "") answer = defaultAnswer;
					resolve(answer)
				})
			});
		}
		var booleanQuestion = function (prompt, defaultAnswer) {
			return question(prompt + " (y/n)", defaultAnswer ? "y" : "n").then(function (answer) {
				var normalized = String(answer).toLowerCase();
				if (!/[yn]/.test(normalized)) {
					console.log('Please type "y" for yes or "n" for no.');
					return booleanQuestion(prompt, defaultAnswer);
				} else {
					return normalized === "y";
				}
			});
		}
		question("How many times would you like to run randomtest?", 10).then(function (answer) {
			iterations = answer;
			return question("Starting seed number?", 0);
		}).then(function (answer) {
			randomSeed = answer;
			return booleanQuestion("Avoid used options? It's less random, but it finds bugs faster.", true);
		}).then(function (answer) {
			avoidUsedOptions = answer;
			return booleanQuestion("Show full text?", false);
		}).then(function (answer) {
			showText = answer;
			if (showText) return true;
			return booleanQuestion("Show selected choices?", true);
		}).then(function (answer) {
			showChoices = answer;
			if (showText) return false;
			return booleanQuestion("After the test, show how many times each line was used?", false);
		}).then(function (answer) {
			showCoverage = answer;
			return booleanQuestion("Save stats to a file (randomtest-stats.csv)?", false);
		}).then(function (answer) {
			saveStats = answer;
			return booleanQuestion("Write output to a file (randomtest-output.txt)?", true);
		}).then(function (answer) {
			if (answer) {
				var fs = require('fs');
				var output = fs.openSync('randomtest-output.txt', 'w');
				console.log = function (msg) {
					countWords(msg);
					fs.writeSync(output, msg + '\n');
				}
				var oldError = console.error;
				console.error = function (msg) {
					oldError(msg);
					fs.writeSync(output, msg + '\n');
				}
			}
			readline.close();
			randomtest();
		});
	}
	parseArgs(args);
	fs = require('fs');
	path = require('path');
	vm = require('vm');
	createJSImportPaths();
	if (outFilePath) {
		if (fs.existsSync(outFilePath)) {
			throw new Error("Specified output file already exists.");
			process.exit(1);
		}
		outFileStream = fs.createWriteStream(outFilePath, { encoding: 'utf8' });
		outFileStream.write("TESTING PROJECT AT:\n\t" + projectPath + "\n\nWRITING TO LOG FILE AT:\n\t" + outFilePath + '\n\nTEST OUTPUT FOLLOWS:\n', 'utf8');
	}
	load = function (file) {
		vm.runInThisContext(fs.readFileSync(file), file);
	};
	load(path.join(csPath, "scene.js"));
	load(path.join(csPath, "navigator.js"));
	load(path.join(csPath, "util.js"));
	load(path.join(myGameJSPath, "mygame.js"));
	load(path.join(headlessJSPath, "headless.js"));
	load(path.join(seedrandomJSPath, "seedrandom.js"));
} else if (typeof args == "undefined") {
	isRhino = true;
	args = arguments;
	parseArgs(args);
	load(path.join(csPath, "scene.js"));
	load(path.join(csPath, "navigator.js"));
	load(path.join(csPath, "util.js"));
	load(path.join(csPath, "mygame.js"));
	load(path.join(csPath, "headless.js"));
	load(path.join(csPath, "seedrandom.js"));
	if (typeof console == "undefined") {
		console = {
			log: function (msg) { print(msg); }
		};
	}
}

printImage = function printImage(source, alignment, alt, invert) {
  //console.log('[IMAGE: ' + (alt || source) + ']');
}

clearScreen = function clearScreen(code) {
	timeout = code;
};

saveCookie = function (callback) {
	if (callback) timeout = callback;
};

choiceUseCounts = {};

function chooseIndex(options, choiceLine, sceneName) {
	function choiceKey(i) {
		return "o:" + options[i].ultimateOption.line + ",c:" + choiceLine + ",s:" + sceneName;
	}
	if (avoidUsedOptions) {
		var len = options.length;
		var minUses = choiceUseCounts[choiceKey(0)] || 0;
		var selectableOptions = [];
		var result = 0;
		for (var i = 0; i < len; i++) {
			var choiceUseCount = choiceUseCounts[choiceKey(i)] || 0;
			if (choiceUseCount < minUses) {
				selectableOptions = [i];
				minUses = choiceUseCount;
			} else if (choiceUseCount == minUses) {
				selectableOptions.push(i);
			}
		}
		var result = selectableOptions[Math.floor(Math.random() * (selectableOptions.length))];
		choiceUseCounts[choiceKey(result)] = minUses + 1;
		return result;
	} else {
		return Math.floor(Math.random() * (options.length));
	}
}

var printed = [];
printx = println = printParagraph = function printx(msg, parent) {
	//printed.push(msg);
}

function slurpFileCached(name) {
	if (!slurps[name]) slurps[name] = slurpFile(name);
	return slurps[name];
}

function debughelp() {
	debugger;
}

function noop() { }
Scene.prototype.page_break = function randomtest_page_break(buttonText) {
	this.paragraph();
	buttonText = this.replaceVariables(buttonText);
	println("*page_break " + buttonText);
	println("");
  this.finished = false;
	this.resetCheckedPurchases();
};

function configureShowText() {
	if (showText) {
		var lineBuffer = [];

		printx = function printx(msg) {
			if (logText) {
				lineBuffer.push(msg);
			}
		};
		println = function println(msg) {
			if (logText) {
				lineBuffer.push(msg);
			}
			if (lineBuffer.length > 0) {
				var logMsg = lineBuffer.join("");
				console.log(logMsg);
				lineBuffer = [];
			}
		};
		printParagraph = function printParagraph(msg) {
			if (msg === null || msg === undefined || msg === "") return;
			msg = String(msg)
				.replace(/\[n\/\]/g, '\n')
				.replace(/\[c\/\]/g, '');
			println(msg);
			if (logText) {
				console.log("");
			}
		};
    printImage = function printImage(source, alignment, alt, invert) {
      console.log('[IMAGE: ' + (alt || source) + ']');
    }
    achieve = function achieve(name, title, description) {
      console.log('[ACHIEVEMENT] ' + title);
      console.log('\xa0\xa0\xa0\xa0' + description + "\n");
    }
	} else {
		oldPrintLine = Scene.prototype.printLine;
		Scene.prototype.printLine = function randomtest_printLine(line) {
			if (!line) return null;
			line = this.replaceVariables(line);
		}
	}
}

Scene.prototype.subscribe = noop;
Scene.prototype.save = noop;
Scene.prototype.stat_chart = function () {
	this.parseStatChart();
}
Scene.prototype.check_purchase = function scene_checkPurchase(data) {
	var products = data.split(/ /);
	for (var i = 0; i < products.length; i++) {
		this.temps["choice_purchased_" + products[i]] = !isTrial;
	}
	this.temps.choice_purchase_supported = !!isTrial;
	this.temps.choice_purchased_everything = !isTrial;
}

Scene.prototype.randomLog = function randomLog(msg) {
	console.log(this.name + " " + msg);
}

Scene.prototype.warning = function randomWarning(msg) {
  if (!this.stats.choice_warnings) this.stats.choice_warnings = 0;
  this.stats.choice_warnings++;
  console.log("WARNING " + this.lineMsg() + msg);
}

Scene.prototype.randomtest = true;

var balanceValues = {};
function findBalancedValue(values, percentage) {
	var targetPosition = values.length * percentage / 100;
	values.sort();
	var prevValue = values[0];
	var prevPrevValue = values[0];
	for (var i = 1; i < values.length; i++) {
		if (values[i] == prevValue) continue;
		if (i >= targetPosition) {
			return (prevValue + values[i]) / 2;
		}
		prevPrevValue = prevValue;
		prevValue = values[i];
	}
	return (prevPrevValue + prevValue) / 2;
}

Scene.prototype.recordBalance = function (value, operator, rate, id) {
	if (!recordBalance) return 50;
	if (!balanceValues[this.name]) balanceValues[this.name] = {};
	if (balanceValues[this.name][id] && balanceValues[this.name][id].length > 999) {
		if (operator == ">" || operator == ">=") rate = 100 - rate;
		var statName = 'auto' + '_' + this.name + '_' + id;
		var result = findBalancedValue(balanceValues[this.name][id], rate);
		this.nav.startingStats[statName] = this.stats[statName] = result;
		return result;
	}
	if (!balanceValues[this.name][id]) balanceValues[this.name][id] = [];
	balanceValues[this.name][id].push(num(value, this.line));
  throw new Error("skip run");
}

Scene.prototype.abort = function randomtest_abort(param) {
  this.paragraph();
  this.finished = true;
  if (param === 'skip') {
    throw new Error("skip run");
  }
};

Scene.prototype.save_game = noop;

Scene.prototype.restore_game = function (data) {
	this.parseRestoreGame(false/*alreadyFinished*/);
	if (data) {
		var result = /^cancel=(\S+)$/.exec(data);
		if (!result) throw new Error(this.lineMsg() + "invalid restore_game line: " + data);
		cancel = result[1];
		this["goto"](cancel);
	}
};

Scene.prototype.advertisement = function randomtest_advertisement(durationInSeconds) {
  if (this.name === "startup") {
    throw new Error(this.lineMsg() + "*advertisement is not allowed in startup.txt");
  }
  if (/^\s*\*delay_break/.test(this.lines[this.lineNum - 1])) {
    throw new Error(this.lineMsg() + "*advertisement is not allowed immediately after *delay_break (*delay_break includes its own advertisement)");
  }
  if (durationInSeconds) this.delay_break(durationInSeconds);
}

Scene.prototype.delay_break = function randomtest_delayBreak(durationInSeconds) {
	if (isNaN(durationInSeconds * 1)) throw new Error(this.lineMsg() + "invalid duration");
}

Scene.prototype.delay_ending = function test_delayEnding(data) {
	var args = data.split(/ /);
	var durationInSeconds = args[0];
	var price = args[1];
	if (isNaN(durationInSeconds * 1)) throw new Error(this.lineMsg() + "invalid duration");
	if (!/^\$/.test(price)) throw new Error(this.lineMsg() + "invalid price");
	this.paragraph();
	this.finished = true;
}

crc32 = noop;

parsedLines = {};
Scene.prototype.oldLoadLines = Scene.prototype.loadLines;
Scene.prototype.loadLines = function cached_loadLines(str) {
	var parsed = parsedLines[str];
	if (parsed) {
		this.labels = parsed.labels;
		this.lines = parsed.lines;
		return;
	} else {
		this.oldLoadLines(str);
		parsedLines[str] = { labels: this.labels, lines: this.lines };
	}
}

cachedNonBlankLines = {};
Scene.prototype.oldNextNonBlankLine = Scene.prototype.nextNonBlankLine;

Scene.prototype.nextNonBlankLine = function cached_nextNonBlankLine(includingThisOne) {
	var key = this.name + " " + this.lineNum + "" + !!includingThisOne;
	var cached = cachedNonBlankLines[key];
	if (cached) {
		return cached;
	}
	cached = this.oldNextNonBlankLine(includingThisOne);
	cachedNonBlankLines[key] = cached;
	return cached;
}

cachedTokenizedExpressions = {};
Scene.prototype.oldTokenizeExpr = Scene.prototype.tokenizeExpr;
Scene.prototype.tokenizeExpr = function cached_tokenizeExpr(str) {
	var cached;
	if (cachedTokenizedExpressions.hasOwnProperty(str)) {
		cached = cachedTokenizedExpressions[str];
	}
	if (cached) return cloneStack(cached);
	cached = this.oldTokenizeExpr(str);
	cachedTokenizedExpressions[str] = cloneStack(cached);
	return cached;
	function cloneStack(stack) {
		var twin = new Array(stack.length);
		var i = stack.length;
		while (i--) {
			twin[i] = stack[i];
		}
		return twin;
	}
}

// TODO bring back this performance optimization; make parseOptions return all options
// Scene.prototype.oldParseOptions = Scene.prototype.parseOptions;
// parsedOptions = {};
// Scene.prototype.parseOptions = function cached_parseOptions(indent, groups, expectedSuboptions) {
//   if (expectedSuboptions) return this.oldParseOptions(indent, groups, expectedSuboptions);
//   var key = this.name + this.lineNum;
//   var parsed = parsedOptions[key];
//   if (parsed) {
//     this.lineNum = parsed.lineNum;
//     this.indent = parsed.indent;
//     return parsed.result;
//   }
//   var result = this.oldParseOptions(indent, groups, expectedSuboptions);
//   parsedOptions[key] = {lineNum:this.lineNum, indent:this.indent, result:result};
//   return result;
// }

Scene.prototype.ending = function () {
	this.paragraph();
	this.finished = true;
}

Scene.prototype.restart = Scene.prototype.ending;

Scene.prototype.input_text = function (line) {
  var parsed = this.parseInputText(line);
  var input = "blah blah";
  if (parsed.inputOptions.allow_blank) {
    if (!Math.floor(Math.random() * 4)) {
      input = "";
    }
    this.randomLog("*input_text " + (this.lineNum + 1) + " " + input);
  }
  this.set(parsed.variable + " \""+input+"\"");
}

Scene.prototype.input_number = function (data) {
	this.rand(data);
}

Scene.prototype.finish = Scene.prototype.autofinish = function random_finish(buttonText) {
	var nextSceneName = this.nav && nav.nextSceneName(this.name);
	if (isTrial && typeof purchases != "undefined" && purchases[nextSceneName]) {
		throw new Error(this.lineMsg() + "Trying to go to scene " + nextSceneName + " but that scene requires purchase");
	}
	this.finished = true;
	this.paragraph();
	// if there are no more scenes, then just halt
	if (!nextSceneName) {
		return;
	}
	var scene = new Scene(nextSceneName, this.stats, this.nav, this.debugMode);
	if (buttonText === undefined || buttonText === "") buttonText = "Next Chapter";
	buttonText = this.replaceVariables(buttonText);
	println("*finish " + buttonText);
	println("");
	scene.resetPage();
}

Scene.prototype.oldGotoScene = Scene.prototype.goto_scene;
Scene.prototype.goto_scene = function random_goto_scene(data) {
	var result = this.parseGotoScene(data);
	var name = result.sceneName;
	if (isTrial && typeof purchases != "undefined" && purchases[name]) {
		throw new Error(this.lineMsg() + "Trying to go to scene " + name + " but that scene requires purchase");
	}
	this.oldGotoScene.apply(this, arguments);
}

Scene.prototype.buyButton = function random_buyButton(product, priceGuess, label, title) {
	println('[Buy ' + title + ' Now for ' + priceGuess + ']');
	println("");
};

Scene.prototype.choice = function choice(data) {
	var groups = ["choice"];
	if (data) groups = data.split(/ /);
	var choiceLine = this.lineNum;
	var options = this.parseOptions(this.indent, groups);
	var flattenedOptions = [];
	flattenOptions(flattenedOptions, options);

	var index = chooseIndex(flattenedOptions, choiceLine, this.name);

	var item = flattenedOptions[index];
	if (!this.temps._choiceEnds) {
		this.temps._choiceEnds = {};
	}
	for (var i = 0; i < options.length; i++) {
		this.temps._choiceEnds[options[i].line - 1] = this.lineNum;
	}
	this.paragraph();
	if (showChoices) {
		if (showText) {
			if (logText) {
				this.randomLog("*choice " + (choiceLine + 1) + '#' + (index + 1) + ' (line ' + item.ultimateOption.line + ')');
				var currentOptions = options;
				for (var i = 0; i < groups.length; i++) {
					if (groups.length > 1) {
						var article = "a"
						if (/^[aeiou].*/i.test(groups[i])) article = "an";
						this.printLine("Select " + article + " " + groups[i] + ":");
						this.paragraph();
					}
					var index = item[groups[i]];
					var first = true;
					for (var j = 0; j < currentOptions.length; j++) {
						if (currentOptions[j].unselectable) continue;
						if (first) {
							first = false;
							this.printLine(" ");
						} else {
							this.printLine("[n/]");
						}
						this.printLine("\u2022 " + (j === index ? "\u2605 " : "") + currentOptions[j].name);
					}
					this.paragraph();
					currentOptions = currentOptions[0].suboptions;
				}
			}
		} else {
			var optionName = this.replaceVariables(item.ultimateOption.name);
			this.randomLog("*choice " + (choiceLine + 1) + '#' + (index + 1) + ' (line ' + item.ultimateOption.line + ') #' + optionName);
		}
	}
	var self = this;
	timeout = function () { println(""); self.standardResolution(item.ultimateOption); }
	this.finished = true;

	function flattenOptions(list, options, flattenedOption) {
		if (!flattenedOption) flattenedOption = {};
		for (var i = 0; i < options.length; i++) {
			var option = options[i];
			flattenedOption[option.group] = i;
			if (option.suboptions) {
				flattenOptions(list, option.suboptions, flattenedOption);
			} else {
				flattenedOption.ultimateOption = option;
				if (!option.unselectable) list.push(dojoClone(flattenedOption));
			}
		}
	}

	function dojoClone(/*anything*/ o) {
		// summary:
		//		Clones objects (including DOM nodes) and all children.
		//		Warning: do not clone cyclic structures.
		if (!o) { return o; }
		if (o instanceof Array || typeof o == "array") {
			var r = [];
			for (var i = 0; i < o.length; ++i) {
				r.push(dojoClone(o[i]));
			}
			return r; // Array
		}
		if (typeof o != "object" && typeof o != "function") {
			return o;	/*anything*/
		}
		if (o.nodeType && o.cloneNode) { // isNode
			return o.cloneNode(true); // Node
		}
		if (o instanceof Date) {
			return new Date(o.getTime());	// Date
		}
		// Generic objects
		r = new o.constructor(); // specific to dojo.declare()'d classes!
		for (i in o) {
			if (!(i in r) || r[i] != o[i]) {
				r[i] = dojoClone(o[i]);
			}
		}
		return r; // Object
	}

}

var saveStatVariableNames = [];
var savedStatValues = [];
Scene.prototype.comment = function comment(line) {
	var result = /^(\w*)(.*)/.exec(line);
	if (!result) {
	  return;
	}
	var command = result[1].toLowerCase();
	if (command == "text") {
		var subcommand = /^\s*(\w*)(.*)/.exec(result[2]);
		if (!subcommand) {
			return;
		}
		if (subcommand[1] == "on") {
			logText = true;
		}
		else if (subcommand[1] == "off") {
			logText = false;
		}
	}
	else if (command == "savestatsetup") {
		saveStatVariableNames = result[2].trim().split(/\s+/).map(item => item.toLowerCase());
		saveStatVariableNames.forEach(variable => this.validateVariable(variable));
	}
	else if (command == "savestats") {
		console.log("savestats");
		var currentValues = saveStatVariableNames.map(variable => {
			if ((!this.stats.hasOwnProperty(variable))) {
			throw new Error(this.lineMsg() + "Tried to collect stats on non-existent variable '" + variable + "'");
			}
			var value = this.stats[variable];
			if (value === null || value === undefined) {
			throw new Error(this.lineMsg() + "Variable '" + variable + "' exists but has no value");
			}
			return value;
		});
		savedStatValues.push({
			scene: this.name,
			line: this.lineNum + 1,
			values: currentValues
		});
	}
}  

Scene.prototype.loadScene = function loadScene() {
	var file = slurpFileCached(path.join(projectPath, this.name + '.txt'));
	this.loadLines(file);
	this.loaded = true;
	if (this.executing) {
		this.execute();
	}
}


var coverage = {};
var sceneNames = [];

Scene.prototype.rollbackLineCoverage = function (lineNum) {
	if (!lineNum) lineNum = this.lineNum;
	coverage[this.name][lineNum]--;
}

try {
	Scene.prototype.__defineGetter__("lineNum", function () { return this._lineNum; });
	Scene.prototype.__defineSetter__("lineNum", function (val) {
		var sceneCoverage;
		if (!coverage[this.name]) {
			sceneNames.push(this.name);
			coverage[this.name] = [];
		}
		sceneCoverage = coverage[this.name];

		if (sceneCoverage[val]) {
			sceneCoverage[val]++;
		} else {
			sceneCoverage[val] = 1;
		}
		this._lineNum = val;
	});
} catch (e) {
	// IE doesn't support getters/setters; no coverage for you!
}

nav.setStartingStatsClone(stats);

function checkSaveStats() {
	if (saveStats && saveStatVariableNames.length > 0) {
		var outputFile = `${gameName}-stats.csv`;
		if (projectPath) outputFile = path.join(projectPath, outputFile);
		var output = require('fs').createWriteStream(outputFile, { encoding: 'utf8' });
		output.write("scene,line," + saveStatVariableNames.join(",") + "\n", "utf8");
		savedStatValues.forEach(result => {
		  output.write(result.scene + "," + result.line + "," + result.values.join(",") + "\n", "utf8");
		})
	}
}

var processExit = false;
var start;
function randomtestAsync(i, showCoverage) {
	configureShowText();
	if (i == 0) start = new Date().getTime();
	function runTimeout(fn) {
		timeout = null;
		setTimeout(function () {
			try {
				fn();
			} catch (e) {
				return fail(e);
			}
			if (timeout) {
				runTimeout(timeout);
			} else {
				if (i < iterations) {
					randomtestAsync(i + 1, showCoverage);
				}
			}
		}, 0);
	}

	function fail(e) {
		console.log("RANDOMTEST FAILED\n");
		console.log(e);
		if (isRhino) {
			java.lang.System.exit(1);
		} else if (typeof process != "undefined" && process.exit) {
			process.exit(1);
		} else {
			processExit = true;
		}
	}

	if (i >= iterations && !processExit) {
		if (showCoverage) {
			for (i = 0; i < sceneNames.length; i++) {
				var sceneName = sceneNames[i];
				var sceneLines = slurpFileLines(path.join(projectPath, sceneName + '.txt'));
				var sceneCoverage = coverage[sceneName];
				for (var j = 0; j < sceneCoverage.length; j++) {
					console.log(sceneName + " " + (sceneCoverage[j] || 0) + ": " + sceneLines[j]);
				}
			}
		}
		console.log("RANDOMTEST PASSED");
		var end = new Date().getTime();
		var duration = (end - start) / 1000;
		console.log("Time: " + duration + "s");
		checkSaveStats();
		return;
	}

	console.log("*****Iteration "+(i+1)+" Seed " + (i + randomSeed));
	timeout = null;
	nav.resetStats(stats);
	Math.seedrandom(i + randomSeed);
	var scene = new Scene(nav.getStartupScene(), stats, nav, false);
	try {
		scene.execute();
		if (timeout) return runTimeout(timeout);
	} catch (e) {
		return fail(e);
	}

}

function randomtest() {
	configureShowText();
  var warnings = 0;
	var start = new Date().getTime();
	randomSeed *= 1;
	var percentage = iterations / 100;
	for (var i = 0; i < iterations; i++) {
		if (typeof process != "undefined")
			if (typeof process.send != "undefined")
				process.send({ type: "progress", data: i / percentage });
		console.log("*****Iteration "+(i+1)+" Seed " + (i + randomSeed));
		nav.resetStats(stats);
		timeout = null;
		Math.seedrandom(i + randomSeed);
		var scene = new Scene(nav.getStartupScene(), stats, nav, false);
		try {
			scene.execute();
			while (timeout) {
        if (stats.choice_warnings) {
          warnings += stats.choice_warnings;
          stats.choice_warnings = 0;
        }
				var fn = timeout;
				timeout = null;
				fn();
			}
			println(); // flush buffer
      if (stats.choice_warnings) {
        warnings += stats.choice_warnings;
        stats.choice_warnings = 0;
      }
		} catch (e) {
      if (e.message == "skip run") {
        println("SKIPPED RUN " + i);
				iterations++;
				continue;
			}
			console.log("RANDOMTEST FAILED: " + e);
			process.exitCode = 1;
			processExit = true;
			break;
		}
	}

	if (!processExit) {
		if (showText) console.log("Word count: " + wordCount);
		if (showCoverage) {
			for (var i = 0; i < sceneNames.length; i++) {
				var sceneName = sceneNames[i];
				var sceneLines = slurpFileLines(path.join(projectPath, sceneName + '.txt'));
				var sceneCoverage = coverage[sceneName];
				for (var j = 0; j < sceneCoverage.length; j++) {
					console.log(sceneName + " " + (sceneCoverage[j] || 0) + ": " + sceneLines[j]);
				}
			}
		}
		console.log("RANDOMTEST PASSED");
    if (warnings) console.log(warnings + " warning" + (warnings === 1 ? "": "s"));
		var duration = (new Date().getTime() - start) / 1000;
		console.log("Time: " + duration + "s");
		checkSaveStats();
		if (recordBalance) {
			(function () {
				for (var sceneName in balanceValues) {
					for (var id in balanceValues[sceneName]) {
						var values = balanceValues[sceneName][id].sort();
						var histogram = [{ value: values[0], count: 1 }];
						for (var i = 1; i < values.length; i++) {
							if (values[i] == histogram[histogram.length - 1].value) {
								histogram[histogram.length - 1].count++;
							} else {
								histogram.push({ value: values[i], count: 1 });
							}
						}
						console.log(sceneName + " " + id + " observed values (" + values.length + ")");
						for (i = 0; i < histogram.length; i++) {
							if (histogram[i].count > 1) {
								console.log("  " + histogram[i].value + " x" + histogram[i].count);
							} else {
								console.log("  " + histogram[i].value);
							}
						}
					}
				}
				for (var statName in stats) {
					if (/^auto_.+?_.+$/.test(statName)) {
						console.log("*create " + statName + " " + stats[statName]);
					}
				}
			})();
		}
	}
	if (process.disconnect) process.disconnect(); // Close IPC channel, so we can exit.
}
if (!delay) randomtest();
