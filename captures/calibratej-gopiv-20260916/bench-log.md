# Calibrate J on gopiv, 2026-09-16

Wheel travel measured over a straddled run between two lines, on the "eye" field:
two parallel tape lines 90.5 cm apart, joined by a single stripe down the middle
that the robot straddles as it drives. Eric's design; the stripe is what keeps the
run straight on a robot whose wheels may not match, so the distance measured is a
distance and not the chord of an arc.

Robot **gopiv** (AprilTag 54), reached over nada's `_mbserial` export at
192.168.4.53:40117. Overhead camera `arducam-ov9782-usb-camera` (camera 4).

## Result

**Wheel travel 0.786 mm/deg, wheel diameter 90.07 mm** -- from 12 clean forward
runs, mean odometry **90.408 cm** against a **TAPE-MEASURED 90.2 cm**, sd 0.25 cm
(0.28%), standard error of the mean 0.081%.

The robot over-measures distance by **0.23%** on the compiled default of
0.7878 mm/deg (implied diameter 90.28 mm). At 2.9x the standard error that is a
real offset rather than run-to-run noise, and worth correcting: 0.23% is 4 mm
over a 2 m drive. Baked into `test/boot.ts` under a `gopiv` name guard.

Individual runs (cm): 90.20, 90.40, 90.45, 90.45, 90.45, 90.65, 90.10, 90.70,
90.80, 89.90, 90.35, 90.45.

The first 9 of those gave 0.30% and 3.5 sigma; the full 12 give 0.23% and 2.9.
Both say "real, and worth fixing", but the drop is a fair warning against reading
a small sample too precisely.

### An earlier revision of this log said gopiv needed no calibration. That was wrong.

It used the overhead camera's 90.5 cm for the line spacing, which made the same
9 runs come out at 0.7881 mm/deg -- 0.04% from the default, i.e. "no correction
needed". The camera was out by **0.37 cm, or 0.41%**, which is LARGER than the
entire 0.25% run-to-run spread the controller work had been tightening.

The whole calibration scales linearly by this one reference length, so it deserves
the most trustworthy measurement available. A stale-flatfield camera is not that.
**Tape-measure the field.**

## The field

Camera-surveyed from the rectified playfield image:

- start and finish lines, vertical: **90.57 cm** centre-to-centre
  (90.48 cm between near edges -- the tapes are 1.85 and 1.68 cm wide)
- centre stripe, horizontal: **1.68 cm** thick
- the stripe exists only BETWEEN the two lines. East of the start line there is
  no stripe, so a sensor reading taken there says nothing about lateral alignment.

Camera 4 reports `flatfield-stale`, so 90.5 cm carries unknown scale error and it
lands directly in the wheel number. A tape-measured figure passed as `RUN calj
<cm>` would be strictly better than the camera's.

## How the robot finds the edge from four bits

Channels sit at +3.0, +0.6, -0.6, -3.0 cm from the centre line, channel 0 on the
robot's LEFT (`linetrack.ts`). Measured, not published by ELECFREAKS. The stripe
is narrower than the channel spacing, so with `e` the stripe's left edge in the
robot frame and W the stripe width, black covers channel i exactly when
`e - W < lateral_i < e`, and inverting that:

    e = mean(lateral of dark channels) + W/2

      ..#.   e = +0.24   the aim -- only channel 2 dark
      .##.   e = +0.84
      .#..   e = +1.44
      #...   e = +3.84   far right of the line
      ...#   e = -2.16   far left of the line
      ....   BLIND

`....` is ambiguous: it happens on BOTH sides, because a 1.68 cm stripe fits
entirely inside the 2.4 cm gap between the inner and outer channels.

## Forward controller

Proportional on that error, with a deadband, at 8 cm/s. Bang-bang was tried first
and oscillated -- on a 24 ms tick it can only cross and re-cross. Results over the
9 runs: **mean lateral error 0.07-0.18 cm, 2.2-5.5 crossings/m, 0.4-5% of ticks
blind**. Camera confirms lateral drift under 1 mm across a full 90 cm run.

The error estimate is quantised: `..#.` spans a 1.2 cm band, so anything inside
+-6 mm is invisible to the robot. `mean=0.07cm` means "in the centre band most of
the time", and raising Kp from here adds crossings rather than removing them.

## Reverse controller -- a different problem, not the same one backwards

The sensor bar sits ~17 cm AHEAD of the axle, so reversing it TRAILS. With L the
lever:

    e_dot = -(v*psi + L*omega)      psi_dot = omega

