#!/usr/bin/env bash
# =============================================================================
# Frontend styling tests (Playwright) — Bootstrap + Jekyll main.css + layout
# =============================================================================
# Starts a short-lived Jekyll server, runs test/visual/styling.spec.js, then stops.
#
# Usage:
#   ./test/test_styling.sh
#   BASE_URL=http://localhost:4000 ./test/test_styling.sh   # reuse existing server
#   STYLING_PORT=4011 ./test/test_styling.sh
#
# Prerequisites: Ruby/Bundler (unless BASE_URL set), Node.js, npm install

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
STYLING_PORT="${STYLING_PORT:-4011}"
JEKYLL_PID=""

cd "$PROJECT_ROOT"

log() { echo "[styling] $*"; }

cleanup() {
  if [[ -n "${JEKYLL_PID}" ]] && kill -0 "${JEKYLL_PID}" 2>/dev/null; then
    log "Stopping Jekyll (PID ${JEKYLL_PID})"
    kill "${JEKYLL_PID}" 2>/dev/null || true
    wait "${JEKYLL_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if ! command -v node &>/dev/null || ! command -v npx &>/dev/null; then
  log "ERROR: Node.js and npx are required"
  exit 1
fi

if [[ -z "${BASE_URL:-}" ]]; then
  if ! command -v bundle &>/dev/null; then
    log "ERROR: bundle not found. Set BASE_URL to a running site or install Ruby/Bundler."
    exit 1
  fi

  export PAGES_REPO_NWO="${PAGES_REPO_NWO:-bamr87/zer0-mistakes}"

  log "Starting Jekyll on 127.0.0.1:${STYLING_PORT}..."
  bundle exec jekyll serve \
    --config "${PROJECT_ROOT}/_config.yml,${PROJECT_ROOT}/_config_dev.yml" \
    --host 127.0.0.1 \
    --port "${STYLING_PORT}" &>/dev/null &
  JEKYLL_PID=$!

  BASE_URL="http://127.0.0.1:${STYLING_PORT}"
  local_ready=false
  for _ in $(seq 1 90); do
    if curl -sf "${BASE_URL}/" &>/dev/null; then
      local_ready=true
      break
    fi
    if ! kill -0 "${JEKYLL_PID}" 2>/dev/null; then
      log "ERROR: Jekyll exited before becoming ready"
      exit 1
    fi
    sleep 1
  done
  if [[ "${local_ready}" != "true" ]]; then
    log "ERROR: Jekyll did not respond at ${BASE_URL} within 90s"
    exit 1
  fi
  log "Jekyll ready at ${BASE_URL}"
else
  log "Using existing site at BASE_URL=${BASE_URL}"
fi

log "Installing npm dependencies (if needed)..."
npm ci --ignore-scripts 2>/dev/null || npm install --ignore-scripts

log "Ensuring Chromium for Playwright..."
npx playwright install chromium

export BASE_URL
log "Running Playwright styling tests..."
npx playwright test --config=test/playwright.styling.config.js

log "Styling tests passed."
