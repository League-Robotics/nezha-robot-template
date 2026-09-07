#!/usr/bin/env python3
"""findcan.py — locate a can on the mat, in playfield cm, from the overhead camera.

The robot carries a tag; the cans do not. But a push is only correct if it is
aimed at where the can ACTUALLY is, so the host needs a can fix the same way it
needs a robot fix. The cans are bright aluminium cylinders on a white mat, seen
from directly above, so from the deskewed playfield image they are simply
circles of known radius (3.23 cm) -- which is exactly what HoughCircles finds.

Searching a ROI around an expected position rather than the whole field is what
makes this reliable: five cans look alike, and the mat's own printed circles are
the same size. Caller says where it thinks the can is; this says where it is.

    python3 tools/findcan.py --near -34.74 0.86            # -> "x y" cm
    python3 tools/findcan.py --near -34.74 0.86 --debug out.png
"""
import argparse, subprocess, sys, tempfile, os
import numpy as np, cv2

PPC = 5.957            # px/cm of the deskewed playfield image (it reports this)
W, H = 134.3, 89.3     # playfield extent, cm
CAN_R_CM = 3.23
CAM = "arducam-ov9782-usb-camera"

# PARALLAX. The deskewed image is rectified to the MAT PLANE, so anything with
# height is displaced radially outward from the camera's nadir. What Hough
# finds on a can is its bright lid, ~10 cm up -- which at the far end of the
# field is ~3.5 cm from where the can actually stands. Pushing is planned
# against flat targets painted on the mat, so comparing an uncorrected lid
# position against a painted circle would bake in that error.
#
#     apparent = nadir + (base - nadir) * H / (H - h)
#
# Camera geometry is the daemon's own (get_camera_config -> camera_position);
# CAN_H_CM was FITTED, not assumed: least-squares over the four cans whose
# painted circle is identifiable gives 10.1 cm, rms residual 0.66 cm across
# cans spanning the full field. A wrong height would leave a radial error
# pattern instead. Re-fit if the cans change.
CAM_H_CM = 128.2299
NADIR = (3.0570142285481654, -2.798700632324644)
CAN_H_CM = 10.0
MIN_LID_BRIGHTNESS = 120.0   # 0-255; see the floor check in find()


def w2p(x, y): return ((x + W / 2) * PPC, (H / 2 - y) * PPC)
def p2w(px, py): return (px / PPC - W / 2, H / 2 - py / PPC)


def deparallax(x, y):
    """Lid position (mat plane) -> where the can actually stands."""
    f = (CAM_H_CM - CAN_H_CM) / CAM_H_CM
    return (NADIR[0] + (x - NADIR[0]) * f, NADIR[1] + (y - NADIR[1]) * f)


def parallax(x, y):
    """Where a can standing at (x, y) will APPEAR. Inverse of deparallax."""
    f = CAM_H_CM / (CAM_H_CM - CAN_H_CM)
    return (NADIR[0] + (x - NADIR[0]) * f, NADIR[1] + (y - NADIR[1]) * f)


