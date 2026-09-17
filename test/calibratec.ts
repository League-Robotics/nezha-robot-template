// calibratec.ts — Calibrate C: rotation calibration on an alternating iron cross.
// Menu picture: an X, or RUN calc [edges]
//
// SETUP. An eight-sector "iron cross": four black wedges alternating with four
// white ones, every sector 45 degrees, boundaries RADIAL from the centre. Put
// the robot on the middle and spin it.
//
// ---- WHY THIS IS BETTER THAN calt, AND IT IS NOT A SMALL DIFFERENCE --------
//
// calt measures a turn from four channel entry angles against ONE stripe edge,
// and its estimator carries an arcsin(d/r) bias: r is the sensor's radius from
// the pivot centre, so a centring error of d costs an angle that GROWS as the
// lever shortens. Measuring r turned out to be the hard part -- three attempts
// on vevov gave 4.3, 11 and 20 cm from the same sweeps, because the robot does
// not pivot about a fixed centre and `edge travel = L * angle` is then false.
//
// A RADIAL boundary removes the whole problem. Sensor i crosses a boundary when
// the robot has turned to bring it there, so different sensors cross at
// different angles -- but the GAP between one sensor's OWN consecutive
// crossings is the sector angle itself, 45 degrees, and that is true whatever
// the sensor's radius, its lateral offset, or the length of the lever arm.
// The lever does not appear in the measurement at all.
//
// Centring is forgiving too. Off-centre, the eight apparent sector angles
// distort -- but they still SUM to 360, so averaging over whole revolutions
// cancels the offset to first order. calt had no such cancellation: its bias
// was one-sided and survived averaging, which is why six pairs on gopiv agreed
// to 0.08 deg while three on vevov spread over 19.
//
// And it is 40 samples instead of 4. Ten transitions on each of four channels,
// every gap an independent estimate of the same 45 degrees.
//
// ---- THE MATHS ------------------------------------------------------------
//
// Odometry turns wheel travel into heading by dividing by the effective track
// width b (motion_engine.h: b = trackWidth / rotationalSlip). Heading is
// inversely proportional to b, so if a true 45 reads as `measured`:
//
//     slope  = measured / 45
//     b_true = b_anchor * slope
//
// A robot that under-rotates reports MORE degrees than it turned, slope > 1,
// and b has to grow. This measures ONE number, b -- a spin cannot separate
// trackWidth from rotationalSlip, because every consumer reads only their
// ratio (see calibratea.ts's own note). Pin trackWidth with a caliper and slip
// falls out as trackWidth / b.
//
// ANCHORED, like calx/cala/calt: nothing in the TS API reads the geometry back,
// so the run SETS it and reports a correction relative to what it set.
const CC_TRACK = 11.42       // cm, the anchor track width (compiled default)
const CC_SLIP = 0.952        // compiled default; b_anchor = 11.42/0.952 = 12.0
const CC_SECTOR = 45         // deg per sector -- the quantity being measured
const CC_SPIN = 30           // deg/s. One ~24 ms tick is 0.7 deg, so a single
                             // transition is placed to within half a tick;
                             // averaging ~36 gaps takes that well below 0.1 deg.
const CC_EDGES = 10          // transitions to collect PER CHANNEL. The first
                             // gap of each channel is discarded (it starts
                             // wherever the robot was parked, mid-sector), so
                             // this yields CC_EDGES-2 usable gaps per channel.
const CC_MAX_SWEEP = 2000    // deg before giving up -- 10 transitions needs
                             // ~5.5 revolutions at 8 per revolution.
const CC_MAX_SECS = 120      // s. The second way out, and the one that matters
                             // if the robot stalls: a sweep limit alone never
                             // arrives when the heading stops advancing.
const CC_SETTLE = 300        // ms of stillness before the spin, so the first
                             // gap is not contaminated by start-up backlash.

// Per-channel transition headings. PXT has no 2-D literal that survives the
// static compiler cleanly, so these are four flat arrays.
let ccEdge0: number[] = []
let ccEdge1: number[] = []
let ccEdge2: number[] = []
let ccEdge3: number[] = []

function ccEdgesFor(ch: number): number[] {
    if (ch == 0) return ccEdge0
    if (ch == 1) return ccEdge1
    if (ch == 2) return ccEdge2
    return ccEdge3
}

// Mean gap between consecutive transitions, skipping the FIRST gap: the robot
// starts mid-sector, so its first crossing is a partial sector and the gap that
// ends on it is not a 45. Returns -1 when there is nothing usable.
function ccMeanGap(list: number[]): number {
    if (list.length < 3) return -1
    let sum = 0
    let n = 0
    for (let i = 2; i < list.length; i++) {
        sum += list[i] - list[i - 1]
        n++
    }
    return n > 0 ? sum / n : -1
}

function ccSpread(list: number[]): number {
    const mean = ccMeanGap(list)
    if (mean < 0) return -1
    let sumSq = 0
    let n = 0
    for (let i = 2; i < list.length; i++) {
        const d = (list[i] - list[i - 1]) - mean
        sumSq += d * d
        n++
    }
    return n > 1 ? Math.sqrt(sumSq / (n - 1)) : 0
}

