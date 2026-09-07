#!/usr/bin/env bash
# gotocal.sh — measure what diffDrive.goTo() actually drives.
#
# WHY THIS EXISTS: the first return-home run drove 14 goTo waypoints open-loop
# and finished 54 cm from the plan, on the wrong side of the field, while the
# robot's own odometry insisted it had hit the last waypoint exactly. Odometry
# that is self-consistent but wrong means the arc the robot drives is not the
# arc the host planned. So measure the arc instead of assuming it.
#
# The model under test, for goTo(fwd, left) from pose (0,0,0):
#   drive a circular arc to (fwd, left), ending turned by 2*atan2(left, fwd).
#
# Each probe re-stages to the same pose first, so the probes are comparable
# and none of them wanders into a can.
set -uo pipefail
export PATH="$HOME/.local/bin:$PATH"
ROBOT="${ROBOT:-tigez}"; TAG="${TAG:-57}"; CAM=arducam-ov9782-usb-camera
cd "$(dirname "$0")/.."

STAGE_X="${STAGE_X:-10}"; STAGE_Y="${STAGE_Y:-20}"; STAGE_H="${STAGE_H:-0}"

fix() { aprilcam camera tags $CAM 2>/dev/null | python3 -c "
import re,sys,math
p=re.compile(r'apriltag\s+'+sys.argv[1]+r'\s+world=\(\s*([-0-9.]+),\s*([-0-9.]+)\)\s+yaw=([-0-9.]+)')
for l in sys.stdin:
    m=p.search(l)
    if m: print('%s %s %.2f'%(m.group(1),m.group(2),math.degrees(float(m.group(3))))); break
" "$TAG"; }

conn() { (cat; sleep "${2:-2}") <<< "$1" | mbdeploy connect --remote "$ROBOT" 2>&1 | grep -E "OBS1"; }

stage() {  # turn+push to the staging pose, then face STAGE_H. Uses the
           # primitives that measure accurate (push 10 -> 10.0 cm), not goTo.
  for attempt in 1 2; do
    read -r rx ry rh <<< "$(fix)"
    [ -z "${rh:-}" ] && { echo "  no fix"; return 1; }
    read -r T D <<< "$(python3 -c "
import math,sys
rx,ry,rh,tx,ty=map(float,sys.argv[1:])
print('%.1f %.1f'%(((math.degrees(math.atan2(ty-ry,tx-rx))-rh+180)%360-180), math.hypot(tx-rx,ty-ry)))" \
      "$rx" "$ry" "$rh" "$STAGE_X" "$STAGE_Y")"
    awk "BEGIN{exit !($D < 2.5)}" && break
    { printf "RUN:turn:%s\n" "$T"; sleep 11; printf "RUN:push:%s\n" "$D"; sleep 20; } \
      | mbdeploy connect --remote "$ROBOT" >/dev/null 2>&1
  done
  read -r rx ry rh <<< "$(fix)"
  T=$(python3 -c "import sys;print('%.1f'%((float(sys.argv[2])-float(sys.argv[1])+180)%360-180))" "$rh" "$STAGE_H")
  { printf "RUN:turn:%s\n" "$T"; sleep 11; } | mbdeploy connect --remote "$ROBOT" >/dev/null 2>&1
  read -r rx ry rh <<< "$(fix)"
  printf "  staged (%6.1f,%6.1f) h=%6.1f\n" "$rx" "$ry" "$rh"
}

probe() {  # probe <fwd> <left>
  local fwd="$1" left="$2"
  stage || return 1
  read -r bx by bh <<< "$(fix)"
  { printf "RUN:goto:%s:%s\n" "$fwd" "$left"; sleep 20; } \
    | mbdeploy connect --remote "$ROBOT" 2>&1 | grep -E "OBS1:leg|OBS1:goto" | sed 's/^/      /'
  read -r ax ay ah <<< "$(fix)"
  [ -z "${ah:-}" ] && { echo "      no fix after probe"; return 1; }
  python3 -c "
import math,sys
fwd,left,bx,by,bh,ax,ay,ah=map(float,sys.argv[1:])
c,s=math.cos(math.radians(bh)),math.sin(math.radians(bh))
dx,dy=ax-bx,ay-by
afwd, aleft = dx*c+dy*s, -dx*s+dy*c
aturn=(ah-bh+180)%360-180
pturn=math.degrees(2*math.atan2(left,fwd))
print('  goTo(%5.1f,%5.1f): achieved (%6.2f,%6.2f)  turn %7.2f   [model wanted (%5.1f,%5.1f) turn %6.1f]'
      % (fwd,left,afwd,aleft,aturn,fwd,left,pturn))
print('      dist ratio %.3f   turn ratio %s' % (
      math.hypot(afwd,aleft)/math.hypot(fwd,left),
      ('%.3f'%(aturn/pturn)) if abs(pturn)>1e-6 else 'n/a'))
" "$fwd" "$left" "$bx" "$by" "$bh" "$ax" "$ay" "$ah"
}

{ printf "RUN:speed:%s\n" "${SPEED:-15}"; sleep 3; } | mbdeploy connect --remote "$ROBOT" >/dev/null 2>&1
echo "=== goTo calibration on $ROBOT (stage ${STAGE_X},${STAGE_Y} h=${STAGE_H}) ==="
for p in "$@"; do IFS=, read -r f l <<< "$p"; echo; probe "$f" "$l"; done
