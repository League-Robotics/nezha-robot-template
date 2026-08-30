// main.ts — Your Nezha robot program starts here!
//
// This template includes the DiffDrive extension, which gives you
// closed-loop control of your Nezha robot's two-wheel drive.
// The robot drives straight, turns accurately, and knows its position.
//
// Blocks appear under the "DiffDrive" category. Everything is in
// centimeters, centimeters/second, degrees, and degrees/second.
//
// Hardware setup:
//   - micro:bit V2 on the ElecFreaks Nezha brick
//   - Left wheel on M2, right wheel on M1
//   - Optional: OTOS optical tracking sensor on I²C

// ── Drive a 30 cm square on button A ──────────────────────────
input.onButtonPressed(Button.A, function () {
    diffDrive.resetPose()
    for (let i = 0; i < 4; i++) {
        diffDrive.move(30, 0)   // 30 cm straight
        diffDrive.move(0, 90)   // pivot 90° counter-clockwise
    }
    basic.showNumber(Math.round(diffDrive.heading()))
})

// ── Show live position while driving on button B ──────────────
input.onButtonPressed(Button.B, function () {
    diffDrive.whileMoving(30, 0, function (x: number, y: number, heading: number) {
        led.plotBarGraph(diffDrive.moveProgress() * 100, 100)
        if (input.buttonIsPressed(Button.AB)) {
            diffDrive.stopMove()
        }
    })
    basic.clearScreen()
})

// ── Emergency stop on A+B ─────────────────────────────────────
input.onButtonPressed(Button.AB, function () {
    diffDrive.stop()
    basic.showIcon(IconNames.No)
})