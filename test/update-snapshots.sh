#!/usr/bin/env bash
# =============================================================================
# Generate OR verify Playwright snapshot baselines in the Linux Docker image.
# =============================================================================
#
# Playwright baselines are platform-specific (e.g. *-chromium-linux.png) — they
# only match the EXACT browser/OS that rendered them. To keep local generation
# and CI verification in lock-step, BOTH run Playwright inside the same image
# ($PLAYWRIGHT_IMAGE). This script spins up Jekyll (or reuses a running :4000),
# then runs the snapshots project in that image:
#   * UPDATE_SNAPSHOTS=1 (default) — regenerate baselines for committing.
#     macOS devs run this and commit test/visual/snapshots/.
#   * UPDATE_SNAPSHOTS=0 — VERIFY against the committed baselines. CI calls it
#     this way, so its renders match the baselines a dev generated here.
# CI must NOT render with its own ubuntu-latest chromium: a different OS renders
# fonts differently and yields false whole-page diffs vs these jammy baselines.
#
# Usage:
#   ./test/update-snapshots.sh                       # generate (update) baselines
#   UPDATE_SNAPSHOTS=0 ./test/update-snapshots.sh    # verify (CI uses this)
#   PLAYWRIGHT_PROJECT=snapshots ./test/update-snapshots.sh
#
# Requirements: Docker, docker-compose
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PLAYWRIGHT_PROJECT="${PLAYWRIGHT_PROJECT:-snapshots}"
# 1 = regenerate baselines (default); 0 = verify against committed baselines (CI).
UPDATE_SNAPSHOTS="${UPDATE_SNAPSHOTS:-1}"
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

PW_FLAGS=""
if [[ "$UPDATE_SNAPSHOTS" == "1" ]]; then
  PW_FLAGS="--update-snapshots"
  log "Generating baselines (project=${PLAYWRIGHT_PROJECT}) in ${PLAYWRIGHT_IMAGE}..."
else
  log "Verifying snapshots (project=${PLAYWRIGHT_PROJECT}) against committed baselines in ${PLAYWRIGHT_IMAGE}..."
fi
docker run --rm \
  --network host \
  -v "${PROJECT_ROOT}:/work" \
  -w /work \
  -e BASE_URL=http://localhost:4000 \
  -e CI=true \
  "${PLAYWRIGHT_IMAGE}" \
  bash -c "npm ci --ignore-scripts && npx playwright test --config=test/playwright.config.js --project=${PLAYWRIGHT_PROJECT} ${PW_FLAGS}"

if [[ "$UPDATE_SNAPSHOTS" == "1" ]]; then
  log "Done. Review generated baselines under test/visual/snapshots/ and commit them:"
  log "  git add test/visual/snapshots/"
else
  log "Snapshots match the committed baselines. ✅"
fi
