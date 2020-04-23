# Creating Transcripts

This fork of ChoiceScript allows you to create local transcripts as you play for later reading and reviewing. It's like the full output option of `randomtest`, only it's created when you or a beta reader plays your game.

To create transcripts, you play your game using Node's server, either by running the appropriate script (`run-server.bat` on Windows; `serve.command` on Linux) or by invoking the server directly (`node serve`). As you play the game, the server will write everything that is shown and every choice you make to a file. By default, the server creates plain-text transcripts that you can open in any editor, but it can also create MS Word files for more a more pleasant reading and commenting experience.

The transcripts' names reflect the time when you started playing the game. Their file names follow the format `transcript-YYYY-MM-DDTHH-mm-ss.txt`. For instance, if you start playing the game eight seconds after 3:41 PM on September 29th, 2020, then the filename will be `transcript-2020-09-29T15-41-08.txt`.

ChoiceScript requires Node.js to run. To send your game to beta readers who don't have Node.js installed, you can compile your game to a single executable. That way your beta readers won't need to install Node.js themselves. The compiled game can automatically create transcripts.

## Setup

- Install [Node.js](https://nodejs.org/en/)
- In the root `choicescript` folder, in a command prompt, run `npm install` to install all required Node.js packages
    - You should get one warning about how the license should be a valid SPDX license expression, which you can ignore

## Creating Transcripts

### Windows

- In the root `choicescript` folder, in a command prompt, run `run-server.bat /t`
- To create MS Word documents instead of plain text transcripts, run `run-server.bat /t /d`

### Unix

- In the root `choicescript` folder, in a terminal window, run `serve.command -t`
- To create MS Word documents instead of plain text transcripts, run `serve.command -t -d`

### Node

- In the root `choicescript` folder, in a command prompt, run `node serve --transcript` 
- To create MS Word documents instead of plain text transcripts, run `node serve --transcript --docx`

## Compiling Your Game

You can compile your game to an executable named `mygame` by running the following commands in a command prompt:

- `npm run-script compile`: A regular version of your game.
- `npm run-script compile-transcript`: A version that automatically saves plain-text transcripts.
- `npm run-script compile-transcript-docx`: A version that automatically saves MS Word transcripts.
