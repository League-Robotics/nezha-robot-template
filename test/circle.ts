// circle.ts — a 30 cm radius circle, four 90-degree quarters. RUN:circle, or the boot.ts menu
//
// Each quarter is TWO 45-degree moves, not one 90-degree move. diffDrive.move()
// blends distance and yaw into a single arc only BELOW 50 degrees
// (kTurnFirstAngle, motion_engine.h); at or above it the move pivots to the new
// heading first and then drives straight. Four 90-degree moves would therefore
// draw a 47 cm square, not a circle.
//
// Arc length of a segment: s = r * theta.
//   quarter: 30 * 90 deg = 30 * pi/2   = 47.12 cm
//   segment: 30 * 45 deg = 30 * pi/4   = 23.56 cm
//
// The display counts the quarters 1-4. Interval 0, because the default holds
// the LED matrix for 150 ms per character and this runs on the wire's own
// fiber -- a blocking flash there stalls every other command for its duration.
const CIRCLE_RADIUS = 30
const CIRCLE_SEGMENT = CIRCLE_RADIUS * 45 * Math.PI / 180

function driveCircle() {
    // Four quarters of two segments each, as a loop -- see driveSquare().
    for (let q = 1; q <= 4; q++) {
        basic.showNumber(q, 0)
        if (!legMove(CIRCLE_SEGMENT, 45)) { programStopped("circle"); return }
        if (!legMove(CIRCLE_SEGMENT, 45)) { programStopped("circle"); return }
    }
    basic.clearScreen()
}

diffDrive.onRun("circle", function (arg) {
    programBegin(); driveCircle(); programEnd()
})
diffDrive.runSignature("circle", "()")
