#!/bin/bash
# =========================================================================
# scripts/lib/install/platform.sh
# =========================================================================
# Platform / Ruby detection helpers used by install.sh.
#
# Bash 3.2-compatible — no `declare -A`, no `=~` capture groups.
#
# Functions exported:
#   detect_os               -> Darwin | Linux | CYGWIN | MINGW | unknown
#   detect_ruby_version     -> e.g. "2.6.8" or "none"
#   ruby_version_lt_27      -> exit 0 when ruby < 2.7
#   needs_macos_gemfile     -> exit 0 when macOS + ruby < 2.7
#   detect_platform         -> auto | wsl | macos | linux | unknown
# =========================================================================

# Returns: Darwin | Linux | CYGWIN | MINGW | unknown
detect_os() {
    uname -s 2>/dev/null || echo "unknown"
}

# Returns the ruby version string (e.g. "2.6.8"), or "none" if ruby is absent.
detect_ruby_version() {
    if ! command -v ruby >/dev/null 2>&1; then
        echo "none"
        return
    fi
    # ruby --version prints: ruby 2.6.8p205 (2021-07-07 ...) [platform]
    # We want "2.6.8" — strip the trailing pNNN patch indicator via sed.
    ruby --version 2>/dev/null | awk '{print $2}' | sed 's/p[0-9]*//' | sed 's/-.*//' | tr -d '\r'
}

# Returns 0 (true) if the current Ruby version is < 2.7.0, 1 (false) otherwise.
# Uses awk so arithmetic is safe even with partial version strings.
ruby_version_lt_27() {
    local ver
    ver=$(detect_ruby_version)
    [ "$ver" = "none" ] && return 1  # no ruby → don't apply macOS caps
    awk -v ver="$ver" 'BEGIN {
        n = split(ver, a, ".")
        if (a[1]+0 == 2 && a[2]+0 < 7) exit 0
        exit 1
    }'
}

# Returns 0 (true) when running on macOS with system Ruby < 2.7.
# This is the condition that triggers use of Gemfile.macos.template.
needs_macos_gemfile() {
    local os
    os=$(detect_os)
    [ "$os" = "Darwin" ] && ruby_version_lt_27
}

# Detect runtime platform. Honours $PLATFORM if explicitly set.
# Returns: macos | linux | wsl | unknown
detect_platform() {
    if [[ "${PLATFORM:-auto}" != "auto" ]]; then
        echo "$PLATFORM"
        return
    fi
    # WSL detection (check before generic Linux)
    if grep -qiE '(microsoft|wsl)' /proc/version 2>/dev/null; then
        echo "wsl"
    elif [[ "$(uname -s)" == "Darwin" ]]; then
        echo "macos"
    elif [[ "$(uname -s)" == "Linux" ]]; then
        echo "linux"
    else
        echo "unknown"
    fi
}
