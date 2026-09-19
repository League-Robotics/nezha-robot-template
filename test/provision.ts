// provision.ts — the other half of putting a robot on WiFi.
//
// WIFICRED SET writes a credential to flash and nothing else: the credential
// source is latched at the first poll after boot (Protocol::serviceWifi()'s
// lazy-begin), and setupWifi()'s own documentation says "a call made after the
// link has already started is ignored". So a robot whose store was empty at
// boot keeps whatever it began with until someone RESETS it, and the reset is
// the part that costs a person a walk across the room with a robot already
// staged on a playfield -- or, for a robot hosted on a Raspberry Pi, a person
// who cannot reach the board at all.
//
// `RUN reboot` is that reset, over the wire. Set the credential, reboot, and
// the robot comes back with the store non-empty, so serviceWifi()'s lazy-begin
// takes the flash branch (credsrc=2) and joins. No hands.
//
// WHY A REBOOT AND NOT A RE-JOIN: re-beginning the link is not reachable from
// TypeScript. wifiBegun_ is private to the extension and nothing exposes it, so
// the only way back to a fresh credential decision is a fresh boot. A reboot is
// a blunt instrument for the job, but it is an HONEST one -- the robot comes up
// in exactly the state it would have if someone had pressed the button.
//
// WHAT SURVIVES IT: the flash credential store and the stored calibration
// (calstore.ts) -- both are in flash, and that is the whole point of them.
// Nothing in RAM does: the pose, a tuned gain set over the wire, and the menu
// position all go.

// Reboot is a RUN verb, so it inherits the cancel machinery's view of the world
// -- and that matters here. A robot mid-calibration is a robot with its wheels
// turning, and resetting the board while a move is in flight drops the motors
// wherever they are rather than stopping them. Refuse, and say so: a caller
// that meant it can STOP first and ask again.
function runReboot() {
    if (programRunning()) {
        epPush(epStr(epObj("reboot.fail"), "why",
            "a program is running -- press a button or send STOP first") + "}")
        epFlush()
        basic.showIcon(IconNames.No)
        return
    }
    // Say it BEFORE doing it, and flush: control.reset() never returns, so a
    // line still sitting in the pack buffer is a line nobody ever sees. The
    // caller's own transport will notice the silence that follows.
    epPush(epStr(epObj("reboot.ok"), "why", "asked") + "}")
    epFlush()
    // Belt and braces. The guard above refuses a reboot mid-program, so the
    // wheels should already be still -- but "should" is doing work in that
    // sentence, and a stop costs nothing next to a board that resets with a
    // motor driven.
    diffDrive.stop()
    basic.pause(120)
    control.reset()
}

diffDrive.onRun("reboot", function (arg) { runReboot() })
diffDrive.runSignature("reboot", "()")
