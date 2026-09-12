// resolve.js -- turn a robot name into an open link.
//
// Three paths can reach the same robot and they are not equally good, so they
// are tried in a fixed order:
//
//   1. WiFi   -- no cable, no relay, full line rate. Best if it is up.
//   2. Radio  -- needs a USB relay on this machine, and the robot in range.
//                Lines are capped at a radio frame and are fire-and-forget.
//   3. Serial -- always works, but the robot is on the end of a cable, which
//                for a calibration run means a 90 cm cable minimum.
//
// Calibration in particular wants the robot free to move, which is exactly why
// WiFi is preferred and why serial is last rather than first.

import { createLink, traceLink } from "./links.js";
import { explainPortError, loadDeviceRegistry, lookupRobotByName, probeUsb, scanMdns } from "./discovery.js";

/** The channel/group this fleet's robots listen on -- test/boot.ts calls
 *  setupRadio(55, 114). A relay boots on 0/10 and hears nothing until it is
 *  moved here, so these are set on every connect rather than assumed. */
export const FLEET_CHANNEL = 55;
export const FLEET_GROUP = 114;

/**
 * Everything currently reachable, by name.
 *
 * USB and mDNS are scanned concurrently: the mDNS scan is a fixed time budget
 * and there is no reason to spend it waiting on serial ports.
 */
export async function survey(options = {}) {
    const { scanMs, usb = true, mdns = true } = options;

    // Names worth asking the OS resolver about directly. A browse cannot be
    // relied on to surface these -- see lookupRobotByName() -- so every name we
    // already know is checked by name, which is both faster and more reliable.
    const known = new Set(options.names ?? []);
    if (options.knownFromRegistry !== false) {
        for (const entry of loadDeviceRegistry(options.dir ? [options.dir] : []).byUid.values()) {
            if (entry.name && (entry.commonName === "robot" || entry.role === "NEZHA2")) known.add(entry.name);
        }
    }

    const [usbDevices, network, byName] = await Promise.all([
        usb ? probeUsb(options) : Promise.resolve([]),
        mdns ? scanMdns(scanMs) : Promise.resolve({ robots: [], relays: [] }),
        mdns ? Promise.all([...known].map((n) => lookupRobotByName(n))) : Promise.resolve([]),
    ]);

    // A browse result wins over a by-name lookup: it carries the TXT record,
    // and its presence proves the robot announced rather than merely resolved.
    const robots = new Map();
    for (const found of byName) if (found) robots.set(found.name, found);
    for (const robot of network.robots) robots.set(robot.name, robot);
    network.robots = [...robots.values()];

    return {
        usb: usbDevices,
        wifiRobots: network.robots,
        networkRelays: network.relays,
        registryFile: usbDevices.registryFile,
        // Only boards we can actually OPEN can serve as a relay: a remembered
        // name on a busy port is a fact about the board, not an available link.
        relays: usbDevices.filter((d) => d.type === "relay" && !d.error),
        usbRobots: usbDevices.filter((d) => d.type === "robot" && !d.error),
        usbAll: usbDevices,
    };
}

/**
 * Every way to reach `name`, best first. Pure: builds specs, opens nothing.
 */
export function candidatesFor(name, state, { channel = FLEET_CHANNEL, group = FLEET_GROUP } = {}) {
    const candidates = [];

    for (const robot of state.wifiRobots) {
        if (robot.name !== name) continue;
        // Resolved but refusing: skip it rather than spend the connect timeout
        // on a link we already know is not there.
        if (robot.reachable === false) continue;
        candidates.push({
            transport: robot.transport === "wifi" ? "wifi" : "tcp",
            host: robot.host,
            port: robot.port,
            describe: `${robot.transport} ${robot.host}:${robot.port}`,
        });
    }

    // A relay is a path to ANY robot in range, not to one named robot, so
    // every relay is a candidate for every name. Whether this robot is
    // actually listening is only knowable by trying -- which is why the
    // banner check in connectTo() is not optional on these.
    //
    // A relay on this machine's USB comes before one on the network: same
    // radio, one less hop, and it does not stop working when the LAN does.
    for (const relay of state.relays) {
        candidates.push({
            transport: "radio",
            portPath: relay.portPath,
            channel,
            group,
            describe: `radio via ${relay.name ?? relay.portPath} (ch ${channel}/grp ${group})`,
        });
    }
    for (const relay of state.networkRelays) {
        candidates.push({
            transport: "netradio",
            host: relay.host,
            port: relay.port,
            channel,
            group,
            describe: `radio via ${relay.name} on ${relay.host}:${relay.port} (ch ${channel}/grp ${group})`,
        });
    }

    for (const device of state.usbRobots) {
        if (device.name !== name) continue;
        candidates.push({
            transport: "serial",
            portPath: device.portPath,
            describe: `serial ${device.portPath}`,
        });
    }

    return candidates;
}

/**
 * Open the best available link to `name` and confirm the robot on the other
 * end is really that robot.
 *
 * The confirmation matters most on radio: a relay will happily carry a
 * conversation with whichever robot answers, so a link that opens is not yet a
 * link to the robot you asked for. The banner's name is the check.
 */
export async function connectTo(name, options = {}) {
    const state = options.state ?? await survey({ ...options, names: [name, ...(options.names ?? [])] });
    const candidates = candidatesFor(name, state, options);
    if (candidates.length === 0) {
        throw new Error(`no way to reach '${name}' -- run 'leaguebot probe' to see what is around`);
    }

    const failures = [];
    for (const spec of candidates) {
        const link = createLink(spec);
        if (options.verbose) traceLink(link);
        try {
            await link.connect();
            const banner = await link.identify({ expect: name });
            if (banner === null) {
                failures.push(`${spec.describe}: nothing answered HELLO`);
                await link.close().catch(() => {});
                continue;
            }
            if (banner.name !== name) {
                failures.push(`${spec.describe}: answered as '${banner.name}', not '${name}'`);
                await link.close().catch(() => {});
                continue;
            }
            return { link, spec, banner };
        } catch (error) {
            failures.push(`${spec.describe}: ${explainPortError(error)}`);
            await link.close().catch(() => {});
        }
    }

    throw new Error(`could not reach '${name}':\n  ${failures.join("\n  ")}`);
}
