#!/bin/sh
# capture.sh [prefix] [size]  — repeatable baseline views via shot.sh and the existing URL hooks.
# Example: ./capture.sh base 1600,900 ; ./capture.sh base-proj 1024,768
P="${1:-cap}"; S="${2:-1600,900}"; U="http://localhost:8000"
mkdir -p .shots
./shot.sh ".shots/$P-spawn.png"      "$U/?debug=1&preroll=1" 20000 "$S"
./shot.sh ".shots/$P-straight.png"   "$U/?debug=1&script=W:3&preroll=3" 20000 "$S"
./shot.sh ".shots/$P-underdesk.png"  "$U/?debug=1&spawn=0.12,0.07,-0.5,3.1416&script=W:1.4&preroll=1.4" 20000 "$S"
./shot.sh ".shots/$P-rampfoot.png"   "$U/?debug=1&spawn=-7.28,0.07,-1.9,1.5708&script=W:1&preroll=1" 20000 "$S"
./shot.sh ".shots/$P-crest.png"      "$U/?debug=1&spawn=-7.28,0.07,-1.9,1.5708&script=W:4.2,_:2&preroll=5" 20000 "$S"
./shot.sh ".shots/$P-desklane.png"   "$U/?debug=1&spawn=-3.4,0.78,-1.9,1.5708&script=W:2.6&preroll=2.6" 20000 "$S"
./shot.sh ".shots/$P-descent.png"    "$U/?debug=1&spawn=-3.2,0.78,-1.9,-1.5708&script=W:1.6&preroll=1.6" 20000 "$S"
./shot.sh ".shots/$P-cups.png"       "$U/?debug=1&spawn=-6.4,0.07,0.5,0&script=W:1.6&preroll=1.6" 20000 "$S"
./shot.sh ".shots/$P-fallback.png"   "$U/?fallback=1&debug=1&preroll=1" 20000 "$S"
ls -la .shots | grep " $P-"
