#!/usr/bin/env bash
# ESLint --fix wrapper used by lint-staged: applies auto-fixes to the given
# files but ALWAYS exits 0, so pre-existing lint errors don't abort the
# commit or revert the fixes. Whether the commit is actually allowed is
# decided separately by scripts/lint-gate.sh (new-errors-vs-baseline).
set -u
cd "$(dirname "${BASH_SOURCE[0]}")/.."
npx eslint --fix "$@" || true
exit 0
