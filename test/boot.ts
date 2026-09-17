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

if (control.deviceName() == "vevov") {
    // WIRING. vevov is NOT wired like the rest of the fleet, and the
    // calibration image's default (left M1, right M2, both forward) drives it
    // MIRRORED -- every steering correction lands on the wrong wheel, in the
    // wrong direction. radio-robot-lib's config/robots/vevov.json is explicit:
    //     left_port = 2   right_port = 1
    //     fwd_sign_left = 1   fwd_sign_right = -1
    // so left is on M2, right is on M1, and the RIGHT motor runs reversed.
    //
    // Naming the port the other wheel is on swaps the pair (configureMotor's
    // own doc), so the first line alone moves left to M2 and right to M1. The
    // second line then only sets the right-hand direction, because right is
    // already on M1 by then.
    // THESE TWO LINES MATCH THE EXTENSION'S COMPILED DEFAULT EXACTLY, and are
    // kept only to say so out loud. pxt-nezha-diffdrive's shims.cpp already
    // declares, for vevov specifically:
    //     NezhaMotorPort left{1, -1};    // left = M1, mirrored
    //     NezhaMotorPort right{2, +1};   // right = M2
    // camera-verified there on 2026-08-20. Setting them again is a no-op.
    //
    // DO NOT "CORRECT" THIS FROM radio-robot-lib's vevov.json. That file says
    // left_port 2 / right_port 1 / fwd_sign_right -1, which is NOT the same
    // convention as the extension's MotorPort labels, and a guard written
    // faithfully from it puts left on M2 and right on M1 -- swapping the side
    // labels against an already-correct default.
    //
    // MEASURED 2026-09-17, the cost of doing exactly that: the robot drove
    // straight correctly and turned the WRONG WAY (`turn 20` reported odom
    // +21.67 deg while the camera measured -18.26). Equal wheel speeds are
    // identical under a side swap, so nothing that drives in a line can detect
    // it -- and with the steering sign inverted every calj correction drives
    // the error OUTWARD: err 0.6 -> 1.2 -> 3.6, steer pinned at the clamp,
    // until the blind-stripe guard stopped the run 6 cm off the line.
    //
    // shims.cpp's own comment explains why no sign flip can fix it ("forward
    // and rotation flip together, so no sign pair gives both; the free variable
    // is which port is called left") and records the same fault found by camera
    // on 2026-08-19. That comment predates this session by a month. Read the
    // firmware for the robot's name before characterising its behaviour.
    diffDrive.configureMotor(MotorSide.Left, MotorPort.M1, MotorDirection.Reversed)
    diffDrive.configureMotor(MotorSide.Right, MotorPort.M2, MotorDirection.Forward)
    // Straddle gains for vevov's SHORT sensor arm. PXT compiles every file into
    // one scope, so these assign calibratej.ts's own tunables directly, and
    // pxt.json lists that file before this one so they are initialised first.
    //
    // These are baked rather than left to `caltune` because the tune verbs write
    // RAM only. A power cycle silently reverted them on 2026-09-17 and calj then
    // ran on gopiv's speed=8 kp=1.1 -- the wrong gains for a 2 cm arm, and the
    // run announced exactly that in its own CALJ:begin line before driving.
    //
    // vevov's bar sits ~2 cm ahead of the axle against gopiv's ~17, and damping
    // is zeta = (L/2)*sqrt(Kp/v), so the arm alone costs a factor of ~8. Kp here
    // is what `calzeta` picks for zeta = 1 at lever 1.9 and speed 5.
    // ARM LENGTHENED 2026-09-17 to ~10 cm (stakeholder), from the ~4.3 cm the
    // calt outer channels had measured. The tuning below is gopiv's, which is
    // proven on a long arm (17 cm) -- not the speed 5 / Kp 2.0 worked out for
    // the short mount, which was chosen to fight a damping deficit that no
    // longer exists.
    //
    // Superseded reasoning, kept because it was wrong in an instructive way:
    // Kp 2.0, NOT the 5.54 calzeta computes for zeta = 1 at this lever. The
    // theory ignores the steering clamp: at Kp 5.54 any error past 0.45 cm
    // saturates CALJ_MAX_STEER, which at speed 5 means wheels at 7.5 and 2.5 --
    // a turning radius near 5.6 cm. The loop stops being proportional and
    // becomes bang-bang, and MEASURED vevov 2026-09-17 it spiralled off the
    // line (err 0.6 -> 1.2 -> 3.6, steer pinned, encoder counts 1066 vs 455).
    //
    // Kp 2.0 needs 1.0 cm of error to clamp instead of 0.45, and completed the
    // course: measured 90.5 cm against a TAPE-MEASURED 90.2, rms 0.78 cm,
    // acq 0 ticks. zeta is then 0.6 -- underdamped on paper, and the 9.9
    // crossings/m says so -- but a gain the actuator can actually deliver beats
    // a gain that is correct only until it saturates.
    CALJ_SPEED = 8
    CALJ_KP = 1.1
    CALJ_MAX_STEER = 2.5
    CALJ_LEVER = 10
    // Wheel travel per shaft degree, MEASURED on vevov 2026-09-17 by calj:
    // three straddled runs of the eye field against a TAPE-MEASURED 90.2 cm,
    // measuring 90.5 / 90.35 / 90.5 and giving 0.7852 / 0.7865 / 0.7852. Mean
    // 0.7856, sd 0.00075 (0.096%), standard error 0.055% -- a 0.28% correction
    // to the compiled 0.7878 default, implying a 90.03 mm wheel.
    //
    // Corroborated across the fleet: gopiv measured 90.07 mm and tigez 90.1 mm,
    // so three robots agree inside 0.08%. radio-robot-lib's vevov.json claims
    // 80.77 mm -- boilerplate shared with two other configs, wrong by 11%.
    //
    // Supersedes 0.79324 from calibratel 2026-09-15. calj sets its own baseline
    // at the start of every run, so this affects ordinary driving only, never
    // the calibration's own answer.
    diffDrive.setWheelCalibration(0.7856)
    // Track width CALIPER-MEASURED by Eric 2026-09-16: 111.6 mm. The config had
    // carried 128.0, which is about one tyre width larger and reads as an
    // outside-to-outside span. With the true width the slip falls to
    // 111.6/116.2 = 0.96 -- back inside config.proto's legal {0} u [0.5, 1.0],
    // which the old baked 1.1013 violated outright.
    diffDrive.setTrackWidth(11.16)
    diffDrive.setConfigValue(ConfigField.RotationalSlip, 0.96)
    // NOTE: the straddle lever arm (CALJ_LEVER, calibratej.ts) is deliberately
    // NOT set here. vevov's sensor bar is much shorter than gopiv's ~17cm but
    // has not been measured, and guessing it would put a wrong number into the
    // damping. Set it over the wire with `RUN caltune`, then let `RUN calzeta`
    // pick Kp for it -- that is what those verbs exist for.
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
