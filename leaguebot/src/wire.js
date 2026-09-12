// wire.js -- the v6 line protocol: codec, banner, and the sequencing session.
//
// Ported from robot-console's @robot-console/protocol (packages/protocol/src/
// v6/codec.ts, session.ts, banner.ts), trimmed to what this CLI needs. Pure
// logic, zero I/O: everything here is a string in, a string out, so it can be
// reasoned about without a robot attached.

/** Longest legal line INCLUDING the '\n'. Sized to sit inside a radio MTU so
 *  a message never fragments. */
export const MAX_LINE_BYTES = 240;

const VERB_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;
// Bare unsigned digits only. `#+5`, `#-5` and `# 5` are NOT ids -- and not
// errors either, they stay as ordinary fields.
const ID_TOKEN_PATTERN = /^#[0-9]+$/;

export class CodecError extends Error {}

// CASE IS DIRECTION. UPPERCASE is host->robot, lowercase is robot->host, and a
// lowercase verb that is not in this set is FOREIGN -- another robot's traffic
// overheard on a shared radio channel. Foreign lines are dropped silently;
// treating them as errors makes a busy classroom look like a broken robot.
export const REPLY_VERBS = new Set([
    "ack", "nack", "err", "ret", "pong", "estop", "id", "ver", "status",
    "help", "debug", "device", "funcs", "wificred", "thdr", "t",
]);

// Verbs that carry a `#<id>` and must be acked. Everything else (HELLO, PING,
// STATUS, ID, VER, HELP, ESTOP) is unsequenced: it answers but does NOT
// advance the robot's expected id, so sending `STATUS` between two RUNs does
// not renumber them.
export const SEQUENCED_VERBS = new Set([
    "GET", "SET", "TLM", "STOP", "RUN", "WHEELS_X", "WHEELS_V",
    "MOVE_X", "MOVE_V", "GO_TO_R", "GO_TO_W", "FUNCS", "WIFICRED",
]);

export function isSequencedVerb(verb) {
    return SEQUENCED_VERBS.has(String(verb).toUpperCase());
}

// Re-render a number in plain base 10. The wire grammar has no exponent form,
// and a naive toFixed() silently rounds 1e-8 to "0" -- so expand by hand.
function renderNumber(value) {
    if (!Number.isFinite(value)) throw new CodecError(`cannot encode ${value}`);
    const plain = String(value);
    if (!/e/i.test(plain)) return plain;
    // Enough decimals to carry any double that needed an exponent at all.
    return value.toFixed(20).replace(/0+$/, "").replace(/\.$/, "");
}

function renderField(field) {
    const text = typeof field === "number" ? renderNumber(field) : String(field);
    if (text.length === 0) throw new CodecError("a field may not be empty");
    if (/[ \n]/.test(text)) throw new CodecError(`field ${JSON.stringify(text)} contains a separator`);
    return text;
}

/** Build one wire line, newline included. Throws CodecError on bad input --
 *  encoding is the host's own doing, so a failure here is a programming bug. */
export function encodeLine(verb, fields = [], id) {
    if (!VERB_PATTERN.test(verb)) throw new CodecError(`bad verb ${JSON.stringify(verb)}`);
    const parts = [verb, ...fields.map(renderField)];
    if (id !== undefined) {
        if (!Number.isInteger(id) || id < 0) throw new CodecError(`bad id ${id}`);
        parts.push(`#${id}`);
    }
    const line = `${parts.join(" ")}\n`;
    if (Buffer.byteLength(line, "utf8") > MAX_LINE_BYTES) {
        throw new CodecError(`line exceeds ${MAX_LINE_BYTES} bytes: ${parts.join(" ")}`);
    }
    return line;
}

/** Parse one received line. NEVER throws -- inbound bytes are not under our
 *  control, so every malformed shape is a return value, not an exception. */
export function decodeLine(raw) {
    const text = raw.replace(/\n$/, "").trim();
    if (text.length === 0) return { kind: "blank" };
    if (Buffer.byteLength(raw, "utf8") > MAX_LINE_BYTES) return { kind: "tooLong", raw };
    const tokens = text.split(/ +/);
    const verb = tokens[0];
    if (!VERB_PATTERN.test(verb)) return { kind: "foreign", raw };
    let id;
    const last = tokens[tokens.length - 1];
    if (tokens.length > 1 && ID_TOKEN_PATTERN.test(last)) {
        id = Number.parseInt(last.slice(1), 10);
        tokens.pop();
    }
    return { kind: "line", verb, fields: tokens.slice(1), id, raw };
}

/** "command" (uppercase), "reply" (a known lowercase verb), or "foreign". */
export function classifyLine(verb) {
    if (verb === verb.toUpperCase()) return "command";
    return REPLY_VERBS.has(verb) ? "reply" : "foreign";
}

// ---- the boot banner ------------------------------------------------------
//
// HELLO's reply is NOT a v6 line -- it predates the case rule and is exempt
// from it. Two dialects are live on the bench at once and both must parse:
//
//   DEVICE:RADIOBRIDGE:relay:getez:1779042496     (C++ relay firmware)
//   device NEZHA2 robot vevov 1198504156          (robot firmware)
const BANNER_COLON = /^DEVICE:([^:\s]+):([^:\s]+):([^:\s]+):([^:\s]+)$/;
const BANNER_SPACE = /^device (\S+) (\S+) (\S+) (\S+)$/;

// The serial's radix is keyed by ROLE, never inferred from the digits: a
// decimal serial that happens to contain only 0-9 and a-f is indistinguishable
// from a hex one, and guessing renames the board.
const SERIAL_RADIX_BY_ROLE = { RADIOBRIDGE: 10, RADIORELAY: 16, NEZHA2: 10 };
const DEFAULT_SERIAL_RADIX = 10;

