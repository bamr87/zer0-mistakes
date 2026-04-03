#!/bin/bash
# =========================================================================
# Zer0-Mistakes Platform Setup: Linux
# =========================================================================
# Detects distro and installs prerequisites for Linux.
# Supports Debian/Ubuntu (apt), Fedora/RHEL (dnf), and Arch (pacman).
#
# Usage: source scripts/platform/setup-linux.sh
#        setup_linux [--install-missing]
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
# Detect Linux distribution
# -------------------------------------------------------------------------
detect_linux_distro() {
    if [[ -f /etc/os-release ]]; then
        # shellcheck source=/dev/null
        source /etc/os-release
        case "$ID" in
            ubuntu|debian|pop|linuxmint|elementary)
                echo "debian"
                ;;
            fedora|rhel|centos|rocky|alma)
                echo "fedora"
                ;;
            arch|manjaro|endeavouros)
                echo "arch"
                ;;
            opensuse*|sles)
                echo "suse"
                ;;
            *)
                echo "unknown"
                ;;
        esac
    else
        echo "unknown"
    fi
}

get_distro_name() {
    if [[ -f /etc/os-release ]]; then
        # shellcheck source=/dev/null
        source /etc/os-release
        echo "${PRETTY_NAME:-Linux}"
    else
        echo "Linux"
    fi
}

# -------------------------------------------------------------------------
# Check prerequisites
# -------------------------------------------------------------------------
check_git_linux() {
    command -v git &>/dev/null
}

check_docker_linux() {
    command -v docker &>/dev/null && docker info &>/dev/null 2>&1
}

check_docker_installed_linux() {
    command -v docker &>/dev/null
}

check_docker_compose_linux() {
    # Docker Compose v2 (plugin) or v1 (standalone)
    docker compose version &>/dev/null 2>&1 || command -v docker-compose &>/dev/null
}

check_ruby_linux() {
    command -v ruby &>/dev/null && [[ "$(ruby -e 'puts RUBY_VERSION')" > "3.0" ]]
}

# -------------------------------------------------------------------------
# Install prerequisites by distro
# -------------------------------------------------------------------------
install_git_linux() {
    local distro
    distro="$(detect_linux_distro)"
    case "$distro" in
        debian)  sudo apt-get update -qq && sudo apt-get install -y -qq git ;;
        fedora)  sudo dnf install -y git ;;
        arch)    sudo pacman -S --noconfirm git ;;
        suse)    sudo zypper install -y git ;;
        *)       log_error "Unsupported distro. Install git manually."; return 1 ;;
    esac
}

install_docker_linux() {
    local distro
    distro="$(detect_linux_distro)"

    log_info "Installing Docker Engine..."
    case "$distro" in
        debian)
            # Determine the correct distro ID for the Docker repo URL
            local docker_distro_id
            # shellcheck source=/dev/null
            docker_distro_id="$(. /etc/os-release 2>/dev/null && echo "${ID:-ubuntu}")"
            # Docker only publishes repos for 'ubuntu' and 'debian'; other
            # derivatives (pop, linuxmint, etc.) should use their base distro.
            case "$docker_distro_id" in
                debian) : ;;           # use 'debian' repo
                *)      docker_distro_id="ubuntu" ;;  # fallback for Ubuntu derivatives
            esac

            sudo apt-get update -qq
            sudo apt-get install -y -qq ca-certificates curl gnupg
            sudo install -m 0755 -d /etc/apt/keyrings
            curl -fsSL "https://download.docker.com/linux/${docker_distro_id}/gpg" | \
                sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null || true
            sudo chmod a+r /etc/apt/keyrings/docker.gpg
            # shellcheck source=/dev/null
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${docker_distro_id} $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
                sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            sudo apt-get update -qq
            sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
        fedora)
            sudo dnf -y install dnf-plugins-core
            sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
            sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
        arch)
            sudo pacman -S --noconfirm docker docker-compose
            ;;
        *)
            log_error "Auto-install not supported for this distro."
            log_info "See https://docs.docker.com/engine/install/ for manual instructions."
            return 1
            ;;
    esac

    # Start Docker and enable on boot
    sudo systemctl start docker 2>/dev/null || true
    sudo systemctl enable docker 2>/dev/null || true

    # Add current user to docker group (avoids sudo)
    if ! groups | grep -q docker; then
        sudo usermod -aG docker "$USER"
        log_warning "Added $USER to docker group. Log out and back in for this to take effect."
        log_info "Or run: newgrp docker"
    fi
}

install_ruby_linux() {
    local distro
    distro="$(detect_linux_distro)"
    case "$distro" in
        debian)  sudo apt-get install -y -qq ruby-full build-essential ;;
        fedora)  sudo dnf install -y ruby ruby-devel gcc make ;;
        arch)    sudo pacman -S --noconfirm ruby base-devel ;;
        *)       log_info "Install Ruby 3.0+ manually for your distribution." ;;
    esac
}

# -------------------------------------------------------------------------
# Main setup function
# -------------------------------------------------------------------------
setup_linux() {
    local install_missing="${1:-false}"
    local distro
    distro="$(detect_linux_distro)"
    local distro_name
    distro_name="$(get_distro_name)"
    local all_ok=true

    log_info "Linux detected: ${distro_name} (family: ${distro})"
    echo

    # --- Git ---
    if check_git_linux; then
        log_success "Git: $(git --version)"
    else
        log_warning "Git: not installed"
        if [[ "$install_missing" == "--install-missing" ]]; then
            install_git_linux
        else
            log_info "  Install: sudo apt-get install git  (or equivalent)"
            all_ok=false
        fi
    fi

    # --- Docker ---
    if check_docker_linux; then
        log_success "Docker: $(docker --version)"
    elif check_docker_installed_linux; then
        log_warning "Docker: installed but daemon not running"
        log_info "  Start: sudo systemctl start docker"
        all_ok=false
    else
        log_warning "Docker: not installed"
        if [[ "$install_missing" == "--install-missing" ]]; then
            install_docker_linux
        else
            log_info "  Install: https://docs.docker.com/engine/install/"
            all_ok=false
        fi
    fi

    # --- Docker Compose ---
    if check_docker_compose_linux; then
        log_success "Docker Compose: available"
    else
        log_warning "Docker Compose: not found (installed with Docker Engine on most distros)"
        all_ok=false
    fi

    # --- Ruby (optional) ---
    if check_ruby_linux; then
        log_success "Ruby: $(ruby --version)"
    else
        log_info "Ruby 3.0+: not found (only needed for native development, Docker works without it)"
    fi

    echo
    if [[ "$all_ok" == true ]]; then
        log_success "All Linux prerequisites satisfied."
        return 0
    else
        log_warning "Some prerequisites are missing. Use --install-missing to auto-install."
        return 1
    fi
}

# ── Entrypoint (when executed directly, not sourced) ─────────────────────
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
    setup_linux "$@"
fi
