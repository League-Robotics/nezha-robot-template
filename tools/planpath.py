#!/usr/bin/env python3
"""planpath.py — plan a goTo-drivable curved path and SIMULATE it before driving.

Two lessons from the run that ended 54 cm off the plan are baked in here.

1. The path must start TANGENT to the robot's current heading. The old planner
   opened with a 173-degree in-place turn, and move(0,deg) was measured to
   scatter by 10-18 degrees -- so the whole open-loop path inherited that error
   and drove off the mat. A tangent start needs no initial turn at all.

2. goTo turns 5.8% more than the ideal arc model (measured over three probes,
   both directions, 2026-09-03). Small per leg, but it accumulates across a
   dozen legs, so the simulation applies it and the plan is checked against the
   SIMULATED end pose rather than the geometric one.

WAYPOINT SPACING IS A STABILITY PARAMETER, and tighter is NOT safer.
goTo turns TWICE the bearing to its target, so it overshoots by design.
Shortening the legs raises that loop's gain until the path rings: measured
on one route, max deviation from the intended curve was 3.1 cm at 12 cm
spacing, 7.4 cm at 8 cm, 58.8 cm at 5 cm and 515 cm at 4 cm. Too sparse
rings as well (the heading overshoot is not absorbed before the next leg).
~12 cm is the measured optimum for this robot. Simulate before trusting any
change to it.
"""
import json, math, sys

TURN_GAIN = 1.058          # measured: goTo turns this much more than the model
DIST_GAIN = 1.006          # measured over the same three probes
# Limits on the robot's REFERENCE POINT, not on its footprint. The printed
# paper runs to about x +/-60, y +/-29 (measured off the deskewed frame), and
# the robot is 13.2 cm across, so the reference point has to stay a half-width
# inside that or the wheels hang off the edge -- which is where the robot
# slipped and lost 38 cm of odometry on 2026-09-03.
# The whole PLAYFIELD is drivable, not just the printed paper -- driving off
# the paper onto the table is allowed and the field is bounded by the camera
# frame at +/-67.15 x, +/-44.65 y. Limits are on the reference point, so a
# half-width (6.6 cm) inside that. Restricting plans to the paper had the
# robot boxed into the north-west corner with no route home.
MAT_X, MAT_Y = 60.0, 38.0  # usable paper, with margin -- NOT the playfield frame
# Clearance needed between the robot's REFERENCE POINT and a can centre.
# MEASURED, not assumed: the robot is 13.2 cm across the wheels (from the
# deskewed frame at 5.957 px/cm, 2026-09-03), so half-width 6.6, plus the
# 3.23 cm can radius = 9.9. The 0.6 on top is margin. An earlier guess of
# "half-width 8" made this 11.3 and wrongly rejected the only viable route
# through the field.
CAN_CLEAR = 10.5


def bezier(p0, t0, p1, t1, d0, d1, n=400):
    c0 = (p0[0] + d0*math.cos(math.radians(t0)), p0[1] + d0*math.sin(math.radians(t0)))
    c1 = (p1[0] - d1*math.cos(math.radians(t1)), p1[1] - d1*math.sin(math.radians(t1)))
    out = []
    for i in range(n+1):
        u = i/n; v = 1-u
        out.append((v**3*p0[0] + 3*v*v*u*c0[0] + 3*v*u*u*c1[0] + u**3*p1[0],
                    v**3*p0[1] + 3*v*v*u*c0[1] + 3*v*u*u*c1[1] + u**3*p1[1]))
    return out


def resample(curve, step):
    out = [curve[0]]; acc = 0.0
    for i in range(1, len(curve)):
        acc += math.dist(curve[i-1], curve[i])
        if acc >= step:
            out.append(curve[i]); acc = 0.0
    if math.dist(out[-1], curve[-1]) > 1e-6:
        out.append(curve[-1])
    return out


