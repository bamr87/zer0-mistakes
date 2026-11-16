#!/bin/bash
# test/test_audit.sh — unit tests for the theme-audit capability
# Runs against synthetic fixtures under test/fixtures/consumer-{gem,remote}/,
# plus temporary consumers built from the live theme _data/ (section 15).
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

# The assertions read the output from a here-string, not `echo "$actual" |`.
# Under `set -o pipefail`, grep -q exits on the first match and closes the
# pipe, so echo dies of SIGPIPE whenever the match comes before the end of a
# large output (the 56 KB manifest): the pipeline then reads as failed, and an
# early-matching assertion failed at random.
assert_output_contains() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"
    if grep -qF -- "$expected" <<< "$actual"; then
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
    if grep -qF -- "$unexpected" <<< "$actual"; then
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
# Vendored theme data (#556): listed, and checksummed like the themable files.
assert_output_contains "manifest: contains vendored_data_paths" "vendored_data_paths:" "$output"
assert_output_contains "manifest: lists theme_backgrounds.yml as vendored data" \
    "  - _data/theme_backgrounds.yml" "$output"
assert_output_contains "manifest: checksums cover vendored data" \
    '_data/theme_backgrounds.yml: "' "$output"

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
echo "--- 15. Vendored theme data: STALE / MISSING / MISSING_KEYS ---"

# Jekyll 3.10 never loads a theme's _data/, so a consumer reads the theme's data
# only from its own copy, which freezes on the day it was made; the audit never
# looked at _data/ (#556). The consumer is built from the live theme files, so
# the fixture cannot rot as the theme's data moves on.
ESC=$(printf '\033')
strip_ansi() { sed "s/${ESC}\[[0-9;]*m//g"; }
HAVE_RUBY=0
command -v ruby >/dev/null 2>&1 && HAVE_RUBY=1

THEME_DATA="$REPO_ROOT/_data"
DATA_FIX=$(mktemp -d)
mkdir -p "$DATA_FIX/_data"
printf 'title: "vendored data fixture"\nremote_theme: bamr87/zer0-mistakes\n' \
    > "$DATA_FIX/_config.yml"
# STALE: a copy taken before the theme's latest edit (here, its last line).
sed '$d' "$THEME_DATA/theme_backgrounds.yml" > "$DATA_FIX/_data/theme_backgrounds.yml"
# MISSING: no copy of _data/theme_skins.yml at all.
# MISSING_KEYS: a customised ui-text.yml that kept one of the theme's labels.
printf 'en:\n  skip_links: "Jump links"\n' > "$DATA_FIX/_data/ui-text.yml"

data_audit() {
    "$AUDIT_BIN" --consumer-path "$DATA_FIX" --theme-path "$REPO_ROOT" \
        --mode remote_theme "$@"
}

data_output=$(data_audit --format text 2>&1 | strip_ansi || true)
assert_output_contains "data: a stale copy reports STALE" \
    "[STALE] _data/theme_backgrounds.yml" "$data_output"
assert_output_contains "data: an absent registry reports MISSING" \
    "[MISSING] _data/theme_skins.yml" "$data_output"

if [[ "$HAVE_RUBY" == "1" ]]; then
    assert_output_contains "data: a customised ui-text.yml reports MISSING_KEYS" \
        "[MISSING_KEYS] _data/ui-text.yml" "$data_output"
    keys_line=$(printf '%s\n' "$data_output" | grep 'absent from en:' || true)
    theme_key_count=$(ruby -ryaml -e \
        'puts YAML.safe_load(File.read(ARGV[0]), aliases: true)["en"].size' \
        "$THEME_DATA/ui-text.yml")
    assert_output_contains "data: counts every key the consumer lacks" \
        "$((theme_key_count - 1)) key(s) absent from en:" "$keys_line"
    assert_output_contains "data: names a key the consumer lacks" \
        "skip_main_content" "$keys_line"
    assert_output_not_contains "data: never names a key the consumer kept" \
        "skip_links" "$keys_line"
else
    info "ruby unavailable — skipping the MISSING_KEYS assertions"
fi

