// calibratet.ts — Calibrate T: turn calibration from a sensor-defined 180.
// Menu picture: a circular arrow, or RUN calt [turns]
//
// SETUP. Run calj first. It leaves the robot at the finish crossbar, straddling
// the LEFT edge of the centre stripe with the edge under its centre line, facing
// west. Calibrate T starts from exactly there.
//
// ---- WHY THIS IS BETTER THAN TURNING BY ODOMETRY --------------------------
//
// Every earlier attempt measured a turn by asking the robot how far it had
// turned, which is circular: the odometry IS the thing being calibrated. Here
// the TAPE defines 180 degrees and the odometry is only measured against it.
//
// The sensor bar sits ~17 cm AHEAD of the axle, so each channel lies at its own
// angle off the robot's axis:
//
//     phi_i = atan(lateral_i / 17)   ->   +10.0, +2.0, -2.0, -10.0 degrees
//
// Pivoting in place, each channel crosses the stripe edge when its own phi
// carries it there, so turning CCW from west they go dark in order:
//
//     sensor 1 (ch0) at 170 deg     sensor 3 (ch2) at 182 deg
//     sensor 2 (ch1) at 178 deg     sensor 4 (ch3) at 190 deg
//
// which is exactly the 1-2-3 sequence Eric described. THE PAYOFF: channels 1
// and 2 sit symmetrically either side of the centre line, so
//
//     true 180 = (entry_ch1 + entry_ch2) / 2
//
// exactly, and channels 0 and 3 give the same number on a wider baseline as an
// independent check. Turning CW from east mirrors it -- order 4,3,2,1 -- and the
// midpoint is still exactly 180.
//
// So the measurement is: sweep past 180, record the odometry heading at each
// channel's entry, and compare the sensor-defined 180 with what the odometry
// thought. Heading is (dRight - dLeft)/b, so
//
//     b_true = b_anchor * (odometry at the true 180) / 180
//
// BACK OFF FIRST. calj stops with the bar ON the finish crossbar. Pivoting there
// sweeps the sensors across the crossbar as well as the stripe, and the crossbar
// is full width -- every channel would trigger on it. Reversing CT_BACKOFF
// first puts the bar's 17 cm sweep circle clear of the crossbar while the stripe
// still runs through the axle, so the only tape the sweep meets is the stripe.
//
// ANCHORED, like calx/cala/calt: nothing in the TS API reads the current
// geometry back, so the run sets it and reports a correction relative to what it
// set.
const CT_TRACK = 11.42      // cm, the anchor track width (the compiled default)
const CT_SLIP = 0.952       // the compiled default; b_anchor = 11.42/0.952 = 12.0 cm
let CT_SPEED = 5            // cm/s per wheel in the pivot, opposite signs. At
                              // b = 12 cm this is about 52 deg/s, so one ~24 ms
                              // tick is ~1.2 deg -- and the midpoint of two
                              // entries halves that. Slower would resolve better
                              // but a pivot runs one wheel BACKWARDS, and this
                              // fleet does not break away in reverse much below
                              // 10 cm/s (calibratel.ts CALL_CREEP_REV).
const CT_ARM = 100          // deg of sweep before entries are recorded, so the
                              // channels already dark at the start are not read
                              // as crossings
const CT_MAX_SWEEP = 250    // deg before giving up
const CT_BACKOFF = 12       // cm reversed off the crossbar before pivoting
const CT_BACK_SPEED = 11    // cm/s for that reverse
const CT_SECS = 45          // s per pivot
let CT_RECENTRE = 35        // cm driven under the straddle controller before each
                            // pivot PAIR. NOT just to fix lateral position -- to
                            // settle HEADING. A `..#.` reading pins where the
                            // robot sits on the edge but says nothing about which
                            // way it POINTS: it can straddle the edge perfectly
                            // while crabbing at an angle, and that angle goes
                            // straight into the measurement, because the pivot
                            // accumulates odometry from wherever it started.
                            // Following a line for tens of centimetres is what
                            // forces the heading to converge -- you cannot track
                            // a line that far while crabbing. An earlier 10 cm
                            // hop was far too short and left the controller
                            // mid-correction (gopiv 2026-09-16: four clean
                            // straddling starts still gave 175.3, 179.6 and
                            // 186.5 on different runs).
