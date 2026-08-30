// test.ts — Minimal smoke-test program.
// This file is compiled when you build the repo in CI. It is NOT
// included in projects that use this template — it lives in
// `testFiles` so it gets compiled only when building the repo itself.

basic.showIcon(IconNames.Heart)
diffDrive.resetPose()
diffDrive.move(10, 0)      // drive 10 cm straight
diffDrive.move(0, 45)      // turn 45 degrees
basic.showIcon(IconNames.Yes)