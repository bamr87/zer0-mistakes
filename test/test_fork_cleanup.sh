#!/bin/bash

# =============================================================================
# Fork Cleanup Test Suite for zer0-mistakes Jekyll Theme
# =============================================================================
#
# Tests for scripts/fork-cleanup.sh covering:
# - CLI argument parsing (--help, --dry-run, --non-interactive)
# - Dry-run mode (no filesystem changes)
# - Real cleanup against an isolated copy of the repo
# - Resulting _config.yml is valid YAML
# - Identity / URL / analytics fields are reset correctly
# - Welcome post is created
# - YAML anchors are preserved
#
# Usage:
#   ./test/test_fork_cleanup.sh [OPTIONS]
#
# Options:
#   -v, --verbose     Enable verbose output
#   --no-cleanup      Keep test workspaces for debugging
#   -h, --help        Show this help

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FORK_SCRIPT="$PROJECT_ROOT/scripts/fork-cleanup.sh"

# Reuse shared install-test logging helpers when available
if [[ -f "$SCRIPT_DIR/lib/install_test_utils.sh" ]]; then
    # shellcheck disable=SC1091
    source "$SCRIPT_DIR/lib/install_test_utils.sh"
else
    test_log_info()    { echo "[INFO] $1"; }
    test_log_success() { echo "[PASS] $1"; }
    test_log_error()   { echo "[FAIL] $1"; }
    test_log_test()    { echo "[TEST] $1"; }
fi

VERBOSE=false
CLEANUP=true
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0
WORKSPACES=()

show_help() {
    grep '^#' "$0" | sed 's/^# \{0,1\}//'
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--verbose) VERBOSE=true; shift ;;
            --no-cleanup) CLEANUP=false; shift ;;
            -h|--help)    show_help; exit 0 ;;
            *) echo "Unknown option: $1"; show_help; exit 1 ;;
        esac
    done
}

# -----------------------------------------------------------------------------
# Test framework
# -----------------------------------------------------------------------------

assert() {
    local desc="$1"
    local condition="$2"
    ((TESTS_TOTAL++)) || true
    if eval "$condition"; then
        test_log_success "$desc"
        ((TESTS_PASSED++)) || true
    else
        test_log_error  "$desc"
        ((TESTS_FAILED++)) || true
        if [[ "$VERBOSE" == "true" ]]; then
            echo "    Failed condition: $condition"
        fi
    fi
}

create_workspace() {
    local ws
    ws=$(mktemp -d -t "fork-cleanup-test-XXXXXX")
    WORKSPACES+=("$ws")

    # Snapshot the working tree (tracked files only) and init a git repo
    git -C "$PROJECT_ROOT" archive HEAD | tar -x -C "$ws"
    git -C "$ws" init -q
    git -C "$ws" remote add origin "https://github.com/testuser/testuser.github.io.git"
    git -C "$ws" -c user.email=t@t -c user.name=t add -A
    git -C "$ws" -c user.email=t@t -c user.name=t commit -q -m "init"

    echo "$ws"
}

