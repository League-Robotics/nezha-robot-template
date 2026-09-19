// calstore.ts — make a calibration STICK, across a power cycle and back to the
// computer.
//
// THE USE CASE THIS EXISTS FOR. A student picks cal-wheels on the robot's own
// button menu, presses B, watches it drive the course; picks cal-turn, presses
// B, watches it spin. Then they carry the robot to a laptop, plug it in, open
// the robot console's calibrate menu, and find the two numbers their robot
// measured -- and the code that sets them -- waiting there. No wire session
// during the measurement, no copying numbers off a five-by-five LED matrix, and
// nothing lost when the battery goes off on the walk across the room.
//
// Before this file, a calibration was REPORTED and then thrown away: calwheels
// emitted its mm/deg and left the engine running on CALJ_BASELINE, and calturn
// deliberately restored the geometry boot.ts had applied. Both were right to,
// given a robot that forgets everything at power-off -- a number that survives
// only until someone reads it off the wire belongs on the wire, not in the
// engine. Flash changes that calculation, so now they apply their result AND
// write it down.
//
// WHERE IT IS KEPT: `settings`, the micro:bit target's own flash-backed
// key-value store (libs/settings, a bundled target library -- pxt.json depends
// on it by name). Not the extension's flash page: that one is a dedicated,
// fixed-layout page for WiFi credentials, it is not reachable from TypeScript,
// and its own header says whether its page address survives `mbdeploy deploy`
// and a power cycle is UNVERIFIED. `settings` is the store the platform already
// maintains for exactly this.
//
// WHAT ERASES IT: reflashing the hex. A new .hex wipes the settings region, so
// a student who re-flashes the calibration image starts from no calibration
// again -- which is correct, since the robot they are flashing may not be the
// robot the numbers came from. Nothing else erases it; a battery change does
// not.
//
// WHY NUMBERS AND NOT A RECORD: settings stores one number per key and hands it
// back verbatim. Three keys, three values, no format to version. If this ever
// needs a fourth, add a key -- do not pack a struct into a buffer, because the
// only consumer that matters is a student's eyes on a console screen.

// Keys are short because the settings key space is small, and prefixed so
// `settings.list("cal")` shows the set at once.
const CAL_KEY_WHEEL = "cal.whl"   // mm of wheel travel per shaft degree
const CAL_KEY_TRACK = "cal.trk"   // cm, effective track width
const CAL_KEY_SLIP = "cal.slp"    // rotational slip, dimensionless

// settings.readNumber() on a missing key answers `undefined`, which arrives in
// static TypeScript as 0 -- indistinguishable from a real zero. No calibration
// is ever legitimately 0, so 0 IS the "not stored" answer and every reader
// below checks exists() first anyway. Belt and braces, because a robot silently
// running on a track width of zero would divide by it.
function calStoredNumber(key: string): number {
    if (!settings.exists(key)) return 0
    const v = settings.readNumber(key)
    return v > 0 ? v : 0
}

// ---- HOW MANY RUNS IS THIS NUMBER? --------------------------------------
//
// A single calwheels run is not a precise estimate of anything. MEASURED on
// vevov: sd 0.16% across four runs with the long sensor arm (0.7839, 0.7822,
// 0.7817, 0.7843), and sd 0.43% across seven before the arm was lengthened,
// with individual samples spanning 0.7800 to 0.7896 -- 1.2% between the
// extremes. Boot on one of those at random and the robot is a few tenths of a
// percent off its own mean.
//
// That was harmless while a result went only to the wire, where a human read it
// next to six others. It is not harmless now: a stored value BEATS the compiled
// per-robot block at boot, so one noisy run outranks a number somebody arrived
// at deliberately from several. Raised by the session calibrating vevov, with
// the samples above to back it.
//
// What this does about it is REPORT, not average. Every run's value is still
// what the robot runs on -- pressing B and having it take effect is the whole
// point of the button menu -- but the store also keeps how many runs there have
// been since the last clear, and their range. So `calshow` can distinguish a
// single sample from a considered one, and a student or a console can see the
// spread rather than infer precision the number does not have.
//
// NOT AVERAGED, deliberately, and this is the open question rather than a
// settled answer: a mean would fold a run against the wrong course length into
// the value permanently, and the student most likely to mis-measure is the one
// least likely to know to clear it. A visible n and range lets a person decide;
// an invisible mean decides for them.
//
// Four keys per calibration, short because the settings key space is small.
const CAL_STAT_N = ".n"
const CAL_STAT_SUM = ".s"
const CAL_STAT_LO = ".l"
const CAL_STAT_HI = ".h"
const CAL_STAT_WHEEL = "cw"   // calwheels, mm/deg
const CAL_STAT_TURN = "ct"    // calturn, rotational slip

