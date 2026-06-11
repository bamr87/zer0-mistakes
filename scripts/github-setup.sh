#!/bin/bash
# =========================================================================
# Zer0-Mistakes GitHub Setup
# =========================================================================
# Fork or clone zer0-mistakes via the GitHub CLI (gh), then hand off to
# install.sh --fork for cleanup and personalisation.
#
# Usage:
#   ./scripts/github-setup.sh [OPTIONS]
#
# Options:
#   --repo-name NAME        Name for the new repository (default: my-site)
#   --visibility public|private  Repository visibility (default: public)
#   --github-user USER      GitHub username override
#   --site-name NAME        Site title
#   --author NAME           Author name
#   --email EMAIL           Contact email
#   --clone-only            Clone without forking (use original repo)
#   --non-interactive       Skip prompts
#   -h, --help              Show this help
# =========================================================================

set -euo pipefail

# -------------------------------------------------------------------------
# Load shared config if available
# -------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/../templates/config/install.conf" ]]; then
    # shellcheck source=/dev/null
    source "$SCRIPT_DIR/../templates/config/install.conf"
fi

THEME_NAME="${THEME_NAME:-zer0-mistakes}"
GITHUB_REPO="${GITHUB_REPO:-bamr87/zer0-mistakes}"
GITHUB_URL="${GITHUB_URL:-https://github.com/bamr87/zer0-mistakes}"

# Defaults
REPO_NAME=""
VISIBILITY="public"
GH_USER=""
SITE_NAME=""
AUTHOR=""
EMAIL=""
CLONE_ONLY=false
NON_INTERACTIVE=false

# Colours (reuse or define)
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# -------------------------------------------------------------------------
# Parse arguments
# -------------------------------------------------------------------------
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --repo-name)       REPO_NAME="$2"; shift 2 ;;
            --visibility)      VISIBILITY="$2"; shift 2 ;;
            --github-user)     GH_USER="$2"; shift 2 ;;
            --site-name)       SITE_NAME="$2"; shift 2 ;;
            --author)          AUTHOR="$2"; shift 2 ;;
            --email)           EMAIL="$2"; shift 2 ;;
            --clone-only)      CLONE_ONLY=true; shift ;;
            --non-interactive) NON_INTERACTIVE=true; shift ;;
            -h|--help)         show_help; exit 0 ;;
            *)                 log_error "Unknown option: $1"; show_help; exit 1 ;;
        esac
    done
}

show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Fork or clone zer0-mistakes via GitHub CLI."
    echo
    echo "Options:"
    echo "  --repo-name NAME         Repository name (default: my-site)"
    echo "  --visibility public|private   (default: public)"
    echo "  --github-user USER       GitHub username override"
    echo "  --site-name NAME         Site title for _config.yml"
    echo "  --author NAME            Author name"
    echo "  --email EMAIL            Contact email"
    echo "  --clone-only             Clone without forking"
    echo "  --non-interactive        Skip prompts"
    echo "  -h, --help               Show this help"
}

# -------------------------------------------------------------------------
# Prerequisite checks
# -------------------------------------------------------------------------
check_gh_cli() {
    if ! command -v gh &>/dev/null; then
        log_error "GitHub CLI (gh) is not installed."
        echo
        log_info "Install it:"
        echo "  macOS:   brew install gh"
        echo "  Linux:   https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
        echo "  Windows: winget install --id GitHub.cli"
        echo
        return 1
    fi
    return 0
}

check_gh_auth() {
    if ! gh auth status &>/dev/null 2>&1; then
        log_warning "Not authenticated with GitHub CLI."
        log_info "Run: gh auth login"
        if [[ "$NON_INTERACTIVE" == true ]]; then
            return 1
        fi
        gh auth login
    fi
    return 0
}

