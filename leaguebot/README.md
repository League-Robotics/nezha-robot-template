# leaguebot

A command-line tool for finding, driving and calibrating the League robots.

Use the `lb` wrapper in the repo root. It installs its own dependencies on
first run, so there is no setup step to remember:

```bash
./lb probe            # what is out there?
./lb probe gopiv      # can I reach this one, and how?
./lb connect gopiv
./lb calibrate gopiv
./lb show
```

`npm run leaguebot -- probe` and `./leaguebot/bin/leaguebot.js probe` do the
same thing, if you prefer either.

`calibration.json` is written to the directory you ran from, not to the repo,
so calibrating from a laptop at the playfield leaves the results where you are
working.

## The commands

| | |
|---|---|
| `probe` | Every micro:bit on USB (identified by saying HELLO to it, not by guessing from USB ids) and every robot reachable on the network. A board whose serial port is held by another program is named from `config/devices.json` instead and marked as remembered rather than confirmed. |
| `probe <name>` | Tries each path to one robot in turn and says which ones answered. |
| `connect <name>` | A menu: list the robot's functions and run one, ask for status, watch its output, send a raw line, or stop the drive. |
| `calibrate <name>` | Walks through the two on-robot calibration routines and records the result. |
| `show [name]` | Prints what is already in `calibration.json`. |

Useful flags: `--verbose` prints every line sent and received, which is the
first thing to reach for when a robot "does not answer"; `--no-usb` /
`--no-mdns` skip a scan; `--channel` / `--group` override the radio address.

## Three ways to reach a robot

`leaguebot` tries them in this order and uses the first that answers:

1. **WiFi** — no cable, no relay, and it does not drop lines. Best when it is up.
2. **Radio**, through a relay micro:bit on USB or one advertised on the network.
   Reaches a robot anywhere in range, but see the warning below.
3. **USB serial** — always works, but the robot is tethered, and both
   calibration routines drive it several metres.

### A relay is not an address

Every robot in the fleet listens on the same channel 55 / group 114, so `HELLO`
over the air is effectively a **broadcast** and whichever robot answers first
wins. Asking two USB relays for `tigez` came back as `vevov` from one and
`gopiv` from the other — both perfectly healthy links, to the wrong robot.

So every connection is checked against the name in the boot banner, and over a
relay `leaguebot` keeps asking until the robot you actually named is the one
that answers. A relay path that reports the wrong robot is contention, not a
fault; the same relay usually works on the next try.

### Finding robots on WiFi

The robots' mDNS responders **do not answer queries** — they only announce
unsolicited, on a slow cycle. Browsing this LAN got the `torture` relay (a real
responder) in 133 ms, but `tigez` took 13 s to appear and another robot 45 s.
Any browse window short enough to be usable misses robots that are sitting
right there, which is what made `probe` report "no robots advertising".

So whenever a name is already known — from the command line, or from
`config/devices.json` — `leaguebot` asks the operating system's resolver for
`<name>.local` instead, which answers from its own cache in single-digit
milliseconds. The browse still runs, to turn up robots nobody named.

A name that resolves is still not a link: `tigez` resolved in 8 ms and then
refused the connection, its WiFi up and its v6 listener down. `probe` opens the
port before claiming the robot is reachable, and says so when it is not.

**The radio drops lines.** These are fire-and-forget frames with no
retransmission underneath them. Five consecutive function listings of one robot
over the relay came back with 6, 13, 8, 17 and 14 of its 17 functions — a
different subset each time. `connect` handles this by asking repeatedly and
taking the union, and the calibration parsers each have two or three
independent ways to recover the same number. Even so, prefer WiFi for
calibration when the robot has it.

## Calibration

The measuring all happens **on the robot** — `test/calibratex.ts` and
`test/calibratea.ts` in the parent project. `leaguebot` sets the runs up, reads
their reports, does the one piece of arithmetic the robot cannot do for itself,
and writes the answer to `calibration.json`.

