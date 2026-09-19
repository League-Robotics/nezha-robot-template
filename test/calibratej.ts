// calibratej.ts — calwheels: wheel travel per shaft degree, measured over a
// straddled run between two lines.
// Menu picture: two uprights joined by a bar, or RUN calwheels [cm]
//
// NAMED calwheels SINCE 2026-09-18. It was `calj` ("Calibrate J") and the
// file keeps that name, along with the CALJ_ constant prefix, because
// renaming those buys nothing and breaks every capture log and config note
// that cites them. What had to change is the WIRE name: a fleet of letters
// (calx, cala, call, calt, calj, calc) is unreadable to anyone who did not
// write them, and two of those letters had already been mixed up in
// conversation the same day. The verb now says what it measures.
//
// SETUP. The "eye" field: two parallel lines across the robot's path (start and
// finish) joined by a single stripe running between them, down the middle. The
// robot starts on clean white, BEHIND the start line, pointing along the stripe.
//
// THE RUN, in four phases:
//   1  creep from white until ALL FOUR channels read dark -- that is the start
//      line, and where the distance measurement begins;
//   2  keep going until the OUTER channels clear again, which is the robot
//      leaving the start line and arriving on the stripe;
//   3  straddle the stripe's left edge until ALL FOUR read dark again -- the
//      finish line, and the end of the measurement;
//   4  stop and report.
//
// WHY ALL-FOUR AT BOTH ENDS, rather than the per-channel leading edges cald
// uses. cald can average the four channels' first-touch to cancel skew, because
// each channel meets each line cleanly. Here it cannot: the stripe holds a
// channel dark continuously between the lines, so that channel never makes a
// white->dark transition at the finish. "All four dark" is the one event both
// lines produce alike, and being the same event at both ends its trigger lag
// cancels in the difference. Each trigger is placed midway between the last
// sample that read clear and the first that read dark, so the resolution is half
// a tick of travel -- about 1 mm at CALJ_SPEED.
//
// ---- WHERE THE EDGE IS, FROM FOUR BITS ----------------------------------
//
// The channels sit at BAR_LATERAL = +3.0, +0.6, -0.6, -3.0 cm (left positive,
// channel 0 on the robot's LEFT -- linetrack.ts). The stripe is NARROW, 1.68 cm
// measured, so it never covers more than two channels at once.
//
// Let `e` be the stripe's LEFT EDGE in the robot's frame, + to the left of the
// centre line. Black then spans [e - W, e], so channel i reads dark exactly when
// e - W < lateral_i < e. Inverting that: the dark channels' MEAN lateral
// position is the middle of the covered span, so
//
//     e = mean(lateral of dark channels) + W/2
//
// which recovers a position estimate from the bit pattern:
//
//     ..#.   e = +0.24   the aim -- only channel 2 dark
//     .##.   e = +0.84   edge has moved left; robot is right of the line
//     .#..   e = +1.44
//     #...   e = +3.84   far right of the line
//     ...#   e = -2.16   far left of the line
//     ....   BLIND -- see below
//
// Aiming for `..#.` means aiming for e = BAR_LATERAL[2] + W/2, not for zero;
// that offset is CALJ_TARGET below.
//
// THE BLIND STATE is why the first version oscillated. `....` happens on BOTH
// sides: the stripe is narrow enough to fall into the 2.4 cm gap between the
// inner and outer channels, and it also reads `....` when the robot has wandered
// off the stripe entirely. The first version treated "channel 2 is not dark" as
// "steer right" unconditionally, which is exactly wrong when the robot has
// drifted LEFT past the stripe: it then steers further away. Here the blind
// state instead REPEATS THE LAST KNOWN SIGN, so the robot keeps correcting the
// way it was already correcting until a channel sees tape again.
//
// PROPORTIONAL, NOT BANG-BANG. Steering is CALJ_KP * error, clamped, with a
// deadband: a small error gets a small correction instead of the full ±2 cm/s
// swing every tick. Bang-bang on a 24 ms tick cannot settle -- it can only
// cross and re-cross -- which is the oscillation Eric saw.
//
// WHY THE STRIPE IS THERE AT ALL. It keeps the run straight on a robot whose
// wheels are not matched, so the distance is a distance and not the chord of an
// arc. It also MEASURES that mismatch: holding the line takes a steady
// differential, and its mean is reported as `bias`.
//
// This file reuses lineRound() and runNumber() from runhelp.ts, and
// BAR_LATERAL from linetrack.ts
// rather than redefining them -- PXT compiles every file into one scope, so a
// second definition is a duplicate-identifier error, not a local copy.
const CALJ_BASELINE = 0.7878  // mm/deg, motion_engine.h's compiled default. Set
                              // at the start of every run so the answer does not
                              // depend on what the robot booted with.
const CALJ_TRUE_CM = 90.2     // start-to-finish, TAPE-MEASURED by Eric
                              // 2026-09-16. The overhead camera had said 90.57
                              // centre-to-centre, but camera 4 is flatfield-stale
                              // and was out by 0.37 cm -- 0.41%, which lands
                              // directly in the wheel number and is far larger
                              // than the 0.25% run-to-run spread. Measure the
                              // field with a tape; do not trust a stale camera
                              // for the one length the whole calibration scales by.
