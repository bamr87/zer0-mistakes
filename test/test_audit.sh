#!/bin/bash
# test/test_audit.sh — unit tests for the theme-audit capability
# Runs against synthetic fixtures under test/fixtures/consumer-{gem,remote}/
# Registered in test/test_runner.sh as the "audit" suite.
#
# Usage: ./test/test_audit.sh [--verbose]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FIXTURES_DIR="$SCRIPT_DIR/fixtures"
AUDIT_BIN="$REPO_ROOT/scripts/bin/audit-consumer"
MANIFEST_BIN="$REPO_ROOT/scripts/bin/manifest"
LIB_DIR="$REPO_ROOT/scripts/lib"

source "$LIB_DIR/common.sh"

# ---------------------------------------------------------------------------
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

pass() {
    TESTS_RUN=$((TESTS_RUN + 1))
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo -e "${GREEN}  ✓${NC} $1"
}

fail() {
    TESTS_RUN=$((TESTS_RUN + 1))
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAILURES+=("$1")
    echo -e "${RED}  ✗${NC} $1"
}

assert_output_contains() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"
    if echo "$actual" | grep -qF "$expected"; then
        pass "$test_name"
    else
        fail "$test_name (expected '$expected' in output)"
        if [[ "${VERBOSE:-false}" == "true" ]]; then
            echo "    Actual output:"
            echo "$actual" | sed 's/^/    /'
        fi
    fi
}

assert_output_not_contains() {
    local test_name="$1"
    local unexpected="$2"
    local actual="$3"
    if echo "$actual" | grep -qF "$unexpected"; then
        fail "$test_name (unexpected '$unexpected' in output)"
        if [[ "${VERBOSE:-false}" == "true" ]]; then
            echo "    Actual output:"
            echo "$actual" | sed 's/^/    /'
        fi
    else
        pass "$test_name"
    fi
}

assert_equals() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"
    if [[ "$actual" == "$expected" ]]; then
        pass "$test_name"
    else
        fail "$test_name (expected '$expected', got '$actual')"
    fi
}

assert_exit_code() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"
    if [[ "$actual" == "$expected" ]]; then
        pass "$test_name"
    else
        fail "$test_name (expected exit $expected, got $actual)"
    fi
}

# ---------------------------------------------------------------------------
echo ""
step "=== Theme Audit Test Suite ==="
echo ""

# ---------------------------------------------------------------------------
echo "--- 1. Manifest generation ---"

output=$("$MANIFEST_BIN" --dry-run 2>&1)
assert_output_contains "manifest: contains version" "version:" "$output"
assert_output_contains "manifest: contains themable_paths" "themable_paths:" "$output"
assert_output_contains "manifest: contains plugin_paths" "plugin_paths:" "$output"
assert_output_contains "manifest: contains config_schema" "config_schema:" "$output"
assert_output_contains "manifest: contains file_checksums" "file_checksums:" "$output"

# --dry-run stdout must be pure YAML: the freshness gate diffs it straight
# against the committed manifest, so a stray log line would fail every run.
# No `| head -1` here: this suite runs under `set -o pipefail`, and head closing
# the pipe early makes the generator die on SIGPIPE (exit 141), aborting the run.
dry_output=$("$MANIFEST_BIN" --dry-run 2>/dev/null)
first_line="${dry_output%%$'\n'*}"
assert_output_contains "manifest: --dry-run stdout starts with YAML" "# _data/theme-manifest.yml" "$first_line"

# ---------------------------------------------------------------------------
echo ""
echo "--- 1b. Manifest freshness (--check) ---"

# The committed manifest sat at 1.14.0 while the theme shipped to 1.27.0, which
# silently invalidated every checksum the consumer audit relies on. --check is
# the guard; it must pass on a current tree and fail on a doctored one.
"$MANIFEST_BIN" --check > /dev/null 2>&1 && check_exit=0 || check_exit=$?
assert_exit_code "manifest --check passes on a current manifest" "0" "$check_exit"

