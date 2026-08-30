#!/usr/bin/env bash
# code.sh — start the local MakeCode editor.
#
# Opens a browser window pointed at a local MakeCode server that
# reads this project's files from disk. Edits save directly back.
#
# Usage:
#   bash scripts/code.sh                # serve on default port (3232)
#   bash scripts/code.sh --port 8080    # serve on a specific port
set -euo pipefail

PORT="${PORT:-3232}"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --port) PORT="$2"; shift 2 ;;
        *) shift ;;
    esac
done

cd "$(dirname "$0")/.."

echo "=== MakeCode Local Editor ==="
echo "    http://localhost:$PORT"
echo "    Project files are read from: $(pwd)"
echo "    Press Ctrl+C to stop."
echo ""

npx pxt serve \
    --localbuild \
    --browser \
    --noSerial \
    --hostname 0.0.0.0 \
    --port "$PORT"