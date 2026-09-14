// commands.js -- probe, connect and calibrate.

import {
    BASELINE_DIAMETER_MM, calibrationSnippet, deriveCalibration,
    deriveReportedTrackWidthCm, deriveWheelDiameterMm, loadStore, saveCalibration,
} from "./calibration.js";

import { explainPortError, loadDeviceRegistry } from "./discovery.js";
import { driveWithKeys, isPointToPoint } from "./drive.js";
import { candidatesFor, connectTo, survey, sweepRadio } from "./resolve.js";
import { ask, closeTerm, confirm, parseSignature, positionalArgs, pressSpace } from "./term.js";

const pad = (text, width) => String(text ?? "").padEnd(width);

// ---- probe ----------------------------------------------------------------

/** `leaguebot probe` -- everything reachable. */
export async function probeAll(options) {
    const state = await survey(options);

    console.log("\nUSB:");
    if (state.usb.length === 0) {
        console.log("  (no micro:bits attached)");
    } else {
        console.log(`  ${pad("NAME", 8)}${pad("TYPE", 8)}${pad("ROLE", 14)}PORT`);
        for (const device of state.usb) {
            // The name is read off the chip, so it holds even on a busy port.
            // "busy" is all the row says about that: the port is held by
            // robot-console, mbdeploy serve or a serial monitor, so this board
            // cannot be connected to or used as a relay until that stops.
            // A missing name says why, briefly: on Linux the usual cause is no
            // udev rule giving this user the CMSIS-DAP HID interface.
            const status = [
                device.error === undefined ? "" : /^in use/.test(device.error) ? "busy" : device.error,
                device.nameError ? `name unread: ${device.nameError}` : "",
            ].filter(Boolean).join("; ");
            const row = `  ${pad(device.name ?? "?", 8)}${pad(device.type, 8)}${pad(device.role ?? "-", 14)}`
                + `${pad(device.portPath, 26)}${status}`;
            console.log(row.trimEnd());
        }
    }

    console.log("\nNetwork (mDNS):");
    if (state.wifiRobots.length === 0) {
        console.log("  (no robots advertising)");
    } else {
        console.log(`  ${pad("NAME", 8)}${pad("VIA", 8)}${pad("ADDRESS", 24)}HOW`);
        for (const robot of state.wifiRobots) {
            const how = robot.reachable === false
                ? "name resolves, but the port is refused -- link not up"
                : robot.source === "dns" ? "resolved by name" : "announced itself";
            console.log(`  ${pad(robot.name, 8)}${pad(robot.transport, 8)}`
                + `${pad(`${robot.host}:${robot.port}`, 24)}${how}`);
        }
    }

    if (state.relays.length > 0 || state.networkRelays.length > 0) {
        console.log("\nRadio relays:");
        for (const relay of state.relays) {
            console.log(`  ${pad(relay.name ?? "?", 8)}usb     ${relay.portPath}`);
        }
        for (const relay of state.networkRelays) {
            console.log(`  ${pad(relay.name, 8)}network ${relay.host}:${relay.port}`);
        }
    }

    // Summarise by ROBOT, not by port: what the operator wants to know is
    // which robots they could talk to, and the same robot can appear as a USB
    // port and an mDNS advertisement at once.
    const robots = new Map();
    const note = (name, how) => {
        if (!name) return;
        if (!robots.has(name)) robots.set(name, new Set());
        robots.get(name).add(how);
    };
    for (const r of state.wifiRobots) note(r.name, r.reachable === false ? `${r.transport} (not listening)` : r.transport);
    for (const d of state.usbAll ?? []) {
        if (d.type !== "robot") continue;
        note(d.name, d.error ? "usb (busy)" : "usb");
    }


    // Nothing above can see a robot that simply is not announced: no mDNS
    // record, no USB cable here. The radio can, but only by asking -- so ask.
    const relayCount = state.relays.length + state.networkRelays.length;
    if (relayCount > 0 && options.radio !== false) {
        console.log("\nOver the air (listening for whoever answers)...");
        const { spec, banners } = await sweepRadio(state, options);
        if (spec === undefined) {
            console.log("  no relay would open");
        } else if (banners.length === 0) {
            console.log(`  ${spec.describe}: nothing answered`);
        } else {
            for (const banner of banners) {
                const already = robots.has(banner.name);
                console.log(`  ${pad(banner.name, 8)}${banner.role ?? "-"}`
                    + (already ? "   (also listed above)" : ""));
                note(banner.name, "radio");
            }
            // A robot that loses every HELLO race stays invisible, so this is
            // never a complete census -- say so rather than imply one.
            console.log("  (whoever answered; a quiet robot can be missed -- "
                + "'probe <name>' to check one)");
        }
    } else if (relayCount > 0) {
        console.log(`\n${relayCount} relay(s) available but the radio sweep was skipped.`);
    }

    // Robots we KNOW about that nothing found. Naming them is the point: a
    // robot that is powered off, out of radio range, or simply lost every
    // HELLO race is otherwise just absent from the listing, which reads as
    // "leaguebot lost it" rather than "it did not answer". gopiv sat in
    // exactly that hole -- reachable by name over the radio, invisible here.
    const known = [...loadDeviceRegistry(options.dir ? [options.dir] : []).byUid.values()]
        .filter((entry) => entry.name && (entry.commonName === "robot" || entry.role === "NEZHA2"))
        .map((entry) => entry.name);
    const missing = known.filter((name) => !robots.has(name));

    console.log("\nRobots:");
    if (robots.size === 0) console.log("  none answered");
    for (const [name, hows] of robots) console.log(`  ${pad(name, 8)}${[...hows].join(", ")}`);
    for (const name of missing) console.log(`  ${pad(name, 8)}not heard (known from the registry)`);
    if (missing.length > 0) {
        console.log("\n  'not heard' is not the same as absent: over the radio only whoever");
        console.log("  wins a HELLO race answers, so try 'probe <name>' before believing it.");
    }
    return state;
}

