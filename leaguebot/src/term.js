// term.js -- the small amount of terminal handling the interactive commands
// need: a line prompt, a "press space" gate, and signature parsing.

import readline from "node:readline";

const KEY_CTRL_C = "";

// ONE readline for the whole session, not one per question.
//
// A fresh interface per question looks tidier and is broken: closing it takes
// the underlying stdin with it, so the SECOND question never receives anything
// and never fires its callback. The menu then hangs with no prompt -- and
// because Node buffers stdout when it is a pipe, a hung process shows no
// output at all, which makes it look like the connection failed rather than
// the prompt.
let sharedReadline;
let stdinEnded = false;

// Watched here rather than only through readline, because pressSpace() reads
// stdin directly: whichever of the two consumes the end of input, BOTH must
// learn that there is no operator left. Otherwise the prompt after a
// pressSpace that hit EOF creates a readline over an already-ended stream,
// which emits nothing at all and hangs for ever.
process.stdin.once("end", () => { stdinEnded = true; });

function sharedInterface() {
    if (sharedReadline === undefined) {
        sharedReadline = readline.createInterface({ input: process.stdin, output: process.stdout });
        sharedReadline.once("close", () => { stdinEnded = true; });
    }
    return sharedReadline;
}

/** Release the shared interface so the process can exit. */
export function closeTerm() {
    sharedReadline?.close();
    sharedReadline = undefined;
}

/**
 * Ask a question; resolves the typed answer (possibly empty), or NULL if
 * stdin reached end of file.
 *
 * The null case is not hypothetical: readline's `question` callback never
 * fires on EOF, so a piped or closed stdin would otherwise leave the promise
 * pending for ever. Callers treat null as "the operator has gone away".
 */
export function ask(question) {
    if (stdinEnded) return Promise.resolve(null);
    const rl = sharedInterface();
    return new Promise((resolve) => {
        let answered = false;
        const onClose = () => { if (!answered) resolve(null); };
        rl.once("close", onClose);
        rl.question(question, (answer) => {
            answered = true;
            rl.off("close", onClose);
            resolve(answer.trim());
        });
    });
}

/** Ask a yes/no question. Empty answer takes `fallback`; EOF is a no. */
export async function confirm(question, fallback = true) {
    const hint = fallback ? "[Y/n]" : "[y/N]";
    const answer = await ask(`${question} ${hint} `);
    if (answer === null) return false;
    if (answer === "") return fallback;
    return answer.toLowerCase().startsWith("y");
}

/**
 * Wait for the space bar (or Enter). Resolves false if the operator pressed
 * q or Ctrl-C instead, so a caller can offer "press space when ready, or q to
 * back out" and mean it.
 */
export function pressSpace(message = "Press SPACE to start, or q to cancel... ") {
    if (stdinEnded) return Promise.resolve(false);
    process.stdout.write(message);
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    // The shared readline must not compete for the same keystrokes while this
    // reads stdin raw.
    sharedReadline?.pause();
    return new Promise((resolve) => {
        const finish = (go) => {
            stdin.off("data", onData);
            stdin.off("end", onEnd);
            if (stdin.isTTY) stdin.setRawMode(wasRaw ?? false);
            stdin.pause();
            sharedReadline?.resume();
            process.stdout.write("\n");
            resolve(go);
        };
        // EOF means nobody is at the keyboard. Refusing to start is the only
        // safe reading: this gate exists so that a robot never begins driving
        // before someone has confirmed it is placed and clear.
        const onEnd = () => { stdinEnded = true; finish(false); };
        if (stdin.readableEnded) { onEnd(); return; }
        stdin.once("end", onEnd);
        const onData = (chunk) => {
            const key = chunk.toString("utf8");
            if (key === " " || key === "\r" || key === "\n") finish(true);
            // Ctrl-C is handled here rather than left to the default SIGINT
            // handler: raw mode suppresses it, and a wizard that cannot be
            // interrupted while a robot is about to move is a hazard.
            else if (key === "q" || key === KEY_CTRL_C) finish(false);
        };
        if (stdin.isTTY) stdin.setRawMode(true);
        stdin.resume();
        stdin.on("data", onData);
    });
}

/**
 * Parse a `runSignature` string into parameter descriptors.
 *
 * The firmware writes these by hand, so the shapes vary. All of these appear:
 *
 *     ()                             explicitly no arguments
 *     (secs)                         one, untyped
 *     (on:number=0)                  typed, with a default
 *     (side_mm, speed=60)            mixed
 *     dist speed                     bare, no parens
 *
 * Returns undefined for an ABSENT signature, which is a different thing from
 * `()`: absent means "nobody said", and the caller should offer a free-form
 * argument field rather than assume zero arguments.
 */
export function parseSignature(signature) {
    if (signature === undefined || signature === null) return undefined;
    const text = signature.trim().replace(/^\(/, "").replace(/\)$/, "").trim();
    if (text === "") return [];
    return text.split(/[,\s]+/).filter(Boolean).map((token) => {
        const [head, defaultValue] = token.split("=");
        const [name, type] = head.split(":");
        const param = { name: name.trim() };
        if (type) param.type = type.trim();
        if (defaultValue !== undefined) param.default = defaultValue.trim();
        return param;
    });
}

/**
 * Turn answers into positional arguments.
 *
 * A skipped middle argument is filled from its declared default (or 0) because
 * position is all the wire carries -- but TRAILING blanks are dropped rather
 * than filled, so that leaving everything blank sends `RUN name` with no
 * arguments at all and the firmware's own defaults apply.
 */
export function positionalArgs(params, answers) {
    const args = params.map((param, i) => {
        const answer = answers[i];
        if (answer !== undefined && answer !== "") return answer;
        return param.default ?? "0";
    });
    let end = args.length;
    while (end > 0 && (answers[end - 1] === undefined || answers[end - 1] === "")) end -= 1;
    return args.slice(0, end);
}
