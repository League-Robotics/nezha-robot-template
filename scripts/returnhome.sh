#!/usr/bin/env bash
# returnhome.sh — plan a curved return path and hand the WHOLE thing to the
# robot to drive in one go.
#
# The difference from obstacle1.sh is deliberate: that script re-fixes the
# camera before every leg, which is accurate but stops dead between waypoints.
# Here the host fixes ONCE, converts the whole planned path into the robot's
# own frame, uploads it, and says go. The robot then drives all of it back to
# back with goTo -- which drives arcs, so the result is a continuous curve
# rather than a series of turn-then-straight hops.
#
# WAYPOINT SPACING IS A STABILITY PARAMETER, and tighter is NOT safer.
# goTo turns TWICE the bearing to its target, so it overshoots by design.
# Shortening the legs raises that loop's gain until the path rings: measured
# on one route, max deviation from the intended curve was 3.1 cm at 12 cm
# spacing, 7.4 cm at 8 cm, 58.8 cm at 5 cm and 515 cm at 4 cm. Too sparse
# rings as well (the heading overshoot is not absorbed before the next leg).
# ~12 cm is the measured optimum for this robot. Simulate before trusting any
# change to it.
set -uo pipefail
export PATH="$HOME/.local/bin:$PATH"
ROBOT="${ROBOT:-tigez}"; TAG="${TAG:-57}"; CAM=arducam-ov9782-usb-camera
cd "$(dirname "$0")/.."

WP_FILE="${1:-/tmp/path.json}"   # planner output: {"wp": [[x,y], ...]} in world cm
SPEED="${SPEED:-20}"             # cm/s for the whole path
WAIT="${WAIT:-120}"              # seconds to listen after RUN:go

# Pose fixing lives in tools/fixpose.sh: it retries (the tag resolves in about
# one frame in three when the room is dim) and averages the heading over
# several frames. Both matter here -- a single missed frame aborted a run, and
# the whole open-loop path is planned off one heading reading.
fix()    { bash tools/fixpose.sh 1 40 2>/dev/null; }
fixavg() { bash tools/fixpose.sh "${1:-7}" 40; }

read -r RX RY RH <<< "$(fixavg 7)"
[ -z "${RH:-}" ] && { echo "!! no camera fix for tag $TAG"; exit 1; }
echo "robot at ($RX, $RY) heading $RH"

# World path -> the robot's frame as it stands right now. RUN:go resets the
# pose at the same instant, so this frame and the robot's are the same one.
CMDS=$(python3 -c "
import json,math,sys
rx,ry,rh=map(float,sys.argv[1:4])
wp=json.load(open(sys.argv[4]))['wp']
c,s=math.cos(math.radians(rh)),math.sin(math.radians(rh))
print('RUN:clr')
for x,y in wp:
    dx,dy=x-rx,y-ry
    print('RUN:wp:%.2f:%.2f'%(dx*c+dy*s, -dx*s+dy*c))
print('RUN:go')
" "$RX" "$RY" "$RH" "$WP_FILE")

n=$(grep -c '^RUN:wp' <<< "$CMDS")
echo "uploading $n waypoints, then executing"

# One connection for the whole exchange: reconnecting per line would cost more
# than the drive itself. Small gap between lines so the firmware's line reader
# keeps up; a long tail after RUN:go to watch the path run.
{
  printf "RUN:speed:%s\n" "$SPEED"; sleep 1
  while IFS= read -r line; do printf "%s\n" "$line"; sleep 0.35; done <<< "$CMDS"
  sleep "$WAIT"
} | mbdeploy connect --remote "$ROBOT" 2>&1 | grep -E "OBS1|boot" | grep -vE "^OBS1:wp [0-9]+$" 

# Final orientation, closed on the camera. In-place turns scatter by 10-18
# degrees, which is why none appear inside the path -- but at the END the
# robot has stopped and the camera can verify, so the error is correctable
# rather than fatal. Retry until it is within tolerance.
if [ -n "${FINAL_H:-}" ]; then
  echo
  for try in 1 2 3; do
    read -r cx cy ch <<< "$(fix)"
    [ -z "${ch:-}" ] && { echo "  no fix for the orientation turn"; break; }
    T=$(python3 -c "import sys;print('%.1f'%((float(sys.argv[2])-float(sys.argv[1])+180)%360-180))" "$ch" "$FINAL_H")
    printf "  orient: at h=%s, want %s -> turn %s\n" "$ch" "$FINAL_H" "$T"
    awk "BEGIN{exit !(($T)<6 && ($T)>-6)}" && { echo "  orientation good"; break; }
    { printf "RUN:turn:%s\n" "$T"; sleep 11; } | mbdeploy connect --remote "$ROBOT" >/dev/null 2>&1
  done
fi

echo
read -r FX FY FH <<< "$(fix)"
python3 -c "
import json,math,sys
wp=json.load(open(sys.argv[4]))['wp'][-1]
if sys.argv[1]:
    print('FINAL robot (%s, %s) h=%s — %.1f cm from the planned end (%.1f, %.1f)'%(
        sys.argv[1],sys.argv[2],sys.argv[3],
        math.hypot(float(sys.argv[1])-wp[0],float(sys.argv[2])-wp[1]),wp[0],wp[1]))
else: print('FINAL robot tag not detected')
" "${FX:-}" "${FY:-}" "${FH:-}" "$WP_FILE"
