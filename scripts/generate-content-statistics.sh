#!/usr/bin/env bash
# =============================================================================
# generate-content-statistics.sh
# =============================================================================
#
# Pre-build content statistics generation (GitHub Pages safe-mode compatible).
# Updates _data/content_statistics.yml with current counts and generated_at.
#
# Usage:
#   ./scripts/generate-content-statistics.sh
#   rake stats:generate
#
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
GENERATOR="${REPO_ROOT}/_data/generate_statistics.sh"

if [[ ! -f "${GENERATOR}" ]]; then
  echo "Statistics generator not found: ${GENERATOR}" >&2
  exit 1
fi

exec bash "${GENERATOR}" "$@"