Pure proportional control omega = Kp*e gives

    e_doubledot + L*Kp*e_dot + v*Kp*e = 0

stable only if BOTH `L*Kp > 0` and `v*Kp > 0`. Forward (v>0) Kp>0 satisfies both.
**Reversing (v<0) they contradict: no pure-P gain of either sign can hold the
line.** Adding heading feedback omega = Kp*e + Kh*psi gives determinant `Kp*v`, so
reverse needs **Kp NEGATIVE** -- the sign flips, exactly like reversing a car: to
move the trailing end left you steer right. The trace condition wants `Kh < L*Kp`,
heading damping of the same sign.

Final gains: **Kp = -0.7, Kh = -0.22, Ki = 0**, 11 cm/s. Heading comes from
odometry zeroed at the start of the return, so it IS the heading error relative to
the line.

Results, six consecutive returns: **91.5-91.8 cm completed every time, mean
error 0.22-0.40 cm, 0-1 crossings, max 1.2 cm, final heading within 1.5 deg**.
The last three had **zero** crossings apiece.
Against a blind straight reverse over the same ground: **+12.8 cm lateral and
+17 deg** of drift.

### The integral had to go, and could never have worked

Ki = -0.015 was tried first and failed at 68.9 cm with the heading walked out to
-6.6 deg. The telemetry named the cause: the gap between the commanded steer and
`Kp*err + Kh*h` was a constant **-0.90**, which is exactly `Ki * IMAX`
(-0.015 * 60). The integral was pinned at its clamp and cancelling the heading
correction.

The reason is structural, not tuning. **The aim point is the EDGE of the `..#.`
band**, so err reads 0 or +0.6 in normal tracking and can only go negative once
the stripe reaches channel 3. The error is not zero-mean, so the integral
accumulates one way by construction. An integral on a non-zero-mean error was
never going to work; it is disabled, and must stay disabled unless the error is
recentred.

## Wheel balance

`bias` is the mean wheel-speed differential the controller had to hold. Across the
forward runs: -0.121, -0.105, +0.007, +0.015, +0.022, +0.078. Small and
sign-varying, i.e. **no measurable wheel mismatch on gopiv**. Note this is a
statement about the two wheels matching EACH OTHER, and is unaffected by the
reference-length error above: both wheels are the same size, and that common size
is 0.30% smaller than the firmware default assumes.

## Per-wheel diameters: measured, and NOT different

Eric's hypothesis: drive straight, and if the wheels are different sizes the
encoders must show it, because both wheels cover the same ground and the smaller
one turns through more degrees. Correct in principle, and `TLM FULL` carries the
instrument: **`posl`/`posr`, per-wheel encoder positions** (alongside `vl`/`vr`
and `dutl`/`dutr`).

**Result: no measurable difference. -0.23% +- 0.15% (three line-following runs),
or +0.07% +- 0.24% pooling all eight runs. gopiv's wheels match to within about
a quarter of a percent, which is the resolution of this method.**

### The raw ratio is NOT the measurement

`posl/posr` equals the inverse diameter ratio ONLY if the robot's rotation is
zero, because any real rotation puts `D_R - D_L = dpsi * b` straight into the
encoders. It is not a small term. Two pairs of IDENTICAL runs:

    open-loop   pass 1 +1.337%   pass 3 -1.179%
    line-follow pass 1 +0.550%   pass 2 -0.453%   pass 3 +0.403%

A wheel diameter cannot change sign between two runs. The correction is

    r_R/r_L = (theta_L/theta_R) * (2D + dpsi*b) / (2D - dpsi*b)

with D the camera-measured travel and dpsi the camera-measured heading change.
Applying it collapses the spread toward zero:

| run | raw | corrected |
|---|---|---|
| open-loop 1 | +1.337% | +1.30% |
| open-loop 2 | +0.109% | +0.70% |
| open-loop 3 | -1.179% | +0.23% |
| open-loop 4 | +0.176% | -0.15% |
| earlier     | -0.668% | -0.83% |
| line 1 | +0.550% | -0.03% |
| line 2 | -0.453% | -0.51% |
| line 3 | +0.403% | -0.14% |

### Line-following is 3x the precision of open-loop

sd 0.25% against 0.81%. The tape physically constrains the path over the full
90 cm, where an open-loop "straight" drive only has the firmware's twist hold --
which let through up to 4.13 deg of rotation, the very term that swamps the
measurement.

