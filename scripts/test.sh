#!/usr/bin/env bash
# test.sh — run one of the test programs in test/ over the radio.
#
#   bash scripts/test.sh square            # RUN:square        (50 cm)
#   bash scripts/test.sh square 75         # RUN:square:75
#   bash scripts/test.sh square 50 2       # RUN:square:50:2   (two laps)
#   bash scripts/test.sh line 25 30 120    # RUN:line:25:30:120
#   bash scripts/test.sh sense             # trackbit read-out, no motion
#   bash scripts/test.sh abort             # stop whatever is running
#   bash scripts/test.sh --list
#
# Every verb here is registered by a file in test/ and they all live in one
# hex, so the robot only needs flashing once (npm run deploy) to answer all
# of them. The same tests are on the robot's own button menu -- A scrolls the
# icons, B runs and stops -- so a run needs no host at all; this script is for
# when you want the arguments and the output.
#
# The obstacle course is NOT in this list: it is driven leg by leg from the
# host by scripts/obstacle1.sh, which sends this hex's push/turn/speed
# primitives itself.
#
#   WAIT=90 bash scripts/test.sh square 200    # longer runs need longer
#   ROBOT=vevov bash scripts/test.sh square    # a different robot
set -uo pipefail
export PATH="$HOME/.local/bin:$PATH"
ROBOT="${ROBOT:-tigez}"
cd "$(dirname "$0")/.."

usage() {
    sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'
    exit "${1:-0}"
}

case "${1:-}" in
    ""|-h|--help|--list) usage 0 ;;
esac

VERB="$1"; shift
CMD="RUN:$VERB"
for arg in "$@"; do CMD="$CMD:$arg"; done

# How long to hold the connection open after sending. The robot streams its
# progress lines for the whole run, and mbdeploy stops listening when stdin
# closes -- so this has to outlast the test, not the command that starts it.
# A 50 cm square is about 15 s at the 20 cm/s default; abort is instant.
case "$VERB" in
    abort|speed) DEFAULT_WAIT=3 ;;
    sense)       DEFAULT_WAIT=6 ;;
    *)           DEFAULT_WAIT=60 ;;
esac
WAIT="${WAIT:-$DEFAULT_WAIT}"

echo "=== $CMD -> $ROBOT (listening ${WAIT}s) ==="
{ printf "%s\n" "$CMD"; sleep "$WAIT"; } | mbdeploy connect --remote "$ROBOT" 2>&1
