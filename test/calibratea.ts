// calibratea.ts — Calibrate A: rotation calibration on a black cross.
// Menu symbol +, or RUN:cala
//
// SETUP. Two strips of black tape crossing at right angles. Put the robot in
// the middle: the wheel axle lined up along one arm, the forward-back axis
// along the other. The reflectance sensor is then looking down an arm.
//
// WHAT IT DOES. The robot spins in place, one direction, without stopping. It
// ignores the reflectance bar entirely until the bar reads all-white -- that is
// the arming point, and it is the only starting state recognisable without
// knowing where the robot was parked. From there ONE middle sensor watches for
// white-to-black transitions: every one is the leading edge of an arm, so the
// robot has turned exactly 90 more degrees. Six are collected and the last five
// used, which drops a spurious first reading; the earliest of those five is the
// zero and the other four are the cardinals. Reading the odometry heading back
// at the fourth says how much the odometry over- or under-counts a whole turn.
//
// THE MATHS. Odometry turns wheel travel into heading by dividing by the
// effective track width b (motion_engine.h: b = trackWidth / rotationalSlip).
// Heading is inversely proportional to b, so if a true 360 reads as `measured`:
//
//     slope  = measured / 360
//     b_true = b_anchor * slope
//
// A robot that under-rotates reads MORE degrees than it turned, slope > 1,
// and b has to grow.
//
// WHAT THIS MEASURES: ONE NUMBER, b. Not two. A spin can only ever produce the
// effective track width -- the ratio trackWidth/rotationalSlip -- because that
// ratio is the only thing the kinematics contain. In the whole extension
// `trackWidth_` appears twice: its own accessor, and inside
// effectiveTrackWidth(). Every consumer (odometry.h:90, six sites in
// motion_engine.cpp, shims.cpp:420/447) reads the ratio, so trackWidth 114.2
// with slip 0.977 and trackWidth 115 with slip 0.984 are the SAME robot.
//
// So rotationalSlip is not measured here, it is DERIVED: you pin trackWidth
// with a caliper, this program measures b, and slip = trackWidth / b falls out.
// The interesting number is the gap between them -- gopiv turns as though its
// wheels were about 2 mm further apart than they measure, and that is the
// wheel-contact scrub the slip term exists to carry.
//
// The correction still goes into rotationalSlip and never into the track width
// -- track width is a caliper fact about the robot, not a fudge factor
// (motion_engine.h says so at length).
//
// Like calibrate X, this ANCHORS itself first: nothing in the TS API can read
// the current geometry back, so the run sets the baseline it is correcting
// from before it measures anything.
//
// ABOUT CENTRING, and why only the FULL TURN is used. The robot never sits
// exactly on the middle of the cross. Off-centre by e, with the sensor r ahead
// of the axle, each arm comes round up to e/r radians early or late -- a wobble
// that runs one way at 90 and the other at 270. Those errors cancel over a
// whole revolution and nowhere short of it, so the 360 reading is much the
// steadiest, and it is the only one the answer uses. Fitting a line through all
// four points, which this program did at first, folds the wobble straight back
// in, so the 90/180/270 readings are a CENTRING CHECK, not data.
//
// BUT THE FULL TURN IS NOT FULLY UNBIASED -- an earlier version of this comment
// claimed it was. The cancellation needs the pivot centre to STAY PUT for the
// revolution. gopiv walks about 1 cm per 20 s of spinning, so the start arm
// comes back round after 360-delta degrees of body rotation, not 360. Calling
// it 360 anyway shrinks the slope, which biases b LOW -- and drift and
// off-centre placement share a cause, so the two travel together.
//
// MEASURED ON gopiv 2026-09-07, eight runs (seven accepted, one rejected by the
// gap check below). Regressing b on each run's own gap scatter: r = -0.76,
// -0.19 mm per degree of scatter, n=6, t=2.34 on 4 df -- suggestive, NOT
// significant. Treat it as a reason to re-centre, not a correction to apply.
//
//     four runs, scatter <18 deg   ->  b = 117.68 mm  (spread 0.49)
//     two runs,  scatter >=18 deg  ->  b = 116.55 mm
//
// So RE-CENTRE BEFORE EVERY RUN, and discard a run whose scatter comes back
// high rather than averaging it in. The scatter is printed for that decision.
//
// The one-wheel pivot that first exposed all this: it put the sensor's sweep
// 5.6 cm off the cross and the gaps came back 68/106/109/71 instead of
// 90/90/90/90, while the two full turns still agreed to 1.4 degrees.
const CAL_TRACK = 11.5        // cm, CALIPER-measured on gopiv 2026-09-07.
                              // Only splits the answer into trackWidth/slip --
                              // it never moves the measurement itself.
