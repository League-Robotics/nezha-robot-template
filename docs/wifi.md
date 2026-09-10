# WiFi on the calibration image

The image this repo publishes brings up the Planet X Ai-WB2-12F WiFi
module and joins the mesh, so a calibrated robot is reachable as
`<name>.local:7654` with no cable and no radio relay. `test/boot.ts`
does it in one line:

```ts
diffDrive.setupWifi(WIFI_SSID, WIFI_PASSWORD)
```

`WIFI_SSID` / `WIFI_PASSWORD` come from `test/secrets.ts`, which is
**gitignored**. `scripts/build.sh` seeds it from
`test/secrets.example.ts` on a fresh clone, and that template carries an
EMPTY password on purpose (see "What the published release can and
cannot do" below).

## Verified working — gopiv, 2026-09-09

`captures/wifi-calibration-20260909/gopiv-wifi-after.log`. The image is
this repo's own calibration build (`--profile
calibration-wifi-check-20260909b`, DiffDrive `v1.20260907.5`), flashed
to gopiv over the network with `mbdeploy deploy --remote gopiv`:

```
rogo: 'gopiv robot link' -> gopiv.local.:7654 -> 192.168.1.218 (txt name=gopiv role=robot link=v6 port=7654)
device NEZHA2 robot gopiv 2175407711
pong 48129
id diffdrive calibration-wifi-check-20260909b 1.20260907.5 gopiv
DBG:wifi state=5 ip=192.168.1.218 peer=-:0 tcp=1/1 to=0 restarts=0 sent=7 rx=6 drop=0 mdns=1/1 ... credsrc=1 trunc=0
```

`state=5` is `kReady`, `mdns=1/1` is the announcement out and the socket
open, `restarts=0` says it joined on the first attempt. PING, ID and
STATUS all answered over TCP.

## The failure this replaced, and how to read it

Before the fix the same board sat here for hours:

```
DBG:wifi state=2 ... restarts=2783 ... cmd=AT+CIPDINFO=1 reply=..OK.. credsrc=1 trunc=0
```

`state=2` is `kJoin`; `restarts=2783` is the whole AT sequence being
torn down and started over, forever. Note what it does NOT look like: a
module that is missing or unpowered answers nothing at all
(`reply=` empty, and see `gopiv-wifi-listen.log` in the DiffDrive repo's
`captures/fleet-flash-20260904/`). Here the module replies `..OK..`. The
hardware was fine the entire time.

**The cause was a wrong password.** `test/secrets.ts` in this checkout
carried a 13-character password that was not the fleet's 13-character
password — same SSID, same length, different string. The fleet's own
copy lives in the DiffDrive repo at `config/wifi_secrets.json`, is what
`tools/make_deploy.py` bakes into every fleet robot, and is the value
tovez, tigez and vevov joined with on 2026-09-02/04. The two had drifted
apart with nothing comparing them.

Compare them without printing either (both files are secrets):

```bash
python3 -c "
import json,hashlib
d=json.load(open('/path/to/pxt-nezha-diffdrive/config/wifi_secrets.json'))
print({k: (len(v), hashlib.sha1(v.encode()).hexdigest()[:8]) for k,v in d.items()})
"
```

and the same over `test/secrets.ts`'s two constants. Equal `sha1_8`
values mean the calibration image will join wherever the fleet joins.

**A wrong password and an out-of-range AP are indistinguishable from
`DBG:wifi` today** — both present as `state=1/2` with a climbing
`restarts`. The module knows the difference (`+CWJAP:3` is specifically
"wrong password"), the firmware just does not surface the code. Tracked
in the DiffDrive repo as
`clasi/issues/wifi-join-failure-does-not-say-why.md`.

## What the published release can and cannot do

The GitHub release built by `.github/workflows/release.yml` has
**WiFi compiled in but inert**: CI seeds `test/secrets.ts` from
`test/secrets.example.ts`, whose password is empty, so a downloaded
release joins nothing. That is deliberate — this repo is PUBLIC, and a
hex is not a safe place to put a password: it is recoverable from the
artifact by anyone who downloads it.

So a board flashed from the release is reachable over USB and radio, not
WiFi. To get WiFi, build locally with a real `test/secrets.ts`:

```bash
bash scripts/build.sh --cloud --profile calibration-local
mbdeploy deploy --remote <board> --hex built/binary.hex
```

Then confirm with `rogo --discover <board>` (expect an IP) rather than
by assuming — an empty or wrong password fails silently apart from the
`DBG:wifi` line above.
