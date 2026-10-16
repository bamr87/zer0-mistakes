#!/usr/bin/env bash
# =============================================================================
# assert_no_livereload.sh — fail if the Jekyll under test can reload the page.
# =============================================================================
#
# zer0-mistakes#461. The Visual Snapshots tier retried
# `appearance-snapshot.spec.js` on most CI runs with "Execution context was
# destroyed, most likely because of a navigation". Nothing on the page
# navigates: Jekyll's LiveReload did. `docker compose up` starts
# `jekyll serve --watch --livereload` over a bind mount of the repo, and
# update-snapshots.sh then runs `npm ci` into that same mount. On a fresh
# checkout node_modules/ does not exist when the watcher starts, so it is not
# yet a listen ignore path; the install triggers "Regenerating: N file(s)
# changed" and every open page reloads mid-test.
#
# A snapshot stack has no use for LiveReload, so update-snapshots.sh starts it
# with JEKYLL_LIVERELOAD=0 and calls this to prove it before Playwright runs.
#
# Usage: test/lib/assert_no_livereload.sh [BASE_URL] [LIVERELOAD_URL]
#   exit 0  no LiveReload endpoint answers and the page embeds no client
#   exit 1  LiveReload is live (prints which signal tripped)
# =============================================================================
set -uo pipefail

BASE_URL="${1:-${BASE_URL:-http://localhost:4000}}"
LIVERELOAD_URL="${2:-${LIVERELOAD_URL:-http://localhost:${ZER0_MISTAKES_LIVERELOAD_PORT:-35729}}}"

failed=0
if curl -sf -o /dev/null --max-time 5 "${LIVERELOAD_URL%/}/livereload.js"; then
  echo "[assert-no-livereload] LiveReload server answers at ${LIVERELOAD_URL%/}/livereload.js" >&2
  failed=1
fi
if ! page="$(curl -sf --max-time 15 "${BASE_URL%/}/")"; then
  echo "[assert-no-livereload] could not fetch ${BASE_URL%/}/ to inspect it" >&2
  exit 1
fi
if grep -q 'livereload\.js' <<<"$page"; then
  echo "[assert-no-livereload] ${BASE_URL%/}/ embeds the LiveReload client" >&2
  failed=1
fi
if [[ "$failed" == "0" ]]; then
  echo "[assert-no-livereload] OK: ${BASE_URL%/}/ cannot be reloaded by Jekyll"
fi
exit "$failed"
