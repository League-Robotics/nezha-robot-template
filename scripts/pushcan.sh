#!/usr/bin/env bash
# pushcan.sh — approach a can and nudge it to a target, entirely open-loop.
#
# THE CAMERA IS NOT IN THE CONTROL LOOP. It is used exactly twice: once before
# anything moves, to seed the starting pose (in a real deployment the robot
# knows where it started), and once at the end to score the result. Between
# those the robot drives on its own odometry with no host and no vision,
# because the system has to work where there is no camera. Nothing here
# "turns until the camera agrees" -- that is checking, not driving.
#
# Consequently there is NO in-place turn before the push. Open-loop in-place
# turns are the worst primitive on this robot (move(0,deg) scattered -17.9,
# +8.1, +5.0 over three identical commands), and a push that starts a few
# degrees off sends the can sideways. Instead the approach is planned to
# ARRIVE ON THE PUSH BEARING (tools/planpose.py), so the push is simply
# "keep driving straight" -- one continuous move, never turning in contact,
# which is what threw a can off the mat on 2026-09-03.
set -uo pipefail
export PATH="$HOME/.local/bin:$PATH"
ROBOT="${ROBOT:-tigez}"; TAG="${TAG:-57}"; CAM=arducam-ov9782-usb-camera
cd "$(dirname "$0")/.."

WP_FILE="${1:-/tmp/path.json}"
PUSH_CM="${2:?usage: pushcan.sh <path.json> <push_cm>}"
CRUISE="${CRUISE:-18}"      # cm/s for the approach
PUSH_SPEED="${PUSH_SPEED:-8}"  # cm/s for the push; a hard shove tips the can

# --- seed pose (camera use #1 of 2) ---------------------------------------
read -r RX RY RH <<< "$(bash tools/fixpose.sh 7 40)"
[ -z "${RH:-}" ] && { echo "!! no seed fix"; exit 1; }
echo "seed pose ($RX, $RY) h=$RH"

PLAN_H=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['h0'])" "$WP_FILE")
DRIFT=$(python3 -c "import sys;print('%.2f'%abs((float(sys.argv[1])-float(sys.argv[2])+180)%360-180))" "$RH" "$PLAN_H")
if awk "BEGIN{exit !($DRIFT > 3)}"; then
  echo "!! robot has moved since planning (heading differs by $DRIFT deg) — replan first"; exit 1
fi

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
echo "uploading $(grep -c '^RUN:wp' <<< "$CMDS") waypoints"

# Approach, then the push -- one connection, no camera, no host decisions.
{
  printf "RUN:speed:%s\n" "$CRUISE"; sleep 1
  while IFS= read -r line; do printf "%s\n" "$line"; sleep 0.35; done <<< "$CMDS"
  sleep "${GO_WAIT:-60}"
  printf "RUN:speed:%s\n" "$PUSH_SPEED"; sleep 2
  printf "RUN:push:%s\n" "$PUSH_CM"; sleep "${PUSH_WAIT:-30}"
} | mbdeploy connect --remote "$ROBOT" 2>&1 | grep -E "OBS1|boot" | grep -vE "^OBS1:wp [0-9]+$"

# --- score it (camera use #2 of 2) ----------------------------------------
echo
read -r FX FY FH <<< "$(bash tools/fixpose.sh 5 40 2>/dev/null)"
python3 -c "
import json,math,sys
d=json.load(open(sys.argv[4]))
tx,ty=d['target']; th=d.get('target_h')
if sys.argv[1]:
    print('robot finished (%s, %s) h=%s'%(sys.argv[1],sys.argv[2],sys.argv[3]))
else:
    print('robot: tag not detected')
" "${FX:-}" "${FY:-}" "${FH:-}" "$WP_FILE"
