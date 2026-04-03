#!/bin/bash
# =========================================================================
# Zer0-Mistakes Platform Setup: macOS
# =========================================================================
# Detects and installs prerequisites for macOS (Intel & Apple Silicon).
# Called by install.sh during platform detection phase.
#
# Usage: source scripts/platform/setup-macos.sh
#        setup_macos [--install-missing]
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
# Detect macOS architecture
# -------------------------------------------------------------------------
detect_macos_arch() {
    local arch
    arch="$(uname -m)"
    case "$arch" in
        arm64)  echo "apple-silicon" ;;
        x86_64) echo "intel" ;;
        *)      echo "unknown" ;;
    esac
}

# -------------------------------------------------------------------------
# Check if Homebrew is installed
# -------------------------------------------------------------------------
check_homebrew() {
    if command -v brew &>/dev/null; then
        return 0
    fi
    return 1
}

install_homebrew() {
    log_info "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for Apple Silicon
    if [[ "$(detect_macos_arch)" == "apple-silicon" ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
}

# -------------------------------------------------------------------------
# Check individual prerequisites
# -------------------------------------------------------------------------
check_git_macos() {
    command -v git &>/dev/null
}

check_docker_macos() {
    command -v docker &>/dev/null && docker info &>/dev/null 2>&1
}

check_docker_installed_macos() {
    command -v docker &>/dev/null
}

check_ruby_macos() {
    command -v ruby &>/dev/null && [[ "$(ruby -e 'puts RUBY_VERSION')" > "3.0" ]]
}

# -------------------------------------------------------------------------
# Install prerequisites
# -------------------------------------------------------------------------
install_git_macos() {
    if check_homebrew; then
        brew install git
    else
        log_info "Install Xcode Command Line Tools for git:"
        xcode-select --install 2>/dev/null || true
    fi
}

install_docker_macos() {
    if check_homebrew; then
        log_info "Installing Docker Desktop via Homebrew..."
        brew install --cask docker
        log_warning "Docker Desktop installed. Please open it from Applications to complete setup."
        log_info "After Docker Desktop starts, re-run this installer."
    else
        log_info "Download Docker Desktop from: https://www.docker.com/products/docker-desktop"
        log_info "Choose the $(detect_macos_arch) version for your Mac."
    fi
}

install_ruby_macos() {
    if check_homebrew; then
        log_info "Installing Ruby via Homebrew..."
        brew install ruby
        log_info "Add Ruby to PATH: export PATH=\"/opt/homebrew/opt/ruby/bin:\$PATH\""
    else
        log_info "Install Homebrew first, then run: brew install ruby"
    fi
}

# -------------------------------------------------------------------------
# Main setup function
# -------------------------------------------------------------------------
setup_macos() {
    local install_missing="${1:-false}"
    local arch
    arch="$(detect_macos_arch)"
    local all_ok=true

    log_info "macOS detected (${arch})"
    echo

    # --- Homebrew ---
    if check_homebrew; then
        log_success "Homebrew: $(brew --version | head -1)"
    else
        log_warning "Homebrew: not installed"
        if [[ "$install_missing" == "--install-missing" ]]; then
            install_homebrew
        else
            log_info "  Install: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            all_ok=false
        fi
    fi

    # --- Git ---
    if check_git_macos; then
        log_success "Git: $(git --version)"
    else
        log_warning "Git: not installed"
        if [[ "$install_missing" == "--install-missing" ]]; then
            install_git_macos
        else
            log_info "  Install: brew install git"
            all_ok=false
        fi
    fi

    # --- Docker ---
    if check_docker_macos; then
        log_success "Docker: $(docker --version)"
    elif check_docker_installed_macos; then
        log_warning "Docker: installed but not running"
        log_info "  Start Docker Desktop from Applications, then re-run."
        all_ok=false
    else
        log_warning "Docker: not installed"
        if [[ "$install_missing" == "--install-missing" ]]; then
            install_docker_macos
        else
            log_info "  Install: brew install --cask docker"
            all_ok=false
        fi
    fi

    # --- Ruby (optional — only needed for non-Docker) ---
    if check_ruby_macos; then
        log_success "Ruby: $(ruby --version)"
    else
        log_info "Ruby 3.0+: not found (only needed for native development, Docker works without it)"
    fi

    echo
    if [[ "$all_ok" == true ]]; then
        log_success "All macOS prerequisites satisfied."
        return 0
    else
        log_warning "Some prerequisites are missing. Use --install-missing to auto-install."
        return 1
    fi
}

# ── Entrypoint (when executed directly, not sourced) ─────────────────────
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
    setup_macos "$@"
fi
