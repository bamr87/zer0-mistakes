#!/bin/bash
# =========================================================================
# scripts/lib/install/fs.sh
# =========================================================================
# Filesystem helpers for install.sh: idempotent file/directory copy with
# automatic timestamped backups when destination already exists.
#
# Required globals (set by install.sh before sourcing/use):
#   $TARGET_DIR  — used to compute relative paths in log messages
#
# Functions exported:
#   copy_file_with_backup       SRC DEST
#   copy_directory_with_backup  SRC DEST
# =========================================================================

# Copy a file, backing up the destination if it already exists.
copy_file_with_backup() {
    local src="$1"
    local dest="$2"
    local relative_path="${dest#${TARGET_DIR:-}/}"

    # Create destination directory if it doesn't exist
    mkdir -p "$(dirname "$dest")"

    # Backup existing file if it exists
    if [[ -f "$dest" ]]; then
        local backup_file="${dest}.backup.$(date +%Y%m%d_%H%M%S)"
        log_warning "File exists, creating backup: $relative_path -> ${backup_file##*/}"
        cp "$dest" "$backup_file"
    fi

    # Copy the file
    cp "$src" "$dest"
    log_info "Copied: $relative_path"
}

# Copy a directory, backing up the destination if it already exists.
copy_directory_with_backup() {
    local src="$1"
    local dest="$2"
    local relative_path="${dest#${TARGET_DIR:-}/}"

    if [[ -d "$dest" ]]; then
        local backup_dir="${dest}.backup.$(date +%Y%m%d_%H%M%S)"
        log_warning "Directory exists, creating backup: $relative_path -> ${backup_dir##*/}"
        cp -r "$dest" "$backup_dir"
        rm -rf "$dest"
    fi

    cp -r "$src" "$dest"
    log_info "Copied directory: $relative_path"
}