### What limits it

A +-0.5 deg camera heading error alone moves the answer +-0.17%, so this method
cannot resolve much below a quarter of a percent however many runs are averaged.
Reading the encoders against a mechanically-guaranteed straight path (a rail, or
a much longer line) is what would sharpen it.

### Retracted along the way

- "right wheel 0.67% smaller" -- one uncorrected sample; reads -0.83% corrected,
  inside a spread that straddles zero.
- "right wheel 0.44% larger" -- 17% wheel slip, the robot had driven off the
  paper onto bare wood. The slip guard (camera travel vs odometry, +-4%) exists
  because that run looked entirely plausible.
- "mismatch < 0.34%, from open-loop arcs" -- invalid reasoning. It assumed equal
  commanded speeds give equal encoder rotation, but the twist hold deliberately
  drives the wheels unequally to hold heading, so a small arc does not imply
  matched wheels.
- The `bias` figures reported earlier are the CONTROLLER'S COMMANDED differential,
  not a physical measurement. Reading control effort as if it were geometry is
  what produced the first wrong answer.

## Failure catalogue

Every return-leg failure before the controller ever got a fair test, with its
actual cause. None was the control law:

| failure | cause |
|---|---|
| return drove blind, no metrics | stage 0 waited for `bits == 0`, but the stripe holds an inner channel dark past the finish line -- it never came true |
| return exited after 1.5 s | the host's completion marker `CALJ:home` matched the opening banner, so the client left while the robot drove on |
| return ran into the rails | blind reverse for 92-140 cm with a 110 cm cap not yet in place |
| forward stalled at 10 cm, four times | phase 2 gated on the BAR; if the stripe lies under an outer channel the condition can never be satisfied, and the phase-3 acquisition search that fixes exactly that offset never runs. Now distance-based |
| forward drove off the stripe | start heading 12.6 deg off west. No search amplitude can beat a robot travelling diagonally away from the line |
| return lost the line at 68.9 cm | integral windup, above |

Three of those bad start conditions were produced by the setup procedure itself:
a plain `sweep -N` reposition has no heading control and drifts ~0.21 deg/cm in
reverse; `goto.py`'s final alignment turn translates the robot ~1.3 cm laterally;
and parking at x=52 puts the sensor bar within millimetres of the start tape, so
whether it read clear was luck. Fixed by converging heading to 2 deg before
running, gating the cycle at 3.5 deg, and parking at x=55.3.

## The cycle sustains for about four runs, then needs a heading re-align

Three consecutive out-and-backs ran with no intervention: each forward leg started
from wherever the previous return parked the robot, and lateral position held at
y = 1.25-1.56 throughout. But the START HEADING walks:

    rep 1  178.75      rep 2  177.49      rep 3  177.38      after rep 3  176.00

The return leg leaves roughly **0.75 deg of residual heading error per cycle**, so
it accumulates and trips the 3.5 deg start gate after about four runs -- which is
exactly what happened on the fourth. So "self-sustaining" holds for three or four
cycles, not indefinitely, and the log should not claim more than that.

The correction is applied in the HOST (`cycle.sh` re-aligns from the camera when
the gate trips), not in firmware. VERIFIED: three further cycles each tripped the
gate at 175.5-176.1 deg, re-aligned from the camera, and completed normally. With
that in place the cycle runs unattended indefinitely rather than for three or four
runs. The forward leg is what feeds the walk -- it ends 2.9-4.3 deg off. A heading-null at the end of `caljHome` would
have to go through `move(0, yaw)`, and gopiv's turn calibration has never been
measured -- correcting a 1 deg error with an uncalibrated turn is not obviously
an improvement. The camera knows the heading to ~0.1 deg; it is the right
authority.

## Not done

- Other calibrations from tonight that used camera-derived references on the same
  stale setup should be re-checked against a tape -- in particular tovez's wheel
  calibration, which used a camera-surveyed 31.35 cm line spacing and may carry a
  comparable error.
- The board still needs re-flashing with CALJ_TRUE_CM = 90.2 so its own reported
  calib is right without recomputing by hand.
- Return-leg blind ticks are 5.7-9.3%, against 0.4-5% forward. Tolerable, not
  chased.
- `caljHome`'s failure paths return before emitting `homeosc`, so a failed return
  makes the host wait out its full timeout.
- `goto.py` aligns heading last, after positioning; a large final turn therefore
  shifts the robot laterally. Aligning first, or re-checking position after
  aligning, would fix it.
