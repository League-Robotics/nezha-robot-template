#!/usr/bin/env bash
# deploy.sh — build and flash to a micro:bit.
#
# Usage:
#   bash scripts/deploy.sh              # build locally, flash to /Volumes/MICROBIT
#   bash scripts/deploy.sh --cloud      # cloud build, then flash
#   bash scripts/deploy.sh --flash-only # flash an existing built/binary.hex
#   bash scripts/deploy.sh --drive /Volumes/OTHER  # flash to a specific drive
set -euo pipefail

MODE="--local"
DRIVE="${MICROBIT:-/Volumes/MICROBIT}"
DO_BUILD=1

while [[ $# -gt 0 ]]; do
    case "$1" in
        --cloud) MODE="--cloud"; shift ;;
        --local) MODE="--local"; shift ;;
        --flash-only) DO_BUILD=0; shift ;;
        --drive) DRIVE="$2"; shift 2 ;;
        *) echo "Unknown flag: $1" >&2; exit 1 ;;
    esac
done

cd "$(dirname "$0")/.."

HEX="built/binary.hex"

# Build
if [ "$DO_BUILD" -eq 1 ]; then
    bash scripts/build.sh "$MODE"
elif [ ! -f "$HEX" ]; then
    echo "ERROR: $HEX not found — run 'npm run build' first" >&2
    exit 1
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
