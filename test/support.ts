// support.ts — shared test instrumentation. Nothing in here drives a shape;
// the test programs do that and call in for the measuring.
//
// Wire verbs it adds:
//   RUN:trace:0|1   per-tick sampling off/on (default on)
//   RUN:counters    dump the drive's cumulative fault counters
//
// Sample line:  S t x y h vL vR dutyL dutyR encL encR
// x/y/h are x10, duty is x100.

let tracing = true

function sample() {
    diffDrive.emitLine("S " + control.millis()
        + " " + Math.round(diffDrive.poseX() * 10)
        + " " + Math.round(diffDrive.poseY() * 10)
        + " " + Math.round(diffDrive.heading() * 10)
        + " " + diffDrive.probe(14) + " " + diffDrive.probe(15)
        + " " + diffDrive.probe(12) + " " + diffDrive.probe(13)
        + " " + diffDrive.probe(10) + " " + diffDrive.probe(11))
}

// Cumulative since boot, so bracket a test with two calls and subtract.
// 8 i2c faults, 21/22 latched-read streaks, 23/24 glitch-armor rejections,
// 27 encoder rebaselines -- the counters that expose a wheel whose encoder
// is being read unreliably.
function counters(tag: string) {
    diffDrive.emitLine("C " + tag
        + " i2cf=" + diffDrive.probe(8)
        + " lease=" + diffDrive.probe(9)
        + " sat=" + diffDrive.probe(17)
        + " deficit=" + diffDrive.probe(18)
        + " overrun=" + diffDrive.probe(19)
        + " streakL=" + diffDrive.probe(21)
        + " streakR=" + diffDrive.probe(22)
        + " glitchL=" + diffDrive.probe(23)
        + " glitchR=" + diffDrive.probe(24)
        + " wrongway=" + diffDrive.probe(25)
        + " serialdrop=" + diffDrive.probe(26)
        + " rebase=" + diffDrive.probe(27))
}

diffDrive.onRun("trace", function (arg) {
    tracing = arg != 0
    diffDrive.emitLine("trace=" + (tracing ? 1 : 0))
})
diffDrive.onRun("counters", function (arg) { counters("now") })

// Which brick port each wheel is on and which way round it runs, read
// live out of the ports (extension diag 35-38). boot.ts sets this with
// `configure motor`; this is how you check it took.
diffDrive.onRun("wire", function (arg) {
    diffDrive.emitLine("WIRE leftPort=" + diffDrive.probe(35)
        + " leftSign=" + diffDrive.probe(36)
        + " rightPort=" + diffDrive.probe(37)
        + " rightSign=" + diffDrive.probe(38))
})

// Parameter declarations for the console's function panel (FUNCS lists
// `funcs <name> <signature>`; see diffDrive.runSignature). Keep each
// one matching what its handler actually reads.
diffDrive.runSignature("trace", "(on:number=0)")
diffDrive.runSignature("counters", "()")
diffDrive.runSignature("wire", "()")

// RUN:mdnsrx -- what the mDNS multicast socket has RECEIVED.
//
// 35 counts every datagram the ESP-AT module delivered on the mDNS link; 36
// the subset that parse as DNS queries. The robot answers no mDNS queries
// (it only multicasts unsolicited announcements), and whether it COULD is
// decided entirely by whether the module hands us inbound multicast at all.
//
// Read over the RADIO on purpose. The same numbers appear in DBG:wifi, but
// that line is only emitted on WiFi events -- so when the WiFi link is the
// thing misbehaving, its own diagnostics go with it. That is exactly what
// happened on tigez 2026-09-11: the listener stopped accepting mid-test and
// took the only reading path with it.
//
// rx=0 with the socket open, on a LAN with other responders chattering,
// means no inbound multicast is delivered and a query responder cannot be
// built this way.
diffDrive.onRun("mdnsrx", function (arg) {
    diffDrive.emitLine("MDNS rx=" + diffDrive.probe(35)
        + " queries=" + diffDrive.probe(36))
})
diffDrive.runSignature("mdnsrx", "()")
