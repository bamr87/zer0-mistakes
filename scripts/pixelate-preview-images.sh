#!/bin/bash

# ============================================================================
# WRAPPER: This script forwards to scripts/features/pixelate-preview-images
#
# The canonical location is scripts/features/pixelate-preview-images. This
# wrapper exists for backward compatibility and discoverability alongside the
# other scripts/*.sh entry points.
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/features/pixelate-preview-images" "$@"
