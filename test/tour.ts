// tour.ts — the square tour: the four ORANGE DOTS of the main playfield.
//
// THE DOTS ARE THE SPEC, and they are not a square. main-playfield (aprilcam
// `get_playfield`) puts them at
//
//     dot-northwest-orange  (-50, +30)      dot-northeast-orange  (+50, +30)
//     dot-southwest-orange  (-50, -30)      dot-southeast-orange  (+50, -30)
//
// so the circuit is a 100 x 60 cm RECTANGLE. test/square.ts drives a 50 cm
// square and is a different program; running it as "the square tour" measures
// nothing about the tour (done once, 2026-09-18, and the closure it reported
// was meaningless).
//
// DIRECTION. Start on the NORTHEAST dot facing WEST and go COUNTERCLOCKWISE:
// NE -> NW -> SW -> SE -> NE. Every corner is a LEFT turn, +90 deg, because
// yaw is CCW-positive here: facing west (180) a left turn reaches south (270).
// Shoelace over the dots in that order is positive, which is the check that
// this really is counterclockwise rather than its mirror.
//
// WHAT IT MEASURES. Closure -- how far from the start the robot finishes, and
// how far its heading has drifted after exactly 360 degrees of turning. Both
// errors are cumulative, so a tour is a far harsher test of the geometry than
// any single move: a 1% track-width error is 3.6 deg of heading by the end, and
// a heading error tips the following leg into a position error that never comes
// back.
//
// IT CANNOT MEASURE WHAT IT IS NOT DRIVING. The geometry must be the robot's
// own before a tour means anything. calc OVERWRITES trackWidth and
// rotational_slip with its anchor and never restores them, and trackWidth is
// NOT settable over the wire -- so after any calc run the only way back is a
// reset or a reflash. A tour run on calc's leftovers is measuring the anchor.
const TOUR_W = 100            // cm, NE->NW and SW->SE, the long legs
const TOUR_H = 60             // cm, NW->SW and SE->NE, the short legs
const TOUR_TURN = 90          // deg per corner, left/CCW

function driveTour() {
    diffDrive.resetPose()
    let o = epObj("tour.begin")
    o = epNum(o, "w", TOUR_W, 1)
    o = epNum(o, "h", TOUR_H, 1)
    epPush(o + "}")
    epFlush()

    for (let leg = 0; leg < 4; leg++) {
        // Long legs are the even ones: NE->NW and SW->SE.
        const cm = (leg % 2) == 0 ? TOUR_W : TOUR_H
        basic.showArrow(ArrowNames.North, 0)
        diffDrive.move(cm, 0)
        basic.showArrow(ArrowNames.West, 0)
        diffDrive.move(0, TOUR_TURN)
        // One object per corner, so a tour that goes wrong says WHERE. The
        // odometry pose is the robot's own belief, not truth -- score the tour
        // against the camera -- but a leg whose odometry already disagrees with
        // the command has failed before the camera is consulted.
        let c = epObj("tour.leg")
        c = epNum(c, "i", leg, 0)
        c = epNum(c, "cm", cm, 1)
        c = epNum(c, "x", diffDrive.poseX(), 1)
        c = epNum(c, "y", diffDrive.poseY(), 1)
        c = epNum(c, "h", diffDrive.heading(), 1)
        epPush(c + "}")
    }
    basic.clearScreen()

    // Odometry closure: what the robot BELIEVES it did. A tour that closes here
    // and not on the camera has a geometry error; one that fails here too has a
    // drive fault, and they are worth telling apart before touching anything.
    let e = epObj("tour.end")
    e = epNum(e, "x", diffDrive.poseX(), 2)
    e = epNum(e, "y", diffDrive.poseY(), 2)
    e = epNum(e, "h", diffDrive.heading(), 2)
    epPush(e + "}")
    epFlush()
}

diffDrive.onRun("tour", function (arg) { driveTour() })
diffDrive.runSignature("tour", "()")
