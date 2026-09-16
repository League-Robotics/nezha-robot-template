// calibratel.ts — Calibrate L: square up to a line by measuring its angle.
// Menu picture: a stem meeting a bar, or RUN call [dir]
//
// SETUP. One straight black line on the floor, roughly across the robot's path:
// ahead of it for dir 1 (the default), behind it for dir -1.
//
// THE MEASUREMENT (measureLineAngle). The Trackbit's four reflectance channels
// sit in a row across the robot, at CALL_LATERAL. Drive straight at a creep
// from clear floor and note how far the robot has travelled when each channel
// first sees the line. Square to the line, all four trigger together. Skewed,
// they trigger one after another, and travel against lateral position is a
// straight line whose slope is the tangent of the skew:
//
//     travel_i = travel_0 + k * lateral_i     (least squares over the 4 channels)
//     turn     = -atan(k)                     (deg, CCW+, to face the line squarely)
//
// Travel comes from the pose, not the clock, so how the speed ramps never enters
// the answer. Each trigger is placed midway between the last sample that read
// clear and the first that read dark, so the resolution is half a tick of
// travel -- about half a millimetre at CALL_CREEP. The same fit holds driving
// backwards: the line is then behind the robot, but each channel still meets it
// at a travel set by where the line crosses that channel's lateral position.
//
// SIGN. Driving forward, if the LEFT channel triggers first the line is nearer
// on the left, so the robot must turn left -- CCW, positive -- to square up.
// Left is +lateral and triggered first means smaller travel, so k < 0 and
// -atan(k) > 0. Channel 0 is on the robot's left (linetrack.ts).
//
// THE LOOP (squareUp). Clear the line in the other direction, measure, nudge
// round by the measured angle, and repeat until a measurement comes back
// within CALL_TOL of square.
//
// THE CHANNELS ARE NOT EVENLY SPACED. Measured by Eric 2026-09-15: the outer
// pair is 60 mm apart and the inner pair 12 mm, so from the centre line they
// sit at +30, +6, -6 and -30 mm. ELECFREAKS does not publish this. The fit is a
// least-squares slope over those real positions, so uneven spacing needs no
// special case, and the wide outer pair is what gives the angle its precision:
// half a millimetre of travel across 60 mm is about half a degree. A wrong
// position table scales every angle but cannot move zero -- squaring up would
// still converge -- so this matters most when the angle itself is the answer
// (the heading change between two lines, a turn check).
const CALL_LATERAL = [3.0, 0.6, -0.6, -3.0]   // cm from the centre line, left
                                               // positive, channel 0 first
const CALL_CREEP = 4          // cm/s measuring FORWARD; one ~24 ms tick is ~1 mm
const CALL_CREEP_REV = 10     // cm/s measuring in REVERSE. Anything slower does
                              // not move at all: on vevov 2026-09-15 a -4 cm/s
                              // drive failed nearly every control cycle and
                              // stayed put, while -10 drove normally
                              // (pxt-nezha-diffdrive sprint 039, issue
                              // slow-continuous-creep-self-locks-below-breakaway).
                              // 10 cm/s is ~2.4 mm of travel per tick, so a
                              // reverse measurement is coarser than a forward one.
const CALL_CLEAR_SPEED = 12   // cm/s backing off a line -- also above that floor
const CALL_CLEAR_MARGIN = 1   // cm driven past all-clear, so the next pass
                              // meets the line from clear floor
const CALL_HUNT_MAX = 12      // cm; the first pass may start a little way off.
                              // Kept SHORT on purpose: every centimetre driven
                              // is a chance for a tail-dragging robot to rotate
                              // (vevov 2026-09-15 turned ~3 deg per round of
                              // back-up-and-cross, nearly all of it in reverse).
                              // Was 60, which let a pass run off the paper
                              // (vevov 2026-09-15: drove 53 cm, ended on the
                              // dark wood, 48 cm from where it started).
const CALL_MEASURE_MAX = 8    // cm; later passes start just off the line
const CALL_CLEAR_MAX = 20     // cm; give up clearing
const CALL_MAX_WIDTH = 6      // cm of travel a channel may spend on the line
                              // before the reading is refused. The tape is
                              // ~1.8 cm wide and a 45 deg crossing makes that
                              // 2.6 cm, so anything past this is not tape:
                              // it is the dark wood past the paper, a shadow,
                              // or a sensor stuck dark. vevov 2026-09-15 read
                              // 21 cm of continuous dark and kept driving,
                              // because "drive until every channel is clear"
                              // never came true out there.
