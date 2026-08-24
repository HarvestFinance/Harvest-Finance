#!/usr/bin/env bash
# TypeScript gate for pre-commit hooks.
#
# Runs `tsc --noEmit` for the backend project and compares the resulting
# error signatures (file + TS error code, ignoring line numbers so small
# edits do not cause churn) against the checked-in baseline
# `tsc-baseline.txt`. Exits non-zero if a NEW signature appears.
#
# Refresh the baseline deliberately after paying down errors:
#   cd harvest-finance/backend && npm run typecheck:baseline

set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASELINE="${BACKEND_DIR}/tsc-baseline.txt"

cd "${BACKEND_DIR}"

raw="$(npx tsc --noEmit 2>&1 || true)"
signatures="$(printf '%s\n' "${raw}" \
  | grep -oE '^src/[^ ]+\.ts\([0-9]+,[0-9]+\): error TS[0-9]+' \
  | sed -E 's/\([0-9]+,[0-9]+\)//' \
  | LC_ALL=C sort -u)"

if [[ ! -f "${BASELINE}" ]]; then
  echo "tsc-gate: missing baseline file ${BASELINE}." >&2
  echo "Generate it with: cd harvest-finance/backend && npm run typecheck:baseline" >&2
  printf '%s\n' "${signatures}" > /tmp/opencode/tsc-now.txt 2>/dev/null || true
  exit 1
fi

new_errors="$(comm -13 <(LC_ALL=C sort -u "${BASELINE}") <(printf '%s\n' "${signatures}" | LC_ALL=C sort -u))"

if [[ -n "${new_errors//[[:space:]]/}" ]]; then
  echo "tsc-gate: your changes introduce NEW TypeScript errors:" >&2
  printf '%s\n' "${new_errors}" >&2
  echo "Fix them before committing. (Pre-existing errors are listed in" >&2
  echo "harvest-finance/backend/tsc-baseline.txt — never extend it casually.)" >&2
  exit 1
fi

echo "tsc-gate: OK (no new type errors vs baseline)"