const CAL_SLIP = 0.952        // motion_engine.h's compiled default
const CAL_SPIN = 30           // deg/s. Slow: one 24 ms tick is 0.7 degrees,
                              // and that is the resolution of every edge.
const CAL_GIVE_UP = 1200      // deg; up to 360 arming, up to 90 to the first
                              // transition and 450 for the five gaps between
                              // six of them -- so this is pure runaway
const CAL_MAX_SECS = 90       // s. The SECOND way out, and the one that matters:
                              // CAL_GIVE_UP is measured in heading, and a robot
                              // whose stall latch has tripped stops moving
                              // WITHOUT its heading advancing, so the degree
                              // limit never arrives. Seen on gopiv 2026-09-07 --
                              // the pass hung forever holding the wire's RUN
                              // fiber, so STATUS still answered but no RUN verb
                              // could execute, RUN:clear included. A pass needs
                              // ~45 s (backoff, up to 360 hunting, 360 turning
                              // at CAL_SPIN), so 90 is generous but finite.
// ONE sensor watches the line, the SAME one in both directions. The old code
// used the far-left channel spinning one way and the far-right the other, on
// the reasoning that the leading sensor meets each arm first. But those two sit
// at opposite ends of the bar, so each swept its own circle about the pivot and
// each carried its own off-centre error -- the two passes were not measuring
// the same circle. A middle channel sits closest to the fore-aft centreline,
// which makes its sweep the most centred one available, and using it both ways
// makes the CW and CCW passes comparable.
const CAL_SENSOR_BIT = 2      // sensor 2 (bit 1). Sensor 3 (bit 2, value 4) is
                              // just as good -- pick either middle channel.
// Arms are 90 degrees apart, so a transition arriving much sooner than that
// after the last accepted one is not a new arm -- it is the sensor chattering
// across an edge, or clipping the corner where the two tape strips cross.
// Observed on gopiv 2026-09-08: a CCW pass read edges at 258.95 and 277.63,
// 18.7 degrees apart, which shifted every later reading one arm out and failed
// the gap check below. Dropping the FIRST reading cannot catch this -- that one
// was fourth of six -- so it is rejected where it happens instead. 45 is the
// same lower bound the gap check already calls "nowhere near 90".
const CAL_MIN_GAP = 45        // deg, closest two real arms can appear
const CAL_EDGES = 6           // transitions to collect before stopping
const CAL_MIN_EDGES = 5       // fewest usable: one zero plus four cardinals

// Round to `places` decimals. Every number this program prints goes through
// here, so the emit lines below are plain text with no arithmetic in them.
function calRound(x: number, places: number): number {
    const f = Math.pow(10, places)
    return Math.round(x * f) / f
}

// Every number the report prints, worked out in one place. The constructor
// does the whole calculation; check() fills in the two error figures once the
// verification spins have run. slipExact is the one field that is not for
// printing -- it is the unrounded number handed to setConfigValue.
class CalReport {
    baseB: number          // cm, the anchor we are correcting from
    slopeCW: number        // odometry degrees per true degree, clockwise
    slopeCCW: number       // ... and counter-clockwise
    gapPerTurn: number     // deg, how far the two passes disagree over a turn
    trueB: number          // cm, THE measurement
    slip: number           // derived: CAL_TRACK / trueB
    slipExact: number      // the same, unrounded, for setConfigValue
    bMillimetres: number   // trueB in mm, for showNumber
    errCW: number          // deg per turn still out after the fix, clockwise
    errCCW: number         // ... and counter-clockwise

    constructor(baseB: number, slopeCW: number, slopeCCW: number) {
        // Both directions measure the same geometry, so they should agree. They
        // are averaged rather than kept apart because there is only one track
        // width to set -- a big gap between them is a fault to go and look at
        // (a dragging wheel, a slipping wheel, a loose encoder), not two
        // numbers to use.
        const slope = (slopeCW + slopeCCW) / 2
        const trueB = baseB * slope
        const slip = CAL_TRACK / trueB

        this.baseB = calRound(baseB, 2)
        this.slopeCW = calRound(slopeCW, 4)
        this.slopeCCW = calRound(slopeCCW, 4)
        this.gapPerTurn = calRound((slopeCW - slopeCCW) * 360, 1)
        this.trueB = calRound(trueB, 2)
        this.slip = calRound(slip, 3)
        this.slipExact = slip
        this.bMillimetres = Math.round(trueB * 10)
        this.errCW = 0
        this.errCCW = 0
    }