const CALL_MAX_SKEW = 40      // deg; a crossing steeper than this is refused
const CALL_MAX_SECS = 30      // s per drive. Distance limits alone are not
                              // enough: a stalled robot stops its pose too,
                              // and a distance limit then never arrives
                              // (calibratea.ts, gopiv 2026-09-07)
const CALL_TOL = 1            // deg; square enough to stop
const CALL_MAX_PASSES = 8
const CALL_NUDGE_SPEED = 50   // cm/s wheel speed for one nudge -- a jolt
                              // (Eric's starting point 2026-09-15; tune with
                              // the nudge verb)
const CALL_NUDGE_TICKS = 1    // control ticks per nudge, ~24 ms each
const CALL_NUDGE_SETTLE = 40  // ms after each nudge, to stop before the next
const CALL_MAX_NUDGES = 80
const CALL_REVERSE_SETTLE = 300 // ms between drives in opposite directions.
                              // On vevov 2026-09-15 a forward wheel loop that
                              // directly followed a reverse one stopped after
                              // ~16 ticks and never returned (bench log runs
                              // 7 and 8); cause unknown, tracked in
                              // pxt-nezha-diffdrive sprint 039. squareUp
                              // reverses every pass, so it waits.
const CALL_ALL_CHANNELS = 15  // all four channel bits set

function lineRound(x: number, places: number): number {
    const f = Math.pow(10, places)
    return Math.round(x * f) / f
}

// Lateral position of channel i in cm, left positive, centred on the bar.
function channelLateral(i: number): number {
    return CALL_LATERAL[i]
}

// One measurement of a line. `angle` is the only number most callers need.
class LineReading {
    ok: boolean
    angle: number      // deg, CCW+: turn this much to face the line squarely
    angleLead: number  // the same, from the near edges alone
    angleTrail: number // ... and from the far edges alone
    spread: number     // cm of travel between the first and last near edge
    disagree: number   // deg between the forward and backward passes (both ways)
    channels: number   // how many channels met the line
    travel: number[]   // cm, pose x where each channel reached the line
    leaving: number[]  // cm, pose x where each channel left it again
    width: number[]    // cm of travel each channel spent on the line
    drift: number      // deg of heading change during the drive
    why: string        // why ok is false

    constructor() {
        this.ok = false
        this.angle = 0
        this.angleLead = 0
        this.angleTrail = 0
        this.spread = 0
        this.disagree = 0
        this.channels = 0
        this.travel = [0, 0, 0, 0]
        this.leaving = [0, 0, 0, 0]
        this.width = [0, 0, 0, 0]
        this.drift = 0
        this.why = ""
    }
}

// Least squares slope of travel against lateral position, as the turn (deg,
// CCW+) that squares the robot to the line. The same maths serves both edge
// sets. den is 2*(3.0^2 + 0.6^2) with the measured channel positions, so it is
// never zero.
function fitLineAngle(travel: number[]): number {
    let lateralMean = 0
    let travelMean = 0
    for (let i = 0; i < 4; i++) {
        lateralMean += channelLateral(i)
        travelMean += travel[i]
    }
    lateralMean = lateralMean / 4
    travelMean = travelMean / 4
    let num = 0
    let den = 0
    for (let i = 0; i < 4; i++) {
        const dl = channelLateral(i) - lateralMean
        num += dl * (travel[i] - travelMean)
        den += dl * dl
    }
    return -Math.atan(num / den) * 180 / Math.PI
}

