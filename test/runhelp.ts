// runhelp.ts — helpers shared by every RUN verb in this image.
//
// These lived in calibratel.ts, which was deleted when the image was cut down
// to two calibrations (calj and calc). They are not calibration code: they are
// argument parsing and number formatting that any verb needs, so they get a
// file of their own rather than riding along inside whichever calibration
// happened to be written first.
//
// PXT COMPILES EVERY FILE INTO ONE SCOPE. There are no imports and no modules
// here: a name defined in any file is visible in all of them, and two files
// declaring the same `const` is a compile error, not a shadow. That is the
// whole reason a shared helper needs a deliberate home instead of being copied.

// Round to `places` decimals for emitLine. Printing a raw float sends a dozen
// digits of noise down a link that drops lines when it is busy.
function lineRound(x: number, places: number): number {
    const f = Math.pow(10, places)
    return Math.round(x * f) / f
}

// Argument `i` of the current RUN, or `fallback` when it is missing or not a
// number. Every verb takes its parameters this way, so `RUN calwheels` and
// `RUN calwheels 75.8` are both valid and the signature registered alongside the
// verb is what tells a caller which is which.
function runNumber(i: number, fallback: number): number {
    const text = diffDrive.runArgText(i)
    if (text.length == 0) return fallback
    const v = parseFloat(text)
    return isNaN(v) ? fallback : v
}

// ---- CANCELLING A RUNNING PROGRAM ----------------------------------------
//
// ANY BUTTON STOPS THE ROBOT: A, B, or both together, whether the program was
// started from the button menu or over the wire. A student who sees the robot
// heading for the edge of the table should not have to remember which button,
// and "the one that starts it also stops it" is the only rule worth teaching.
//
// WHY A FLAG AND NOT JUST diffDrive.stop() IN THE HANDLER. stop() does end the
// motion -- move() is startMove() plus `while (_tickDrive())`, so ending the
// move makes tickDrive() return false and the blocking call returns -- but the
// PROGRAM would carry on to its next move and drive away again. Worse, a
// calibration whose loop exited early would go on to compute a measurement from
// a course it never finished and report it as a result. The flag is what lets
// each program distinguish "the move ended" from "a person stopped me".
//
// WHY THE MENU RUNS PROGRAMS ON A BACKGROUND FIBER (boot.ts). While a program
// ran INSIDE the B handler, a second B press could not be delivered: the
// handler was busy, so the event queued and fired after the program finished --
// which would have started it again rather than stopping it. The handler now
// only sets a request and returns, so it is always free to cancel. A and A+B
// were never affected, being different events, but all three go the same way
// for one behaviour.
let PROG_BUSY = false
let PROG_CANCEL = false

function programBegin() {
    PROG_BUSY = true
    PROG_CANCEL = false
}

function programEnd() {
    PROG_BUSY = false
    PROG_CANCEL = false
}

function programRunning(): boolean {
    return PROG_BUSY
}

// Stop the wheels NOW, from the button handler's own fiber, and leave a flag
// the program will see on its next tick. The immediate stop is the half that
// matters to a robot about to hit something; the flag is the half that stops it
// being given a second instruction a tick later.
function programCancel() {
    if (!PROG_BUSY) return
    PROG_CANCEL = true
    diffDrive.stop()
}

// Every drive loop tests this. A program that ignores it keeps driving after a
// student has pressed a button, which is the one behaviour this file exists to
// prevent.
function progCancelled(): boolean {
    return PROG_CANCEL
}

// One leg of a shape, abandoned if a button was pressed. Returns false when the
// program should stop, so a caller reads as `if (!legMove(...)) return`.
//
// Checked BEFORE the move as well as after: cancelling during leg two must not
// let leg three start, and diffDrive.stop() from the handler only ends the move
// that was already running.
function legMove(distance: number, yaw: number): boolean {
    if (progCancelled()) return false
    diffDrive.move(distance, yaw)
    return !progCancelled()
}

// What a cancelled program shows and says. One place, so every program reports
// a stop the same way and a console can match one event for all of them.
function programStopped(what: string) {
    diffDrive.stop()
    epPush(epStr(epObj(what + ".fail"), "why", "stopped by a button press") + "}")
    epFlush()
    basic.showIcon(IconNames.No)
}
