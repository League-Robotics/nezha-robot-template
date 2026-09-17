# Calibrate J on tigez, 2026-09-17

Wheel-travel calibration on the **secondary** playfield, against a
**TAPE-MEASURED 75.8 cm** between the crossbars' leading edges (Eric). Robot
**tigez** (AprilTag 57), flashed and driven over naught's `_mbserial` export;
overhead camera `hd-usb-camera` (camera 3). Field geometry in
`field-survey.md`.

## Result

**No wheel correction. tigez's compiled default is already right.**

Ten runs of the 75.8 cm course measured a mean of **75.865 cm**, an error of
**+0.09%** with a standard error of **0.157%**. The compiled 0.7878 mm/deg
implies a 90.28 mm wheel; these runs say **90.20 +- 0.14 mm**. That is a
difference of 0.6 sigma, so `setWheelCalibration` is deliberately NOT baked for
tigez -- fitting a correction smaller than the standard error is fitting noise.

| run | staged by | start | finish | measured | rms | cross/m | blind | acq |
|---|---|---|---|---|---|---|---|---|
| 1 | caljhome | 1.50 | 77.60 | 76.10 | 0.51 | 1.3 | 3 | 0 |
| 2 | caljhome | 1.40 | 77.60 | 76.20 | 0.37 | 1.3 | 4 | 0 |
| 3 | caljhome | 1.10 | 77.50 | 76.40 | 0.40 | 1.3 | 12 | 8 |
| 4 | camera | 2.05 | 77.60 | 75.55 | 0.26 | 0.0 | 0 | 0 |
| 5 | camera | 1.60 | 78.00 | 76.40 | 0.82 | 6.5 | 75 | 53 |
| 6 | camera | 1.90 | 77.70 | 75.80 | 0.24 | 0.0 | 0 | 0 |
| 7 | camera | 1.90 | 77.60 | 75.70 | 0.27 | 0.0 | 0 | 0 |
| 8 | camera | 1.95 | 77.40 | 75.45 | 0.23 | 0.0 | 0 | 0 |
| 9 | camera | 1.90 | 77.40 | 75.50 | 0.49 | 2.6 | 17 | 0 |
| 10 | camera | 1.85 | 77.40 | 75.55 | 0.49 | 2.6 | 18 | 0 |

Across the fleet: gopiv 90.07 mm, vevov 90.03, tigez 90.20. Three robots, three
fields, three sessions, inside 0.2%. `calibration.json` claims a **116.05 mm**
wheel for tigez, which is wrong by 29% and should not be used by anything.

### The scatter is a systematic, and it is not resolved

The ten runs fall into two clusters that do not overlap:

- staged by the robot's own return leg (`caljhome`): **76.23 +- 0.15** cm
- staged by the camera: **75.71 +- 0.33** cm

0.7% apart, which is larger than the correction being looked for. Averaging
them -- which is what the headline number above does -- buries a systematic
rather than measuring one, and that is the honest reason no correction is baked:
the two staging methods disagree by more than the thing they are being used to
measure.

## The field is not the field the program was written for

`calj` assumes the course has exactly two full-width lines: the start and the
finish. This one has **three**. The stripe the robot straddles is crossed at its
midpoint by the perpendicular arm of a second course -- surveyed at x = -0.28 ..
+1.51 cm, the same 1.9 cm wide as the crossbars at -37.5 and +38.8.

All four channels go dark there, which is the finish detector's entire trigger.
Unmodified, `calj` would have measured 37 cm of a 75.8 cm run, and the tolerance
guard would then have thrown the run away -- a correct refusal of a number that
was never going to be right, and one that would have looked like a robot fault.

Three places had to learn the difference between *a* line and *the* line
(commit `calj/calt: the finish is not the only full-width line`):

- **the finish detector is armed by distance**, at the tolerance guard's own
  bound. Anything shorter than `(1 - CALJ_TOL_FRAC) * trueCm` is discarded as a
  measurement anyway, so accepting it as the finish can only turn a good run
  into a refused one, and a field without a mid-line never reaches the test
  before its real finish;
- **`caljHome` takes the course length** for the same reason -- returning from
  the finish it would otherwise stop 37 cm short, leaving the next run to start
  from the middle of the field;
