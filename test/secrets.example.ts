// secrets.example.ts — template for test/secrets.ts, which is NOT in git.
//
// scripts/build.sh copies this to test/secrets.ts on the first build if that
// file is missing, so a fresh clone builds without anyone hunting for it.
// Put the real password in test/secrets.ts, never here.
const WIFI_SSID = "Busboom Mesh"
const WIFI_PASSWORD = ""
