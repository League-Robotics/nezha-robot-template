# Nezha Robot Template — Start coding your robot

A MakeCode project template for driving an ElecFreaks
**Nezha** robot with the **DiffDrive** extension. Open this
in MakeCode, write a few lines of JavaScript, and your
robot drives straight, turns, and knows where it is.

**Hardware you need:**
- micro:bit **V2** (the extension is V2-only)
- ElecFreaks Nezha brick with two motors
- Left wheel on **M2**, right wheel on **M1**

## How to use this template

### 1. Open in MakeCode

Click the button below, or go to
[makecode.microbit.org](https://makecode.microbit.org/),
click **Import**, and paste this repo's URL:

> https://github.com/League-Robotics/nezha-robot-template

[![Open in MakeCode](https://github.com/League-Robotics/nezha-robot-template/raw/main/.github/makecode-button.png)](https://makecode.microbit.org/#pub:S74908-61696-29708-02743)

### 2. Write your program

Open `main.ts` and start typing. The DiffDrive blocks appear
under the **DiffDrive** category. Everything is in centimeters,
centimeters per second, degrees, and degrees per second.

```typescript
// Drive a 30 cm square
input.onButtonPressed(Button.A, function () {
    diffDrive.resetPose()
    for (let i = 0; i < 4; i++) {
        diffDrive.move(30, 0)   // 30 cm straight
        diffDrive.move(0, 90)   // pivot 90° CCW
    }
})
```

### 3. Download and flash

Click **Download** in MakeCode. The `.hex` file goes onto
your micro:bit's drive — that's it.

## What's included

| File | Purpose |
|------|---------|
| `main.ts` | Your program — this is where you write code |
| `pxt.json` | Project config — declares the DiffDrive extension dependency |
| `test.ts` | Smoke-test program compiled in CI, not included in your project |
| `tsconfig.json` | TypeScript settings |

## The DiffDrive extension

This template depends on
[League-Microbit/pxt-diff-drive](https://github.com/League-Microbit/pxt-diff-drive),
which provides closed-loop differential drive control. It gives you:

- **Move blocks** — drive a distance, turn an angle, go to a point
- **Drive blocks** — continuous speed and turn rate
- **Pose** — the robot always knows its x, y, and heading
- **World tracking** — optional OTOS sensor for absolute positioning
- **Stall detection** — the robot stops if it runs into something

See the
[extension README](https://github.com/League-Microbit/pxt-diff-drive)
for the full block reference.

## Local development

```bash
npm install -g pxt
pxt target microbit
pxt install
PXT_COMPILE_SWITCHES=csv-mbcodal pxt build --cloudbuild
```

## License

MIT — see [LICENSE](LICENSE).