// Drive `dir` (1 forward, -1 back) from clear floor RIGHT ACROSS the line:
// past first contact and on until every channel reads clear floor again.
//
// That yields two independent edge sets -- where each channel reached the line,
// and where it left -- and each fits its own angle. Their MEAN is the answer:
// a lag shared by the sensor or by the sampling shifts both edges the same way
// along travel and cancels in the mean, while it would bias either set alone.
// Their difference, and the per-channel widths, say whether to trust the pass:
// on a straight line crossed in a straight drive the two angles agree and the
// four widths match.
//
// Reverse runs at CALL_CREEP_REV, not CALL_CREEP: see that constant.
function measureLineAngle(dir: number, maxCm: number): LineReading {
    const r = new LineReading()
    if (linetrack.lineBits() != 0) {
        r.why = "not on clear floor -- clear the line first"
        return r
    }
    diffDrive.resetPose()
    const startedAt = control.millis()
    let seen = 0
    let gone = 0
    let lastX = 0
    let tooWide = false
    diffDrive.whileDriving(dir < 0 ? -CALL_CREEP_REV : CALL_CREEP, 0, function (x, y, h) {
        const bits = linetrack.lineBits()
        for (let i = 0; i < 4; i++) {
            const bit = 1 << i
            const onLine = (bits & bit) != 0
            if (onLine && (seen & bit) == 0) {
                seen |= bit
                r.travel[i] = (lastX + x) / 2
            } else if (!onLine && (seen & bit) != 0 && (gone & bit) == 0) {
                gone |= bit
                r.leaving[i] = (lastX + x) / 2
            }
            // Still dark far past any tape: stop HERE rather than drive on
            // waiting for a clear that is not coming.
            if ((seen & bit) != 0 && (gone & bit) == 0
                && Math.abs(x - r.travel[i]) > CALL_MAX_WIDTH) {
                tooWide = true
            }
        }
        lastX = x
        r.drift = h
        if (tooWide) { diffDrive.stop(); return }
        if (gone == CALL_ALL_CHANNELS) { diffDrive.stop(); return }
        if (Math.abs(x) >= maxCm) { diffDrive.stop(); return }
        if (control.millis() - startedAt > CALL_MAX_SECS * 1000) {
            diffDrive.stop()
            return
        }
    })
    if (tooWide) {
        r.why = "dark for more than " + CALL_MAX_WIDTH
            + "cm -- off the paper, a shadow, or a stuck sensor, not tape"
        return r
    }

    for (let i = 0; i < 4; i++) {
        if ((seen & (1 << i)) != 0) r.channels++
    }
    if (gone != CALL_ALL_CHANNELS) {
        let cleared = 0
        for (let i = 0; i < 4; i++) {
            if ((gone & (1 << i)) != 0) cleared++
        }
        r.why = r.channels == 0
            ? "no line within " + maxCm + "cm"
            : "crossed " + r.channels + " of 4 channels, " + cleared
              + " back on clear floor, within " + maxCm + "cm"
        if (diffDrive.isStalled()) r.why = r.why + " -- STALLED"
        return r
    }

    let lo = r.travel[0]
    let hi = r.travel[0]
    for (let i = 0; i < 4; i++) {
        r.width[i] = Math.abs(r.leaving[i] - r.travel[i])
        lo = Math.min(lo, r.travel[i])
        hi = Math.max(hi, r.travel[i])
    }
    r.angleLead = fitLineAngle(r.travel)
    r.angleTrail = fitLineAngle(r.leaving)
    r.angle = (r.angleLead + r.angleTrail) / 2
    r.spread = hi - lo
    // Too steep to trust. The fit is still valid geometry, but a crossing this
    // skewed spends so long on the tape that drift during the pass dominates,
    // and the turn it produces tends to make the next pass worse rather than
    // better (MEASURED tovez 2026-09-15: a 46 deg reading with 32-36 mm widths
    // came from a pass that had already been thrown off by a bad turn).
    if (Math.abs(r.angle) > CALL_MAX_SKEW) {
        r.why = "crossing at " + lineRound(r.angle, 1) + "deg is too skewed to trust"
        return r
    }
    r.ok = true
    return r
}

// Drive `dir` until the whole bar reads clear floor, then CALL_CLEAR_MARGIN
// further. Already clear: does not move. False if the line never cleared.
function clearLine(dir: number): boolean {
    if (linetrack.lineBits() == 0) return true
    diffDrive.resetPose()
    const startedAt = control.millis()
    let clearFrom = -1   // cm of travel where the bar last went all-clear
    let cleared = false
    diffDrive.whileDriving(dir * CALL_CLEAR_SPEED, 0, function (x, y, h) {
        const d = Math.abs(x)
        if (linetrack.lineBits() != 0) {
            clearFrom = -1
        } else if (clearFrom < 0) {
            clearFrom = d
        }
        if (clearFrom >= 0 && d - clearFrom >= CALL_CLEAR_MARGIN) {
            cleared = true
            diffDrive.stop()
            return
        }
        if (d >= CALL_CLEAR_MAX) { diffDrive.stop(); return }
        if (control.millis() - startedAt > CALL_MAX_SECS * 1000) {
            diffDrive.stop()
            return
        }
    })
    return cleared
}

