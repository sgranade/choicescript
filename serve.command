#!/bin/sh

cd -- "$(dirname "$0")"
printf "\033c" # clear screen
command -v node >/dev/null 2>&1 || { echo >&2 "ERROR: serve.command requires Node.js, but it's not installed."; exit 1; }

args=
while getopts "td" options; do
	case "${options}" in
		t) args=$args --transcript
		d) args=$args --docx
done

node serve $args
