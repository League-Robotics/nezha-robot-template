// secrets.example.ts — template for test/secrets.ts, which is NOT in git.
//
// scripts/build.sh copies this to test/secrets.ts on the first build if that
// file is missing, so a fresh clone builds without anyone hunting for it.
// Put the real password in test/secrets.ts, never here.
//
// BOTH FIELDS ARE EMPTY, and the SSID has to stay that way.
//
// This file is what CI builds a RELEASE from -- .github/workflows/release.yml
// seeds test/secrets.ts from it, because the real one is gitignored. So
// whatever network name sits here is compiled into every released hex and
// handed to diffDrive.setupWifi() at boot by test/boot.ts, on every robot in
// the fleet.
//
// It used to say "Busboom Mesh", a network the fleet does not use. The effect
// was not a failed join and a shrug: setupWifi()'s credential BEATS the
// flash-backed credential store on a board that has not stored one yet
// (Protocol::serviceWifi() precedence -- flash, then setupWifi(), then the
// extension's own baked default, which is ""). So a released robot spent its
// life retrying a network nobody meant it to look for -- 27 restarts on Eric's
// bench on 2026-09-19 -- and the console's own Set WiFi button appeared to do
// nothing, because the stored credential was correct and the running join was
// not reading it.
//
// Empty is not a missing value here, it is the RIGHT value. setupWifi("")
// still enables the link (it calls enableWifi() unconditionally) and is treated
// as a deliberate disable of the join, so a released image:
//
//   - with nothing stored, sits quiet instead of hammering a stranger's SSID
//   - with a credential stored over the wire, joins THAT on its next boot,
//     because an occupied flash slot outranks this file
//
// which is exactly what a generic image published to a public repo should do.
// A robot gets its network from WIFICRED, not from a constant somebody edited
// once.
//
// NOTE the credential is read ONCE, at the first poll after boot
// (serviceWifi()'s lazy-begin). Setting one over the wire on a running robot
// does not move it to the new network -- reset the board afterwards. That is
// upstream behaviour in the extension, not something this image can change.
//
// For a LOCAL build on your own network, put the real values in
// test/secrets.ts. That file is gitignored, build.sh will not overwrite it, and
// nothing here affects it.
const WIFI_SSID = ""
const WIFI_PASSWORD = ""
