// pxt-globals.d.ts — PRE-SETUP FALLBACK ONLY. Not the source of truth.
//
// Real IntelliSense comes from the actual extension sources in
// pxt_modules/, which tsconfig.json includes directly. This file exists
// only so a freshly cloned repo has some completion BEFORE
// `npm run setup` has downloaded those sources.
//
// DO NOT EXTEND THIS FILE. It used to be the only type surface, which is
// why `PlanetX_Basic`, `diffDrive.emitLine`, `control.raiseEvent` and
// EventBusSource all showed as errors despite compiling and running
// fine — anything nobody had hand-typed simply did not exist to the
// editor. To get types for a new API, add its extension to pxt.json and
// run setup; the declarations come with it.
//
// Kept deliberately a strict SUBSET so it merges with the real
// declarations without conflict.

// ── Core micro:bit APIs ────────────────────────────────────

declare namespace input {
    function onButtonPressed(button: Button, handler: () => void): void;
    function buttonIsPressed(button: Button): boolean;
}

declare namespace basic {
    function showNumber(value: number, interval?: number): void;
    function showIcon(icon: IconNames, interval?: number): void;
    function clearScreen(): void;
    function pause(ms: number): void;
    function forever(handler: () => void): void;
}

declare namespace led {
    function plotBarGraph(value: number, high: number): void;
    function plot(x: number, y: number): void;
    function unplot(x: number, y: number): void;
    function toggle(x: number, y: number): void;
    function point(x: number, y: number): boolean;
    function brightness(b: number): void;
    function setBrightness(b: number): void;
    function enable(enable: boolean): void;
    function plotAll(): void;
    function screenshot(): void;
}

declare namespace control {
    function millis(): number;
    function runInBackground(handler: () => void): void;
    function reset(): void;
}

declare namespace serial {
    function writeLine(text: string): void;
    function writeString(text: string): void;
    function writeNumber(value: number): void;
    function writeValue(name: string, value: number): void;
}

declare namespace radio {
    function setGroup(group: number): void;
    function sendNumber(value: number): void;
    function sendString(text: string): void;
    function sendValue(name: string, value: number): void;
    function onReceivedNumber(handler: (receivedNumber: number) => void): void;
    function onReceivedString(handler: (receivedString: string) => void): void;
    function onReceivedValue(handler: (name: string, value: number) => void): void;
}

declare namespace pins {
    function digitalReadPin(name: number): number;
    function digitalWritePin(name: number, value: number): void;
    function analogReadPin(name: number): number;
    function analogWritePin(name: number, value: number): void;
}

declare enum Button {
    A = 0,
    B = 1,
    AB = 2,
}

declare enum IconNames {
    Heart = 0,
    Yes = 1,
    No = 2,
    Happy = 3,
    Sad = 4,
    Skull = 5,
}

// ── DiffDrive extension ────────────────────────────────────

declare namespace diffDrive {
    // Move
    function move(distanceCm: number, turnDeg: number): void;
    function startMove(distanceCm: number, turnDeg: number, speedCmS?: number, turnRateDegS?: number): void;
    function whileMoving(
        distanceCm: number, turnDeg: number,
        body: (x: number, y: number, headingDeg: number) => void,
    ): void;
    function stopMove(): void;

    // GoTo
    function goTo(xCm: number, yCm: number, speedCmS?: number): void;
    function startGoTo(xCm: number, yCm: number, speedCmS?: number): void;
    function whileGoingTo(
        xCm: number, yCm: number,
        body: (x: number, y: number, headingDeg: number) => void,
    ): void;
    function goToWorld(xCm: number, yCm: number, speedCmS?: number): void;

    // Drive (continuous)
    function driveTwist(speedCmS: number, yawRateDegS: number): void;
    function startDrive(speedCmS: number, yawRateDegS: number): void;
    function driveTick(): boolean;

    // Wheels
    function setWheelSpeeds(leftCmS: number, rightCmS: number): void;

    // Query
    function moving(): boolean;
    function moveProgress(): number;
    function isStalled(): boolean;

    // Stop
    function stop(): void;
    function emergencyStop(): void;
    function clearEmergencyStop(): void;
    function clearStallLatch(): void;

    // Pose
    function poseX(): number;
    function poseY(): number;
    function heading(): number;
    function resetPose(): void;

    // World (OTOS)
    function startWorldTracking(): boolean;
    function worldTrackingReady(): boolean;
    function calibrateWorldSensor(): void;
    function setWorldSensorOffset(xMm: number, yMm: number, yawDeg: number): void;
    function setWorldPose(xCm: number, yCm: number, headingDeg: number): void;
    function readWorldPosition(): boolean;
    function worldX(): number;
    function worldY(): number;
    function worldHeading(): number;

    // Setup
    function setTrackWidth(cm: number): void;
    function setWheelCalibration(mmPerDeg: number): void;
    function setDefaultSpeed(cmS: number): void;
    function setDefaultTurnRate(degS: number): void;
    function setArrivalTolerance(cm: number): void;
    function setupRadioChannel(channel: number, group: number): void;
    function setConfig(field: number, value: number): void;

    // Remote / Debug
    function onRun(name: string, handler: (arg?: number) => void): void;
    function onRunCommand(handler: () => void): void;
    function sendString(text: string): void;
    function sendValue(name: string, value: number): void;
}