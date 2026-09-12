// links.js -- the three ways to reach a robot, behind one interface.
//
// Ported from robot-console's packages/host/src/link/*.ts. That version has
// four link classes with no shared base and ~8 glue methods written out per
// class (a deliberate choice its own doc comment flags as the place a port
// would improve). This one hoists the glue into a base class, because all
// three transports really do differ in only two things: how bytes get in and
// out, and whether a command plane has to be crossed first.
//
//   SerialLink -- micro:bit on USB (DAPLink CDC)
//   RelayLink  -- a USB relay micro:bit, forwarding over the nRF radio
//   TcpLink    -- a robot on WiFi, or a robot's serial exported over TCP
//
// connect() and identify() are SPLIT on purpose. "the port would not open" and
// "the port opened but nothing is answering" are different facts: the second
// is a normal state a robot can be in, not an error. Splitting them also means
// the port opens exactly once and stays open across identify retries, which is
// what keeps the OS port lock from fighting us.

import net from "node:net";
import { SerialPort } from "serialport";
import { decodeLine, parseBanner, Session } from "./wire.js";

/** DAPLink CDC ports always run at this fixed rate. */
export const BAUD_RATE = 115200;

/** Gap between paced writes. Writing flat out at 115200 overruns the board's
 *  USB receive buffer and it drops whole lines with no error anywhere. */
const WRITE_PACE_MS = 10;

/** How long to wait for HELLO's banner before calling it silent. */
const OPEN_TIMEOUT_MS = 3000;

const HANDSHAKE_TIMEOUT_MS = 3000;
const SYNC_RETRY_MS = 500;
const SYNC_ATTEMPTS = 16;          // 8 s -- long enough for a DAP reset + boot

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** On macOS, /dev/tty.* blocks on carrier detect and can hang forever. The
 *  callout device is the same port without that wait. */
export function toCalloutPath(path, platform = process.platform) {
    if (platform !== "darwin") return path;
    return path.startsWith("/dev/tty.") ? `/dev/cu.${path.slice("/dev/tty.".length)}` : path;
}

/** Reassembles newline-delimited lines out of arbitrary chunks. */
export class LineReassembler {
    constructor() { this.buffer = ""; }
    push(chunk) {
        this.buffer += chunk.toString("utf8");
        const lines = this.buffer.split("\n");
        this.buffer = lines.pop() ?? "";
        // The relay echoes a forwarded line back prefixed "< ". Strip it here,
        // once, rather than in each of the parsers downstream.
        return lines.map((line) => line.replace(/\r$/, "").replace(/^< /, ""));
    }
}

/** Serialises writes with a minimum gap. A throwing write is swallowed so one
 *  failure cannot wedge the chain for every line behind it. */
export class WritePacer {
    constructor(write, paceMs = WRITE_PACE_MS) {
        this.write = write;
        this.paceMs = paceMs;
        this.chain = Promise.resolve();
    }
    send(text) {
        this.chain = this.chain.then(async () => {
            try { this.write(text); } catch { /* one bad write must not stop the rest */ }
            await delay(this.paceMs);
        });
        return this.chain;
    }
}

/** Wait for the first line matching `match`, or resolve undefined on timeout. */
function waitForLine(link, match, timeoutMs) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => { off(); resolve(undefined); }, timeoutMs);
        const off = link.onRawLine((line) => {
            if (!match(line)) return;
            clearTimeout(timer);
            off();
            resolve(line);
        });
    });
}

/** Once one robot has answered, how much longer its neighbours get to. */
const BANNER_BURST_MS = 400;

/**
 * Collect every banner one HELLO shakes loose, not just the first.
 *
 * HELLO over a relay is a BROADCAST -- every robot on the channel answers it,
 * so the replies come back as a burst milliseconds apart. Taking the first and
 * unsubscribing throws the rest of that burst away, which turns "is gopiv
 * there" into a race against its louder neighbours: measured on the bench,
 * `vitut` reported `tigez` on six attempts running while `vevov` was answering
 * every one of them, just second.
 *
 * The window closes as soon as `expect` is heard, so the hit costs nothing. A
 * miss holds on for the rest of the burst rather than the full silence budget
 * -- the robots that are going to answer have already done so.
 */
function collectBanners(link, expect, timeoutMs, burstMs = BANNER_BURST_MS) {
    return new Promise((resolve) => {
        const heard = [];
        let timer = setTimeout(finish, timeoutMs);
        function finish() { clearTimeout(timer); off(); resolve(heard); }
        const off = link.onRawLine((line) => {
            const banner = parseBanner(line);
            if (banner === null) return;
            heard.push(banner);
            if (expect === undefined || banner.name === expect) { finish(); return; }
            clearTimeout(timer);
            timer = setTimeout(finish, burstMs);
        });
    });
}

// ---- the base -------------------------------------------------------------

// Exported for the tests: identify()'s broadcast handling is the part most
// worth pinning down and it needs no transport to exercise.
export class BaseLink {
    constructor(spec) {
        this.spec = spec;
        this.session = new Session();
        this.reassembler = new LineReassembler();
        // True only while a relay handshake is in progress. A spec with no
        // channel never enters a command plane at all, so it starts false.
        this.inCommandPlane = spec.channel !== undefined;
        this.rawListeners = new Set();
        this.lineListeners = new Set();
        this.errorListeners = new Set();
        this.closed = false;
    }

