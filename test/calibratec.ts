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
// THESE TWO ARE NOT ANY ROBOT'S GEOMETRY, and must never be set to one. They
// are an arbitrary REFERENCE the run writes before it starts, so that what it
// reports is a correction to something known rather than to whatever the robot
// happened to be carrying. The answer does not depend on their value: odometry
// heading scales as 1/b_anchor, so the measured gap does too, and b_true =
// b_anchor * slope cancels it exactly. Any anchor gives the same b.
//
// The compiled extension defaults are used simply because they are the one pair
// every robot already agrees on. Per-robot measured geometry belongs in
// radio-robot-lib config/robots/<name>.json and in boot.ts's per-robot blocks --
// NOT here. A value that is right for one robot would be wrong for the rest, and
// this file runs on all of them.
//
// THE ONE THING THAT DOES NOT CANCEL is the commanded wheel speed below, which
// is derived from b_anchor -- see CC_SPIN.
//
// TRAP: a run leaves these in RAM and does not restore the robot's real values,
// so a robot is mis-calibrated until its next reset or reflash.
const CC_TRACK = 11.42       // cm, the anchor track width (compiled default)
const CC_SLIP = 0.952        // compiled default; b_anchor = 11.42/0.952 = 12.0
const CC_SECTOR = 45         // deg per sector -- the quantity being measured
const CC_SPIN = 70           // deg/s. One ~24 ms tick is 1.7 deg, so a single
                             // transition is placed to within half a tick;
                             // averaging 32 gaps takes that well below 0.1 deg.
                             //
                             // THIS IS A COMMANDED RATE AGAINST THE ANCHOR, not
                             // the rate the robot actually turns. The wheel
                             // speed is derived from b_anchor, so every robot
                             // spins its wheels at the same 73.3 mm/s -- but the
                             // yaw rate that produces is CC_SPIN*b_anchor/b_true,
                             // which equals 70 only for a robot needing no
                             // correction. The rate shifts by exactly the
                             // correction being measured, so it is per-robot and
                             // is recorded per robot, as actual_spin_deg_s in
                             // radio-robot-lib config/robots/<name>.json.
                             //
                             // Harmless for the floor below, which is a
                             // WHEEL-speed threshold and so identical for every
                             // robot. NOT harmless when comparing against
                             // methods run at other speeds, since that residual
                             // is speed dependent. Say "commanded 70 deg/s,
                             // 73.3 mm/s per wheel", never "measured at 70".
                             //
                             // NOT SLOWER, and this is the single most important
                             // constant in the file. A pivot runs one wheel
                             // BACKWARDS, and this drivetrain does not break away
                             // in reverse at low speed -- calibratet.ts says so
                             // independently. Below the floor the reversing wheel
                             // barely turns, the robot arcs about it instead of
                             // pivoting, and that breaks the fixed-centre
                             // assumption the whole method rests on. The bias is
                             // one-sided and averaging cannot find it.
                             //
                             // WHERE 70 COMES FROM, AND HOW FAR IT IS TRUSTED:
                             // a rate sweep on ONE robot -- gopiv, 2026-09-17,
                             // recorded with its numbers in that robot's own
                             // config/robots/gopiv.json. It put the step between
                             // 50 and 60 deg/s and picked 70 as clear of it.
                             // Every other robot inherits that number WITHOUT
                             // its own sweep. Caster loading differs sharply
                             // across these chassis and caster loading is what
                             // the breakaway is about, so the floor may well move
                             // between robots. Sweeping costs no reflash: cttune
                             // sets the rate over the wire.
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