/** `leaguebot probe <name>` -- which paths reach one named robot. */
export async function probeOne(name, options) {
    const state = await survey({ ...options, names: [name] });
    const candidates = candidatesFor(name, state, options);

    console.log(`\nLooking for '${name}':`);
    if (candidates.length === 0) {
        console.log("  nothing here can reach it.");
        return { name, reachable: [] };
    }

    const reachable = [];
    for (const spec of candidates) {
        process.stdout.write(`  ${pad(spec.describe, 58)} `);
        const { createLink, traceLink } = await import("./links.js");
        const link = createLink(spec);
        if (options.verbose) { console.log(""); traceLink(link); }
        try {
            await link.connect();
            const banner = await link.identify({ expect: name });
            if (banner === null) console.log("no answer");
            else if (banner.name !== name) {
                // Name every robot that answered, not just the last one: on a
                // shared channel "answered as 'tigez'" hides the fact that
                // three robots replied and none of them was the one asked for.
                const others = [...(link.heardNames ?? [banner.name])].filter((n) => n !== name);
                console.log(`answered as ${others.map((n) => `'${n}'`).join(", ")}`);
            } else {
                console.log("YES");
                reachable.push(spec);
                // Say what is running there, once, under the first path that
                // reached it: the hello line as the board wrote it, and the
                // ID reply, which is where the firmware version lives.
                if (reachable.length === 1) await describeRobot(link, name, banner);
            }
        } catch (error) {
            console.log(explainPortError(error));
        } finally {
            await link.close().catch(() => {});
        }
    }

    if (reachable.length === 0) {
        console.log(`\n'${name}' did not answer on any path.`);
    } else {
        // Two USB relays are two paths but one transport; say "radio x2"
        // rather than "radio, radio".
        const counts = new Map();
        for (const spec of reachable) counts.set(spec.transport, (counts.get(spec.transport) ?? 0) + 1);
        const summary = [...counts].map(([t, n]) => (n > 1 ? `${t} x${n}` : t)).join(", ");
        console.log(`\n'${name}' is reachable over: ${summary}`);
        console.log(`leaguebot would use: ${reachable[0].describe}`);
    }
    return { name, reachable: reachable.map((spec) => spec.transport) };
}

