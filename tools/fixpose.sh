#!/usr/bin/env bash
# fixpose.sh — the robot's world pose from the overhead camera: "x y heading".
#
# Two things this handles that a single `aprilcam camera tags` call does not:
#
#   RETRIES. In dim light the tag resolves in roughly one frame in three. A
#   miss is not "the robot is gone", and treating it as one aborted a run.
#
#   AVERAGING. The yaw estimate scatters a few degrees frame to frame. An
#   open-loop path is planned off a single heading, so on a 100 cm path that
#   scatter is centimetres of miss at the far end. Headings are averaged as
#   unit vectors, not degrees, so the wrap at +/-180 cannot corrupt the mean.
#
# Usage: tools/fixpose.sh [samples] [tries-per-sample]
#        -> "x y heading" on stdout, sample count and spread on stderr
set -uo pipefail
export PATH="$HOME/.local/bin:$PATH"
CAM="${CAM:-arducam-ov9782-usb-camera}"
TAG="${TAG:-57}"
N="${1:-7}"
TRIES="${2:-40}"

one() {
  local t="$TRIES" out
  while [ "$t" -gt 0 ]; do
    out=$(aprilcam camera tags "$CAM" 2>/dev/null | python3 -c '
import re, sys, math
pat = re.compile(r"apriltag\s+" + sys.argv[1] +
                 r"\s+world=\(\s*([-0-9.]+),\s*([-0-9.]+)\)\s+yaw=([-0-9.]+)")
for line in sys.stdin:
    m = pat.search(line)
    if m:
        print("%s %s %.3f" % (m.group(1), m.group(2),
                              math.degrees(float(m.group(3)))))
        break
' "$TAG")
    [ -n "$out" ] && { printf '%s\n' "$out"; return 0; }
    t=$((t-1))
  done
  return 1
}

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
for _ in $(seq 1 "$N"); do
  f=$(one) && printf '%s\n' "$f" >> "$tmp"
done

python3 -c '
import sys, math
rows = [list(map(float, l.split())) for l in open(sys.argv[1]) if l.strip()]
if not rows:
    sys.exit(1)
med = lambda v: sorted(v)[len(v)//2]
cx = sum(math.cos(math.radians(r[2])) for r in rows)
cy = sum(math.sin(math.radians(r[2])) for r in rows)
h = math.degrees(math.atan2(cy, cx))
spread = max(abs((r[2]-h+180) % 360 - 180) for r in rows)
print("%.2f %.2f %.2f" % (med([r[0] for r in rows]), med([r[1] for r in rows]), h))
print("  (%d/%s fixes, heading spread %.1f deg)" % (len(rows), sys.argv[2], spread),
      file=sys.stderr)
' "$tmp" "$N"