def grab(path):
    r = subprocess.run(["aprilcam", "playfield", "image", "--camera", CAM, "-o", path],
                       capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("findcan: camera grab failed: " + (r.stderr or r.stdout).strip())


def find(img, near, search_cm):
    cx, cy = w2p(*parallax(*near))
    pad = int(search_cm * PPC)
    x0, y0 = max(0, int(cx - pad)), max(0, int(cy - pad))
    x1, y1 = min(img.shape[1], int(cx + pad)), min(img.shape[0], int(cy + pad))
    roi = img[y0:y1, x0:x1]
    if roi.size == 0:
        return None, None

    g = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    g = cv2.medianBlur(g, 5)
    r_px = CAN_R_CM * PPC
    circles = cv2.HoughCircles(
        g, cv2.HOUGH_GRADIENT, dp=1, minDist=int(r_px),
        param1=110, param2=22,
        minRadius=int(r_px * 0.65), maxRadius=int(r_px * 1.45))
    if circles is None:
        return None, roi

    circles = np.round(circles[0]).astype(int)
    # A can is a METAL cylinder: its lid is specular and much brighter than the
    # mat's printed rings, which are thin outlines on white. Rank on mean
    # interior brightness so a printed circle never wins over a real can.
    # An ABSOLUTE brightness floor, not just a relative ranking. A can lid is
    # specular metal; the mat's printed rings, the dark blue diamond and the
    # robot's own body are not. Ranking without a floor means the best of a bad
    # field still wins, which is how a printed circle and then the robot itself
    # got reported as delivered cans on 2026-09-03. If nothing clears the bar,
    # the honest answer is "no can here".
    best, best_score = None, -1
    for (px, py, r) in circles:
        mask = np.zeros(g.shape, np.uint8)
        cv2.circle(mask, (px, py), max(1, int(r * 0.6)), 255, -1)
        bright = cv2.mean(g, mask=mask)[0]
        if bright < MIN_LID_BRIGHTNESS:
            continue
        # tie-break toward the expected spot, but let brightness dominate
        dist = np.hypot(px - (cx - x0), py - (cy - y0)) / PPC
        score = bright - 2.0 * dist
        if score > best_score:
            best_score, best = score, (px + x0, py + y0, r, bright)
    return best, roi


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--near", nargs=2, type=float, required=True, metavar=("X", "Y"))
    ap.add_argument("--search", type=float, default=12.0, help="ROI half-size, cm")
    ap.add_argument("--image", help="use this image instead of grabbing a frame")
    ap.add_argument("--debug", help="write an annotated png here")
    ap.add_argument("--raw", action="store_true",
                    help="report the lid position, uncorrected for parallax")
    # The robot's own AprilTag is a bright square of about a can's size, so
    # Hough happily reports it as a can -- which on 2026-09-03 made me tell
    # Eric the can had been delivered to circle 12 when what sat there was the
    # robot. Anything within this radius of the robot is not a can.
    ap.add_argument("--not-near", nargs=2, type=float, metavar=("X", "Y"),
                    help="reject detections within --not-near-r of this point")
    ap.add_argument("--not-near-r", type=float, default=12.0)
    ap.add_argument("--verbose", action="store_true")
    a = ap.parse_args()

    path = a.image
    tmp = None
    if not path:
        tmp = tempfile.mktemp(suffix=".png")
        grab(tmp)
        path = tmp
    img = cv2.imread(path)
    if img is None:
        sys.exit("findcan: cannot read " + path)

    hit, _ = find(img, tuple(a.near), a.search)
    if hit is None:
        if tmp: os.unlink(tmp)
        sys.exit("findcan: no can within %.0f cm of (%.2f, %.2f)" % (a.search, *a.near))

    px, py, r, bright = hit
    wx, wy = p2w(px, py)
    if not a.raw:
        wx, wy = deparallax(wx, wy)
    if a.not_near:
        import math as _m
        if _m.hypot(wx - a.not_near[0], wy - a.not_near[1]) < a.not_near_r:
            if tmp: os.unlink(tmp)
            sys.exit("findcan: detection at (%.2f, %.2f) is the robot, not a can"
                     % (wx, wy))
    if a.debug:
        cv2.circle(img, (px, py), r, (0, 0, 255), 2)
        cv2.drawMarker(img, (px, py), (0, 0, 255), cv2.MARKER_CROSS, 14, 2)
        ex, ey = w2p(*parallax(*a.near))
        cv2.drawMarker(img, (int(ex), int(ey)), (0, 255, 0), cv2.MARKER_TILTED_CROSS, 14, 2)
        cv2.imwrite(a.debug, img)
    print("%.2f %.2f" % (wx, wy))
    if a.verbose:
        print("  lid brightness %.0f (floor %.0f)" % (bright, MIN_LID_BRIGHTNESS),
              file=sys.stderr)
    if tmp: os.unlink(tmp)


main()
