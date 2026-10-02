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
# A PNG turned out not to be enough either (#468). On 2026-09-07 the sweep
# wrote 18 screenshots — so every guard above stayed quiet — while axe, the
# overflow probe, the console capture and the link crawl were blacked out on
# EVERY route by one `browser.newPage()` that @axe-core/playwright refuses.
# The report rendered that blackout as "0 violations / 0 broken links", i.e. a
# harness outage that read as a healthy audit. This check therefore also
# asserts that each MEASUREMENT landed, and injects a failure to prove a broken
# measurement costs exactly itself instead of erasing the other four.
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

# ---------------------------------------------------------------------------
# A screenshot is necessary but nowhere near sufficient (#468). The 2026-09-07
# run wrote 18 of them while axe, overflow, console and the link crawl were
# blacked out on every route, and the report rendered the absence as
# "0 violations / 0 broken links" — a harness outage that read as a healthy
# audit. So assert the MEASUREMENTS landed, not just the pixels.
# ---------------------------------------------------------------------------
log "Asserting every measurement is present in report.json..."
node -e '
  const r = require("./test/ui-audit/output/report.json");
  const fail = (m) => { console.error("[check-audit-serve] FAIL: " + m); process.exit(1); };
  if (!r.routes.length) fail("report.json has no route records");
  // Anchor on a pass that actually LOADED. A slow first hit can time out one
  // viewport on a very tall page; that is a load error, a different thing from
  // the measurement blackout under test. A run where NOTHING loaded still fails.
  const e = r.routes.find((x) => !x.error);
  if (!e) fail("no route loaded: " + r.routes.map((x) => x.error).join(" | "));
  if (e.errors) fail(`route ${e.route} @ ${e.viewport} had measurement errors: ${JSON.stringify(e.errors)}`);
  // The axe assertion is the point of this block: before the newContext() fix
  // AxeBuilder threw and this key never existed.
  if (!Array.isArray(e.axe_violations)) fail("axe_violations missing — the axe scan did not run");
  if (!Array.isArray(e.console_errors)) fail("console_errors missing");
  if (!e.overflow || typeof e.overflow.scroll_width !== "number") fail("overflow missing");
  if (!e.screenshot) fail("screenshot path missing");
  if (!r.links_checked) fail("links_checked is 0 — the link crawl never ran, so \"broken: 0\" is meaningless");
  if (r.harness.blacked_out.length) fail("blacked-out measurements: " + r.harness.blacked_out.join(", "));
  console.log(`[check-audit-serve] measurements OK on ${e.route} @ ${e.viewport} ` +
    `(axe ran, ${r.links_checked} links crawled)`);
'

# ---------------------------------------------------------------------------
# And prove the isolation itself: a failing measurement must cost EXACTLY
# itself. One try around the whole per-route body is what turned a single
# library misuse into a total blackout, so this injects an axe failure and
# asserts the other four measurements still landed.
# ---------------------------------------------------------------------------
log "Injecting an axe failure to prove measurement isolation..."
inject_status=0
UI_AUDIT_FAULT_INJECT=axe node test/ui-audit/sweep.mjs || inject_status=$?

if [[ "$inject_status" -eq 0 ]]; then
  log "FAIL: axe failed on every route but the sweep still exited 0."
  log "      A blacked-out measurement is a harness fault and must be RED."
  exit 1
fi

node -e '
  const r = require("./test/ui-audit/output/report.json");
  const fail = (m) => { console.error("[check-audit-serve] FAIL: " + m); process.exit(1); };
  const e = r.routes.find((x) => !x.error);
  if (!e) fail("no route loaded: " + r.routes.map((x) => x.error).join(" | "));
  if (!e.errors || !e.errors.axe) fail("injected axe failure was not recorded on the axe measurement");
  if ("axe_violations" in e) fail("a failed axe scan must not report violations at all");
  // The four survivors — this is the regression that matters.
  if (!e.screenshot) fail("screenshot was discarded by an unrelated axe failure");
  if (!e.overflow) fail("overflow was discarded by an unrelated axe failure");
  if (!Array.isArray(e.console_errors)) fail("console_errors was discarded by an unrelated axe failure");
  if (!r.links_checked) fail("link crawl was discarded by an unrelated axe failure");
  if (e.error) fail("a measurement failure must not be recorded as a whole-page load error");
  const md = require("node:fs").readFileSync("test/ui-audit/output/report.md", "utf8");
  if (!/axe scan FAILED/.test(md)) fail("report.md did not distinguish a failed scan from a clean one");
  console.log("[check-audit-serve] isolation OK (axe failed alone; 4 measurements survived)");
'

log "PASS: the audit's serve invocation produces capturable pages (${shots} screenshot(s))"
log "      and every measurement — axe, overflow, console, links — landed."
