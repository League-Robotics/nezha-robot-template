// linetrack.ts — follow a line with the PlanetX Trackbit array.
//
// Start with button A, or send RUN:line[:speed[:maxS[:kp]]] over the wire.
//
// Sensor: four reflectance channels on I2C 0x1A, channel 0 on the robot's
// LEFT. Write register 4, read one byte: bit i set when channel i sees the
// line. One transaction gets all four channels.
//
// Tuning, measured on vevov 2026-09-03 with the sensor on a stalk:
//   15 cm/s -> kp 60      25 cm/s -> kp 120
// Gain has to scale with speed: holding a turn radius needs yaw ~ speed, so
// kp rises with it. At 25 cm/s, kp 60 loses the line ~124 times per 8 s run
// while kp 120 loses it ~19. Above ~25 cm/s it cannot corner regardless of
// gain (30 cm/s: kp 145 -> 93 losses, kp 180 -> 183).
//
// Its own namespace so several programs can sit in test/ without clashing;
// PXT runs a namespace body at start-up exactly like top-level code.
namespace linetrack {
    const WEIGHT = [1.5, 0.5, -0.5, -1.5]
    const DEFAULT_SPEED = 25
    const DEFAULT_KP = 120

    export function lineBits(): number {
        pins.i2cWriteNumber(0x1a, 4, NumberFormat.Int8LE)
        return pins.i2cReadNumber(0x1a, NumberFormat.UInt8LE, false) & 0x0f
    }

    // +1.5 = far left only, -1.5 = far right only, 0 = centred, 999 = lost.
    function lineError(bits: number): number {
        let sum = 0
        let n = 0
        for (let i = 0; i < 4; i++) {
            if (bits & (1 << i)) { sum += WEIGHT[i]; n += 1 }
        }
        return n == 0 ? 999 : sum / n
    }

    let aborted = false

    // whileDriving() owns the tick loop: it issues the opening demand, calls
    // this body once per ~24 ms control cycle, and runs _endMove() on the way
    // out. driveTwist() REPLACES the previous demand under a lease rather than
    // queueing, so re-issuing it every pass is how the body steers.
    //
    // A continuous drive has no finish line, so the four ways this run can end
    // -- abort, time limit, the AB button, or the line lost too long -- all
    // exit by calling stop(). The next tick then returns false and the loop
    // unwinds. That is whileDriving()'s documented "give the body a way out".
    export function follow(speed: number, maxS: number, kp: number) {
        aborted = false
        let lastErr = 0
        let lostAt = -1
        const t0 = control.millis()
        diffDrive.whileDriving(speed, 0, function (x, y, heading) {
            if (aborted
                || control.millis() - t0 > maxS * 1000
                || input.buttonIsPressed(Button.AB)) {
                diffDrive.stop()
                return
            }
            const err = lineError(lineBits())
            if (err == 999) {
                // Search by ROTATING IN PLACE. Creeping forward while blind is
                // how a robot drives itself off the mat.
                if (lostAt < 0) {
                    lostAt = control.millis()
                } else if (control.millis() - lostAt > 1500) {
                    diffDrive.stop()
                    return
                }
                diffDrive.driveTwist(0, lastErr >= 0 ? 90 : -90)
            } else {
                lostAt = -1
                lastErr = err
                diffDrive.driveTwist(speed, kp * err)
            }
        })
        diffDrive.emitLine("LINE:end t=" + (control.millis() - t0) + "ms")
    }

    input.onButtonPressed(Button.AB, function () { aborted = true })

    diffDrive.onRun("line", function (arg) {
        const speed = diffDrive.runArgCount() > 0 ? diffDrive.runArg(0) : DEFAULT_SPEED
        const maxS = diffDrive.runArgCount() > 1 ? diffDrive.runArg(1) : 60
        const kp = diffDrive.runArgCount() > 2 ? diffDrive.runArg(2) : DEFAULT_KP
        follow(speed, maxS, kp)
    })
    diffDrive.runSignature("line", "(speed:number=" + DEFAULT_SPEED + ",max_speed:number=60,kp:number=" + DEFAULT_KP + ")")
    diffDrive.onRun("abort", function (arg) { aborted = true })
    diffDrive.runSignature("abort", "()")
    diffDrive.onRun("sense", function (arg) {
        for (let i = 0; i < 20; i++) {
            const b = lineBits()
            diffDrive.emitLine("TB:" + b + " err=" + lineError(b))
            basic.pause(120)
        }
    })

    diffDrive.runSignature("sense", "()")
    diffDrive.emitLine("boot linetrack ready")
}