const CALJ_STRIPE_W = 1.68    // cm, the centre stripe's width, camera-measured
// ---- THE STRADDLE GAINS ARE TUNABLE AT RUNTIME ---------------------------
// `let`, not `const`, so `RUN caltune` can set them over the wire. See the
// tuning verbs at the foot of this file for why that is a requirement and not
// a convenience: robots hosted on a Raspberry Pi cannot be reflashed from the
// bench, so a gain that exists only as a compiled constant cannot be tuned on
// those robots at all.
let CALJ_SPEED = 8            // cm/s. One ~24 ms tick is ~1.9 mm.
let CALJ_KP = 1.1             // (cm/s of wheel differential) per cm of error
let CALJ_MAX_STEER = 2.5      // cm/s cap on the correction
let CALJ_DEADBAND = 0.3       // cm of error inside which it drives straight
// ---- THE LEVER ARM IS PART OF THE CONTROLLER, NOT THE CHASSIS ------------
// Distance from the axle to the sensor bar. It is NOT decoration: with the
// sensor L ahead of the axle the straddle loop is
//     e'' + L*Kp*e' + v*Kp*e = 0        ->   zeta = (L/2) * sqrt(Kp/v)
// so L multiplies the damping term DIRECTLY. Shorten the arm and damping falls
// in proportion, on gains that were perfectly stable before. To hold zeta when
// the arm shrinks by a factor k, Kp must rise by k^2 -- or the speed must come
// down, which is cheaper and does not also raise the loop bandwidth.
//
// gopiv carries a long arm at ~17 cm. vevov's is much shorter (stakeholder,
// 2026-09-16), which is why gopiv's Kp=1.1 is expected to ring on it. Measure
// the arm, set it here or with `RUN caltune`, then let `RUN calzeta` pick Kp.
let CALJ_LEVER = 17
const CALJ_BLIND_ERR = 1.2    // cm of assumed error while no channel sees tape,
                              // signed by the last known side
// ACQUISITION. Phase 3 can legitimately BEGIN blind: the stripe is narrow
// enough to sit in the 2.4cm gap between the inner and outer channels, and the
// robot's start alignment is only as good as however it was parked. Aborting
// then is wrong -- it is the normal case, not a fault. So before the stripe has
// ever been seen, the controller SEARCHES: it steers alternately, widening, until
// a channel finds tape, and only then does the blind-abort apply. Four runs were
// lost to this before it was added (gopiv 2026-09-16), each one blamed on the
// controller when the real fault was where the robot had been parked.
const CALJ_ACQ_HALF = 14      // ticks per half of the search sweep
const CALJ_ACQ_STEER = 1.4    // cm/s differential while searching
const CALJ_ACQ_MAX = 150      // ticks (~28cm) searching before giving up
const CALJ_BLIND_MAX = 40     // consecutive blind ticks (~1s, ~8cm) before the
                              // run is abandoned. Repeating the last steering
                              // sign while blind is a SPIRAL if the line is
                              // genuinely gone: gopiv 2026-09-16 drove 165 of
                              // 179 ticks blind at a constant steer=1.32 and
                              // came out 53 deg off course.
const CALJ_MID_MAX = 40       // consecutive ticks (~7.6cm at CALJ_SPEED) the bar
                              // may read all-four-dark without it being the
                              // finish. The mid-field line is 1.9cm wide, about
                              // 10 ticks; bare dark floor past the paper never
                              // ends, and reads the same.
const CALJ_PHASE2_CLEAR = 4   // cm past the start line after which phase 2 ends
                              // NO MATTER what the sensors say. Phase 2 exists
                              // only to get clear of the start line so the finish
                              // detector cannot retrigger on it, and 4cm of travel
                              // does that unconditionally -- the tape is 1.68cm
                              // wide. Gating it on the BAR instead made a merely
                              // offset robot unrecoverable: if the stripe happens
                              // to lie under an outer channel the condition can
                              // never come true, and the phase-3 acquisition
                              // search that exists to fix exactly that offset
                              // never gets to run (gopiv 2026-09-16, bar=...#).
const CALJ_PHASE2_MAX = 10    // cm the outer channels may stay dark after the
                              // start line. Tape is 1.68cm wide, so anything
                              // longer means the robot is driving ALONG a line
                              // rather than across it (38.7cm, same run).
const CALJ_TOL_FRAC = 0.1     // fraction of trueCm the measurement may differ by
                              // before it is refused -- ONLY when the caller
                              // declared the wheel (`wheel` > 0). Was 0.25,
                              // which let a 68.25cm "90.5cm" run report 1.0446
                              // mm/deg.
                              //
                              // THIS BOUND CANNOT BE THE DEFAULT, because it
                              // assumes the very number this verb measures. See
                              // CALJ_DIA_MIN below.

// WHAT A RUN MAY CONCLUDE WHEN THE WHEEL IS UNKNOWN.
//
// calwheels measures wheel travel, so it must not presuppose it. Every
// distance in this file is ODOMETRY cm -- encoder degrees times the mm/deg the
// run was started with -- and the whole point of the run is that that number is
// the wrong one. Comparing odometry cm against the TAPE-MEASURED course and
// refusing a disagreement is therefore circular: the disagreement IS the
// measurement. A robot whose wheels are 20% smaller than stock reports 20%
// further than the tape says and was refused for being right (Eric, 2026-09-19,
// after a wheel swap: "you can't measure the distance if you don't know how big
// your wheels are").
//
// So when the wheel is not declared, the bounds come from what a wheel can
// PHYSICALLY be on this chassis, and they are checked against the ANSWER rather
// than against the premise. That still catches the failure the tolerance guard
// was written for -- gopiv 2026-09-16 took the finish line for the start, read
// 10.5cm of a 90.5cm course and reported a 778 mm wheel -- because 778 mm is
// not a wheel that fits a Nezha.
const CALJ_DIA_MIN = 40       // mm. Smallest wheel that clears the chassis.
const CALJ_DIA_MAX = 120      // mm. Stock is ~90 mm (0.7878 mm/deg).

