#!/usr/bin/env python3
"""plan2leg.py — plan an approach in two chained legs, still one open-loop run.

The single-Bezier planner has to satisfy the arrival HEADING and the gap
clearance with the same curve, and on a congested field those fight: through
the can-4/can-1 gap, a free-heading path clears 11.3 cm but a pose-constrained
one drops to 9.9, which is the robot's physical half-width plus a can radius --
no margin at all.

Splitting fixes it. Leg A threads the gap with no heading constraint, so it can
cross squarely. Leg B starts in the open ground beyond and only then lines up on
the push bearing, where there is room to curve. The two waypoint lists are
concatenated and uploaded as ONE path -- the robot still drives the whole thing
on its own odometry with no camera and no host in the loop.
"""
import json, math, sys
sys.path.insert(0, "tools")
import planpath
from planpath import bezier, resample, simulate, score


def leg(p0, h0, p1, th, cans, spacing, htol=None):
    """Best Bezier from pose (p0,h0) to p1 (with heading th if htol given).

    When the arrival heading is free, the exit tangent is not searched over
    every direction -- that made the two-leg search millions of simulations
    and it timed out. A short list around the straight-line bearing to the
    target is enough, because leg A only has to get through the gap tidily.
    """
    natural = math.degrees(math.atan2(p1[1]-p0[1], p1[0]-p0[0]))
    tangents = [th] if htol is not None else [natural + k for k in (-40, -20, 0, 20, 40)]
    best = None
    for d0 in range(10, 130, 12):
        for d1 in range(10, 130, 12):
            for tc in tangents:
                wps = resample(bezier(p0, h0, p1, tc, d0, d1), spacing)[1:]
                if len(wps) < 2:
                    continue
                swept, end, hend = simulate(p0, h0, wps)
                clr, off = score(swept, cans)
                perr = math.dist(end, p1)
                # Reject loops. A pose-constrained leg will happily satisfy the
                # heading by pirouetting through a 5 cm circle -- it scores fine
                # on clearance when nothing is parked there, but it is a silly
                # and inaccurate manoeuvre. Cap the path length against the
                # straight-line distance and cap the total turning.
                L = sum(math.dist(swept[i], swept[i+1]) for i in range(len(swept)-1))
                direct = math.dist(p0, p1)
                turned = abs(hend - h0)
                if L > 1.7 * direct + 12 or turned > 200:
                    continue
                # Reject cusps. A path can satisfy length and clearance while
                # containing a near-reversal that the robot cannot drive
                # cleanly; measure the turn between consecutive swept segments
                # and cap both the sharpest one and the total.
                segs = [math.degrees(math.atan2(swept[i+1][1]-swept[i][1],
                                                swept[i+1][0]-swept[i][0]))
                        for i in range(len(swept)-1)]
                steps = [abs((segs[i+1]-segs[i]+180) % 360 - 180)
                         for i in range(len(segs)-1)]
                if steps and (max(steps) > 45 or sum(steps) > 400):
                    continue
                herr = abs((hend - th + 180) % 360 - 180) if htol is not None else 0.0
                if off > 0 or perr > 1.5 or (htol is not None and herr > htol):
                    continue
                cost = -clr + perr + herr / 4.0
                if best is None or cost < best[0]:
                    best = (cost, wps, swept, end, hend, clr, perr, herr)
    return best


def main():
    x0, y0, h0, sx, sy, brg = map(float, sys.argv[1:7])
    spacing = float(sys.argv[7]) if len(sys.argv) > 7 else 10.0
    cans = [tuple(map(float, l.split())) for l in open("/tmp/cans.txt") if l.strip()]

    best = None
    for mx in range(-22, -5, 3):            # handover point, west of the gap
        for my in range(-20, -4, 3):
            a = leg((x0, y0), h0, (float(mx), float(my)), None, cans, spacing)
            if a is None:
                continue
            b = leg((float(mx), float(my)), a[4], (sx, sy), brg, cans, spacing, htol=4.0)
            if b is None:
                continue
            clr = min(a[5], b[5])
            lateral = 22.39 * math.sin(math.radians(b[7]))
            if clr < planpath.CAN_CLEAR or lateral > 2.0:
                continue
            if best is None or clr > best[0]:
                best = (clr, (mx, my), a, b, lateral)

    if best is None:
        print("PLAN FAILED: no two-leg route clears the field", file=sys.stderr)
        sys.exit(2)
    clr, mid, a, b, lateral = best
    wps = list(a[1]) + list(b[1])
    # Leg A's last swept point and leg B's first are the same handover point.
    # Concatenating them leaves a ~0.06 cm segment whose direction is noise,
    # which shows up in any turn analysis as a bogus 150-degree cusp.
    swept = list(a[2]) + [q for q in b[2] if math.dist(q, a[2][-1]) > 0.5]
    end, hend = b[3], b[4]
    L = sum(math.dist(swept[i], swept[i+1]) for i in range(len(swept)-1))
    print(f"{len(wps)} waypoints @ {spacing:.0f}cm   path length {L:.0f} cm   handover at {mid}")
    print(f"  simulated arrival ({end[0]:.2f}, {end[1]:.2f}) h={hend%360:.1f}")
    print(f"  -> {math.dist(end,(sx,sy)):.2f} cm and {b[7]:.1f} deg from the push pose")
    print(f"  can clearance {clr:.1f} cm (need {planpath.CAN_CLEAR})")
    print(f"  heading error puts the can {lateral:.1f} cm off centre (circle r=3.23)")
    json.dump({"wp": wps, "pts": swept, "r0": [x0, y0], "h0": h0, "cans": cans,
               "target": [sx, sy], "target_h": brg,
               "sim_end": [end[0], end[1], hend % 360]}, open("/tmp/path.json", "w"))


if __name__ == "__main__":
    main()
