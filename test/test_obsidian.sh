#!/bin/bash
#
# test_obsidian.sh — Orchestrator for the Obsidian integration test suite.
#
# Runs three layers:
#   1. Ruby converter unit tests (test/test_ruby_converter.rb) — validates
#      _plugins/obsidian_links.rb in isolation. These run regardless of
#      whether the Jekyll build picks up custom _plugins.
#   2. JS resolver unit tests (test/test_resolver.js) — validates
#      assets/js/obsidian-wiki-links.js against a representative wiki-index
#      payload using a small DOM shim.
#   3. Build smoke test — runs `jekyll build` and asserts that
#      assets/data/wiki-index.json is generated and well-formed (the input
#      the client-side resolver depends on).
#
# Exit codes:
#   0 — all layers passed
#   1 — one or more layers failed
#

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SITE_DIR="$PROJECT_ROOT/_site"

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

# Ensure local-user gem bin is on PATH (matches CI).
if ! command -v bundle >/dev/null 2>&1; then
    export PATH="$HOME/.local/share/gem/ruby/3.2.0/bin:$PATH"
fi

# ---------------------------------------------------------------------------
# Layer 1 — Ruby converter unit tests
# ---------------------------------------------------------------------------
section "Ruby converter unit tests (test_ruby_converter.rb)"
if command -v bundle >/dev/null 2>&1; then
    if bundle exec ruby test/test_ruby_converter.rb; then
        ok "Ruby converter unit tests passed"
    else
        bad "Ruby converter unit tests failed"
    fi
else
    note "bundle not found — skipping Ruby converter tests"
fi

# ---------------------------------------------------------------------------
# Layer 2 — JS resolver unit tests
# ---------------------------------------------------------------------------
section "JS resolver unit tests (test_resolver.js)"
if command -v node >/dev/null 2>&1; then
    if node test/test_resolver.js; then
        ok "JS resolver unit tests passed"
    else
        bad "JS resolver unit tests failed"
    fi
else
    note "node not found — skipping JS resolver tests"
fi

# ---------------------------------------------------------------------------
# Layer 3 — Build smoke test for the generated wiki-index
# ---------------------------------------------------------------------------
section "Jekyll build smoke test (wiki-index.json)"
if ! command -v bundle >/dev/null 2>&1; then
    note "bundle not found — skipping build smoke test"
else
    rm -rf "$SITE_DIR" "$PROJECT_ROOT/.jekyll-cache"
    if ! bundle exec jekyll build --config '_config.yml,_config_dev.yml' >/tmp/obsidian-build.log 2>&1; then
        cat /tmp/obsidian-build.log
        bad "Jekyll build failed"
    else
        ok "Jekyll build completed"

        index_file="$SITE_DIR/assets/data/wiki-index.json"
        if [[ -f "$index_file" ]]; then
            ok "wiki-index.json generated at $index_file"
        else
            bad "wiki-index.json missing"
        fi

        if command -v python3 >/dev/null 2>&1 && [[ -f "$index_file" ]]; then
            if python3 - "$index_file" <<'PY'
import json, sys
path = sys.argv[1]
with open(path) as f:
    data = json.load(f)
assert isinstance(data, dict), 'top-level must be object'
assert 'count' in data and 'entries' in data, 'missing required keys'
assert isinstance(data['entries'], list), 'entries must be array'
assert data['count'] == len(data['entries']), 'count mismatch'
assert data['count'] > 0, 'expected at least one entry'
required = {'title', 'basename', 'url'}
sample = data['entries'][0]
missing = required - set(sample.keys())
assert not missing, f'sample entry missing: {missing}'
print(f"OK: {data['count']} entries, sample={sample.get('url')}")
PY
            then
                ok "wiki-index.json schema valid (count, entries[], required keys)"
            else
                bad "wiki-index.json schema invalid"
            fi
        fi
    fi
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
if [[ $OVERALL_STATUS -eq 0 ]]; then
    echo -e "${GREEN}Obsidian integration tests: ALL LAYERS PASSED${NC}"
else
    echo -e "${RED}Obsidian integration tests: FAILURES DETECTED${NC}"
fi
echo "============================================================"
exit $OVERALL_STATUS
