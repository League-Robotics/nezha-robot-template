#!/usr/bin/env bash
# attempt.sh — one full try: aim, plan, generate the program, flash, drive, score.
#
# The robot program has the path BAKED IN as a list of goTo legs (that is the
# point -- it reads like something a student wrote). So the plan and the
# program are one artefact: if the robot is not where the plan assumed, the
# program is wrong and must be regenerated. This script keeps those in step.
#
# The camera appears exactly twice, and never inside the driving: once to
# measure the start pose so the path can be planned, and once at the end to
# score the result. Between those the robot is on its own.
set -uo pipefail
export PATH="$HOME/.local/bin:$PATH"
ROBOT="${ROBOT:-tigez}"
cd "$(dirname "$0")/.."
V=/Volumes/Proj/proj/RobotProjects/aprilcam/.venv/bin/python
WANT_H="${WANT_H:-200}"     # start heading that crosses the can gap squarely
CRUISE="${CRUISE:-18}"; PUSH_SPEED="${PUSH_SPEED:-8}"

say() { printf "\n=== %s ===\n" "$1"; }

say "where is the can"
: > /tmp/cans.txt
while read -r cx cy n; do
  r=$($V tools/findcan.py --near "$cx" "$cy" --search 9 2>/dev/null)
  [ -n "$r" ] && { echo "$r" >> /tmp/cans.txt; printf "  circle %-3s %s\n" "$n" "$r"; }
done <<'EOF'
15.62 -21.59 1
21.88 1.52 2
24.75 17.69 3
7.76 1.29 4
-6.26 -13.31 5
-6.61 0.81 6
-6.72 15.31 7
-15.16 27.05 8
-34.74 0.86 9
-46.42 -19.2 10
-56.49 0.39 11
-46.68 20.17 12
EOF

TARGET=$($V - <<'PY'
import math
CAN=None
for l in open("/tmp/cans.txt"):
    x,y=map(float,l.split())
    if math.dist((x,y),(-34.74,0.86))<9: CAN=(x,y)
if CAN is None: raise SystemExit("no can near circle 9")
C12=(-46.68,20.17); S=16.0; NOSE=9.5
d=(C12[0]-CAN[0],C12[1]-CAN[1]); L=math.hypot(*d); u=(d[0]/L,d[1]/L)
st=(CAN[0]-S*u[0], CAN[1]-S*u[1])
print("%.3f %.3f %.3f %.3f"%(st[0],st[1],math.degrees(math.atan2(d[1],d[0])),S+L-NOSE))
PY
) || exit 1
read -r SX SY BRG PUSH <<< "$TARGET"
printf "  stage (%.2f, %.2f) heading %.2f, push %.1f cm\n" "$SX" "$SY" "$BRG" "$PUSH"

say "aim roughly south, then measure"
# Aim within a few degrees of WANT_H. Not camera-closed steering -- the turn
# is open-loop and its error does not matter, because the path is planned from
# whatever heading actually results. This only gets the robot into the rough
# attitude where a gentle curve to the can exists at all.
# It gets two goes because one open-loop turn scatters 10-18 degrees, and on
# attempt 1 an empty pose fix made the turn amount garbage and the step was
# skipped in silence -- planning from due west and losing 1.4 cm of clearance.
for _try in 1 2; do
  read -r X Y H <<< "$(bash tools/fixpose.sh 5 40 2>/dev/null)"
  [ -z "${H:-}" ] && { echo "  !! no fix while aiming"; exit 1; }
  T=$($V -c "import sys;print('%.0f'%((float(sys.argv[2])-float(sys.argv[1])+180)%360-180))" "$H" "$WANT_H")
  printf "  h=%s want %s -> turn %s\n" "$H" "$WANT_H" "$T"
  case "$T" in ''|*[!0-9-]*) echo "  !! bad turn value"; exit 1;; esac
  [ "${T#-}" -le 4 ] && break
  { printf "RUN:turn:%s\n" "$T"; sleep 12; } | mbdeploy connect --remote "$ROBOT" >/dev/null 2>&1
done
read -r X Y H <<< "$(bash tools/fixpose.sh 7 40 2>/dev/null)"
[ -z "${H:-}" ] && { echo "!! no fix"; exit 1; }
printf "  start pose (%s, %s) h=%s\n" "$X" "$Y" "$H"

say "plan"
PLANNED=""
for sp in 12 10 14; do
  if $V tools/planpose.py "$X" "$Y" "$H" "$SX" "$SY" "$BRG" "$sp" 4; then PLANNED=1; break; fi
done
[ -z "$PLANNED" ] && { echo "!! no plan clears the field from here"; exit 1; }

say "program"
$V tools/emit_program.py /tmp/path.json "$PUSH" "$CRUISE" "$PUSH_SPEED" > src/obstacle1.ts
cat src/obstacle1.ts

say "build and flash"
npm run build 2>&1 | tail -2
mbdeploy deploy --remote "$ROBOT" --hex built/binary.hex 2>&1 | tail -1

say "verify the robot did not shift during the flash"
read -r X2 Y2 H2 <<< "$(bash tools/fixpose.sh 7 40 2>/dev/null)"
DRIFT=$($V -c "
import sys,math
x,y,h,x2,y2,h2=map(float,sys.argv[1:])
print('%.2f %.2f'%(math.hypot(x2-x,y2-y), abs((h2-h+180)%360-180)))" "$X" "$Y" "$H" "$X2" "$Y2" "$H2")
read -r DPOS DHEAD <<< "$DRIFT"
printf "  moved %s cm, %s deg during flash\n" "$DPOS" "$DHEAD"
if $V -c "import sys;sys.exit(0 if (float(sys.argv[1])>1.5 or float(sys.argv[2])>3) else 1)" "$DPOS" "$DHEAD"; then
  echo "  !! the robot shifted -- the baked-in program no longer matches. Re-run."; exit 2
fi

say "drive"
{ printf "RUN:go\n"; sleep "${RUN_WAIT:-75}"; } | mbdeploy connect --remote "$ROBOT" 2>&1 | grep -E "OBS1|boot" || true

say "score"
read -r FX FY FH <<< "$(bash tools/fixpose.sh 5 40 2>/dev/null)"
CANPOS=$($V tools/findcan.py --near -46.68 20.17 --search 14 2>/dev/null)
$V - "$FX" "$FY" "$FH" "$CANPOS" <<'PY'
import sys, math
fx,fy,fh = sys.argv[1], sys.argv[2], sys.argv[3]
can = sys.argv[4].split() if sys.argv[4].strip() else None
print("  robot finished (%s, %s) h=%s" % (fx,fy,fh))
if can:
    cx,cy=map(float,can)
    d=math.hypot(cx-(-46.68), cy-20.17)
    print("  CAN at (%.2f, %.2f) -> %.2f cm from circle 12 centre  [%s]"
          % (cx,cy,d, "IN THE CIRCLE" if d<=3.23 else "outside (r=3.23)"))
else:
    print("  no can found near circle 12 -- it did not arrive")
PY
