// swd.js -- read a micro:bit's chip id through its DAPLink debug probe.
//
// A micro:bit's five-letter name comes from FICR.DEVICEID[1] on the nRF chip.
// The USB serial belongs to a different chip -- the DAPLink interface MCU --
// so the id has to be read off the target itself. DAPLink exposes CMSIS-DAP as
// a USB HID interface next to the serial port. It is a SEPARATE interface, so
// this works while robot-console or `mbdeploy serve` holds the serial port,
// and on a board with no firmware at all.
//
// This is only what one register read needs, written from the CMSIS-DAP spec
// and the byte sequence robot-console's vendored dapjs uses on this same bench
// (packages/host/src/vendor/dapjs). Pulling in dapjs would bring its flashing
// stack and a UMD bundle along for the sake of five commands.
//
// ATTACH, NEVER HALT OR RESET. Everything below is a debug-port access or a
// memory-AP read. Nothing touches DHCSR or AIRCR and no reset line is driven,
// so a robot mid-run keeps running while its name is read.

import HID from "node-hid";

const DAPLINK_VENDOR_ID = 0x0d28;
const DAPLINK_PRODUCT_ID = 0x0204;

/** FICR.DEVICEID[1]. Same address on nRF51 and nRF52, so V1 and V2 boards. */
export const FICR_DEVICEID1 = 0x10000064;

const PACKET_SIZE = 64;
const REPLY_TIMEOUT_MS = 1000;
const POWER_UP_TIMEOUT_MS = 1000;
const SWJ_CLOCK_HZ = 1_000_000;

// CMSIS-DAP command ids.
const DAP_CONNECT = 0x02;
const DAP_DISCONNECT = 0x03;
const DAP_TRANSFER_CONFIGURE = 0x04;
const DAP_TRANSFER = 0x05;
const DAP_SWJ_CLOCK = 0x11;
const DAP_SWJ_SEQUENCE = 0x12;
const DAP_OK = 0x00;
const PORT_SWD = 1;

// A DAP_Transfer request byte is APnDP | RnW | A[3:2]. A register's offset IS
// its bits 2-3, so 0x0/0x4/0x8/0xC slot straight in.
const DP = 0x00;
const AP = 0x01;
const WRITE = 0x00;
const READ = 0x02;
const ACK_OK = 0x01;

const DP_DPIDR = 0x0;           // read
const DP_ABORT = 0x0;           // write
const DP_CTRL_STAT = 0x4;
const DP_SELECT = 0x8;
const AP_CSW = 0x00;
const AP_TAR = 0x04;
const AP_DRW = 0x0c;

/** STKCMPCLR | STKERRCLR | WDERRCLR | ORUNERRCLR: every sticky error. */
const ABORT_CLEAR_ALL = 0x1e;
const POWER_UP_REQUEST = (1 << 28) | (1 << 30);          // CDBGPWRUPREQ | CSYSPWRUPREQ
const POWER_UP_ACKS = ((1 << 29) | (1 << 31)) >>> 0;     // CDBGPWRUPACK | CSYSPWRUPACK
/** 32-bit access, no address increment, privileged debug master. */
const CSW_32BIT = 0x23000052;

const u16 = (v) => [v & 0xff, (v >>> 8) & 0xff];
const u32 = (v) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];
const hex = (v) => `0x${v.toString(16).padStart(2, "0")}`;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** One DAPLink's CMSIS-DAP interface. */
class Probe {
    constructor(device) { this.device = device; }

    static async open(path) {
        // nonExclusive: robot-console may have the same probe open, and
        // seizing it would break that to read five letters.
        return new Probe(await HID.HIDAsync.open(path, { nonExclusive: true }));
    }

    /** One command out, its reply back. */
    async command(id, payload = []) {
        // Byte 0 is the HID report id. DAPLink uses none, and hidapi's
        // contract on every platform is to send 0 for that.
        const packet = Buffer.alloc(PACKET_SIZE + 1);
        packet[1] = id;
        Buffer.from(payload).copy(packet, 2);
        await this.device.write(packet);
        const reply = await this.device.read(REPLY_TIMEOUT_MS);
        if (reply === undefined || reply.length === 0) throw new Error(`no reply to CMSIS-DAP ${hex(id)}`);
        if (reply[0] !== id) throw new Error(`CMSIS-DAP ${hex(id)} answered as ${hex(reply[0])}`);
        return reply;
    }

    async commandOk(id, payload) {
        const reply = await this.command(id, payload);
        if (reply[1] !== DAP_OK) throw new Error(`CMSIS-DAP ${hex(id)} failed (status ${reply[1]})`);
    }