// WHICH FIELD YOU MAY RUN AN UNDECLARED WHEEL ON. The wider bounds have one
// cost, and it is field-specific rather than general:
//
//   MAIN (eye-shaped) playfield -- SAFE. Two full-width crossbars, one at each
//     end, with the stripe running between them. Overhead frames confirm there
//     is nothing else full-width to latch onto, so the finish is the only line
//     the arming test can ever see. vevov calibrates here.
//
//   SECONDARY playfield -- DECLARE THE WHEEL. Its stripe is crossed by a third
//     full-width line at ~37 cm (surveyed 2026-09-17: crossbars at -37.5 and
//     +38.8, a 1.9 cm line at -0.3). With the wheel undeclared the arming
//     threshold on a 90.5 cm course falls from 81.5 cm to 68.1 cm, because it
//     has to admit any course a plausible wheel could report -- and a robot
//     with much smaller wheels than stock reports that mid-line as high as
//     83 cm, which is over the threshold. It would then measure half the course
//     and, the bounds being wide, report it. tigez was calibrated here.
//
// Passing `wheel` restores the tight +-CALJ_TOL_FRAC bound and removes the
// ambiguity, which is why the second argument exists at all rather than the
// bounds simply being loosened for everyone.
const CALJ_HUNT_CM = 25       // cm to find the start line before giving up
const CALJ_EXTRA_CM = 25      // cm of slack past the expected finish
const CALJ_MAX_SECS = 60      // s for the whole run; a stalled robot stops its
                              // pose too, so a distance limit alone never fires
const CALJ_DEAD_TICKS = 25    // consecutive commanded ticks with poseX() not
                              // moving AT ALL before the run is abandoned. See
                              // the dead-odometry guard in the drive loop: the
                              // seconds budget is NOT a safe backstop, because
                              // 60 s at 8 cm/s is 480 cm on a 134 cm field.
const CALJ_TRK_EVERY = 25     // ticks between tracking diagnostics
const CALJ_ALL = 15           // all four channel bits
const CALJ_OUTER = 9          // channels 0 and 3
let CALJ_BACK_SPEED = 11      // cm/s driving home in reverse. Reverse below
                              // about 10 cm/s does not break away at all on this
                              // fleet (calibratel.ts CALL_CREEP_REV), so this is
                              // as slow as reverse can usefully go.
const CALJ_BACK_CLEAR = 3     // cm to run past the start line before stopping
const CALJ_BACK_MAX = 110     // cm of reverse travel before giving up. The
                              // course is ~90cm; 140 let a blind return run all
                              // the way into the rails (gopiv 2026-09-16).
// ---- REVERSE IS A DIFFERENT CONTROL PROBLEM ------------------------------
// The sensor bar sits ~17cm AHEAD of the axle, so going backwards it TRAILS.
// With e the lateral error at the bar and psi the heading, and L the lever:
//     e_dot = -(v*psi + L*omega)      psi_dot = omega
// Under pure proportional control omega = Kp*e that gives
//     e_dotdot + L*Kp*e_dot + v*Kp*e = 0
// which is stable only if BOTH L*Kp > 0 and v*Kp > 0. Driving forward (v > 0)
// Kp > 0 satisfies both. Driving BACKWARDS (v < 0) they contradict: no pure-P
// gain of either sign can hold the line. That is why the blind straight return
// worked and a naive P return would spiral.
//
// Adding heading feedback, omega = Kp*e + Kh*psi, gives determinant Kp*v, so
// reverse needs Kp NEGATIVE -- the proportional sign flips, exactly like
// reversing a car: to move the trailing end left you steer right. The trace
// condition then wants Kh < L*Kp, i.e. heading damping of the same sign and
// enough of it. Both gains below are negative for that reason.
let CALJ_BACK_KP = -0.7       // cm/s of differential per cm of error. NEGATIVE.
let CALJ_BACK_KH = -0.22      // cm/s per degree of heading error. NEGATIVE.
// INTEGRAL DISABLED, and it must stay that way unless the error is recentred.
// The aim point is the EDGE of the `..#.` band, so err reads 0 or +0.6 almost
// always and can only go negative once the stripe reaches channel 3. The error
// is therefore not zero-mean, the integral accumulates positive by construction,
// and -Ki turns that into a CONSTANT negative steer. MEASURED gopiv 2026-09-16:
// it pinned at the clamp and contributed -0.015*60 = -0.90 cm/s, which exactly
// accounts for the gap between the commanded steer and Kp*err + Kh*h in the
// hometrk log. It cancelled the heading correction, walked the heading to
// -6.6 deg and lost the stripe at 68.9cm. Heading damping (Kh) already supplies
// the steady-state rejection the integral was meant to provide.
let CALJ_BACK_KI = 0
const CALJ_BACK_IMAX = 60     // clamp on the accumulated error (tick-units)
let CALJ_BACK_MAX_STEER = 2.5
const CALJ_BACK_BLIND_MAX = 25  // ticks (~5cm) blind before abandoning the return

// The bar as text, channel 0 (left) first. calibratel.ts has its own barText();
// this one is separately named because both files share one scope.
function caljBar(bits: number): string {
    let text = ""
    for (let i = 0; i < 4; i++) text = text + ((bits & (1 << i)) != 0 ? "#" : ".")
    return text
}

// Where the aim is: the edge position that leaves only channel 2 dark.
function caljTarget(): number {
    return BAR_LATERAL[2] + CALJ_STRIPE_W / 2
}

// Estimated stripe edge in the robot's frame, + to the left. Returns 999 when
// no channel sees tape, which the caller resolves with the last known sign.
function caljEdge(bits: number): number {
    let sum = 0
    let n = 0
    for (let i = 0; i < 4; i++) {
        if ((bits & (1 << i)) != 0) { sum += BAR_LATERAL[i]; n++ }
    }
    if (n == 0) return 999
    return sum / n + CALJ_STRIPE_W / 2
}

// mm of rim travel per shaft degree, for a wheel `diaMm` across.
function caljCalibOf(diaMm: number): number {
    return Math.PI * diaMm / 360
}

