#!/bin/bash

# ============================================================================
# WRAPPER: This script forwards to scripts/utils/analyze-commits
# 
# The canonical location is scripts/utils/analyze-commits. This wrapper exists
# for backward compatibility with existing workflows.
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/utils/analyze-commits" "$@"
