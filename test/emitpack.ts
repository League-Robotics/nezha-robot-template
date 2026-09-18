// emitpack.ts — pack several report lines into one wire frame.
//
// WHY THIS EXISTS. A calibration's end-of-run report was losing its tail: calc
// emitted eight lines back to back and only the first seven ever arrived, with
// no error anywhere. MEASURED tovez 2026-09-18 over four builds.
//
// The cause is not line length and not the ring size. Protocol::writeWifi()
// (comms/protocol.cpp) normally waits for room in the 8-slot outbound ring, but
// it waits ONLY when no motion obligation is live:
//
//     if (!link.telemetryMarked() && !p.wireAdapter_.hasLiveMotionObligation())
//         waitForTxRoom(link, WifiLink::kTxSlots, ...);
//     (void)link.sendLine(data, length);
//
// and its own comment says why: "nothing waits while a wire motion obligation
// is live: this fiber is also what ticks that motion, and a stalled tick trips
// the starvation watchdog." A RUN verb IS a live motion obligation, so every
// line a calibration emits is best-effort, and WifiLink::sendLine() drops the
// NEWEST line when the ring is full (wifi_link.cpp: `++dropCount_; return
// false;  // drop NEWEST -- stale data is not worth a stall`).
//
// That is a deliberate trade and it is the right one: a modem must never stall
// the control loop. Pausing does not help -- there is no backpressure to wait
// on. The fix available from up here is to need FEWER SLOTS, by filling each
// one instead of sending a 60-byte line in a 240-byte frame.
//
// HOW. Accumulate lines, joined by "\n", and flush when the next one would not
// fit. The transports append their own trailing newline and copy the payload
// verbatim, so an embedded "\n" arrives as a line break at the client exactly
// as a separate emitLine() would have -- every reader already splits the stream
// on newlines. One frame, several logical lines, no protocol change.
//
// THE CAP IS 240 AND IT IS SILENT. Protocol::emitLine() clips at
// RadioTransport::kMaxPayloadBytes (240) with no error and no return value, so
// a frame that overruns loses its tail invisibly -- the same class of bug this
// file exists to fix. EP_MAX leaves margin under it.
const EP_MAX = 200

let epBuf = ""

// Queue one line. Never lets a frame exceed EP_MAX: if the line does not fit,
// the buffer goes out first and the line starts the next frame.
function epPush(line: string) {
    if (line.length == 0) return
    if (epBuf.length == 0) {
        epBuf = line
        return
    }
    if (epBuf.length + 1 + line.length > EP_MAX) {
        epFlush()
        epBuf = line
        return
    }
    epBuf = epBuf + "\n" + line
}

// Send whatever is buffered. ALWAYS call this at the end of a report -- a
// report that forgets to flush loses its last frame, which is the exact
// failure this file is meant to prevent.
function epFlush() {
    if (epBuf.length > 0) {
        diffDrive.emitLine(epBuf)
        epBuf = ""
    }
}

// ---- JSON helpers --------------------------------------------------------
// PXT's static TypeScript has no JSON.stringify worth relying on, and the
// objects here are flat and known, so they are built as strings. Keys are
// short because every byte competes for a slot; the meanings are documented
// where each report is built.

// Open a JSON object with its event name: {"ev":"name"
function epObj(name: string): string {
    return "{\"ev\":\"" + name + "\""
}

// Append a numeric field, rounded. Numbers go out bare (no quotes) so a
// consumer gets numbers, not strings, with no coercion on the far side.
function epNum(obj: string, key: string, value: number, places: number): string {
    return obj + ",\"" + key + "\":" + lineRound(value, places)
}

// Append a string field, quoted. Values here are short tokens the robot
// generates itself (bar patterns, reasons) -- there is no escaping, so never
// pass anything containing a quote, a backslash or a newline.
function epStr(obj: string, key: string, value: string): string {
    return obj + ",\"" + key + "\":\"" + value + "\""
}
