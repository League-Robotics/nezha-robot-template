#!/usr/bin/env bash
# update.sh — pin nezha-diffdrive to the latest GitHub release, reinstall, rebuild.
#
# Usage:
#   bash scripts/update.sh                # latest tag, then local build
#   bash scripts/update.sh --tag v1.2.3   # pin a specific tag
#   bash scripts/update.sh --no-build     # pin and install only
set -euo pipefail

REPO="League-Microbit/pxt-diff-drive"
DEP="nezha-diffdrive"
TAG=""
DO_BUILD=1

while [[ $# -gt 0 ]]; do
    case "$1" in
        --tag) TAG="$2"; shift 2 ;;
        --no-build) DO_BUILD=0; shift ;;
        *) echo "Unknown flag: $1" >&2; exit 1 ;;
    esac
done

cd "$(dirname "$0")/.."

if [ -z "$TAG" ]; then
    TAG=$(git ls-remote --tags --refs "https://github.com/$REPO.git" \
        | sed 's|.*refs/tags/||' | sort -V | tail -1)
fi
[ -n "$TAG" ] || { echo "ERROR: could not fetch tags from $REPO" >&2; exit 1; }

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
