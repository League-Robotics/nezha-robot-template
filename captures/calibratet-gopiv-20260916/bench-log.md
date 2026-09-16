# Calibrate T on gopiv, 2026-09-16

Turn calibration from a **sensor-defined 180 degrees**. Eric's design: the robot
straddles the left edge of the centre stripe, pivots in place, and the four
Trackbit channels cross the stripe in sequence. The TAPE defines the angle; the
odometry is only measured against it.

Robot **gopiv** (AprilTag 54) on the eye field, over zilch's `_mbserial` export.
Runs `calj` first, which leaves the robot straddling the stripe.

## Result

**b = 11.93 cm (slip 0.957 at trackWidth 11.42), a 0.53% correction from the
compiled 12.00 cm.** Baked into `test/boot.ts` under the `gopiv` name guard.

## Why the sequence defines 180 exactly

The bar sits ~17 cm ahead of the axle, so each channel lies at its own angle off
the robot's axis, `phi_i = atan(lateral_i / 17)`: +10.0, +2.0, -2.0, -10.0 deg.
Pivoting CCW from west they go dark in order 1, 2, 3, 4 (CW: 4, 3, 2, 1), exactly
as Eric predicted, on every run without exception.

Channels 1 and 2 straddle the centre line symmetrically, so the midpoint of their
entry angles is 180 -- and channels 0 and 3 give the same number on a wider
baseline. Those two estimators agreed to **0.04-0.83 deg** across every pivot
recorded, most often under 0.3. That agreement is what makes a single pivot's
geometry trustworthy.

## The two things that make it converge, and both are Eric's

### Pair the turns: it cancels the start heading

A pivot accumulates odometry from WHEREVER IT BEGAN. A `..#.` reading pins the
robot's lateral position on the edge but says nothing about which way it POINTS:
it can straddle perfectly while crabbing. That unknown angle adds to a CCW pivot
and subtracts from a CW one, so **the pair mean cancels it**.

The within-pair splits ARE that angle, doubled: 6.29, 2.72, 3.40, 1.75 deg.
Individual pivots are worthless; paired, they agree to under a degree.

### Line-follow far enough first: it settles the heading

Following a line for tens of centimetres forces the heading to converge -- a
crabbing robot cannot track a line that far. The program drives 35 cm and refuses
to pivot until the steering has held inside its deadband for 25 consecutive
ticks.

The settle quality predicts the answer directly:

| pair | settle (ticks in deadband) | mean odom for a true 180 |
|---|---|---|
| A | 25 | 178.60 |
| 1 | 25 | 180.29 |
| 2 | **73** | 179.05 |
| 3 | **85** | 178.95 |
| 4 | **60** | 179.11 |
| 6 | 25 | 179.08 |

All six: mean **179.18**, sd 0.58, sem 0.24.
The three best-settled: mean **179.04**, spread **+-0.08 deg**.
The three that stopped at the 25-tick minimum: spread 1.7 deg.

Take b from the best-settled three: `12.0 * 179.04/180 = 11.93 cm`.

## What went wrong first, and it was all scaffolding

The mechanism worked from the first run. Every wrong answer came from the
program around it, and the spread was 25 degrees:

| run | start condition | result |
|---|---|---|
| 1 | straddling, ~parallel | 179.64 |
| 2 | straddling, ~8 deg off | 186.59 |
| 3 | straddling, re-centred, ~8 deg off | 186.44 |
| 4 | **blind, facing east** | 161.72 |

Mistakes, in order:

- **Claimed the midpoint estimator was position-independent.** It is not. With
  the edge offset by d from the pivot centre the midpoint reads
  `180 - arcsin(d/r)`, which is 6.8 deg for a 2 cm offset at r = 17 cm.
- **Then "fixed" that and the answer moved 0.15 deg** (186.59 -> 186.44), so
  lateral offset was not the problem either. Two confident diagnoses, both wrong.
- **Cited the inner/outer agreement as proof the method was sound.** It is not
  proof: both pairs carry the SAME bias, so they agree while both are wrong. That
  agreement tests symmetry, never centring.
- **Printed `edge=blind` and measured anyway**, reporting a confident 161.72 from
  a robot off the stripe pointing the wrong way. A plausible number is worse than
  no number; the program now REFUSES unless an inner channel sees tape and
  neither outer does.
- **Replaced "drive the length, then turn" with a 10 cm hop**, discarding the
  line-following that settles the heading -- the property the whole method rests
  on.

## Not done

- **The reversed-sense return leg.** Eric's full design turns at the far end and
  drives back with sensors 2 and 3 swapped, so each leg uses the whole 90 cm.
  This implementation instead repositions east between pairs, because two 35 cm
  settle drives do not fit in one direction: pair 2 of one run ran into the
  finish crossbar and the guard stopped it.
- **gopiv b = 11.93 cm against tovez's 11.11 cm and Eric's 111 mm calipers on
  vevov.** An 8% difference between robots of the same family, measured
  carefully by different methods. A caliper span on gopiv would settle which is
  right; it is not resolved here.
- **gopiv's pivots scatter on their own**: three identical commanded 180 deg
  turns measured 184, 180 and 192 deg by camera, each walking the robot ~2.5 cm
  sideways. Pairing and settling suppress this; the mechanics are still poor.
- One pair failed with `bar=....` after settling 67 ticks -- it drifted into the
  2.4 cm blind gap between inner and outer channels after the controller
  settled. Not understood.
