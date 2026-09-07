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

//radio.setGroup(11)
//let channel = "J"
//radio.setFrequencyBand(parseInt(channel, 36) + 10)

// WiFi is OFF, and cannot be turned on from this project yet.
//
// The wire protocol is meant to move off the radio and onto the Planet X WiFi
// module (RJ11 jack J1), answering the same commands on UDP 7654 and
// advertising as "<name> robot link" over mDNS. It can't, because the stock
// extension has no way to accept credentials from a program: it ships
// kWifiSsid/kWifiPassword empty on purpose (an empty SSID is WifiLink's own
// "disabled" sentinel), and the only thing that fills them in is its own
// tools/make_deploy.py -- which this project's build path never runs.
// enableWifiLink() on such a build is a silent no-op, so calling it would
// only be misleading.
//
// We carried a local patch adding setWifiCredentials() for exactly this, and
// dropped it: an out-of-tree patch over pxt_modules/ is a dependency cache
// this repo does not control, and it broke quietly the moment upstream moved.
// The capability is tracked upstream as setupWifi(ssid, password) in
// pxt-nezha-diffdrive: clasi/issues/wifi-credentials-are-set-in-code-from-
// the-project-s-own-secrets-ts.md.
//
// TO RESTORE, once the extension ships setupWifi() and pxt.json points at a
// release carrying it -- two lines, and nothing else changes. WIFI_SSID and
// WIFI_PASSWORD are already waiting in test/secrets.ts (gitignored; a fresh
// clone gets a copy of test/secrets.example.ts, made by scripts/build.sh):
//
//     diffDrive.setupWifi(WIFI_SSID, WIFI_PASSWORD)
//
// Until then the robot answers on the radio configured above.

// One line per thing a bench operator would otherwise have to read the source
// for, so `mbdeploy connect` shows it at boot.
diffDrive.emitLine("boot tests ready")
diffDrive.emitLine("boot verbs: square circle spin[:secs] line sense"
    + " calx push:<cm> turn:<deg> speed:<cm/s> trace:0|1 counters clear diag")
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
        `)
]
const PROGRAM_RUNS: (() => void)[] = [driveCircle, driveSquare, calibrateX]
const PROGRAM_NAMES = ["circle", "square", "calibrate-x"]

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
