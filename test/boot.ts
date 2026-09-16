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
// its chip -- there is no shared fleet channel. (This line once hardcoded
// 55/114, tigez's old address, so every board running this image answered
// on tigez's channel and a relay could not reach one robot alone.)
// To reach one robot, point a relay at it by name: `!N <name>`.
//
// [channel, group] derived from a micro:bit's five-letter name, or [] if the
// name is not one. NORMATIVE SPEC: radio-robot-lib
// docs/design/radio-addressing.md -- the name is DEVICEID[1] in base 5
// (consonants zvgpt at positions 0/2/4, vowels uoiea at 1/3, first letter
// most significant), then channel = 11 + n % 73 (11..83) and
// group = 15 + n % 241 (15..255). The relay's `!N`, mbrelay's registry and
// robot-console compute the same pair; tools/radio-address-dump runs this
// exact function against the spec's digest, so change it only with the spec.
// (Until 2026-09-14 this was the retired 25-channel map, 25 + 2*(n % 25).)
function nameValue(name: string): number {
    const consonants = "zvgpt"
    const vowels = "uoiea"
    if (name.length != 5) return -1
    let n = 0
    for (let i = 0; i < 5; i++) {
        const alphabet = i % 2 == 0 ? consonants : vowels
        const digit = alphabet.indexOf(name.charAt(i).toLowerCase())
        if (digit < 0) return -1
        n = n * 5 + digit
    }
    return n
}

function radioAddressFromName(name: string): number[] {
    const n = nameValue(name)
    if (n < 0) return []
    return [11 + n % 73, 15 + n % 241]
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
    // Wheel travel per shaft degree, MEASURED on tovez 2026-09-15 by cald:
    // one continuous run across the two vertical tape lines, 31.49 cm of
    // odometry against a camera-surveyed 31.35 cm gap (1.4 mm, 0.45% out).
    // Each crossing is the mean over the four channels of (near edge + far
    // edge)/2, which cancels the skew and the sensor's trigger lag. Implies a
    // wheel diameter of 89.86 mm, from the 0.7878 compiled default.
    // Set here rather than left in RAM so it survives a reset.
    diffDrive.setWheelCalibration(0.7842)
    // Effective track width, b = trackWidth / rotationalSlip
    // (motion/motion_engine.h). A rotation's wheel-travel target is
    // PROPORTIONAL to b (motion_engine.cpp:218,
    // yawTarget = rotation * 0.5 * effectiveTrackWidth() * cpm), so too big a b
    // over-rotates and too small a b makes the move finish instantly without
    // turning at all.
    //
    // MEASURED on tovez 2026-09-15 with the overhead camera, two operating
    // points, both over-rotating:
    //   b = 120.0 mm (compiled 114.2/0.952): 360 commanded -> 386.65 actual,
    //       mean of six alternating revolutions, equal both ways
    //       (CCW +25.1/+25.7/+27.3, CW -27.3/-27.0/-27.5 deg). Ratio 1.0740.
    //   b = 128.9 mm (114.2/0.886): 90 -> 105.9, -90 -> -105.3, 180 -> 206.8,
    //       360 -> 420.5. Mean ratio 1.1658.
    // Each gives a true b independently: 120.0/1.0740 = 111.7 mm and
    // 128.9/1.1658 = 110.6 mm -- agreeing to 1%. Take b = 111.1 mm, so
    // slip = 114.2/111.1 = 1.028.
    //
    // A slip above 1 is not a mistake here: it only says the robot rotates as
    // though it were NARROWER than the caliper track width.
    //
    // VERIFIED at this value, on PARTIAL turns (a whole revolution cannot tell
    // a perfect turn from no turn at all): +90 -> +90.40, -90 -> -90.57,
    // +180 -> +181.64, -180 -> -180.18, +360 -> +359.15. Mean ratio 1.0037,
    // i.e. 0.37%, correct both ways and at every magnitude.
    //
    // Set here, not left in RAM: this board was power-cycled mid-session and
    // came back on the compiled defaults with the wire-SET value gone.
    //
    // setTrackWidth() is called EXPLICITLY, not left to the compiled 114.2
    // default it happens to equal. A rotation through move(0, yaw) needs the
    // geometry actually set; relying on the default left `turn 90`/`turn 180`
    // returning instantly without moving (5-6 control cycles, camera confirms
    // 0.3 deg) while whole revolutions still ran. calibrateTurn() in
    // test/calibratel.ts sets it at the top of every round for this reason.
    diffDrive.setTrackWidth(11.42)
    //
    // calt (test/calibratel.ts) could NOT have found this. It accepts at
    // CALT_TOL = 2 deg, and this robot's heading moves 1.5-11 deg per move on
    // its own (tail dragger, MEASURED same session) -- its tolerance sits
    // inside its own noise, so it would have converged on whatever the line
    // happened to read. Six camera-truthed revolutions measure the same
    // quantity directly and repeat to +-1 deg.
    //
    // calibrateTurn()'s own correction, bNext = b * deg/trueDeg, is CORRECT --
    // it lands on 119.96 * 360/386.65 = 111.7 mm, the same answer as above. An
    // earlier comment here claimed it was inverted; that was wrong, and came
    // from a bad calibration run (see the capture log) that had set b to
    // 0.13 mm and stopped the robot turning at all.
    diffDrive.setConfigValue(ConfigField.RotationalSlip, 1.028)
}

