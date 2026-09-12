// Tests for the parts that can be wrong without a robot noticing: the codec,
// the sequence arithmetic, and the calibration maths.
//
// Every sample line here is the literal text the firmware emits -- copied from
// test/calibratex.ts and test/calibratea.ts in the parent project, not
// invented. A parser tested against made-up input proves nothing.
//
//   node --test leaguebot/test/

import assert from "node:assert/strict";
import test from "node:test";

import {
    BASELINE_DIAMETER_MM, calibrationSnippet, correctTrackWidth, deriveCalibration,
    deriveReportedTrackWidthCm, deriveWheelDiameterMm,
} from "../src/calibration.js";
import { BaseLink, LineReassembler } from "../src/links.js";
import { parseSignature, positionalArgs } from "../src/term.js";
import { classifyLine, decodeLine, encodeLine, parseBanner, Session } from "../src/wire.js";

// ---- codec ----------------------------------------------------------------

test("encodes and decodes a sequenced command", () => {
    const line = encodeLine("RUN", ["calx"], 7);
    assert.equal(line, "RUN calx #7\n");
    const decoded = decodeLine(line);
    assert.equal(decoded.kind, "line");
    assert.equal(decoded.verb, "RUN");
    assert.deepEqual(decoded.fields, ["calx"]);
    assert.equal(decoded.id, 7);
});

test("only bare digits after # are an id", () => {
    // `#+5` and `#-5` are ordinary fields, not malformed ids -- treating them
    // as errors would drop lines the robot considers perfectly legal.
    assert.equal(decodeLine("ret #+5\n").id, undefined);
    assert.deepEqual(decodeLine("ret #+5\n").fields, ["#+5"]);
    assert.equal(decodeLine("ret 3 #5\n").id, 5);
});

test("rejects a line longer than the radio frame", () => {
    assert.throws(() => encodeLine("RUN", ["x".repeat(250)], 1), /exceeds 240/);
});

test("case is direction", () => {
    assert.equal(classifyLine("RUN"), "command");
    assert.equal(classifyLine("ack"), "reply");
    // Another robot's traffic overheard on a shared channel: not an error.
    assert.equal(classifyLine("wibble"), "foreign");
});

// ---- banner ---------------------------------------------------------------

test("parses both live banner dialects", () => {
    const relay = parseBanner("DEVICE:RADIOBRIDGE:relay:getez:1779042496");
    assert.deepEqual(relay, { role: "RADIOBRIDGE", commonName: "relay", name: "getez", serial: 1779042496 });

    const robot = parseBanner("device NEZHA2 robot vevov 1198504156");
    assert.deepEqual(robot, { role: "NEZHA2", commonName: "robot", name: "vevov", serial: 1198504156 });

    assert.equal(parseBanner("boot tests ready"), null);
});

test("serial radix comes from the role, never from the digits", () => {
    // "1779042496" is legal hex AND legal decimal. Only the role settles it,
    // and guessing renames the board.
    assert.equal(parseBanner("DEVICE:RADIORELAY:relay:getez:100").serial, 256);
    assert.equal(parseBanner("DEVICE:RADIOBRIDGE:relay:getez:100").serial, 100);
});

// ---- the sequencing session ----------------------------------------------

test("nack carries next-expected, not last-good", () => {
    const session = new Session();
    session.connect();
    const first = session.send("RUN", ["square"]);   // #1
    session.send("RUN", ["circle"]);                 // #2

    // The robot says "I am waiting for 1", i.e. it never took either.
    const event = session.observe(decodeLine("nack 1 0 none\n"));
    assert.equal(event.kind, "nack");
    assert.equal(session.seq, 0, "seq must be n-1, not n");
    // Resent bytes are the ORIGINAL line: a fresh id would read as a gap.
    assert.equal(event.resend[0], first);
    assert.equal(event.resend.length, 2);
});

test("ack retires everything through its id", () => {
    const session = new Session();
    session.connect();
    session.send("RUN", ["a"]);
    session.send("RUN", ["b"]);
    session.observe(decodeLine("ack 2 2 none\n"));
    assert.equal(session.pending.size, 0);
});

test("gives up on a line the robot keeps refusing", () => {
    const session = new Session();
    session.connect();
    session.send("RUN", ["stuck"]);

    // Three resends, then stop: resending forever would wedge every later
    // line behind this one for as long as the robot keeps refusing it.
    const events = [];
    for (let i = 0; i < 5; i += 1) events.push(session.observe(decodeLine("nack 1 0 none\n")));

    assert.deepEqual(events.map((e) => e.resend.length), [1, 1, 1, 0, 0]);
    assert.deepEqual(events.map((e) => Boolean(e.gaveUp)), [false, false, false, true, false]);
    assert.equal(session.pending.size, 0, "the dropped line is not still buffered");
});

