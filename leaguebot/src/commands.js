// commands.js -- probe, connect and calibrate.

import {
    BASELINE_DIAMETER_MM, calibrationSnippet, deriveCalibration,
    deriveReportedTrackWidthCm, deriveWheelDiameterMm, loadStore, saveCalibration,
} from "./calibration.js";
import path from "node:path";

import { explainPortError } from "./discovery.js";
import { candidatesFor, connectTo, survey } from "./resolve.js";
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
        console.log(`  ${pad("NAME", 8)}${pad("TYPE", 8)}${pad("ROLE", 14)}${pad("PORT", 26)}HOW`);
        for (const device of state.usb) {
            const name = device.name ?? "?";
            // "asked" means the board itself answered; "remembered" means the
            // name came out of the registry and nothing verified it.
            const how = device.source === "banner" ? "asked it"
                : device.source === "registry" ? "remembered, port busy"
                : device.error ?? "not identified";
            console.log(`  ${pad(name, 8)}${pad(device.type, 8)}${pad(device.role ?? "-", 14)}`
                + `${pad(device.portPath, 26)}${how}`);
        }
        const busy = state.usb.filter((d) => d.error);
        if (busy.length > 0) {
            console.log(`\n  ${busy.length} of ${state.usb.length} ports are held by another program`);
            console.log("  (robot-console's dev server, mbdeploy serve, or a serial monitor).");
            if (state.registryFile) {
                const shown = path.relative(process.cwd(), state.registryFile) || state.registryFile;
                console.log(`  Names came from ${shown}, not from the board itself,`);
                console.log("  so they are last-known rather than confirmed.");
            }
            console.log("  A busy board cannot be connected to or used as a relay -- stop");
            console.log("  whatever is holding it first.");
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

    console.log("\nRobots:");
    if (robots.size === 0) {
        console.log("  none found");
    } else {
        for (const [name, hows] of robots) console.log(`  ${pad(name, 8)}${[...hows].join(", ")}`);
    }

    // A relay reaches ANY robot in range, and nothing announces those, so an
    // empty or short list above is not evidence that no other robot is out
    // there. Say so rather than let it read as "no robots".
    const relayCount = state.relays.length + state.networkRelays.length;
    if (relayCount > 0) {
        console.log(`\n${relayCount} relay(s) available, so robots not listed above may still`);
        console.log("be reachable over the air -- try 'probe <name>' for one you expect.");
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

    try {
        for (;;) {
            console.log("\n  1) Functions      run one of the robot's programs");
            console.log("  2) Status         ask the robot how it is");
            console.log("  3) Watch          print everything it says");
            console.log("  4) Send a line    type a raw wire command");
            console.log("  5) Stop           STOP the drive right now");
            console.log("  0) Quit");
            const choice = await ask("\n  > ");

            // null is EOF -- stdin closed, so there is nobody left to ask.
            if (choice === null || choice === "0" || choice === "q") break;
            if (choice === "1") await functionsMenu(link);
            else if (choice === "2") {
                const off = link.onRawLine((line) => console.log(`  < ${line}`));
                link.sendUnsequenced("STATUS");
                await new Promise((resolve) => setTimeout(resolve, 1200));
                off();
            } else if (choice === "3") await watchUntilEnter(link);
            else if (choice === "4") {
                const text = await ask("  line: ");
                if (text) {
                    const off = link.onRawLine((line) => console.log(`  < ${line}`));
                    link.sendLine(text);
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                    off();
                }
            } else if (choice === "5") {
                link.sendCommand("STOP");
                console.log("  STOP sent.");
            } else if (choice !== "") {
                console.log("  ?");
            }
        }
    } finally {
        await link.close().catch(() => {});
        closeTerm();
    }
}

async function functionsMenu(link) {
    console.log("\n  Asking the robot what it can run...");
    const functions = await listFunctions(link);
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

export async function calibrateCommand(name, options) {
    const { link, spec, banner } = await connectTo(name, options);
    console.log(`\nConnected to ${banner.name} over ${spec.describe}`);
    if (spec.transport === "serial") {
        console.log("NOTE: this is the USB cable. Both routines drive the robot several");
        console.log("metres -- make sure the cable is long enough, or use WiFi/radio.");
    }
    if (spec.transport === "radio" || spec.transport === "netradio") {
        // The report lines are fire-and-forget frames and a measured loss rate
        // of roughly a third is normal. The parsers have fallbacks, but WiFi
        // simply does not drop them, and a lost line here costs a whole run.
        console.log("NOTE: this is the radio, which drops lines. The report can arrive");
        console.log("incomplete -- prefer WiFi for calibration when the robot has it.");
    }
    link.onError((error) => console.error(`  link error: ${error.message}`));

    const results = {};
    try {
        // ---- wheel -------------------------------------------------------
        if (await confirm("\nRun the WHEEL calibration (90 cm track)?", true)) {
            console.log(WHEEL_INSTRUCTIONS);
            if (await pressSpace()) {
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
            }
        }

        // A stored diameter is as good as a fresh one for correcting the spin,
        // and re-running the 90 cm track just to get it back would be silly.
        if (results.wheelDiameterMm === undefined) {
            const stored = loadStore(options.dir).robots[name]?.wheelDiameterMm;
            if (stored !== undefined) {
                results.wheelDiameterMm = stored;
                console.log(`\n  Using the stored wheel diameter, ${stored} mm.`);
            }
        }

        // ---- turn --------------------------------------------------------
        if (await confirm("\nRun the TURN calibration (spin on a cross)?", true)) {
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
            if (await pressSpace()) {
                const { lines, outcome } = await runCalibration(link, "cala", {
                    timeoutMs: 420_000,
                    // CALA:error is the LAST line, after the two check spins.
                    // A CALA:fail only ends the run if it lands before the
                    // measurement -- one during the checks is a bad check, not
                    // a bad measurement.
                    done: (line, lines) => {
                        if (/^CALA:error/.test(line)) return "done";
                        if (/^CALA:fail/.test(line)
                            && !lines.some((l) => /^CALA:measured b=/.test(l))) return "failed";
                        return undefined;
                    },
                });
                const reported = deriveReportedTrackWidthCm(lines);
                if (reported !== undefined) {
                    results.reportedTrackWidthCm = reported;
                    if (Number.isFinite(measuredTrackWidthCm)) {
                        results.measuredTrackWidthCm = measuredTrackWidthCm;
                    }
                } else {
                    console.log(`\n  Turn calibration ${outcome} without a measurement.`);
                }
            }
        }
    } finally {
        await link.close().catch(() => {});
    }

    // ---- the answer ------------------------------------------------------
    if (results.wheelDiameterMm === undefined && results.reportedTrackWidthCm === undefined) {
        closeTerm();
        console.log("\nNothing measured, nothing saved.");
        return;
    }

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

    closeTerm();
    const file = saveCalibration(name, cal, options.dir);
    console.log(`\nSaved to ${file}`);

    const snippet = calibrationSnippet(cal);
    if (snippet.length > 0) {
        console.log("\nPaste this into the robot's program:\n");
        for (const line of snippet) console.log(`    ${line}`);
    }
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
