// boot.ts — bring the wire up and say what this hex can run.
//
// LISTED LAST in pxt.json, deliberately. PXT executes top-level code in
// manifest order, so everything above has finished registering its verbs and
// its menu entries by the time the radio starts carrying commands. Opening
// the link first would leave a window -- small, but real on a robot power-
// cycled while the relay is already sending -- where a RUN: arrives with no
// handler bound to answer it.
//
// That same order is the MENU order, because harness.ts appends each entry as
// the file registering it runs:  diamond (square), snake (line), target
// (sense), then back to the heart.
//
// setupRadio() takes the radio over: MakeCode's own `radio send` /
// `on radio received` blocks stop working in the same program from here on,
// and it cannot be undone without a restart. Channel 55 / group 114 is what
// this fleet's relay listens on; change it and the robot drops off the relay
// it is assigned to.
diffDrive.setupRadio(55, 114)

// Motor wiring. tovez is wired mirror-image to the extension's tracked
// default (left wheel on port 2, right on port 1), which drives the
// robot backwards until this says otherwise. Naming the port the other
// wheel is on swaps the pair, so one line does it.
// MEASURED tovez 2026-09-12: raw encoder delta reverses with the sign
// (pxt-nezha-diffdrive captures/configmotor-hardware-20260912/notes.md).
diffDrive.configureMotor(MotorSide.Left, MotorPort.M2, MotorDirection.Reversed)

//radio.setGroup(11)
//let channel = "J"
//radio.setFrequencyBand(parseInt(channel, 36) + 10)

diffDrive.setupWifi(WIFI_SSID, WIFI_PASSWORD)

// One line per thing a bench operator would otherwise have to read the source
// for, so `mbdeploy connect` shows it at boot.
diffDrive.emitLine("boot tests ready")
diffDrive.emitLine("boot verbs: square circle spin[:secs] line sense"
    + " calx cala push:<cm> turn:<deg> speed:<cm/s> trace:0|1 counters clear diag")
diffDrive.emitLine("boot buttons: A=pick program  B=run it")


// ---- program menu ---------------------------------------------------------
// A steps through the programs, showing each one's picture; B runs whichever
// picture is up. To add a program, append its picture and its function to the
// two arrays below -- nothing else changes.
//
// Drawn as images rather than IconNames, which has neither a square nor a
// circle in it.
//
// These are the ONLY A and B handlers in the build, and they have to be:
// onButtonPressed registers against one (source, value) pair and the later
// registration DELETES the earlier one (registerWithDal, core/codal.cpp), so a
// button handler in square.ts or circle.ts would silently win or lose
// depending on pxt.json order. Those files keep their RUN verbs instead.
const PROGRAM_PICTURES = [
    images.createImage(`
        . # # # .
        # . . . #
        # . . . #
        # . . . #
        . # # # .
        `),
    images.createImage(`
        # # # # #
        # . . . #
        # . . . #
        # . . . #
        # # # # #
        `),
    images.createImage(`
        # . . . #
        . # . # .
        . . # . .
        . # . # .
        # . . . #
        `),
    images.createImage(`
        . . # . .
        . . # . .
        # # # # #
        . . # . .
        . . # . .
        `)
]
const PROGRAM_RUNS: (() => void)[] = [driveCircle, driveSquare, calibrateX, calibrateA]
const PROGRAM_NAMES = ["circle", "square", "calibrate-x", "calibrate-a"]

// -1 is "nothing picked yet", so the first A press lands on the circle.
let programIndex = -1

input.onButtonPressed(Button.A, function () {
    programIndex = (programIndex + 1) % PROGRAM_RUNS.length
    // interval 0: showImage otherwise holds the matrix for 400 ms, which makes
    // stepping through the list feel stuck.
    PROGRAM_PICTURES[programIndex].showImage(0, 0)
    diffDrive.emitLine("menu " + PROGRAM_NAMES[programIndex])
})

input.onButtonPressed(Button.B, function () {
    if (programIndex < 0) return
    diffDrive.emitLine("run " + PROGRAM_NAMES[programIndex])
    PROGRAM_RUNS[programIndex]()
})
