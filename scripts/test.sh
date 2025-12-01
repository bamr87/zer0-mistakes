#!/bin/bash

# ============================================================================
# WRAPPER: This script forwards to scripts/test/theme/validate
# 
# The canonical location is scripts/test/theme/validate. This wrapper exists
# for backward compatibility with existing workflows.
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/test/theme/validate" "$@"
