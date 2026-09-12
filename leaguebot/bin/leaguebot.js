#!/usr/bin/env node
// leaguebot -- entry point. Everything real lives in ../src.

import { main } from "../src/cli.js";

// Serial ports and mDNS browsers both hold the event loop open, and the
// commands close what they opened -- but a stray handle should not turn a
// finished command into a hung terminal, so the exit is explicit.
main(process.argv.slice(2))
    .then((code) => process.exit(code ?? 0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