function runCalibrateC(edgesWanted: number) {
    // THE WINDOW MUST BE A WHOLE NUMBER OF REVOLUTIONS, and this is not a
    // nicety. Off-centre, the eight apparent sector angles are not 45 each --
    // MEASURED gopiv 2026-09-17, they swung 48.3, 45.0, 42.2, 40.0 around one
    // turn, an 8 degree spread on a 45 degree quantity. They still SUM to 360,
    // so a window of exactly 8 gaps cancels the offset completely; any other
    // window keeps part of the swing, and the leftover looks EXACTLY like a
    // calibration error rather than a centring error.
    //
    // One gap per channel is discarded (the robot starts mid-sector), so the
    // usable window is edges-2 and that is what must be a multiple of 8.
    // `calc 10` gives 8 gaps, one revolution -- which was luck the first time
    // this ran, not design. `calc 12` would have returned a biased number with
    // no outward sign of it.
    const revs = Math.max(1, Math.round((edgesWanted - 2) / 8))
    const edges = 2 + 8 * revs
    if (edges != edgesWanted) {
        diffDrive.emitLine("CALC:edges " + edgesWanted + " -> " + edges
            + " (the window must be a whole number of revolutions: 8n+2)")
    }
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

    // ---- report, as packed JSON Lines --------------------------------------
    // Every line here goes through epPush()/epFlush() (emitpack.ts), which
    // fills a 200-byte frame before sending instead of spending one frame per
    // 60-byte line. THAT IS NOT COSMETIC: a RUN verb is a live motion
    // obligation, so the transport does not apply backpressure and silently
    // drops whatever does not fit -- this report lost its last three lines
    // every run until it was packed. See emitpack.ts for the mechanism.
    //
    // JSON Lines, one object per line, so a consumer parses instead of
    // regexing. Keys are short because every byte competes for a frame.
    let grand = 0
    let grandN = 0
    let worstSd = 0
    let chLo = 1e9
    let chHi = -1e9
    let chUsable = 0
    for (let c = 0; c < 4; c++) {
        const list = ccEdgesFor(c)
        const mean = ccMeanGap(list)
        if (mean < 0) {
            epPush(epNum(epStr(epObj("calc.ch"), "state", "unusable"),
                "i", c, 0) + ",\"n\":" + list.length + "}")
            continue
        }
        const sd = ccSpread(list)
        if (sd > worstSd) worstSd = sd
        if (mean < chLo) chLo = mean
        if (mean > chHi) chHi = mean
        chUsable++
        // i=channel, n=transitions, gap=mean gap [deg], sd=its spread,
        // slope=gap/sector.
        let o = epObj("calc.ch")
        o = epNum(o, "i", c, 0)
        o = epNum(o, "n", list.length, 0)
        o = epNum(o, "gap", mean, 3)
        o = epNum(o, "sd", sd, 3)
        o = epNum(o, "slope", mean / CC_SECTOR, 4)
        epPush(o + "}")
        grand += mean * (list.length - 2)
        grandN += list.length - 2
    }

    if (grandN < 4) {
        let f = epObj("calc.fail")
        f = epNum(f, "gaps", grandN, 0)
        f = epStr(f, "why", "too few usable gaps; centre the robot on the cross")
        epPush(f + "}")
        epFlush()
        basic.showIcon(IconNames.No)
        return
    }

    const meanGap = grand / grandN
    const slope = meanGap / CC_SECTOR
    const bTrue = bAnchor * slope
    const slipTrue = CC_TRACK / bTrue

    // THE RESULT. `b` is the measurement and the only thing a spin establishes.
    //
    // `slip_at_tw` IS NOT A ROBOT CONSTANT, and the key is named to say so. It
    // is tw/b against the ANCHOR track width this run wrote before it started,
    // which is the compiled default and not the robot's real track. Across this
    // fleet the caliper widths are 111.4, 111.6, 113.6 and 114.4 mm against an
    // anchor of 114.2, so applying it verbatim mis-calibrates every one of
    // them. A consumer wanting a slip must divide ITS OWN track width by `b`;
    // `tw` is emitted beside it so the arithmetic is checkable. Nothing in the
    // TS API can read the robot's geometry back, so this run cannot do that
    // division itself.
    let r = epObj("calc.result")
    r = epNum(r, "b", bTrue, 3)
    r = epNum(r, "tw", CC_TRACK, 2)
    r = epNum(r, "slip_at_tw", slipTrue, 4)
    r = epNum(r, "slope", slope, 4)
    r = epNum(r, "gaps", grandN, 0)
    r = epNum(r, "anchor_b", bAnchor, 3)
    epPush(r + "}")

    // QUALITY. sd and spread measure the same thing two ways: how steadily the
    // robot held a pivot. MEASURED across the fleet 2026-09-17, sd tracked walk
    // per revolution -- tigez 3.7 deg at 0.25 cm, gopiv 7.6 at 0.5, vevov 9.8
    // at 0.5 systematic. spread is the disagreement between the four channels'
    // own means, which for a FIXED centre must be zero: every channel sees all
    // eight sectors over a whole revolution, so each mean is 45 exactly.
    // Anything above ~0.2 deg is the centre moving during the run.
    let q = epObj("calc.quality")
    q = epNum(q, "sd", worstSd, 3)
    q = epNum(q, "spread", chUsable > 0 ? chHi - chLo : 0, 3)
    q = epNum(q, "ch", chUsable, 0)
    q = epNum(q, "gap", meanGap, 3)
    q = epNum(q, "sector", CC_SECTOR, 0)
    q = epNum(q, "spin", CC_SPIN, 0)
    q = epNum(q, "wheel", wheel, 2)
    epPush(q + "}")
    epFlush()
    basic.showIcon(IconNames.Yes)
}

function calibrateC() {
    runCalibrateC(CC_EDGES)
}

diffDrive.onRun("calc", function (arg) { runCalibrateC(runNumber(0, CC_EDGES)) })
diffDrive.runSignature("calc", "(edges:number=10)")