// `wheelMm` is the wheel diameter the CALLER believes, or 0 for "unknown" --
// the default, and the honest answer most of the time, since a robot that
// needed calibrating is a robot whose wheel is in question.
//
//   wheel > 0  the run is scaled by that wheel and the result is cross-checked
//              against it to within CALJ_TOL_FRAC. Use it to RE-check a robot
//              you have already calibrated: a disagreement then means the line
//              detection went wrong, because the scale was not in doubt.
//   wheel = 0  the run is scaled by CALJ_BASELINE so the arithmetic has some
//              origin, but NOTHING is concluded from the agreement between that
//              scale and the tape. The bounds come from CALJ_DIA_MIN/MAX
//              instead, which is a fact about the chassis rather than about the
//              measurement.
function runCalibrateJ(trueCm: number, wheelMm: number) {
    const known = wheelMm > 0
    // The scale the run is MEASURED IN. Not a claim about the wheel when
    // unknown -- just the unit the encoder degrees get multiplied by, divided
    // back out at the end.
    const runCalib = known ? caljCalibOf(wheelMm) : CALJ_BASELINE

    // Bounds on what this run may REPORT, as a fraction of trueCm. Odometry cm
    // over tape cm is exactly runCalib / (the wheel's true mm/deg), so a bound
    // on the wheel is a bound on the reading -- and the bigger the wheel, the
    // SHORTER the course reads.
    const spanLo = known ? 1 - CALJ_TOL_FRAC : runCalib / caljCalibOf(CALJ_DIA_MAX)
    const spanHi = known ? 1 + CALJ_TOL_FRAC : runCalib / caljCalibOf(CALJ_DIA_MIN)

    diffDrive.setWheelCalibration(runCalib)
    diffDrive.emitLine("CALWHEELS:begin true=" + trueCm + "cm scale=" + lineRound(runCalib, 4)
        + "mm/deg wheel=" + (known ? wheelMm + "mm" : "unknown")
        + " span=" + lineRound(trueCm * spanLo, 1) + ".." + lineRound(trueCm * spanHi, 1) + "cm"
        + " speed=" + CALJ_SPEED + " kp=" + CALJ_KP
        + " dead=" + CALJ_DEADBAND + " aim=" + lineRound(caljTarget(), 2) + "cm")

    const atStart = linetrack.lineBits()
    if (atStart != 0) {
        // Terminal outcomes are JSON too, so a consumer has ONE contract: a
        // run ends in exactly one of calj.result or calj.fail.
        epPush(epStr(epStr(epObj("calwheels.fail"), "why", "not on clear white"),
            "bar", caljBar(atStart)) + "}")
        epFlush()
        basic.showIcon(IconNames.No)
        return
    }

    diffDrive.resetPose()
    let phase = 1
    let xA = 0
    let xB = 0
    let lastX = 0
    let trackTick = 0
    let bailed = ""
    // Straddle statistics.
    let nTicks = 0
    let sumAbs = 0
    let sumSq = 0
    let maxAbs = 0
    let crossings = 0
    let lastSign = 0
    let sumDiff = 0
    let blindTicks = 0
    let blindRun = 0
    let acquired = false
    let acqTicks = 0
    let deadRun = 0
    let midTicks = 0
    let lastEnc = diffDrive.probe(10) + diffDrive.probe(11)
    const startedAt = control.millis()

    diffDrive.setWheelSpeeds(CALJ_SPEED, CALJ_SPEED)
    while (diffDrive.driveTick()) {
        const x = diffDrive.poseX()
        const bits = linetrack.lineBits()

        if (phase == 1) {
            if (bits == CALJ_ALL) {
                xA = (lastX + x) / 2
                phase = 2
                diffDrive.emitLine("CALWHEELS:start line at=" + lineRound(xA, 2) + "cm")
            } else if (x >= CALJ_HUNT_CM) {
                bailed = "no start line within " + CALJ_HUNT_CM + "cm (bar=" + caljBar(bits) + ")"
                break
            }
        } else if (phase == 2) {
            // Arming the finish detector before the outer channels clear would
            // trigger it on the start line itself.
            if ((bits & CALJ_OUTER) == 0 || x - xA >= CALJ_PHASE2_CLEAR) {
                phase = 3
                diffDrive.emitLine("CALWHEELS:straddling from=" + lineRound(x, 2)
                    + "cm bar=" + caljBar(bits))
            }
        } else {
            // THE FINISH IS ARMED BY DISTANCE, because all-four-dark is not
            // unique to the finish line. The secondary playfield's stripe is
            // crossed by a THIRD full-width line at its midpoint -- surveyed
            // from the rectified frame 2026-09-17: crossbars at x = -37.5 and
            // +38.8 cm, and a 1.9 cm line at x = -0.3, squarely between them.
            // A robot driving that 75.8 cm course reads `####` at about 37 cm,
            // and taken as the finish it measures half the course -- which the
            // tolerance guard below then REFUSES, so the run is lost either way.
            //
            // The arming threshold is the refusal guard's own bound. Anything
            // shorter than trueCm * spanLo is thrown away as a measurement, so
            // accepting it as the finish can only ever turn a good run into a
            // refused one. A field with no mid-line never reaches this test
            // before its real finish, so nothing changes there.
            //
            // spanLo, NOT (1 - CALJ_TOL_FRAC): with the wheel unknown the
            // threshold has to admit any course a plausible wheel could report,
            // and a wheel LARGER than the scale reports the course short. At
            // stock-relative 1.0 the old fixed threshold refused to arm at all
            // for anything over ~100 mm, so a big-wheeled robot drove the
            // course, crossed the finish, and ran on until the budget bailed it
            // out -- a failure that looked like a line-detection problem and was
            // not.
            if (bits == CALJ_ALL && x - xA >= trueCm * spanLo) {
                xB = (lastX + x) / 2
                phase = 4
                break
            }

            // A full-width line that is NOT the finish carries NO lateral
            // information -- every channel is dark wherever the robot sits on
            // it, so caljEdge() reads it as an edge 0.6 cm left of the aim and
            // the controller leans into a correction the tape never asked for.
            // Hold course across it instead, and take no statistics from it.
            // Bounded, because an all-dark that never ends is not a line: it is
            // the robot off the paper on bare dark floor.
            if (bits == CALJ_ALL) {
                midTicks++
                if (midTicks == 1) {
                    diffDrive.emitLine("CALWHEELS:mid-field line at "
                        + lineRound(x - xA, 1) + "cm -- holding course, not the finish")
                }
                if (midTicks >= CALJ_MID_MAX) {
                    bailed = "all four channels dark for " + midTicks + " ticks at "
                        + lineRound(x - xA, 1) + "cm -- that is not a line, it is"
                        + " the robot off the paper"
                    break
                }
                diffDrive.setWheelSpeeds(CALJ_SPEED, CALJ_SPEED)
                lastX = x
                continue
            }
            midTicks = 0

            const edge = caljEdge(bits)
            let err = 0
            if (edge > 900) {
                blindTicks++
                if (!acquired) {
                    // Never seen the stripe yet: SEARCH rather than abort.
                    acqTicks++
                    if (acqTicks >= CALJ_ACQ_MAX) {
                        bailed = "never found the stripe in " + acqTicks
                            + " ticks of searching from " + lineRound(x - xA, 1) + "cm"
                        break
                    }
                    // Alternate sides every CALJ_ACQ_HALF ticks, widening as it
                    // goes, so the bar sweeps across the gap it may be sitting in.
                    const phaseHalf = Math.idiv(acqTicks, CALJ_ACQ_HALF)
                    const dir = phaseHalf % 2 == 0 ? 1 : -1
                    const grow = 1 + phaseHalf / 4
                    let sSteer = dir * CALJ_ACQ_STEER * grow
                    if (sSteer > CALJ_MAX_STEER) sSteer = CALJ_MAX_STEER
                    if (sSteer < -CALJ_MAX_STEER) sSteer = -CALJ_MAX_STEER
                    diffDrive.setWheelSpeeds(CALJ_SPEED - sSteer, CALJ_SPEED + sSteer)
                    lastX = x
                    continue
                }
                // Seen it before and lost it: brief memory, then stop.
                blindRun++
                if (blindRun >= CALJ_BLIND_MAX) {
                    bailed = "lost the stripe for " + blindRun + " ticks at "
                        + lineRound(x - xA, 1) + "cm -- stopping rather than arcing away"
                    break
                }
                err = lastSign >= 0 ? CALJ_BLIND_ERR : -CALJ_BLIND_ERR
            } else {
                acquired = true
                blindRun = 0
                err = edge - caljTarget()
            }

            // Oscillation statistics, on the error the controller actually saw.
            nTicks++
            const mag = Math.abs(err)
            sumAbs += mag
            sumSq += err * err
            if (mag > maxAbs) maxAbs = mag
            const sign = err > CALJ_DEADBAND ? 1 : (err < -CALJ_DEADBAND ? -1 : 0)
            if (sign != 0) {
                if (lastSign != 0 && sign != lastSign) crossings++
                lastSign = sign
            }

            // Proportional steering. err > 0 means the edge has moved LEFT, so
            // the robot is right of the line and must steer LEFT: left wheel
            // slower, right wheel faster.
            let steer = 0
            if (mag > CALJ_DEADBAND) {
                steer = CALJ_KP * err
                if (steer > CALJ_MAX_STEER) steer = CALJ_MAX_STEER
                if (steer < -CALJ_MAX_STEER) steer = -CALJ_MAX_STEER
            }
            sumDiff += -2 * steer          // commanded (left - right)
            diffDrive.setWheelSpeeds(CALJ_SPEED - steer, CALJ_SPEED + steer)

            trackTick++
            if (trackTick % CALJ_TRK_EVERY == 0) {
                diffDrive.emitLine("CALWHEELS:trk x=" + lineRound(x - xA, 1)
                    + "cm bar=" + caljBar(bits) + " err=" + lineRound(err, 2)
                    + " steer=" + lineRound(steer, 2))
            }
        }

        // ---- DEAD ODOMETRY IS NOT A SLOW ROBOT --------------------------
        // EVERY distance guard in this file -- the start-line hunt, the course
        // budget, the finish detector -- is a comparison against poseX(). If
        // the encoders stop reporting, poseX() stays 0, NONE of those
        // comparisons can ever come true, and the only thing left standing is
        // the seconds budget. That is not a backstop: 60 s at 8 cm/s is 480 cm,
        // on a field 134 cm wide.
        //
        // MEASURED vevov 2026-09-16: i2cf 1252 against cyc 1264 -- about 99% of
        // control cycles faulting on I2C, with posl and posr both exactly 0.
        // Motor commands still got through, so a `sweep` bounded to 10 cm drove
        // 111 cm into the corner of the field: its 10 cm bound was inert and
        // only the 30 s timeout ever stopped it. The warning was visible two
        // commands earlier -- nudges that moved 0.8 mm while reporting x=0 --
        // and was read as a breakaway problem instead of dead encoders.
        //
        // A robot that cannot measure its own motion must not be driven on a
        // limit derived from that measurement.
        // Watch the ENCODER COUNTS, not poseX. poseX stalls legitimately while
        // the robot turns hard -- during a saturated correction it can even run
        // backwards -- so testing it FALSELY ABORTED a healthy run on vevov
        // 2026-09-17 with "odometry is DEAD" while posl/posr were advancing
        // 1066 and 455. The counts are the thing that actually stops when the
        // I2C bus wedges, which is what this guard is for.
        const encNow = diffDrive.probe(10) + diffDrive.probe(11)
        if (encNow == lastEnc) {
            deadRun++
            if (deadRun >= CALJ_DEAD_TICKS) {
                bailed = "encoders are DEAD -- posl+posr has not changed in "
                    + deadRun + " commanded ticks, so every distance limit in this"
                    + " run is inert. Check i2cf against cyc in TLM FULL:"
                    + " near-equal means the I2C bus is failing."
                break
            }
        } else {
            deadRun = 0
        }
        lastEnc = encNow

        lastX = x
        // Budget the COURSE, not the whole drive: `x` counts from where the
        // robot started, which includes the approach to the start line.
        // spanHi, for the same reason the arming threshold uses spanLo: a wheel
        // SMALLER than the scale reports the course long, and a budget of
        // trueCm + slack cut those runs off before the finish. The physical
        // backstop is not this number anyway -- it is the paper. Past the end of
        // the course the bar reads all four channels on bare floor, which either
        // arms the finish or trips the CALJ_MID_MAX dark bail within ~7.6cm.
        if (phase > 1 && x - xA >= trueCm * spanHi + CALJ_EXTRA_CM) {
            bailed = "ran " + lineRound(x - xA, 1) + "cm past the start line"
                + " without finding the finish"
            break
        }
        if (control.millis() - startedAt > CALJ_MAX_SECS * 1000) {
            bailed = "timed out after " + CALJ_MAX_SECS + "s at " + lineRound(x, 1) + "cm"
            break
        }
    }
    diffDrive.stop()

    if (phase != 4) {
        epPush(epNum(epStr(epObj("calwheels.fail"), "why",
            bailed.length > 0 ? bailed : "drive ended early"), "phase", phase, 0) + "}")
        epFlush()
        basic.showIcon(IconNames.No)
        return
    }

    const measured = xB - xA

    // THE ANSWER FIRST, then judge the answer. The old order judged the
    // premise: it compared odometry cm against the tape and refused a
    // disagreement, which is the one comparison this verb exists to make.
    const corrected = measured > 0 ? runCalib * trueCm / measured : 0
    const diameter = corrected * 360 / Math.PI

    // REFUSE A WHEEL THAT CANNOT EXIST. Two ways a run looks successful and is
    // meaningless: started mid-course, so the FINISH line was taken for the
    // start; or ran off the end of the paper, where bare dark floor reads as all
    // four channels and counts as a line. Both happened on gopiv 2026-09-16 and
    // between them produced "90.5cm true, 10.5cm measured" -> 6.79 mm/deg, a
    // wheel 778 mm across, reported as though it were a calibration.
    //
    // 778 mm is still refused here, and for a reason that does not depend on
    // knowing the wheel: no 778 mm wheel fits a Nezha. What is no longer
    // refused is a robot that is simply not wearing the wheel the firmware
    // shipped with.
    if (measured < trueCm * spanLo || measured > trueCm * spanHi) {
        let bad = epObj("calwheels.fail")
        // The `why` says which bound was applied, because the two mean
        // different things to whoever reads it: one is a claim about the
        // chassis, the other a cross-check the caller asked for.
        bad = epStr(bad, "why", known
            ? "measured distance is nowhere near the declared wheel"
            : "no wheel that fits this chassis could have driven that")
        bad = epNum(bad, "measured", measured, 2)
        bad = epNum(bad, "true", trueCm, 2)
        // The implied wheel is the most legible form of the failure: "the start
        // and finish you gave me imply a 778 mm wheel" tells a student what went
        // wrong on the FIELD, which is where it went wrong.
        bad = epNum(bad, "implied", diameter, 2)
        bad = epNum(bad, "lo", trueCm * spanLo, 2)
        bad = epNum(bad, "hi", trueCm * spanHi, 2)
        bad = epStr(bad, "wheel", known ? "" + wheelMm : "unknown")
        epPush(bad + "}")
        epFlush()
        basic.showIcon(IconNames.No)
        return
    }
    const meanAbs = nTicks > 0 ? sumAbs / nTicks : 0
    const rms = nTicks > 0 ? Math.sqrt(sumSq / nTicks) : 0
    const bias = nTicks > 0 ? sumDiff / nTicks : 0
    // Crossings per metre is the oscillation rate, independent of run length.
    const perM = measured > 0 ? crossings * 100 / measured : 0

    // ---- report, as packed JSON Lines --------------------------------------
    // Packed through epPush()/epFlush() (emitpack.ts) rather than one
    // emitLine() per line: a RUN verb is a live motion obligation, so the
    // transport applies no backpressure and silently drops what does not fit.
    // calc lost the last three lines of its report every run until it was
    // packed this way.
    //
    // calib is THE ANSWER, millimetres of wheel travel per shaft degree.
    // diameter is the same number as a wheel, for checking against a ruler by
    // eye -- a wrong run shows up there first (a bad start once produced a
    // 778 mm wheel). The quality object is what says whether to believe it.
    let r = epObj("calwheels.result")
    r = epNum(r, "calib", corrected, 4)
    r = epNum(r, "diameter", diameter, 2)
    r = epNum(r, "measured", measured, 2)
    r = epNum(r, "true", trueCm, 2)
    r = epNum(r, "error", measured - trueCm, 2)
    // `was` is the scale this run was MEASURED IN, which is CALJ_BASELINE only
    // when the caller declared no wheel. A consumer computing calib/was gets the
    // correction factor either way.
    r = epNum(r, "was", runCalib, 4)
    r = epStr(r, "wheel", known ? "" + wheelMm : "unknown")
    epPush(r + "}")

    // QUALITY. rms and crossings are how hard the straddle controller was
    // working; blind is how many ticks the stripe sat in the sensor's blind
    // gap, where its position is unobservable; acq is how long it took to find
    // the stripe at all. bias is the steady wheel differential needed to hold
    // the line -- a direct readout of how mismatched the two wheels are.
    let q = epObj("calwheels.quality")
    q = epNum(q, "rms", rms, 2)
    q = epNum(q, "mean", meanAbs, 2)
    q = epNum(q, "max", maxAbs, 2)
    q = epNum(q, "xpm", perM, 1)
    q = epNum(q, "blind", blindTicks, 0)
    q = epNum(q, "ticks", nTicks, 0)
    q = epNum(q, "acq", acqTicks, 0)
    q = epNum(q, "bias", bias, 3)
    q = epNum(q, "heading", diffDrive.heading(), 2)
    epPush(q + "}")

    // Where the two triggers actually fired, for a run that looks wrong.
    let w = epObj("calwheels.span")
    w = epNum(w, "start", xA, 2)
    w = epNum(w, "finish", xB, 2)
    epPush(w + "}")
    epFlush()
    basic.showIcon(IconNames.Yes)
    // Drive home on the reverse PID, so the next run needs no hands on the
    // robot. Called AFTER epFlush(): the measurement is already on the wire, so
    // a return that fails costs the reposition, never the result.
    //
    // trueCm, not the documented 0: the course length arms caljHome()'s
    // mid-course-line guard, which is harmless on a field whose ends are the
    // only full lines and is the whole point on one where they are not.
    caljHome(trueCm)
}