// One short jolt: the two wheel speeds (cm/s) for `ticks` control ticks, then a
// full stop. Fast enough to break the robot loose, short enough to move it
// only a little -- what used to be called crawling.
function nudge(left: number, right: number, ticks: number) {
    diffDrive.setWheelSpeeds(left, right)
    for (let i = 0; i < ticks; i++) {
        if (!diffDrive.driveTick()) break
    }
    diffDrive.stop()
}

// Turn in place by `yaw` degrees (CCW+) one nudge at a time, reading the
// odometry heading after each. Stops once the gap left is under half the last
// nudge's step, so the last nudge never overshoots by more than it closed.
// Returns the heading the odometry reports; the next line measurement, not this
// number, says whether the robot is square.
function nudgeTurn(yaw: number): number {
    diffDrive.resetPose()
    const sign = yaw > 0 ? 1 : -1
    let got = 0
    let step = 0
    let count = 0
    while (count < CALL_MAX_NUDGES && Math.abs(yaw) - Math.abs(got) > step / 2) {
        nudge(-sign * CALL_NUDGE_SPEED, sign * CALL_NUDGE_SPEED, CALL_NUDGE_TICKS)
        basic.pause(CALL_NUDGE_SETTLE)
        const h = diffDrive.heading()
        step = Math.abs(h - got)
        got = h
        count++
    }
    diffDrive.emitLine("CALL:nudge want=" + lineRound(yaw, 2) + "deg got="
        + lineRound(got, 2) + "deg in " + count + " nudges")
    return got
}

// Cross the line forward, then cross it back: FOUR angle fits (near and far
// edges, each way) instead of two, and the robot ends up where it started.
//
// Both halves matter. The sensor triggers early and releases late, which tilts
// the near-edge fit one way and the far-edge fit the other -- averaging them
// cancels it (MEASURED vevov 2026-09-15: near 29.71, far 33.94, tape read 31-37 mm
// wide where the camera says 17-18.5). Driving back then returns the robot to
// its starting patch of floor, so a long squaring session does not walk off the
// playfield.
//
// `disagree` is how far the two passes differ. It is the repeatability number:
// the angle itself need not be true, but forward and back must agree.
function measureBothWays(maxCm: number): LineReading {
    const fwd = measureLineAngle(1, maxCm)
    emitReading("fwd ", fwd)
    if (!fwd.ok) return fwd
    basic.pause(CALL_REVERSE_SETTLE)
    // The forward pass stops the moment the last channel clears, so a steep
    // crossing can leave a channel back on the tape by the time the robot
    // settles -- and then the backward pass refuses to start (MEASURED tovez
    // 2026-09-15: "back fail not on clear floor" after a 46 deg crossing).
    // Drive on a little further first if anything is still dark.
    if (linetrack.lineBits() != 0 && !clearLine(1)) {
        const stuck = new LineReading()
        stuck.why = "could not clear the line between the two passes"
        return stuck
    }
    basic.pause(CALL_REVERSE_SETTLE)
    const back = measureLineAngle(-1, maxCm)
    emitReading("back", back)
    if (!back.ok) return back

    const r = new LineReading()
    r.ok = true
    r.angleLead = (fwd.angleLead + back.angleLead) / 2
    r.angleTrail = (fwd.angleTrail + back.angleTrail) / 2
    r.angle = (fwd.angle + back.angle) / 2
    r.disagree = fwd.angle - back.angle
    r.spread = (fwd.spread + back.spread) / 2
    r.drift = fwd.drift + back.drift
    r.channels = 4
    for (let i = 0; i < 4; i++) {
        r.travel[i] = fwd.travel[i]
        r.leaving[i] = fwd.leaving[i]
        r.width[i] = (fwd.width[i] + back.width[i]) / 2
    }
    return r
}

function emitReading(tag: string, r: LineReading) {
    if (!r.ok) {
        diffDrive.emitLine("CALL:" + tag + " fail " + r.why)
        return
    }
    diffDrive.emitLine("CALL:" + tag + " angle=" + lineRound(r.angle, 2) + "deg"
        + " lead=" + lineRound(r.angleLead, 2) + " trail=" + lineRound(r.angleTrail, 2)
        + " spread=" + lineRound(r.spread * 10, 1) + "mm"
        + " drift=" + lineRound(r.drift, 2) + "deg")
    diffDrive.emitLine("CALL:" + tag + " at=" + lineRound(r.travel[0], 2) + ","
        + lineRound(r.travel[1], 2) + "," + lineRound(r.travel[2], 2) + ","
        + lineRound(r.travel[3], 2) + "cm width=" + lineRound(r.width[0] * 10, 1) + ","
        + lineRound(r.width[1] * 10, 1) + "," + lineRound(r.width[2] * 10, 1) + ","
        + lineRound(r.width[3] * 10, 1) + "mm")
}

