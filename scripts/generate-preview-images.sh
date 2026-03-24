#!/bin/bash

# @zer0-component
#   feature-id: ZER0-004
#   type: script
#   dependencies: []
#
# ============================================================================
# WRAPPER: This script forwards to scripts/features/generate-preview-images
# 
# The canonical location is scripts/features/generate-preview-images. This
# wrapper exists for backward compatibility with existing workflows.
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/features/generate-preview-images" "$@"
