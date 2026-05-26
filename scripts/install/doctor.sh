#!/bin/bash
# =============================================================================
# scripts/install/doctor.sh — Pre-install environment health checks
# =============================================================================
# Checks system prerequisites and reports pass/warn/fail for each.
# Never blocks apply_run by default — warnings only. Fatal conditions
# (e.g. target dir not writable) return non-zero.
#
# Provides:
#   doctor_run [TARGET_DIR]   — run all checks; return 0 if clean, 1 if any FAIL
#   doctor_check_ruby         — Ruby version check
#   doctor_check_bundler      — Bundler present
#   doctor_check_docker       — Docker daemon
#   doctor_check_git          — git present
#   doctor_check_gh           — GitHub CLI present (warn only)
#   doctor_check_writable     — target dir writable
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_DOCTOR_LIB:-}" ]] && return 0
_HAS_DOCTOR_LIB=1

# Internal check helpers
_doctor_pass()  { printf "  [PASS]  %s\n" "$*" >&2; }
_doctor_warn()  { printf "  [WARN]  %s\n" "$*" >&2; }
_doctor_fail()  { printf "  [FAIL]  %s\n" "$*" >&2; }

# ---------------------------------------------------------------------------
# doctor_check_ruby
# ---------------------------------------------------------------------------
doctor_check_ruby() {
    local ruby_ver
    ruby_ver=$(ruby --version 2>/dev/null | awk '{print $2}')
    if [[ -z "$ruby_ver" ]]; then
        _doctor_fail "Ruby not found. Install Ruby >= 2.7 (rbenv / brew / asdf recommended)"
        return 1
    fi

    # Extract major.minor
    local major minor
    major=$(echo "$ruby_ver" | cut -d. -f1)
    minor=$(echo "$ruby_ver" | cut -d. -f2)

    if [[ "$major" -lt 2 || ( "$major" -eq 2 && "$minor" -lt 5 ) ]]; then
        _doctor_fail "Ruby $ruby_ver is too old (need >= 2.5). Upgrade recommended."
        return 1
    fi

    if [[ "$major" -eq 2 && "$minor" -lt 7 ]]; then
        _doctor_warn "Ruby $ruby_ver is supported but >= 3.0 is recommended"
    else
        _doctor_pass "Ruby $ruby_ver"
    fi
    return 0
}

# ---------------------------------------------------------------------------
# doctor_check_bundler
# ---------------------------------------------------------------------------
doctor_check_bundler() {
    if ! command -v bundle >/dev/null 2>&1; then
        _doctor_warn "Bundler not found — run: gem install bundler"
        return 0   # warn, not fail
    fi
    local bver
    bver=$(bundle --version 2>/dev/null | awk '{print $NF}')
    _doctor_pass "Bundler $bver"
}

# ---------------------------------------------------------------------------
# doctor_check_docker
# ---------------------------------------------------------------------------
doctor_check_docker() {
    local profile="${SPEC_PROFILE:-default}"
    case "$profile" in
        minimal|github-pages)
            _doctor_pass "Docker: not required for profile '$profile'"
            return 0
            ;;
    esac

    if ! command -v docker >/dev/null 2>&1; then
        _doctor_warn "Docker not found. Install Docker Desktop for best dev experience."
        return 0
    fi

    if ! docker info >/dev/null 2>&1; then
        _doctor_warn "Docker daemon not running. Start Docker Desktop."
        return 0
    fi

    _doctor_pass "Docker (daemon running)"
}

# ---------------------------------------------------------------------------
# doctor_check_git
# ---------------------------------------------------------------------------
doctor_check_git() {
    if ! command -v git >/dev/null 2>&1; then
        _doctor_fail "git not found. Install git before proceeding."
        return 1
    fi
    local gver
    gver=$(git --version | awk '{print $3}')
    _doctor_pass "git $gver"
}

# ---------------------------------------------------------------------------
# doctor_check_gh
# ---------------------------------------------------------------------------
doctor_check_gh() {
    if ! command -v gh >/dev/null 2>&1; then
        _doctor_warn "GitHub CLI (gh) not found. Some features will be limited."
        return 0
    fi
    local ghver
    ghver=$(gh --version 2>/dev/null | head -1 | awk '{print $3}')
    _doctor_pass "GitHub CLI $ghver"
}

# ---------------------------------------------------------------------------
# doctor_check_writable TARGET_DIR
# ---------------------------------------------------------------------------
doctor_check_writable() {
    local target="$1"
    if [[ -z "$target" ]]; then
        _doctor_warn "doctor_check_writable: no target_dir specified"
        return 0
    fi

    # If directory doesn't exist, check parent
    local check_dir="$target"
    while [[ ! -d "$check_dir" ]]; do
        check_dir=$(dirname "$check_dir")
    done

    if [[ ! -w "$check_dir" ]]; then
        _doctor_fail "Target directory not writable: $check_dir"
        return 1
    fi
    _doctor_pass "Target directory writable: $check_dir"
}

# ---------------------------------------------------------------------------
# doctor_run [TARGET_DIR]
# ---------------------------------------------------------------------------
doctor_run() {
    local target="${1:-${SPEC_TARGET_DIR:-}}"
    local failures=0

    printf "\n${_LOG_BOLD:-}Doctor: pre-install checks${_LOG_NC:-}\n" >&2

    doctor_check_ruby     || failures=$(( failures + 1 ))
    doctor_check_bundler
    doctor_check_docker
    doctor_check_git      || failures=$(( failures + 1 ))
    doctor_check_gh
    [[ -n "$target" ]] && { doctor_check_writable "$target" || failures=$(( failures + 1 )); }

    if [[ $failures -eq 0 ]]; then
        printf "\n${_LOG_GREEN:-}Doctor: all checks passed.${_LOG_NC:-}\n\n" >&2
        return 0
    fi

    printf "\n${_LOG_YELLOW:-}Doctor: %d issue(s) found. See above.${_LOG_NC:-}\n\n" \
        "$failures" >&2
    return 1
}
