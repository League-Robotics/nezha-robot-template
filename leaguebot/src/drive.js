// drive.js -- drive the robot from the cursor keys.
//
// THE PROBLEM A TERMINAL CREATES: there is no key-up event. A held arrow key
// arrives as a stream of repeated key-down sequences and simply stops arriving
// when the key is released -- so the host can never be told "stop", only notice
// that nothing has come for a while.
//
// Solved with the wire's own LEASE rather than by guessing. Every MOVE_V
// carries a duration, and the robot stops by itself when it expires. So each
// keypress renews a short lease and silence ends the motion -- which means the
// robot also stops if this program crashes, the terminal closes, the radio
// drops, or the WiFi falls over mid-drive. There is no failure of the host that
// leaves the robot driving.
//
// The wire (wire_handler.cpp):
//   MOVE_V <v_x mm/s> <omega mrad/s> <duration ms>
// Positive omega is COUNTER-CLOCKWISE -- clockwise is negative, the same
// convention test/calibratea.ts spins by.

/**
 * Transports that reach EXACTLY ONE robot.
 *
 * A radio relay reaches every robot in range: the fleet shares channel 55 /
 * group 114, so a line put on the air is a BROADCAST and every robot acts on
 * it. For a read that is harmless. For MOVE_V it is not -- reported from the
 * bench 2026-09-12, one operator driving one robot and three of them moving.
 *
 * The HELLO/banner check that connectTo() does cannot help here: it settles
 * which robot ANSWERS, not which robots LISTEN, and nothing in the wire
 * addresses a command to a single robot. Driving therefore requires a
 * point-to-point carrier, where the bytes physically cannot reach anyone else.
 */
export const POINT_TO_POINT = new Set(["wifi", "tcp", "serial"]);

/** Is this link safe to send motion on? */
export function isPointToPoint(spec) {
    return POINT_TO_POINT.has(spec.transport);
}

/** Lease carried on each command. Long enough to survive a missed radio frame,
 *  short enough that letting go stops the robot promptly. */
const LEASE_MS = 500;

/** How often the lease is renewed while a key is held. Comfortably inside
 *  LEASE_MS so one dropped frame does not cause a stutter. */
const RENEW_MS = 150;

/** How long an axis keeps its value after its last keypress. Must exceed the
 *  terminal's key-repeat interval (typically 30-50 ms after the initial delay)
 *  or a held key reads as a series of taps. */
const AXIS_HOLD_MS = 400;

const DEFAULT_SPEED_MMS = 150;      // 15 cm/s -- a walking-alongside pace
const DEFAULT_TURN_MRADS = 1500;    // ~86 deg/s

const SPEED_MIN = 30, SPEED_MAX = 600;
const TURN_MIN = 200, TURN_MAX = 3000;

