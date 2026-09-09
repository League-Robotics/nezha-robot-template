#!/usr/bin/env bash
# bake-profile.sh — stamp this build's identity into the extension's kProfile.
#
# WHAT THIS ANSWERS: the wire `id` verb replies
#
#     id <drivetrain> <profile> <version> <name>
#
# where `profile` is BUILD PROVENANCE -- what this hex IS -- and `name` is the
# board actually answering, read live from silicon. When the two DISAGREE you
# are looking at a board flashed with a build that was not made for it, and
# that disagreement is the diagnostic: never "fix" it by making them match.
#
# THE TWO KINDS OF PROVENANCE THIS REPO PRODUCES:
#
#   --robot NAME       A bench build aimed at one robot. Validated against the
#                      fleet registry, so a typo cannot bake a plausible name.
#   --profile STRING   A build identity that is not a robot at all -- the
#                      calibration image published by .github/workflows/
#                      release.yml is `calibration-<release version>`. Refused
#                      if it collides with a registered board name, so a
#                      generic image can never impersonate a fleet member.
#   --none             Reset to the "unbaked" placeholder.
#
# WHY A SCRIPT AND NOT A COMMITTED VALUE: kProfile is a `constexpr` in the
# extension's protocol.cpp, fixed at COMPILE time -- there is no filling it in
# later, at flash time, from a built hex. And protocol.cpp lives in
# pxt_modules/, a gitignored DEPENDENCY CACHE that `pxt install`,
# scripts/update.sh (`rm -rf pxt_modules/$DEP`) and `npm run clean` all wipe.
# So this re-runs on every build rather than being a one-time edit. Idempotent.
# Same shape as the retired scripts/patch-extension.sh, and the same
# scratch-copy-only substitution the extension's own tools/make_deploy.py
# performs in _inject_profile().
#
# kVersion is DELIBERATELY NOT TOUCHED. Upstream bakes it in
# tools/publish_extension.py's assemble() step; leaving it alone means the
# value they ship arrives intact. Until that lands `ver` reports `unbaked`,
# which is honest -- this script has no better answer than they do. That is
# also why the calibration image carries its version in the PROFILE: kVersion
# belongs to the extension, and the image's own version has nowhere else to go.
set -uo pipefail

cd "$(dirname "$0")/.."

PROTOCOL="pxt_modules/nezha-diffdrive/src/comms/protocol.cpp"
DEVICES="config/devices.json"
PLACEHOLDER="unbaked"

usage() {
    echo "Usage: bash scripts/bake-profile.sh --robot NAME | --profile STRING | --none" >&2
    exit 2
}
[ $# -eq 2 ] || { [ "${1:-}" = "--none" ] && [ $# -eq 1 ]; } || usage

if [ ! -f "$PROTOCOL" ]; then
    echo "bake-profile: $PROTOCOL not present — run 'npm run setup' first." >&2
    exit 1
fi

# Every registered board name, one per line, for validation both ways round.
known_names() {
    node -e '
        const reg = require(process.argv[1]);
        const out = new Set();
        for (const e of Object.values(reg))
            for (const f of ["device_name", "board_name"])
                if (e[f]) out.add(e[f]);
        for (const n of [...out].sort()) console.log(n);
    ' "./$DEVICES" 2>/dev/null
}

case "${1:-}" in
    --none)
        # A reset, not a no-op. The previous build's name is still sitting in
        # the cache; inheriting it silently would bake the WRONG identity into
        # an unparameterised build -- a hex that lies with authority, strictly
        # worse than one that admits it is unbaked.
        PROFILE="$PLACEHOLDER"
        ;;

    --robot)
        REQUESTED="$2"
        # FAIL LOUDLY on a miss. A silent fallback here is the exact defect
        # upstream's _read_robot_profile() exists to close: they once baked a
        # hand-written "tovez" fleet-wide, so every board -- vevov included --
        # answered ID with "tovez".
        #
        # device_name first, then board_name, case-insensitively: the order
        # `mbdeploy` resolves a target in (agent manual S4 step 4), so a name
        # that flashes is a name that bakes. Neither field is universally
        # present -- zapig has only board_name, vevav only device_name.
        PROFILE=$(node -e '
            const [file, want] = process.argv.slice(1);
            const reg = require(file);
            const key = want.toLowerCase();
            for (const field of ["device_name", "board_name"]) {
                for (const e of Object.values(reg)) {
                    if ((e[field] || "").toLowerCase() === key) {
                        process.stdout.write(e[field]);
                        process.exit(0);
                    }
                }
            }
            process.exit(1);
        ' "./$DEVICES" "$REQUESTED" 2>/dev/null)

        if [ -z "$PROFILE" ]; then
            echo "bake-profile: '$REQUESTED' is not a known board in $DEVICES." >&2
            echo "  Known names:" >&2
            known_names | sed 's/^/    /' >&2
            echo "  If the board is new, run 'mbdeploy probe' to register it." >&2
            echo "  For a build that is not aimed at one robot, use --profile." >&2
            exit 1
        fi
        ;;

    --profile)
        PROFILE="$2"
        [ -n "$PROFILE" ] || { echo "bake-profile: --profile needs a value" >&2; exit 1; }

        # A free-form identity must not be able to claim to BE a robot. Without
        # this, `--profile tigez` would bypass the registry check that --robot
        # exists to enforce, and a generic image could answer ID indistinguishably
        # from a build actually made for that board.
        if known_names | grep -qix -- "$PROFILE"; then
            echo "bake-profile: '$PROFILE' is a registered board name." >&2
            echo "  Use --robot $PROFILE to bake a build aimed at that board." >&2
            exit 1
        fi
        if [ "$PROFILE" = "$PLACEHOLDER" ]; then
            echo "bake-profile: '$PLACEHOLDER' is the reset sentinel; use --none." >&2
            exit 1
        fi
        ;;

    *) usage ;;
