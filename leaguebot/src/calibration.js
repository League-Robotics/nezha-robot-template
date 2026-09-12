// calibration.js -- read the robot's own calibration reports, and do the one
// piece of arithmetic the robot cannot do for itself.
//
// The MEASURING all happens on the robot (test/calibratex.ts and
// test/calibratea.ts). This file only parses what those print and corrects the
// rotation result for the wheel size, which the robot cannot do because the two
// runs are separate and the spin has no way to know what the drive run found.

import fs from "node:fs";
import path from "node:path";

export const CALIBRATION_FILE = "calibration.json";

/** The wheel calibration `cala` spins with: motion_engine.h's compiled default
 *  of 0.7878 mm/deg, as a diameter (0.7878 * 360 / pi). */
export const BASELINE_DIAMETER_MM = 90.28;

const round = (value, places) => {
    const f = 10 ** places;
    return Math.round(value * f) / f;
};

// ---- parsing the robot's report lines -------------------------------------

/** Wheel diameter in mm from a `calx` run.
 *
 *  Two sources, and the fallback is not paranoia: over WiFi the firmware drops
 *  lines emitted in a burst, so `CALX:apply` genuinely does go missing. The
 *  `calib=` line carries the same answer in mm/deg. */
export function deriveWheelDiameterMm(lines) {
    for (const line of lines) {
        const m = /CALX:diameter=\s*(-?\d+(?:\.\d+)?)/.exec(line);
        if (m) return round(Number(m[1]), 2);
    }
    for (const line of lines) {
        const m = /CALX:calib=\s*(-?\d+(?:\.\d+)?)/.exec(line);
        if (m) return round((Number(m[1]) * 360) / Math.PI, 2);
    }
    for (const line of lines) {
        const m = /setWheelCalibration\(\s*(-?\d+(?:\.\d+)?)\s*\)/.exec(line);
        if (m) return round((Number(m[1]) * 360) / Math.PI, 2);
    }
    return undefined;
}

/**
 * The effective track width b, in cm, as the spin reported it.
 *
 * Three sources, for the same reason the wheel diameter has three: these
 * report lines are fire-and-forget radio frames with no retransmission under
 * them, and they really do go missing. Five consecutive `FUNCS` listings of
 * one robot over the relay came back 6, 13, 8, 17 and 14 lines long, so
 * assuming any single line arrives is not safe -- and losing this one loses
 * the whole run, which on `cala` is three minutes of spinning.
 *
 *   1. `CALA:measured b=11.72cm`
 *   2. `CALA:derived slip=0.981 = track 11.5 / b 11.72`   -- carries b too
 *   3. `CALA:apply ...RotationalSlip, 0.981)` with the anchor track from
 *      `CALA:begin track=11.5cm`, since the firmware's slip is exactly
 *      that anchor divided by b.
 */
export function deriveReportedTrackWidthCm(lines) {
    for (const line of lines) {
        const m = /CALA:measured b=\s*(-?\d+(?:\.\d+)?)\s*cm/.exec(line);
        if (m) return round(Number(m[1]), 2);
    }
    for (const line of lines) {
        const m = /CALA:derived slip=\s*[\d.]+\s*=\s*track\s*[\d.]+\s*\/\s*b\s*(-?\d+(?:\.\d+)?)/.exec(line);
        if (m) return round(Number(m[1]), 2);
    }
    // Last resort: reconstruct b from the slip the firmware applied and the
    // track width it anchored to.
    let anchorTrackCm;
    for (const line of lines) {
        const m = /CALA:begin track=\s*(-?\d+(?:\.\d+)?)\s*cm/.exec(line);
        if (m) { anchorTrackCm = Number(m[1]); break; }
    }
    if (anchorTrackCm !== undefined) {
        for (const line of lines) {
            const m = /RotationalSlip,\s*(-?\d+(?:\.\d+)?)\s*\)/.exec(line);
            if (m && Number(m[1]) > 0) return round(anchorTrackCm / Number(m[1]), 2);
        }
    }
    return undefined;
}

/**
 * Correct a reported track width for the wheel size the spin assumed.
 *
 * The spin measures the turn in WHEEL TRAVEL. If the true wheel is bigger than
 * the one the firmware assumed by a factor k, every commanded turn comes out k
 * times larger, and the routine therefore concludes the track is k times
 * NARROWER than it really is. So the real width is the reported one times k.
 */
export function correctTrackWidth(reportedCm, reportedWithDiameterMm, trueDiameterMm) {
    return round((reportedCm * trueDiameterMm) / reportedWithDiameterMm, 2);
}