// Turn in place by `yaw` degrees (CCW+). A position-mode move, NOT nudges: on
// vevov 2026-09-15 a one-tick wheel jolt moved nothing and five ticks moved
// about a millimetre, because every continuous command ramps up from zero
// (pxt-nezha-diffdrive, 2026-09-15). move() goes through the position-mode
// shaper instead. It carries a per-pivot overshoot of a degree or two, which is
// exactly why the NEXT line measurement decides whether this worked -- never
// the odometry this prints. The nudge verb stays, for tuning the firmware nudge
// when it lands (sprint 039).
function turnBy(yaw: number) {
    diffDrive.resetPose()
    diffDrive.move(0, yaw)
    diffDrive.emitLine("CALL:turn want=" + lineRound(yaw, 2) + "deg odom="
        + lineRound(diffDrive.heading(), 2) + "deg")
}

// Clear, measure, nudge round, repeat until square. `dir` 1 measures driving
// forward (so it clears backwards), -1 measures in reverse. Returns the last
// reading, with ok=false if the robot never got within CALL_TOL.
function squareUp(dir: number): LineReading {
    let r = new LineReading()
    for (let pass = 1; pass <= CALL_MAX_PASSES; pass++) {
        if (!clearLine(-dir)) {
            r = new LineReading()
            r.why = "could not clear the line within " + CALL_CLEAR_MAX + "cm"
            return r
        }
        basic.pause(CALL_REVERSE_SETTLE)
        r = measureBothWays(pass == 1 ? CALL_HUNT_MAX : CALL_MEASURE_MAX)
        if (!r.ok) return r
        diffDrive.emitLine("CALL:pass " + pass + " angle=" + lineRound(r.angle, 2)
            + "deg disagree=" + lineRound(r.disagree, 2) + "deg")
        if (Math.abs(r.angle) <= CALL_TOL) return r
        turnBy(r.angle)
    }
    r.ok = false
    r.why = "still " + lineRound(r.angle, 2) + "deg off after " + CALL_MAX_PASSES + " passes"
    return r
}

// ---- calibrations that use the line as the reference --------------------
//
// Both anchor themselves first, like calx and cala: nothing in the TS API can
// read the current geometry back, so a correction has to be relative to a value
// this program set itself.
const CALT_TRACK = 11.5       // cm, the anchor track width (caliper figure from
                              // gopiv 2026-09-07; only splits the answer into
                              // trackWidth/slip, never moves the measurement)
const CALT_SLIP = 0.952       // the extension's compiled default
const CALD_BASELINE = 0.7878  // mm/deg, motion_engine.h's compiled default
const CALT_ROUNDS = 4         // iterations; the correction is a ratio, so a
                              // long way off needs more than one
const CALT_TOL = 2            // deg of unaccounted rotation per turn to accept
const CALT_HUNT = 20          // cm to hunt the line during a turn calibration:
                              // a mis-turned robot ends further off than the
                              // ordinary 12 cm allows
const CALD_EXTRA = 20         // cm of slack past the expected line-to-line gap

