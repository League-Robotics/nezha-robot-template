#!/usr/bin/env python3
"""planpose.py — plan a path that arrives at a POSE: position AND heading.

WHY THIS EXISTS. The camera is instrumentation, not a control loop. It tells
you afterwards whether you got it right; it is not how the robot drives,
because the whole point is to work where there is no camera. So there is no
"turn until the camera says 122 degrees" step available.

That matters most before a push, where arriving on the wrong bearing sends the
can sideways. Open-loop in-place turns are the worst primitive available
(move(0,deg) scattered -17.9/+8.1/+5.0 over three identical commands), so the
answer is to need no turn: make the APPROACH end on the push bearing, and the
push becomes "keep driving straight".

The search is over Bezier tangent magnitudes, scored on the SIMULATED end pose
(measured turn gain applied), not the geometric one.
"""
import json, math, sys
sys.path.insert(0, "tools")
from planpath import bezier, resample, simulate, score, CAN_CLEAR, MAT_X, MAT_Y

SPACING = 12.0     # measured optimum -- see the note in planpath.py


def plan(x0, y0, h0, tx, ty, th, cans, spacing=SPACING, htol=4.0):
    best = None
    for d0 in range(10, 130, 5):
        for d1 in range(10, 130, 5):
            wps = resample(bezier((x0, y0), h0, (tx, ty), th, d0, d1), spacing)[1:]
            if len(wps) < 3:
                continue
            swept, end, hend = simulate((x0, y0), h0, wps)
            clr, off = score(swept, cans)
            perr = math.dist(end, (tx, ty))
            herr = abs((hend - th + 180) % 360 - 180)
            if clr < CAN_CLEAR or off > 0 or herr > htol or perr > 2.0:
                continue
            cost = perr + herr / 3.0 - min(clr, 20) / 20.0
            if best is None or cost < best[0]:
                best = (cost, d0, d1, wps, swept, end, hend, clr, perr, herr, off)
    return best


def main():
    x0, y0, h0, tx, ty, th = map(float, sys.argv[1:7])
    spacing = float(sys.argv[7]) if len(sys.argv) > 7 else SPACING
    htol = float(sys.argv[8]) if len(sys.argv) > 8 else 4.0
    cans = [tuple(map(float, l.split())) for l in open("/tmp/cans.txt") if l.strip()]
    best = plan(x0, y0, h0, tx, ty, th, cans, spacing, htol)
    if best is None:
        print("PLAN FAILED: nothing arrives on that pose with clearance", file=sys.stderr)
        sys.exit(2)
    cost, d0, d1, wps, swept, end, hend, clr, perr, herr, off = best
    L = sum(math.dist(swept[i], swept[i+1]) for i in range(len(swept)-1))
    print(f"{len(wps)} waypoints @ {spacing:.0f}cm   path length {L:.0f} cm   (bezier {d0}/{d1})")
    print(f"  simulated arrival ({end[0]:.2f}, {end[1]:.2f}) h={hend%360:.1f}")
    print(f"  -> {perr:.2f} cm and {herr:.1f} deg from the required pose "
          f"({tx:.2f}, {ty:.2f}) h={th:.1f}")
    print(f"  can clearance {clr:.1f} cm   paper margin {-off:.1f} cm")
    json.dump({"wp": wps, "pts": swept, "r0": [x0, y0], "h0": h0, "cans": cans,
               "target": [tx, ty], "target_h": th,
               "sim_end": [end[0], end[1], hend % 360]}, open("/tmp/path.json", "w"))


if __name__ == "__main__":
    main()