- **every straddle loop holds course across a full-width line** instead of
  steering on it. All four dark says nothing about where the stripe is:
  `caljEdge()` reads `####` as an edge 0.6 cm left of the aim, and the
  controller leans into a correction the tape never asked for.

Every run since reports `mid-field line at 37.2-37.6cm -- holding course, not
the finish` and goes on to finish at the real crossbar.

## What the run looks like on this robot

tigez tracks the stripe better than either robot calibrated before it:
**1.3 crossings/m or fewer, and 0/m on most runs**, against gopiv's 2.2-5.5 and
vevov's 7.7-9.9. Mean lateral error 0.09-0.2 cm, and the typical run spends the
whole course reading `..#. err=0`.

That is the lever arm, not luck. tigez's bar sits **9 cm** ahead of the axle --
between gopiv's ~17 and vevov's ~2 -- and `zeta = (L/2)*sqrt(Kp/v)` puts the
compiled gains (speed 8, Kp 1.1) at **zeta 1.67** on that arm, near enough to
critical that nothing had to be tuned. Both other robots needed work here:
gopiv sits at 3.15 and vevov could not reach 1 at all without saturating its
steering clamp. Set with `RUN caltune 8 1.1 2.5 0.3 9`; only the lever changed,
and the lever only changes the reported damping, not the loop.

## Getting the robot to the start line was the whole job

The measurement itself is fifteen seconds. Everything that went wrong went
wrong before the robot ever crossed the start line.

### The line sensor was dead, and said so in a way that looks like a bug

First contact: `bar=.... gray=0,0,0,0`, learned references `23,23,23,23`, on a
robot whose motors, I2C and radio were all healthy (`connL=1 connR=1 i2cf=0`).
Flashing did not fix it. **A battery power cycle did**, immediately and
completely: the same sensor came back reading `gray=30,11,9,14` on paper and
`129` on tape.

This is the third robot in three sessions to present it, and the note
`i2c-wedge-is-stale-state-not-firmware` already says it: **a reflash is a
micro:bit reset and does NOT clear the brick's state; only a battery power cycle
does.** Worth adding: with the brick in that state the line sensor reads *zero*
rather than *noise*, so it is easy to file as a threshold problem and start
chasing the wrong subsystem, which is exactly what the vevov log records.

### The robot was 10 cm off the stripe, and no amount of sensor work could tell

After the power cycle the bar read correctly and still saw nothing, for
27 cm of driving. The stripe was **10.3 cm north of the robot** -- and a bar that
sees no tape cannot distinguish "off the line" from "no line here".

The camera settled it in one frame. That is the division of labour this field
needs, and it is the opposite of the intuition: **the camera knows where the
robot is on the field, the robot knows where the tape is under its bar**, and
neither can do the other's job. `aprilcam camera tags` plus one rectified frame
gave the field survey, the robot's pose, and the answer, in about a minute.

### A tag on the stripe is a bar OFF it

The AprilTag is not the sensor bar. On tigez the bar leads the tag by **8.3 cm**
and sits **1.94 cm to the tag's right** -- measured, not assumed: drive the
robot at the stripe head-on with `RUN sweep` and note the travel at which the
bar goes dark against the camera's tag y.

Three staging attempts failed before that lateral offset was measured. Staging
the *tag* on the stripe leaves the *bar* 2 cm off it, which reads `#...`, and
`caljhome` then loses the line within 20 cm and stops. Staging the tag at
`stripe_y + 1.94` instead works first time, every time.

There is a related trick worth keeping: **put the AXLE on the line when a turn
is coming.** The robot pivots about its axle, so an axle on the line leaves the
bar on the line whatever heading it ends up facing; a bar placed on the line
swings 9 cm off it the moment the robot turns.

### The order of the staging moves matters more than their accuracy

The first automatic re-stage corrected the lateral position, then drove 79 cm in
reverse to the start -- and arrived 2.6 cm off, because **the long drive walks
the robot sideways by more than the correction was worth**. Reversed: drive the
length first, square up, fix the lateral offset last, where nothing long follows
it. It converges in one pass.

## The start trigger is what limits this measurement

The finish trigger is repeatable to **0.2 cm** across every run (77.4-78.0 cm).
The start trigger spreads nearly a centimetre (1.1-2.05 cm), and since
`measured = finish - start`, that spread IS the entire run-to-run scatter -- the
two are almost perfectly anti-correlated.