### Wheel calibration (`calx`)

Two strips of black tape 90 cm apart; the robot behind the first, pointing down
the lane, with 110 cm of clear floor past the second. It creeps onto the first
line, runs the gap, stops on the second, and reports the wheel diameter the
odometry must actually have.

### Turn calibration (`cala`)

Two strips of tape in a cross; the robot centred on it, axle along one arm. It
spins four times (two to measure, two to check), about three minutes.

You are asked for the track width first — measure it with a caliper. Leaving it
blank is fine and is explained below.

### What a spin can and cannot measure

**A spin measures one number, the effective track width `b = trackWidth /
rotationalSlip`.** Not two. That ratio is the only thing the kinematics
contain, so track width 11.42 cm with slip 0.977 and track width 11.5 cm with
slip 0.984 describe *the same robot*.

So slip is never measured, it is **derived**: you pin the track width with a
caliper, the spin measures `b`, and `slip = trackWidth / b` falls out. The gap
between the two is the wheel-contact **scrub** — a robot that turns as though
its wheels were 2 mm further apart than they measure is skidding rather than
pivoting, and that is exactly what the slip term exists to carry.

Give no caliper figure and there is nothing to divide, so the effective width
is used as the track width and slip is exactly 1. That is honest — it says
"this robot turns like a robot this wide" — and it drives correctly. It just
cannot tell you how much of it is scrub.

### One correction the robot cannot make

The spin measures the turn in *wheel travel*, using whatever wheel size the
firmware was compiled with (0.7878 mm/deg, a 90.28 mm wheel). If the true wheel
is bigger by a factor k, every turn comes out k times larger and the routine
concludes the track is k times *narrower* than it is.

`leaguebot` corrects for this, because it is the one thing neither run can do
alone: the two are separate runs and the spin has no way to know what the drive
found. It also ignores the robot's own `CALA:derived slip=` line, which divides
the 11.5 cm constant hard-coded in `calibratea.ts` rather than your robot's
measured width.

### The output

`calibration.json`, keyed by robot name, plus a block to paste into the
program:

```ts
diffDrive.setWheelCalibration(89.09 * Math.PI / 360)  // wheel diameter 89.09 mm
diffDrive.setTrackWidth(11.5)  // caliper track width, cm
diffDrive.setConfigValue(ConfigField.RotationalSlip, 0.981)  // 11.5 cm caliper / 11.72 cm effective
```

Nothing is written to the robot — these numbers live in the program, and take
effect the next time it is flashed.

## Layout

| file | |
|---|---|
| `src/wire.js` | The v6 line protocol: codec, boot banner, and the sequencing session. Pure logic, no I/O. |
| `src/links.js` | The transports. One base class; the only real difference is whether a relay command plane has to be crossed first. |
| `src/discovery.js` | Micro:bits on USB, robots and relays on mDNS. |
| `src/resolve.js` | Name to open link, best transport first. |
| `src/calibration.js` | Parsing the robot's reports, the maths, and the store. |
| `src/commands.js` | probe, connect, calibrate, show. |
| `src/term.js` | Prompts, the press-space gate, signature parsing. |

Transport and protocol code is adapted from `robot-console`
(`packages/host/src/link`, `packages/protocol/src/v6`), trimmed to what a CLI
needs — no SWD, no hex flashing, no HID, no web server.

Run the tests with `npm run leaguebot:test`. They cover the codec, the
sequence arithmetic and the calibration maths, using the literal report lines
the firmware emits.

`node leaguebot/tools/compare-mbdeploy.mjs` checks USB discovery against
`mbdeploy list`. The two reach the board over different USB interfaces —
mbdeploy reads names over SWD, `leaguebot` asks over the CDC serial port — so
they should always agree on which boards are attached and where, and may
legitimately differ on role, which only the serial banner carries.
