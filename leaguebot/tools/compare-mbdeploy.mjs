// compare-mbdeploy.mjs -- check leaguebot's USB discovery against mbdeploy's.
//
// The two tools reach the board over DIFFERENT USB interfaces, which is why
// this comparison is worth making at all: mbdeploy reads names over SWD (the
// CMSIS-DAP HID interface) while leaguebot asks over the CDC serial port. They
// should always agree about WHICH boards are attached and on WHICH ports; they
// can legitimately disagree about the role, because only the serial banner
// carries it and mbdeploy leaves it blank for relays.
//
//   node leaguebot/tools/compare-mbdeploy.mjs
//
// Exits non-zero if the sets differ. Not part of `npm test`: it needs real
// hardware and the mbdeploy CLI.

import { execFileSync } from "node:child_process";
import { listMicrobitPorts, probeUsb } from "../src/discovery.js";

function mbdeployConnected() {
    const out = execFileSync("mbdeploy", ["list"], { encoding: "utf8" });
    const devices = new Map();
    for (const line of out.split("\n").slice(2)) {
        const m = /^(\S*)\s+(yes|no)\s+(\S*)\s+.*?(\/dev\/\S+)?\s+([0-9a-f]{48})\s*$/.exec(line);
        if (!m || m[2] !== "yes") continue;
        devices.set(m[5], { name: m[3], port: m[4] });
    }
    return devices;
}

const truth = mbdeployConnected();
const ports = await listMicrobitPorts();
const mine = await probeUsb();

console.log(`mbdeploy: ${truth.size} connected    leaguebot: ${ports.length} ports\n`);

let differences = 0;
for (const uid of new Set([...truth.keys(), ...mine.map((d) => d.serialNumber)])) {
    const theirs = truth.get(uid);
    const ours = mine.find((d) => d.serialNumber === uid);
    const ok = theirs && ours && theirs.port === ours.portPath && theirs.name === ours.name;
    if (!ok) differences += 1;
    console.log(`${ok ? "ok  " : "DIFF"}  ${uid.slice(16, 32)}`);
    console.log(`        mbdeploy : ${theirs ? `${theirs.name} @ ${theirs.port}` : "(absent)"}`);
    console.log(`        leaguebot: ${ours ? `${ours.name ?? "?"} @ ${ours.portPath}`
        + ` [${ours.type}${ours.role ? ` ${ours.role}` : ""}, ${ours.source}]` : "(absent)"}`);
}

console.log(differences === 0
    ? "\nMATCH -- same boards, same ports, same names"
    : `\n${differences} difference(s)`);
process.exit(differences === 0 ? 0 : 1);