TMP_MANIFEST_BAK=$(mktemp)
cp "$REPO_ROOT/_data/theme-manifest.yml" "$TMP_MANIFEST_BAK"
sed -i.bak 's/^version: ".*"/version: "0.0.1"/' "$REPO_ROOT/_data/theme-manifest.yml"
rm -f "$REPO_ROOT/_data/theme-manifest.yml.bak"
"$MANIFEST_BIN" --check > /dev/null 2>&1 && stale_exit=0 || stale_exit=$?
cp "$TMP_MANIFEST_BAK" "$REPO_ROOT/_data/theme-manifest.yml"
rm -f "$TMP_MANIFEST_BAK"
assert_exit_code "manifest --check fails on a stale manifest" "1" "$stale_exit"

# ---------------------------------------------------------------------------
echo ""
echo "--- 2. Gem-mode consumer: IDENTICAL detection ---"

output=$("$AUDIT_BIN" \
    --consumer-path "$FIXTURES_DIR/consumer-gem" \
    --theme-path    "$REPO_ROOT" \
    --mode          gem \
    --format        text 2>&1 || true)

assert_output_contains "gem: flags IDENTICAL default.html" "IDENTICAL" "$output"

# ---------------------------------------------------------------------------
echo ""
echo "--- 3. Gem-mode consumer: DIFFERS_UNJUSTIFIED detection ---"

assert_output_contains "gem: flags DIFFERS_UNJUSTIFIED home.html" "DIFFERS_UNJUSTIFIED" "$output"

# ---------------------------------------------------------------------------
echo ""
echo "--- 4. Gem-mode consumer: UNIQUE detection ---"

assert_output_contains "gem: flags UNIQUE my-custom.html" "UNIQUE" "$output"

# ---------------------------------------------------------------------------
echo ""
echo "--- 5. Gem-mode consumer: plugins NOT_REQUIRED ---"

assert_output_contains "gem: plugins NOT_REQUIRED" "NOT_REQUIRED" "$output"

# ---------------------------------------------------------------------------
echo ""
echo "--- 6. Gem-mode --strict exits non-zero on DIFFERS_UNJUSTIFIED ---"

set +e
"$AUDIT_BIN" \
    --consumer-path "$FIXTURES_DIR/consumer-gem" \
    --theme-path    "$REPO_ROOT" \
    --mode          gem \
    --strict 2>&1 >/dev/null
strict_exit=$?
set -e
assert_exit_code "gem --strict exits non-zero" "1" "$strict_exit"

# ---------------------------------------------------------------------------
echo ""
echo "--- 7. Remote-theme consumer: opt-in plugins are never MISSING_PLUGIN ---"

output=$("$AUDIT_BIN" \
    --consumer-path "$FIXTURES_DIR/consumer-remote" \
    --theme-path    "$REPO_ROOT" \
    --mode          remote_theme \
    --format        text 2>&1 || true)

# The fixture does not vendor obsidian_links.rb. That is CORRECT for a stock
# remote_theme consumer: GitHub Pages builds in safe mode and loads no local
# plugins, so the file could not run even if it were present. The manifest
# therefore declares nothing required, and a missing opt-in plugin must report
# OPTIONAL_PLUGIN. Flagging it MISSING_PLUGIN produced a false positive on
# seven fleet consumers with no Obsidian content at all.
assert_output_contains "remote: missing opt-in plugin reports OPTIONAL_PLUGIN" \
    "OPTIONAL_PLUGIN" "$output"
assert_output_not_contains "remote: no MISSING_PLUGIN for opt-in plugins" \
    "MISSING_PLUGIN" "$output"

# ---------------------------------------------------------------------------
echo ""
echo "--- 7b. MISSING_PLUGIN still fires for a genuinely required plugin ---"

# Nothing is required by default, so drive the code path with a stub theme
# whose manifest declares one.
STUB_THEME=$(mktemp -d)
mkdir -p "$STUB_THEME/_data" "$STUB_THEME/_plugins"
echo "# stub" > "$STUB_THEME/_plugins/obsidian_links.rb"
cat > "$STUB_THEME/_data/theme-manifest.yml" <<'STUB_MANIFEST'
version: "0.0.0-test"
themable_paths:
  - _layouts
