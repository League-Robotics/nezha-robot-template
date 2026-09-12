#!/usr/bin/env bash
# build.sh — compile the project locally or via cloud.
#
# Usage:
#   bash scripts/build.sh                  # local build (needs Docker + yotta-compiler)
#   bash scripts/build.sh --cloud          # cloud build (no Docker, uses MakeCode service)
#   bash scripts/build.sh --local          # local build (explicit)
#   bash scripts/build.sh --refresh-image  # re-pull the compiler image before building
#   bash scripts/build.sh --robot tigez    # bake that robot's name into kProfile
#   bash scripts/build.sh --profile calibration-0.20260907.1
#
# kProfile is a compile-time constant in the extension, so what a hex IS gets
# decided HERE, not at flash time -- see scripts/bake-profile.sh.
#   --robot NAME     a bench build aimed at one robot (validated against the
#                    fleet registry)
#   --profile STR    a build identity that is not a robot: the calibration
#                    image published by .github/workflows/release.yml
# With neither, the profile is reset to the "unbaked" placeholder and the hex
# is generic -- which is what a student building their own program gets.
set -euo pipefail

MODE="--local"
REFRESH=0
ROBOT=""
PROFILE=""
FLAGS="PXT_COMPILE_SWITCHES=csv---mbcodal"
IMAGE="ghcr.io/league-microbit/yotta-compiler:latest"
# PXT's codal build engine runs `docker run ... pext/yotta:latest`, so whatever
# image we use has to be tagged under that name for PXT to find it.
PXT_IMAGE="pext/yotta:latest"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --cloud) MODE="--cloud"; shift ;;
        --local) MODE="--local"; shift ;;
        --refresh-image) REFRESH=1; shift ;;
        --robot) ROBOT="${2:-}"; [ -n "$ROBOT" ] || { echo "--robot needs a board name" >&2; exit 1; }; shift 2 ;;
        --profile) PROFILE="${2:-}"; [ -n "$PROFILE" ] || { echo "--profile needs a value" >&2; exit 1; }; shift 2 ;;
        *) echo "Usage: bash scripts/build.sh [--local | --cloud] [--refresh-image] [--robot NAME | --profile STR]" >&2; exit 1 ;;
    esac
done

cd "$(dirname "$0")/.."

# test/secrets.ts holds the WiFi credentials and is gitignored, but pxt.json
# lists it -- a missing file there fails the build outright. Seed it from the
# tracked template so a fresh clone builds, with an empty password.
if [ ! -f test/secrets.ts ]; then
    cp test/secrets.example.ts test/secrets.ts
    echo "Created test/secrets.ts from the template — set WIFI_PASSWORD in it."
fi

# Stamp the target robot into the extension's kProfile before compiling.
#
# Runs on EVERY build, including the no---robot case, and that is the point:
# pxt_modules/ is a dependency cache, so whatever was baked by the last build
# is still sitting there. Skipping the reset would silently inherit the
# previous robot's name -- a hex that lies with authority, which is strictly
# worse than one that admits it is unbaked.
#
# A failure here IS fatal, unlike the old patch-extension.sh hook. A patch that
# fails to apply leaves working code; a bake that fails leaves the hex claiming
# the wrong robot, and the whole reason this exists is that a wrong profile is
# indistinguishable from a right one once flashed.
if [ -n "$ROBOT" ] && [ -n "$PROFILE" ]; then
    echo "build: --robot and --profile are mutually exclusive." >&2
    exit 1
elif [ -n "$ROBOT" ]; then
    bash scripts/bake-profile.sh --robot "$ROBOT"
elif [ -n "$PROFILE" ]; then
    bash scripts/bake-profile.sh --profile "$PROFILE"
else
    bash scripts/bake-profile.sh --none
fi

