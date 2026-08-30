#!/usr/bin/env bash
# build.sh — compile the project locally or via cloud.
#
# Usage:
#   bash scripts/build.sh              # local build (needs Docker + yotta-compiler)
#   bash scripts/build.sh --cloud      # cloud build (no Docker, uses MakeCode service)
#   bash scripts/build.sh --local      # local build (explicit)
set -euo pipefail

MODE="${1:---local}"
FLAGS="PXT_COMPILE_SWITCHES=csv---mbcodal"

cd "$(dirname "$0")/.."

case "$MODE" in
    --cloud)
        echo "=== Cloud build (MakeCode compile service) ==="
        env $FLAGS npx pxt build --cloudbuild
        ;;
    --local|"")
        echo "=== Local build (yotta-compiler Docker image) ==="
        # Pull the image if not cached
        if ! docker image inspect ghcr.io/league-microbit/yotta-compiler:latest &>/dev/null; then
            echo "Pulling yotta-compiler image …"
            docker pull ghcr.io/league-microbit/yotta-compiler:latest
        fi
        env PXT_FORCE_LOCAL=1 $FLAGS npx pxt build
        ;;
    *)
        echo "Usage: bash scripts/build.sh [--local | --cloud]" >&2
        exit 1
        ;;
esac

HEX="built/binary.hex"
if [ -f "$HEX" ]; then
    echo ""
    echo "✓ Build complete: $(ls -lh "$HEX" | awk '{print $5}')  $(realpath "$HEX")"
else
    echo "✗ Build produced no hex file." >&2
    exit 1
fi