required_plugin_paths:
  - _plugins/obsidian_links.rb
optional_plugin_paths:
  - _plugins/theme_version.rb
STUB_MANIFEST

stub_output=$("$AUDIT_BIN" \
    --consumer-path "$FIXTURES_DIR/consumer-remote" \
    --theme-path    "$STUB_THEME" \
    --mode          remote_theme \
    --format        text 2>&1 || true)
rm -rf "$STUB_THEME"

assert_output_contains "required plugin absent still flags MISSING_PLUGIN" \
    "MISSING_PLUGIN" "$stub_output"

# ---------------------------------------------------------------------------
echo ""
echo "--- 8. Remote-theme consumer: OK plugin ---"

assert_output_contains "remote: flags OK for theme_version.rb" "OK" "$output"

# ---------------------------------------------------------------------------
echo ""
echo "--- 9. Remote-theme --strict exits non-zero on unjustified drift ---"

set +e
"$AUDIT_BIN" \
    --consumer-path "$FIXTURES_DIR/consumer-remote" \
    --theme-path    "$REPO_ROOT" \
    --mode          remote_theme \
    --strict 2>&1 >/dev/null
remote_strict_exit=$?
set -e
assert_exit_code "remote --strict exits non-zero" "1" "$remote_strict_exit"

# ---------------------------------------------------------------------------
echo ""
echo "--- 10. JSON output format ---"

output=$("$AUDIT_BIN" \
    --consumer-path "$FIXTURES_DIR/consumer-gem" \
    --theme-path    "$REPO_ROOT" \
    --mode          gem \
    --format        json 2>&1 || true)

assert_output_contains "json: contains results key" '"results"' "$output"
assert_output_contains "json: contains status key" '"status"' "$output"

# ---------------------------------------------------------------------------
echo ""
echo "--- 11. --dry-run does not delete files ---"

TMPDIR_FIX=$(mktemp -d)
cp -r "$FIXTURES_DIR/consumer-gem/." "$TMPDIR_FIX/"
BEFORE=$(ls "$TMPDIR_FIX/_layouts/" 2>/dev/null | wc -l)

"$AUDIT_BIN" \
    --consumer-path "$TMPDIR_FIX" \
    --theme-path    "$REPO_ROOT" \
    --mode          gem \
    --fix --dry-run 2>&1 >/dev/null || true

AFTER=$(ls "$TMPDIR_FIX/_layouts/" 2>/dev/null | wc -l)
rm -rf "$TMPDIR_FIX"

if [[ "$BEFORE" == "$AFTER" ]]; then
    pass "--dry-run: no files deleted from fixture copy"
else
    fail "--dry-run: files were deleted ($BEFORE -> $AFTER)"
fi

# ---------------------------------------------------------------------------
echo ""
echo "--- 12. --fix deletes IDENTICAL files ---"

TMPDIR_FIX=$(mktemp -d)
cp -r "$FIXTURES_DIR/consumer-gem/." "$TMPDIR_FIX/"

"$AUDIT_BIN" \
    --consumer-path "$TMPDIR_FIX" \
    --theme-path    "$REPO_ROOT" \
    --mode          gem \
    --fix 2>&1 >/dev/null || true

if [[ ! -f "$TMPDIR_FIX/_layouts/default.html" ]]; then
    pass "--fix: deleted IDENTICAL _layouts/default.html"
else
    fail "--fix: IDENTICAL file not deleted"
fi

# DIFFERS_UNJUSTIFIED file should NOT be deleted
if [[ -f "$TMPDIR_FIX/_layouts/home.html" ]]; then
    pass "--fix: preserved DIFFERS_UNJUSTIFIED _layouts/home.html"
else
    fail "--fix: DIFFERS_UNJUSTIFIED file was incorrectly deleted"
fi

rm -rf "$TMPDIR_FIX"

# ---------------------------------------------------------------------------
echo ""
echo "--- 13. detect_consumer_mode tolerates real-world YAML styles ---"