# The WiFi password used to be patched out of the DBG:wifi line here, by
# scripts/redact-wifi-trace.sh, because the extension reported the join command
# -- passphrase and all -- verbatim. The extension now redacts at the source:
# WifiLink::startCommand() takes a trace override and the AT+CWJAP= site passes
# `AT+CWJAP="<ssid>",***`, so lastCommand() never holds the secret in the first
# place (pxt-nezha-diffdrive v1.20260910.1). The patch script is gone: it had
# nothing left to match, and a build-time patch that silently stops matching is
# worse than no patch at all -- which is exactly how it failed, loudly, on the
# first build after the pin moved.
#
# If you pin an OLDER extension than v1.20260910.1, the leak is back and this
# guard is not here to catch it. Check DBG:wifi's cmd= field on a real join.

# Read the baked value back out of the source rather than reusing the flag. The
# registry canonicalises case (`--robot TIGEZ` bakes `tigez`), so the argument
# is not necessarily what is now in the file -- and this is what actually gets
# compiled, so reading it is also a check that the substitution landed.
BAKED=$(sed -n 's/^constexpr const char\* kProfile = "\(.*\)";.*$/\1/p' \
    pxt_modules/nezha-diffdrive/src/comms/protocol.cpp)
[ -n "$BAKED" ] || { echo "build: could not read back the baked kProfile" >&2; exit 1; }

HOST_ARCH=$(docker info --format '{{.Architecture}}' 2>/dev/null || uname -m)
case "$HOST_ARCH" in
    aarch64|arm64) HOST_ARCH=arm64 ;;
    x86_64|amd64)  HOST_ARCH=amd64 ;;
esac

# Architecture of a local image, or empty if it isn't present.
image_arch() { docker image inspect "$1" --format '{{.Architecture}}' 2>/dev/null; }

# Make $PXT_IMAGE point at a usable local yotta-compiler image.
ensure_image() {
    local pxt_arch upstream_arch
    pxt_arch=$(image_arch "$PXT_IMAGE")

    # A local $PXT_IMAGE matching this host always wins: it is the exact image
    # PXT will run, and retagging over it with a foreign-arch image breaks builds.
    # Use --refresh-image to force a re-pull.
    if [ "$REFRESH" -eq 0 ] && [ "$pxt_arch" = "$HOST_ARCH" ]; then
        echo "Using local $PXT_IMAGE ($pxt_arch)"
        return
    fi

    upstream_arch=$(image_arch "$IMAGE")
    if [ -z "$upstream_arch" ]; then
        echo "Pulling yotta-compiler image …"
        docker pull "$IMAGE" && upstream_arch=$(image_arch "$IMAGE") || true
    fi

    # Only retag if the upstream image can actually run here — tagging an
    # amd64 image over a working arm64 $PXT_IMAGE would silently break builds.
    if [ -n "$upstream_arch" ]; then
        if [ "$upstream_arch" = "$HOST_ARCH" ]; then
            docker tag "$IMAGE" "$PXT_IMAGE"
            echo "Using $IMAGE ($upstream_arch), tagged $PXT_IMAGE"
            return
        fi
        echo "WARNING: $IMAGE is $upstream_arch but this host is $HOST_ARCH — not retagging $PXT_IMAGE." >&2
    fi

    # No usable upstream image. Upstream publishes linux/amd64 only, so this is
    # the normal path on Apple Silicon / other arm64 hosts.
    echo "" >&2
    echo "WARNING: no usable $IMAGE for $HOST_ARCH" >&2
    if [ "$HOST_ARCH" = "arm64" ]; then
        echo "  That image publishes linux/amd64 only — there is no arm64 manifest." >&2
    fi

    if [ -n "$pxt_arch" ]; then
        echo "  Falling back to the local $PXT_IMAGE ($pxt_arch) already on this machine." >&2
        if [ "$pxt_arch" != "$HOST_ARCH" ]; then
            echo "  NOTE: that image is $pxt_arch on a $HOST_ARCH host — it will run emulated, slowly." >&2
        fi
        echo "" >&2
        return
    fi

    echo "" >&2
    echo "  No local $PXT_IMAGE to fall back on. Either:" >&2
    echo "    - build the image for this host:" >&2
    echo "        git clone https://github.com/League-Microbit/yotta-compiler" >&2
    echo "        cd yotta-compiler && make pext-tag" >&2
    echo "    - or skip Docker entirely:  npm run build:cloud" >&2
    exit 1
}