test("HELLO is a reset, and may not be sent as a health check", () => {
    const session = new Session();
    session.nextId = 9;
    assert.equal(session.connect(), "HELLO\n");
    assert.equal(session.nextId, 1, "HELLO renumbers from 1");
    assert.throws(() => session.sendUnsequenced("HELLO"), /session reset/);
    assert.throws(() => session.sendUnsequenced("RUN"), /sequenced/);
});

// ---- line framing ---------------------------------------------------------

test("reassembles lines across chunk boundaries", () => {
    const r = new LineReassembler();
    assert.deepEqual(r.push(Buffer.from("CALX:dia")), []);
    assert.deepEqual(r.push(Buffer.from("meter=89.09 mm\nCALX:")), ["CALX:diameter=89.09 mm"]);
    assert.deepEqual(r.push(Buffer.from("apply x\r\n")), ["CALX:apply x"]);
});

test("strips the relay echo prefix", () => {
    const r = new LineReassembler();
    assert.deepEqual(r.push(Buffer.from("< ack 1 0 none\n")), ["ack 1 0 none"]);
});

// ---- identify over a broadcast --------------------------------------------
//
// A relay carries HELLO to EVERY robot on channel 55 / group 114, so the
// banners come back as a burst. These pin the two ways that burst gets
// misread: keeping only its first line, and reporting only its last.

/** A relay link whose air answers each HELLO with `crowd`, in order. */
function fakeRelay(crowd) {
    const link = new BaseLink({ transport: "radio", channel: 55, group: 114 });
    link.inCommandPlane = false;
    link._send = () => {
        // The answers race back a few ms apart -- not in the same tick, which
        // is exactly what lets a first-line-wins reader miss the later ones.
        crowd.forEach((name, i) => {
            setTimeout(() => link._ingest(Buffer.from(`device NEZHA2 robot ${name} 1\n`)), i + 1);
        });
    };
    return link;
}

test("picks the robot it asked for out of the crowd that answered", async () => {
    // vevov answers every time, but never first. Before this, six attempts in
    // a row reported 'tigez' and the probe called vevov unreachable.
    const link = fakeRelay(["tigez", "vevov", "gopiv"]);
    const banner = await link.identify({ expect: "vevov" });
    assert.equal(banner.name, "vevov");
});

test("a robot that is genuinely absent still comes back as the others", async () => {
    const link = fakeRelay(["tigez", "gopiv"]);
    const banner = await link.identify({ expect: "vevov", attempts: 1 });
    assert.notEqual(banner, null);
    assert.notEqual(banner.name, "vevov");
    // Every name heard is kept, so the probe can say who DID answer.
    assert.deepEqual([...link.heardNames].sort(), ["gopiv", "tigez"]);
});

test("with no name to expect, the first banner still wins", async () => {
    // probe's USB pass has no expectation and must not pay the burst window.
    const link = fakeRelay(["tigez", "vevov"]);
    const banner = await link.identify({ attempts: 1 });
    assert.equal(banner.name, "tigez");
});

// ---- calibration parsing --------------------------------------------------

const CALX_LINES = [
    "CALX:begin true=90cm baseline=0.7878mm/deg",
    "CALX:start line found",
    "CALX:measured=91.2cm true=90cm error=1.2cm",
    "CALX:calib=0.7774 mm/deg  (was 0.7878)",
    "CALX:diameter=89.09 mm",
    "CALX:apply diffDrive.setWheelCalibration(0.7774)",
];

const CALA_LINES = [
    "CALA:begin track=11.5cm slip=0.952 b=12.08cm",
    "CALA:pass clockwise",
    "CALA:centring scatter=4.2deg",
    "CALA:slope cw=0.9702 ccw=0.9698 gap=0.1deg/turn",
    "CALA:measured b=11.72cm  (anchor was 12.08)",
    "CALA:derived slip=0.981 = track 11.5 / b 11.72",
    "CALA:apply diffDrive.setConfigValue(ConfigField.RotationalSlip, 0.981)",
    "CALA:error cw=0.3deg ccw=-0.2deg per turn",
];

test("reads the wheel diameter from a calx report", () => {
    assert.equal(deriveWheelDiameterMm(CALX_LINES), 89.09);
});

test("falls back to calib= when the apply line is dropped", () => {
    // Over WiFi the firmware really does drop lines emitted in a burst, so the
    // diameter= and apply lines can both go missing.
    const partial = CALX_LINES.filter((l) => !/diameter=|apply/.test(l));
    assert.equal(deriveWheelDiameterMm(partial), 89.08);   // 0.7774 * 360 / pi
    assert.equal(deriveWheelDiameterMm(["CALX:begin true=90cm"]), undefined);
});

test("reads the effective track width from a cala report", () => {
    assert.equal(deriveReportedTrackWidthCm(CALA_LINES), 11.72);
});

