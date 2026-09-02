#!/usr/bin/env bash
# build.sh — compile the project locally or via cloud.
#
# Usage:
#   bash scripts/build.sh                  # local build (needs Docker + yotta-compiler)
#   bash scripts/build.sh --cloud          # cloud build (no Docker, uses MakeCode service)
#   bash scripts/build.sh --local          # local build (explicit)
#   bash scripts/build.sh --refresh-image  # re-pull the compiler image before building
set -euo pipefail

MODE="--local"
REFRESH=0
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
        *) echo "Usage: bash scripts/build.sh [--local | --cloud] [--refresh-image]" >&2; exit 1 ;;
    esac
done

cd "$(dirname "$0")/.."

# Re-apply local extension hot-fixes. pxt_modules/ is a dependency cache that
# `pxt install` refetches and overwrites, so patched sources do not survive on
# their own -- this runs on every build to put them back. Idempotent.
# A failure here is NOT fatal: it prints loudly and the build continues with
# unpatched sources, so a version bump upstream cannot silently block builds.
bash scripts/patch-extension.sh || echo "WARNING: extension patches not applied — see above." >&2

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

HEX="built/binary.hex"
if [ -f "$HEX" ]; then
    echo ""
    echo "✓ Build complete: $(ls -lh "$HEX" | awk '{print $5}')  $(realpath "$HEX")"
else
    echo "✗ Build produced no hex file." >&2
    exit 1
fi
