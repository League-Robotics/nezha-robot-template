// square.ts — a 50 cm square. RUN:square, or the boot.ts menu
// Arrow shows what the robot is doing: north driving, west turning left.
function driveSquare() {
    // Four identical sides, as a loop rather than sixteen lines, so the cancel
    // check that ends each leg exists once instead of eight times.
    for (let i = 0; i < 4; i++) {
        basic.showArrow(ArrowNames.North, 0)
        if (!legMove(50, 0)) { programStopped("square"); return }
        basic.showArrow(ArrowNames.West, 0)
        if (!legMove(0, 90)) { programStopped("square"); return }
    }
    basic.clearScreen()
}

diffDrive.onRun("square", function (arg) {
    programBegin(); driveSquare(); programEnd()
})
diffDrive.runSignature("square", "()")