// Drive back to the start, FOLLOWING THE LINE IN REVERSE, so a retune can run
// again without hands on the robot. See the gain derivation above: reversing
// needs a flipped proportional sign plus heading damping, which is why this is
// not simply the forward controller with a negative speed.
//
// Heading comes from odometry, zeroed here: the robot has just finished the
// forward run pointing along the line, so heading() IS the heading error
// relative to the line for the length of the return.
//
// It stops at the first full line it crosses (all four dark) and backs clear of
// it, so it does not depend on knowing the distance -- EXCEPT where the course
// has a line across its middle, which the secondary playfield does (see the
// finish detector above). There `minCm` is the course length, and a full line
// is only taken for the start line once the return has run far enough that it
// could be one; the same (1 - CALJ_TOL_FRAC) bound the forward leg arms on.
// Pass 0 (the default) on a field with nothing between the two ends.
function caljHome(minCm: number) {
    diffDrive.emitLine("CALWHEELS:home reverse PID kp=" + CALJ_BACK_KP + " kh=" + CALJ_BACK_KH
        + " ki=" + CALJ_BACK_KI + " speed=" + CALJ_BACK_SPEED + "cm/s")
    diffDrive.resetPose()
    let stage = linetrack.lineBits() == CALJ_ALL ? 0 : 1
    let crossedAt = 0
    let integral = 0
    let blindRun = 0
    let blindTicks = 0
    let nTicks = 0
    let sumAbs = 0
    let sumSq = 0
    let maxAbs = 0
    let crossings = 0
    let lastSign = 0
    let trk = 0
    const startedAt = control.millis()

    diffDrive.setWheelSpeeds(-CALJ_BACK_SPEED, -CALJ_BACK_SPEED)
    while (diffDrive.driveTick()) {
        const x = Math.abs(diffDrive.poseX())
        const bits = linetrack.lineBits()

        if (stage == 0) {
            // Leaving the line the robot is sitting on. Wait for the OUTER
            // channels to clear, NOT for every channel: the stripe runs on from
            // the finish line and holds an inner channel dark, so `bits == 0`
            // never comes true and the controller never engages. That left the
            // return reversing BLIND for 61 cm (gopiv 2026-09-16), which is the
            // same mistake phase 2 of the forward leg already avoids.
            if ((bits & CALJ_OUTER) == 0) stage = 1
        } else if (stage == 1) {
            if (bits == CALJ_ALL && x >= minCm * (1 - CALJ_TOL_FRAC)) {
                stage = 2
                crossedAt = x
            }
        } else {
            if (bits == 0 && x - crossedAt >= CALJ_BACK_CLEAR) break
        }

        if (stage == 1 && bits == CALJ_ALL) {
            // The mid-field line, held for the same reason the forward leg
            // holds it: all four dark says nothing about where the stripe is,
            // so steering on it walks the robot off. The guards at the foot of
            // this loop still run -- an all-dark that never ends is bare floor,
            // and a reverse leg that keeps going on bare floor finds the rails.
            diffDrive.setWheelSpeeds(-CALJ_BACK_SPEED, -CALJ_BACK_SPEED)
        } else if (stage == 1) {
            const edge = caljEdge(bits)
            let err = 0
            if (edge > 900) {
                blindTicks++
                blindRun++
                if (blindRun >= CALJ_BACK_BLIND_MAX) {
                    diffDrive.stop()
                    diffDrive.emitLine("CALWHEELS:home fail lost the stripe for " + blindRun
                        + " ticks at " + lineRound(x, 1) + "cm -- stopping, not guessing")
                    basic.showIcon(IconNames.No)
                    return
                }
                err = lastSign >= 0 ? CALJ_BLIND_ERR : -CALJ_BLIND_ERR
            } else {
                blindRun = 0
                err = edge - caljTarget()
            }

            nTicks++
            const mag = Math.abs(err)
            sumAbs += mag
            sumSq += err * err
            if (mag > maxAbs) maxAbs = mag
            const sign = err > CALJ_DEADBAND ? 1 : (err < -CALJ_DEADBAND ? -1 : 0)
            if (sign != 0) {
                if (lastSign != 0 && sign != lastSign) crossings++
                lastSign = sign
            }

            integral += err
            if (integral > CALJ_BACK_IMAX) integral = CALJ_BACK_IMAX
            if (integral < -CALJ_BACK_IMAX) integral = -CALJ_BACK_IMAX

            let steer = CALJ_BACK_KP * err + CALJ_BACK_KH * diffDrive.heading()
                + CALJ_BACK_KI * integral
            if (steer > CALJ_BACK_MAX_STEER) steer = CALJ_BACK_MAX_STEER
            if (steer < -CALJ_BACK_MAX_STEER) steer = -CALJ_BACK_MAX_STEER
            diffDrive.setWheelSpeeds(-CALJ_BACK_SPEED - steer, -CALJ_BACK_SPEED + steer)

            trk++
            if (trk % CALJ_TRK_EVERY == 0) {
                diffDrive.emitLine("CALWHEELS:hometrk x=" + lineRound(x, 1) + "cm bar="
                    + caljBar(bits) + " err=" + lineRound(err, 2)
                    + " h=" + lineRound(diffDrive.heading(), 1)
                    + " steer=" + lineRound(steer, 2))
            }
        }

        if (x >= CALJ_BACK_MAX) {
            diffDrive.stop()
            diffDrive.emitLine("CALWHEELS:home fail no line within " + CALJ_BACK_MAX
                + "cm (bar=" + caljBar(bits) + ")")
            basic.showIcon(IconNames.No)
            return
        }
        if (control.millis() - startedAt > CALJ_MAX_SECS * 1000) {
            diffDrive.stop()
            diffDrive.emitLine("CALWHEELS:home fail timed out at " + lineRound(x, 1) + "cm")
            basic.showIcon(IconNames.No)
            return
        }
    }
    diffDrive.stop()

    const meanAbs = nTicks > 0 ? sumAbs / nTicks : 0
    const rms = nTicks > 0 ? Math.sqrt(sumSq / nTicks) : 0
    diffDrive.emitLine("CALWHEELS:home back " + lineRound(Math.abs(diffDrive.poseX()), 2)
        + "cm bar=" + caljBar(linetrack.lineBits())
        + " heading=" + lineRound(diffDrive.heading(), 2) + "deg")
    diffDrive.emitLine("CALWHEELS:homeosc rms=" + lineRound(rms, 2) + "cm mean="
        + lineRound(meanAbs, 2) + "cm max=" + lineRound(maxAbs, 2) + "cm crossings="
        + crossings + " blind=" + blindTicks + "/" + nTicks + "ticks")
    basic.showIcon(IconNames.Yes)
}

