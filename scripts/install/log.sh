#!/bin/bash
# =============================================================================
# scripts/install/log.sh — Logging primitives
# =============================================================================
# Provides: log_info, log_success, log_warning, log_error, log_debug,
#           log_json, log_step, log_indent_push, log_indent_pop
#
# Output modes:
#   human (default) — coloured, prefixed text to stderr
#   json            — machine-readable JSON lines to stdout
#
# Callers set _LOG_OUTPUT="json" before sourcing to switch modes.
# Callers set _LOG_VERBOSE=1 to enable log_debug output.
#
# Bash 3.2 compatible. No declare -A. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_LOG_LIB:-}" ]] && return 0
_HAS_LOG_LIB=1

# Colour codes — only apply when stderr is a TTY
_LOG_RED=''
_LOG_GREEN=''
_LOG_YELLOW=''
_LOG_BLUE=''
_LOG_CYAN=''
_LOG_BOLD=''
_LOG_NC=''
if [[ -t 2 ]]; then
    _LOG_RED='\033[0;31m'
    _LOG_GREEN='\033[0;32m'
    _LOG_YELLOW='\033[1;33m'
    _LOG_BLUE='\033[0;34m'
    _LOG_CYAN='\033[0;36m'
    _LOG_BOLD='\033[1m'
    _LOG_NC='\033[0m'
fi

# Output mode: "human" | "json"
_LOG_OUTPUT="${_LOG_OUTPUT:-human}"
# Verbose: 1 = show debug lines
_LOG_VERBOSE="${_LOG_VERBOSE:-0}"
# Indent level (incremented by log_step sections)
_LOG_INDENT=0

# Internal: emit a single log line
_log_emit() {
    local level="$1"
    local msg="$2"
    local prefix color
    local indent=""
    local i=0
    while [[ $i -lt $_LOG_INDENT ]]; do
        indent="  $indent"
        i=$(( i + 1 ))
    done
    case "$level" in
        INFO)    color="$_LOG_BLUE";   prefix="[INFO]"    ;;
        SUCCESS) color="$_LOG_GREEN";  prefix="[SUCCESS]" ;;
        WARNING) color="$_LOG_YELLOW"; prefix="[WARNING]" ;;
        ERROR)   color="$_LOG_RED";    prefix="[ERROR]"   ;;
        DEBUG)   color="$_LOG_CYAN";   prefix="[DEBUG]"   ;;
        STEP)    color="$_LOG_BOLD";   prefix="[STEP]"    ;;
        *)       color="$_LOG_NC";     prefix="[$level]"  ;;
    esac

    if [[ "$_LOG_OUTPUT" == "json" ]]; then
        # Emit JSON line to stdout for machine parsing
        local ts
        ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")
        # Escape double quotes in message
        local safe_msg
        safe_msg=$(printf '%s' "$msg" | sed 's/\\/\\\\/g; s/"/\\"/g')
        printf '{"ts":"%s","level":"%s","msg":"%s"}\n' "$ts" "$level" "$safe_msg"
    else
        printf "${color}${prefix}${_LOG_NC} %s%s\n" "$indent" "$msg" >&2
    fi
}

log_info()    { _log_emit "INFO"    "$1"; }
log_success() { _log_emit "SUCCESS" "$1"; }
log_warning() { _log_emit "WARNING" "$1"; }
log_error()   { _log_emit "ERROR"   "$1"; }
log_debug()   { [[ "${_LOG_VERBOSE:-0}" == "1" ]] && _log_emit "DEBUG" "$1" || true; }

# log_step TITLE — print a section header and increment indent
log_step() {
    _log_emit "STEP" "── $1"
    _LOG_INDENT=$(( _LOG_INDENT + 1 ))
}

# log_step_done — decrement indent after a section
log_step_done() {
    [[ $_LOG_INDENT -gt 0 ]] && _LOG_INDENT=$(( _LOG_INDENT - 1 )) || true
}

# log_json KEY VALUE — emit a JSON key/value pair to stdout (for --output json)
# Use inside sections that need structured output regardless of log mode.
log_json() {
    local key="$1"
    local val="$2"
    printf '{"key":"%s","value":"%s"}\n' "$key" "$val"
}

# log_banner TEXT — print a visible section banner
log_banner() {
    local msg="$1"
    local width=70
    local line=""
    local i=0
    while [[ $i -lt $width ]]; do
        line="${line}="
        i=$(( i + 1 ))
    done
    if [[ "$_LOG_OUTPUT" != "json" ]]; then
        printf "${_LOG_BOLD}%s${_LOG_NC}\n" "$line" >&2
        printf "${_LOG_BOLD}  %s${_LOG_NC}\n" "$msg" >&2
        printf "${_LOG_BOLD}%s${_LOG_NC}\n" "$line" >&2
    fi
}
