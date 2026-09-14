// radio.js -- a robot's radio address, worked out from its name.
//
// NORMATIVE SPEC: radio-robot-lib docs/design/radio-addressing.md. Every robot
// running this repo's image tunes itself at boot to the pair its own name
// derives (test/boot.ts), so a relay reaches one robot by tuning to that pair
// -- there is no shared fleet channel. mbrelay's registry, the relay's `!N`,
// robot-console and pxt-nezha-diffdrive's make_deploy compute the same map;
// tools/radio-address-dump runs this module against the spec's D2 digest.
//
//   n       = base 5 of the name, first letter MOST significant
//   channel = 11 + n % 73        11..83
//   group   = 15 + n % 241       15..255
//
// (Until 2026-09-14 the fleet used 25 + 2*(n % 25) / 1 + n/25 skipping 10.
// That map is retired; nothing here computes it.)

const CONSONANTS = "zvgpt";   // letters 0, 2, 4
const VOWELS = "uoiea";       // letters 1, 3
const NAME_SPACE = 3125;

export const CHANNEL_MIN = 11;
export const CHANNEL_COUNT = 73;
export const GROUP_MIN = 15;
export const GROUP_COUNT = 241;
/** 73^-1 mod 241, for the reverse map. */
const CHANNEL_COUNT_INVERSE = 208;

/** Name -> n in 0..3124. Trims ASCII whitespace and ignores case; throws on
 *  anything that is not a five-letter micro:bit name. */
export function nameToValue(name) {
    const text = String(name ?? "").trim().toLowerCase();
    if (!/^[zvgpt][uoiea][zvgpt][uoiea][zvgpt]$/.test(text)) {
        throw new Error(`'${name}' is not a micro:bit name`);
    }
    let n = 0;
    for (let i = 0; i < 5; i += 1) {
        const alphabet = i % 2 === 0 ? CONSONANTS : VOWELS;
        n = n * 5 + alphabet.indexOf(text[i]);
    }
    return n;
}

/** n in 0..3124 -> its five-letter name. */
export function valueToName(n) {
    if (!Number.isInteger(n) || n < 0 || n >= NAME_SPACE) throw new Error(`${n} is not a name value`);
    const letters = new Array(5);
    for (let i = 4; i >= 0; i -= 1) {
        letters[i] = (i % 2 === 0 ? CONSONANTS : VOWELS)[n % 5];
        n = Math.floor(n / 5);
    }
    return letters.join("");
}

/** Name -> the { channel, group } a robot with that name listens on. */
export function radioAddress(name) {
    const n = nameToValue(name);
    return { channel: CHANNEL_MIN + (n % CHANNEL_COUNT), group: GROUP_MIN + (n % GROUP_COUNT) };
}

/**
 * { channel, group } -> the one name that derives it. Throws for a pair
 * outside 11..83 / 15..255, and for the many in-range pairs that belong to no
 * name (only 3125 of 17593 do) -- never a guess.
 */
export function radioAddressToName(channel, group) {
    if (!Number.isInteger(channel) || channel < CHANNEL_MIN || channel >= CHANNEL_MIN + CHANNEL_COUNT) {
        throw new Error(`channel ${channel} is not a name-derived channel`);
    }
    if (!Number.isInteger(group) || group < GROUP_MIN || group >= GROUP_MIN + GROUP_COUNT) {
        throw new Error(`group ${group} is not a name-derived group`);
    }
    const c = channel - CHANNEL_MIN;
    const g = group - GROUP_MIN;
    const n = c + CHANNEL_COUNT * ((((g - c + GROUP_COUNT) * CHANNEL_COUNT_INVERSE) % GROUP_COUNT));
    if (n >= NAME_SPACE) throw new Error(`channel ${channel} / group ${group} belongs to no name`);
    return valueToName(n);
}

/**
 * The spec's canonical dump for n = 0..3124: version 2 is
 * `name,channel,group,decode(name),reverse(channel,group)` (digest D2), version
 * 1 the first three columns (D1).
 */
export function canonicalForm(version = 2) {
    let out = "";
    for (let n = 0; n < NAME_SPACE; n += 1) {
        const name = valueToName(n);
        const { channel, group } = radioAddress(name);
        out += version === 1
            ? `${name},${channel},${group}\n`
            : `${name},${channel},${group},${nameToValue(name)},${nameToValue(radioAddressToName(channel, group))}\n`;
    }
    return out;
}
