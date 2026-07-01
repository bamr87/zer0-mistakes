#!/usr/bin/env bash
# Feature: ZER0-052
# =============================================================================
# generate-roadmap.sh
# =============================================================================
#
# Thin wrapper around scripts/generate-roadmap.rb.
#
# Reads `_data/roadmap.yml` and rewrites the auto-generated roadmap regions
# of README.md (Mermaid gantt diagram + summary table) in place.
#
# Usage:
#   ./scripts/generate-roadmap.sh             # update README.md
#   ./scripts/generate-roadmap.sh --check     # CI-friendly drift detection
#   ./scripts/generate-roadmap.sh --validate  # check integrity & version tracking
#   ./scripts/generate-roadmap.sh --stdout    # print regenerated sections only
#
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec ruby "${SCRIPT_DIR}/generate-roadmap.rb" "$@"