/**
 * Print the robot's own account of itself: the hello banner verbatim, then
 * the `id` reply verbatim and decoded. `probe <name>` exists to answer "is it
 * there, and what is on it" -- the version is the second half of that.
 */
async function describeRobot(link, name, banner) {
    const say = (label, text) => console.log(`      ${pad(label, 7)}${text}`);
    if (banner.raw) say("hello:", banner.raw);
    const identity = await link.identityOf({ expect: name });
    if (identity === null) {
        say("id:", "(no reply to ID)");
        return;
    }
    say("id:", identity.raw);
    const parts = [];
    if (identity.version) parts.push(`firmware ${identity.version}`);
    if (identity.profile) parts.push(`profile ${identity.profile}`);
    if (identity.drivetrain) parts.push(`drivetrain ${identity.drivetrain}`);
    if (banner.serial !== undefined) parts.push(`serial ${banner.serial}`);
    if (parts.length > 0) say("", parts.join(", "));
}

// ---- connect --------------------------------------------------------------

/** One FUNCS exchange, merged into `into`. Ends on a quiet gap rather than on
 *  the ack -- see listFunctions() below for why the ack cannot be trusted. */
function funcsRound(link, into, { quietMs = 900, timeoutMs = 6000 } = {}) {
    return new Promise((resolve) => {
        let acked = false;
        let quiet;
        const finish = () => {
            clearTimeout(quiet);
            clearTimeout(hard);
            off();
            resolve();
        };
        const hard = setTimeout(finish, timeoutMs);
        const restartQuiet = () => {
            clearTimeout(quiet);
            if (acked) quiet = setTimeout(finish, quietMs);
        };
        const off = link.onLine((decoded) => {
            if (decoded.verb === "funcs") {
                const name = decoded.fields[0];
                if (name) {
                    const signature = decoded.fields.slice(1).join(" ");
                    // A later round may carry a signature the earlier one lost,
                    // so never let a bare name overwrite one already known.
                    const existing = into.get(name);
                    if (existing === undefined || (existing.signature === undefined && signature)) {
                        into.set(name, signature ? { name, signature } : { name });
                    }
                }
                restartQuiet();
            } else if (decoded.verb === "ack" || decoded.verb === "nack") {
                acked = true;
                restartQuiet();
            }
        });
        link.sendCommand("FUNCS");
    });
}

/**
 * Ask the robot what it can run, repeatedly, and take the union.
 *
 * Two things about this reply are not what the protocol implies.
 *
 * FIRST, THE ACK IS NOT A RELIABLE TERMINATOR. Measured on tigez over the
 * radio relay, the `ack` arrives BEFORE the `funcs` lines it is supposed to
 * close -- the handler writes the ack directly while the listing drains from
 * the firmware's emit queue on another fiber, so it overtakes. Stopping at the
 * ack, which is what the documented rule says to do, reports a robot with 18
 * functions as having none. So the ack is only a hint and a quiet gap is the
 * real terminator.
 *
 * SECOND, THE RADIO DROPS LINES. These are fire-and-forget frames with no
 * retransmission beneath them. Five consecutive listings of the same robot
 * over the relay returned 6, 13, 8, 17 and 14 of its 18 functions -- different
 * ones each time, so a single round is never trustworthy, and a short listing
 * looks exactly like a robot with fewer functions.
 *
 * Asking again and merging by name fixes both: losses are independent between
 * rounds, so the union converges quickly. Rounds stop as soon as one adds
 * nothing new, which on WiFi or USB -- where nothing is lost -- means the cost
 * is one extra round.
 */