# shellcheck source=/dev/null
source "$LIB_DIR/audit.sh"

MODE_FIX=$(mktemp -d)

# Column-aligned YAML: the style most fleet consumers actually use. A bare
# `^remote_theme:` regex never matched it, so every one of them was silently
# misreported as gem mode — which skipped the plugin checks entirely.
mkdir -p "$MODE_FIX/padded"
printf 'title: "t"\nremote_theme             : "bamr87/zer0-mistakes@v1.26.0"\n' \
    > "$MODE_FIX/padded/_config.yml"
assert_equals "mode: padded-colon YAML detects remote_theme" \
    "remote_theme" "$(detect_consumer_mode "$MODE_FIX/padded")"

mkdir -p "$MODE_FIX/compact"
printf 'remote_theme: bamr87/zer0-mistakes\n' > "$MODE_FIX/compact/_config.yml"
assert_equals "mode: compact YAML detects remote_theme" \
    "remote_theme" "$(detect_consumer_mode "$MODE_FIX/compact")"

# `remote_theme: false` is how a consumer turns the remote theme off and
# resolves the theme as a gem instead.
mkdir -p "$MODE_FIX/disabled"
printf 'remote_theme             : false\ntheme: jekyll-theme-zer0\n' \
    > "$MODE_FIX/disabled/_config.yml"
assert_equals "mode: remote_theme=false resolves to gem" \
    "gem" "$(detect_consumer_mode "$MODE_FIX/disabled")"

mkdir -p "$MODE_FIX/commented"
printf '# remote_theme: bamr87/zer0-mistakes\ntheme: jekyll-theme-zer0\n' \
    > "$MODE_FIX/commented/_config.yml"
assert_equals "mode: commented-out remote_theme resolves to gem" \
    "gem" "$(detect_consumer_mode "$MODE_FIX/commented")"

# `source:` relocates the whole Jekyll tree; auditing the repo root instead
# reports a falsely clean result.
mkdir -p "$MODE_FIX/sourced"
printf 'source: pages\ntheme: jekyll-theme-zer0\n' > "$MODE_FIX/sourced/_config.yml"
assert_equals "source: is read from _config.yml" \
    "pages" "$(detect_consumer_source "$MODE_FIX/sourced")"
assert_equals "source: absent yields empty" \
    "" "$(detect_consumer_source "$MODE_FIX/compact")"

rm -rf "$MODE_FIX"

# ---------------------------------------------------------------------------
echo ""
echo "--- 14. --format json emits parseable JSON ---"

json_output=$("$AUDIT_BIN" \
    --consumer-path "$FIXTURES_DIR/consumer-remote" \
    --theme-path    "$REPO_ROOT" \
    --mode          remote_theme \
    --format        json 2>/dev/null || true)

# Entries used to carry a trailing comma each, so the array always closed on
# `},\n]}` — which no JSON parser accepts.
if command -v python3 >/dev/null 2>&1; then
    if printf '%s' "$json_output" | python3 -c 'import json,sys; json.load(sys.stdin)' 2>/dev/null; then
        pass "json: output parses as valid JSON"
    else
        fail "json: output parses as valid JSON"
        if [[ "${VERBOSE:-false}" == "true" ]]; then
            printf '%s\n' "$json_output" | tail -5 | sed 's/^/    /'
        fi
    fi
else
    info "python3 unavailable — skipping JSON parse assertion"
fi

assert_output_not_contains "json: no dangling comma before the closing bracket" \
    "}," "$(printf '%s' "$json_output" | tr -d ' \n' | grep -o '},\]}' || true)"

# ---------------------------------------------------------------------------
echo ""
step "=== Audit Test Results ==="
echo "  Tests run:    $TESTS_RUN"
echo "  Tests passed: $TESTS_PASSED"
echo "  Tests failed: $TESTS_FAILED"

if [[ "$TESTS_FAILED" -gt 0 ]]; then
    echo ""
    error "Failed tests:"
    for f in "${FAILURES[@]}"; do
        echo "  - $f"
    done
fi

[[ "$TESTS_FAILED" -eq 0 ]]
