#!/usr/bin/env bash
# patch-extension.sh — apply local hot-fixes to fetched extension sources.
#
# pxt_modules/ is a DEPENDENCY CACHE: `pxt install` refetches it from GitHub and
# throws away anything edited in place. So the fixes live here as patches and
# get re-applied on every build. Idempotent — safe to run any number of times.
#
# Remove a patch from PATCHES below once the fix ships upstream and pxt.json
# points at a release that contains it.
#
# Usage:
#   bash scripts/patch-extension.sh          # apply (default)
#   bash scripts/patch-extension.sh --check  # report status, change nothing
set -uo pipefail

cd "$(dirname "$0")/.."

EXT_DIR="pxt_modules/nezha-diffdrive"
PATCH_DIR="patches"

# patch file | extension version it was cut against (ADVISORY) | sentinel proving it applied
#
# The version field is advisory ONLY. The extension's own pxt.json version is
# not reliably bumped per release -- tag v0.20260902.1 still reports
# "1.20260829.1" internally -- so equality there proves nothing and inequality
# is not grounds to refuse. What actually protects us is `patch --fuzz=0`
# below: patch matches its context exactly and refuses anything else, which is
# a real check on the source rather than on a version string someone forgot to
# bump.
# NOTE: the version column is what pxt_modules REPORTS, which is not the tag.
# Tag v0.20260902.1 still reports "1.20260829.1" internally (upstream forgot the
# bump), so this column cannot identify a release. See above.
PATCHES=(
    "nezha-diffdrive-runtext-use-after-release.patch|1.20260829.1|runTextScratch_"
)

# RETIRED: nezha-diffdrive-single-producer-serial.patch
#   Fixed the "two fibers writing serial wedge the UARTE in both directions"
#   bug (see clasi/issues/concurrent-serial-writers-wedge-the-uarte-in-both-
#   directions.md in the extension repo). NOT needed on v0.20260902.1 and
#   later: verified on tigez 2026-09-02 with the emit patch absent -- 8 RUN
#   commands including motion, 17 reply lines, 0 reboots, port alive at the
#   end. The file is kept in patches/ because it documents the defect and
#   still applies cleanly, but it is deliberately NOT in PATCHES above.
#   Re-add it only if the wedge reappears.

CHECK_ONLY=0
[ "${1:-}" = "--check" ] && CHECK_ONLY=1

if [ ! -d "$EXT_DIR" ]; then
    echo "patch-extension: $EXT_DIR not present — run 'npm run setup' first." >&2
    exit 0
fi

ext_version() {
    node -e 'try{process.stdout.write(require("./'"$EXT_DIR"'/pxt.json").version||"")}catch(e){}' 2>/dev/null
}

VERSION="$(ext_version)"
rc=0

for entry in "${PATCHES[@]}"; do
    IFS='|' read -r patch_file cut_against sentinel <<< "$entry"
    patch_path="$PATCH_DIR/$patch_file"

    if [ ! -f "$patch_path" ]; then
        echo "patch-extension: MISSING $patch_path" >&2
        rc=1
        continue
    fi

    # Already applied? The sentinel is a symbol the patch introduces.
    if grep -rq "$sentinel" "$EXT_DIR/src" 2>/dev/null; then
        [ "$CHECK_ONLY" -eq 1 ] && echo "  applied     $patch_file"
        continue
    fi

    if [ "$CHECK_ONLY" -eq 1 ]; then
        echo "  NOT applied $patch_file"
        rc=1
        continue
    fi

    # Advisory only -- see the PATCHES comment above for why this cannot be
    # a hard gate.
    if [ -n "$VERSION" ] && [ "$VERSION" != "$cut_against" ]; then
        echo "patch-extension: note — $patch_file was cut against $cut_against," \
             "pxt_modules reports $VERSION. Relying on patch context matching." >&2
    fi

    # --fuzz=0: match context exactly. The default fuzz factor lets patch slide
    # a hunk onto approximately-matching lines, which in C++ is how you get a
    # build that compiles and is subtly wrong. Refuse instead.
    if patch -p1 --forward --fuzz=0 --silent -d "$EXT_DIR" < "$patch_path"; then
        echo "patch-extension: applied $patch_file to $EXT_DIR ($VERSION)"
    else
        echo "" >&2
        echo "patch-extension: FAILED to apply $patch_file (context did not match)." >&2
        echo "  The extension sources have changed. Either the fix has landed" >&2
        echo "  upstream — in which case delete this entry from PATCHES — or the" >&2
        echo "  patch needs re-cutting against $VERSION." >&2
        echo "  Building with UNPATCHED sources: RUN: commands may wedge the serial port." >&2
        echo "" >&2
        rc=1
    fi
done

exit $rc
