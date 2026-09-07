#!/usr/bin/env python3
"""emit_program.py — turn a planned path into a plain sequence of move commands.

The robot program should read like something a student wrote: one function,
one command per line, no dispatch tables. All the geometry happens HERE, on the
host, at planning time.

Each leg is emitted in the robot's OWN frame at the moment that leg starts
(x forward, y left), which is exactly what goTo takes -- so the program needs
no pose maths at all. Computing those deltas requires knowing the heading after
each arc, and goTo turns 5.8% more than the ideal model, so the measured gain
is applied while walking the path. That correction is why this is generated
rather than hand-written.
"""
import json, math, sys
sys.path.insert(0, "tools")
from planpath import TURN_GAIN, DIST_GAIN

path = json.load(open(sys.argv[1]))
push_cm = float(sys.argv[2])
cruise = float(sys.argv[3]) if len(sys.argv) > 3 else 18
push_speed = float(sys.argv[4]) if len(sys.argv) > 4 else 8

p = tuple(path["r0"]); h = float(path["h0"])
legs = []
for t in path["wp"]:
    dx, dy = t[0]-p[0], t[1]-p[1]
    hr = math.radians(h)
    fwd = dx*math.cos(hr) + dy*math.sin(hr)
    left = -dx*math.sin(hr) + dy*math.cos(hr)
    legs.append((fwd, left))
    h += math.degrees(2*math.atan2(left, fwd)) * TURN_GAIN
    p = (t[0], t[1])

out = []
out.append("// Obstacle 1 - drive out and push the can on circle 9 into circle 12.")
out.append("// Each goTo is one curve, in the robot's own frame: x forward, y left, cm.")
out.append("function obstacle1() {")
out.append("    diffDrive.setDefaultSpeed(%g)" % cruise)
for fwd, left in legs:
    out.append("    diffDrive.goTo(%.1f, %.1f)" % (fwd, left))
out.append("    diffDrive.setDefaultSpeed(%g)   // slow: a hard shove tips the can" % push_speed)
out.append("    diffDrive.move(%.1f, 0)          // push it to circle 12" % push_cm)
out.append("}")
out.append("input.onButtonPressed(Button.A, obstacle1)")
out.append('diffDrive.onRun("go", obstacle1)     // same thing, startable over the radio')
print("\n".join(out))
