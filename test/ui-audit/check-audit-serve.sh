#!/usr/bin/env bash
# =============================================================================
# check-audit-serve.sh — regression check for the UI-audit serve invocation
# =============================================================================
# Serves the site EXACTLY as .github/workflows/ui-audit.yml does, runs the
# sweep against it, and asserts that at least one screenshot was written.
#
# Why this exists: for six consecutive weeks (2026-07-20 → 2026-08-24) the
# weekly audit captured zero evidence and reported SUCCESS every time. The
# workflow served with `jekyll serve --detach`, which disables the watch thread
# the LiveReload reactor rides on — while `_config_dev.yml` still makes Jekyll
# inject `livereload.js` into every page. The injected script pointed at a port
# nothing was listening on, so `load` never fired and all 18
# `page.goto(..., waitUntil: 'load')` calls timed out. `curl -sf` could not
# catch it: it fetches the HTML and never requests a subresource.
#
# So the assertion here is deliberately NOT "the server answers HTTP" — that
# was already true and already gated. It is "a browser can finish loading a
# page and we got a PNG out of it", which is the only thing the audit needs.
#
# Red on the old `--detach` invocation, green on the current one. Prove it:
#
#     UI_AUDIT_SERVE_DETACH=1 ./test/ui-audit/check-audit-serve.sh   # expect FAIL
#     ./test/ui-audit/check-audit-serve.sh                           # expect PASS
#
# Usage:
#     ./test/ui-audit/check-audit-serve.sh
#     BASE_URL=http://127.0.0.1:4000 ./test/ui-audit/check-audit-serve.sh  # reuse a server
#
# Requires: Ruby + Bundler (unless BASE_URL is set), Node, and Playwright's
# chromium (`npx playwright install chromium`).
# =============================================================================
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

PORT="${UI_AUDIT_CHECK_PORT:-4013}"
LOG_DIR="test/visual-results"
LOG="${LOG_DIR}/ui-audit-check-jekyll.log"
# One route × three viewports is enough to prove capture works, and keeps the
# check to seconds rather than the full matrix's ten minutes.
ROUTES="${UI_AUDIT_ROUTES:-/}"
JEKYLL_PID=""

log() { printf '[check-audit-serve] %s\n' "$*"; }

cleanup() {
  if [[ -n "$JEKYLL_PID" ]] && kill -0 "$JEKYLL_PID" 2>/dev/null; then
    kill "$JEKYLL_PID" 2>/dev/null || true
    for _ in $(seq 1 10); do
      kill -0 "$JEKYLL_PID" 2>/dev/null || break
      sleep 1
    done
    kill -9 "$JEKYLL_PID" 2>/dev/null || true
  fi
  # `--detach` orphans the server: it is not our child, so kill the port owner.
  if [[ "${UI_AUDIT_SERVE_DETACH:-0}" == "1" ]] && command -v pkill >/dev/null 2>&1; then
    pkill -f "jekyll serve.*--port ${PORT}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if ! command -v node >/dev/null 2>&1; then
  log "ERROR: Node.js is required"
  exit 1
fi

if [[ -z "${BASE_URL:-}" ]]; then
  if ! command -v bundle >/dev/null 2>&1; then
    log "SKIP: bundler not found. Install Ruby/Bundler, or set BASE_URL to a"
    log "      site already served the way ui-audit.yml serves it."
    exit 0
  fi

  mkdir -p "$LOG_DIR"
  : > "$LOG"
  export PAGES_REPO_NWO="${PAGES_REPO_NWO:-bamr87/zer0-mistakes}"

  if [[ "${UI_AUDIT_SERVE_DETACH:-0}" == "1" ]]; then
    # The BROKEN invocation, kept only so this check can be shown to fail.
    log "Serving with --detach (the pre-fix invocation) on port ${PORT}..."
    bundle exec jekyll serve \
      --config "${PROJECT_ROOT}/_config.yml,${PROJECT_ROOT}/_config_dev.yml" \
      --host 127.0.0.1 --port "$PORT" --detach >>"$LOG" 2>&1
  else
    # The invocation ui-audit.yml uses, matching test/test_playwright.sh:69-74.
    log "Serving on port ${PORT} (backgrounded, no --detach)..."
    bundle exec jekyll serve \
      --config "${PROJECT_ROOT}/_config.yml,${PROJECT_ROOT}/_config_dev.yml" \
      --host 127.0.0.1 --port "$PORT" >>"$LOG" 2>&1 &
    JEKYLL_PID=$!
  fi

  BASE_URL="http://127.0.0.1:${PORT}"
  ready=false
  for _ in $(seq 1 90); do
    if curl -sf "${BASE_URL}/" >/dev/null 2>&1; then
      ready=true
      break
    fi
    if [[ -n "$JEKYLL_PID" ]] && ! kill -0 "$JEKYLL_PID" 2>/dev/null; then
      break
    fi
    sleep 1
  done
  if [[ "$ready" != "true" ]]; then
    log "ERROR: Jekyll did not become ready at ${BASE_URL}. Last 50 log lines:"
    tail -n 50 "$LOG" || true
    exit 1
  fi
  # This is the gate the workflow already had, and it passes in BOTH modes.
  # That is the whole point: HTTP readiness says nothing about whether a page
  # can finish loading.
  log "HTTP readiness gate passed (as it did while the audit was broken)."
fi

export BASE_URL
export UI_AUDIT_ROUTES="$ROUTES"

rm -rf test/ui-audit/output/screens
log "Running the sweep against ${BASE_URL} (routes: ${ROUTES})..."
sweep_status=0
node test/ui-audit/sweep.mjs || sweep_status=$?

shots=$(find test/ui-audit/output/screens -name '*.png' 2>/dev/null | wc -l | tr -d ' ')
log "screenshots captured: ${shots}"

if [[ "$shots" -eq 0 ]]; then
  log "FAIL: the sweep captured no screenshots — the audit harness cannot see the site."
  log "      The server answered curl but no page ever fired its load event."
  log "      Check for a subresource pointing at a dead port (e.g. livereload)."
  exit 1
fi

if [[ "$sweep_status" -ne 0 ]]; then
  log "FAIL: sweep exited ${sweep_status} despite writing screenshots."
  exit 1
fi

log "PASS: the audit's serve invocation produces capturable pages (${shots} screenshot(s))."
