# tovez geometry calibration, 2026-09-15

Robot **tovez** (AprilTag 52) on the main playfield, driven over WiFi
(192.168.1.187:7654) from this repo's `leaguebot` link. Firmware: this repo at
`radio-map-73` plus the uncommitted `test/calibratel.ts`, against
nezha-diffdrive **v1.20260914.1**. Times are UTC (PDT + 7).

**Result: effective track width b = 111.1 mm, i.e. rotational slip 1.028 with
trackWidth 114.2 mm.** Wheel calibration 0.7842 mm/deg re-confirmed unchanged.

This log was rewritten after three wrong conclusions were published from it. The
retractions are kept, in section 7, because each one has a lesson in it.

## What these numbers are, and are not

- **Camera-truthed, not odometry.** Every angle and distance is the overhead
  camera's reading of AprilTag 52. The robot's own odometry is reported only
  where it is the thing under test.
- **Averaged.** Each fix is the mean of every frame over 3-6 s
  (`scratchpad/fix.py`): x/y arithmetically, yaw CIRCULARLY. Frame counts and
  SDs are printed on each line; position SD ran 0.02-0.13 cm.
- **The camera reports `calibration_stale: true`** on every frame. Absolute
  scale is suspect, which affects the distance checks. Angle differences do not
  depend on cm-per-pixel.
- WiFi drops reply lines, so `CALL:` lines are missing from several runs even
  where the move completed. Runs were confirmed by camera.

## 1. The geometry that matters

`motion_engine.h:72`  b = trackWidth / rotationalSlip
`motion_engine.cpp:218`  yawTarget = rotation * 0.5 * effectiveTrackWidth() * cpm

A rotation's wheel-travel target is **proportional to b**. Too large a b
over-rotates; too small a b makes the move finish instantly having barely
turned. Both failure modes were seen tonight, and the second one is what
produced the bogus calibration in section 7.

## 2. Distance: wheel calibration re-check

| commanded | measured | error |
|---|---|---|
| 5 cm  | 5.12 cm  | +2.4% |
| 15 cm | 15.28 cm | +1.9% |
| 5 cm  | 5.10 cm  | +2.0% |
| 5 cm  | 5.16 cm  | +3.2% |
| 5 cm  | 5.07 cm  | +1.4% |

Left at 0.7842 mm/deg: a consistent ~2% against a camera that is itself
calibration-stale is not worth chasing.

## 3. Turn scale: two operating points

Both points really rotated, and both over-rotate.

**Point A — b = 120.0 mm** (compiled 114.2 / 0.952). Six alternating whole
revolutions:

| # | commanded | residual | actual |
|---|---|---|---|
| 1 | +360 | +25.14 | 385.14 |
| 2 | -360 | -27.29 | 387.29 |
| 3 | +360 | +25.66 | 385.66 |
| 4 | -360 | -27.00 | 387.00 |
| 5 | +360 | +27.29 | 387.29 |
| 6 | -360 | -27.50 | 387.50 |

Mean actual 386.65 deg, ratio **1.0740**. CCW mean 386.03 vs CW 387.26 -- a 0.3%
difference, so there is no meaningful direction bias and this is a scale error,
not a left/right imbalance.

**Point B — b = 128.9 mm** (114.2 / 0.886):

| commanded | actual | ratio |
|---|---|---|
| +90  | +105.9 | 1.176 |
| -90  | -105.3 | 1.170 |
| +180 | +206.8 | 1.149 |
| +360 | +420.5 | 1.168 |

Mean ratio **1.1658**.

**Two independent solutions for the true b:**

    120.0 / 1.0740 = 111.7 mm
    128.9 / 1.1658 = 110.6 mm

They agree to 1%. Take **b = 111.1 mm**, so slip = 114.2/111.1 = **1.028**.
A slip above 1 is not an error: it says only that the robot rotates as though
narrower than its caliper track width.

Note this is exactly what `calibrateTurn()` in `test/calibratel.ts` computes:
`bNext = b * deg/trueDeg` = 119.96 * 360/386.65 = 111.7 mm. **That formula is
correct.** An earlier revision of this log called it inverted; see section 7.

### Verified at b = 111.1 mm (slip 1.028)

Flashed and re-measured. PARTIAL turns are the primary probe here, deliberately:
a whole revolution cannot tell a perfect turn from no turn at all, which is the
trap in section 7.

| commanded | actual | error | ratio |
|---|---|---|---|
| +90  | +90.40  | +0.40 | 1.0044 |
| -90  | -90.57  | +0.57 | 1.0063 |
| +180 | +181.64 | +1.64 | 1.0091 |
| -180 | -180.18 | +0.18 | 1.0010 |
| +360 | +359.15 | -0.85 | 0.9976 |

Mean |error| 0.73 deg, worst 1.64 deg, mean ratio 1.0037 -- **0.37%**, against
7.40% at the compiled default and 16.5% at b = 128.9 mm. Correct in both
directions and at every magnitude.

The robot's own odometry agrees now (91.89, -92.01, 181.68, -180.75 deg
reported), where at b = 0.13 mm it reported 104.58 / -209.16 / 557.75.

