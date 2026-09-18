// linetrack.ts — read the PlanetX Trackbit line sensor.
//
// Sensor: four reflectance channels on I2C 0x1A, channel 0 on the robot's
// LEFT. Write register 4, read one byte: bit i set when channel i sees the
// line. One transaction gets all four channels.
//
// Both surviving calibrations read this sensor and nothing else: calj straddles
// a stripe edge with it, calc times sector crossings with it. The line-follow
// program and its `line`/`abort`/`sense` RUN verbs were cut from the
// calibration image on 2026-09-13, which carries only what calibration needs
// (see boot.ts).

// WHERE THE FOUR CHANNELS SIT, in cm from the robot's centre line, LEFT
// POSITIVE, channel 0 first. This is sensor-bar geometry, so it lives with the
// sensor -- it was previously CALL_LATERAL in calibratel.ts, which was a
// calibration file that happened to define it first, and it outlived that file.
//
// The inner pair at +-0.6 and the outer at +-3.0 leave a 2.4 cm gap on each
// side, which is wider than the 1.68 cm stripe: a stripe can therefore sit
// entirely between two channels and read `....`, indistinguishable from seeing
// nothing at all. calj calls that the blind gap and counts it.
const BAR_LATERAL = [3.0, 0.6, -0.6, -3.0]

namespace linetrack {
    export function lineBits(): number {
        pins.i2cWriteNumber(0x1a, 4, NumberFormat.Int8LE)
        return pins.i2cReadNumber(0x1a, NumberFormat.UInt8LE, false) & 0x0f
    }

    // Raw reflectance for ONE channel, 0-255. Writing the CHANNEL NUMBER rather
    // than register 4 makes the Trackbit answer a gray value instead of the four
    // thresholded bits (vendor/pxt-planetx basic.ts, TrackbitgetGray).
    //
    // This exists because lineBits() CANNOT distinguish "this channel is over
    // tape" from "this channel's threshold is wrong": both are a set bit.
    // MEASURED vevov 2026-09-16: channels 2 and 3 read dark on bare white paper
    // 8 cm clear of any tape, four samples out of five, and with only lineBits()
    // there was no way to tell a failing sensor from a mis-thresholded one. An
    // attempt to settle it from overhead-camera pixels produced two wrong
    // answers before this was added.
    export function grayOf(channel: number): number {
        pins.i2cWriteNumber(0x1a, channel, NumberFormat.Int8LE)
        return pins.i2cReadNumber(0x1a, NumberFormat.UInt8LE, false)
    }

    // The sensor's LEARNED per-channel references. Register 5 returns eight
    // bytes: the four "line" references first, then the four "background"
    // references (vendor/pxt-planetx basic.ts, Trackbit_Init_Sensor_Val, whose
    // TrackBit_gray enum is line=0, background=4).
    //
    // These are what lineBits() actually compares each channel against, and
    // they are PER CHANNEL -- there is no single global threshold. That is the
    // only way to make sense of vevov 2026-09-16, where all four channels read
    // gray 98-139 on one stationary patch of white paper, yet channel 2 was
    // flagged dark at 131 while channel 1 at 125 was not. A gray value cannot
    // be judged without the reference it is being measured against.
    export function refOf(channel: number, background: boolean): number {
        pins.i2cWriteNumber(0x1a, 5, NumberFormat.Int8LE)
        const buf = pins.i2cReadBuffer(0x1a, 8)
        return buf[channel + (background ? 4 : 0)]
    }
}
