// drive.ts — the two bare driving verbs, kept out of the calibrations.
//
// Neither of these measures anything. They exist so that a calibration can be
// CHECKED after it is written: `turn` is how a rotation calibration is scored
// against the overhead camera (command +-90 and +-180, read the tag's yaw
// before and after), which is the only independent confirmation this image can
// produce of what calc measured. Verified that way on tovez and vevov
// 2026-09-17; see radio-robot-lib config/robots/<name>.json.
//
// They came from calibratel.ts, which was deleted when the image was cut down
// to calj and calc.

// Drive both wheels at fixed speeds for a fixed number of control ticks, then
// stop. The raw open-loop primitive -- no odometry target, no arrival test.
//
// IT IS ACCELERATION LIMITED, which surprises people. The motion limits ramp at
// accel mm/s^2 (400 on this fleet), so a short burst never reaches the speed
// asked for: 20 ticks at a commanded 50 cm/s covers about 4.6 cm, not 24. That
// is the profiler doing its job, not a truncated command.
function nudge(left: number, right: number, ticks: number) {
    diffDrive.setWheelSpeeds(left, right)
    for (let i = 0; i < ticks; i++) {
        if (!diffDrive.driveTick()) break
    }
    diffDrive.stop()
}

// Turn in place by `yaw` degrees, CCW positive, and report what the odometry
// thinks it did.
//
// THE ODOMETRY NUMBER IS NOT THE MEASUREMENT. It is the robot marking its own
// homework: it is computed from the same effective track width b the turn was
// driven with, so it reads close to the command even when the robot physically
// turned something else. Score this against the camera, never against its own
// reply -- that is the entire point of the verb.
function turnBy(yaw: number) {
    diffDrive.resetPose()
    diffDrive.move(0, yaw)
    diffDrive.emitLine("TURN:want=" + lineRound(yaw, 2) + "deg odom="
        + lineRound(diffDrive.heading(), 2) + "deg")
}

diffDrive.onRun("turn", function (arg) { turnBy(runNumber(0, 0)) })
diffDrive.runSignature("turn", "(deg:number=0)")

diffDrive.onRun("nudge", function (arg) {
    nudge(runNumber(0, 50), runNumber(1, 50), runNumber(2, 1))
})
diffDrive.runSignature("nudge", "(left:number=50,right:number=50,ticks:number=1)")
