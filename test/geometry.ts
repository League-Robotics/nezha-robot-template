// geometry.ts — remember the geometry this robot actually boots with.
//
// WHY THIS EXISTS. Nothing in the TS API can read the drivetrain geometry back
// out of the engine: there is `setTrackWidth()` but no `trackWidth()`, and over
// the wire `GET trackwidth` and `GET travel_calib` both answer `err 1` (only
// `rotational_slip` is a real config field). So a calibration that OVERWRITES
// the geometry to measure against a known anchor -- which is exactly what calc
// does -- had no way to put it back, and left every robot it touched running on
// the anchor until someone reflashed it.
//
// That was not a theoretical hazard. It cost a full bad tour run on tovez
// 2026-09-18: calc had left trackWidth at the 11.42 anchor, `SET
// rotational_slip` restored only half the pair because the other half is not
// settable over the wire, and the robot drove the tour on b = 11.42/0.998
// instead of 11.16 -- 2.5% of over-rotation on every pivot, reported as if it
// were a calibration result.
//
// The fix is to keep our own copy. boot.ts applies geometry through
// applyGeometry(), which records what it set; calc restores from that record
// when it finishes, on the success path AND on every failure path.
//
// THE RECORD IS ALSO THE ROBOT'S OWN TRACK WIDTH, and that turns out to matter
// more than the restore. A spin measures only the effective track b; turning
// that into a rotational_slip needs the robot's REAL caliper track width, and
// until now the only place that existed was radio-robot-lib's config JSON --
// so any consumer had to cross a repo boundary and trust a stored record that
// nothing re-checks. bootTrackWidth() hands back the width the robot is
// actually running on, from the robot itself, so calc can report it and a
// consumer can do the division without consulting a file.
//
// The initial values are the extension's compiled defaults, which is the right
// answer for a board with no per-robot block in boot.ts: that board really is
// running them.
let GEOM_TRACK = 11.42       // cm
let GEOM_SLIP = 0.952

// Set the drivetrain geometry AND remember it. Every per-robot block in
// boot.ts goes through here; calling setTrackWidth()/setConfigValue() directly
// would drive correctly but leave the record lying, which is worse than no
// record at all.
function applyGeometry(trackCm: number, slip: number) {
    GEOM_TRACK = trackCm
    GEOM_SLIP = slip
    diffDrive.setTrackWidth(trackCm)
    diffDrive.setConfigValue(ConfigField.RotationalSlip, slip)
}

// Put back what boot applied. Safe to call even if nothing ever overwrote the
// geometry -- it just re-applies the same numbers.
function restoreGeometry() {
    diffDrive.setTrackWidth(GEOM_TRACK)
    diffDrive.setConfigValue(ConfigField.RotationalSlip, GEOM_SLIP)
}

// The track width this robot boots with, in cm. This is the number to divide
// by a measured b to get a rotational_slip.
function bootTrackWidth(): number {
    return GEOM_TRACK
}

function bootSlip(): number {
    return GEOM_SLIP
}