    // How far each direction is still out over a turn, once the fix is set.
    check(checkCW: number, checkCCW: number) {
        this.errCW = calRound((checkCW - 1) * 360, 1)
        this.errCCW = calRound((checkCCW - 1) * 360, 1)
    }
}

// One spin: arm on clear floor, then read the heading at each white-to-black
// transition. Returns odometry degrees per true degree, or 0 if the spin did
// not produce enough clean transitions.
//
// ARMING, and why it replaced the back-off pass. The robot starts somewhere
// unknown -- possibly sitting on an arm, possibly straddling two. The old code
// reversed out of the line first and then spun forward, which put a direction
// change and a full brake-and-restart between the robot and its zero point.
// Instead this spins ONE way from the first instant and simply ignores
// everything the bar reports until it reads COMPLETELY clear. All-white is the
// one state that can be recognised without knowing where the robot started, so
// it is the only honest place to begin counting from.
//
// WHY SIX TRANSITIONS AND NOT FIVE. Consecutive arms are 90 degrees apart, so a
// full turn needs five transitions: one zero and four cardinals. Collecting six
// and throwing the earliest away costs an extra quarter turn and buys immunity
// to a spurious first reading -- a corner clipped on the way off the arm the
// robot was parked on, or a partial read while the bar is still leaving the
// cross. Anything beyond the last five is an earlier, less settled pass over
// the same cross and is discarded for the same reason.
function spinAround(yawRate: number): number {
    diffDrive.resetPose()
    const startedAt = control.millis()
    const edges: number[] = []
    let armed = false
    let onLine = false
    diffDrive.whileDriving(0, yawRate, function (x, y, h) {
        diffDrive.driveTwist(0, yawRate)
        const bits = linetrack.lineBits()
        if (!armed) {
            if (bits == 0) {
                armed = true
                // The bar is clear, so the watched channel is off by
                // definition -- state the invariant rather than trusting
                // whatever the pre-arming samples left behind.
                onLine = false
                diffDrive.emitLine("CALA:armed at "
                    + calRound(Math.abs(h), 1) + "deg")
            }
        } else {
            const nowOn = (bits & CAL_SENSOR_BIT) != 0
            if (nowOn && !onLine) {
                // Measured from the last ACCEPTED edge, not the last seen one,
                // so a burst of chatter cannot walk the window forward one
                // rejected edge at a time.
                const since = edges.length == 0
                    ? CAL_MIN_GAP
                    : Math.abs(h - edges[edges.length - 1])
                if (since < CAL_MIN_GAP) {
                    diffDrive.emitLine("CALA:skip edge at "
                        + calRound(Math.abs(h), 2) + "deg, only "
                        + calRound(since, 1) + "deg on")
                } else {
                    edges.push(h)
                    diffDrive.emitLine("CALA:edge " + edges.length + " at "
                        + calRound(Math.abs(h), 2) + "deg")
                }
            }
            onLine = nowOn
        }
        if (edges.length >= CAL_EDGES) { diffDrive.stop(); return }
        if (Math.abs(h) > CAL_GIVE_UP) { diffDrive.stop(); return }
        if (control.millis() - startedAt > CAL_MAX_SECS * 1000) {
            diffDrive.stop()
            return
        }
    })

    const seen = edges.length
    if (seen < CAL_MIN_EDGES) {
        // Say WHICH failure this is. "0 of 4 edges" on its own sent me looking
        // at the reflectance sensor when the drive had actually stall-latched.
        const why = diffDrive.isStalled()
            ? " -- STALLED, power-cycle the robot"
            : armed ? "" : " -- never saw clear floor, is it parked on the cross?"
        diffDrive.emitLine("CALA:fail saw " + seen + " transitions, need "
            + CAL_MIN_EDGES + why)
        return 0
    }

    // The last five and nothing earlier: the fifth-from-last is the zero, the
    // last four are the cardinals. Same shape the rest of this function already
    // expects, so the gap check, the scatter and the returned slope are
    // untouched by the change in how the readings were gathered.
    const ref = edges[seen - 5]
    const measured = [0, 0, 0, 0]
    for (let i = 0; i < 4; i++) {
        measured[i] = Math.abs(edges[seen - 4 + i] - ref)
        diffDrive.emitLine("CALA:" + ((i + 1) * 90) + " -> "
            + calRound(measured[i], 2))
    }

    // Every gap between arms is a true 90 degrees. Being off-centre moves them
    // around, but a gap nowhere near 90 means an arm was MISSED -- the sensor
    // wandered off the cross -- and then the fourth edge is not a full turn at
    // all, and every reading after the miss is one arm out. Fail loudly rather
    // than hand back a confident wrong number.
    for (let i = 0; i < 4; i++) {
        const gap = i == 0 ? measured[0] : measured[i] - measured[i - 1]
        if (gap < 45 || gap > 135) {
            const gapDeg = Math.round(gap)
            const arm = (i + 1) * 90
            diffDrive.emitLine("CALA:fail gap " + gapDeg + "deg before " + arm
                + " -- missed an arm, re-centre the robot")
            return 0
        }
    }

    // How far off the cross the sensor swept, as one number: the spread of the
    // four gaps. NOT cosmetic -- a high value means this run's b reads low (see
    // ABOUT CENTRING), so it is printed to be acted on: re-centre and run again
    // rather than average this run in.
    let gapMean = 0
    for (let i = 0; i < 4; i++) {
        gapMean += i == 0 ? measured[0] : measured[i] - measured[i - 1]
    }
    gapMean = gapMean / 4
    let gapVar = 0
    for (let i = 0; i < 4; i++) {
        const g = i == 0 ? measured[0] : measured[i] - measured[i - 1]
        gapVar += (g - gapMean) * (g - gapMean)
    }
    const scatter = calRound(Math.sqrt(gapVar / 4), 1)
    const scatterWarn = scatter >= 18 ? "  HIGH -- b reads low, re-centre" : ""
    diffDrive.emitLine("CALA:centring scatter=" + scatter + "deg" + scatterWarn)

    // The full turn, and nothing else -- see ABOUT CENTRING at the top.
    return measured[3] / 360
}