// The menu entry: run the course with the surveyed distance, and with the wheel
// UNKNOWN -- a button on the robot cannot declare one, and the button is what a
// student presses on a robot nobody has measured.
function calibrateJ() {
    runCalibrateJ(CALJ_TRUE_CM, 0)
}

// ---- RUNTIME TUNING ------------------------------------------------------
// Every straddle gain above is `let`, and these verbs set them over the wire.
//
// This is a REQUIREMENT, not a convenience. vevov (2026-09-16) reaches this
// bench only as a TCP serial export served by a Raspberry Pi at 192.168.4.50:
// no USB path, and SSH on that Pi refuses every account tried. It cannot be
// reflashed from here AT ALL. A gain that exists only as a compiled constant is
// therefore untunable on that robot -- not merely inconvenient. One flash plus
// wire tuning replaces one flash per trial, and on a robot nobody can flash it
// is the difference between tuning and not tuning.
//
// Omitted arguments keep their current value, so `RUN caltune 6` sets only the
// speed. With no arguments these just report, which is also how the gains are
// read back off a robot somebody else flashed.

// Damping ratio of the straddle loop, zeta = (L/2)*sqrt(Kp/v). Aim near 1:
// below ~0.5 it rings, above ~2 it corners wide and rides MAX_STEER.
function caljZeta(): number {
    if (CALJ_SPEED <= 0 || CALJ_KP <= 0 || CALJ_LEVER <= 0) return 0
    return (CALJ_LEVER / 2) * Math.sqrt(CALJ_KP / CALJ_SPEED)
}