function runCalibrateC(edges: number) {
    diffDrive.setTrackWidth(CC_TRACK)
    diffDrive.setConfigValue(ConfigField.RotationalSlip, CC_SLIP)
    const bAnchor = CC_TRACK / CC_SLIP
    diffDrive.emitLine("CALC:begin edges=" + edges + " sector=" + CC_SECTOR
        + "deg anchor b=" + lineRound(bAnchor, 3) + "cm (track " + CC_TRACK
        + " slip " + CC_SLIP + ") spin=" + CC_SPIN + "deg/s")

    ccEdge0 = []; ccEdge1 = []; ccEdge2 = []; ccEdge3 = []

    // Wheel speed for CC_SPIN deg/s: each wheel runs at omega * b/2, opposite
    // signs. Derived from the ANCHOR b, which is the whole point -- the answer
    // is a correction to it.
    const wheel = CC_SPIN * Math.PI / 180 * bAnchor / 2

    basic.pause(CC_SETTLE)
    diffDrive.resetPose()
    let last = linetrack.lineBits()
    let done = 0
    const startedAt = control.millis()
    diffDrive.emitLine("CALC:spin start bar=" + caljBar(last)
        + " wheel=" + lineRound(wheel, 2) + "cm/s")

    diffDrive.setWheelSpeeds(-wheel, wheel)
    while (diffDrive.driveTick()) {
        const h = diffDrive.heading()
        const bits = linetrack.lineBits()
        if (bits != last) {
            // EVERY transition counts, white->black and black->white alike:
            // with eight sectors each sensor sees eight per revolution and the
            // gaps are all 45. Taking only one polarity would halve the data
            // for no gain in accuracy.
            for (let i = 0; i < 4; i++) {
                const bit = 1 << i
                if ((bits & bit) != (last & bit)) {
                    const list = ccEdgesFor(i)
                    if (list.length < edges) {
                        list.push(h)
                        diffDrive.emitLine("CALC:ch" + i + " n=" + list.length
                            + " h=" + lineRound(h, 2) + "deg bar=" + caljBar(bits))
                    }
                }
            }
            last = bits
            done = 0
            for (let j = 0; j < 4; j++) {
                if (ccEdgesFor(j).length >= edges) done++
            }
            if (done == 4) break
        }
        if (Math.abs(h) >= CC_MAX_SWEEP) break
        if (control.millis() - startedAt > CC_MAX_SECS * 1000) break
        // Refreshed EVERY tick. A drive that sets the speed once has been seen
        // to stop after a few ticks on this fleet; calj's phase 3 is the one
        // loop that never suffered it, and this is why.
        diffDrive.setWheelSpeeds(-wheel, wheel)
    }
    diffDrive.stop()

    // ---- report -----------------------------------------------------------
    let grand = 0
    let grandN = 0
    for (let c = 0; c < 4; c++) {
        const list = ccEdgesFor(c)
        const mean = ccMeanGap(list)
        if (mean < 0) {
            diffDrive.emitLine("CALC:ch" + c + " unusable (" + list.length
                + " transitions)")
            continue
        }
        diffDrive.emitLine("CALC:ch" + c + " n=" + list.length + " meangap="
            + lineRound(mean, 3) + "deg sd=" + lineRound(ccSpread(list), 3)
            + " slope=" + lineRound(mean / CC_SECTOR, 4))
        grand += mean * (list.length - 2)
        grandN += list.length - 2
    }

    if (grandN < 4) {
        diffDrive.emitLine("CALC:fail only " + grandN + " usable gaps -- NOT"
            + " reporting a calibration. Centre the robot on the cross and"
            + " make sure all four channels cross the sectors.")
        basic.showIcon(IconNames.No)
        return
    }

    const meanGap = grand / grandN
    const slope = meanGap / CC_SECTOR
    const bTrue = bAnchor * slope
    const slipTrue = CC_TRACK / bTrue
    diffDrive.emitLine("CALC:gaps=" + grandN + " mean=" + lineRound(meanGap, 3)
        + "deg for a true " + CC_SECTOR + "  slope=" + lineRound(slope, 4))
    diffDrive.emitLine("CALC:b=" + lineRound(bTrue, 3) + "cm was "
        + lineRound(bAnchor, 3) + "cm  slip=" + lineRound(slipTrue, 4)
        + " was " + CC_SLIP)
    diffDrive.emitLine("CALC:apply diffDrive.setTrackWidth(" + CC_TRACK
        + "); diffDrive.setConfigValue(ConfigField.RotationalSlip, "
        + lineRound(slipTrue, 4) + ")")
    basic.showIcon(IconNames.Yes)
}

function calibrateC() {
    runCalibrateC(CC_EDGES)
}

diffDrive.onRun("calc", function (arg) { runCalibrateC(runNumber(0, CC_EDGES)) })
diffDrive.runSignature("calc", "(edges:number=10)")
