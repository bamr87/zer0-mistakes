#!/usr/bin/env bash
# =============================================================================
# test/test_installer.sh — Installer regression matrix
# =============================================================================
# Validates every install profile produces a clean, exit-0 install with the
# expected agent files + deploy artifacts. Run with --ai to also exercise
# the OpenAI wizard (requires OPENAI_API_KEY).
# =============================================================================

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL="${ROOT}/scripts/bin/install"
TMP="${TMPDIR:-/tmp}/zer0-installer-test"
WITH_AI=0
PASS=0
FAIL=0
VERBOSE=0

# Auto-enable AI tier when an OpenAI key is in scope (skip otherwise).
[[ -n "${OPENAI_API_KEY:-}" ]] && WITH_AI=1

while [[ $# -gt 0 ]]; do
    case "$1" in
        --ai)        WITH_AI=1 ;;
        --no-ai)     WITH_AI=0 ;;
        --verbose|-v) VERBOSE=1 ;;
        # Tolerate flags forwarded by test_runner.sh (not used here)
        --coverage|-c|--retry-failed|-r|--fail-fast|--baseline-compare|--skip-docker|--skip-remote) ;;
        --format|-f|--timeout|-t|--suites|-s|--environment|-e) shift ;;
        --help|-h)
            sed -n '2,8p' "${BASH_SOURCE[0]}" | sed 's/^# *//'
            echo "Flags: --ai | --no-ai | --verbose"
            exit 0
            ;;
    esac
    shift
done

c_red=$'\033[31m'; c_grn=$'\033[32m'; c_dim=$'\033[2m'; c_off=$'\033[0m'
pass() { printf "  %s✓%s %s\n" "$c_grn" "$c_off" "$1"; PASS=$((PASS+1)); }
fail() { printf "  %s✗%s %s\n" "$c_red" "$c_off" "$1"; FAIL=$((FAIL+1)); }

echo "── Syntax check (all modules)"
syntax_fail=0
while IFS= read -r f; do
    bash -n "$f" 2>/dev/null || { fail "syntax: $f"; syntax_fail=1; }
done < <(find "${ROOT}/scripts/install" "${ROOT}/scripts/bin" -name "*.sh" -o -path "*/bin/install")
[[ $syntax_fail -eq 0 ]] && pass "all installer modules parse"

echo
echo "── Profile init matrix"
for profile in default minimal blog docs portfolio github-pages; do
    out="${TMP}/${profile}"
    rm -rf "$out"
    if "$INSTALL" init "$out" --profile "$profile" \
            --non-interactive --skip-doctor --force >/dev/null 2>&1; then
        cnt=$(find "$out" -type f 2>/dev/null | wc -l | tr -d ' ')
        [[ -f "${out}/.zer0/install.spec.json" ]] && \
            pass "profile=$profile  files=$cnt  spec=ok" || \
            fail "profile=$profile  spec missing"
    else
        fail "profile=$profile  exit!=0"
    fi
done

echo
echo "── Deploy plugins (via --deploy flag)"
for tgt in github-pages azure-swa docker-prod; do
    out="${TMP}/deploy-${tgt}"
    rm -rf "$out"
    "$INSTALL" init "$out" --profile minimal --deploy "$tgt" \
        --non-interactive --skip-doctor --force >/dev/null 2>&1
    case "$tgt" in
        github-pages) marker="${out}/.github/workflows/jekyll-gh-pages.yml" ;;
        azure-swa)    marker="${out}/.github/workflows/azure-static-web-apps.yml" ;;
        docker-prod)  marker="${out}/Dockerfile.prod" ;;
    esac
    [[ -f "$marker" ]] && pass "deploy=$tgt  wrote=$(basename "$marker")" \
        || fail "deploy=$tgt  missing: $marker"
done

echo
echo "── Agent plugins (via --agents flag)"
for agent in generic copilot claude cursor aider; do
    out="${TMP}/agent-${agent}"
    rm -rf "$out"
    "$INSTALL" init "$out" --profile minimal --agents "$agent" \
        --non-interactive --skip-doctor --force >/dev/null 2>&1
    case "$agent" in
        generic) marker="${out}/AGENTS.md" ;;
        copilot) marker="${out}/.github/copilot-instructions.md" ;;
        claude)  marker="${out}/CLAUDE.md" ;;
        cursor)  marker="${out}/.cursor/rules/zer0.mdc" ;;
        aider)   marker="${out}/.aider.conf.yml" ;;
    esac
    [[ -f "$marker" ]] && pass "agent=$agent  wrote=$(basename "$marker")" \
        || fail "agent=$agent  missing: $marker"
done

if [[ $WITH_AI -eq 1 ]]; then
    echo
    echo "── AI wizard (requires OPENAI_API_KEY)"
    if [[ -z "${OPENAI_API_KEY:-}" ]]; then
        fail "OPENAI_API_KEY not set"
    else
        out="${TMP}/wizard"
        rm -rf "$out"
        if "$INSTALL" wizard "$out" --profile blog \
                --site-title "Wizard Test" --site-author "CI" \
                --github-user test --github-repo wizard \
                --ai --non-interactive --skip-doctor --force >/dev/null 2>&1; then
            [[ -f "${out}/.zer0/install.spec.json" ]] && pass "wizard spec written" \
                || fail "wizard spec missing"
            [[ -f "${out}/AGENTS.md" ]] && pass "wizard agents applied" \
                || fail "wizard agents missing"
        else
            fail "wizard exit!=0"
        fi
    fi
fi

echo
printf "── %d passed, %d failed%s\n" "$PASS" "$FAIL" "$c_off"
[[ $FAIL -eq 0 ]]