function caljTuneReport() {
    diffDrive.emitLine("CALWHEELS:tune speed=" + CALJ_SPEED + " kp=" + lineRound(CALJ_KP, 3)
        + " maxsteer=" + CALJ_MAX_STEER + " dead=" + CALJ_DEADBAND
        + " lever=" + CALJ_LEVER + "cm zeta=" + lineRound(caljZeta(), 2))
    diffDrive.emitLine("CALWHEELS:btune kp=" + CALJ_BACK_KP + " kh=" + CALJ_BACK_KH
        + " ki=" + CALJ_BACK_KI + " speed=" + CALJ_BACK_SPEED
        + " maxsteer=" + CALJ_BACK_MAX_STEER)
}

// ---- REGISTERED VERBS ----------------------------------------------------
// ONLY calj. The wire-tuning verbs (caltune, calbtune, calzeta, wiretune), the
// sensor dumps (bargray, barref) and the return-to-start helper (caljhome) were
// all unregistered 2026-09-18, when the image was cut to the four verbs the
// console needs: square, circle, calj, calc.
//
// WHAT THAT COSTS, so it is a decision and not an accident: the gains below
// stay `let` and are still tunable IN SOURCE, but no longer over the wire. The
// reason they were wire-tunable was robots hosted on a Raspberry Pi that cannot
// be reflashed from the bench -- and that is not hypothetical, two of those Pis
// (nada, null) went down this same afternoon. If a gain needs changing on a
// robot nobody can flash, re-register caltune rather than guessing.
//
// caljTuneReport() is kept and still called from the start of a run, so the
// gains a run used are always in its own log.
// wheel defaults to 0 -- UNKNOWN -- so `RUN calwheels 90.5` on a robot whose
// wheels nobody has measured does the right thing without a second argument.
// Pass a diameter only to re-check a wheel you already trust.
diffDrive.onRun("calwheels", function (arg) {
    runCalibrateJ(runNumber(0, CALJ_TRUE_CM), runNumber(1, 0))
})
diffDrive.runSignature("calwheels", "(cm:number=90.5, wheel:number=0)")