/**
 * Work out what to actually set, from the two runs plus an optional caliper.
 *
 * A SPIN MEASURES ONE NUMBER, the effective track width b = trackWidth / slip.
 * Not two. That ratio is the only thing the kinematics contain, so trackWidth
 * 11.42 with slip 0.977 and trackWidth 11.5 with slip 0.984 describe the SAME
 * robot. Slip is therefore never measured, it is DERIVED: you pin the track
 * width with a caliper, the spin measures b, and slip = trackWidth / b falls
 * out. The gap between the two is the wheel-contact scrub -- a robot that
 * turns as though its wheels were 2 mm further apart than they measure is
 * skidding rather than pivoting, and that is what the slip term carries.
 *
 * With no caliper figure there is nothing to divide, so the effective width is
 * used as the track width and slip is exactly 1. That is honest -- it says
 * "this robot turns like a robot this wide" -- and it drives correctly. It just
 * cannot tell you how much of it is scrub.
 *
 * The robot's own `CALA:derived slip=` line is deliberately IGNORED: it divides
 * the 11.5 cm constant hard-coded in test/calibratea.ts, not this robot's
 * measured width, and it has not been corrected for wheel size either.
 */
export function deriveCalibration({ wheelDiameterMm, reportedTrackWidthCm, measuredTrackWidthCm }) {
    const out = {};
    if (wheelDiameterMm !== undefined) out.wheelDiameterMm = wheelDiameterMm;
    if (reportedTrackWidthCm === undefined) return out;

    out.reportedTrackWidthCm = reportedTrackWidthCm;
    out.effectiveTrackWidthCm = wheelDiameterMm === undefined
        ? reportedTrackWidthCm
        : correctTrackWidth(reportedTrackWidthCm, BASELINE_DIAMETER_MM, wheelDiameterMm);

    if (measuredTrackWidthCm !== undefined) {
        out.measuredTrackWidthCm = measuredTrackWidthCm;
        out.trackWidthCm = measuredTrackWidthCm;
        if (out.effectiveTrackWidthCm > 0) {
            out.rotationalSlip = round(measuredTrackWidthCm / out.effectiveTrackWidthCm, 3);
            out.scrubMm = round((out.effectiveTrackWidthCm - measuredTrackWidthCm) * 10, 1);
        }
    } else {
        out.trackWidthCm = out.effectiveTrackWidthCm;
        out.rotationalSlip = 1;
    }
    return out;
}

/** The lines to paste into the robot's program. */
export function calibrationSnippet(cal) {
    const lines = [];
    if (cal.wheelDiameterMm !== undefined) {
        lines.push(`diffDrive.setWheelCalibration(${cal.wheelDiameterMm} * Math.PI / 360)`
            + `  // wheel diameter ${cal.wheelDiameterMm} mm`);
    }
    if (cal.trackWidthCm !== undefined) {
        const how = cal.measuredTrackWidthCm !== undefined ? "caliper" : "effective";
        lines.push(`diffDrive.setTrackWidth(${cal.trackWidthCm})  // ${how} track width, cm`);
    }
    if (cal.rotationalSlip !== undefined) {
        const why = cal.measuredTrackWidthCm !== undefined
            ? `${cal.measuredTrackWidthCm} cm caliper / ${cal.effectiveTrackWidthCm} cm effective`
            : "no caliper figure given, so the effective width IS the track width";
        lines.push(`diffDrive.setConfigValue(ConfigField.RotationalSlip, ${cal.rotationalSlip})  // ${why}`);
    }
    return lines;
}

// ---- the store ------------------------------------------------------------

function storePath(dir = process.cwd()) {
    return path.join(dir, CALIBRATION_FILE);
}

export function loadStore(dir) {
    const file = storePath(dir);
    if (!fs.existsSync(file)) return { robots: {} };
    try {
        const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
        return { robots: parsed.robots ?? {} };
    } catch (error) {
        throw new Error(`${file} is not readable JSON: ${error.message}`);
    }
}

/** Merge one robot's results into the file, leaving every other robot alone. */
export function saveCalibration(name, cal, dir) {
    const file = storePath(dir);
    const store = loadStore(dir);
    store.robots[name] = {
        ...(store.robots[name] ?? {}),
        ...cal,
        measuredAt: new Date().toISOString(),
    };
    fs.writeFileSync(file, `${JSON.stringify(store, null, 2)}\n`);
    return file;
}
