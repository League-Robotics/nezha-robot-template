#!/usr/bin/env bash
# obstacle1.sh — drive the bb-obstacle course, camera in the loop.
#
#   circle 1 -> circle 4 -> circle 6 (can) -> push can to circle 12
#
# The robot has no working world sensor, so the HOST holds the world frame:
# before every leg it re-reads the robot's true pose from the overhead camera
# (aprilcam, tag 57, mount-corrected) and rotates the world-frame delta into
# the robot's frame. Re-fixing each leg means odometry drift cannot
# accumulate across the run.
#
# Circle coordinates are playfield cm from the mat definition:
#   mattools.py bb-obstacle locate circle <n>
set -uo pipefail
export PATH="$HOME/.local/bin:$PATH"
ROBOT="${ROBOT:-tigez}"
TAG="${TAG:-57}"
CAM=arducam-ov9782-usb-camera
cd "$(dirname "$0")/.."

# playfield cm — regenerate with mattools if the mat is moved/relocated
C1_X=15.62;  C1_Y=-21.59
C4_X=7.76;   C4_Y=1.29
C6_X=-6.61;  C6_Y=0.81
C12_X=-46.68; C12_Y=20.17

fix() {  # -> "x y yaw_deg"  (empty if the tag is not currently detected)
  # Parsed with a regex, not awk field splitting: the CLI prints
  #   apriltag 57    world=(46.3, 2.7) yaw=3.135 heading=- speed=-
  # and splitting on punctuation scatters the two numbers across fields,
  # which silently yielded an empty x and y=<the x value>.
  aprilcam camera tags $CAM 2>/dev/null | python3 -c "
import re,sys,math
pat=re.compile(r'apriltag\s+'+sys.argv[1]+r'\s+world=\(\s*([-0-9.]+),\s*([-0-9.]+)\)\s+yaw=([-0-9.]+)')
for line in sys.stdin:
    m=pat.search(line)
    if m:
        print('%s %s %.2f'%(m.group(1),m.group(2),math.degrees(float(m.group(3)))))
        break
" "$TAG"
}

send() { (printf "%s\n" "$1"; sleep "${2:-9}") | mbdeploy connect --remote "$ROBOT" 2>&1 | grep -E "OBS1" ; }

leg() {  # leg <name> <target_x> <target_y>
  # Turn-then-drive, NOT diffDrive.goTo(). goTo() is the natural block for
  # this and it silently does nothing on tigez: commanded fwd=30.5 left=24.5
  # it reported "leg done (0.2,0)" and the camera confirmed the robot had not
  # moved. move()/turn-in-place are verified good on the same robot in the
  # same session (RUN:push:10 -> camera measured exactly 10.0 cm), so the leg
  # is built from those instead.
  local name="$1" tx="$2" ty="$3"
  local P; P=$(fix)
  [ -z "$P" ] && { echo "  !! no camera fix for tag $TAG — aborting"; return 1; }
  read -r rx ry rh <<< "$P"
  read -r TURN DIST <<< "$(python3 -c "
import math,sys
rx,ry,rh,tx,ty=map(float,sys.argv[1:])
bearing=math.degrees(math.atan2(ty-ry,tx-rx))
turn=(bearing-rh+180)%360-180
print('%.1f %.1f'%(turn, math.hypot(tx-rx,ty-ry)))" "$rx" "$ry" "$rh" "$tx" "$ty")"
  printf "%-20s at (%6.1f,%6.1f) h=%6.1f -> (%6.1f,%6.1f)  turn=%s deg, drive=%s cm\n" \
         "$name" "$rx" "$ry" "$rh" "$tx" "$ty" "$TURN" "$DIST"
  send "RUN:turn:$TURN" 12 | sed 's/^/    /'
  send "RUN:push:$DIST" 22 | sed 's/^/    /'
  read -r ax ay ah <<< "$(fix)"
  python3 -c "
import math,sys
ax,ay,tx,ty=map(float,sys.argv[1:])
print('    landed (%.1f,%.1f)  %.1f cm from target'%(ax,ay,math.hypot(tx-ax,ty-ay)))" "$ax" "$ay" "$tx" "$ty"
}


# driveto.sh — walk the robot through waypoints given as "x,y" arguments.
# Same camera-in-the-loop legs as the course: re-fix, turn, drive, verify.
echo "=== driveto on $ROBOT (tag $TAG) ==="
i=0
for wp in "$@"; do
  i=$((i+1))
  X="${wp%%,*}"; Y="${wp##*,}"
  leg "waypoint $i" "$X" "$Y" || exit 1
done