function calStatAdd(prefix: string, v: number) {
    const n = calStoredNumber(prefix + CAL_STAT_N)
    const sum = calStoredNumber(prefix + CAL_STAT_SUM)
    const lo = calStoredNumber(prefix + CAL_STAT_LO)
    const hi = calStoredNumber(prefix + CAL_STAT_HI)
    settings.writeNumber(prefix + CAL_STAT_N, n + 1)
    settings.writeNumber(prefix + CAL_STAT_SUM, sum + v)
    settings.writeNumber(prefix + CAL_STAT_LO, n < 1 || v < lo ? v : lo)
    settings.writeNumber(prefix + CAL_STAT_HI, n < 1 || v > hi ? v : hi)
}

function calStatRuns(prefix: string): number { return calStoredNumber(prefix + CAL_STAT_N) }
function calStatLo(prefix: string): number { return calStoredNumber(prefix + CAL_STAT_LO) }
function calStatHi(prefix: string): number { return calStoredNumber(prefix + CAL_STAT_HI) }

// The mean of every run since the last clear -- reported, never applied. It is
// the number a person should probably adopt once they have three or four runs,
// which is a judgement this file does not make for them.
function calStatMean(prefix: string): number {
    const n = calStatRuns(prefix)
    return n > 0 ? calStoredNumber(prefix + CAL_STAT_SUM) / n : 0
}

// Spread as a percentage of the mean, which is the form the number is worth
// reading in: 1.2% is a robot that needs more runs, 0.16% is one that does not.
function calStatSpreadPct(prefix: string): number {
    const mean = calStatMean(prefix)
    if (mean <= 0 || calStatRuns(prefix) < 2) return 0
    return (calStatHi(prefix) - calStatLo(prefix)) * 100 / mean
}

function calStatClear(prefix: string) {
    settings.remove(prefix + CAL_STAT_N)
    settings.remove(prefix + CAL_STAT_SUM)
    settings.remove(prefix + CAL_STAT_LO)
    settings.remove(prefix + CAL_STAT_HI)
}

function calStoredWheel(): number { return calStoredNumber(CAL_KEY_WHEEL) }
function calStoredTrack(): number { return calStoredNumber(CAL_KEY_TRACK) }
function calStoredSlip(): number { return calStoredNumber(CAL_KEY_SLIP) }

function calHasWheel(): boolean { return calStoredWheel() > 0 }
function calHasTurn(): boolean { return calStoredTrack() > 0 && calStoredSlip() > 0 }

// APPLY AND REMEMBER, in that order and in one call, so the two can never
// disagree. A caller that applied without storing would leave a robot driving
// on a number that vanishes at power-off; one that stored without applying
// would leave it driving on the old one until someone power-cycled it, which is
// the more confusing of the two.
function calSaveWheel(mmPerDeg: number) {
    diffDrive.setWheelCalibration(mmPerDeg)
    settings.writeNumber(CAL_KEY_WHEEL, mmPerDeg)
    calStatAdd(CAL_STAT_WHEEL, mmPerDeg)
}

// The pair goes through applyGeometry() (geometry.ts) rather than straight at
// the engine, so GEOM_TRACK/GEOM_SLIP -- what calturn restores from, and what
// bootTrackWidth() answers -- move with it. Storing a new track width while
// geometry.ts still believed the old one is exactly the kind of split record
// geometry.ts was written to end.
function calSaveTurn(trackCm: number, slip: number) {
    applyGeometry(trackCm, slip)
    settings.writeNumber(CAL_KEY_TRACK, trackCm)
    settings.writeNumber(CAL_KEY_SLIP, slip)
    // The slip carries the run-to-run statistics, not the track width: the
    // track width is a caliper measurement passed through unchanged, so it has
    // no spread of its own to report.
    calStatAdd(CAL_STAT_TURN, slip)
}

// Called from boot.ts AFTER the per-robot block, so a stored calibration BEATS
// the compiled one. That is the whole point: the compiled numbers are what the
// fleet was measured at some time in the past, and the stored ones are what
// this robot measured itself, most recently, with the wheels it is wearing now.
//
// A robot with nothing stored is untouched and boots exactly as it did before
// this file existed.
function calApplyStored() {
    if (calHasWheel()) diffDrive.setWheelCalibration(calStoredWheel())
    if (calHasTurn()) applyGeometry(calStoredTrack(), calStoredSlip())
}

