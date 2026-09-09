// square.ts — a 50 cm square. RUN:square, or the boot.ts menu
// Arrow shows what the robot is doing: north driving, west turning left.
function driveSquare() {
    basic.showArrow(ArrowNames.North, 0)
    diffDrive.move(50, 0)
    basic.showArrow(ArrowNames.West, 0)
    diffDrive.move(0, 90)
    basic.showArrow(ArrowNames.North, 0)
    diffDrive.move(50, 0)
    basic.showArrow(ArrowNames.West, 0)
    diffDrive.move(0, 90)
    basic.showArrow(ArrowNames.North, 0)
    diffDrive.move(50, 0)
    basic.showArrow(ArrowNames.West, 0)
    diffDrive.move(0, 90)
    basic.showArrow(ArrowNames.North, 0)
    diffDrive.move(50, 0)
    basic.showArrow(ArrowNames.West, 0)
    diffDrive.move(0, 90)
    basic.clearScreen()
}

diffDrive.onRun("square", function (arg) { driveSquare() })
diffDrive.runSignature("square", "()")