// ---- calibration maths ----------------------------------------------------

test("a bigger wheel means a wider track than the spin reported", () => {
    // The spin measures the turn in wheel travel. A wheel 10% bigger than the
    // firmware assumed makes every turn 10% larger, so the routine concludes
    // the track is 10% narrower than it is.
    assert.equal(correctTrackWidth(11.72, 90.28, 99.31), 12.89);
    // A wheel exactly as assumed changes nothing.
    assert.equal(correctTrackWidth(11.72, 90.28, 90.28), 11.72);
});

test("a caliper width splits the answer into track width and slip", () => {
    // gopiv, measured 2026-09-07: b = 11.72 cm against a 11.5 cm caliper track.
    const cal = deriveCalibration({
        wheelDiameterMm: BASELINE_DIAMETER_MM,
        reportedTrackWidthCm: 11.72,
        measuredTrackWidthCm: 11.5,
    });
    assert.equal(cal.effectiveTrackWidthCm, 11.72);
    assert.equal(cal.trackWidthCm, 11.5, "the caliper wins; slip carries the difference");
    assert.equal(cal.rotationalSlip, 0.981);
    assert.equal(cal.scrubMm, 2.2, "it turns as though its wheels were 2.2 mm further apart");
});

test("with no caliper figure the effective width IS the track width", () => {
    // A spin measures ONE number, b = trackWidth / slip. With nothing to
    // divide it by, the only honest split is slip = 1 exactly.
    const cal = deriveCalibration({
        wheelDiameterMm: BASELINE_DIAMETER_MM,
        reportedTrackWidthCm: 11.72,
    });
    assert.equal(cal.trackWidthCm, 11.72);
    assert.equal(cal.rotationalSlip, 1);
    assert.equal(cal.scrubMm, undefined);
});

test("the wheel correction reaches the slip", () => {
    // Same spin, but the wheels turn out bigger: the effective width grows and
    // the derived slip must fall with it.
    const cal = deriveCalibration({
        wheelDiameterMm: 95,
        reportedTrackWidthCm: 11.72,
        measuredTrackWidthCm: 11.5,
    });
    assert.equal(cal.effectiveTrackWidthCm, 12.33);
    assert.equal(cal.rotationalSlip, 0.933);
});

test("the snippet is pasteable MakeCode", () => {
    const lines = calibrationSnippet(deriveCalibration({
        wheelDiameterMm: 89.09,
        reportedTrackWidthCm: 11.72,
        measuredTrackWidthCm: 11.5,
    }));
    assert.match(lines[0], /^diffDrive\.setWheelCalibration\(89\.09 \* Math\.PI \/ 360\)/);
    assert.match(lines[1], /^diffDrive\.setTrackWidth\(11\.5\)/);
    assert.match(lines[2], /^diffDrive\.setConfigValue\(ConfigField\.RotationalSlip, [\d.]+\)/);
});

// ---- signatures -----------------------------------------------------------

test("parses the signature shapes the firmware actually writes", () => {
    assert.deepEqual(parseSignature("()"), []);
    assert.deepEqual(parseSignature("(on:number=0)"), [{ name: "on", type: "number", default: "0" }]);
    assert.deepEqual(parseSignature("(side_mm, speed=60)"), [
        { name: "side_mm" }, { name: "speed", default: "60" },
    ]);
    assert.deepEqual(parseSignature("dist speed"), [{ name: "dist" }, { name: "speed" }]);
    // Absent is NOT the same as `()`: nobody said, so do not assume zero args.
    assert.equal(parseSignature(undefined), undefined);
});

test("skipped middle arguments are filled, trailing ones are dropped", () => {
    const params = parseSignature("(a, b=5, c=9)");
    // Position is all the wire carries, so a hole in the middle must be filled.
    assert.deepEqual(positionalArgs(params, ["1", "", "7"]), ["1", "5", "7"]);
    // But trailing blanks are dropped so the firmware's own defaults apply.
    assert.deepEqual(positionalArgs(params, ["1", "", ""]), ["1"]);
    assert.deepEqual(positionalArgs(params, ["", "", ""]), []);
});

test("recovers the track width when the measured line is dropped", () => {
    // These are radio frames with no retransmission, so any single line can
    // vanish -- and losing this one would throw away a three-minute run.
    const noMeasured = CALA_LINES.filter((l) => !/measured b=/.test(l));
    assert.equal(deriveReportedTrackWidthCm(noMeasured), 11.72, "from the derived= line");

    const onlyApply = CALA_LINES.filter((l) => /CALA:begin|CALA:apply/.test(l));
    // 11.5 / 0.981 = 11.722...
    assert.equal(deriveReportedTrackWidthCm(onlyApply), 11.72, "from begin + apply");

    assert.equal(deriveReportedTrackWidthCm(["CALA:pass clockwise"]), undefined);
});
