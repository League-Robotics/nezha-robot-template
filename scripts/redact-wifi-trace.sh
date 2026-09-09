#!/usr/bin/env bash
# redact-wifi-trace.sh — keep the WiFi password out of the `DBG:wifi` line.
#
# THE LEAK: WifiLink::serviceJoin() builds the real join command,
#
#     AT+CWJAP="<ssid>","<password>"
#
# and hands it to startCommand(), which copies the WHOLE string into
# lastCommand_ (wifi_link.cpp, copyBounded). Protocol::emitWifiDebug() then
# prints that buffer as the `cmd=` field of `DBG:wifi`, and emitLine() puts
# that line on serial, on the RADIO, and on WiFi itself. So a robot that
# cannot join spends every retry broadcasting the network password in
# cleartext to anything listening on channel 55 / group 114 or attached to
# the fleet daemon. Observed on gopiv 2026-09-08.
#
# THE FIX: leave the command that is SENT alone -- the module needs the real
# password -- and overwrite only the traced copy, right after the send. The
# SSID stays, so the diagnostic still says which network was attempted and
# `cmd=` still distinguishes a join from any other AT step.
#
# WHY A SCRIPT AND NOT AN EDIT: wifi_link.cpp lives in pxt_modules/, a
# gitignored DEPENDENCY CACHE that `pxt install`, scripts/update.sh and
# `npm run clean` all wipe. Same reasoning, same shape and same failure
# posture as scripts/bake-profile.sh: re-run on every build, idempotent, and
# fail LOUDLY rather than leave a half-patched file, because a silent no-op
# here restores the leak with nothing to say so.
#
# THIS IS A LOCAL STOPGAP. The real fix belongs in
# League-Robotics/pxt-nezha-diffdrive (pinned at v1.20260907.5 in pxt.json);
# delete this script once a release carries it.
set -uo pipefail

cd "$(dirname "$0")/.."

WIFI="pxt_modules/nezha-diffdrive/src/comms/wifi_link.cpp"
MARKER="redacted for DBG:wifi"

if [ ! -f "$WIFI" ]; then
    echo "redact-wifi-trace: $WIFI not present — run 'npm run setup' first." >&2
    exit 1
fi

if grep -q "$MARKER" "$WIFI"; then
    echo "redact-wifi-trace: already applied"
    exit 0
fi

perl -e '
    my $path = shift;
    open(my $in, "<", $path) or die "redact-wifi-trace: cannot read $path: $!\n";
    local $/; my $text = <$in>; close $in;

    # Anchored on the CWJAP build-and-send pair, which is unique in the file.
    # Both halves are matched so a partial upstream rewrite of either one
    # fails the count check below instead of patching the wrong call.
    my $find = qr{
        (\n[ ]*snprintf\(cmd,\ sizeof\(cmd\),\ "AT\+CWJAP=\\"%s\\",\\"%s\\"",\ config_\.ssid,
         \n[ ]*config_\.password\);
         \n[ ]*startCommand\(cmd,\ "OK",\ kJoinTimeout\);)
    }x;

    my $add = join("\n",
        "",
        "    // The trace buffer feeds DBG:wifi, which emitLine() puts on serial,",
        "    // radio AND WiFi -- so the password must not survive here. Overwrite",
        "    // the traced copy only; `cmd` above, already sent, keeps the real one.",
        "    // (redacted for DBG:wifi -- scripts/redact-wifi-trace.sh)",
        "    snprintf(lastCommand_, sizeof(lastCommand_), \"AT+CWJAP=\\\"%s\\\",\\\"***\\\"\",",
        "             config_.ssid);");

    my $n = ($text =~ s/$find/$1$add/g);

    if ($n != 1) {
        print STDERR "redact-wifi-trace: expected exactly one CWJAP send site in $path, found $n.\n";
        print STDERR "  wifi_link.cpp has changed shape upstream — update this script.\n";
        print STDERR "  NOT writing: the build would ship the password in DBG:wifi with nothing to say so.\n";
        exit 1;
    }

    open(my $out, ">", $path) or die "redact-wifi-trace: cannot write $path: $!\n";
    print $out $text; close $out;
' "$WIFI" || exit 1

echo "redact-wifi-trace: DBG:wifi cmd= now reports AT+CWJAP=\"<ssid>\",\"***\""
