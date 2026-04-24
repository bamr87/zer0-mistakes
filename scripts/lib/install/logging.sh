#!/bin/bash
# =========================================================================
# scripts/lib/install/logging.sh
# =========================================================================
# Logging shim for install.sh. Provides log_info / log_success /
# log_warning / log_error names used throughout install.sh while
# delegating to scripts/lib/common.sh primitives where available.
#
# WHY a shim instead of a direct sed-rename?
#   - install.sh has ~300+ call sites to log_info/log_success/log_warning/log_error
#   - Common.sh uses different verbs (info/success/warn/error) and `error` exits
#   - A thin shim preserves behavior exactly while letting future code use
#     either vocabulary.
#
# Source order requirement:
#   This file must be sourced AFTER scripts/lib/common.sh so the
#   colour variables (RED/GREEN/YELLOW/BLUE/NC) are defined.
#
# Compatibility: bash 3.2+ (macOS default)
# =========================================================================

# Define colours if common.sh wasn't sourced (safe defaults).
RED="${RED:-\033[0;31m}"
GREEN="${GREEN:-\033[0;32m}"
YELLOW="${YELLOW:-\033[1;33m}"
BLUE="${BLUE:-\033[0;34m}"
NC="${NC:-\033[0m}"

# install.sh-style logging — identical output to the original block.
log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