if (control.deviceName() == "gopiv") {
    // Wheel travel per shaft degree, MEASURED on gopiv 2026-09-16 by calj:
    // twelve straddled runs of the eye field, mean odometry 90.41 cm against a
    // TAPE-MEASURED 90.2 cm line spacing (sd 0.25 cm, 0.28%; standard error of
    // the mean 0.08%). The robot over-measures by 0.23%, so the compiled 0.7878
    // default is that much too large: 0.7878 * 90.2/90.41 = 0.786, implying a
    // wheel diameter of 90.07 mm against the default's 90.28 mm. At 2.9x the
    // standard error this is a real offset, and it is 4 mm over a 2 m drive.
    //
    // THE LINE SPACING MUST COME FROM A TAPE. It is the one length the whole
    // calibration scales by. The overhead camera called it 90.57 cm -- out by
    // 0.41%, which is larger than the entire 0.28% run-to-run spread, and it
    // turned this correction into "no correction needed" for most of the
    // session (captures/calibratej-gopiv-20260916/bench-log.md).
    diffDrive.setWheelCalibration(0.786)
    // Effective track width, MEASURED on gopiv 2026-09-16 by calt (Calibrate T,
    // test/calibratet.ts), which defines 180 degrees from the TAPE rather than
    // from the odometry being calibrated: pivoting on the stripe edge, the four
    // channels go dark in sequence and the midpoint of a symmetric pair IS 180.
    //
    // Six CCW/CW pairs, all from starts that line-followed 35cm and held the
    // steering deadband before pivoting: mean 179.18 deg for a true 180. The
    // three best-settled (60-85 ticks in deadband) agree to +-0.08 deg and give
    // 179.04. So b = 12.0 * 179.04/180 = 11.93 cm, slip = 11.42/11.93 = 0.957,
    // a 0.53% correction from the compiled default.
    //
    // PAIRING IS NOT OPTIONAL. A single pivot carries the robot's unknown
    // heading error at the moment it starts, which adds to CCW and subtracts
    // from CW; the within-pair splits were 6.29/2.72/3.40/1.75 deg and that IS
    // that error, doubled. The pair mean cancels it. Individual pivots scattered
    // across 161-186 deg before pairing and settling were enforced.
    diffDrive.setTrackWidth(11.42)
    diffDrive.setConfigValue(ConfigField.RotationalSlip, 0.957)
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
// The calibration image carries only what calibration needs. On 2026-09-13
// cala was missing from every robot's function list over WiFi: FUNCS writes
// one line per verb, and pxt-nezha-diffdrive before v1.20260913.1 dropped any
// reply line that did not fit its 8-line WiFi transmit ring, so only the first
// seven registered names ever arrived. v1.20260913.1 makes a reply line wait
// for room, so the list is complete again. If you ever pin an OLDER extension,
// keep this image to seven RUN verbs or the later ones vanish from the list.
diffDrive.emitLine("boot verbs: square circle calx cala call[:dir] linea[:dir]"
    + " turn[:deg] calt[:turns] cald[:cm] calj[:cm] caljhome"
    + " nudge[:l:r:ticks] sweep[:cm]")
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
        `),
    images.createImage(`
        . . # . .
        . . # . .
        . . # . .
        . . . . .
        # # # # #
        `),
    // calibrate-j: the two lines of the course, joined by the stripe between
    // them -- the field as seen from above.
    images.createImage(`
        # . . . #
        # . . . #
        # # # # #
        # . . . #
        # . . . #
        `),
    // calibrate-t: a T, for the turn calibration that follows calibrate-j.
    images.createImage(`
        # # # # #
        . . # . .
        . . # . .
        . . # . .
        . . # . .
        `)
]
const PROGRAM_RUNS: (() => void)[] = [driveCircle, driveSquare, calibrateX, calibrateA, calibrateL, calibrateJ, calibrateT]
const PROGRAM_NAMES = ["circle", "square", "calibrate-x", "calibrate-a", "calibrate-l", "calibrate-j", "calibrate-t"]

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
