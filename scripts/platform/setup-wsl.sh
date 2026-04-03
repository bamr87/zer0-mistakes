#!/bin/bash
# =========================================================================
# Zer0-Mistakes Platform Setup: Windows (WSL)
# =========================================================================
# Detects WSL version, validates Docker Desktop integration, and provides
# guidance for Windows users who are NOT yet in WSL.
#
# Usage: source scripts/platform/setup-wsl.sh
#        setup_wsl [--install-missing]
# =========================================================================

# Only enable strict mode when executed directly (not sourced), so we don't
# mutate the caller's shell options.
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
    set -euo pipefail
fi

# ── Fallback logging helpers (used when not sourced from install.sh) ─────
if ! declare -F log_info >/dev/null 2>&1; then
    log_info()    { echo "[INFO]    $*"; }
    log_success() { echo "[SUCCESS] $*"; }
    log_warning() { echo "[WARNING] $*"; }
    log_error()   { echo "[ERROR]   $*" >&2; }
fi

# -------------------------------------------------------------------------
# WSL detection helpers
# -------------------------------------------------------------------------
is_wsl() {
    [[ -f /proc/version ]] && grep -qi 'microsoft\|wsl' /proc/version 2>/dev/null
}

detect_wsl_version() {
    if [[ -f /proc/version ]]; then
        if grep -qi 'WSL2' /proc/version 2>/dev/null; then
            echo "2"
        elif grep -qi 'microsoft\|wsl' /proc/version 2>/dev/null; then
            echo "1"
        else
            echo "0"
        fi
    else
        echo "0"
    fi
}

detect_wsl_distro() {
    if [[ -f /etc/os-release ]]; then
        # shellcheck source=/dev/null
        source /etc/os-release
        echo "${PRETTY_NAME:-WSL Linux}"
    else
        echo "WSL Linux"
    fi
}

# -------------------------------------------------------------------------
# Check Docker Desktop integration
# -------------------------------------------------------------------------
check_docker_wsl() {
    # In WSL, Docker Desktop provides a docker CLI via integration
    if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
        return 0
    fi
    return 1
}

check_docker_desktop_integration() {
    # Docker Desktop creates this socket when WSL integration is enabled
    [[ -S /var/run/docker.sock ]] || [[ -S "$HOME/.docker/run/docker.sock" ]]
}

# -------------------------------------------------------------------------
# Provide Windows setup guidance (for users not yet in WSL)
# -------------------------------------------------------------------------
print_windows_native_guide() {
    echo
    log_error "This script must be run inside WSL (Windows Subsystem for Linux)."
    echo
    echo "======================================================================"
    echo "  WINDOWS SETUP GUIDE — 3 Steps to Get Running"
    echo "======================================================================"
    echo
    echo "  Step 1: Install WSL 2 (open PowerShell as Administrator):"
    echo
    echo "      wsl --install"
    echo
    echo "  Step 2: Install Docker Desktop for Windows:"
    echo
    echo "      https://www.docker.com/products/docker-desktop"
    echo
    echo "      In Docker Desktop Settings → Resources → WSL Integration:"
    echo "      ✅  Enable integration with your WSL 2 distro"
    echo
    echo "  Step 3: Open your WSL terminal and run the installer:"
    echo
    echo "      mkdir my-site && cd my-site"
    echo "      curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash"
    echo
    echo "======================================================================"
    echo
    echo "  Detailed guide: https://learn.microsoft.com/en-us/windows/wsl/install"
    echo
}

# -------------------------------------------------------------------------
# Main setup function
# -------------------------------------------------------------------------
setup_wsl() {
    local install_missing="${1:-false}"
    local wsl_ver
    wsl_ver="$(detect_wsl_version)"
    local wsl_distro
    wsl_distro="$(detect_wsl_distro)"
    local all_ok=true

    log_info "WSL detected: ${wsl_distro} (WSL ${wsl_ver})"
    echo

    # --- WSL version check ---
    if [[ "$wsl_ver" == "2" ]]; then
        log_success "WSL 2: required for Docker Desktop integration"
    elif [[ "$wsl_ver" == "1" ]]; then
        log_error "WSL 1 detected — Docker Desktop requires WSL 2."
        echo
        log_info "Upgrade to WSL 2 (run from Windows PowerShell / Command Prompt):"
        echo "  1. wsl.exe -l -v                    # list distros and their WSL versions"
        echo "  2. wsl.exe --set-version <DistroName> 2   # upgrade a specific distro"
        echo "  3. wsl.exe --set-default-version 2  # make WSL 2 the default for new distros"
        echo
        return 1
    fi

    # --- Git ---
    if command -v git &>/dev/null; then
        log_success "Git: $(git --version)"
    else
        log_warning "Git: not installed"
        if [[ "$install_missing" == "--install-missing" ]]; then
            sudo apt-get update -qq && sudo apt-get install -y -qq git
        else
            log_info "  Install: sudo apt-get install git"
            all_ok=false
        fi
    fi

    # --- Docker (via Docker Desktop integration) ---
    if check_docker_wsl; then
        log_success "Docker: $(docker --version) (via Docker Desktop)"
    elif check_docker_desktop_integration; then
        log_warning "Docker socket found but daemon not responding."
        log_info "  Make sure Docker Desktop is running on Windows."
        all_ok=false
    else
        log_warning "Docker: not available in this WSL session"
        echo
        log_info "Docker Desktop WSL 2 integration setup:"
        echo "  1. Install Docker Desktop for Windows"
        echo "     https://www.docker.com/products/docker-desktop"
        echo "  2. Open Docker Desktop → Settings → Resources → WSL Integration"
        echo "  3. Enable integration with your distro (${wsl_distro})"
        echo "  4. Restart this WSL terminal"
        echo
        all_ok=false
    fi

    # --- Line ending configuration ---
    if command -v git &>/dev/null; then
        local autocrlf
        autocrlf="$(git config --global core.autocrlf 2>/dev/null || echo "")"
        if [[ "$autocrlf" == "input" ]]; then
            log_success "Git line endings: core.autocrlf=input (correct for WSL)"
        else
            log_warning "Git line endings: core.autocrlf=${autocrlf:-unset}"
            log_info "  Recommended: git config --global core.autocrlf input"
            if [[ "$install_missing" == "--install-missing" ]]; then
                git config --global core.autocrlf input
                log_success "Set core.autocrlf=input"
            fi
        fi
    fi

    echo
    if [[ "$all_ok" == true ]]; then
        log_success "All WSL prerequisites satisfied."
        return 0
    else
        log_warning "Some prerequisites are missing. See guidance above."
        return 1
    fi
}

# ── Entrypoint (when executed directly, not sourced) ─────────────────────
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
    setup_wsl "$@"
fi
