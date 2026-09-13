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
// and it cannot be undone without a restart.
//
// Every robot has its OWN radio address, derived from the name burned into
// its chip -- there is no shared fleet channel. This line used to hardcode
// 55/114, which is tigez's address, so every board running this image
// answered on tigez's channel and a relay could not reach one robot alone.
// MEASURED 2026-09-12 through the torture relay: on 55/114 gopiv, tovez and
// vevov all answered ID; on tovez's own 55/108, silence.
// To reach one robot, point the relay at it by name: `!N <name>`.
// [channel, group] derived from a micro:bit's five-letter name, or [] if the
// name is not one. Same map as pxt-nezha-diffdrive's make_deploy.py
// derive_radio_from_name() and the relay's `!N`: the name is DEVICEID[1] in
// base 5 (consonants zvgpt at positions 0/2/4, vowels uoiea at 1/3,
// big-endian); channel = 25 + 2*(n % 25), group = 1 + n/25 with 10 skipped.
function radioAddressFromName(name: string): number[] {
    const consonants = "zvgpt"
    const vowels = "uoiea"
    if (name.length != 5) return []
    let n = 0
    for (let i = 0; i < 5; i++) {
        const alphabet = i % 2 == 0 ? consonants : vowels
        const digit = alphabet.indexOf(name.charAt(i).toLowerCase())
        if (digit < 0) return []
        n = n * 5 + digit
    }
    let group = 1 + Math.idiv(n, 25)
    if (group >= 10) group += 1
    return [25 + 2 * (n % 25), group]
}

const RADIO_ADDRESS = radioAddressFromName(control.deviceName())
if (RADIO_ADDRESS.length == 2) {
    diffDrive.setupRadio(RADIO_ADDRESS[0], RADIO_ADDRESS[1])
}
// No derivable address leaves the radio to MakeCode rather than guessing one:
// a guessed channel is exactly how the whole fleet ended up sharing one.

// Motor wiring, per robot. The extension's default is left on M1, right on
// M2 -- correct for tigez and the rest of the fleet. tovez is wired
// mirror-image (left on M2, right on M1) and drives backwards on the
// default. Naming the port the other wheel is on swaps the pair, so one
// line fixes it.
//
// Keyed on control.deviceName(), the name burned into the chip, so this
// hex is safe on every board: applied unconditionally it mirror-wired
// tigez, whose correct wiring IS the default.
// MEASURED tovez 2026-09-12: raw encoder delta reverses with the sign
// (pxt-nezha-diffdrive captures/configmotor-hardware-20260912/notes.md).
if (control.deviceName() == "tovez") {
    diffDrive.configureMotor(MotorSide.Left, MotorPort.M2, MotorDirection.Reversed)
}

//radio.setGroup(11)
//let channel = "J"
//radio.setFrequencyBand(parseInt(channel, 36) + 10)

diffDrive.setupWifi(WIFI_SSID, WIFI_PASSWORD)

// One line per thing a bench operator would otherwise have to read the source
// for, so `mbdeploy connect` shows it at boot.
diffDrive.emitLine("boot tests ready")
diffDrive.emitLine(RADIO_ADDRESS.length == 2
    ? "boot radio " + control.deviceName() + " ch " + RADIO_ADDRESS[0] + " grp " + RADIO_ADDRESS[1]
    : "boot radio off: " + control.deviceName() + " has no derived address")
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
