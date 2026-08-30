#!/usr/bin/env bash
# deploy.sh — build and flash to a micro:bit.
#
# Usage:
#   bash scripts/deploy.sh              # build locally, flash to /Volumes/MICROBIT
#   bash scripts/deploy.sh --cloud      # cloud build, then flash
#   bash scripts/deploy.sh --drive /Volumes/OTHER  # flash to a specific drive
set -euo pipefail

MODE="--local"
DRIVE="/Volumes/MICROBIT"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --cloud) MODE="--cloud"; shift ;;
        --drive) DRIVE="$2"; shift 2 ;;
        *) echo "Unknown flag: $1" >&2; exit 1 ;;
    esac
done

cd "$(dirname "$0")/.."

# Build
bash scripts/build.sh "$MODE"

# Flash
HEX="built/binary.hex"
if [ ! -d "$DRIVE" ]; then
    echo "ERROR: $DRIVE is not mounted. Plug in your micro:bit." >&2
    exit 1
fi

cp "$HEX" "$DRIVE/"
echo ""
echo "✓ Flashed $(basename "$HEX") → $DRIVE"
echo "  The micro:bit LED should flash while copying, then reboot."