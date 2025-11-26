#!/bin/bash

# Common utilities library for zer0-mistakes release scripts
# Provides shared functions for logging, error handling, and utilities
# Source this file in other scripts: source "$(dirname "$0")/lib/common.sh"

set -euo pipefail

# Colors for output
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export CYAN='\033[0;36m'
export PURPLE='\033[0;35m'
export NC='\033[0m' # No Color

# Global flags
export DRY_RUN=${DRY_RUN:-false}
export VERBOSE=${VERBOSE:-false}
export INTERACTIVE=${INTERACTIVE:-true}

# Logging functions
log() {
    echo -e "${GREEN}[LOG]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

debug() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${PURPLE}[DEBUG]${NC} $1" >&2
    fi
}

# User confirmation
confirm() {
    local message="$1"
    
    if [[ "$INTERACTIVE" == "false" ]]; then
        debug "Non-interactive mode: auto-confirming '$message'"
        return 0
    fi
    
    echo -e "${YELLOW}$message (y/N)${NC}"
    read -r response
    [[ "$response" =~ ^[Yy]$ ]]
}

# Dry run wrapper
dry_run_exec() {
    local description="$1"
    shift
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would execute: $description"
        debug "Command: $*"
        return 0
    else
        debug "Executing: $*"
        "$@"
    fi
}

# Check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Validate required command
require_command() {
    local cmd="$1"
    local install_hint="${2:-}"
    
    if ! command_exists "$cmd"; then
        error "Required command not found: $cmd${install_hint:+ ($install_hint)}"
    fi
    debug "Found required command: $cmd"
}

# Check if file exists
require_file() {
    local file="$1"
    local description="${2:-file}"
    
    if [[ ! -f "$file" ]]; then
        error "Required $description not found: $file"
    fi
    debug "Found required file: $file"
}

# Get script directory
get_script_dir() {
    local script_path="${BASH_SOURCE[0]}"
    while [[ -L "$script_path" ]]; do
        local dir="$(cd -P "$(dirname "$script_path")" && pwd)"
        script_path="$(readlink "$script_path")"
        [[ "$script_path" != /* ]] && script_path="$dir/$script_path"
    done
    cd -P "$(dirname "$script_path")" && pwd
}

# Get repository root
get_repo_root() {
    git rev-parse --show-toplevel 2>/dev/null || error "Not in a git repository"
}

# Print header
print_header() {
    local title="$1"
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$title${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# Print summary
print_summary() {
    local title="$1"
    shift
    
    echo ""
    echo -e "${CYAN}📋 $title${NC}"
    for item in "$@"; do
        echo -e "  $item"
    done
    echo ""
}

# Export functions for use in other scripts
export -f log info step success warn error debug
export -f confirm dry_run_exec
export -f command_exists require_command require_file
export -f get_script_dir get_repo_root
export -f print_header print_summary