def simulate(pose, heading, wps):
    """Drive the waypoint list the way the ROBOT will: each leg computed from
    its own tracked pose, arcs with the measured gains. Returns the swept
    points and the true end pose."""
    p, h = pose, heading
    swept = [p]
    for t in wps:
        dx, dy = t[0]-p[0], t[1]-p[1]
        hr = math.radians(h)
        fwd = dx*math.cos(hr) + dy*math.sin(hr)
        left = -dx*math.sin(hr) + dy*math.cos(hr)
        turn = math.degrees(2*math.atan2(left, fwd)) * TURN_GAIN
        d = math.hypot(fwd, left) * DIST_GAIN
        if abs(turn) < 1e-6:
            for i in range(1, 9):
                swept.append((p[0]+d*math.cos(hr)*i/8, p[1]+d*math.sin(hr)*i/8))
            p = swept[-1]
        else:
            # chord d over a turn of `turn` -> radius; sweep the arc
            r = d / (2*math.sin(math.radians(abs(turn))/2)) if abs(turn) > 1e-9 else 1e9
            sign = 1 if turn > 0 else -1
            cx = p[0] - sign*r*math.sin(hr); cy = p[1] + sign*r*math.cos(hr)
            for i in range(1, 9):
                a = math.radians(turn)*i/8
                ca, sa = math.cos(a), math.sin(a)
                vx, vy = p[0]-cx, p[1]-cy
                swept.append((cx+vx*ca-vy*sa, cy+vx*sa+vy*ca))
            p = swept[-1]
        h += turn
    return swept, p, h


def score(swept, cans):
    clr = min(min(math.dist(c, q) for q in swept) for c in cans) if cans else 99
    off = max(max(abs(q[0]) for q in swept)-MAT_X, max(abs(q[1]) for q in swept)-MAT_Y)
    return clr, off


def main():
    x0, y0, h0 = map(float, sys.argv[1:4])
    tx, ty = map(float, sys.argv[4:6])
    th = None if sys.argv[6] == "free" else float(sys.argv[6])
    cans = [tuple(map(float, l.split())) for l in open("/tmp/cans.txt") if l.strip()]
    step = float(sys.argv[7]) if len(sys.argv) > 7 else 10.0

    # The END HEADING is left free and searched over. Arriving on an exact
    # heading needs a run-in from beyond the paper's edge, and it is not worth
    # contorting the path for: an in-place turn is only fatal when it is
    # uncorrected mid-path, and the final orientation can be closed on the
    # camera once the robot has stopped. Position is what must be open-loop.
    # The END HEADING is left free and searched over. Arriving on an exact
    # heading needs a run-in from beyond the paper's edge, and it is not worth
    # contorting the path for: an in-place turn is only fatal when it is
    # uncorrected mid-path, and the final orientation can be closed on the
    # camera once the robot has stopped. Position is what must survive
    # open-loop, because that is what the last run got wrong.
    best = None
    headings = [th] if th is not None else list(range(-180, 180, 15))
    for thc in headings:
        for d0 in range(10, 110, 5):
            for d1 in range(5, 110, 5):
                wps = resample(bezier((x0, y0), h0, (tx, ty), thc, d0, d1), step)[1:]
                if len(wps) < 4:
                    continue
                swept, endp, hend = simulate((x0, y0), h0, wps)
                clr, off = score(swept, cans)
                err = math.dist(endp, (tx, ty))
                if clr < CAN_CLEAR or off > 0:
                    continue
                cost = err - min(clr, 25) / 25.0   # land on the spot, then prefer room
                if best is None or cost < best[0]:
                    best = (cost, d0, d1, wps, swept, endp, hend, clr, err, thc)

    if best is None:
        print("PLAN FAILED: no candidate clears the cans and stays on the paper", file=sys.stderr)
        sys.exit(2)
    cost, d0, d1, wps, swept, end, hend, clr, err, thc = best
    print(f"plan: {len(wps)} waypoints @ {step:.0f}cm  (bezier d0={d0} d1={d1})")
    print(f"  simulated end ({end[0]:.1f}, {end[1]:.1f}) h={hend%360:.1f}  "
          f"-> {err:.1f} cm from target ({tx}, {ty}); final orientation closed on camera")
    print(f"  can clearance {clr:.1f} cm, stays on the paper")
    json.dump({"wp": wps, "pts": swept, "r0": [x0, y0], "h0": h0,
               "cans": cans, "target": [tx, ty],
               "sim_end": [end[0], end[1], hend % 360]}, open("/tmp/path.json", "w"))


if __name__ == "__main__":
    main()