esac

# The `id` reply is SPACE-SEPARATED and positional, so whitespace in the
# profile would split one field into two and shift every field after it. The
# 48-char cap is protocol.cpp's own budget for this field in a 128-byte line
# buffer. A quote or backslash would break the C string literal outright.
case "$PROFILE" in
    *[[:space:]]*) echo "bake-profile: profile '$PROFILE' contains whitespace." >&2; exit 1 ;;
    *\"*|*\\*)     echo "bake-profile: profile '$PROFILE' contains a quote or backslash." >&2; exit 1 ;;
esac
if [ "${#PROFILE}" -gt 48 ]; then
    echo "bake-profile: profile '$PROFILE' is ${#PROFILE} chars, over the 48-char wire budget." >&2
    exit 1
fi

# --- inject -----------------------------------------------------------------
# The regex is upstream's own _K_PROFILE_RE, character for character. Two
# properties matter and neither is incidental:
#   [^"]*  matches ANY current value, so this is idempotent over an already
#          baked file -- no pristine backup needed -- and it cleanly overrides
#          a value upstream bakes in later rather than conflicting with it.
#   The `kProfile = ` anchor keeps kDrivetrain and kVersion, which sit in the
#          same anonymous namespace and match the rest of the pattern, out of
#          reach.
#
# Substitute in memory and write ONLY on exactly one match. A count of 0 means
# protocol.cpp changed shape upstream and this script has silently stopped
# working -- handing us a hex that reports `unbaked` again, the very bug this
# exists to fix. Fail loudly and leave the file untouched instead, so a broken
# bake can never be mistaken for a successful one. Same posture as upstream's
# own `sys.exit` on n != 1. perl, not `sed -i`, because BSD and GNU sed
# disagree on -i and this repo runs on macOS and Raspberry Pi alike.
PROFILE="$PROFILE" perl -e '
    my $path = shift;
    open(my $in, "<", $path) or die "bake-profile: cannot read $path: $!\n";
    local $/; my $text = <$in>; close $in;

    my $profile = $ENV{PROFILE};
    my $n = ($text =~ s/(constexpr const char\* kProfile = ")[^"]*(";)/$1$profile$2/g);

    if ($n != 1) {
        print STDERR "bake-profile: expected exactly one kProfile constant in $path, found $n.\n";
        print STDERR "  protocol.cpp has changed shape upstream — update the regex in this script.\n";
        print STDERR "  NOT writing: the hex would report an unbaked profile without this saying so.\n";
        exit 1;
    }

    open(my $out, ">", $path) or die "bake-profile: cannot write $path: $!\n";
    print $out $text; close $out;
' "$PROTOCOL" || exit 1

if [ "$PROFILE" = "$PLACEHOLDER" ]; then
    echo "bake-profile: kProfile reset to the \"$PLACEHOLDER\" placeholder"
else
    echo "bake-profile: baked kProfile=\"$PROFILE\""
fi