    /** A batch of DP/AP accesses. Resolves to the values read, in order. */
    async transfer(ops) {
        const payload = [0, ops.length];            // DAP index (unused on SWD), count
        for (const op of ops) {
            payload.push(op.port | op.mode | op.register);
            if (op.mode === WRITE) payload.push(...u32(op.value >>> 0));
        }
        const reply = await this.command(DAP_TRANSFER, payload);
        if (reply[1] !== ops.length || reply[2] !== ACK_OK) {
            throw new Error(`SWD transfer stopped after ${reply[1]} of ${ops.length} (ack ${reply[2]})`);
        }
        const values = [];
        let offset = 3;
        for (const op of ops) {
            if (op.mode !== READ) continue;
            values.push(reply.readUInt32LE(offset));
            offset += 4;
        }
        return values;
    }

    async connect() {
        await this.commandOk(DAP_SWJ_CLOCK, u32(SWJ_CLOCK_HZ));
        const connected = await this.command(DAP_CONNECT, [PORT_SWD]);
        if (connected[1] !== PORT_SWD) throw new Error("probe would not enter SWD mode");
        await this.commandOk(DAP_TRANSFER_CONFIGURE, [0, ...u16(100), ...u16(0)]);

        // Line reset, JTAG-to-SWD switch (0xE79E, LSB first), line reset, idle.
        // This is ARM's wake-up for the debug port -- wire-level only, the core
        // never sees it.
        const ones = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];
        await this.commandOk(DAP_SWJ_SEQUENCE, [56, ...ones]);
        await this.commandOk(DAP_SWJ_SEQUENCE, [16, 0x9e, 0xe7]);
        await this.commandOk(DAP_SWJ_SEQUENCE, [56, ...ones]);
        await this.commandOk(DAP_SWJ_SEQUENCE, [8, 0x00]);

        // DPIDR must be the first read after a line reset.
        await this.transfer([{ port: DP, mode: READ, register: DP_DPIDR }]);
        await this.transfer([
            { port: DP, mode: WRITE, register: DP_ABORT, value: ABORT_CLEAR_ALL },
            { port: DP, mode: WRITE, register: DP_SELECT, value: 0 },
            { port: DP, mode: WRITE, register: DP_CTRL_STAT, value: POWER_UP_REQUEST },
        ]);
        const deadline = Date.now() + POWER_UP_TIMEOUT_MS;
        for (;;) {
            const [status] = await this.transfer([{ port: DP, mode: READ, register: DP_CTRL_STAT }]);
            if (((status & POWER_UP_ACKS) >>> 0) === POWER_UP_ACKS) return;
            if (Date.now() > deadline) throw new Error("debug power-up was never acknowledged");
            await delay(20);
        }
    }

    async readMem32(address) {
        // SELECT is already 0 from connect(): AP 0, the nRF's AHB-AP.
        const [value] = await this.transfer([
            { port: AP, mode: WRITE, register: AP_CSW, value: CSW_32BIT },
            { port: AP, mode: WRITE, register: AP_TAR, value: address },
            { port: AP, mode: READ, register: AP_DRW },
        ]);
        return value;
    }

    async close() {
        try { await this.command(DAP_DISCONNECT); } catch { /* best effort */ }
        await this.device.close();
    }
}

async function readOne(path) {
    const probe = await Probe.open(path);
    try {
        await probe.connect();
        return { deviceId: await probe.readMem32(FICR_DEVICEID1) };
    } finally {
        await probe.close();
    }
}

/**
 * Read FICR.DEVICEID[1] from each board, by USB serial.
 *
 * Resolves Map<serial, {deviceId} | {error}> and never rejects. One board that
 * will not attach -- a locked part, no HID permission (Linux without a udev
 * rule), a probe busy flashing -- must not cost the others their names.
 */
export async function readChipIds(serials) {
    const results = new Map();
    let paths;
    try {
        const devices = await HID.devicesAsync(DAPLINK_VENDOR_ID, DAPLINK_PRODUCT_ID);
        paths = new Map(devices.filter((d) => d.serialNumber && d.path).map((d) => [d.serialNumber, d.path]));
    } catch (error) {
        for (const serial of serials) results.set(serial, { error: error.message });
        return results;
    }
    for (const serial of serials) {
        const path = paths.get(serial);
        if (path === undefined) {
            results.set(serial, { error: "no CMSIS-DAP interface visible" });
            continue;
        }
        results.set(serial, await readOne(path).catch((error) => ({ error: error.message })));
    }
    return results;
}