The remaining 0.37% is left alone: it is well inside the per-move heading
scatter of section 4, and the camera is calibration-stale.

## 4. The per-move heading disturbance

Yaw change during nominally STRAIGHT drives (these DID execute -- distance came
out right every time):

| move | distance | yaw change |
|---|---|---|
| sweep 5  | 5.12 cm  | +11.1 deg |
| sweep 15 | 15.28 cm | +10.8 deg |
| sweep 5  | 5.10 cm  | +1.5 deg  |
| sweep 5  | 5.16 cm  | +9.5 deg  |
| sweep 5  | 5.07 cm  | +6.8 deg  |

Always leftward, but neither constant per move nor proportional to distance, so
neither curvature nor a fixed start-of-move kick. Most consistent with the
tail-dragging caster swivelling into line. NOT corrected.
`ConfigField.StraightTrim` (ordinal 38) is the nearest knob but the firmware
describes it as a bias proportional to commanded velocity -- a uniform curve,
which this is not.

This is also why `calt` was not used: `CALT_TOL` is 2 deg, well inside this
scatter. The camera measures the same quantity directly and repeats to ~1 deg.

## 5. The wire carries the REAL value -- the x1000 comment is wrong

    SET rotational_slip 886        -> stores 886.0    -> b = 0.13 mm
    SET rotational_slip 0.886      -> stores 0.886    -> b = 128.9 mm
    setConfigValue(..., 0.886)     -> stores 0.886    -> b = 128.9 mm

Both paths agree, and both carry the real value. Verified in source by the
pxt-nezha-diffdrive session: `WireAdapter::onSet` multiplies the wire float by
1000 and hands the rounded int to `setKernelValue()`, which multiplies by
0.001f -- net identity. `onGet` mirrors it. The x1000 IS real but lives between
`wire_adapter.cpp` and `shims.cpp`, and cancels before the wire.

So `get rotational_slip 886.000061` was the truth: the slip really was 886,
because 886 is what this bench sent. **The firmware did exactly as asked.**

The reason it was asked for the wrong thing is a comment. `config_fields.h`'s
`ConfigFieldDescriptor` says the unit is "of the UNSCALED value; the wire
carries it x1000 (shims.cpp's own boundary convention)", which names the wrong
boundary. Reading it, this bench sent 886 intending 0.886.

Filed against that comment as
`clasi/issues/config-fields-comment-claims-the-wire-carries-x1000.md`, with a
proposed plausibility guard -- no real drivetrain has a slip of 886, and on this
path a wrong value does not error, does not clamp and does not warn. The robot
just silently stops turning, and the readback shows the number you sent.

## 6. What `setTrackWidth()` did and did not fix

`setTrackWidth(11.42)` resolves to 11.42 * 100 * 0.1 = **114.2 mm**, which is
already `motion_engine.h`'s compiled default. It is therefore a NO-OP
numerically on this robot, and it is kept in `boot.ts` only to make the geometry
explicit rather than inherited.

Short turns failing was NEVER a missing `setTrackWidth`. They worked at the
start of the session on compiled defaults (`turn 63` executed, +70.8 deg by
camera), broke immediately after `SET rotational_slip 886` put b at 0.13 mm, and
came back when the TS value restored a sane b. The flash changed two things at
once and only the slip mattered.

## 7. Retractions

Three conclusions were published from this bench and are withdrawn.

1. **"slip 0.886 gives 0.14% per revolution."** Measured with b = 0.13 mm, where
   the robot was not rotating at all. A 360's residual is ~0 whether it turns
   perfectly or never starts. The trap was identified in an earlier revision of
   this log and then dismissed by citing `cyc +82` as proof of motion -- but a
   later run showed `cyc +62` on a "360" with -0.07 deg of real rotation, so the
   cycle counter never proved it. **A whole revolution is the wrong probe for
   whether a turn happened.** Partial turns, or a mid-turn fix, would have
   caught it immediately.
2. **"Rotation goes as 1/b, so calt's formula is inverted."** Backwards.
   `yawTarget` is proportional to b, and `calt`'s `bNext = b * deg/trueDeg` lands
   on the same 111.7 mm the camera gives.
3. **"The robot moved 20 cm with no command"** and **"resetPose() is not zeroing
   the heading."** The first was Eric moving the robot by hand -- on a bench
   someone is standing at, rule the human out FIRST. The second was the same
   tiny-b artefact: heading = (dRight - dLeft)/b with b = 0.13 mm produces the
   104.58 / -209.16 / 557.75 deg readings. `move()` reported correctly for the
   geometry it was given.

All three were reported to the pxt-nezha-diffdrive session before being checked,
and two of them nearly became firmware issues against code that was behaving
correctly.

## Not done

- The residual 0.37% turn-scale error was not chased; it is inside the noise
  this bench can measure.
- The heading disturbance of section 4 is unfixed and dominates short-move
  accuracy.
- `cald` was not re-run; slip affects rotation, not distance, so it should be
  unchanged -- an inference, not a measurement.
- Nothing was calibrated against the tape lines; the camera replaced them.
- The camera's `calibration_stale` was never cleared.
