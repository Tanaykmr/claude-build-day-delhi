#!/bin/sh
# shot.sh <out.png> <url> [budget_ms] [WxH]  — headless Chrome screenshot with software WebGL (default 1600x900)
#
# Arguments are unchanged. The capture itself now goes through shot-cdp.mjs (DevTools protocol, real-time wait):
# Chrome's --virtual-time-budget stops advancing while a media element is still loading, and the front-end menu
# constructs an Audio element for its theme on every page load, so the old path started returning the "Loading…"
# overlay instead of a frame. `budget_ms` becomes the timeout for that wait. If node or the CDP path fails for
# any reason, fall back to the original --screenshot invocation so a capture is still produced.
DIR=$(dirname "$0")
if command -v node >/dev/null 2>&1 && [ -f "$DIR/shot-cdp.mjs" ]; then
  node "$DIR/shot-cdp.mjs" "$1" "$2" "${3:-20000}" "${4:-1600,900}" && exit 0
  echo "shot.sh: CDP capture failed, falling back to --virtual-time-budget" >&2
fi
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --window-size="${4:-1600,900}" --virtual-time-budget="${3:-20000}" --screenshot="$1" "$2" 2>&1 | grep -E 'written'
