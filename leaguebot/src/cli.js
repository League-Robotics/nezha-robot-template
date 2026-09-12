// cli.js -- argument parsing and dispatch.

import { calibrateCommand, connectCommand, probeAll, probeOne, showCommand } from "./commands.js";
import { FLEET_CHANNEL, FLEET_GROUP } from "./resolve.js";

// However the operator invoked us. The `lb` wrapper sets this so its own help
// text does not tell people to type a command name they do not have.
const NAME = process.env.LEAGUEBOT_NAME || "leaguebot";

const USAGE = `
${NAME} -- find, drive and calibrate League robots.

  ${NAME} probe                 list every robot on USB and on the network
  ${NAME} probe <name>          say which paths reach one robot
  ${NAME} connect <name>        open a menu: run the robot's functions
  ${NAME} calibrate <name>      run the wheel and turn calibrations
  ${NAME} show [name]           print what is in calibration.json

Options
  --channel <n>   radio channel for the relay   (default ${FLEET_CHANNEL})
  --group <n>     radio group for the relay     (default ${FLEET_GROUP})
  --scan <ms>     how long to browse mDNS       (default 2500)
  --dir <path>    where calibration.json lives  (default: this directory)
  --no-mdns       skip the network scan
  --no-usb        skip the USB scan
  -v, --verbose   print every line sent and received
  -h, --help      this text

A robot can be reached three ways, and leaguebot tries them in this order:
WiFi, then the radio relay, then the USB cable. Calibration needs the robot
free to drive several metres, so the cable is the last resort.
`;

function parseArgs(argv) {
    const options = { dir: process.cwd() };
    const positional = [];
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        switch (arg) {
            case "-h": case "--help": options.help = true; break;
            case "-v": case "--verbose": options.verbose = true; break;
            case "--no-mdns": options.mdns = false; break;
            case "--no-usb": options.usb = false; break;
            case "--channel": options.channel = Number(argv[++i]); break;
            case "--group": options.group = Number(argv[++i]); break;
            case "--scan": options.scanMs = Number(argv[++i]); break;
            case "--dir": options.dir = argv[++i]; break;
            default:
                if (arg.startsWith("-")) throw new Error(`unknown option ${arg}`);
                positional.push(arg);
        }
    }
    return { options, positional };
}

export async function main(argv) {
    let parsed;
    try {
        parsed = parseArgs(argv);
    } catch (error) {
        console.error(error.message);
        console.error(USAGE);
        return 2;
    }
    const { options, positional } = parsed;
    const [command, name] = positional;

    if (options.help || command === undefined) {
        console.log(USAGE);
        return options.help ? 0 : 2;
    }

    try {
        switch (command) {
            case "probe":
                if (name) await probeOne(name, options);
                else await probeAll(options);
                return 0;
            case "connect":
                if (!name) { console.error("connect needs a robot name"); return 2; }
                await connectCommand(name, options);
                return 0;
            case "calibrate":
                if (!name) { console.error("calibrate needs a robot name"); return 2; }
                await calibrateCommand(name, options);
                return 0;
            case "show":
                showCommand(name, options);
                return 0;
            default:
                console.error(`unknown command '${command}'`);
                console.error(USAGE);
                return 2;
        }
    } catch (error) {
        console.error(`\n${error.message}`);
        return 1;
    }
}
