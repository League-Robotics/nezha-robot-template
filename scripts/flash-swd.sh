#!/usr/bin/env bash
# flash-swd.sh — flash built/binary.hex over SWD with pyOCD, reliably.
#
# WHY NOT JUST `pyocd flash`: pyOCD does not program flash from the host. It
# uploads a flash algorithm into the target's RAM and runs it ON THE NRF52'S
# OWN CORE. So programming needs a core healthy enough to execute code. If the
# core is in Lockup — which happens if a previous flash was interrupted, or the
# vector table was erased under a running CPU, or the program hard-faulted —
# every `pyocd flash` fails with:
#
#     flash program page failure (address 0x00000000; result code 0x67)
#
# and each failed attempt leaves it locked up for the next one, so it looks
# like a dead board. It is not: Lockup is volatile CPU state. `reset halt`
# clears it every time. Reproduced and recovered twice on tigez 2026-09-02.
#
# So: always reset-halt first, then program, then reset to run.
#
# Usage: bash scripts/flash-swd.sh [path/to.hex]
set -uo pipefail

cd "$(dirname "$0")/.."
HEX="${1:-built/binary.hex}"
TARGET="${PYOCD_TARGET:-nrf52833}"
PYOCD="${PYOCD:-$HOME/.local/bin/pyocd}"
command -v "$PYOCD" >/dev/null 2>&1 || PYOCD=pyocd

[ -f "$HEX" ] || { echo "flash-swd: no such hex: $HEX" >&2; exit 1; }

state() { "$PYOCD" cmd -t "$TARGET" -c "status" 2>/dev/null | tail -1; }

for attempt in 1 2 3; do
    # Put the core somewhere the flash algorithm can actually run. Cheap, and
    # it is the whole fix — do it unconditionally rather than only on retry.
    "$PYOCD" cmd -t "$TARGET" -c "reset halt" >/dev/null 2>&1

    # NOTE: `cmd | tail` would report tail's status, not pyocd's, and pyocd
    # prints its fatal errors on stdout — so capture, then test explicitly.
    out="$("$PYOCD" flash -t "$TARGET" --erase chip "$HEX" 2>&1)"
    rc=$?
    echo "$out" | tail -1
    if [ $rc -eq 0 ] && ! echo "$out" | grep -q "program page failure"; then
        "$PYOCD" reset -t "$TARGET" >/dev/null 2>&1
        echo "flash-swd: ok ($HEX)"
        exit 0
    fi

    echo "flash-swd: attempt $attempt failed — core is $(state)" >&2
    sleep 2
done

# ---- automatic fallback: mass storage --------------------------------------
# SWD needs the target core healthy enough to run pyOCD's flash algorithm, and
# `pyocd cmd -c "reset halt"` does NOT persist: pyocd resumes the target when it
# disconnects, so the core is running again by the time the next pyocd process
# connects. When that leaves us unable to program, DAPLink's mass-storage path
# still works -- the interface MCU parses the hex itself and needs nothing from
# the target core. Slower and gives no error detail, but it is the path that
# always works, so take it automatically rather than making a human retype it.
echo "flash-swd: SWD failed 3x (core: $(state)) — falling back to mass storage" >&2

MSD=/Volumes/MICROBIT
if [ ! -d "$MSD" ]; then
    echo "flash-swd: $MSD not mounted; cannot fall back." >&2
    exit 1
fi

PORT=$(ls /dev/cu.usbmodem* 2>/dev/null | head -1)
cat "$HEX" > "$MSD/fw.hex" || { echo "flash-swd: MSD write failed" >&2; exit 1; }
sync

# DAPLink CONSUMES the file when it accepts it: the hex disappears from the
# volume and FAIL.TXT appears if it was rejected. That is the completion signal
# -- the serial port does not reliably drop, so do not wait on that.
for _ in $(seq 1 60); do
    [ -e "$MSD/fw.hex" ] || break
    sleep 1
done

if [ -f "$MSD/FAIL.TXT" ]; then
    echo "flash-swd: DAPLink rejected the hex:" >&2
    cat "$MSD/FAIL.TXT" >&2
    exit 1
fi
if [ -e "$MSD/fw.hex" ]; then
    echo "flash-swd: hex still on the volume after 60s — DAPLink did not take it." >&2
    exit 1
fi

sleep 3
echo "flash-swd: ok via mass storage ($HEX)"
exit 0
