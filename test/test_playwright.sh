#!/usr/bin/env bash
# =============================================================================
# Playwright frontend tests — smoke, snapshots, or regression
# =============================================================================
# Starts a short-lived Jekyll server (or reuses one when BASE_URL is set), then
# runs the requested Playwright project against it.
#
# Usage:
#   ./test/test_playwright.sh                     # default project: smoke
#   PLAYWRIGHT_PROJECT=snapshots ./test/test_playwright.sh
#   PLAYWRIGHT_PROJECT=smoke UPDATE_SNAPSHOTS=1 ./test/test_playwright.sh
#   BASE_URL=http://localhost:4000 ./test/test_playwright.sh
#   STYLING_PORT=4011 ./test/test_playwright.sh   # non-default port
#
# Environment overrides:
#   PLAYWRIGHT_PROJECT  smoke (default) | snapshots | regression-chromium | …
#   BASE_URL            Use existing server instead of spawning Jekyll
#   STYLING_PORT        Port for the spawned Jekyll server (default 4000)
#   UPDATE_SNAPSHOTS    1 to pass --update-snapshots
#   SKIP_NPM_INSTALL    1 to skip `npm ci` (CI sets this — caller already ran it)
#   SKIP_PLAYWRIGHT_INSTALL  1 to skip `playwright install chromium`
#
# Prerequisites: Ruby/Bundler (unless BASE_URL set), Node.js, npm

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
STYLING_PORT="${STYLING_PORT:-4000}"
PLAYWRIGHT_PROJECT="${PLAYWRIGHT_PROJECT:-smoke}"
UPDATE_SNAPSHOTS="${UPDATE_SNAPSHOTS:-0}"
SKIP_NPM_INSTALL="${SKIP_NPM_INSTALL:-${CI:-0}}"
SKIP_PLAYWRIGHT_INSTALL="${SKIP_PLAYWRIGHT_INSTALL:-${CI:-0}}"
JEKYLL_LOG_DIR="${SCRIPT_DIR}/visual-results"
JEKYLL_LOG="${JEKYLL_LOG_DIR}/jekyll.log"
JEKYLL_PID=""

cd "$PROJECT_ROOT"

log() { echo "[playwright] $*"; }

cleanup() {
  if [[ -n "${JEKYLL_PID}" ]] && kill -0 "${JEKYLL_PID}" 2>/dev/null; then
    log "Stopping Jekyll (PID ${JEKYLL_PID})"
    kill "${JEKYLL_PID}" 2>/dev/null || true
    wait "${JEKYLL_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if ! command -v node >/dev/null 2>&1 || ! command -v npx >/dev/null 2>&1; then
  log "ERROR: Node.js and npx are required"
  exit 1
fi

mkdir -p "$JEKYLL_LOG_DIR"

if [[ -z "${BASE_URL:-}" ]]; then
  if ! command -v bundle >/dev/null 2>&1; then
    log "ERROR: bundle not found. Set BASE_URL to a running site or install Ruby/Bundler."
    exit 1
  fi

  export PAGES_REPO_NWO="${PAGES_REPO_NWO:-bamr87/zer0-mistakes}"

  log "Starting Jekyll on 127.0.0.1:${STYLING_PORT}..."
  log "Server log: ${JEKYLL_LOG}"
  : > "$JEKYLL_LOG"
  bundle exec jekyll serve \
    --config "${PROJECT_ROOT}/_config.yml,${PROJECT_ROOT}/_config_dev.yml" \
    --host 127.0.0.1 \
    --port "${STYLING_PORT}" \
    >>"$JEKYLL_LOG" 2>&1 &
  JEKYLL_PID=$!

  BASE_URL="http://127.0.0.1:${STYLING_PORT}"
  local_ready=false
  for _ in $(seq 1 90); do
    if curl -sf "${BASE_URL}/" >/dev/null 2>&1; then
      local_ready=true
      break
    fi
    if ! kill -0 "${JEKYLL_PID}" 2>/dev/null; then
      log "ERROR: Jekyll exited before becoming ready. Last 50 log lines:"
      tail -n 50 "$JEKYLL_LOG" || true
      exit 1
    fi
    sleep 1
  done
  if [[ "${local_ready}" != "true" ]]; then
    log "ERROR: Jekyll did not respond at ${BASE_URL} within 90s. Last 50 log lines:"
    tail -n 50 "$JEKYLL_LOG" || true
    exit 1
  fi
  log "Jekyll ready at ${BASE_URL}"
else
  log "Using existing site at BASE_URL=${BASE_URL}"
fi

if [[ "$SKIP_NPM_INSTALL" != "1" ]]; then
  log "Installing npm dependencies..."
  npm ci --ignore-scripts 2>/dev/null || npm install --ignore-scripts
else
  log "Skipping npm install (SKIP_NPM_INSTALL=1)"
fi

if [[ "$SKIP_PLAYWRIGHT_INSTALL" != "1" ]]; then
  log "Ensuring Chromium for Playwright..."
  npx playwright install chromium
else
  log "Skipping playwright install (SKIP_PLAYWRIGHT_INSTALL=1)"
fi

export BASE_URL

PLAYWRIGHT_ARGS=(
  test
  --config=test/playwright.config.js
  --project="${PLAYWRIGHT_PROJECT}"
)
if [[ "$UPDATE_SNAPSHOTS" == "1" ]]; then
  PLAYWRIGHT_ARGS+=(--update-snapshots)
  log "Running Playwright (project=${PLAYWRIGHT_PROJECT}) with --update-snapshots..."
else
  log "Running Playwright (project=${PLAYWRIGHT_PROJECT})..."
fi

npx playwright "${PLAYWRIGHT_ARGS[@]}"

log "Playwright tests passed (project=${PLAYWRIGHT_PROJECT})."