async function listFunctions(link, { rounds = 5 } = {}) {
    const found = new Map();
    for (let round = 0; round < rounds; round += 1) {
        const before = found.size;
        await funcsRound(link, found);
        if (round > 0 && found.size === before) break;
    }
    return [...found.values()];
}

/** Print every line the robot sends until the operator presses Enter. */
function watchUntilEnter(link, label = "watching") {
    console.log(`  (${label} -- press Enter to stop)`);
    const off = link.onRawLine((line) => console.log(`  < ${line}`));
    return ask("").then(() => { off(); });
}

/** `leaguebot connect <name>` -- the little menu. */
export async function connectCommand(name, options) {
    const { link, spec, banner } = await connectTo(name, options);
    console.log(`\nConnected to ${banner.name} (${banner.role}) over ${spec.describe}`);
    link.onError((error) => console.error(`  link error: ${error.message}`));

    // Ask up front what this robot can do, so the menu can offer the
    // calibrations only when the robot actually carries them. A hex without
    // calibratex.ts in it has no `calx` to run, and an entry that always
    // appears would just fail on those.
    console.log("\n  Asking the robot what it can run...");
    const functions = await listFunctions(link);
    const has = (verb) => functions.some((fn) => fn.name === verb);

    try {
        for (;;) {
            // Built as a list rather than printed literally: the calibration
            // entries come and go with the robot's own function registry, and
            // hand-numbered menu lines drift the moment one is conditional.
            const entries = [
                { label: "Drive", help: "steer it with the cursor keys",
                  run: () => driveWithKeys(link, name, spec) },
                { label: "Functions", help: `run one of its ${functions.length} programs`,
                  run: () => functionsMenu(link, functions) },
            ];
            if (has("calx")) {
                entries.push({
                    label: "Calibrate X", help: "distance -- the 90 cm track",
                    run: () => menuCalibration(link, spec, name, options, "wheel"),
                });
            }
            if (has("cala")) {
                entries.push({
                    label: "Calibrate angle", help: "rotation -- spin on the cross",
                    run: () => menuCalibration(link, spec, name, options, "turn"),
                });
            }
            entries.push(
                { label: "Status", help: "ask the robot how it is", run: async () => {
                    const off = link.onRawLine((line) => console.log(`  < ${line}`));
                    link.sendUnsequenced("STATUS");
                    await new Promise((resolve) => setTimeout(resolve, 1200));
                    off();
                } },
                { label: "Watch", help: "print everything it says",
                  run: () => watchUntilEnter(link) },
                { label: "Send a line", help: "type a raw wire command", run: async () => {
                    const text = await ask("  line: ");
                    if (!text) return;
                    const off = link.onRawLine((line) => console.log(`  < ${line}`));
                    link.sendLine(text);
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                    off();
                } },
                { label: "Stop", help: "STOP the drive right now", run: async () => {
                    link.sendCommand("STOP");
                    console.log("  STOP sent.");
                } },
            );

            console.log("");
            entries.forEach((entry, i) => {
                console.log(`  ${i + 1}) ${entry.label.padEnd(16)}${entry.help}`);
            });
            console.log("  0) Quit");

            const choice = await ask("\n  > ");
            // null is EOF -- stdin closed, so there is nobody left to ask.
            if (choice === null || choice === "0" || choice === "q") break;
            const picked = entries[Number(choice) - 1];
            if (picked) await picked.run();
            else if (choice !== "") console.log("  ?");
        }
    } finally {
        await link.close().catch(() => {});
        closeTerm();
    }
}

/**
 * One calibration run, launched from the connect menu on the link that is
 * already open.
 *
 * Guarded the same way driving is. `RUN calx` drives the robot the better part
 * of a metre and `RUN cala` spins it for three minutes -- over a relay both are
 * BROADCASTS, so every robot on the shared channel would start doing it. The
 * standalone `leaguebot calibrate` never opens a relay in the first place; this
 * path can inherit one from `connect`, so it has to check.
 */