const CT_SETTLE = 25        // consecutive in-deadband ticks required before the
                            // pivot may start, so it never begins mid-correction
let CT_SETTLE_EXTRA = 25    // cm of extra travel allowed while waiting to settle
// BOTH ARE `let`, and set over the wire by `cttune`, because where the pivot
// HAPPENS is a property of the field, not of the robot. The pivot sweeps the
// sensor bar around a circle of the lever's radius, and every piece of tape
// that circle touches becomes a false entry angle. On the secondary playfield
// a third full-width line crosses the stripe at its midpoint (surveyed
// 2026-09-17: crossbars at -37.5 and +38.8 cm, the mid line at -0.3), so a
// 35 cm recentre from the west crossbar stops the robot right on top of it.
// Driving further -- far enough to put the pivot between the mid line and the
// finish -- is the fix, and it costs nothing: a longer line-follow settles the
// heading better, which is the whole point of the drive.
//
// ---- WHY RE-CENTRING IS NOT OPTIONAL --------------------------------------
// The midpoint estimator is NOT independent of lateral position, though an
// earlier revision of this file claimed it was. With the edge offset by d from
// the pivot centre, entries land at psi = 180 - arcsin(d/r) +- phi, so the
// midpoint reads 180 - arcsin(d/r). At r ~ 17 cm a 2 cm offset is 6.8 deg.
// MEASURED gopiv 2026-09-16: two pivots that stayed on the edge gave 179.64
// (error -0.36); four pivots that drifted off it gave 186.59 (error +6.59),
// with the start bars degrading ..#. -> .##. -> .... and the camera showing
// 0.7 cm of lateral walk.
//
// The inner/outer agreement does NOT catch this: both pairs carry the SAME
// arcsin(d/r) bias, so they agree to a few tenths of a degree while both are
// wrong together. That agreement tests symmetry, never centring.

// Entry headings for the four channels, -1 until seen.
let caltEntry = [-1, -1, -1, -1]

// Reverse clear of the crossbar so the sweep meets only the stripe.
function caltBackOff(): boolean {
    diffDrive.resetPose()
    const startedAt = control.millis()
    diffDrive.setWheelSpeeds(-CT_BACK_SPEED, -CT_BACK_SPEED)
    while (diffDrive.driveTick()) {
        if (Math.abs(diffDrive.poseX()) >= CT_BACKOFF) break
        if (control.millis() - startedAt > CT_SECS * 1000) { diffDrive.stop(); return false }
    }
    diffDrive.stop()
    return true
}

// Drive `cm` forward under calibratej's straddle controller, so the stripe edge
// ends up under the robot's centre line -- and therefore under the pivot centre.
function ctRecentre(cm: number): boolean {
    diffDrive.resetPose()
    let blind = 0
    let settled = 0
    const startedAt = control.millis()
    diffDrive.setWheelSpeeds(CALJ_SPEED, CALJ_SPEED)
    while (diffDrive.driveTick()) {
        const x = diffDrive.poseX()
        const bits = linetrack.lineBits()
        const edge = caljEdge(bits)
        if (bits == CALJ_ALL) {
            // A full-width line under every channel -- the mid-field line on
            // this course. It carries no lateral information, so hold course
            // and leave `settled` alone rather than reading it as a 0.6 cm
            // error and throwing away a settle that was already earned.
            diffDrive.setWheelSpeeds(CALJ_SPEED, CALJ_SPEED)
            blind = 0
        } else if (edge > 900) {
            blind++
            if (blind > 60) { diffDrive.stop(); return false }
        } else {
            blind = 0
            const err = edge - caljTarget()
            let steer = 0
            if (Math.abs(err) <= CALJ_DEADBAND) { settled++ } else {
                settled = 0
                steer = CALJ_KP * err
                if (steer > CALJ_MAX_STEER) steer = CALJ_MAX_STEER
                if (steer < -CALJ_MAX_STEER) steer = -CALJ_MAX_STEER
            }
            diffDrive.setWheelSpeeds(CALJ_SPEED - steer, CALJ_SPEED + steer)
        }
        // Past the nominal distance, keep going until the steering has been
        // inside the deadband for CT_SETTLE consecutive ticks -- that is the
        // observable proxy for "heading has converged on the line".
        if (x >= cm && settled >= CT_SETTLE) break
        if (x >= cm + CT_SETTLE_EXTRA) {
            diffDrive.stop()
            diffDrive.emitLine("CALT:recentre never settled (" + settled + " ticks)")
            return false
        }
        if (control.millis() - startedAt > CT_SECS * 1000) { diffDrive.stop(); return false }
    }
    diffDrive.stop()
    diffDrive.emitLine("CALT:recentre " + lineRound(Math.abs(diffDrive.poseX()), 1)
        + "cm settled=" + settled + "ticks")
    return true
}

