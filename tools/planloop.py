#!/usr/bin/env python3
"""planloop.py — sample a curve through given control points and simulate it.

Same simulator as planpath.py (measured TURN_GAIN/DIST_GAIN, per-leg from the
robot's own tracked pose), but the shape is given rather than searched. Used
when the field is too congested for a free search and the open space has to be
picked by eye.
"""
import json, math, sys
sys.path.insert(0, "tools")
from planpath import simulate, resample, score, MAT_X, MAT_Y, CAN_CLEAR

def catmull(P, n=40):
    Q = [P[0]] + list(P) + [P[-1]]; out = []
    for i in range(len(Q)-3):
        p0,p1,p2,p3 = Q[i],Q[i+1],Q[i+2],Q[i+3]
        for j in range(n):
            t=j/n; t2,t3=t*t,t*t*t
            out.append((0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
                        0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)))
    out.append(P[-1]); return out

def main():
    x0,y0,h0 = map(float, sys.argv[1:4])
    step = float(sys.argv[4])
    ctrl = [(x0,y0)] + [tuple(map(float,c.split(","))) for c in sys.argv[5:]]
    cans = [tuple(map(float,l.split())) for l in open("/tmp/cans.txt") if l.strip()]
    
    wps = resample(catmull(ctrl), step)[1:]
    swept, end, hend = simulate((x0,y0), h0, wps)
    clr, off = score(swept, cans)
    L = sum(math.dist(swept[i], swept[i+1]) for i in range(len(swept)-1))
    tgt = ctrl[-1]
    print(f"{len(wps)} waypoints @ {step:.0f}cm   path length {L:.0f} cm")
    print(f"  simulated end ({end[0]:.1f}, {end[1]:.1f}) h={hend%360:.1f}"
          f"   -> {math.dist(end,tgt):.1f} cm from the aim point {tgt}")
    print(f"  can clearance {clr:.1f} cm   paper margin {-off:.1f} cm")
    if clr < CAN_CLEAR or off > 0:
        print("  REJECT", file=sys.stderr); sys.exit(2)
    json.dump({"wp":wps,"pts":swept,"r0":[x0,y0],"h0":h0,"cans":cans,
               "target":list(tgt),"sim_end":[end[0],end[1],hend%360]}, open("/tmp/path.json","w"))


if __name__ == "__main__":
    main()
