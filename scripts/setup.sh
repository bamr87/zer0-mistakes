#!/bin/bash

# @zer0-component
#   feature-id: ZER0-003
#   type: script
#   dependencies: [ZER0-002]
#
# ============================================================================
# WRAPPER: This script forwards to scripts/utils/setup
# 
# The canonical location is scripts/utils/setup. This wrapper exists for
# backward compatibility with existing workflows.
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/utils/setup" "$@"
