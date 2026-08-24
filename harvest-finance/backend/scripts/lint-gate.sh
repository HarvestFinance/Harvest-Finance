#!/usr/bin/env bash
# ESLint gate for pre-commit hooks (baseline-aware).
#
# Runs ESLint over the backend project and compares error signatures
# (file + rule id, ignoring line numbers so small edits don't cause churn)
# against the checked-in baseline `eslint-baseline.txt`. Exits non-zero if
# a NEW signature appears. Pre-existing debt does not block commits;
# introducing new violations does.
#
# Refresh the baseline deliberately after paying down errors:
#   cd harvest-finance/backend && npm run lint:baseline

set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASELINE="${BACKEND_DIR}/eslint-baseline.txt"

cd "${BACKEND_DIR}"

signatures="$( (npx eslint --format json "src/**/*.ts" 2>/dev/null || true) \
  | node scripts/eslint-signatures.js)"

if [[ ! -f "${BASELINE}" ]]; then
  echo "lint-gate: missing baseline file ${BASELINE}." >&2
  echo "Generate it with: cd harvest-finance/backend && npm run lint:baseline" >&2
  exit 1
fi

new_errors="$(comm -13 <(LC_ALL=C sort -u "${BASELINE}") <(printf '%s\n' "${signatures}" | LC_ALL=C sort -u))"

if [[ -n "${new_errors//[[:space:]]/}" ]]; then
  echo "lint-gate: your changes introduce NEW ESLint errors:" >&2
  printf '%s\n' "${new_errors}" >&2
  echo "Fix them before committing. (Pre-existing errors are listed in" >&2
  echo "harvest-finance/backend/eslint-baseline.txt — never extend it casually.)" >&2
  exit 1
fi

echo "lint-gate: OK (no new ESLint errors vs baseline)"