// Turn calibration. Square up, note the line angle, turn `deg` (a whole number
// of turns is best: the robot ends facing the same way, so the same line reads
// the same angle), then measure again.
//
// The angle CHANGE is the rotation error. The robot turned `deg` by its own
// odometry; the line says it actually turned `deg + extra`. Odometry degrees
// per true degree is deg / (deg + extra), and heading is inversely proportional
// to the effective track width b, so b_true = b_anchor * that ratio.
function calibrateTurn(deg: number) {
    const bAnchor = CALT_TRACK / CALT_SLIP
    diffDrive.emitLine("CALT:begin turn=" + deg + "deg anchor b=" + lineRound(bAnchor, 3)
        + "cm (track " + CALT_TRACK + " slip " + CALT_SLIP + ")")

    // ITERATIVE, and it has to be. The correction is a RATIO, so a single pass
    // only lands if the starting geometry is already close. It was not: on
    // tovez 2026-09-15 a commanded 175 deg came out as about -154 deg of real
    // rotation (camera), because the anchor above is gopiv's geometry. One pass
    // cannot cross a gap that size, but three or four can -- each round starts
    // from the previous round's answer.
    //
    // NO squaring first, deliberately: a turn calibration needs the SAME line
    // measured before and after, and the robot's skew cancels in the
    // difference. Requiring square first made this abort before it could fix
    // the very anchor that was breaking the squaring.
    //
    // WHOLE REVOLUTIONS ONLY. The robot ends facing the way it started, with
    // the same line ahead, so nothing direction-dependent creeps in: no
    // swapping to the perpendicular line family, and no forward/backward drift
    // asymmetry between the two measurements.
    let b = bAnchor
    let converged = false
    for (let round = 1; round <= CALT_ROUNDS; round++) {
        diffDrive.setTrackWidth(CALT_TRACK)
        diffDrive.setConfigValue(ConfigField.RotationalSlip, CALT_TRACK / b)

        if (!clearLine(-1)) {
            diffDrive.emitLine("CALT:fail round " + round + ": could not clear the line")
            basic.showIcon(IconNames.No)
            return
        }
        basic.pause(CALL_REVERSE_SETTLE)
        const before = measureBothWays(CALT_HUNT)
        if (!before.ok) {
            diffDrive.emitLine("CALT:fail round " + round + " before the turn: " + before.why)
            basic.showIcon(IconNames.No)
            return
        }

        turnBy(deg)
        basic.pause(CALL_REVERSE_SETTLE)
        if (!clearLine(-1)) {
            diffDrive.emitLine("CALT:fail round " + round + ": could not clear the line after the turn")
            basic.showIcon(IconNames.No)
            return
        }
        basic.pause(CALL_REVERSE_SETTLE)
        const after = measureBothWays(CALT_HUNT)
        if (!after.ok) {
            diffDrive.emitLine("CALT:fail round " + round + " after the turn: " + after.why)
            basic.showIcon(IconNames.No)
            return
        }

        // A line reads the same angle after a whole revolution, so whatever the
        // angle moved by is rotation the robot did NOT account for.
        const extra = before.angle - after.angle
        const trueDeg = deg + extra
        const bNext = b * deg / trueDeg
        diffDrive.emitLine("CALT:round " + round + " before=" + lineRound(before.angle, 2)
            + " after=" + lineRound(after.angle, 2) + " extra=" + lineRound(extra, 2)
            + "deg true=" + lineRound(trueDeg, 1) + "deg b=" + lineRound(b, 3)
            + " -> " + lineRound(bNext, 3) + "cm")
        b = bNext
        if (Math.abs(extra) <= CALT_TOL) { converged = true; break }
    }

    const slipTrue = CALT_TRACK / b
    diffDrive.setTrackWidth(CALT_TRACK)
    diffDrive.setConfigValue(ConfigField.RotationalSlip, slipTrue)
    diffDrive.emitLine("CALT:" + (converged ? "done" : "not converged")
        + " b=" + lineRound(b, 3) + "cm was " + lineRound(bAnchor, 3)
        + "cm  slip=" + lineRound(slipTrue, 4) + " was " + CALT_SLIP)
    diffDrive.emitLine("CALT:apply diffDrive.setTrackWidth(" + CALT_TRACK
        + "); diffDrive.setConfigValue(ConfigField.RotationalSlip, " + lineRound(slipTrue, 4) + ")")
    basic.showIcon(converged ? IconNames.Yes : IconNames.No)
}

