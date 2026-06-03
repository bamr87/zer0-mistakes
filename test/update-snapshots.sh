#!/usr/bin/env bash
# =============================================================================
# Update Playwright snapshot baselines on Linux (via Docker).
# =============================================================================
#
# Playwright baselines are platform-specific (e.g. *-chromium-linux.png).
# CI runs on ubuntu-latest, so baselines must be generated on Linux. macOS
# developers should run this script — it spins up the project's Linux Docker
# image, starts Jekyll, runs Playwright with --update-snapshots, and writes
# baselines into test/visual/snapshots/ for committing.
#
# Usage:
#   ./test/update-snapshots.sh              # update the snapshots project
#   PLAYWRIGHT_PROJECT=snapshots ./test/update-snapshots.sh
#
# Requirements: Docker, docker-compose
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PLAYWRIGHT_PROJECT="${PLAYWRIGHT_PROJECT:-snapshots}"
# Match the Playwright version in package-lock.json. CI uses
# `npx playwright install` so it always gets the right binaries; this image
# is only used by this local snapshot-update helper.
PLAYWRIGHT_IMAGE="${PLAYWRIGHT_IMAGE:-mcr.microsoft.com/playwright:v1.58.2-jammy}"

cd "$PROJECT_ROOT"

log() { echo "[update-snapshots] $*"; }

if ! command -v docker >/dev/null 2>&1; then
  log "ERROR: docker is required to generate Linux baselines."
  exit 1
fi

JEKYLL_RUNNING=0
if curl -sf http://localhost:4000/ >/dev/null 2>&1; then
  log "Jekyll already serving on http://localhost:4000 — reusing it."
  JEKYLL_RUNNING=1
else
  log "Starting Jekyll via docker compose..."
  docker compose up -d
  JEKYLL_RUNNING=2
  for _ in $(seq 1 120); do
    if curl -sf http://localhost:4000/ >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  if ! curl -sf http://localhost:4000/ >/dev/null 2>&1; then
    log "ERROR: Jekyll did not respond on :4000 within 120s"
    docker compose logs --tail 50 jekyll || true
    exit 1
  fi
fi

cleanup() {
  if [[ "$JEKYLL_RUNNING" == "2" ]]; then
    log "Stopping Jekyll docker compose stack..."
    docker compose down
  fi
}
trap cleanup EXIT

log "Running Playwright (project=${PLAYWRIGHT_PROJECT}, --update-snapshots) in ${PLAYWRIGHT_IMAGE}..."
docker run --rm \
  --network host \
  -v "${PROJECT_ROOT}:/work" \
  -w /work \
  -e BASE_URL=http://localhost:4000 \
  -e CI=true \
  "${PLAYWRIGHT_IMAGE}" \
  bash -c "npm ci --ignore-scripts && npx playwright test --config=test/playwright.config.js --project=${PLAYWRIGHT_PROJECT} --update-snapshots"

log "Done. Review generated baselines under test/visual/snapshots/ and commit them:"
log "  git add test/visual/snapshots/"
