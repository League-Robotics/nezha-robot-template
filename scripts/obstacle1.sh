#!/usr/bin/env bash
# obstacle1.sh — drive the bb-obstacle course, camera in the loop.
#
#   circle 1 -> circle 4 -> circle 6 -> push the circle-9 can to circle 12
#
# The robot has no working world sensor, so the HOST holds the world frame:
# before every leg it re-reads the robot's true pose from the overhead camera
# (aprilcam, tag 57, mount-corrected) and rotates the world-frame delta into
# the robot's frame. Re-fixing each leg means odometry drift cannot
# accumulate across the run -- every leg starts from ground truth.
#
# The CAN is fixed the same way, via tools/findcan.py, because a push is only
# correct if it is aimed at where the can actually is. The cans sit within a
# centimetre or so of their painted circles, but "or so" is the whole margin
# on a 23 cm push into a 3.2 cm circle.
#
# Coordinates are playfield cm from the mat definition, not guesswork:
#   mattools.py bb-obstacle locate circle <n>
set -uo pipefail
export PATH="$HOME/.local/bin:$PATH"
ROBOT="${ROBOT:-tigez}"
TAG="${TAG:-57}"
CAM=arducam-ov9782-usb-camera
PY="${PY:-/Volumes/Proj/proj/RobotProjects/aprilcam/.venv/bin/python}"   # needs cv2
cd "$(dirname "$0")/.."

C1_X=15.62;   C1_Y=-21.59
C4_X=7.76;    C4_Y=1.29
C6_X=-6.61;   C6_Y=0.81
C9_X=-34.74;  C9_Y=0.86       # where the target can is painted; findcan refines it
C12_X=-46.68; C12_Y=20.17
DOG_X=-20.0;  DOG_Y=-5.0      # keeps the run to the staging point off the circle-5 can
STANDOFF=20.0                 # stage this far back down the push line

TOL=4.0                       # cm; re-try a leg that lands further off than this
RETRIES=2

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

can() { "$PY" tools/findcan.py --near "$1" "$2" 2>/dev/null; }

send() { (printf "%s\n" "$1"; sleep "${2:-9}") | mbdeploy connect --remote "$ROBOT" 2>&1 | grep -E "OBS1"; }

# turn+distance from a pose to a target
solve() {  # solve rx ry rh tx ty -> "turn dist"
  python3 -c "
import math,sys
rx,ry,rh,tx,ty=map(float,sys.argv[1:])
print('%.1f %.1f'%(((math.degrees(math.atan2(ty-ry,tx-rx))-rh+180)%360-180),
                   math.hypot(tx-rx,ty-ry)))" "$@"
}

