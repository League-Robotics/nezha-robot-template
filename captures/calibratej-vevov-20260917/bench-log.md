# Calibrate J on vevov, 2026-09-17

Wheel-travel calibration on the eye field. Robot **vevov** (AprilTag 53),
reached over null's `_mbserial` export, which is served by a Raspberry Pi and
re-enumerates to a new port on every reset.

## Result

**0.7856 mm/deg, wheel diameter 90.03 mm.** Three runs against a TAPE-MEASURED
90.2 cm:

| run | measured | calib | diameter | rms | crossings | blind |
|---|---|---|---|---|---|---|
| 1 | 90.5 | 0.7852 | 89.98 mm | 0.78 | 9.9/m | 69/738 |
| 2 | 90.35 | 0.7865 | 90.13 mm | 0.50 | 7.7/m | 47/734 |
| 3 | 90.5 | 0.7852 | 89.98 mm | 0.57 | 7.7/m | 37/734 |

sd 0.00075 (0.096%), standard error 0.055%. A 0.28% correction to the compiled
0.7878. All three acquired the stripe immediately (`acq=0`).

Corroborated across the fleet: gopiv 90.07 mm, tigez 90.1 mm, vevov 90.03 mm --
three robots inside 0.08%. `vevov.json` claims 80.77 mm, boilerplate shared with
two other configs, wrong by 11%.

## The wheel number was never the hard part

The measurement took three runs. Getting to the point where a run could happen
took the rest of the day, and every obstacle was a different subsystem
pretending to be the same one.

### The wiring was mirrored, and only a turn could show it

`vevov.json` says left_port 2, right_port 1, fwd_sign_right -1. A boot guard
written faithfully from that drove STRAIGHT correctly and turned the WRONG WAY:
`turn 20` reported odom +21.67 deg while the camera measured -18.26.

Straight-right-but-rotation-mirrored is the signature of left and right being
exchanged. Equal wheel speeds are identical under a swap, so **nothing that
drives in a line can detect it** -- and every check run before this one drove in
a line.

It is not cosmetic. With the steering sign inverted every calj correction drives
the error OUTWARD, which is exactly what the first run showed: err 0.6 -> 1.2 ->
3.6, steer pinned at the clamp, diverging monotonically rather than oscillating,
until the blind-stripe guard stopped it 6 cm off the line.

Corrected to left=M1 reversed, right=M2 forward, verified on both axes:
rotation +37 deg on a +20 command, and a straight nudge travelling along bearing
162.4 deg against an actual yaw of 161.7.

### The theoretically correct gain was unreachable

vevov's sensor bar sits ~2 cm ahead of the axle; gopiv's is ~17. Damping is
`zeta = (L/2)*sqrt(Kp/v)`, so the arm alone is a factor of ~8, and gopiv's
Kp 1.1 gives zeta 0.44 here. `calzeta` duly computed Kp 5.54 for zeta = 1.

That gain is worse than useless, because the algebra ignores the steering clamp.
At Kp 5.54 any error past 0.45 cm saturates CALJ_MAX_STEER, which at speed 5
puts the wheels at 7.5 and 2.5 -- a turning radius near 5.6 cm. The loop stops
being proportional and becomes bang-bang. Measured: it spiralled, encoder counts
1066 against 455.

Kp 2.0 needs a full centimetre of error to clamp, and completes the course at
zeta 0.6. Underdamped on paper, and the 7.7 crossings/m says so. **A gain the
actuator can deliver beats a gain that is correct only until it saturates.**

### The I2C wedge, and three wrong diagnoses of it

The Nezha brick's encoder state wedges: `posl`/`posr` freeze at 0 while the
motors still drive, so the robot moves and cannot measure that it moved.
`flags=f1` (both `wedgeSuspect` bits) and `i2cf` near `cyc` are the tells.

Diagnosed wrongly three times before it was understood:

- **"The bus is failing."** Filed as an I2C integrity fault. It was the brick
  switched off -- the micro:bit runs on the Pi's USB, so it answers HELLO,
  serves STATUS and accepts flashes while the brick is dead. `connL`/`connR` 0,
  `posl`/`posr` 0 and `i2cf` climbing is just what I2C to an unpowered
  peripheral looks like.
- **"The line sensor was never calibrated."** `barref` showed line and
  background references identical at 12,12,12,12 and the channels flickering on
  bare paper. After a power cycle the same sensor read gray 40,188,193,67 --
  paper 40-67, tape 188-193, clean wide contrast. The wedge was corrupting the
  Trackbit reads on the same bus. One fault presenting as two.
- **"A sagging battery."** Retired when the robot drove 2.2 cm at 2200 duty
  while reporting zero -- a flat pack does not do that.

**A reflash does NOT clear it; only a battery power cycle does.** Confirmed
twice today, and it matches the existing note
`i2c-wedge-is-stale-state-not-firmware`. Worse, every reflash is a micro:bit
reset and can *cause* it -- five flashes, four wedges. Iterating on firmware to
fix a robot is therefore self-defeating, which is why the wiring hypothesis was
tested with a runtime `wiretune` verb instead.

## Guards, and one that was wrong

Three refusals fired today, all correctly:

- `not on clear white -- bar=####` refused a start on the crossbar.
- `lost the stripe for 40 ticks -- stopping rather than arcing away` stopped the
  mirrored-steering run 6 cm off the line, mid-field, no rail.
- `measured 10.5cm is nowhere near true 90.2cm -- NOT reporting a calibration`
  refused a mid-course start. That guard exists because this same failure once
  produced a 778 mm wheel on gopiv, reported as though it were a measurement.

And one guard was itself defective. The dead-odometry check watched `poseX`,
which stalls legitimately while the robot turns hard -- during a saturated
correction it can even run backwards. It falsely aborted a healthy run while
`posl`/`posr` were advancing 1066 and 455. It now watches the encoder counts
directly via `probe(10)`/`probe(11)`, which is what actually stops when the bus
wedges.

## Not done

- **Turn calibration (calt).** Never run on vevov. `turn 20` produced +37 deg
  by camera, so the turn scale is wrong by roughly 2x and unmeasured.
- **The reverse repositioning stalls.** 10 cm/s is right at this fleet's reverse
  breakaway floor: a leg asked for 96 cm delivered 14.6, another asked for 60
  delivered 2.7, while others ran clean at 96. Splitting the reposition into
  25 cm legs contained it, but the floor is not characterised.
- **zeta 0.6 is underdamped** and the 7.7 crossings/m reflect it. A sweep
  between Kp 2 and the clamp-limited ceiling was never run.
- **`TLM OFF` never took.** Five attempts across two clients; the subscription
  stayed `full`. Harmless, unexplained.
