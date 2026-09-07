// calibratex.ts — Calibrate X: distance calibration on a 90 cm track.
// Menu symbol X, or RUN:calx
//
// Lay two black lines CAL_TRUE_CM apart. Put the robot behind the first one,
// pick X, press B. It creeps up to the first line and stops, then runs the
// gap and stops on the second line, and reports what the wheels must actually
// measure for the odometry to have read what it read.
//
// The sensor sits ahead of the wheels, but it crosses BOTH lines with the same
// offset, so the offset cancels in the difference and never enters the answer.
//
// The maths. travelCalib is millimetres of wheel travel per shaft degree
// (motion_engine.h, compiled default 0.7878). Odometry scales linearly with
// it, so if the robot believes it drove `measured` over a true CAL_TRUE_CM:
//
//     corrected = baseline * true / measured
//     diameter  = corrected * 360 / pi        (travel per degree -> pi*D/360)
//
// The run ANCHORS itself by setting the baseline first, because nothing in the
// TS API can read the current travelCalib back -- without that anchor the
// correction would be relative to an unknown starting point.
const CAL_TRUE_CM = 90        // the surveyed gap between the two lines
const CAL_BASELINE = 0.7878   // mm/deg, motion_engine.h's compiled default
const CAL_HUNT_SPEED = 8      // cm/s creeping onto the first line
const CAL_RUN_SPEED = 10      // cm/s between the lines
const CAL_HUNT_MAX = 60       // cm; give up hunting the first line
const CAL_BLANK_CM = 70       // ignore lines before here -- the current
                              // calibration may be wrong by a long way, so
                              // this is deliberately well short of 90
const CAL_MAX_CM = 110        // cm; give up looking for the second line

function calibrateX() {
    diffDrive.setWheelCalibration(CAL_BASELINE)
    diffDrive.setDefaultSpeed(CAL_RUN_SPEED)
    diffDrive.emitLine("CALX:begin true=" + CAL_TRUE_CM
        + "cm baseline=" + CAL_BASELINE + "mm/deg")

    // ---- leg 1: creep onto the first line -------------------------------
    diffDrive.resetPose()
    let found = false
    diffDrive.whileDriving(CAL_HUNT_SPEED, 0, function (x, y, h) {
        if (linetrack.lineBits() != 0) { found = true; diffDrive.stop(); return }
        if (Math.sqrt(x * x + y * y) >= CAL_HUNT_MAX) { diffDrive.stop(); return }
    })
    if (!found) {
        diffDrive.emitLine("CALX:fail no start line within " + CAL_HUNT_MAX + "cm")
        basic.showIcon(IconNames.No)
        return
    }
    diffDrive.emitLine("CALX:start line found")

    // ---- leg 2: run the gap, stop on the second line --------------------
    diffDrive.resetPose()
    let measured = -1
    diffDrive.whileDriving(CAL_RUN_SPEED, 0, function (x, y, h) {
        const d = Math.sqrt(x * x + y * y)
        if (d >= CAL_BLANK_CM && linetrack.lineBits() != 0) {
            measured = d
            diffDrive.stop()
            return
        }
        if (d >= CAL_MAX_CM) { diffDrive.stop(); return }
    })
    if (measured < 0) {
        diffDrive.emitLine("CALX:fail no end line between "
            + CAL_BLANK_CM + " and " + CAL_MAX_CM + "cm")
        basic.showIcon(IconNames.No)
        return
    }

    // ---- the answer ------------------------------------------------------
    const corrected = CAL_BASELINE * CAL_TRUE_CM / measured
    const diameter = corrected * 360 / Math.PI
    diffDrive.emitLine("CALX:measured=" + Math.round(measured * 100) / 100 + "cm"
        + " true=" + CAL_TRUE_CM + "cm"
        + " error=" + Math.round((measured - CAL_TRUE_CM) * 100) / 100 + "cm")
    diffDrive.emitLine("CALX:calib=" + Math.round(corrected * 10000) / 10000 + " mm/deg"
        + "  (was " + CAL_BASELINE + ")")
    diffDrive.emitLine("CALX:diameter=" + Math.round(diameter * 100) / 100 + " mm")
    diffDrive.emitLine("CALX:apply diffDrive.setWheelCalibration("
        + Math.round(corrected * 10000) / 10000 + ")")

    // Radio first, screen second: showNumber blocks this fiber while it
    // scrolls, and this runs on the wire's own fiber.
    basic.showNumber(Math.round(diameter))
}

diffDrive.onRun("calx", function (arg) { calibrateX() })
