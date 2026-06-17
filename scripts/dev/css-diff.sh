#!/usr/bin/env bash
# ============================================================================
# css-diff.sh — compiled-CSS regression guard for the SCSS refactor
# ----------------------------------------------------------------------------
# Compares two compiled main.css files (Jekyll `style: expanded` output):
#   1. POSITIONAL diff  — empty means byte-identical (ignoring blank-line/WS
#      churn). Expected for true zero-diff relocations.
#   2. SORTED-CONTENT diff — empty means the exact same set of CSS lines exists
#      in both files, only their order differs. This is the invariant we want
#      for "pure relocation" phases: no declaration value changed, a block just
#      moved position in the cascade.
#
# Usage: scripts/dev/css-diff.sh OLD.css NEW.css
# Exit:  0 if sorted-content identical (safe), 1 otherwise.
# ============================================================================
set -uo pipefail

OLD="${1:?usage: css-diff.sh OLD.css NEW.css}"
NEW="${2:?usage: css-diff.sh OLD.css NEW.css}"

# Normalize: drop blank lines, trim leading/trailing whitespace per line.
norm() { sed -e 's/[[:space:]]*$//' -e 's/^[[:space:]]*//' "$1" | grep -v '^$'; }

echo "=== POSITIONAL diff (empty = byte-identical modulo whitespace) ==="
if diff <(norm "$OLD") <(norm "$NEW"); then
  echo "(positional: identical)"
  POS=0
else
  POS=1
fi

echo ""
echo "=== SORTED-CONTENT diff (empty = same rule content, order-only change) ==="
if diff <(norm "$OLD" | sort) <(norm "$NEW" | sort); then
  echo "(sorted-content: identical — no value changed)"
  SORTED=0
else
  SORTED=1
fi

echo ""
if [ "$POS" -eq 0 ]; then
  echo "RESULT: zero-diff (identical output)."
elif [ "$SORTED" -eq 0 ]; then
  echo "RESULT: relocation-only (content identical, order changed). Review positional diff for cascade safety."
else
  echo "RESULT: CONTENT CHANGED. Review the sorted-content diff above — declarations were added/removed/edited."
fi
exit "$SORTED"