// One instrumented pivot. dir +1 is CCW, -1 is CW. Returns the odometry heading
// at the sensor-defined 180, or -1 if the sweep never found both inner channels.
function caltPivot(dir: number): number {
    diffDrive.resetPose()
    caltEntry = [-1, -1, -1, -1]
    let last = linetrack.lineBits()
    let seen = 0
    const startedAt = control.millis()
    diffDrive.emitLine("CALT:pivot " + (dir > 0 ? "CCW" : "CW") + " start bar=" + caljBar(last))

    diffDrive.setWheelSpeeds(-dir * CT_SPEED, dir * CT_SPEED)
    while (diffDrive.driveTick()) {
        const p = dir * diffDrive.heading()     // sweep progress, always positive
        const bits = linetrack.lineBits()
        if (p >= CT_ARM) {
            for (let i = 0; i < 4; i++) {
                const bit = 1 << i
                if ((bits & bit) != 0 && (last & bit) == 0 && caltEntry[i] < 0) {
                    caltEntry[i] = p
                    seen++
                    diffDrive.emitLine("CALT:ch" + i + " entry=" + lineRound(p, 2)
                        + "deg bar=" + caljBar(bits))
                }
            }
        }
        last = bits
        if (seen == 4) break
        if (p >= CT_MAX_SWEEP) break
        if (control.millis() - startedAt > CT_SECS * 1000) break
    }
    diffDrive.stop()

    if (caltEntry[1] < 0 || caltEntry[2] < 0) {
        diffDrive.emitLine("CALT:fail inner channels not both seen ("
            + lineRound(caltEntry[1], 1) + "," + lineRound(caltEntry[2], 1) + ")")
        return -1
    }
    // The estimator: channels 1 and 2 straddle the centre line symmetrically.
    const inner = (caltEntry[1] + caltEntry[2]) / 2
    let line = "CALT:" + (dir > 0 ? "CCW" : "CW") + " inner180=" + lineRound(inner, 2) + "deg"
    if (caltEntry[0] >= 0 && caltEntry[3] >= 0) {
        const outer = (caltEntry[0] + caltEntry[3]) / 2
        line = line + " outer180=" + lineRound(outer, 2)
            + "deg disagree=" + lineRound(inner - outer, 2) + "deg"
    }
    diffDrive.emitLine(line)

    // Land on the sensor-defined 180 rather than wherever the sweep stopped, so
    // the robot is square for whatever runs next.
    const over = dir * diffDrive.heading() - inner
    if (Math.abs(over) > 1) diffDrive.move(0, -dir * over)
    return inner
}

