/**
 * ── Nezha robot — written live in the MakeCode editor ─────────
 * 
 * A course the robot drives, reachable two ways: press button A, or
 * 
 * send RUN:a from the bench host. RUN:a does NOT call the function
 * 
 * directly — it raises the same MessageBus event a real button press
 * 
 * raises, so the button path itself is what gets exercised.
 */
diffDrive.onRun("ping", function (arg) {
    diffDrive.emitLine("pong heading=" + Math.round(diffDrive.heading()))
})
function driveCourse () {
    diffDrive.emitLine("course start")
basic.showIcon(IconNames.Diamond)
    diffDrive.resetPose()
    diffDrive.move(20, 0)
    diffDrive.move(0, 90)
    diffDrive.move(20, 0)
    diffDrive.move(0, -90)
    diffDrive.move(15, 0)
    basic.clearScreen()
    diffDrive.emitLine("course done x=" + Math.round(diffDrive.poseX())
        + " y=" + Math.round(diffDrive.poseY())
        + " heading=" + Math.round(diffDrive.heading()))
}
// ── Buttons ───────────────────────────────────────────────────
input.onButtonPressed(Button.A, function () {
    diffDrive.emitLine("btn A")
driveCourse()
})
diffDrive.onRunCommand(function (name, arg) {
    diffDrive.emitLine("run rx name=" + name + " arg=" + arg)
})
diffDrive.onRun("stop", function (arg) {
    haltAll()
})
input.onButtonPressed(Button.AB, function () {
    diffDrive.emitLine("btn AB")
haltAll()
})
function haltAll () {
    diffDrive.emitLine("halt")
diffDrive.stop()
    basic.showIcon(IconNames.No)
}
// ── Remote triggers ───────────────────────────────────────────
// RUN:a -> raise the real button-A event -> onButtonPressed fires.
diffDrive.onRun("a", function (arg) {
    diffDrive.emitLine("raise A")
control.raiseEvent(
    EventBusSource.MICROBIT_ID_BUTTON_A,
    EventBusValue.MICROBIT_BUTTON_EVT_CLICK
    )
})
diffDrive.emitLine("boot course-program ready")
basic.showIcon(IconNames.Ghost)