dist() { python3 -c "
import math,sys;a=list(map(float,sys.argv[1:]));print('%.1f'%math.hypot(a[2]-a[0],a[3]-a[1]))" "$@"; }

leg() {  # leg <name> <target_x> <target_y>
  local name="$1" tx="$2" ty="$3" try=0
  while :; do
    local P; P=$(fix)
    [ -z "$P" ] && { echo "  !! no camera fix for tag $TAG — aborting"; return 1; }
    read -r rx ry rh <<< "$P"
    read -r TURN DIST <<< "$(solve "$rx" "$ry" "$rh" "$tx" "$ty")"
    printf "%-18s at (%6.1f,%6.1f) h=%6.1f -> (%6.1f,%6.1f)  turn=%5s deg  drive=%5s cm\n" \
           "$name" "$rx" "$ry" "$rh" "$tx" "$ty" "$TURN" "$DIST"
    send "RUN:turn:$TURN" 12 | sed 's/^/      /'
    send "RUN:push:$DIST" 24 | sed 's/^/      /'
    read -r ax ay ah <<< "$(fix)"
    local off; off=$(dist "$ax" "$ay" "$tx" "$ty")
    printf "      landed (%6.1f,%6.1f) h=%6.1f — %s cm off\n" "$ax" "$ay" "$ah" "$off"
    if awk "BEGIN{exit !($off <= $TOL)}"; then return 0; fi
    try=$((try+1))
    [ $try -gt $RETRIES ] && { echo "      (accepting $off cm after $RETRIES retries)"; return 0; }
    echo "      retrying leg — $off cm > ${TOL} cm tolerance"
  done
}

echo "=== obstacle1 on $ROBOT (tag $TAG) ==="
echo
leg "1 circle 1"  $C1_X $C1_Y  || exit 1
leg "2 circle 4"  $C4_X $C4_Y  || exit 1
leg "3 circle 6"  $C6_X $C6_Y  || exit 1
leg "4 dogleg"    $DOG_X $DOG_Y || exit 1

# ---- the push -------------------------------------------------------------
# Where the can ACTUALLY is decides the staging point, so fix it first.
echo
read -r CX CY <<< "$(can $C9_X $C9_Y)"
[ -z "${CX:-}" ] && { echo "!! cannot see the target can — aborting"; exit 1; }
echo "target can at ($CX, $CY)  [painted circle 9 is at $C9_X, $C9_Y]"

read -r SX SY <<< "$(python3 -c "
import math,sys
cx,cy,tx,ty,s=map(float,sys.argv[1:])
dx,dy=tx-cx,ty-cy; n=math.hypot(dx,dy)
print('%.2f %.2f'%(cx-dx/n*s, cy-dy/n*s))" "$CX" "$CY" "$C12_X" "$C12_Y" "$STANDOFF")"
leg "5 stage" "$SX" "$SY" || exit 1

# THE PUSH.
#
# Do NOT re-aim between pushes. The first version of this did, and it is what
# threw the can off the mat on 2026-09-03: after the first push the robot is
# touching the can, so every "aim" is a turn-in-place with the can jammed
# against the nose. That scrubs the can sideways instead of driving it (the
# can moved 6.4 cm on the first 14 cm push, then only 4.2 on the second),
# and eventually catches its base and tips it. A tipped can rolls, so the
# next push sent it 32 cm.
#
# So: aim ONCE, from the standoff, then drive the whole push in one motion.
# The can rides NOSE cm ahead of the robot's reference point -- measured, not
# assumed: at contact the robot was 13.5 cm from the can centre.
#
# If a correction is needed afterwards, BACK OFF FIRST, then turn, then
# re-approach. Turning in contact is the thing that breaks this.
NOSE=13.5
SLOW=8          # cm/s for the push; the transit legs run at the default
BACKOFF=10      # cm to reverse before any re-aim, so the turn is clear of the can

send "RUN:speed:$SLOW" 8 | sed 's/^/      /'

for i in 1 2 3; do
  read -r cx cy <<< "$(can "$CX" "$CY")"
  if [ -z "${cx:-}" ]; then echo "!! lost sight of the can — stopping"; break; fi
  CX=$cx; CY=$cy
  remain=$(dist "$CX" "$CY" "$C12_X" "$C12_Y")
  printf "push %d: can at (%6.2f,%6.2f) — %s cm from circle 12\n" "$i" "$CX" "$CY" "$remain"
  if awk "BEGIN{exit !($remain <= 3.0)}"; then echo "  can is on circle 12."; break; fi

  read -r rx ry rh <<< "$(fix)"
  [ -z "${rh:-}" ] && { echo "!! no robot fix — stopping"; break; }

  # Back off before turning, unless already clear of the can.
  gap=$(dist "$rx" "$ry" "$CX" "$CY")
  if awk "BEGIN{exit !($gap < $NOSE + 4)}"; then
    printf "  %s cm from the can — backing off %s cm before turning\n" "$gap" "$BACKOFF"
    send "RUN:push:-$BACKOFF" 16 | sed 's/^/      /'
    read -r rx ry rh <<< "$(fix)"
  fi

  # Aim through the can at circle 12, then drive: close the gap to contact,
  # then advance exactly as far as the can still has to travel.
  read -r TURN _ <<< "$(solve "$rx" "$ry" "$rh" "$C12_X" "$C12_Y")"
  ADV=$(python3 -c "
import math,sys
rx,ry,cx,cy,remain,nose=map(float,sys.argv[1:])
approach=max(0.0, math.hypot(cx-rx,cy-ry)-nose)
print('%.1f'%(approach+remain))" "$rx" "$ry" "$CX" "$CY" "$remain" "$NOSE")
  printf "  aim %s deg, then drive %s cm in one motion (contact + %s cm of can travel)\n" \
         "$TURN" "$ADV" "$remain"
  send "RUN:turn:$TURN" 12 | sed 's/^/      /'
  send "RUN:push:$ADV" 30 | sed 's/^/      /'
done

echo
read -r cx cy <<< "$(can "$CX" "$CY")"
if [ -n "${cy:-}" ]; then
  printf "FINAL  can (%s, %s)  —  %s cm from circle 12\n" "$cx" "$cy" "$(dist "$cx" "$cy" "$C12_X" "$C12_Y")"
else
  printf "FINAL  can not visible near (%s, %s)\n" "$CX" "$CY"
fi
read -r fx fy fh <<< "$(fix)"
if [ -n "${fh:-}" ]; then printf "       robot (%s, %s) h=%s\n" "$fx" "$fy" "$fh"
else printf "       robot tag not detected this frame\n"; fi
