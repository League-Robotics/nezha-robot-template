#!/usr/bin/env bash
# deploy.sh — build and flash to a micro:bit.
#
# Usage:
#   bash scripts/deploy.sh              # build locally, flash to /Volumes/MICROBIT
#   bash scripts/deploy.sh --cloud      # cloud build, then flash
#   bash scripts/deploy.sh --flash-only # flash an existing built/binary.hex
#   bash scripts/deploy.sh --drive /Volumes/OTHER  # flash to a specific drive
#   bash scripts/deploy.sh --robot tigez # build FOR tigez, then flash
#
# --robot is passed through to scripts/build.sh, which bakes the name into the
# extension's kProfile at COMPILE time -- so it selects what gets built, not
# where it gets flashed. With --flash-only it selects nothing and is used only
# to check the hex on disk was built for the robot you named.
set -euo pipefail

MODE="--local"
DRIVE="${MICROBIT:-/Volumes/MICROBIT}"
DO_BUILD=1
ROBOT=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --cloud) MODE="--cloud"; shift ;;
        --local) MODE="--local"; shift ;;
        --flash-only) DO_BUILD=0; shift ;;
        --drive) DRIVE="$2"; shift 2 ;;
        --robot) ROBOT="${2:-}"; [ -n "$ROBOT" ] || { echo "--robot needs a board name" >&2; exit 1; }; shift 2 ;;
        *) echo "Unknown flag: $1" >&2; exit 1 ;;
    esac
done

cd "$(dirname "$0")/.."

HEX="built/binary.hex"

# Build
if [ "$DO_BUILD" -eq 1 ]; then
    if [ -n "$ROBOT" ]; then
        bash scripts/build.sh "$MODE" --robot "$ROBOT"
    else
        bash scripts/build.sh "$MODE"
    fi
elif [ ! -f "$HEX" ]; then
    echo "ERROR: $HEX not found — run 'npm run build' first" >&2
    exit 1
else
    # --flash-only: nothing is compiled, so the profile in this hex is whatever
    # the last build baked. That is the one case where the name on the wire can
    # silently disagree with the board in your hand -- flashing tigez's build
    # onto gopiv leaves a robot confidently answering ID with the wrong robot,
    # which is harder to debug than the "unbaked" it used to say. Refuse.
    BAKED=$(cat built/.baked-profile 2>/dev/null || echo "unknown")
    if [ -n "$ROBOT" ] && [ "$BAKED" != "$ROBOT" ]; then
        echo "ERROR: $HEX was built for profile '$BAKED', not '$ROBOT'." >&2
        echo "  Rebuild for this robot:  bash scripts/deploy.sh --robot $ROBOT" >&2
        exit 1
    fi
    echo "Flashing a hex built for profile: $BAKED"
fi

# Flash
if [ ! -d "$DRIVE" ]; then
    echo "ERROR: $DRIVE is not mounted. Plug in your micro:bit." >&2
    exit 1
fi

# macOS: -X drops extended attributes, which the micro:bit's FAT volume rejects.
# Plain string, not an array — see the note in code.sh: bash 3.2 (macOS) errors
# on expanding an empty array under `set -u`.
CP_FLAGS=""
if [ "$(uname)" = "Darwin" ]; then
    CP_FLAGS="-X"
fi

# shellcheck disable=SC2086
cp $CP_FLAGS "$HEX" "$DRIVE/"
echo ""
echo "✓ Flashed $(basename "$HEX") → $DRIVE"
echo "  The micro:bit LED should flash while copying, then reboot."
