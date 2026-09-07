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
    basic.showNumber(1, 0)
    diffDrive.move(CIRCLE_SEGMENT, 45)
    diffDrive.move(CIRCLE_SEGMENT, 45)
    basic.showNumber(2, 0)
    diffDrive.move(CIRCLE_SEGMENT, 45)
    diffDrive.move(CIRCLE_SEGMENT, 45)
    basic.showNumber(3, 0)
    diffDrive.move(CIRCLE_SEGMENT, 45)
    diffDrive.move(CIRCLE_SEGMENT, 45)
    basic.showNumber(4, 0)
    diffDrive.move(CIRCLE_SEGMENT, 45)
    diffDrive.move(CIRCLE_SEGMENT, 45)
    basic.clearScreen()
}

diffDrive.onRun("circle", function (arg) { driveCircle() })