const KEY_CTRL_C = String.fromCharCode(3);
const ESC = String.fromCharCode(27);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Read one key's worth of bytes.
 *
 * Arrow keys arrive as three bytes (ESC [ A). A chunk can hold several of them
 * when keys repeat faster than the event loop drains stdin, so this returns
 * every key in the chunk rather than only the first -- otherwise a fast repeat
 * looks like a slow one and the robot stutters.
 */
export function decodeKeys(chunk) {
    const text = chunk.toString("utf8");
    const keys = [];
    for (let i = 0; i < text.length;) {
        if (text[i] === ESC && text[i + 1] === "[" && text[i + 2]) {
            keys.push({ arrow: text[i + 2] });
            i += 3;
        } else {
            keys.push({ char: text[i] });
            i += 1;
        }
    }
    return keys;
}

function render(state, banner) {
    const dir = state.v > 0 ? "forward" : state.v < 0 ? "reverse" : "-";
    const turn = state.omega > 0 ? "left" : state.omega < 0 ? "right" : "-";
    process.stdout.write(
        `\r  ${banner}  v=${String(state.v).padStart(5)} mm/s  `
        + `omega=${String(state.omega).padStart(6)} mrad/s  `
        + `[${dir}/${turn}]   speed ${state.speed}/${state.turn}      `);
}

/**
 * Drive until the operator quits. Resolves when they do.
 *
 * `link` must already be connected and identified.
 */
export function driveWithKeys(link, name, spec) {
    // Refuse to put motion on a shared carrier. See POINT_TO_POINT above: over
    // a relay this drives every robot in radio range, not the one named.
    if (spec !== undefined && !isPointToPoint(spec)) {
        console.log(`\n  Refusing to drive over ${spec.describe}.`);
        console.log("  That is a radio relay, and the fleet shares one channel -- every");
        console.log("  robot in range would execute these commands, not just " + name + ".");
        console.log("  Connect over WiFi, the farm's TCP link, or a USB cable to drive.");
        return Promise.resolve();
    }
    const state = { v: 0, omega: 0, speed: DEFAULT_SPEED_MMS, turn: DEFAULT_TURN_MRADS };
    let vAt = 0, omegaAt = 0;          // when each axis was last pressed
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;

    console.log(`\n  Driving ${name}. Arrow keys steer; let go and it stops.`);
    console.log("    up/down     forward and reverse");
    console.log("    left/right  turn (hold with up/down to arc)");
    console.log("    space       stop now");
    console.log("    + / -       faster / slower        [ / ]  turn rate");
    console.log("    q           stop and leave\n");

    return new Promise((resolve) => {
        // Send a real zero rather than just ceasing to send: it stops the robot
        // on THIS command instead of up to a lease later, which matters for the
        // space bar and for quitting.
        const halt = () => { try { link.sendCommand("MOVE_V", [0, 0, LEASE_MS]); } catch { /* link may be gone */ } };

        const tick = setInterval(() => {
            const now = Date.now();
            // Each axis decays on its own clock, so tapping `left` while
            // holding `up` arcs instead of replacing the forward motion.
            if (now - vAt > AXIS_HOLD_MS) state.v = 0;
            if (now - omegaAt > AXIS_HOLD_MS) state.omega = 0;
            render(state, name);
            if (state.v === 0 && state.omega === 0) return;   // silence -> lease expires
            try {
                link.sendCommand("MOVE_V", [state.v, state.omega, LEASE_MS]);
            } catch {
                // A dead link must not spin this timer forever; the lease has
                // the robot covered either way.
                finish();
            }
        }, RENEW_MS);

        const finish = () => {
            clearInterval(tick);
            stdin.off("data", onData);
            if (stdin.isTTY) stdin.setRawMode(wasRaw ?? false);
            stdin.pause();
            halt();
            process.stdout.write("\n  stopped.\n");
            resolve();
        };

        const onData = (chunk) => {
            for (const key of decodeKeys(chunk)) {
                const now = Date.now();
                if (key.arrow === "A") { state.v = state.speed; vAt = now; }
                else if (key.arrow === "B") { state.v = -state.speed; vAt = now; }
                else if (key.arrow === "D") { state.omega = state.turn; omegaAt = now; }
                else if (key.arrow === "C") { state.omega = -state.turn; omegaAt = now; }
                else if (key.char === " ") {
                    state.v = 0; state.omega = 0; vAt = 0; omegaAt = 0;
                    halt();
                } else if (key.char === "+" || key.char === "=") {
                    state.speed = clamp(state.speed + 30, SPEED_MIN, SPEED_MAX);
                } else if (key.char === "-" || key.char === "_") {
                    state.speed = clamp(state.speed - 30, SPEED_MIN, SPEED_MAX);
                } else if (key.char === "]") {
                    state.turn = clamp(state.turn + 250, TURN_MIN, TURN_MAX);
                } else if (key.char === "[") {
                    state.turn = clamp(state.turn - 250, TURN_MIN, TURN_MAX);
                } else if (key.char === "q" || key.char === KEY_CTRL_C || key.char === ESC) {
                    finish();
                    return;
                }
            }
        };

        // EOF: nobody is at the keyboard, so there is nobody to stop the robot.
        stdin.once("end", finish);
        if (stdin.isTTY) stdin.setRawMode(true);
        stdin.resume();
        stdin.on("data", onData);
    });
}