function calibrateA() {
    diffDrive.setTrackWidth(CAL_TRACK)
    diffDrive.setConfigValue(ConfigField.RotationalSlip, CAL_SLIP)
    const baseB = CAL_TRACK / CAL_SLIP
    const anchorB = calRound(baseB, 2)
    diffDrive.emitLine("CALA:begin track=" + CAL_TRACK + "cm slip=" + CAL_SLIP
        + " b=" + anchorB + "cm")

    // Clockwise is a NEGATIVE yaw rate: positive yaw is counter-clockwise.
    diffDrive.emitLine("CALA:pass clockwise")
    const slopeCW = spinAround(-CAL_SPIN)
    diffDrive.emitLine("CALA:pass counter-clockwise")
    const slopeCCW = spinAround(CAL_SPIN)
    if (slopeCW == 0 || slopeCCW == 0) {
        basic.showIcon(IconNames.No)
        return
    }

    const r = new CalReport(baseB, slopeCW, slopeCCW)
    diffDrive.emitLine("CALA:slope cw=" + r.slopeCW + " ccw=" + r.slopeCCW
        + " gap=" + r.gapPerTurn + "deg/turn")
    // b is THE measurement. The slip below is only b divided into CAL_TRACK --
    // see WHAT THIS MEASURES at the top -- so it is printed as "derived", not
    // as a second result.
    diffDrive.emitLine("CALA:measured b=" + r.trueB + "cm"
        + "  (anchor was " + r.baseB + ")")
    diffDrive.emitLine("CALA:derived slip=" + r.slip
        + " = track " + CAL_TRACK + " / b " + r.trueB)
    diffDrive.emitLine("CALA:apply diffDrive.setConfigValue("
        + "ConfigField.RotationalSlip, " + r.slip + ")")

    // Set it and go round twice more to see whether it took. setConfigValue
    // carries three decimals, so the slip the robot actually gets is up to
    // 0.0005 off the one computed -- about 0.2 degrees in a full turn. The
    // check below measures what the robot got, not what we asked for.
    diffDrive.setConfigValue(ConfigField.RotationalSlip, r.slipExact)
    diffDrive.emitLine("CALA:check clockwise")
    const checkCW = spinAround(-CAL_SPIN)
    diffDrive.emitLine("CALA:check counter-clockwise")
    const checkCCW = spinAround(CAL_SPIN)
    r.check(checkCW, checkCCW)
    diffDrive.emitLine("CALA:error cw=" + r.errCW + "deg ccw=" + r.errCCW
        + "deg per turn")

    // Radio first, screen second: showNumber blocks this fiber while it
    // scrolls, and this runs on the wire's own fiber. The number is the
    // effective track width in millimetres.
    basic.showNumber(r.bMillimetres)
}

diffDrive.onRun("cala", function (arg) { calibrateA() })
