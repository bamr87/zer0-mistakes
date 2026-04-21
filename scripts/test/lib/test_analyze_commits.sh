#!/bin/bash

# Unit tests for scripts/utils/analyze-commits
#
# These tests build a throwaway git repo per case so we can verify that:
#   1. The analyzer never crashes on its own log calls (regression test for
#      the silent log_info bug that caused a v1.0.0 release to be published
#      as a patch in v0.22.22).
#   2. Conventional Commits "!" breaking-change marker triggers a major bump.
#   3. Scoped types like `feat(scope):` are still recognised.
#   4. The analyzer writes ONLY the bump type to stdout (logs go to stderr),
#      so callers like the version-bump workflow can rely on
#      `BUMP=$(./analyze-commits ...)`.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANALYZER="$(cd "$SCRIPT_DIR/../../utils" && pwd)/analyze-commits"

set +e

print_suite_header "analyze-commits"

# Helper: run analyzer in an isolated git repo containing one commit with the
# given subject (and optional body). Echoes the bump type from stdout only.
_analyzer_for_commit() {
    local subject="$1"
    local body="${2:-}"

    local tmp
    tmp=$(mktemp -d)
    (
        cd "$tmp" || exit 1
        git init -q -b main 2>/dev/null || git init -q
        git config user.email "test@example.com"
        git config user.name "Test"
        git config commit.gpgsign false
        echo "seed" > seed.txt
        git add seed.txt
        git commit -q -m "chore: seed"
        echo "change" > change.txt
        git add change.txt
        if [[ -n "$body" ]]; then
            git commit -q -m "$subject" -m "$body"
        else
            git commit -q -m "$subject"
        fi
        # Run analyzer; capture stdout only (stderr goes to caller for debugging on failure)
        "$ANALYZER" HEAD~1..HEAD 2>/dev/null
    )
    local rc=$?
    rm -rf "$tmp"
    return $rc
}

_run_case() {
    local subject="$1"
    local expected="$2"
    local body="${3:-}"
    local label="$4"

    local actual
    actual=$(_analyzer_for_commit "$subject" "$body")
    assert_equals "$expected" "$actual" "$label"
}

echo "Testing conventional commit bump detection..."

_run_case "feat: add login"                            "minor" "" "feat: → minor"
_run_case "feat(auth): add login"                      "minor" "" "feat(scope): → minor"
_run_case "fix: handle null"                           "patch" "" "fix: → patch"
_run_case "fix(api): null guard"                       "patch" "" "fix(scope): → patch"
_run_case "chore: cleanup"                             "patch" "" "chore: → patch"
_run_case "docs(readme): typo"                         "patch" "" "docs(scope): → patch"
_run_case "ci(release): tweak"                         "patch" "" "ci(scope): → patch"

echo -e "\nTesting breaking-change detection..."

_run_case "feat!: drop legacy api"                     "major" "" "feat!: → major"
_run_case "feat(installer)!: modular rewrite"          "major" "" "feat(scope)!: → major"
_run_case "refactor(api)!: rename endpoint"            "major" "" "refactor(scope)!: → major"
_run_case "fix!: change return shape"                  "major" "" "fix!: → major"
_run_case "feat: redesign"                             "major" "BREAKING CHANGE: removes old config" "BREAKING CHANGE footer → major"
_run_case "feat: redesign"                             "major" "BREAKING-CHANGE: removes old config" "BREAKING-CHANGE footer → major"

echo -e "\nTesting stdout/stderr separation (regression for silent log_info bug)..."

# The whole point: with stderr discarded, stdout MUST be exactly one of
# patch|minor|major|none. If log helpers leak to stdout, this fails.
out=$(_analyzer_for_commit "feat: anything")
case "$out" in
    patch|minor|major|none) assert_true "true"  "stdout contains only the bump type" ;;
    *)                       assert_true "false" "stdout contains only the bump type (got: '$out')" ;;
esac

# And with stderr captured we should also see log lines — proving they exist
# but go to the right stream.
tmp=$(mktemp -d)
(
    cd "$tmp" || exit 1
    git init -q -b main 2>/dev/null || git init -q
    git config user.email "test@example.com"
    git config user.name "Test"
    git config commit.gpgsign false
    echo seed > a; git add a; git commit -q -m "chore: seed"
    echo x > b; git add b; git commit -q -m "feat: x"
    "$ANALYZER" HEAD~1..HEAD 2>err.log >out.log
    grep -qE "Analyzing|bump" err.log
) && assert_true "true" "Logs are written to stderr" \
   || assert_true "false" "Logs are written to stderr"
rm -rf "$tmp"