// Distance calibration. From clear floor, drive across TWO parallel lines in one
// continuous run and compare the odometry gap between them with `trueCm`.
//
// Each crossing's position is the mean over the four channels of (near edge +
// far edge)/2. That cancels both the skew (the channels sit at different
// lateral positions) and the sensor's early-trigger/late-release lag, which the
// widths showed to be about 2 mm per edge. The sensor bar's offset ahead of the
// axle cancels too: it is the same at both lines.
function calibrateDistance(trueCm: number) {
    diffDrive.setWheelCalibration(CALD_BASELINE)
    diffDrive.emitLine("CALD:begin true=" + trueCm + "cm baseline=" + CALD_BASELINE + "mm/deg")
    if (linetrack.lineBits() != 0) {
        diffDrive.emitLine("CALD:fail not on clear floor -- clear the line first")
        basic.showIcon(IconNames.No)
        return
    }

    const maxCm = trueCm + CALD_EXTRA
    const lead = [0, 0, 0, 0]
    const trail = [0, 0, 0, 0]
    const lead2 = [0, 0, 0, 0]
    const trail2 = [0, 0, 0, 0]
    let seen = 0
    let gone = 0
    let seen2 = 0
    let gone2 = 0
    let lastX = 0
    const startedAt = control.millis()
    diffDrive.whileDriving(CALL_CREEP, 0, function (x, y, h) {
        const bits = linetrack.lineBits()
        for (let i = 0; i < 4; i++) {
            const bit = 1 << i
            const onLine = (bits & bit) != 0
            if (onLine && (seen & bit) == 0) { seen |= bit; lead[i] = (lastX + x) / 2 }
            else if (!onLine && (seen & bit) != 0 && (gone & bit) == 0) { gone |= bit; trail[i] = (lastX + x) / 2 }
            else if (onLine && (gone & bit) != 0 && (seen2 & bit) == 0) { seen2 |= bit; lead2[i] = (lastX + x) / 2 }
            else if (!onLine && (seen2 & bit) != 0 && (gone2 & bit) == 0) { gone2 |= bit; trail2[i] = (lastX + x) / 2 }
        }
        lastX = x
        if (gone2 == CALL_ALL_CHANNELS) { diffDrive.stop(); return }
        if (Math.abs(x) >= maxCm) { diffDrive.stop(); return }
        if (control.millis() - startedAt > CALL_MAX_SECS * 1000) { diffDrive.stop(); return }
    })

    if (gone2 != CALL_ALL_CHANNELS) {
        diffDrive.emitLine("CALD:fail crossed only " + (gone == CALL_ALL_CHANNELS ? "one line" : "part of one line")
            + " within " + maxCm + "cm")
        basic.showIcon(IconNames.No)
        return
    }

    let centreA = 0
    let centreB = 0
    for (let i = 0; i < 4; i++) {
        centreA += (lead[i] + trail[i]) / 2
        centreB += (lead2[i] + trail2[i]) / 2
    }
    centreA = centreA / 4
    centreB = centreB / 4
    const measured = centreB - centreA
    const corrected = CALD_BASELINE * trueCm / measured
    const diameter = corrected * 360 / Math.PI
    diffDrive.emitLine("CALD:lineA=" + lineRound(centreA, 2) + "cm lineB=" + lineRound(centreB, 2)
        + "cm measured=" + lineRound(measured, 2) + "cm true=" + trueCm + "cm"
        + " error=" + lineRound(measured - trueCm, 2) + "cm")
    diffDrive.emitLine("CALD:calib=" + lineRound(corrected, 4) + "mm/deg was " + CALD_BASELINE
        + "  diameter=" + lineRound(diameter, 2) + "mm")
    diffDrive.emitLine("CALD:apply diffDrive.setWheelCalibration(" + lineRound(corrected, 4) + ")")
    basic.showIcon(IconNames.Yes)
}

function runCalibrateL(dir: number) {
    diffDrive.emitLine("CALL:begin dir=" + (dir < 0 ? "reverse" : "forward")
        + " channels=" + CALL_LATERAL.join(",") + "cm tol=" + CALL_TOL + "deg")
    const r = squareUp(dir)
    if (!r.ok) {
        diffDrive.emitLine("CALL:fail " + r.why)
        basic.showIcon(IconNames.No)
        return
    }
    diffDrive.emitLine("CALL:square angle=" + lineRound(r.angle, 2) + "deg")
    basic.showIcon(IconNames.Yes)
}

// The menu entry: square up to a line ahead.
function calibrateL() {
    runCalibrateL(1)
}

// The i-th RUN argument as a number, or `fallback` when it is missing or not a
// number. Read through runArgText() rather than runArgOr(): runArgOr's third
// parameter defaults to NaN, which MakeCode refuses at a call site that omits
// it (TS9212).
function runNumber(i: number, fallback: number): number {
    const text = diffDrive.runArgText(i)
    if (text.length == 0) return fallback
    const v = parseFloat(text)
    return isNaN(v) ? fallback : v
}

// A missing or garbage direction argument means forward; any negative, reverse.
function runDirection(): number {
    return runNumber(0, 1) < 0 ? -1 : 1
}

diffDrive.onRun("call", function (arg) { runCalibrateL(runDirection()) })
diffDrive.runSignature("call", "(dir:number=1)")

