#!/usr/bin/env bash
set -euo pipefail
mkdir -p .github/arena/artifacts/opencode
OUT=.github/arena/artifacts/opencode
LOG=$OUT/run.log
exec > >(tee -a "$LOG") 2>&1

start_all=$(date +%s)

# Install OpenCode if OPENCODE_CMD not provided
if [ -z "${OPENCODE_CMD-}" ]; then
  echo "No OPENCODE_CMD provided; installing opencode via npm fallback..."
  npm i -g opencode-ai@latest || true
  OPENCODE_CMD=$(command -v opencode || true)
fi

if [ -z "$OPENCODE_CMD" ]; then
  echo "OpenCode command not found. Exiting with code 2."
  exit 2
fi

node ./task-runners/run-all-tasks.js --tool opencode --cmd "$OPENCODE_CMD" --out "$OUT"

end_all=$(date +%s)
echo "Total duration: $((end_all-start_all)) seconds" > $OUT/total_time.txt
