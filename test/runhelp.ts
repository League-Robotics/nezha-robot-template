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
