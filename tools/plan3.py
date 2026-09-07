#!/usr/bin/env python3
"""plan3.py — reach a POSE in two goTo arcs. No in-place turn, no waypoint spam.

goTo already drives an arc, so approximating a spline with a dozen 12 cm
waypoints was throwing away the primitive's own shape. One arc from pose
(P0,h0) to a point T is fully determined -- including its exit heading, which
is h0 + 2*bearing (times the measured gain). That is one equation you do not
get to choose.

Two arcs give it back. Pick an intermediate point M (2 degrees of freedom); the
first arc's exit heading follows, then the second arc runs M -> T. Requiring
the second arc to exit on the push bearing is one constraint, so a
one-parameter family of solutions survives and clearance picks among them.

The alternative -- turn in place, then one arc -- also closes the maths, but
spends the worst primitive on the robot (open-loop in-place turns measured
4-7 degrees of error, and that error lands directly on the push bearing).
Two arcs need no turn at all.
"""
import json, math, sys
sys.path.insert(0, "tools")
from planpath import TURN_GAIN, DIST_GAIN, CAN_CLEAR, MAT_X, MAT_Y


def arc(p, h, t):
    """Sweep of the goTo arc from pose (p,h) to point t; returns pts, end heading."""
    hr = math.radians(h)
    dx, dy = t[0]-p[0], t[1]-p[1]
    fwd = dx*math.cos(hr) + dy*math.sin(hr)
    left = -dx*math.sin(hr) + dy*math.cos(hr)
    turn = math.degrees(2*math.atan2(left, fwd)) * TURN_GAIN
    if abs(left) < 1e-9:
        pts = [(p[0]+dx*i/16, p[1]+dy*i/16) for i in range(17)]
        return pts, h, (fwd, left)
    d = math.hypot(fwd, left) * DIST_GAIN
    r = d / (2*math.sin(math.radians(abs(turn))/2)) if abs(turn) > 1e-9 else 1e9
    sign = 1 if turn > 0 else -1
    cx, cy = p[0] - sign*r*math.sin(hr), p[1] + sign*r*math.cos(hr)
    pts = []
    for i in range(17):
        a = math.radians(turn)*i/16
        ca, sa = math.cos(a), math.sin(a)
        vx, vy = p[0]-cx, p[1]-cy
        pts.append((cx+vx*ca-vy*sa, cy+vx*sa+vy*ca))
    return pts, h+turn, (fwd, left)


def clear_of(pts, cans):
    return min(min(math.dist(c, q) for q in pts) for c in cans) if cans else 99


def on_paper(pts):
    return max(max(abs(q[0]) for q in pts)-MAT_X, max(abs(q[1]) for q in pts)-MAT_Y) < 0


def solve(p0, h0, target, th, cans, htol=2.0):
    best = None
    for mx in range(-50, 52, 2):
        for my in range(-22, 23, 2):
            m = (float(mx), float(my))
            if math.dist(m, p0) < 8 or math.dist(m, target) < 8:
                continue
            a_pts, h1, a_leg = arc(p0, h0, m)
            b_pts, h2, b_leg = arc(m, h1, target)
            if abs((h2 - th + 180) % 360 - 180) > htol:
                continue
            pts = a_pts + b_pts
            if not on_paper(pts):
                continue
            clr = clear_of(pts, cans)
            if clr < CAN_CLEAR:
                continue
            if best is None or clr > best[0]:
                best = (clr, m, a_leg, b_leg, pts, h2)
    return best


def main():
    x0, y0, h0 = map(float, sys.argv[1:4])
    tx, ty, th = map(float, sys.argv[4:7])
    cans = [tuple(map(float, l.split())) for l in open("/tmp/cans.txt") if l.strip()]
    htol = float(sys.argv[7]) if len(sys.argv) > 7 else 2.0
    best = solve((x0, y0), h0, (tx, ty), th, cans, htol)
    if best is None:
        print("PLAN FAILED: no two-arc solution clears the field", file=sys.stderr)
        sys.exit(2)
    clr, m, a_leg, b_leg, pts, h2 = best
    L = sum(math.dist(pts[i], pts[i+1]) for i in range(len(pts)-1))
    print(f"two arcs via ({m[0]:.0f}, {m[1]:.0f})   length {L:.0f} cm   clearance {clr:.1f} cm")
    print(f"  goTo({a_leg[0]:.1f}, {a_leg[1]:.1f})   then   goTo({b_leg[0]:.1f}, {b_leg[1]:.1f})")
    print(f"  arrives h={h2%360:.1f} (want {th:.1f})")
    json.dump({"legs": [list(a_leg), list(b_leg)], "pts": pts, "r0": [x0, y0], "h0": h0,
               "cans": cans, "target": [tx, ty], "target_h": th,
               "sim_end": [pts[-1][0], pts[-1][1], h2 % 360]}, open("/tmp/path.json", "w"))


if __name__ == "__main__":
    main()
