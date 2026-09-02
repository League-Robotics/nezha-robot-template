#!/usr/bin/env bash
# update.sh — pin nezha-diffdrive to the latest GitHub release, reinstall, rebuild.
#
# Usage:
#   bash scripts/update.sh                # latest tag, then local build
#   bash scripts/update.sh --tag v1.2.3   # pin a specific tag
#   bash scripts/update.sh --no-build     # pin and install only
#   bash scripts/update.sh --dry-run      # show which tag would be picked
set -euo pipefail

# The extension moved: it used to live at League-Microbit/pxt-diff-drive, which
# is now stale (its newest tag is v1.20260829.1). Current home:
REPO="League-Robotics/pxt-nezha-diffdrive"
DEP="nezha-diffdrive"
TAG=""
DO_BUILD=1
DRY_RUN=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --tag) TAG="$2"; shift 2 ;;
        --no-build) DO_BUILD=0; shift ;;
        --dry-run) DRY_RUN=1; shift ;;
        *) echo "Unknown flag: $1" >&2; exit 1 ;;
    esac
done

cd "$(dirname "$0")/.."

# Pick the newest tag by the DATE IN THE TAG NAME, not by version sort.
#
# Releases are named v<major>.<YYYYMMDD>.<seq>, and the major has gone
# BACKWARDS over time (the 1.x series predates the current 0.x series), so
# `sort -V | tail -1` picks the wrong one -- it answered v1.20260829.1 while
# v0.20260902.1 was current, and on this repo it would pick the stray v1.0.0.
# Sorting on (YYYYMMDD, seq) and ignoring the major is what actually tracks
# "newest". Tags that do not carry a date (v1.0.0, v1.0.11) are skipped.
if [ -z "$TAG" ]; then
    TAG=$(git ls-remote --tags --refs "https://github.com/$REPO.git" \
        | sed 's|.*refs/tags/||' \
        | grep -E '^v[0-9]+\.20[0-9]{6}\.[0-9]+$' \
        | awk -F. '{ gsub(/^v/,"",$1); printf "%s %s %s\n", $2, $3, "v"$1"."$2"."$3 }' \
        | sort -k1,1n -k2,2n \
        | tail -1 | awk '{print $3}')
fi
[ -n "$TAG" ] || { echo "ERROR: no dated release tags found on $REPO" >&2; exit 1; }

if [ "$DRY_RUN" -eq 1 ]; then
    echo "Would pin $DEP to $TAG  (repo: $REPO)"
    echo "Currently pinned: $(node -e 'process.stdout.write(require("./pxt.json").dependencies["'"$DEP"'"]||"?")')"
    exit 0
fi

echo "Pinning $DEP to $TAG"
node -e '
const fs = require("fs");
const [repo, dep, tag] = process.argv.slice(1);
const p = JSON.parse(fs.readFileSync("pxt.json", "utf8"));
p.dependencies[dep] = `github:${repo}#${tag}`;
fs.writeFileSync("pxt.json", JSON.stringify(p, null, 4) + "\n");
' "$REPO" "$DEP" "$TAG"

rm -rf "pxt_modules/$DEP"
npx pxt install

node -e 'console.log("Installed '"$DEP"' " + require("./pxt_modules/'"$DEP"'/pxt.json").version)'

if [ "$DO_BUILD" -eq 1 ]; then
    bash scripts/build.sh
fi