/** -> { role, commonName, name, serial } or null if the line is not a banner. */
export function parseBanner(line) {
    const text = line.replace(/\n$/, "").trim();
    const m = BANNER_COLON.exec(text) ?? BANNER_SPACE.exec(text);
    if (!m) return null;
    const [, role, commonName, name, serialText] = m;
    const radix = SERIAL_RADIX_BY_ROLE[role] ?? DEFAULT_SERIAL_RADIX;
    const serial = Number.parseInt(serialText, radix);
    return { role, commonName, name, serial: Number.isNaN(serial) ? undefined : serial };
}

/** "relay" | "robot" | "unknown", from a parsed banner. */
export function bannerDeviceType(banner) {
    if (!banner) return "unknown";
    if (banner.role === "RADIOBRIDGE" || banner.role === "RADIORELAY") return "relay";
    if (banner.commonName === "robot" || banner.role === "NEZHA2") return "robot";
    return "unknown";
}

// ---- the sequencing session ----------------------------------------------
//
// Give up on an id after this many identical resends and resync past it,
// rather than wedging the stream forever on one line the robot will not take.
export const MAX_RESENDS = 3;

function parseAckNackFields(fields) {
    const n = Number.parseInt(fields[0] ?? "", 10);
    const lastDone = Number.parseInt(fields[1] ?? "", 10);
    return {
        n: Number.isNaN(n) ? 0 : n,
        lastDone: Number.isNaN(lastDone) ? 0 : lastDone,
        reason: fields[2] ?? "none",
    };
}

/**
 * Tracks ids and retransmits. Pure: it formats lines and decides what to
 * resend, but never touches a port.
 *
 * THE ARITHMETIC THAT BITES: `nack N` carries NEXT-EXPECTED, not last-good.
 * Reading it as last-good puts the host permanently one id ahead and every
 * subsequent line re-nacks.
 */
export class Session {
    constructor() {
        this.nextId = 1;
        this.seq = 1;
        this.pending = new Map();   // id -> the ORIGINAL bytes
        this.lastDone = 0;
        this.lastDoneReason = "none";
        this.lastResendN = 0;
        this.resendStreak = 0;
    }

    /** HELLO. The ONLY place it is ever formatted -- it is a session RESET,
     *  not a health check, so it may not be used to probe a quiet robot (that
     *  is a probe which manufactures the wedge it was checking for). Use
     *  checkLiveness() instead. */
    connect() {
        this.nextId = 1;
        this.seq = 1;
        this.pending.clear();
        return encodeLine("HELLO");
    }

    checkLiveness() { return encodeLine("PING"); }

    /** Assign the next id, buffer the bytes under it, and return the line. */
    send(verb, fields = []) {
        const id = this.nextId++;
        const line = encodeLine(verb, fields, id);
        this.pending.set(id, line);
        return line;
    }

    sendUnsequenced(verb, fields = []) {
        if (verb.toUpperCase() === "HELLO") {
            throw new CodecError("HELLO is a session reset; use connect()");
        }
        if (isSequencedVerb(verb)) {
            throw new CodecError(`${verb} is sequenced; use send()`);
        }
        return encodeLine(verb, fields);
    }

    /** Feed every decoded inbound line here. Returns an ack/nack event (with
     *  any lines to resend) or null for anything else. */
    observe(decoded) {
        if (decoded.kind !== "line") return null;
        if (decoded.verb === "ack") return this.#handleAck(decoded.fields);
        if (decoded.verb === "nack") return this.#handleNack(decoded.fields);
        return null;
    }

    #retireThrough(n) {
        for (const id of [...this.pending.keys()]) {
            if (id <= n) this.pending.delete(id);
        }
    }

    #pendingIds() { return [...this.pending.keys()].sort((a, b) => a - b); }

    #handleAck(fields) {
        const { n, lastDone, reason } = parseAckNackFields(fields);
        this.seq = n;
        this.lastDone = lastDone;
        this.lastDoneReason = reason;
        this.#retireThrough(n);
        this.lastResendN = 0;
        this.resendStreak = 0;
        return { kind: "ack", n, lastDone, reason, resend: [] };
    }

    #handleNack(fields) {
        const { n, lastDone, reason } = parseAckNackFields(fields);
        this.seq = n - 1;                       // NOT n -- see the class note
        this.lastDone = lastDone;
        this.lastDoneReason = reason;
        this.#retireThrough(this.seq);

        const remaining = this.#pendingIds();
        if (remaining.length > 0 && remaining[0] > n) {
            // The robot is asking for an id we never buffered: adopt its
            // numbering and send nothing.
            this.resyncTo(n);
            return { kind: "nack", n, lastDone, reason, resend: [], desynced: true };
        }
        if (remaining.length > 0 && remaining[0] === n) {
            if (this.lastResendN === n) this.resendStreak += 1;
            else { this.lastResendN = n; this.resendStreak = 1; }
            if (this.resendStreak > MAX_RESENDS) {
                const dropped = this.pending.get(n) ?? "";
                this.resyncTo(n);
                return { kind: "nack", n, lastDone, reason, resend: [], gaveUp: dropped };
            }
        }
        // Retransmit the ORIGINAL bytes from n forward. A fresh id would read
        // as a numeric gap and stall the stream, so ids are never reassigned.
        const resend = this.#pendingIds().filter((id) => id >= n).map((id) => this.pending.get(id));
        return { kind: "nack", n, lastDone, reason, resend };
    }

    /** Adopt the robot's next-expected id. Sends nothing. */
    resyncTo(n) {
        this.pending.clear();
        this.nextId = n;
        this.seq = n - 1;
        this.lastResendN = 0;
        this.resendStreak = 0;
    }
}