data_audit --strict > /dev/null 2>&1 && data_strict_exit=0 || data_strict_exit=$?
assert_exit_code "data: --strict fails on STALE vendored data" "1" "$data_strict_exit"

gh_output=$(data_audit --format github 2>/dev/null || true)
assert_output_contains "data: github format warns on STALE" \
    "::warning file=_data/theme_backgrounds.yml::STALE" "$gh_output"
assert_output_contains "data: github format notes MISSING" \
    "::notice file=_data/theme_skins.yml::MISSING" "$gh_output"
if [[ "$HAVE_RUBY" == "1" ]]; then
    assert_output_contains "data: github format warns on MISSING_KEYS" \
        "::warning file=_data/ui-text.yml::MISSING_KEYS" "$gh_output"
fi

# Data gets its own JSON array: for data, IDENTICAL means "current, keep it",
# so it must never sit in `results`, where IDENTICAL means "safe to delete".
data_json=$(data_audit --format json 2>/dev/null || true)
if command -v python3 >/dev/null 2>&1; then
    json_verdict=$(printf '%s' "$data_json" | HAVE_RUBY="$HAVE_RUBY" python3 -c '
import json, os, sys
report = json.load(sys.stdin)
data = {entry["path"]: entry for entry in report["vendored_data"]}
assert data["_data/theme_backgrounds.yml"]["status"] == "STALE", data
assert data["_data/theme_skins.yml"]["status"] == "MISSING", data
assert not [e for e in report["results"] if e["path"].startswith("_data/")]
if os.environ.get("HAVE_RUBY") == "1":
    ui = data["_data/ui-text.yml"]
    assert ui["status"] == "MISSING_KEYS", ui
    assert "skip_main_content" in ui["missing_keys"], ui
    assert "skip_links" not in ui["missing_keys"], ui
print("ok")
' 2>&1 || true)
    assert_equals "data: json reports vendored data in its own array" "ok" "$json_verdict"
else
    info "python3 unavailable — skipping the vendored_data JSON assertion"
fi

stale_sum=$(cksum < "$DATA_FIX/_data/theme_backgrounds.yml")
data_dry_output=$(data_audit --fix --dry-run 2>&1 | strip_ansi || true)
assert_output_contains "data: --fix --dry-run lists the refresh" \
    "Would refresh vendored data from the theme: _data/theme_backgrounds.yml" "$data_dry_output"
if [[ "$(cksum < "$DATA_FIX/_data/theme_backgrounds.yml")" == "$stale_sum" \
      && ! -e "$DATA_FIX/_data/theme_skins.yml" ]]; then
    pass "data: --fix --dry-run writes no file"
else
    fail "data: --fix --dry-run wrote a file"
fi

ui_sum=$(cksum < "$DATA_FIX/_data/ui-text.yml")
data_audit --fix > /dev/null 2>&1 || true
if cmp -s "$THEME_DATA/theme_backgrounds.yml" "$DATA_FIX/_data/theme_backgrounds.yml"; then
    pass "data: --fix refreshes the STALE copy from the theme"
else
    fail "data: --fix left _data/theme_backgrounds.yml stale"
fi
if cmp -s "$THEME_DATA/theme_skins.yml" "$DATA_FIX/_data/theme_skins.yml"; then
    pass "data: --fix copies the MISSING registry from the theme"
else
    fail "data: --fix did not copy _data/theme_skins.yml"
fi
assert_equals "data: --fix never rewrites a customised ui-text.yml" \
    "$ui_sum" "$(cksum < "$DATA_FIX/_data/ui-text.yml")"

fixed_output=$(data_audit --format text 2>&1 | strip_ansi || true)
assert_output_contains "data: the refreshed copy reads IDENTICAL" \
    "[IDENTICAL] _data/theme_backgrounds.yml" "$fixed_output"
assert_output_contains "data: the copied registry reads IDENTICAL" \
    "[IDENTICAL] _data/theme_skins.yml" "$fixed_output"
assert_output_not_contains "data: nothing STALE after --fix" "[STALE]" "$fixed_output"

# MISSING_KEYS is warn-only: a consumer may reword labels and add keys at its
# own pace, so it must not fail a CI gate that STALE data does.
data_audit --strict > /dev/null 2>&1 && fixed_strict_exit=0 || fixed_strict_exit=$?
assert_exit_code "data: MISSING_KEYS alone never fails --strict" "0" "$fixed_strict_exit"
rm -rf "$DATA_FIX"

# ---------------------------------------------------------------------------
echo ""
echo "--- 15b. A vendored data fork declared in .theme-overrides.yml is kept ---"

JUST_FIX=$(mktemp -d)
mkdir -p "$JUST_FIX/_data"
printf 'remote_theme: bamr87/zer0-mistakes\n' > "$JUST_FIX/_config.yml"
printf 'overrides:\n  - path: "_data/theme_backgrounds.yml"\n    reason: "site palette"\n' \
    > "$JUST_FIX/.theme-overrides.yml"
sed '$d' "$THEME_DATA/theme_backgrounds.yml" > "$JUST_FIX/_data/theme_backgrounds.yml"
cp "$THEME_DATA/theme_skins.yml" "$JUST_FIX/_data/theme_skins.yml"
just_sum=$(cksum < "$JUST_FIX/_data/theme_backgrounds.yml")

just_output=$("$AUDIT_BIN" --consumer-path "$JUST_FIX" --theme-path "$REPO_ROOT" \
    --mode remote_theme --fix 2>&1 | strip_ansi || true)
assert_output_contains "data: a declared fork reads DIFFERS_JUSTIFIED" \
    "[DIFFERS_JUSTIFIED] _data/theme_backgrounds.yml" "$just_output"
assert_equals "data: --fix keeps a declared fork" \
    "$just_sum" "$(cksum < "$JUST_FIX/_data/theme_backgrounds.yml")"
"$AUDIT_BIN" --consumer-path "$JUST_FIX" --theme-path "$REPO_ROOT" \
    --mode remote_theme --strict > /dev/null 2>&1 && just_strict_exit=0 || just_strict_exit=$?
assert_exit_code "data: a declared fork does not fail --strict" "0" "$just_strict_exit"
rm -rf "$JUST_FIX"

# ---------------------------------------------------------------------------
echo ""
echo "--- 15c. vendored_data_paths comes from the manifest, with a fallback ---"

STUB_DATA_THEME=$(mktemp -d)
mkdir -p "$STUB_DATA_THEME/_data"
cp "$THEME_DATA/theme_skins.yml" "$THEME_DATA/theme_backgrounds.yml" "$STUB_DATA_THEME/_data/"
cat > "$STUB_DATA_THEME/_data/theme-manifest.yml" <<'STUB_MANIFEST'
version: "0.0.0-test"
themable_paths:
  - _layouts
vendored_data_paths:
  - _data/theme_skins.yml
STUB_MANIFEST
BARE_CONSUMER=$(mktemp -d)
printf 'remote_theme: bamr87/zer0-mistakes\n' > "$BARE_CONSUMER/_config.yml"

listed_output=$("$AUDIT_BIN" --consumer-path "$BARE_CONSUMER" --theme-path "$STUB_DATA_THEME" \
    --mode remote_theme 2>&1 | strip_ansi || true)
assert_output_contains "data: audits what the manifest lists" \
    "[MISSING] _data/theme_skins.yml" "$listed_output"
assert_output_not_contains "data: audits only what the manifest lists" \
    "_data/theme_backgrounds.yml" "$listed_output"

# A manifest snapshot cut before the key existed (1.31.x) falls back to the
# list scripts/lib/audit.sh keeps.
sed -i.bak '/^vendored_data_paths:/,$d' "$STUB_DATA_THEME/_data/theme-manifest.yml"
rm -f "$STUB_DATA_THEME/_data/theme-manifest.yml.bak"
fallback_output=$("$AUDIT_BIN" --consumer-path "$BARE_CONSUMER" --theme-path "$STUB_DATA_THEME" \
    --mode remote_theme 2>&1 | strip_ansi || true)
assert_output_contains "data: a manifest without the key falls back to the built-in list" \
    "[MISSING] _data/theme_backgrounds.yml" "$fallback_output"
rm -rf "$STUB_DATA_THEME" "$BARE_CONSUMER"

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
