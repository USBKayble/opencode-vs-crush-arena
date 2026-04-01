#!/usr/bin/env bash
set -euo pipefail
mkdir -p .github/arena/artifacts/crush
OUT=.github/arena/artifacts/crush
LOG=$OUT/run.log
exec > >(tee -a "$LOG") 2>&1

start_all=$(date +%s)

# Install Crush if CRUSH_CMD not provided
if [ -z "${CRUSH_CMD-}" ]; then
  echo "No CRUSH_CMD provided; installing crush via go install fallback..."
  export GOBIN=$HOME/.local/bin
  mkdir -p "$GOBIN"
  go install github.com/charmbracelet/crush@latest || true
  CRUSH_CMD="$GOBIN/crush"
fi

if [ -z "$CRUSH_CMD" ] || [ ! -x "$CRUSH_CMD" ]; then
  echo "Crush command not found. Exiting with code 2."
  exit 2
fi

node ./task-runners/run-all-tasks.js --tool crush --cmd "$CRUSH_CMD" --out "$OUT"

end_all=$(date +%s)
echo "Total duration: $((end_all-start_all)) seconds" > $OUT/total_time.txt