    onRawLine(listener) {
        this.rawListeners.add(listener);
        return () => this.rawListeners.delete(listener);
    }
    onLine(listener) {
        this.lineListeners.add(listener);
        return () => this.lineListeners.delete(listener);
    }
    onError(listener) {
        this.errorListeners.add(listener);
        return () => this.errorListeners.delete(listener);
    }

    _emitError(error) { for (const l of [...this.errorListeners]) l(error); }

    /** Every inbound chunk lands here, whatever the transport. */
    _ingest(chunk) {
        for (const line of this.reassembler.push(chunk)) this._handleLine(line);
    }

    _handleLine(line) {
        for (const l of [...this.rawListeners]) l(line);
        // While handshaking, `#`-prefixed relay chatter IS the conversation and
        // none of it is robot traffic -- feeding it to the session would have
        // it reading another device's replies as this robot's acks.
        if (this.inCommandPlane) return;
        const decoded = decodeLine(line);
        // A nack means the robot wants earlier bytes again; resend before
        // anything downstream reacts, so the stream unblocks either way.
        const event = this.session.observe(decoded);
        if (event?.resend?.length) for (const text of event.resend) this._send(text);
        if (decoded.kind === "line") for (const l of [...this.lineListeners]) l(decoded);
    }

    /**
     * Send HELLO and wait for a banner. Resolves null if nothing answers --
     * never throws: silence is a state, not a failure.
     *
     * Retried over a relay, for two independent reasons.
     *
     * The radio is fire-and-forget: nothing acknowledges HELLO, so one dropped
     * frame is silence and looks exactly like a dead robot. Observed on the
     * bench -- one probe reported "no answer" and three identical ones straight
     * after succeeded.
     *
     * And A RELAY IS NOT AN ADDRESS. Every robot in this fleet listens on the
     * same channel 55 / group 114, so HELLO over the air is a broadcast and
     * every robot in range answers it. Measured 2026-09-11 asking two USB
     * relays for `tigez`: one came back as `vevov`, the other as `gopiv`. So
     * each round reads the WHOLE burst of answers (see collectBanners) and
     * `expect` picks this robot out of it; the rounds after that are for the
     * dropped frames.
     *
     * Re-sending is safe: HELLO is a session reset, so a robot that did hear
     * the first one simply resets again.
     *
     * `heardNames` is left behind as every name that answered, which is what
     * makes "answered as 'tigez'" reportable as the several robots it was.
     */
    async identify({ expect, attempts } = {}) {
        const overRelay = this.spec.channel !== undefined;
        // Over a relay, keep asking: a silent round may be a dropped frame, and
        // the radio drops roughly one line in three, so one miss proves nothing.
        const tries = attempts ?? (overRelay ? (expect ? 6 : 3) : 1);
        this.heardNames = new Set();
        let last = null;
        for (let attempt = 0; attempt < tries; attempt += 1) {
            const wait = collectBanners(this, expect, OPEN_TIMEOUT_MS);
            this._send(this.session.connect());
            const heard = await wait;
            for (const banner of heard) this.heardNames.add(banner.name);
            const wanted = expect === undefined
                ? heard[0]
                : heard.find((banner) => banner.name === expect);
            if (wanted) return wanted;
            if (heard.length > 0) last = heard[heard.length - 1];
        }
        return last;
    }

    sendCommand(verb, fields = []) {
        const line = this.session.send(verb, fields);
        this._send(line);
        return line;
    }

    sendUnsequenced(verb, fields = []) {
        const line = this.session.sendUnsequenced(verb, fields);
        this._send(line);
        return line;
    }

    sendLine(text) { this._send(text.endsWith("\n") ? text : `${text}\n`); }
}

// ---- the relay command plane ----------------------------------------------

export class RelayHandshakeError extends Error {}

const isStatusLine = (line) => /^#\s*channel:\s*\d+\s+group:\s*\d+/i.test(line);
const isErrorLine = (line) => /^#\s*error\b/i.test(line.trimStart());

/**
 * Walk a relay from its command plane into its data plane.
 *
 * Each step waits for ITS OWN reply before sending the next. Firing them all
 * and watching for the last one looks equivalent and is not: a rejected `!CG`
 * must leave the relay in the command plane, which means `!P 7` and `!GO` have
 * to not have been sent yet.
 *
 * A relay boots on channel 0 / group 10 and hears nothing the fleet says, so
 * `!CG` is sent on every connect rather than assumed to have survived whoever
 * used the relay last.
 */
