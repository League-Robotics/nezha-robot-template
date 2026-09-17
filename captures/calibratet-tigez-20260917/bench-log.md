# Calibrate T on tigez, 2026-09-17

Turn calibration from a **sensor-defined 180 degrees** on the secondary
playfield. Robot **tigez** (AprilTag 57); field geometry and the wheel-travel
run in `../calibratej-tigez-20260917/`.

## Result

**b = 11.647 cm (slip 0.9805 at trackWidth 11.42), a 2.9% correction from the
compiled 11.996 cm.** Baked into `test/boot.ts` under the `tigez` name guard.

Five well-settled pairs, each a CCW pivot and a CW pivot from the same spot:

| pair | settle (ticks) | within-pair split | odom for a true 180 |
|---|---|---|---|
| 1 | 68 | 1.89 | 176.53 |
| 2 | 120 | 1.49 | 174.47 |
| 4 | 118 | 1.56 | 176.05 |
| 5 | 121 | 5.00 | 173.08 |
| 6 | 118 | 2.39 | 173.68 |

mean **174.76**, sd 1.49, standard error **0.67 deg**. The correction is 5.24
deg, about 8 sigma. Pair 3 is excluded and says so itself: it settled 25 ticks
-- the minimum -- and its two halves split 4.63 deg.

Independently corroborated by the overhead camera on tigez's own turns, which
share nothing with this method but the robot: a commanded -30 read **-33.15 deg
of odometry against -35.0 by camera**, and a -76 read **-76.72 against -78.7**.
Those ratios, 0.947 and 0.975, put a true 180 at 170-176 deg of odometry.

## The method transfers; the tolerances do not

Every structural claim from the gopiv session held here on the first pair, with
no debugging at all:

- the channels cross in strict order, 0-1-2-3 turning CCW and 3-2-1-0 turning
  CW, on every pivot without exception;
- the inner and outer estimators agree, **0.16 to 0.69 deg** across every pivot
  recorded;
- the entry spreads match the geometry: the inner pair came out 5.8-7.0 deg
  apart against `2*atan(0.6/9) = 7.6`, the outer pair 37-38 deg against
  `2*atan(3/9) = 36.9`. That is the 9 cm lever measuring itself.

What does NOT transfer is how much care the pivot's placement needs, and the
reason is the same 9 cm.

### A short lever makes this measurement twice as fussy

The midpoint estimator reads `180 - arcsin(d/r)` for a stripe edge offset d from
the pivot centre. gopiv's r is ~17 cm; tigez's is 9. **The same offset is very
nearly twice the error**: 1 cm of lateral offset costs gopiv 3.4 deg and tigez
6.4.

And the robot cannot see an offset smaller than its own channel spacing. A
`..#.` reading spans a 1.2 cm band, so `CALT:centred ... edge=0cm` means "inside
that band", which on this robot is **+-3.8 deg of pivot error that the program
cannot detect**. That is the floor under the 1.49 deg sd above, and it is why
five pairs are wanted here where gopiv got away with three.

Pairing does not help with this one. It cancels the START HEADING, which enters
a CCW pivot and a CW pivot with opposite signs; `arcsin(d/r)` enters both the
same way and survives the average. Only averaging pairs with INDEPENDENT lateral
offsets beats it down, which is what restaging between pairs provides.

## Where the pivot happens is a property of the FIELD

This field has three full-width lines, not two: a mid-field line crosses the
stripe at its midpoint (surveyed at x = -0.3 .. +1.5, between crossbars at -37.5
and +38.8). The pivot sweeps the bar around a circle of the lever's radius, and
**every piece of tape that circle touches is a false entry angle**.

The compiled 35 cm recentre, measured from the start crossbar, stops the robot
almost exactly on that mid-field line. So `CT_RECENTRE` and `CT_SETTLE_EXTRA`
became `let`, set over the wire by `cttune`, and this session ran
`RUN cttune 5 58 8`:

    bar staged at x = -20, back off 12 -> -32, recentre 58 -> bar +26, axle +17
    sweep circle spans +8 .. +26, clear of the mid line by 6.5 cm and of the
    finish crossbar by 12.8 cm

The longer drive costs nothing and buys something: 58 cm of line-following
settles the heading better than 35, and the settle counts show it -- 118 to 121
ticks where the minimum is 25.

## Two staging routes, and when each one works

- **`RUN caljhome <cm>` is the good one.** It line-follows in reverse to the
  start crossbar, so the robot arrives square TO THE TAPE -- which on tigez is
  7 deg away from square to the camera, because the sensor bar is mounted skew
  (see the calj log). Its argument is not the course length: it is the distance
  from the pivot spot back to the crossbar, which is what arms its line detector
  at the right line. 55 from the pivot, 50 from the mid-field line.
- **The camera is the fallback**, because it works from anywhere on the field
  and `caljhome` does not: it loses the stripe in the western third often enough
  that roughly half the restages fell through to the camera.

A straddle check before each pair (`RUN bargray`, restage unless an inner
channel sees tape and neither outer does) is what keeps a bad start from costing
a pair rather than being averaged into one.

## Not done

- **The 9 cm lever's quantisation floor is not beaten, only averaged.** A pivot
  that first nudged itself laterally until the bar read the SAME pattern in both
  directions would centre to a fraction of the channel spacing rather than to
  the band; nothing here does that.
- **Eric's full design -- turn at the far end and drive back with sensors 2 and
  3 swapped** -- is still not implemented, on this robot or on gopiv. This
  session restages between pairs instead, which costs a minute each.
- **b = 11.647 cm against gopiv's 11.93 and vevov's caliper 11.16.** Three
  robots of one family spanning 7%. A caliper span on tigez would say whether
  that is real; it was not taken.
- **The excluded pair's 169.23** is consistent with a ~1 cm lateral offset and
  nothing else was wrong with it, but that was not confirmed against the camera
  at the moment of the pivot.
