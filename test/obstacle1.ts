// obstacle1.ts — primitives scripts/obstacle1.sh drives the course with.
diffDrive.onRun("push", function (a) { diffDrive.move(a, 0) })
diffDrive.onRun("turn", function (a) { diffDrive.move(0, a) })
diffDrive.onRun("speed", function (a) { diffDrive.setDefaultSpeed(a) })
diffDrive.onRun("m", function (a) { diffDrive.move(a, 0) })
diffDrive.onRun("t", function (a) { diffDrive.move(0, a) })

// RUN:clear -- drop a latched e-stop and stall latch. The extension latches
// both, and nothing in this program could release them, so one stall left the
// robot refusing every move with no way back short of a power cycle.
diffDrive.onRun("clear", function (a) {
    diffDrive.clearEmergencyStop()
    diffDrive.clearStallLatch()
    diffDrive.emitLine("OBS1:cleared estop=" + diffDrive.probe(1)
        + " stall=" + diffDrive.probe(2) + " lease=" + diffDrive.probe(3))
})

// RUN:diag -- the latch/connection state STATUS only shows while ticking.
diffDrive.onRun("diag", function (a) {
    diffDrive.emitLine("OBS1:diag ready=" + diffDrive.probe(0)
        + " estop=" + diffDrive.probe(1) + " stall=" + diffDrive.probe(2)
        + " lease=" + diffDrive.probe(3) + " connL=" + diffDrive.probe(4)
        + " connR=" + diffDrive.probe(5) + " stalled=" + (diffDrive.isStalled() ? 1 : 0))
})
