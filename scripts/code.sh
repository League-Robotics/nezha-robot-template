#!/usr/bin/env bash
# code.sh — start the local MakeCode editor.
#
# Opens a browser window pointed at a local MakeCode server that
# reads this project's files from disk. Edits save directly back.
#
# Usage:
#   bash scripts/code.sh                # serve on default port (3232)
#   bash scripts/code.sh --port 8080    # serve on a specific port
#   bash scripts/code.sh --no-browser   # serve without launching a browser
set -euo pipefail

PORT="${PORT:-3232}"
OPEN_BROWSER=1

while [[ $# -gt 0 ]]; do
    case "$1" in
        --port) PORT="$2"; shift 2 ;;
        --no-browser|--noBrowser) OPEN_BROWSER=0; shift ;;
        *) shift ;;
    esac
done

cd "$(dirname "$0")/.."

# The editor's local workspace is <cwd>/projects/<name> — PXT creates that
# directory but never puts this project in it, so the editor would otherwise
# open an empty "My Projects" list instead of the program in this repo.
# Link projects/<repo-name> back to the repo root: the editor then loads this
# project's pxt.json (extensions included), main.ts and main.blocks straight
# from disk, and edits save back to the same files.
PROJECT_NAME="$(basename "$(pwd)")"
mkdir -p projects
if [ ! -L "projects/$PROJECT_NAME" ]; then
    ln -sfn .. "projects/$PROJECT_NAME"
    echo "Linked projects/$PROJECT_NAME -> this repo"
fi

echo "=== MakeCode Local Editor ==="
echo "    http://localhost:$PORT"
echo "    Project files are read from: $(pwd)"
echo "    Press Ctrl+C to stop."
echo ""

# NOTE: pxt's --browser flag takes a value (chrome|ie|firefox|safari).
# Omitting it launches the system default browser.
#
# Plain string rather than an array: macOS ships bash 3.2, where expanding an
# empty array under `set -u` fails with "unbound variable". Unquoted below so
# an empty value disappears instead of becoming an empty argument — safe here
# because the value is a fixed literal with no spaces or globs.
BROWSER_FLAG=""
if [ "$OPEN_BROWSER" -eq 0 ]; then
    BROWSER_FLAG="--no-browser"
fi

# --just: serve WITHOUT rebuilding the editor target.
#
# Without it, `pxt serve` tries to build pxt-microbit from source and dies with
#   Build failed: target build failed: ENOENT: ... scandir 'libs'
# because a target build wants a checkout of pxt-microbit (which has libs/,
# sim/, etc.), not a project like this one. The server then starts anyway with
# no editor webapp, and the browser hangs forever on the MakeCode splash.
# The prebuilt webapp already ships in node_modules, so there is nothing to build.
#
# --wsport is derived from --port so a second editor on another port does not
# collide with the default websocket port (3233) of the first.
# shellcheck disable=SC2086
npx pxt serve \
    --just \
    --localbuild \
    --noSerial \
    --hostname 0.0.0.0 \
    --port "$PORT" \
    --wsport "$((PORT + 1))" \
    $BROWSER_FLAG
