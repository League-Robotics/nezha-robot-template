// spin.ts — bench encoder soak. RUN:spin[:secs], default 20.
//
// Pivots in place at a steady rate, so both encoders turn at the square's
// straight-leg rate inside a fixed footprint. For a robot on the bench, where
// there is no floor for a square.
diffDrive.onRun("spin", function (arg) {
    const secs = arg > 0 ? arg : 20
    counters("begin")
    const t0 = control.millis()
    diffDrive.driveTwist(0, 90)
    while (diffDrive.driveTick()) {
        if (control.millis() - t0 > secs * 1000) break
        sample()
        diffDrive.driveTwist(0, 90)
    }
    diffDrive.stopMove()
    counters("end")
})
