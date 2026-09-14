// linetrack.ts — read the PlanetX Trackbit line sensor.
//
// Sensor: four reflectance channels on I2C 0x1A, channel 0 on the robot's
// LEFT. Write register 4, read one byte: bit i set when channel i sees the
// line. One transaction gets all four channels.
//
// calibratex.ts and calibratea.ts both stop on a line, and this read is all
// they need. The line-follow program and its `line`/`abort`/`sense` RUN verbs
// were cut from the calibration image on 2026-09-13, which carries only what
// calibration needs (see boot.ts).
namespace linetrack {
    export function lineBits(): number {
        pins.i2cWriteNumber(0x1a, 4, NumberFormat.Int8LE)
        return pins.i2cReadNumber(0x1a, NumberFormat.UInt8LE, false) & 0x0f
    }
}
