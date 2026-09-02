#!/usr/bin/env python3
"""bench.py — drive the robot from the host over the USB serial wire.

The micro:bit cannot be poked by hand while it is on the bench stand, so
main.ts binds each action to a RUN name (diffDrive.onRun). This sends
those commands and streams back everything the board says.

Usage:
    python3 tools/bench.py                     # just listen
    python3 tools/bench.py ping                # send RUN:ping, print replies
    python3 tools/bench.py a                   # simulate a button-A press
    python3 tools/bench.py square              # call driveSquare() directly
    python3 tools/bench.py --raw HELLO         # send a raw (non-RUN) line
    python3 tools/bench.py --listen 30         # listen for 30s, send nothing

Options:
    --port PATH     serial device (default: autodetect a usbmodem port)
    --listen SECS   seconds to listen before sending (default 8, which covers
                    the ~2.5s boot after a reset; see the note in main())
    --wait SECS     seconds to wait for replies after each send (default 6)
    --raw           send the arguments verbatim instead of prefixing RUN:
"""
import argparse
import glob
import sys
import time

try:
    import serial  # pyserial
except ImportError:
    sys.exit("pyserial not installed — pip3 install pyserial")

BAUD = 115200


def autodetect():
    # The micro:bit's DAPLink CDC port. cu.* rather than tty.*: opening a
    # tty.* device blocks until DCD is asserted, which DAPLink never does.
    ports = sorted(glob.glob("/dev/cu.usbmodem*"))
    if not ports:
        sys.exit("no /dev/cu.usbmodem* found — is the micro:bit plugged in?")
    return ports[0]


def pump(ser, seconds, t0):
    """Print every line that arrives within `seconds`. Returns lines seen."""
    seen = []
    end = time.time() + seconds
    while time.time() < end:
        raw = ser.readline()
        if not raw:
            continue
        text = raw.decode("utf-8", "replace").rstrip("\r\n")
        if text:
            print(f"[{time.time() - t0:7.2f}] {text}", flush=True)
            seen.append(text)
    return seen


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("commands", nargs="*")
    ap.add_argument("--port")
    # Default 8s, not 0. Opening the port does NOT reset the board (measured),
    # so a listen window only shows boot output if something reset it just
    # before -- e.g. `pyocd reset` or a flash. The margin still matters: after
    # a reset the program needs ~2.5s to reach the end of main.ts and register
    # its onRun handlers, and a command sent before that is silently lost,
    # which looks exactly like a dead RUN bridge.
    ap.add_argument("--listen", type=float, default=8.0)
    ap.add_argument("--wait", type=float, default=6.0)
    ap.add_argument("--raw", action="store_true")
    args = ap.parse_args()

    port = args.port or autodetect()
    print(f"# port {port} @ {BAUD}", flush=True)

    with serial.Serial(port, BAUD, timeout=0.2) as ser:
        time.sleep(0.3)
        ser.reset_input_buffer()
        t0 = time.time()

        if args.listen > 0:
            print(f"# listening {args.listen:g}s …", flush=True)
            if not pump(ser, args.listen, t0):
                print("# (silence)", flush=True)

        for cmd in args.commands:
            line = cmd if args.raw else f"RUN:{cmd}"
            print(f"# TX {line}", flush=True)
            ser.write((line + "\n").encode())
            ser.flush()
            if not pump(ser, args.wait, t0):
                print("# (no reply)", flush=True)

    print("# done", flush=True)


main()
