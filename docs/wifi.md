# WiFi on the calibration image

The image this repo publishes brings up the Planet X Ai-WB2-12F WiFi
module and joins the mesh, so a calibrated robot is reachable as
`<name>.local:7654` with no cable and no radio relay.

**Primary path (since the `v1.20260910.1` DiffDrive pin): provision
credentials over the wire, after flashing, with `WIFICRED`.** No
password is ever baked into the hex, committed to this repo, or typed
into a `.ts` file at all -- it lives only in the board's own flash, set
by a host tool talking to the already-flashed board:

```
HELLO
WIFICRED SET 0 <ssid> <password> #1
WIFICRED #2                          -> wificred 0 <ssid> 1
(power cycle)
```

`DBG:wifi`'s `credsrc=` field says which source won at boot: `0` baked,
`1` `setupWifi()`, `2` the flash store -- `2` beats both of the others,
so a provisioned board always prefers what `WIFICRED` gave it. Full
grammar, the host-tool helpers (`tools/provision_wifi.py`,
`tools/robotlink.py`'s `wificred_set()`/`wificred_clear()`/
`wificred_list()`), and every `DBG:wifi` field are documented in the
DiffDrive repo's
[`docs/robot-connections.md`](https://github.com/League-Robotics/pxt-nezha-diffdrive/blob/master/docs/robot-connections.md#provisioning-credentials-from-a-host-tool-wificred) --
that page is the source of truth for the wire grammar; this page covers
what is specific to a board built from this repo.

```bash
# from a pxt-nezha-diffdrive checkout, against a board already
# running THIS repo's firmware
WIFI_PW=hunter2example uv run python tools/provision_wifi.py \
    --wifi gopiv --slot 0 --ssid MyNetwork --password-env WIFI_PW
```

**A flash MASS-ERASES the whole chip, so credentials written before a
flash do not survive it** (MEASURED gopiv 2026-09-09/10,
`pxt-nezha-diffdrive/captures/wifi-credential-store-20260909/notes.md`:
a store written pre-flash enumerated empty after `mbdeploy deploy
--remote gopiv`). **Provision AFTER flashing this repo's image, never
before** -- the same order every fleet build in the other repo already
follows.

## Fallback: baking credentials at build time (`setupWifi()`)

Before the flash-backed store existed, and still supported as the
fallback for a board that is never going to be provisioned over the
wire (a CI/release image, or a board with no bench session planned),
`test/boot.ts` calls:

```ts
diffDrive.setupWifi(WIFI_SSID, WIFI_PASSWORD)
```

`WIFI_SSID` / `WIFI_PASSWORD` come from `test/secrets.ts`, which is
**gitignored**. `scripts/build.sh` seeds it from
`test/secrets.example.ts` on a fresh clone, and that template carries an
EMPTY password on purpose (see "What the published release can and
cannot do" below). `credsrc=1` on `DBG:wifi` means a board is running on
this path; per the precedence rule above, any `WIFICRED SET` done to
the same board afterward wins on the next boot without needing a
rebuild.

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
STATUS all answered over TCP. (This run predates the `WIFICRED` pin and
shows `credsrc=1`, the `setupWifi()` fallback above -- the state
machine and `DBG:wifi` shape are unchanged by the flash-backed store,
so the reading below still applies to either source.)

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

**A wrong password and an out-of-range AP used to be indistinguishable
from `DBG:wifi`** — both used to present as `state=1/2` with a climbing
`restarts` and nothing more. Since the DiffDrive repo's sprint 038
ticket 001, `DBG:wifi` also carries `join=<code>`, the module's raw
`+CWJAP:<code>` from the most recent attempt (`-` when none was
captured) — vendor documentation reads `2` as wrong password, `3` as AP
not found, but those meanings are unconfirmed on this hardware, so
treat the code as a diagnostic hint, not a certainty. Full field list
in the DiffDrive repo's `docs/robot-connections.md`. Originally tracked
here as `clasi/issues/wifi-join-failure-does-not-say-why.md` in the
DiffDrive repo; now closed by that ticket.

## What the published release can and cannot do

The GitHub release built by `.github/workflows/release.yml` has
**WiFi compiled in but inert**: CI seeds `test/secrets.ts` from
`test/secrets.example.ts`, whose password is empty, so a downloaded
release joins nothing on its own. That is deliberate — this repo is
PUBLIC, and a hex is not a safe place to put a password: it is
recoverable from the artifact by anyone who downloads it. The same
reasoning is why `WIFICRED` provisioning (above) is a separate,
POST-flash step rather than something baked into the release build
process — nothing about a release build should ever need a real
credential in the loop.

So a board flashed from the release is reachable over USB and radio, not
WiFi, until it is provisioned. Two ways to get WiFi onto it:

- **Provision over the wire** (primary path, above) — flash the public
  release as-is, then run `tools/provision_wifi.py` against the board.
  Nothing secret ever touches this repo or the release artifact.
- **Build locally with a real `test/secrets.ts`** (fallback path):

  ```bash
  bash scripts/build.sh --cloud --profile calibration-local
  mbdeploy deploy --remote <board> --hex built/binary.hex
  ```

Then confirm with `rogo --discover <board>` (expect an IP) rather than
by assuming — an empty or wrong password fails silently apart from the
`DBG:wifi` line above.
