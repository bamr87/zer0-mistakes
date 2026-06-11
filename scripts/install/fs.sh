#!/bin/bash
# =============================================================================
# scripts/install/fs.sh — Idempotent filesystem operations
# =============================================================================
# ALL file writes in the installer go through this module.
# Provides:
#   fs_copy_file      SRC DEST [--force] [--dry-run]
#   fs_copy_dir       SRC DEST [--force] [--dry-run]
#   fs_write_file     DEST CONTENT [--force] [--dry-run]
#   fs_ensure_dir     PATH [--dry-run]
#   fs_backup_file    FILE  → creates FILE.backup.YYYYMMDD_HHMMSS
#   fs_file_exists    FILE  → returns 0 if exists
#
# Globals read (set by caller / spec):
#   _FS_DRY_RUN   — "1" → never write, only log
#   _FS_FORCE     — "1" → overwrite without prompting (still backs up)
#   _FS_BACKUP    — "1" (default) → create backups before overwriting
#   _FS_VERBOSE   — "1" → extra debug output
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_FS_LIB:-}" ]] && return 0
_HAS_FS_LIB=1

_FS_DRY_RUN="${_FS_DRY_RUN:-0}"
_FS_FORCE="${_FS_FORCE:-0}"
_FS_BACKUP="${_FS_BACKUP:-1}"
_FS_VERBOSE="${_FS_VERBOSE:-0}"

# Create a timestamped backup of FILE; prints backup path.
fs_backup_file() {
    local file="$1"
    [ -e "$file" ] || return 0
    local bak="${file}.backup.$(date +%Y%m%d_%H%M%S)"
    if [[ "${_FS_DRY_RUN:-0}" == "1" ]]; then
        log_debug "[dry-run] would backup: $file → $bak"
        return 0
    fi
    cp -a "$file" "$bak"
    log_warning "Backed up: $(basename "$file") → $(basename "$bak")"
    echo "$bak"
}

# Copy a single file SRC → DEST. Backs up DEST if it exists (unless --force).
fs_copy_file() {
    local src="$1"
    local dest="$2"

    if [[ ! -f "$src" ]]; then
        log_error "fs_copy_file: source not found: $src"
        return 1
    fi

    if [[ "${_FS_DRY_RUN:-0}" == "1" ]]; then
        log_info "[dry-run] copy: $src → $dest"
        return 0
    fi

    fs_ensure_dir "$(dirname "$dest")"

    if [[ -f "$dest" ]]; then
        if [[ "${_FS_BACKUP:-1}" == "1" ]]; then
            fs_backup_file "$dest" > /dev/null
        fi
    fi

    cp "$src" "$dest"
    log_info "Wrote: $dest"
}

# Recursively copy directory SRC → DEST.
fs_copy_dir() {
    local src="$1"
    local dest="$2"

    if [[ ! -d "$src" ]]; then
        log_error "fs_copy_dir: source not found: $src"
        return 1
    fi

    if [[ "${_FS_DRY_RUN:-0}" == "1" ]]; then
        log_info "[dry-run] copy dir: $src → $dest"
        return 0
    fi

    if [[ -d "$dest" ]]; then
        if [[ "${_FS_BACKUP:-1}" == "1" ]]; then
            local bak="${dest}.backup.$(date +%Y%m%d_%H%M%S)"
            cp -a "$dest" "$bak"
            log_warning "Backed up dir: $(basename "$dest") → $(basename "$bak")"
        fi
        rm -rf "$dest"
    fi

    cp -r "$src" "$dest"
    log_info "Copied dir: $dest"
}

# Write CONTENT string to DEST.
fs_write_file() {
    local dest="$1"
    local content="$2"

    if [[ "${_FS_DRY_RUN:-0}" == "1" ]]; then
        log_info "[dry-run] write: $dest"
        return 0
    fi

    fs_ensure_dir "$(dirname "$dest")"

    if [[ -f "$dest" && "${_FS_FORCE:-0}" != "1" ]]; then
        log_warning "$(basename "$dest") already exists — skipping (use --force to overwrite)"
        return 0
    fi

    if [[ -f "$dest" && "${_FS_BACKUP:-1}" == "1" ]]; then
        fs_backup_file "$dest" > /dev/null
    fi

    printf '%s\n' "$content" > "$dest"
    log_info "Wrote: $dest"
}

# Ensure directory exists (including parents).
fs_ensure_dir() {
    local dir="$1"
    [[ -d "$dir" ]] && return 0
    if [[ "${_FS_DRY_RUN:-0}" == "1" ]]; then
        log_debug "[dry-run] mkdir -p: $dir"
        return 0
    fi
    mkdir -p "$dir"
    log_debug "Created dir: $dir"
}

fs_file_exists() {
    [[ -f "$1" ]]
}