// Measure without squaring. No argument (or 0) crosses the line forward AND
// back -- four fits, and the robot ends where it started. 1 or -1 makes a
// single pass in that direction.
diffDrive.onRun("linea", function (arg) {
    const dir = runNumber(0, 0)
    if (dir == 0) {
        const r = measureBothWays(CALL_HUNT_MAX)
        if (!r.ok) return
        diffDrive.emitLine("CALL:both angle=" + lineRound(r.angle, 2)
            + "deg disagree=" + lineRound(r.disagree, 2) + "deg"
            + " lead=" + lineRound(r.angleLead, 2) + " trail=" + lineRound(r.angleTrail, 2))
    } else {
        emitReading("measure", measureLineAngle(dir < 0 ? -1 : 1, CALL_HUNT_MAX))
    }
})
diffDrive.runSignature("linea", "(dir:number=0)")

// Turn in place, for putting the robot deliberately off square and re-checking.
diffDrive.onRun("turn", function (arg) { turnBy(runNumber(0, 0)) })
diffDrive.runSignature("turn", "(deg:number=0)")

// Turn calibration against the line: effective track width and rotational slip.
// REGISTRATION REMOVED -- the `calt` name now belongs to Calibrate T
// (test/calibratet.ts), which measures the same quantity far better: it defines
// 180 degrees from the TAPE (the sensor entry sequence during a pivot) instead
// of asking the odometry how far it turned, which is circular when the odometry
// is the thing being calibrated. calibrateTurn() is kept as a function because
// its correction formula bNext = b * deg/trueDeg is sound and was independently
// confirmed, but nothing registers it: two onRun() bindings of one name would
// collide, and the loser would be silently shadowed.
// diffDrive.onRun("calt", function (arg) { calibrateTurn(runNumber(0, 360)) })
// diffDrive.runSignature("calt", "(deg:number=360)")

// Distance calibration across two parallel lines: wheel travel per degree.
diffDrive.onRun("cald", function (arg) { calibrateDistance(runNumber(0, 31.35)) })
diffDrive.runSignature("cald", "(cm:number=31.35)")

// One nudge, reporting how far it moved -- for tuning CALL_NUDGE_SPEED/TICKS.
diffDrive.onRun("nudge", function (arg) {
    diffDrive.resetPose()
    nudge(runNumber(0, CALL_NUDGE_SPEED), runNumber(1, CALL_NUDGE_SPEED),
        runNumber(2, CALL_NUDGE_TICKS))
    basic.pause(CALL_NUDGE_SETTLE)
    diffDrive.emitLine("CALL:nudged x=" + lineRound(diffDrive.poseX(), 2)
        + "cm heading=" + lineRound(diffDrive.heading(), 2) + "deg")
})
diffDrive.runSignature("nudge", "(left:number=50,right:number=50,ticks:number=1)")

// The bar as text, channel 0 (left) first: # sees the line, . clear floor.
function barText(bits: number): string {
    let text = ""
    for (let i = 0; i < 4; i++) text = text + ((bits & (1 << i)) != 0 ? "#" : ".")
    return text
}

// Drive `cm` at CALL_CREEP (negative: backwards), printing the bar and the
// travel every time the bar changes -- for watching what the sensor does as it
// crosses a line, before trusting a measurement built on it.
function sweepLine(cm: number) {
    const dir = cm < 0 ? -1 : 1
    diffDrive.resetPose()
    const startedAt = control.millis()
    let last = linetrack.lineBits()
    diffDrive.emitLine("CALL:sweep " + cm + "cm start bar=" + barText(last))
    // Reverse needs the higher creep, same as measureLineAngle: at -4 cm/s the
    // robot does not move at all (see CALL_CREEP_REV).
    diffDrive.whileDriving(dir < 0 ? -CALL_CREEP_REV : CALL_CREEP, 0, function (x, y, h) {
        const bits = linetrack.lineBits()
        if (bits != last) {
            diffDrive.emitLine("CALL:bar=" + barText(bits) + " x=" + lineRound(x, 2)
                + "cm h=" + lineRound(h, 2) + "deg")
            last = bits
        }
        if (Math.abs(x) >= Math.abs(cm)) { diffDrive.stop(); return }
        if (control.millis() - startedAt > CALL_MAX_SECS * 1000) {
            diffDrive.stop()
            return
        }
    })
    diffDrive.emitLine("CALL:sweep end x=" + lineRound(diffDrive.poseX(), 2)
        + "cm bar=" + barText(linetrack.lineBits()))
}

diffDrive.onRun("sweep", function (arg) { sweepLine(runNumber(0, 15)) })
diffDrive.runSignature("sweep", "(cm:number=15)")