`calj` takes both triggers on the same event, all four channels dark, precisely
so the trigger lag cancels in the difference. The lag only cancels if the SKEW
is the same at both ends. At the finish the robot has been straddling the stripe
under closed-loop control for 75 cm and arrives however the controller leaves
it; at the start it carries whatever the staging gave it. Those are not the same
thing, and the two staging methods gave measurably different starts.

### The sensor bar is mounted about 7 degrees skew

Measured, twice, in two commands. Staged square by the camera (yaw 1.3 deg), a
`RUN sweep 8` across the start crossbar reads the four channels entering at
**1.5, 1.9, 2.0 and 2.2 cm** -- a least-squares slope of -0.115, so **6.6 deg**
of skew between the bar and the tape. Turning the chassis until the camera read
**8.1 deg** made all four channels go dark **in the same tick**: `....` straight
to `####`.

The west crossbar is square to the stripe to within a degree (it occupies
exactly 1.92 cm of x across a 16 cm band of y in the rectified frame), so the
tape is not what is tilted. The bar is.

Two consequences, and the second is the one that cost time:

- **"Square by the camera" and "square to the tape" are different poses on this
  robot, 7 deg apart.** Any staging has to choose one deliberately. `caljhome`
  chooses the tape, because it has just line-followed over that tape; the camera
  staging chooses the tag.
- **A 0.7 cm trigger spread at the start** is the same order as the 0.53 cm
  between the two clusters, and of the same sign.

### `RUN call` cannot square against this crossbar

The obvious fix -- square the robot to the start line with the four channels'
first-touch, which is exactly what Calibrate L exists for -- does not work here,
and the reason is the field:

    CALL:fwd fail dark for more than 6cm -- off the paper, a shadow, or a stuck
    sensor, not tape

`call` drives across the line and waits for every channel to come clear again.
Past this crossbar the centre stripe runs on and holds an inner channel dark, so
that never happens and its own sanity guard stops it. The same shape of bug
`calj`'s phase 2 and `caljHome`'s stage 0 both already work around.

So squaring to the tape here needs either a `call` that clears on the OUTER
channels (as those two do), or an approach from the far side of the crossbar
where there is no stripe. Neither was attempted.

## Not done

- **Squaring to the crossbar before each run.** It is the one change that should
  cut the scatter rather than average it down, and `RUN call` cannot do it on
  this field as written (above). Until then the 0.7% staging systematic stands,
  and it is the reason the wheel number is reported as "no correction" rather
  than as a small one.
- **A second opinion on 75.8 cm.** Everything scales linearly by it. The camera
  says 76.31, which is 0.67% longer; one of the two is wrong by more than the
  entire measurement being made, and only the tape has been trusted here.
- **The mid-field line's effect on the straddle statistics** is unquantified:
  the hold-course ticks take no statistics at all, so `rms` and `crossings`
  describe 74 cm of the course, not 75.8.
- **The reverse return leg loses the stripe in the western third**, repeatably:
  `bar=....` from about 33 cm with the heading still inside a degree. It
  recovers the run about half the time and needs a camera re-stage the rest.
  Not diagnosed; the forward leg over the same ground is clean.

## Transport notes, because they cost more time than the measurement

- **naught's `_mbserial` export goes `ERR busy` and stays there** when a client
  is killed mid-command. The daemon holds the session for the dead peer; it
  cleared on its own after roughly half an hour. A `FLASH` preempts it (§9.4 of
  the mbdeploy manual) but that is a board reset, which on this fleet risks the
  I2C wedge for the sake of a socket.
- **tigez's own WiFi is the faster path and the less reliable one.** Pinned
  directly at `192.168.1.224:7654` it answers in 0.05 s against the export's
  4 s handshake -- but it stalls after the first few lines of a long reply, so
  the tail of a `calj` or `calt` report is simply missing. One `calt` pair ran
  to completion with no client attached at all and its answer only surfaced
  later, flushed out of the daemon's buffer by an unrelated `STATUS`.
- Pinning the host (`bot.mjs --host`) also sidesteps discovery, which lost
  tigez's WiFi record entirely part-way through the session while a raw socket
  to the same address worked fine.
