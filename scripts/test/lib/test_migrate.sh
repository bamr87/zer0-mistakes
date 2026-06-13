#!/bin/bash

# Unit tests for migrate.sh library (T-019)
#
# Drives the pure-logic migration helpers against throwaway fixture
# directories: site detection, theme-connection classification, and
# version-gap detection. The template-rendering functions
# (install_admin_pages / verify_admin_pages) need the full template
# pipeline and are exercised by the installer e2e suites; these unit
# tests focus on the detection logic that has had zero coverage.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$(cd "$SCRIPT_DIR/../../lib" && pwd)"

export DRY_RUN=true
export INTERACTIVE=false
export VERBOSE=false

source "$LIB_DIR/common.sh"
source "$LIB_DIR/migrate.sh"

set +e

print_suite_header "migrate.sh"

_mktmp() { mktemp -d "${TMPDIR:-/tmp}/migrate-test-XXXXXX"; }

# --- detect_jekyll_site ---------------------------------------------------
echo "Testing detect_jekyll_site..."

d=$(_mktmp)
assert_false "detect_jekyll_site '$d'" "No _config.yml → not a Jekyll site"

touch "$d/_config.yml"
assert_false "detect_jekyll_site '$d'" "_config.yml alone is not enough"

touch "$d/Gemfile"
assert_true "detect_jekyll_site '$d'" "_config.yml + Gemfile → Jekyll site"
rm -rf "$d"

d=$(_mktmp); touch "$d/_config.yml"; mkdir -p "$d/_layouts"
assert_true "detect_jekyll_site '$d'" "_config.yml + _layouts/ → Jekyll site"
rm -rf "$d"

# --- validate_theme_connection -------------------------------------------
echo "Testing validate_theme_connection..."

d=$(_mktmp)
printf 'remote_theme: "bamr87/zer0-mistakes"\n' > "$d/_config.yml"
assert_true "validate_theme_connection '$d'" "remote_theme detected"
validate_theme_connection "$d" >/dev/null 2>&1
assert_equals "remote" "$THEME_CONNECTION_TYPE" "remote connection type set"
rm -rf "$d"

d=$(_mktmp)
printf 'theme: jekyll-theme-zer0\n' > "$d/_config.yml"
assert_true "validate_theme_connection '$d'" "gem theme detected"
validate_theme_connection "$d" >/dev/null 2>&1
assert_equals "gem" "$THEME_CONNECTION_TYPE" "gem connection type set"
rm -rf "$d"

d=$(_mktmp)
printf 'title: My Site\n' > "$d/_config.yml"
printf 'gem "jekyll-theme-zer0", path: "../theme"\n' > "$d/Gemfile"
assert_true "validate_theme_connection '$d'" "local path gem detected"
validate_theme_connection "$d" >/dev/null 2>&1
assert_equals "local" "$THEME_CONNECTION_TYPE" "local connection type set"
rm -rf "$d"

d=$(_mktmp)
printf 'title: Unrelated Site\n' > "$d/_config.yml"
assert_false "validate_theme_connection '$d'" "no theme connection → 1"
rm -rf "$d"

# --- detect_version_gap ---------------------------------------------------
echo "Testing detect_version_gap..."

d=$(_mktmp)
assert_true "detect_version_gap '$d'" "no Gemfile.lock → pass (cannot check)"

printf '    jekyll-theme-zer0 (1.14.0)\n' > "$d/Gemfile.lock"
assert_true "detect_version_gap '$d'" "modern version >= min → pass"

printf '    jekyll-theme-zer0 (0.22.5)\n' > "$d/Gemfile.lock"
assert_false "detect_version_gap '$d'" "version below 0.22.10 min → gap detected"
rm -rf "$d"

echo -e "\n${GREEN}migrate.sh tests complete${NC}"
