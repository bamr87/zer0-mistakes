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
        docker-prod)  marker="${out}/docker/Dockerfile.prod" ;;
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

echo
echo "── AI provider resolution + text extraction (offline)"
# Run each case in its own clean subshell; emit "case=result" lines to stdout,
# then assert deterministically in the parent (avoids subshell counter loss).
_res="$(
    source "${ROOT}/scripts/install/log.sh" 2>/dev/null
    source "${ROOT}/scripts/install/ai/client.sh" 2>/dev/null
    _mb="$(mktemp -d)"; printf '#!/bin/bash\necho mock\n' > "${_mb}/claude"; chmod +x "${_mb}/claude"
    ( export PATH="${_mb}:$PATH"; unset ZER0_AI_PROVIDER SPEC_AI_PROVIDER CLAUDE_CODE_OAUTH_TOKEN ANTHROPIC_API_KEY OPENAI_API_KEY OPENAI_BASE_URL ZER0_NO_AI
      echo "auto_claude=$(ai_client_provider)" )
    ( export PATH="/usr/bin:/bin" CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-x; unset ZER0_AI_PROVIDER SPEC_AI_PROVIDER ANTHROPIC_API_KEY OPENAI_API_KEY OPENAI_BASE_URL ZER0_NO_AI
      echo "auto_oauth=$(ai_client_provider) authsrc=$(ai_client_auth_source) model=$(ai_client_model)" )
    ( export PATH="/usr/bin:/bin" OPENAI_API_KEY=sk-x; unset ZER0_AI_PROVIDER SPEC_AI_PROVIDER CLAUDE_CODE_OAUTH_TOKEN ANTHROPIC_API_KEY OPENAI_BASE_URL ZER0_NO_AI
      echo "auto_openai=$(ai_client_provider)" )
    ( export ZER0_NO_AI=1 ZER0_AI_PROVIDER=openai OPENAI_API_KEY=sk-x
      echo "killswitch=$(ai_client_provider)" )
    ( export ZER0_AI_PROVIDER=none
      echo "explicit_none=$(ai_client_provider)" )
    echo "x_openai=$(ai_client_extract_text '{"choices":[{"message":{"content":"A"}}]}')"
    echo "x_anthropic=$(ai_client_extract_text '{"content":[{"type":"text","text":"B"}]}')"
    echo "x_cli=$(ai_client_extract_text '{"result":"C"}')"
    rm -rf "${_mb}"
)"
_want="auto_claude=claude-cli
auto_openai=openai
killswitch=none
explicit_none=none
x_openai=A
x_anthropic=B
x_cli=C"
_res_ok=1
while IFS= read -r want_line; do
    [[ -z "$want_line" ]] && continue
    grep -qxF "$want_line" <<< "$_res" || { _res_ok=0; echo "    missing: $want_line"; }
done <<< "$_want"
grep -qF "auto_oauth=anthropic authsrc=CLAUDE_CODE_OAUTH_TOKEN (OAuth) model=claude-sonnet-5" <<< "$_res" || {
    _res_ok=0; echo "    missing: OAuth anthropic resolution"; }
[[ $_res_ok -eq 1 ]] && pass "AI provider resolution + extraction matrix" \
    || fail "AI provider resolution + extraction matrix"

echo
echo "── Config-file layer + precedence"
cfg_out="${TMP}/cfg"
rm -rf "$cfg_out"; mkdir -p "$cfg_out"
cat > "${cfg_out}/zer0.install.yml" <<'YAML'
profile: github-pages
site:
  title: "Config Title"
ai:
  provider: claude-cli
  model: claude-sonnet-5
YAML
cfg_json="$(ZER0_NO_AI=1 "$INSTALL" plan "$cfg_out" 2>/dev/null)"
if printf '%s' "$cfg_json" | jq -e '.site.title=="Config Title" and .ai.provider=="claude-cli" and .profile=="github-pages"' >/dev/null 2>&1; then
    pass "config file → spec"
else
    fail "config file → spec"
fi
flag_title="$(ZER0_NO_AI=1 "$INSTALL" plan "$cfg_out" --site-title "Flag Title" 2>/dev/null | jq -r '.site.title')"
[[ "$flag_title" == "Flag Title" ]] && pass "flag overrides config" || fail "flag overrides config (got '$flag_title')"

echo
echo "── Doctor AI-provider check"
doc_out="$("$INSTALL" doctor "${TMP}/doc" 2>&1 || true)"
case "$doc_out" in
    *"AI:"*) pass "doctor reports AI provider status" ;;
    *)       fail "doctor AI status line missing" ;;
esac

if [[ $WITH_AI -eq 1 ]]; then
    echo
    echo "── AI wizard (requires an AI provider: claude CLI / OAuth token / OpenAI key)"
    if ! ( source "${ROOT}/scripts/install/log.sh" 2>/dev/null
           source "${ROOT}/scripts/install/ai/client.sh" 2>/dev/null
           ai_client_available ); then
        fail "no AI provider available for wizard tier"
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
