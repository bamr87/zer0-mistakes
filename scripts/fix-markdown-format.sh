#!/bin/bash

# @zer0-component
#   feature-id: ZER0-020
#   type: script
#   dependencies: []
#
# ============================================================================
# WRAPPER: This script forwards to scripts/utils/fix-markdown
# 
# The canonical location is scripts/utils/fix-markdown. This wrapper exists
# for backward compatibility with existing workflows.
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/utils/fix-markdown" "$@"
