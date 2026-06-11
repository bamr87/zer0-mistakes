#!/bin/bash
# =============================================================================
# scripts/install/platform.sh — Platform & dependency detection
# =============================================================================
# Provides:
#   platform_detect_os           → Darwin | Linux | CYGWIN | MINGW | unknown
#   platform_detect_runtime      → macos | linux | wsl | windows | unknown
#   platform_detect_ruby         → "X.Y.Z" or "none"
#   platform_ruby_lt_27          → returns 0 (true) when ruby < 2.7
#   platform_needs_macos_gemfile → returns 0 when macOS + ruby < 2.7
#   platform_detect_docker       → "yes" | "no"
#   platform_detect_gh           → "yes" | "no"
#   platform_detect_git          → "yes" | "no"
#   platform_detect_jq           → "yes" | "no"
#   platform_detect_bundler      → "X.Y.Z" or "none"
#   platform_summary             → emit a JSON-compatible summary object
#
# Bash 3.2 compatible. No declare -A. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_PLATFORM_LIB:-}" ]] && return 0
_HAS_PLATFORM_LIB=1

platform_detect_os() {
    uname -s 2>/dev/null || echo "unknown"
}

# Returns: macos | linux | wsl | windows | unknown
platform_detect_runtime() {
    if [[ "${PLATFORM:-auto}" != "auto" ]]; then
        echo "$PLATFORM"
        return
    fi
    if grep -qiE '(microsoft|wsl)' /proc/version 2>/dev/null; then
        echo "wsl"
        return
    fi
    local os
    os=$(platform_detect_os)
    case "$os" in
        Darwin) echo "macos"   ;;
        Linux)  echo "linux"   ;;
        CYGWIN*|MINGW*) echo "windows" ;;
        *) echo "unknown" ;;
    esac
}

# Returns ruby version "X.Y.Z" or "none"
platform_detect_ruby() {
    if ! command -v ruby >/dev/null 2>&1; then
        echo "none"
        return
    fi
    # Wrap in subshell at / to avoid Gemfile.lock interference
    ( cd / && ruby --version 2>/dev/null ) \
        | awk '{print $2}' \
        | sed 's/p[0-9]*//' \
        | sed 's/-.*//' \
        | tr -d '\r\n'
}

# Returns 0 (true) when ruby < 2.7
platform_ruby_lt_27() {
    local ver
    ver=$(platform_detect_ruby)
    [ "$ver" = "none" ] && return 1
    awk -v ver="$ver" 'BEGIN {
        n = split(ver, a, ".")
        if (n >= 2 && a[1]+0 == 2 && a[2]+0 < 7) exit 0
        exit 1
    }'
}

# Returns 0 when macOS + system ruby < 2.7 (needs special Gemfile caps)
platform_needs_macos_gemfile() {
    local os
    os=$(platform_detect_os)
    [ "$os" = "Darwin" ] && platform_ruby_lt_27
}

# Returns "X.Y.Z" or "none"
platform_detect_bundler() {
    if ! command -v bundler >/dev/null 2>&1 && ! command -v bundle >/dev/null 2>&1; then
        echo "none"
        return
    fi
    ( cd / && bundle --version 2>/dev/null ) \
        | awk '{print $NF}' \
        | tr -d '\r\n'
}

platform_detect_docker() {
    if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
        echo "yes"
    else
        echo "no"
    fi
}

platform_detect_gh() {
    command -v gh >/dev/null 2>&1 && echo "yes" || echo "no"
}

platform_detect_git() {
    command -v git >/dev/null 2>&1 && echo "yes" || echo "no"
}

platform_detect_jq() {
    command -v jq >/dev/null 2>&1 && echo "yes" || echo "no"
}

# Emit a compact single-line summary of detected platform (JSON-compatible)
platform_summary() {
    printf '{"os":"%s","runtime":"%s","ruby":"%s","bundler":"%s","docker":"%s","gh":"%s","git":"%s","jq":"%s"}\n' \
        "$(platform_detect_os)" \
        "$(platform_detect_runtime)" \
        "$(platform_detect_ruby)" \
        "$(platform_detect_bundler)" \
        "$(platform_detect_docker)" \
        "$(platform_detect_gh)" \
        "$(platform_detect_git)" \
        "$(platform_detect_jq)"
}
