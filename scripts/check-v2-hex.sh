#!/usr/bin/env bash
# check-v2-hex.sh -- refuse any hex that is not a micro:bit V2 program.
#
#   bash scripts/check-v2-hex.sh built/binary.hex
#
# The DiffDrive extension runs only on the V2 (nRF52833). build.sh selects
# that variant with PXT_COMPILE_SWITCHES, but a switch that silently fails to
# take effect still leaves a hex that builds, flashes, and says nothing -- so
# the artefact itself is checked, on every build, local and CI alike.
#
# Fails on:
#   - a universal-hex block marker (record type 0A-0D): a multi-variant hex,
#     i.e. a V1 image riding along;
#   - type-0E records that are NOT MakeCode's embedded project source. pxt
#     writes the compressed source as 0E "other data" after EOF so it is never
#     flashed, and it opens with the magic 41140E2FB82FA2BB. MEASURED
#     2026-09-12, release v0.20260912.4: 17,896 such records, all source --
#     which is why "has 0E records" alone does NOT mean universal;
#   - program data outside nRF52833 flash (0x00000000-0x0007FFFF) or UICR
#     (0x10001000-0x10001FFF);
#   - a bad checksum, or no program data at all.
set -euo pipefail
HEX="${1:?usage: check-v2-hex.sh <file.hex>}"
[ -f "$HEX" ] || { echo "check-v2-hex: no such file: $HEX" >&2; exit 1; }

node - "$HEX" <<'JS'
const fs = require("fs");
const path = process.argv[2];
const SOURCE_MAGIC = "41140E2FB82FA2BB";
const fail = (msg) => { console.error(`check-v2-hex: ${path}: ${msg}`); process.exit(1); };

let base = 0, programBytes = 0, first0E = null, count0E = 0, lo = Infinity, hi = -1;
const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
lines.forEach((raw, i) => {
  const line = raw.trim();
  if (!line) return;
  if (line[0] !== ":") fail(`line ${i + 1} is not an Intel HEX record`);
  const bytes = Buffer.from(line.slice(1), "hex");
  if (bytes.reduce((s, b) => (s + b) & 0xff, 0) !== 0) fail(`bad checksum on line ${i + 1}`);
  const len = bytes[0], addr = (bytes[1] << 8) | bytes[2], type = bytes[3];
  const data = bytes.subarray(4, 4 + len);
  switch (type) {
    case 0x00: {
      const a = base + addr;
      const inFlash = a + len <= 0x80000;
      const inUicr = a >= 0x10001000 && a + len <= 0x10002000;
      if (!inFlash && !inUicr)
        fail(`program data at 0x${a.toString(16)} is outside nRF52833 flash/UICR -- not a V2 image`);
      programBytes += len; lo = Math.min(lo, a); hi = Math.max(hi, a + len);
      break;
    }
    case 0x02: base = data.readUInt16BE(0) << 4; break;
    case 0x04: base = data.readUInt16BE(0) << 16; break;
    case 0x01: case 0x03: case 0x05: break;
    case 0x0a: case 0x0b: case 0x0c: case 0x0d:
      fail(`universal-hex record type 0x${type.toString(16).toUpperCase()} on line ${i + 1} -- this is a multi-variant hex, not V2-only`);
    case 0x0e:
      if (first0E === null) first0E = data.toString("hex").toUpperCase();
      count0E++;
      break;
    default:
      fail(`unknown record type 0x${type.toString(16)} on line ${i + 1}`);
  }
});
if (programBytes === 0) fail("no program data");
if (count0E > 0 && !first0E.startsWith(SOURCE_MAGIC))
  fail(`${count0E} type-0E records that are not MakeCode embedded source (magic ${SOURCE_MAGIC}) -- refusing`);
console.log(`check-v2-hex: OK -- V2-only, ${programBytes} program bytes ` +
  `(0x${lo.toString(16)}..0x${hi.toString(16)})` +
  (count0E ? `, plus ${count0E} embedded-source records (not flashed)` : ""));
JS