# -------------------------------------------------------------------------
# Gather user values interactively
# -------------------------------------------------------------------------
gather_values() {
    local detected_user
    detected_user="$(gh api user --jq '.login' 2>/dev/null || echo "")"

    if [[ -z "$GH_USER" ]]; then
        if [[ "$NON_INTERACTIVE" == true ]]; then
            GH_USER="${detected_user:-your-username}"
        else
            read -r -p "GitHub username [${detected_user:-your-username}]: " GH_USER
            GH_USER="${GH_USER:-${detected_user:-your-username}}"
        fi
    fi

    if [[ -z "$REPO_NAME" ]]; then
        if [[ "$NON_INTERACTIVE" == true ]]; then
            REPO_NAME="my-site"
        else
            read -r -p "Repository name [my-site]: " REPO_NAME
            REPO_NAME="${REPO_NAME:-my-site}"
        fi
    fi

    # Sanitise repo name
    REPO_NAME="$(echo "$REPO_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')"

    if [[ -z "$SITE_NAME" ]]; then
        if [[ "$NON_INTERACTIVE" == true ]]; then
            SITE_NAME="My Jekyll Site"
        else
            read -r -p "Site title [My Jekyll Site]: " SITE_NAME
            SITE_NAME="${SITE_NAME:-My Jekyll Site}"
        fi
    fi

    if [[ -z "$AUTHOR" ]]; then
        local git_name
        git_name="$(git config --global user.name 2>/dev/null || echo "")"
        if [[ "$NON_INTERACTIVE" == true ]]; then
            AUTHOR="${git_name:-Site Author}"
        else
            read -r -p "Author name [${git_name:-Site Author}]: " AUTHOR
            AUTHOR="${AUTHOR:-${git_name:-Site Author}}"
        fi
    fi

    if [[ -z "$EMAIL" ]]; then
        local git_email
        git_email="$(git config --global user.email 2>/dev/null || echo "")"
        if [[ "$NON_INTERACTIVE" == true ]]; then
            EMAIL="${git_email:-your@email.com}"
        else
            read -r -p "Email [${git_email:-your@email.com}]: " EMAIL
            EMAIL="${EMAIL:-${git_email:-your@email.com}}"
        fi
    fi

    echo
    log_info "Configuration:"
    echo "  GitHub user : $GH_USER"
    echo "  Repo name   : $REPO_NAME"
    echo "  Site title  : $SITE_NAME"
    echo "  Author      : $AUTHOR"
    echo "  Email       : $EMAIL"
    echo "  Visibility  : $VISIBILITY"
    echo "  Mode        : $(if $CLONE_ONLY; then echo clone; else echo fork; fi)"
    echo
}

# -------------------------------------------------------------------------
# Fork or clone
# -------------------------------------------------------------------------
do_fork() {
    log_info "Forking ${GITHUB_REPO} → ${GH_USER}/${REPO_NAME}..."

    if gh repo fork "${GITHUB_REPO}" \
            --fork-name "$REPO_NAME" \
            --clone=false 2>/dev/null; then
        log_success "Fork created: ${GH_USER}/${REPO_NAME}"
    else
        log_warning "Fork may already exist — proceeding to clone."
    fi

    log_info "Cloning ${GH_USER}/${REPO_NAME}..."
    gh repo clone "${GH_USER}/${REPO_NAME}" "$REPO_NAME" -- --depth=1 2>/dev/null || \
        gh repo clone "${GH_USER}/${THEME_NAME}" "$REPO_NAME" -- --depth=1
}

do_clone() {
    log_info "Cloning ${GITHUB_REPO}..."
    git clone --depth=1 "${GITHUB_URL}.git" "$REPO_NAME"
}

# -------------------------------------------------------------------------
# Post-clone setup
# -------------------------------------------------------------------------
run_post_setup() {
    local target_dir="$REPO_NAME"

    cd "$target_dir"

    # Hand off to install.sh --fork if it exists
    if [[ -f "./install.sh" ]]; then
        log_info "Running install.sh --fork for site personalisation..."
        bash ./install.sh --fork \
            --site-name "$SITE_NAME" \
            --github-user "$GH_USER" \
            --author "$AUTHOR" \
            --email "$EMAIL" \
            --non-interactive \
            .
    elif [[ -f "./scripts/fork-cleanup.sh" ]]; then
        log_info "Running fork-cleanup.sh..."
        bash ./scripts/fork-cleanup.sh \
            --site-name "$SITE_NAME" \
            --github-user "$GH_USER" \
            --author "$AUTHOR" \
            --email "$EMAIL" \
            --non-interactive
    else
        log_warning "No install.sh or fork-cleanup.sh found. Manual setup required."
    fi

    cd ..
}

# -------------------------------------------------------------------------
# Main
# -------------------------------------------------------------------------
main() {
    parse_args "$@"

    echo
    log_info "Zer0-Mistakes GitHub Setup"
    echo

    check_gh_cli || exit 1
    check_gh_auth || exit 1
    gather_values

    if [[ "$CLONE_ONLY" == true ]]; then
        do_clone
    else
        do_fork
    fi

    run_post_setup

    echo
    log_success "Setup complete!"
    echo
    log_info "Next steps:"
    echo "  cd $REPO_NAME"
    echo "  docker-compose up          # start dev server"
    echo "  open http://localhost:4000  # view your site"
    echo
    if [[ "$CLONE_ONLY" != true ]]; then
        echo "  git push origin main       # deploy to GitHub Pages"
    fi
}

main "$@"
