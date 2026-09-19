#!/bin/sh
# shot.sh <out.png> <url> [budget_ms] [WxH]  — headless Chrome screenshot with software WebGL (default 1600x900)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --window-size="${4:-1600,900}" --virtual-time-budget="${3:-20000}" --screenshot="$1" "$2" 2>&1 | grep -E 'written'