async function menuCalibration(link, spec, name, options, which) {
    if (!isPointToPoint(spec)) {
        console.log(`\n  Refusing to calibrate over ${spec.describe}.`);
        console.log("  That is a radio relay, and the fleet shares one channel -- EVERY");
        console.log("  robot in range would start the run, not just " + name + ".");
        console.log("  Reconnect over WiFi, the farm's TCP link, or a USB cable.");
        return;
    }
    const results = which === "wheel"
        ? await runWheelCalibration(link)
        : await runTurnCalibration(link, name, options);
    if (Object.keys(results).length === 0) return;
    reportCalibration(name, results, options);
}

async function functionsMenu(link, known) {
    const functions = known ?? await listFunctions(link);
    if (functions.length === 0) {
        console.log("  The robot listed no functions.");
        return;
    }
    functions.forEach((fn, i) => {
        console.log(`  ${String(i + 1).padStart(3)}) ${fn.name}${fn.signature ? ` ${fn.signature}` : ""}`);
    });
    const choice = await ask("\n  run which? (Enter to go back) ");
    if (choice === null || choice === "") return;
    const fn = functions[Number(choice) - 1];
    if (!fn) { console.log("  no such function"); return; }

    const params = parseSignature(fn.signature);
    let args = [];
    if (params === undefined) {
        // No signature at all: the robot never said, so do not pretend to know.
        const raw = await ask(`  arguments for ${fn.name} (space separated, or blank): `);
        args = raw === null || raw === "" ? [] : raw.split(/\s+/);
    } else if (params.length > 0) {
        const answers = [];
        for (const param of params) {
            const hint = param.default !== undefined ? ` [${param.default}]` : "";
            answers.push((await ask(`  ${param.name}${hint}: `)) ?? "");
        }
        args = positionalArgs(params, answers);
    }

    console.log(`\n  RUN ${fn.name}${args.length ? ` ${args.join(" ")}` : ""}`);
    const off = link.onRawLine((line) => console.log(`  < ${line}`));
    link.sendCommand("RUN", [fn.name, ...args]);
    console.log("  (press Enter when it has finished)");
    await ask("");
    off();
}

// ---- calibrate ------------------------------------------------------------

/**
 * Drive one on-robot calibration routine and collect its report.
 *
 * `done` decides when the run is over, because the two routines end
 * differently and neither ends with its ack: the RUN handler holds the wire's
 * own fiber for the whole run, so the ack arrives only afterwards, and for
 * `cala` the "apply" line is NOT last -- two verification spins follow it.
 */
function runCalibration(link, verb, { done, timeoutMs }) {
    return new Promise((resolve) => {
        const lines = [];
        const finish = (outcome) => {
            clearTimeout(timer);
            off();
            resolve({ lines, outcome });
        };
        const timer = setTimeout(() => finish("timeout"), timeoutMs);
        const off = link.onRawLine((line) => {
            if (!/^CAL[XA]:/.test(line)) return;
            lines.push(line);
            console.log(`  ${line}`);
            const outcome = done(line, lines);
            if (outcome) finish(outcome);
        });
        link.sendCommand("RUN", [verb]);
    });
}

const WHEEL_INSTRUCTIONS = `
  WHEEL CALIBRATION (calx) -- how far does one wheel turn actually carry it?

  Lay two strips of black tape across the robot's path, exactly 90 cm apart.
  Put the robot BEHIND the first strip, pointing straight down the lane, with
  at least 110 cm of clear floor beyond the second strip.

  It will creep forward until it finds the first line, then drive the gap at
  10 cm/s and stop on the second. The reflectance sensor sits ahead of the
  wheels, but it crosses BOTH lines with the same offset, so the offset
  cancels and never enters the answer.
`;

