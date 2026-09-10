# WiFi on the calibration image — gopiv, 2026-09-09

Session goal: the stakeholder reported WiFi did not appear to be
functioning and asked for it working on the calibration image.

## Timeline

| what | result |
|---|---|
| `mbdeploy connect --remote gopiv ID` (image `calibration-0.20260909.4`, ext `1.20260909.2`) | `DBG:wifi state=2 ... restarts=2783 ... cmd=AT+CIPDINFO=1 reply=..OK.. credsrc=1` — module answering, join looping forever |
| local build `--profile calibration-wifi-check-20260909` (template's own `test/secrets.ts`), flashed to gopiv | same failure: `state=2`, `restarts` climbing from 1 |
| fingerprinted `test/secrets.ts` against the DiffDrive fleet's `config/wifi_secrets.json` | SSID identical (`sha1_8=9387c0d5`); **passwords differ** — template `cb4e4df9`, fleet `31f7e0c8`, both 13 chars |
| synced `test/secrets.ts` to the fleet value, rebuilt `--profile calibration-wifi-check-20260909b`, reflashed | **joined**: `state=5 ip=192.168.1.218 restarts=0 mdns=1/1`; `rogo gopiv PING ID STATUS` answered over TCP (`gopiv-wifi-after.log`) |

## Conclusions

- WiFi in the DiffDrive extension works on the calibration image. The
  transport was never the problem; the baked password was.
- `test/secrets.ts` (gitignored, per-checkout) had drifted from the
  fleet's `config/wifi_secrets.json`, and nothing compares them.
- A wrong password is not distinguishable from an out-of-range AP in
  `DBG:wifi` output. Filed against the extension.

## Also observed

gopiv's Nezha brick is **unpowered**: `status ready=0 connL=0 connR=0`
after the reflash, where the pre-flash read was
`ready=1 connL=1 connR=1 cyc=899`. The micro:bit and the WiFi module are
both alive (the module runs off the brick's J1 but the board answers and
the link is up); no motion is possible until the brick is switched back
on. Not investigated further this session.

gopiv was carrying a locally built `calibration-0.20260909.4` on
DiffDrive `1.20260909.2` before this session reflashed it; it now runs
`calibration-wifi-check-20260909b` on the released extension pin
`1.20260907.5`.

## Re-verified on the current pin

While this session ran, another session pushed `03d92bf`, moving
`pxt.json` to DiffDrive `v1.20260909.2` (that pin is what gopiv's
pre-session `calibration-0.20260909.4` was built from). Rebuilt on it and
reflashed so gopiv is not left behind the repo:

```
id diffdrive calibration-wifi-check-20260909 1.20260909.2 gopiv
DBG:wifi state=5 ip=192.168.1.218 peer=-:0 tcp=1/1 to=0 restarts=0 sent=2 rx=3 drop=0 mdns=1/1 ... credsrc=1 trunc=0
```

Note the profile reads back as `calibration-wifi-check-20260909`, one
character short of the `...09c` that was baked: `Protocol::profileBuf_`
holds 31 usable characters and this name is 32. Truncation is silent in
`ID`'s output (`DBG:profile ... trunc=1` is where it shows). Keep
release profile names under 31 characters.
