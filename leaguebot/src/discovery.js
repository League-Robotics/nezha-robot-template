// discovery.js -- what is out there: micro:bits on USB, and robots on the LAN.
//
// Ported from robot-console's packages/host/src/devices.ts and
// discovery/mdnsDiscovery.ts, trimmed to enumeration only -- no SWD, no HID,
// no flashing. It does read mbdeploy's device registry, but only as a fallback
// for naming a port it could not open.

import dnsPromises from "node:dns/promises";
import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Bonjour } from "bonjour-service";
import { SerialPort } from "serialport";
import { SerialLink, toCalloutPath } from "./links.js";
import { bannerDeviceType } from "./wire.js";

/** DAPLink's USB ids -- the mbed interface chip every micro:bit presents. */
export const DAPLINK_VENDOR_ID = 0x0d28;
export const DAPLINK_PRODUCT_ID = 0x0204;

// A DAPLink USB serial is 48 hex characters: board(4) family(4) hic(8)
// unique(16) pad(8) hic(8). Only the middle "unique" field differs between
// boards -- four micro:bits on one bench share both the 16-char prefix AND the
// 16-char suffix, so a tail slice names every one of them identically.
const SERIAL_UNIQUE_START = 16;
const SERIAL_UNIQUE_END = 32;

export function uniqueSerialField(serialNumber) {
    if (typeof serialNumber !== "string" || serialNumber.length < SERIAL_UNIQUE_END) {
        return serialNumber ?? "";
    }
    return serialNumber.slice(SERIAL_UNIQUE_START, SERIAL_UNIQUE_END);
}

// serialport reports vid/pid as lowercase hex STRINGS, so compare as numbers.
function hexIdMatches(value, expected) {
    if (value === undefined) return false;
    return Number.parseInt(value, 16) === expected;
}

/** Every micro:bit-shaped serial port currently attached. */
export async function listMicrobitPorts() {
    const ports = await SerialPort.list();
    return ports
        .filter((p) => hexIdMatches(p.vendorId, DAPLINK_VENDOR_ID)
            && hexIdMatches(p.productId, DAPLINK_PRODUCT_ID))
        .map((p) => ({
            portPath: toCalloutPath(p.path),
            serialNumber: p.serialNumber,
            unique: uniqueSerialField(p.serialNumber),
        }));
}

/**
 * A serial port is an exclusive OS resource, so "in use" is by far the most
 * common failure here and its native wording ("Resource temporarily
 * unavailable Cannot lock port") names neither the cause nor the fix.
 * robot-console's dev server holds every attached board for as long as it
 * runs, which is exactly when someone is most likely to also reach for this.
 */
export function explainPortError(error) {
    const text = error?.message ?? String(error);
    if (/cannot lock port|resource temporarily unavailable|EBUSY|EACCES/i.test(text)) {
        return "in use by another program (robot-console, mbdeploy serve, or a serial monitor)";
    }
    return text;
}

/**
 * mbdeploy's device registry, keyed by the full USB serial.
 *
 * A serial port is exclusive, so while robot-console's dev server or
 * `mbdeploy serve` is running there is NO way to ask a board its name -- and a
 * listing of three anonymous ports is close to useless. This file is the one
 * source that answers "which board is on this port" without opening it.
 *
 * What it gives is a CACHED name, not a verified one: the board on a port can
 * be swapped without the file knowing. So callers mark these as remembered
 * rather than presenting them as identified.
 */
export function loadDeviceRegistry(dirs = []) {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const candidates = [
        ...dirs,
        process.cwd(),
        path.resolve(here, "../.."),        // the repo this tool ships inside
    ];
    for (const dir of candidates) {
        const file = path.join(dir, "config", "devices.json");
        if (!fs.existsSync(file)) continue;
        try {
            const raw = JSON.parse(fs.readFileSync(file, "utf8"));
            const byUid = new Map();
            for (const [uid, entry] of Object.entries(raw)) {
                byUid.set(uid, {
                    name: entry.device_name ?? entry.board_name,
                    role: entry.role,
                    commonName: entry.common_name,
                });
            }
            return { file, byUid };
        } catch {
            // A corrupt registry is not worth failing a probe over.
        }
    }
    return { file: undefined, byUid: new Map() };
}

function typeFromRegistry(entry) {
    if (entry?.role === "RADIOBRIDGE" || entry?.role === "RADIORELAY") return "relay";
    if (entry?.commonName === "robot" || entry?.role === "NEZHA2") return "robot";
    return "unknown";
}

/**
 * Open one port, say HELLO, and report what answered.
 *
 * The USB ids say "this is a micro:bit"; they cannot say whether it is a robot,
 * a radio relay or a board running someone's homework. Only the banner knows,
 * so identification means actually talking to it -- and when that is not
 * possible, `registry` supplies a remembered name instead of nothing.
 */
export async function identifyPort(port, registry) {
    const link = new SerialLink({ transport: "serial", portPath: port.portPath });
    try {
        await link.connect();
        const banner = await link.identify();
        return {
            ...port,
            banner,
            name: banner?.name,
            role: banner?.role,
            type: bannerDeviceType(banner),
            source: "banner",
        };
    } catch (error) {
        const remembered = registry?.byUid.get(port.serialNumber ?? "");
        return {
            ...port,
            error: explainPortError(error),
            name: remembered?.name,
            role: remembered?.role,
            type: typeFromRegistry(remembered),
            // Never "banner": this board was not spoken to, and the name could
            // belong to whatever was last plugged into that USB slot.
            source: remembered ? "registry" : "none",
        };
    } finally {
        await link.close().catch(() => {});
    }
}