const TURN_INSTRUCTIONS = `
  TURN CALIBRATION (cala) -- how wide does it turn as though its wheels are?

  Lay two strips of black tape in a CROSS, at right angles. Stand the robot in
  the middle of the cross: wheel axle along one arm, forward-back axis along
  the other. Centre it as well as you can -- the run prints a "centring
  scatter" figure, and a high one means the answer reads low.

  It spins in place four times (two to measure, two to check) at 30 deg/s, so
  give it about three minutes and keep the cross clear.
`;

/**
 * The 90 cm distance run. Returns what it measured, or {} if nothing ran.
 *
 * Split out of calibrateCommand so the connect menu can offer the same run on
 * a link it already has open, without a second connection or a second copy of
 * the terminal conditions.
 */
export async function runWheelCalibration(link) {
    const results = {};
    if (!await confirm("\nRun the WHEEL calibration (90 cm track)?", true)) return results;
    console.log(WHEEL_INSTRUCTIONS);
    if (!await pressSpace()) return results;

    const { lines, outcome } = await runCalibration(link, "calx", {
        timeoutMs: 180_000,
        done: (line) => (/^CALX:apply/.test(line) ? "done"
            : /^CALX:fail/.test(line) ? "failed" : undefined),
    });
    if (outcome === "done" || outcome === "timeout") {
        const diameter = deriveWheelDiameterMm(lines);
        if (diameter !== undefined) {
            results.wheelDiameterMm = diameter;
            console.log(`\n  Wheel diameter: ${diameter} mm`);
        } else {
            console.log("\n  The run did not report a diameter.");
        }
    } else {
        console.log(`\n  Wheel calibration ${outcome}.`);
    }
    return results;
}

/** The spin on the cross. Returns what it measured, or {} if nothing ran. */
export async function runTurnCalibration(link, name, options) {
    const results = {};

    // A stored diameter is as good as a fresh one for correcting the spin, and
    // re-driving the 90 cm track just to recover it would be silly.
    const stored = loadStore(options.dir).robots[name]?.wheelDiameterMm;
    if (stored !== undefined) {
        results.wheelDiameterMm = stored;
        console.log(`\n  Using the stored wheel diameter, ${stored} mm.`);
    }

    if (!await confirm("\nRun the TURN calibration (spin on a cross)?", true)) return {};

    console.log("\n  Measure the track width with a caliper -- the distance between the");
    console.log("  two wheel contact patches, in cm -- and type it below.");
    console.log("  Leave it BLANK and the spin's own effective width is used instead,");
    console.log("  which drives correctly but cannot tell you how much is scrub.");
    const typed = (await ask("\n  Track width in cm (blank to skip): ")) ?? "";
    const measuredTrackWidthCm = typed === "" ? undefined : Number(typed);
    if (typed !== "" && !Number.isFinite(measuredTrackWidthCm)) {
        console.log(`  '${typed}' is not a number -- carrying on without a caliper figure.`);
    }

    console.log(TURN_INSTRUCTIONS);
    if (!await pressSpace()) return {};

    const { lines, outcome } = await runCalibration(link, "cala", {
        timeoutMs: 420_000,
        // CALA:error is the LAST line, after the two check spins. A CALA:fail
        // only ends the run if it lands BEFORE the measurement -- one during
        // the checks is a bad check, not a bad measurement.
        done: (line, seen) => {
            if (/^CALA:error/.test(line)) return "done";
            if (/^CALA:fail/.test(line)
                && !seen.some((l) => /^CALA:measured b=/.test(l))) return "failed";
            return undefined;
        },
    });
    const reported = deriveReportedTrackWidthCm(lines);
    if (reported === undefined) {
        console.log(`\n  Turn calibration ${outcome} without a measurement.`);
        return {};
    }
    results.reportedTrackWidthCm = reported;
    if (Number.isFinite(measuredTrackWidthCm)) results.measuredTrackWidthCm = measuredTrackWidthCm;
    return results;
}

