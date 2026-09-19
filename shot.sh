#!/bin/sh
# shot.sh <out.png> <url> [budget_ms]  — headless Chrome screenshot with software WebGL
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --window-size=1600,900 --virtual-time-budget="${3:-20000}" --screenshot="$1" "$2" 2>&1 | grep -E 'written'
