#!/usr/bin/env bash
# orient.sh — turn the robot to a world heading, closed on the camera.
#
# In-place move(0,deg) scatters by 10-18 degrees open-loop (measured over three
# commanded-identical turns: -17.9, +8.1, +5.0). That is fatal mid-path, which
# is why paths are planned tangent to the current heading instead. But with the
# robot stopped and the camera watching, the error is simply correctable:
# measured convergence was -136.9 -> 7 deg -> 4 deg over three iterations.
set -uo pipefail
export PATH="$HOME/.local/bin:$PATH"
ROBOT="${ROBOT:-tigez}"
cd "$(dirname "$0")/.."
WANT="${1:?usage: orient.sh <world-heading-deg> [tolerance]}"
TOL="${2:-3}"

for try in 1 2 3 4 5; do
  read -r x y h <<< "$(bash tools/fixpose.sh 5 40 2>/dev/null)"
  [ -z "${h:-}" ] && { echo "!! no camera fix"; exit 1; }
  T=$(python3 -c "import sys;print('%.1f'%((float(sys.argv[2])-float(sys.argv[1])+180)%360-180))" "$h" "$WANT")
  printf "  at (%s, %s) h=%s -> want %s, turn %s\n" "$x" "$y" "$h" "$WANT" "$T"
  if awk "BEGIN{exit !(($T)<=$TOL && ($T)>=-$TOL)}"; then echo "  on heading."; exit 0; fi
  { printf "RUN:turn:%s\n" "$T"; sleep 11; } | mbdeploy connect --remote "$ROBOT" >/dev/null 2>&1
done
echo "  (did not converge within tolerance)"