/** Derive, print and save. Shared by the command and the connect menu. */
export function reportCalibration(name, results, options) {
    const cal = deriveCalibration(results);
    console.log(`\n--- ${name} ---`);
    if (cal.wheelDiameterMm !== undefined) {
        console.log(`  wheel diameter        ${cal.wheelDiameterMm} mm`);
    }
    if (cal.reportedTrackWidthCm !== undefined) {
        console.log(`  spin reported b       ${cal.reportedTrackWidthCm} cm`
            + ` (assuming a ${BASELINE_DIAMETER_MM} mm wheel)`);
        console.log(`  effective track width ${cal.effectiveTrackWidthCm} cm`);
    }
    if (cal.trackWidthCm !== undefined) console.log(`  track width           ${cal.trackWidthCm} cm`);
    if (cal.rotationalSlip !== undefined) console.log(`  rotational slip       ${cal.rotationalSlip}`);
    if (cal.scrubMm !== undefined) {
        console.log(`  scrub                 ${cal.scrubMm > 0 ? "+" : ""}${cal.scrubMm} mm`
            + "  (it turns as though its wheels were this much further apart)");
    }

    const file = saveCalibration(name, cal, options.dir);
    console.log(`\nSaved to ${file}`);

    const snippet = calibrationSnippet(cal);
    if (snippet.length > 0) {
        console.log("\nPaste this into the robot's program:\n");
        for (const line of snippet) console.log(`    ${line}`);
    }
}

export async function calibrateCommand(name, options) {
    // pointToPoint: `RUN calx` and `RUN cala` are motion. Over a relay they are
    // BROADCASTS -- every robot on the shared channel would start driving or
    // spinning -- so a relay is not a candidate for this command at all.
    const { link, spec, banner } = await connectTo(name, { ...options, pointToPoint: true });
    console.log(`\nConnected to ${banner.name} over ${spec.describe}`);
    if (spec.transport === "serial") {
        console.log("NOTE: this is the USB cable. Both routines drive the robot several");
        console.log("metres -- make sure the cable is long enough, or use WiFi.");
    }
    link.onError((error) => console.error(`  link error: ${error.message}`));

    let results = {};
    try {
        results = { ...results, ...await runWheelCalibration(link) };
        results = { ...results, ...await runTurnCalibration(link, name, options) };
    } finally {
        await link.close().catch(() => {});
    }

    closeTerm();
    if (results.wheelDiameterMm === undefined && results.reportedTrackWidthCm === undefined) {
        console.log("\nNothing measured, nothing saved.");
        return;
    }
    reportCalibration(name, results, options);
}

/** `leaguebot show [name]` -- what is already in calibration.json. */
export function showCommand(name, options) {
    const store = loadStore(options.dir);
    const names = name ? [name] : Object.keys(store.robots);
    if (names.length === 0) { console.log("No calibration recorded yet."); return; }
    for (const key of names) {
        const cal = store.robots[key];
        if (!cal) { console.log(`${key}: nothing recorded`); continue; }
        console.log(`\n--- ${key} ---  (measured ${cal.measuredAt ?? "?"})`);
        for (const line of calibrationSnippet(cal)) console.log(`    ${line}`);
    }
}

/** `leaguebot drive <name>` -- straight into the cursor-key driver. */
export async function driveCommand(name, options) {
    // pointToPoint: a relay would broadcast the motion to every robot in
    // range, so it is not a candidate for this command at all.
    const { link, spec, banner } = await connectTo(name, { ...options, pointToPoint: true });
    console.log(`\nConnected to ${banner.name} over ${spec.describe}`);
    link.onError((error) => console.error(`  link error: ${error.message}`));
    try {
        await driveWithKeys(link, name, spec);
    } finally {
        await link.close().catch(() => {});
        closeTerm();
    }
}
