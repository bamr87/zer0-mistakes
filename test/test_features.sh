#!/bin/bash
#
# test_features.sh — Feature registry integrity suite.
#
# Guards the single-source-of-truth feature registry that powers /features/:
#   1. Registry integrity — delegates to scripts/validate-features.rb
#      (master/_data byte-sync, schema, every active reference path exists,
#      removed features carry removed_in, provenance/tests warnings).
#   2. README count sync — features/README.md "Current count" must match the
#      number of ZER0-NNN entries in the registry.
#   3. Backlog visibility — reports how many entries still lack provenance/tests
#      (non-fatal) so progress on PR B / PR C is observable in CI logs.
#
# Exit codes:
#   0 — registry integrity holds (warnings allowed unless FEATURES_STRICT=1)
#   1 — a hard invariant was violated
#
# Governance: .github/instructions/features.instructions.md

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

OVERALL_STATUS=0

section() { echo ""; echo "==> $1"; }
ok()      { echo -e "  ${GREEN}✓${NC} $1"; }
bad()     { echo -e "  ${RED}✗${NC} $1"; OVERALL_STATUS=1; }
note()    { echo -e "  ${YELLOW}…${NC} $1"; }

cd "$PROJECT_ROOT"

# The registry checker needs only the Ruby stdlib (yaml, date) — no project
# gems — so we call `ruby` directly. It is written to tolerate both the macOS
# system Ruby (2.6) and CI/Docker (3.x). Using `bundle exec` here would only
# add a needless dependency on an installed bundle.
RUBY=(ruby)

# ---------------------------------------------------------------------------
# Layer 1 — Registry integrity (canonical checker)
# ---------------------------------------------------------------------------
section "Registry integrity (scripts/validate-features.rb)"
if "${RUBY[@]}" scripts/validate-features.rb; then
    ok "Registry integrity checks passed"
else
    bad "Registry integrity checks failed"
fi

# ---------------------------------------------------------------------------
# Layer 2 — README feature-count sync
# ---------------------------------------------------------------------------
section "features/README.md count sync"
actual_count="$(grep -c '^  - id: ZER0-' _data/features.yml)"
readme_count="$(grep -oE 'Current count: \*\*[0-9]+ features\*\*' features/README.md | grep -oE '[0-9]+' | head -1)"
if [[ -z "$readme_count" ]]; then
    bad "Could not find 'Current count: **N features**' line in features/README.md"
elif [[ "$actual_count" == "$readme_count" ]]; then
    ok "README count ($readme_count) matches registry ($actual_count)"
else
    bad "README count ($readme_count) != registry entry count ($actual_count) — update features/README.md"
fi

# ---------------------------------------------------------------------------
# Layer 3 — Backlog visibility (non-fatal)
# ---------------------------------------------------------------------------
section "Provenance / test backfill progress (informational)"
"${RUBY[@]}" - <<'RUBY' || true
require 'date'; require 'yaml'
data = begin
  YAML.load_file('_data/features.yml', permitted_classes: [Date, Time], aliases: true)
rescue ArgumentError
  YAML.load_file('_data/features.yml')
end
feats = data['features']
active = feats.reject { |f| f['implemented'] == false }
prov = active.count { |f| f['provenance'].is_a?(Hash) }
tested = active.count do |f|
  t = f['tests']
  t.is_a?(Array) && t.any? { |x| x.is_a?(String) ? File.exist?(x) : (x.is_a?(Hash) && x['na']) }
end
puts "  provenance: #{prov}/#{active.length} active features  (target PR B: all)"
puts "  tests:      #{tested}/#{active.length} active features  (target PR C: all)"
RUBY

# ---------------------------------------------------------------------------
# Layer 4 — Reverse-traceability source tags
# ---------------------------------------------------------------------------
section "Source-file Feature tags (scripts/tag-features --check)"
if "${RUBY[@]}" scripts/tag-features --check; then
    ok "Every referenced source file carries its Feature: ZER0-NNN comment"
else
    bad "Referenced source file(s) missing a Feature tag — run: ruby scripts/tag-features --write"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
if [[ $OVERALL_STATUS -eq 0 ]]; then
    echo -e "${GREEN}Feature registry tests: PASSED${NC}"
else
    echo -e "${RED}Feature registry tests: FAILURES DETECTED${NC}"
fi
echo "============================================================"
exit $OVERALL_STATUS