async function runCommandPlane(link, channel, group) {
    const step = async (line, label, expect) => {
        const wait = waitForLine(link, (l) => expect.test(l) || isErrorLine(l), HANDSHAKE_TIMEOUT_MS);
        link._send(line);
        const reply = await wait;
        if (reply === undefined) throw new RelayHandshakeError(`relay did not answer ${label}`);
        if (isErrorLine(reply)) throw new RelayHandshakeError(`relay rejected ${label}: ${reply}`);
    };

    // The relay may still be booting, so `?` is retried rather than waited on.
    let synced = false;
    for (let attempt = 0; attempt < SYNC_ATTEMPTS && !synced; attempt += 1) {
        const wait = waitForLine(link, isStatusLine, SYNC_RETRY_MS);
        link._send("?\n");
        synced = (await wait) !== undefined;
    }
    if (!synced) throw new RelayHandshakeError(`relay never answered '?' after ${SYNC_ATTEMPTS} attempts`);

    await step("!ECHO OFF\n", "!ECHO OFF", /^#\s*echo:\s*OFF\b/i);
    await step("!MODE RAW250\n", "!MODE RAW250", /^#\s*mode:\s*RAW250\b/i);
    await step(`!CG ${channel} ${group}\n`, `!CG ${channel} ${group}`,
        new RegExp(`^#\\s*channel:\\s*${channel}\\s+group:\\s*${group}\\b`, "i"));
    await step("!P 7\n", "!P 7", /\bpower:\s*7\b/i);
    await step("!GO\n", "!GO", /^#\s*entering data plane\b/i);
}

/**
 * Mixed into both transports below.
 *
 * A relay is not a third kind of transport -- it is a thing that sits at the
 * far end of one of the two real ones. A relay micro:bit on USB and a relay
 * exported over TCP differ only in how the bytes travel to it, so the choice
 * that matters is "is there a command plane to cross", not "serial or socket".
 * That is why a spec carrying a channel/group gets the handshake whatever its
 * transport, and it is what makes a networked relay work for free.
 *
 * Once `!GO` is confirmed there is no way back to the command plane short of a
 * reset, so there is deliberately no retarget(): pointing a relay at a
 * different robot means closing the link and opening a new one.
 */
async function crossCommandPlane(link) {
    const { channel, group } = link.spec;
    if (channel === undefined || group === undefined) {
        link.inCommandPlane = false;
        return;
    }
    try {
        await runCommandPlane(link, channel, group);
    } catch (error) {
        // No half-open state: a relay that did not reach the data plane is not
        // a link, so drop it rather than hand back something that looks
        // connected and silently talks to nobody.
        await link.close().catch(() => {});
        throw error;
    }
    link.inCommandPlane = false;
}

// ---- USB serial -----------------------------------------------------------

/** A micro:bit on the USB cable: the robot itself, or a relay to reach one. */
export class SerialLink extends BaseLink {
    async connect() {
        const path = toCalloutPath(this.spec.portPath);
        this.port = new SerialPort({ path, baudRate: BAUD_RATE });
        this.pacer = new WritePacer((text) => this.port.write(text));
        this.port.on("data", (chunk) => this._ingest(chunk));
        this.port.on("error", (error) => this._emitError(error));
        await new Promise((resolve, reject) => {
            if (this.port.isOpen) { resolve(); return; }
            this.port.once("open", resolve);
            this.port.once("error", reject);
        });
        await crossCommandPlane(this);
    }

    _send(text) { this.pacer.send(text); }

    async close() {
        if (this.closed) return;
        this.closed = true;
        await new Promise((resolve) => this.port.close(() => resolve()));
    }
}

/** Print both directions of a link's traffic. The single most useful thing to
 *  have when a robot "does not answer" and you need to know how far it got. */
export function traceLink(link, label = "") {
    const tag = label ? `${label} ` : "";
    const send = link._send.bind(link);
    link._send = (text) => {
        process.stderr.write(`${tag}> ${text.replace(/\n$/, "")}\n`);
        return send(text);
    };
    link.onRawLine((line) => process.stderr.write(`${tag}< ${line}\n`));
}

// ---- TCP ------------------------------------------------------------------

/** A robot on WiFi, a robot's serial exported over TCP, or a networked relay. */
export class TcpLink extends BaseLink {
    async connect() {
        this.socket = net.connect({ host: this.spec.host, port: this.spec.port });
        this.pacer = new WritePacer((text) => this.socket.write(text));
        this.socket.on("data", (chunk) => this._ingest(chunk));
        this.socket.on("error", (error) => this._emitError(error));
        await new Promise((resolve, reject) => {
            this.socket.once("connect", resolve);
            this.socket.once("error", reject);
        });
        // Before the first handshake write, not after: the command plane is a
        // strict send-one-wait-for-its-reply exchange, which is precisely the
        // traffic Nagle delays, and a delayed `?` reads as a dead relay.
        if (this.spec.channel !== undefined) this.socket.setNoDelay(true);
        await crossCommandPlane(this);
    }

    _send(text) { this.pacer.send(text); }

    async close() {
        if (this.closed) return;
        this.closed = true;
        this.socket.destroy();
    }
}

/** Build the right link for a spec. */
export function createLink(spec) {
    switch (spec.transport) {
        case "serial":
        case "radio":                       // a relay micro:bit on USB
            return new SerialLink(spec);
        case "wifi":
        case "tcp":
        case "netradio":                    // a relay reached over the network
            return new TcpLink(spec);
        default:
            throw new Error(`unknown transport ${spec.transport}`);
    }
}