function runCalibrateT(turns: number) {
    diffDrive.setTrackWidth(CT_TRACK)
    diffDrive.setConfigValue(ConfigField.RotationalSlip, CT_SLIP)
    const bAnchor = CT_TRACK / CT_SLIP
    diffDrive.emitLine("CALT:begin pairs=" + turns + " anchor b=" + lineRound(bAnchor, 3)
        + "cm (track " + CT_TRACK + " slip " + CT_SLIP + ") speed=" + CT_SPEED + "cm/s")

    if (!caltBackOff()) {
        diffDrive.emitLine("CALT:fail could not back off the crossbar")
        basic.showIcon(IconNames.No)
        return
    }
    diffDrive.emitLine("CALT:backed off " + CT_BACKOFF + "cm bar=" + caljBar(linetrack.lineBits()))
    basic.pause(CALL_REVERSE_SETTLE)

    let sum = 0
    let n = 0
    for (let t = 1; t <= turns; t++) {
        // Re-centre before each PAIR. A pair (CCW then CW) returns the robot to
        // its starting heading, so the straddle controller can run in its normal
        // sense; re-centring between the two halves would need the flipped sense.
        if (!ctRecentre(CT_RECENTRE)) {
            diffDrive.emitLine("CALT:fail lost the stripe while re-centring")
            basic.showIcon(IconNames.No)
            return
        }
        const bits = linetrack.lineBits()
        const e = caljEdge(bits)
        diffDrive.emitLine("CALT:centred bar=" + caljBar(bits) + " edge="
            + (e > 900 ? "blind" : "" + lineRound(e - caljTarget(), 2) + "cm"))

        // REFUSE rather than measure from a bad start. The whole method assumes
        // the stripe edge runs under the pivot centre; if no inner channel sees
        // tape, or an OUTER one does, the robot is not straddling the edge and
        // every entry angle is meaningless. MEASURED gopiv 2026-09-16: a run
        // that began `bar=....` (robot off the stripe and facing the wrong way
        // entirely) reported a confident 161.72 deg and slip 1.0596. An earlier
        // revision printed exactly that diagnostic and carried on anyway, which
        // is worse than not printing it -- the number looked like a result.
        if (bits == 0 || (bits & CALJ_OUTER) != 0) {
            diffDrive.emitLine("CALT:fail not straddling the edge (bar="
                + caljBar(bits) + ") -- refusing to measure. Run calj first, or"
                + " put the robot back on the stripe facing along it.")
            basic.showIcon(IconNames.No)
            return
        }

        const ccw = caltPivot(1)
        if (ccw < 0) { basic.showIcon(IconNames.No); return }
        sum += ccw; n++
        basic.pause(CALL_REVERSE_SETTLE)

        const cw = caltPivot(-1)
        if (cw < 0) { basic.showIcon(IconNames.No); return }
        sum += cw; n++
        basic.pause(CALL_REVERSE_SETTLE)
    }

    const mean = sum / n
    const bTrue = bAnchor * mean / 180
    const slipTrue = CT_TRACK / bTrue
    diffDrive.emitLine("CALT:mean odom=" + lineRound(mean, 2) + "deg for a true 180"
        + " over " + n + " pivots  error=" + lineRound(mean - 180, 2) + "deg")
    diffDrive.emitLine("CALT:b=" + lineRound(bTrue, 3) + "cm was " + lineRound(bAnchor, 3)
        + "cm  slip=" + lineRound(slipTrue, 4) + " was " + CT_SLIP)
    diffDrive.emitLine("CALT:apply diffDrive.setTrackWidth(" + CT_TRACK
        + "); diffDrive.setConfigValue(ConfigField.RotationalSlip, "
        + lineRound(slipTrue, 4) + ")")
    basic.showIcon(IconNames.Yes)
}

// The menu entry: two pivots, one each way.
function calibrateT() {
    runCalibrateT(2)
}

diffDrive.onRun("calt", function (arg) { runCalibrateT(runNumber(0, 2)) })
diffDrive.runSignature("calt", "(pairs:number=2)")

// The pivot speed, tunable over the wire for the same reason the straddle gains
// are (see calibratej.ts): a Pi-hosted robot cannot be reflashed to try a
// different one. Slower resolves the entry angles better -- one tick is
// CT_SPEED-dependent -- but a pivot runs one wheel backwards and this fleet does
// not break away in reverse much below 10 cm/s, so there is a floor.
diffDrive.onRun("cttune", function (arg) {
    CT_SPEED = runNumber(0, CT_SPEED)
    CT_RECENTRE = runNumber(1, CT_RECENTRE)
    CT_SETTLE_EXTRA = runNumber(2, CT_SETTLE_EXTRA)
    diffDrive.emitLine("CALT:tune speed=" + CT_SPEED + "cm/s recentre=" + CT_RECENTRE
        + "cm extra=" + CT_SETTLE_EXTRA + "cm")
})
diffDrive.runSignature("cttune", "(speed:number,recentre:number,extra:number)")
