# The secondary playfield, surveyed 2026-09-17

Camera `hd-usb-camera` (camera 3), playfield `secondary-playfield`, 110 x 70 cm,
world origin at its centre. Measured off the rectified frame
(`aprilcam playfield image --camera hd-usb-camera`, 7.273 px/cm) by thresholding
for black and taking the runs that cross a band around the stripe.

## Shape

It is not the main field's shape. There are **three** full-width lines, not two:

| feature | world x | width |
|---|---|---|
| west crossbar | -37.54 .. -35.75 | 1.92 cm |
| **mid-field line** | **-0.28 .. +1.51** | **1.92 cm** |
| east crossbar | +38.77 .. +40.56 | 1.92 cm |

and the stripe the robot straddles runs east-west between the crossbars at
**y = -0.20 .. +1.70**, centre **y = +0.75**, the same 1.9 cm wide.

The mid-field line is the vertical arm of a second, perpendicular course --
useful for other programs, fatal to an unmodified `calj`, which reads its
`####` as the finish at about 37 cm of a 75.8 cm run.

## The length is the tape's, not the camera's

Crossbar leading edge to leading edge, west to east: the camera makes it
**76.31 cm**; Eric's tape makes it **75.8 cm**. The camera is 0.67% long.

That is the same lesson the main field taught on 2026-09-16, where the camera's
90.57 cm against a tape-measured 90.2 was 0.41% out and landed directly in the
wheel diameter. This camera has no flat-field correction at all
(`flatfield=absent`), so it has even less claim to the one length the whole
calibration scales by. **75.8 is what every run here is measured against.**

## Where the robot sits

The AprilTag (57) is not the sensor bar. On tigez the bar leads the tag by
**8.3 cm** and sits **1.94 cm to the tag's right**, both measured here (see
`bench-log.md`). A start pose of tag (-46.8, +2.70) facing east therefore puts
the bar about 1 cm west of the west crossbar with its centre on the stripe.
