# ── Nezha robot — written live in the MakeCode editor ─────────
# A course the robot drives, reachable two ways: press button A, or
# send RUN:a from the bench host. RUN:a does NOT call the function
# directly — it raises the same MessageBus event a real button press
# raises, so the button path itself is what gets exercised.
def driveCourse():
    diffDrive.emit_line("course start")
    basic.show_icon(IconNames.DIAMOND)
    diffDrive.reset_pose()
    diffDrive.move(20, 0)
    diffDrive.move(0, 90)
    diffDrive.move(20, 0)
    diffDrive.move(0, -90)
    diffDrive.move(15, 0)
    basic.clear_screen()
    diffDrive.emit_line("course done x=" + str(Math.round(diffDrive.pose_x())) + " y=" + str(Math.round(diffDrive.pose_y())) + " heading=" + str(Math.round(diffDrive.heading())))
def haltAll():
    diffDrive.emit_line("halt")
    diffDrive.stop()
    basic.show_icon(IconNames.NO)
# ── Buttons ───────────────────────────────────────────────────

def on_button_pressed_a():
    diffDrive.emit_line("btn A")
    driveCourse()
input.on_button_pressed(Button.A, on_button_pressed_a)

def on_button_pressed_ab():
    diffDrive.emit_line("btn AB")
    haltAll()
input.on_button_pressed(Button.AB, on_button_pressed_ab)

# ── Remote triggers ───────────────────────────────────────────
# RUN:a -> raise the real button-A event -> onButtonPressed fires.

def on_on_run(arg):
    diffDrive.emit_line("raise A")
    control.raise_event(EventBusSource.MICROBIT_ID_BUTTON_A,
        EventBusValue.MICROBIT_BUTTON_EVT_CLICK)
diffDrive.on_run("a", on_on_run)

def on_on_run2(arg2):
    haltAll()
diffDrive.on_run("stop", on_on_run2)

def on_on_run3(arg3):
    diffDrive.emit_line("pong heading=" + str(Math.round(diffDrive.heading())))
diffDrive.on_run("ping", on_on_run3)

def on_run_command(name, arg4):
    diffDrive.emit_line("run rx name=" + name + " arg=" + str(arg4))
diffDrive.on_run_command(on_run_command)

diffDrive.emit_line("boot course-program ready")
basic.show_icon(IconNames.GHOST)