# The hex this build must replace, sampled BEFORE the compiler runs.
#
# WHY THIS EXISTS: the success check below used to be `[ -f "$HEX" ]` -- does
# the file exist -- which is true of a hex left over from any previous build.
# On 2026-09-11 `pxt build` began silently doing nothing (node_modules had been
# left half-installed, losing node_modules/pxtcli.json, so pxt treated this
# directory as a TARGET, found no libs/, and exited 0 without compiling). The
# script found the two-day-old hex, printed "Build complete", and wrote a
# .baked-profile naming the robot just asked for -- and that hex was then
# flashed to a robot. A stale artefact with a confident marker beside it is
# exactly the "hex that lies with authority" the bake step above exists to
# prevent, so freshness is checked rather than assumed.
#
# MUST be sampled here, not after the build: the obvious placement next to the
# check reads the file the compiler has already rewritten, compares it with
# itself, and condemns every build including the good ones.
HEX="built/binary.hex"
HEX_MTIME_BEFORE=0
[ -f "$HEX" ] && HEX_MTIME_BEFORE=$(stat -f %m "$HEX" 2>/dev/null || stat -c %Y "$HEX" 2>/dev/null || echo 0)

case "$MODE" in
    --cloud)
        echo "=== Cloud build (MakeCode compile service) ==="
        env $FLAGS npx pxt build --cloudbuild
        ;;
    --local|"")
        echo "=== Local build (yotta-compiler Docker image) ==="
        ensure_image
        env PXT_FORCE_LOCAL=1 $FLAGS npx pxt build
        ;;
    *)
        echo "Usage: bash scripts/build.sh [--local | --cloud]" >&2
        exit 1
        ;;
esac

if [ -f "$HEX" ]; then
    # A build that changed nothing at all did not build. Identical CONTENT is
    # legitimate (same sources, reproducible compiler), so an unchanged mtime
    # is the thing that condemns it: a real compile rewrites the file even when
    # the bytes come out the same.
    HEX_MTIME_AFTER=$(stat -f %m "$HEX" 2>/dev/null || stat -c %Y "$HEX" 2>/dev/null || echo 0)
    if [ "$HEX_MTIME_AFTER" = "$HEX_MTIME_BEFORE" ]; then
        echo "" >&2
        echo "✗ Build wrote no hex: $HEX is unchanged from before this run." >&2
        echo "  The compiler did nothing. Do NOT flash $HEX -- it is stale, and" >&2
        echo "  built/.baked-profile does not describe it." >&2
        echo "" >&2
        echo "  Most likely: node_modules/pxtcli.json is missing, so pxt treats" >&2
        echo "  this directory as a target and exits 0 without compiling. Fix:" >&2
        echo "    npx pxt target microbit" >&2
        echo "  (or 'npm run setup' for the full reinstall)." >&2
        rm -f built/.baked-profile
        exit 1
    fi

    # V2 only: the extension does not run on a V1, so a hex that is anything
    # but a V2 program is refused here -- before it gets a profile marker that
    # would let scripts/deploy.sh flash it. See scripts/check-v2-hex.sh.
    if ! bash scripts/check-v2-hex.sh "$HEX"; then
        rm -f built/.baked-profile
        echo "✗ Refusing $HEX: not a V2-only image. Do NOT flash it." >&2
        exit 1
    fi

    # Record which robot this hex is for, beside the hex itself. built/ is
    # wiped by `npm run clean` in step with the hex, so the marker can never
    # outlive or contradict the artefact it describes. scripts/deploy.sh reads
    # it to refuse flashing one robot's build onto another.
    printf '%s\n' "$BAKED" > built/.baked-profile
    echo ""
    echo "✓ Build complete: $(ls -lh "$HEX" | awk '{print $5}')  $(realpath "$HEX")"
    if [ "$BAKED" = "unbaked" ]; then
        echo "  profile: unbaked (generic — pass --robot NAME or --profile STR to stamp one)"
    else
        echo "  profile: $BAKED"
    fi
else
    echo "✗ Build produced no hex file." >&2
    exit 1
fi