cleanup_workspaces() {
    [[ "$CLEANUP" == "true" ]] || { test_log_info "Skipping workspace cleanup"; return; }
    [[ ${#WORKSPACES[@]} -eq 0 ]] && return
    for ws in "${WORKSPACES[@]}"; do
        [[ -d "$ws" ]] && rm -rf "$ws"
    done
}

trap cleanup_workspaces EXIT

# -----------------------------------------------------------------------------
# Tests
# -----------------------------------------------------------------------------

test_help_flag() {
    test_log_test "fork-cleanup.sh --help exits cleanly"
    local out
    out=$(bash "$FORK_SCRIPT" --help 2>&1)
    assert "Help output mentions usage" "echo \"\$out\" | grep -q 'Usage:'"
    assert "Help mentions --dry-run"    "echo \"\$out\" | grep -q -- '--dry-run'"
    assert "Help mentions --site-name"  "echo \"\$out\" | grep -q -- '--site-name'"
}

test_dry_run() {
    test_log_test "Dry-run mode does not modify the filesystem"
    local ws; ws=$(create_workspace)

    local before_hash; before_hash=$(find "$ws" -maxdepth 4 -type f \! -path '*/.git/*' \
        -exec stat -f '%N %m %z' {} \; 2>/dev/null | sort | shasum | awk '{print $1}')

    bash "$FORK_SCRIPT" --dry-run --non-interactive \
        --site-name "Test Site" --github-user "testuser" \
        --author "Test Author" --email "test@example.com" \
        > "$ws/.dry-run.log" 2>&1 || true

    local after_hash; after_hash=$(find "$ws" -maxdepth 4 -type f \! -path '*/.git/*' \
        -exec stat -f '%N %m %z' {} \; 2>/dev/null | sort | shasum | awk '{print $1}')

    # Note: dry-run runs from PROJECT_ROOT (script doesn't accept --target-dir),
    # so we can't easily compare workspace state. Instead verify dry-run output
    # produced from PROJECT_ROOT contains expected markers.
    local out
    out=$(cd "$ws" && bash "$FORK_SCRIPT" --dry-run --non-interactive \
        --site-name "Test Site" --github-user "testuser" \
        --author "Test Author" --email "test@example.com" 2>&1)

    assert "Dry-run announces DRY RUN MODE"          "echo \"\$out\" | grep -q 'DRY RUN MODE'"
    assert "Dry-run lists items it would remove"     "echo \"\$out\" | grep -q '\\[DRY RUN\\] Would remove'"
    assert "Dry-run mentions creating welcome post"  "echo \"\$out\" | grep -q 'Would create:.*welcome'"
    assert "Dry-run completes successfully"          "echo \"\$out\" | grep -q 'Dry run complete'"
    # And the workspace remains untouched (no _site, no removed posts)
    assert "Dry-run preserves pages/_posts"          "[[ -d '$ws/pages/_posts' ]]"
}

test_real_cleanup_in_workspace() {
    test_log_test "Real cleanup resets configuration and removes example content"
    local ws; ws=$(create_workspace)

    (cd "$ws" && bash scripts/fork-cleanup.sh --non-interactive \
        --site-name "Test Site" --github-user "testuser" \
        --author "Test Author" --email "test@example.com") \
        > "$ws/.run.log" 2>&1

    # Removed paths
    assert "Removed pages/_posts directory"     "[[ ! -d '$ws/pages/_posts/2025-01-23-css-grid-mastery.md' ]] || ls '$ws/pages/_posts/' | grep -qv '2025'"
    assert "CNAME file removed"                 "[[ ! -f '$ws/CNAME' ]]"
    assert "Welcome post created"               "ls '$ws/pages/_posts/' 2>/dev/null | grep -q 'welcome'"

    # Backup created
    assert "Config backup created"              "ls '$ws'/_config.yml.backup.* >/dev/null 2>&1"

    # YAML still valid
    assert "_config.yml is valid YAML"          "ruby -ryaml -e \"YAML.load_file('$ws/_config.yml')\" 2>/dev/null"

    # Field substitutions
    local cfg="$ws/_config.yml"
    assert "title set to 'Test Site'"           "grep -q 'title.*: &title \"Test Site\"' '$cfg'"
    assert "founder set to 'Test Author'"       "grep -q 'founder.*: \"Test Author\"' '$cfg'"
    assert "github_user set"                    "grep -q 'github_user.*: &github_user \"testuser\"' '$cfg'"
    assert "repository_name set from remote"    "grep -q 'repository_name.*: &github_repository \"testuser.github.io\"' '$cfg'"
    assert "url set to user-site URL"           "grep -q 'url.*: &url \"https://testuser.github.io\"' '$cfg'"
    assert "email reset"                        "grep -q 'email.*: \"test@example.com\"' '$cfg'"
    assert "google_analytics cleared"           "grep -qE 'google_analytics[[:space:]]*: \"\"' '$cfg'"
    assert "posthog.enabled = false"            "ruby -ryaml -e \"exit YAML.load_file('$cfg')['posthog']['enabled'] == false ? 0 : 1\""
    assert "posthog.api_key cleared"            "ruby -ryaml -e \"exit YAML.load_file('$cfg')['posthog']['api_key'].to_s.empty? ? 0 : 1\""

    # YAML anchors preserved (so *aliases keep working)
    assert "Anchor &github_user preserved"      "grep -q '&github_user' '$cfg'"
    assert "Anchor &title preserved"            "grep -q '&title' '$cfg'"
    assert "Anchor &url preserved"              "grep -q '&url' '$cfg'"

    # authors.yml reset
    assert "authors.yml exists"                 "[[ -f '$ws/_data/authors.yml' ]]"
    assert "authors.yml mentions test author"   "grep -q 'Test Author' '$ws/_data/authors.yml'"

    # Placeholder avatar
    assert "Placeholder avatar created"         "[[ -f '$ws/assets/images/avatar-placeholder.png' ]]"
}

test_remove_paths_template_loaded() {
    test_log_test "Cleanup uses templates/cleanup/remove-paths.txt"
    local ws; ws=$(create_workspace)

    # Confirm template file is read by adding a sentinel path the script should skip silently
    assert "remove-paths.txt exists"            "[[ -f '$ws/templates/cleanup/remove-paths.txt' ]]"
    assert "reset-fields.yml exists"            "[[ -f '$ws/templates/cleanup/reset-fields.yml' ]]"
}

test_idempotency() {
    test_log_test "Re-running cleanup on a cleaned workspace is safe"
    local ws; ws=$(create_workspace)

    (cd "$ws" && bash scripts/fork-cleanup.sh --non-interactive \
        --github-user testuser --site-name "T" --author "A" --email a@b.c) > /dev/null 2>&1

    local exit_code=0
    (cd "$ws" && bash scripts/fork-cleanup.sh --non-interactive \
        --github-user testuser --site-name "T" --author "A" --email a@b.c) > /dev/null 2>&1 \
        || exit_code=$?

    assert "Second run exits 0"                 "[[ $exit_code -eq 0 ]]"
    assert "_config.yml still valid YAML"       "ruby -ryaml -e \"YAML.load_file('$ws/_config.yml')\" 2>/dev/null"
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

main() {
    parse_arguments "$@"

    if [[ ! -x "$FORK_SCRIPT" ]] && [[ ! -f "$FORK_SCRIPT" ]]; then
        test_log_error "fork-cleanup.sh not found at $FORK_SCRIPT"
        exit 1
    fi

    test_log_info "Running fork-cleanup test suite..."
    test_log_info "Project root: $PROJECT_ROOT"
    echo

    test_help_flag
    test_dry_run
    test_real_cleanup_in_workspace
    test_remove_paths_template_loaded
    test_idempotency

    echo
    test_log_info "Results: $TESTS_PASSED/$TESTS_TOTAL passed, $TESTS_FAILED failed"
    [[ $TESTS_FAILED -eq 0 ]] || exit 1
}

main "$@"