/** Identify every attached micro:bit. Ports are opened one at a time: they are
 *  a shared OS resource and opening four at once is how you get EBUSY. */
export async function probeUsb(options = {}) {
    const registry = options.registry ?? loadDeviceRegistry(options.dir ? [options.dir] : []);
    const ports = await listMicrobitPorts();
    const found = [];
    for (const port of ports) found.push(await identifyPort(port, registry));
    found.registryFile = registry.file;
    return found;
}

/** The port a robot's v6 WiFi link listens on (mDNS TXT `port=7654`). */
export const ROBOT_LINK_PORT = 7654;

/**
 * Find one robot by name through the OPERATING SYSTEM's resolver, not by
 * browsing.
 *
 * The robots' mDNS responders do not answer queries -- they only announce
 * unsolicited, on a slow cycle. Measured on this LAN: a browse got `torture`
 * (a real responder) in 133 ms, but `tigez` took 13.1 s to appear and another
 * robot took 45.5 s. Any browse window short enough to be usable therefore
 * misses robots that are sitting right there, which is why `probe` kept
 * reporting "no robots advertising".
 *
 * macOS's mDNSResponder keeps its own cache and does its own querying, so
 * asking it for `<name>.local` answers in single-digit milliseconds -- 8 ms for
 * the robot the browse needed 13 s to find. So whenever a NAME is already
 * known, resolve it directly and skip the browse entirely.
 */
export async function lookupRobotByName(name, { port = ROBOT_LINK_PORT, timeoutMs = 2000, verify = true } = {}) {
    let address;
    try {
        const result = await Promise.race([
            dnsPromises.lookup(`${name}.local`, { family: 4 }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)),
        ]);
        address = result.address;
    } catch {
        // Not on the network, or not resolvable. Not an error worth raising:
        // the caller has other transports to try.
        return undefined;
    }

    const found = { name, transport: "wifi", host: address, port, source: "dns" };
    if (!verify) return found;

    // A NAME IS NOT A LINK. tigez resolves to an address in 8 ms and then
    // refuses the connection: the board is on the WiFi, holding a DHCP lease
    // and answering mDNS, while its v6 listener is not up. Reporting that as
    // "reachable over WiFi" sends the operator down a path that cannot work,
    // so the port is opened before the claim is made. A refusal is immediate,
    // so this costs milliseconds when it fails and milliseconds when it works.
    found.reachable = await portAccepts(address, port, timeoutMs);
    return found;
}

/** Does anything accept a TCP connection there? */
export function portAccepts(host, port, timeoutMs = 2000) {
    return new Promise((resolve) => {
        const socket = net.connect({ host, port });
        const done = (ok) => { socket.destroy(); resolve(ok); };
        socket.once("connect", () => done(true));
        socket.once("error", () => done(false));
        setTimeout(() => done(false), timeoutMs);
    });
}

// ---- mDNS -----------------------------------------------------------------

/** A robot on WiFi advertises `_robotlink`, over BOTH tcp and udp. */
const ROBOTLINK = "robotlink";
/** A robot whose serial is exported over TCP by a fleet daemon. */
const MBSERIAL = "mbserial";
/** A radio relay reachable over the network. */
const MBRELAY = "mbrelay";

const DEFAULT_SCAN_MS = 2500;

// For _robotlink the robot's 5-letter name is in the TXT record, NOT in the
// instance name (which is a human label like "gopiv robot link"). The tcp and
// udp advertisements are the same robot, so both fold onto this one key.
function serviceName(service) {
    return service.txt?.name ?? service.name;
}

/**
 * Browse for robots on the LAN. Resolves after `scanMs` -- mDNS has no "that
 * is all of them", only a quiet period, so a scan is always a time budget.
 */
export function scanMdns(scanMs = DEFAULT_SCAN_MS) {
    return new Promise((resolve) => {
        const bonjour = new Bonjour();
        const robots = new Map();
        const relays = new Map();

        const browsers = [
            bonjour.find({ type: ROBOTLINK, protocol: "tcp" }),
            bonjour.find({ type: ROBOTLINK, protocol: "udp" }),
            bonjour.find({ type: MBSERIAL, protocol: "tcp" }),
            bonjour.find({ type: MBRELAY, protocol: "tcp" }),
        ];

        browsers[0].on("up", (s) => addRobot(s, "wifi"));
        browsers[1].on("up", (s) => addRobot(s, "wifi"));
        browsers[2].on("up", (s) => addRobot(s, "tcp"));
        browsers[3].on("up", (s) => {
            relays.set(s.name, { name: s.name, host: hostOf(s), port: s.port });
        });

        function hostOf(service) {
            // Prefer a literal IPv4: a .local name needs another mDNS round
            // trip and fails outright on a machine with mDNS resolution off.
            const ipv4 = (service.addresses ?? []).find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a));
            return ipv4 ?? service.host ?? service.fqdn;
        }

        function addRobot(service, transport) {
            const name = serviceName(service);
            if (!name) return;
            const port = Number(service.txt?.port ?? service.port);
            // A _robotlink advertisement wins over _mbserial for the same
            // robot: it is the robot's own WiFi link, not a daemon relaying
            // its USB cable.
            const existing = robots.get(name);
            if (existing && existing.transport === "wifi" && transport !== "wifi") return;
            robots.set(name, {
                name,
                transport,
                host: hostOf(service),
                port,
                role: service.txt?.role,
            });
        }

        setTimeout(() => {
            for (const browser of browsers) browser.stop();
            bonjour.destroy();
            resolve({ robots: [...robots.values()], relays: [...relays.values()] });
        }, scanMs);
    });
}