// One line at boot, so `mbdeploy connect` and the console both see the stored
// state without asking for it -- the console's calibrate menu can render as
// soon as the link is up, rather than after a round trip.
function calBootLine(): string {
    if (!calHasWheel() && !calHasTurn()) return "boot cal none stored"
    return "boot cal"
        + " wheel=" + (calHasWheel() ? "" + lineRound(calStoredWheel(), 4) : "-")
        + " tw=" + (calHasTurn() ? "" + lineRound(calStoredTrack(), 2) : "-")
        + " slip=" + (calHasTurn() ? "" + lineRound(calStoredSlip(), 4) : "-")
        // runs, because a one-run calibration and a four-run one look identical
        // otherwise and are not equally trustworthy.
        + " runs=" + calStatRuns(CAL_STAT_WHEEL) + "/" + calStatRuns(CAL_STAT_TURN)
}

// THE READ-BACK VERB. The console's calibrate menu asks for this and turns it
// into the lines a student pastes into their own program, which is the last
// step of the use case at the top of this file: measure on the robot, read it
// on the computer, keep it in your code.
//
// `wheel` and `tw`/`slip` are reported SEPARATELY as stored/not, because the
// two calibrations are independent and a student who has run only one of them
// should see that, not a plausible-looking default for the other.
//
// Packed JSON Lines like every other terminal report in this image, so one
// contract covers all of them.
function emitStoredCalibration() {
    let r = epObj("calstore.values")
    r = epNum(r, "wheel", calStoredWheel(), 4)
    r = epNum(r, "tw", calStoredTrack(), 2)
    r = epNum(r, "slip", calStoredSlip(), 4)
    // Booleans as 0/1: epNum is the only packer, and a consumer reading `has_`
    // as a number gets the same answer either way.
    r = epNum(r, "has_wheel", calHasWheel() ? 1 : 0, 0)
    r = epNum(r, "has_turn", calHasTurn() ? 1 : 0, 0)
    // What the robot is running RIGHT NOW, which is the stored value only if
    // something stored it. A student who has not calibrated still needs to see
    // a number here, because their program will behave as though they had.
    r = epNum(r, "live_tw", bootTrackWidth(), 2)
    r = epNum(r, "live_slip", bootSlip(), 4)
    epPush(r + "}")

    // HOW GOOD IS THAT NUMBER. Separate object because it answers a different
    // question from `what is stored`, and a consumer may reasonably show one
    // without the other. runs=1 is the case worth drawing attention to: it is
    // not wrong, it is just one sample of something with a measured spread.
    //
    // mean is what to adopt once there are three or four runs. It is REPORTED
    // and never applied -- see calstore.ts's note on why this store does not
    // average behind a student's back.
    let p = epObj("calstore.runs")
    p = epNum(p, "wheel_runs", calStatRuns(CAL_STAT_WHEEL), 0)
    p = epNum(p, "wheel_mean", calStatMean(CAL_STAT_WHEEL), 4)
    p = epNum(p, "wheel_lo", calStatLo(CAL_STAT_WHEEL), 4)
    p = epNum(p, "wheel_hi", calStatHi(CAL_STAT_WHEEL), 4)
    p = epNum(p, "wheel_spread", calStatSpreadPct(CAL_STAT_WHEEL), 2)
    p = epNum(p, "turn_runs", calStatRuns(CAL_STAT_TURN), 0)
    p = epNum(p, "turn_mean", calStatMean(CAL_STAT_TURN), 4)
    p = epNum(p, "turn_lo", calStatLo(CAL_STAT_TURN), 4)
    p = epNum(p, "turn_hi", calStatHi(CAL_STAT_TURN), 4)
    p = epNum(p, "turn_spread", calStatSpreadPct(CAL_STAT_TURN), 2)
    epPush(p + "}")
    epFlush()
}

// FORGET, for a robot that was calibrated on someone else's wheels. Without
// this the only way back to the compiled defaults is a reflash, which is a
// laptop and a cable -- and the student who most needs it is the one who just
// calibrated against the wrong course length.
function clearStoredCalibration() {
    settings.remove(CAL_KEY_WHEEL)
    settings.remove(CAL_KEY_TRACK)
    settings.remove(CAL_KEY_SLIP)
    // The run statistics go too. Leaving them would report four runs behind a
    // value that no longer exists, which is worse than reporting none.
    calStatClear(CAL_STAT_WHEEL)
    calStatClear(CAL_STAT_TURN)
    epPush(epStr(epObj("calstore.cleared"), "why", "asked") + "}")
    epFlush()
}

diffDrive.onRun("calshow", function (arg) { emitStoredCalibration() })
diffDrive.runSignature("calshow", "()")
diffDrive.onRun("calclear", function (arg) { clearStoredCalibration() })
diffDrive.runSignature("calclear", "()")
