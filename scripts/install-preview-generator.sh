#!/bin/bash

# @zer0-component
#   feature-id: ZER0-004
#   type: script
#   dependencies: []
#
# ============================================================================
# WRAPPER: This script forwards to scripts/features/install-preview-generator
# 
# The canonical location is scripts/features/install-preview-generator. This
# wrapper exists for backward compatibility with existing workflows.
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/features/install-preview-generator" "$@"
