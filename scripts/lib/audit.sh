#!/bin/bash
# audit.sh — shared helpers for theme-consumer file auditing
# Source this from scripts/bin/audit-consumer and scripts/bin/manifest.
# Requires: common.sh to already be sourced.

# ---------------------------------------------------------------------------
# SHA-256 helpers (cross-platform: macOS sha256sum vs GNU sha256sum)
# ---------------------------------------------------------------------------
sha256_file() {
    local file="$1"
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$file" | awk '{print $1}'
    else
        shasum -a 256 "$file" | awk '{print $1}'
    fi
}

# ---------------------------------------------------------------------------
# Manifest parsing — reads _data/theme-manifest.yml via awk (no yq needed)
# ---------------------------------------------------------------------------
# Returns the value of a top-level scalar key in a YAML file.
manifest_scalar() {
    local manifest_file="$1"
    local key="$2"
    awk -v k="$key" '
        /^[a-zA-Z_][a-zA-Z0-9_]*:/ {
            match($0, /^([a-zA-Z_][a-zA-Z0-9_]*): *(.*)/, arr)
            if (arr[1] == k) { gsub(/^[[:space:]"'"'"']+|[[:space:]"'"'"']+$/, "", arr[2]); print arr[2]; exit }
        }
    ' "$manifest_file"
}

# Returns each item in a top-level YAML list (- item entries).
manifest_list() {
    local manifest_file="$1"
    local key="$2"
    awk -v k="$key" '
        $0 ~ "^" k ":[ ]*$" { in_block=1; next }
        in_block && /^[[:space:]]*- / {
            line=$0; gsub(/^[[:space:]]*- |[[:space:]]*$/, "", line)
            # strip optional inline comment
            sub(/ *#.*$/, "", line)
            if (line != "") print line
        }
        in_block && /^[a-zA-Z_]/ { in_block=0 }
    ' "$manifest_file"
}

# Read the per-file checksum section from the manifest.
# Emits lines of: <relpath> <sha256>
manifest_checksums() {
    local manifest_file="$1"
    awk '
        /^file_checksums:/ { in_block=1; next }
        in_block && /^  [^ ]/ {
            # lines look like:   _layouts/default.html: "abc123..."
            line=$0; gsub(/^[[:space:]]+/, "", line)
            split(line, arr, ": ")
            path=arr[1]; sha=arr[2]
            gsub(/"/, "", sha); gsub(/[[:space:]]/, "", sha)
            if (path != "" && sha != "") print path " " sha
        }
        in_block && /^[a-zA-Z_]/ { in_block=0 }
    ' "$manifest_file"
}

# ---------------------------------------------------------------------------
# Override manifest parsing (.theme-overrides.yml in consumer root)
# ---------------------------------------------------------------------------
# Returns each justified override path (under overrides: list).
overrides_list() {
    local overrides_file="$1"
    awk '
        /^overrides:/ { in_block=1; next }
        in_block && /^  - path: / {
            path=$0; gsub(/^.*path: */, "", path); gsub(/[[:space:]]*$/, "", path)
            print path
        }
        in_block && /^[a-zA-Z_]/ { in_block=0 }
    ' "$overrides_file" | tr -d '"'"'"
}

# ---------------------------------------------------------------------------
# Classification logic
# ---------------------------------------------------------------------------
# classify_file <theme_path> <consumer_path> <relpath> <override_paths_file>
# Emits one of: IDENTICAL DIFFERS_JUSTIFIED DIFFERS_UNJUSTIFIED UNIQUE MISSING_LOCALLY
classify_file() {
    local theme_root="$1"
    local consumer_root="$2"
    local relpath="$3"
    local override_paths_file="$4"     # temp file listing justified paths (one per line)

    local theme_file="$theme_root/$relpath"
    local consumer_file="$consumer_root/$relpath"

    # File only in consumer (theme doesn't have it → unique to consumer)
    if [[ ! -f "$theme_file" ]]; then
        echo "UNIQUE"
        return
    fi

    # File missing in consumer
    if [[ ! -f "$consumer_file" ]]; then
        echo "MISSING_LOCALLY"
        return
    fi

    # Compare content
    local theme_sha consumer_sha
    theme_sha=$(sha256_file "$theme_file")
    consumer_sha=$(sha256_file "$consumer_file")

    if [[ "$theme_sha" == "$consumer_sha" ]]; then
        echo "IDENTICAL"
        return
    fi

    # Files differ — check if justified
    if grep -qxF "$relpath" "$override_paths_file" 2>/dev/null; then
        echo "DIFFERS_JUSTIFIED"
    else
        echo "DIFFERS_UNJUSTIFIED"
    fi
}

# classify_plugin <plugin_relpath> <consumer_root> <mode>
# mode: gem | remote_theme
# Emits: MISSING_PLUGIN STALE_PLUGIN OK NOT_REQUIRED
classify_plugin() {
    local plugin_relpath="$1"
    local consumer_root="$2"
    local mode="$3"
    local theme_root="$4"

    local consumer_plugin="$consumer_root/$plugin_relpath"

    if [[ "$mode" != "remote_theme" ]]; then
        # Gem mode: theme loads plugins itself — consumer doesn't need a copy
        echo "NOT_REQUIRED"
        return
    fi

    if [[ ! -f "$consumer_plugin" ]]; then
        echo "MISSING_PLUGIN"
        return
    fi

    # Check staleness
    local theme_plugin="$theme_root/$plugin_relpath"
    if [[ -f "$theme_plugin" ]]; then
        local theme_sha consumer_sha
        theme_sha=$(sha256_file "$theme_plugin")
        consumer_sha=$(sha256_file "$consumer_plugin")
        if [[ "$theme_sha" != "$consumer_sha" ]]; then
            echo "STALE_PLUGIN"
            return
        fi
    fi

    echo "OK"
}

# ---------------------------------------------------------------------------
# Theme-path auto-resolution
# ---------------------------------------------------------------------------
resolve_theme_path() {
    local mode="$1"
    local consumer_root="$2"
    local sibling_theme_root="${3:-}"   # optional explicit path

    if [[ -n "$sibling_theme_root" ]]; then
        echo "$sibling_theme_root"
        return
    fi

    if [[ "$mode" == "gem" ]]; then
        local gem_path
        gem_path=$(cd "$consumer_root" && bundle show jekyll-theme-zer0 2>/dev/null || true)
        if [[ -n "$gem_path" && -d "$gem_path" ]]; then
            echo "$gem_path"
            return
        fi
    fi

    # remote_theme mode or gem resolution failed: check work/theme-cache/
    local cache_dir="$consumer_root/work/theme-cache/zer0-mistakes"
    if [[ -d "$cache_dir" ]]; then
        echo "$cache_dir"
        return
    fi

    echo ""
}

# ---------------------------------------------------------------------------
# Detect consumer mode from _config.yml
# ---------------------------------------------------------------------------
detect_consumer_mode() {
    local consumer_root="$1"
    local config="$consumer_root/_config.yml"

    if [[ ! -f "$config" ]]; then
        echo "unknown"
        return
    fi

    if grep -qE '^remote_theme:' "$config"; then
        echo "remote_theme"
    else
        echo "gem"
    fi
}

# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------
print_classification() {
    local classification="$1"
    local relpath="$2"
    local format="${3:-text}"

    case "$classification" in
        IDENTICAL)
            local color="${GREEN}"
            local icon="✓"
            ;;
        DIFFERS_JUSTIFIED)
            local color="${CYAN}"
            local icon="~"
            ;;
        DIFFERS_UNJUSTIFIED)
            local color="${RED}"
            local icon="✗"
            ;;
        UNIQUE)
            local color="${BLUE}"
            local icon="+"
            ;;
        MISSING_LOCALLY)
            local color="${YELLOW}"
            local icon="?"
            ;;
        MISSING_PLUGIN)
            local color="${RED}"
            local icon="!"
            ;;
        STALE_PLUGIN)
            local color="${YELLOW}"
            local icon="~"
            ;;
        OK)
            local color="${GREEN}"
            local icon="✓"
            ;;
        NOT_REQUIRED)
            local color="${BLUE}"
            local icon="-"
            ;;
        OPTIONAL_PLUGIN)
            local color="${CYAN}"
            local icon="?"
            ;;
        *)
            local color="${NC}"
            local icon="?"
            ;;
    esac

    if [[ "$format" == "github" ]]; then
        case "$classification" in
            DIFFERS_UNJUSTIFIED|MISSING_PLUGIN)
                echo "::warning file=$relpath::$classification" ;;
            STALE_PLUGIN)
                echo "::notice file=$relpath::STALE_PLUGIN" ;;
            OPTIONAL_PLUGIN)
                echo "::notice file=$relpath::OPTIONAL_PLUGIN (not required)" ;;
        esac
    elif [[ "$format" == "json" ]]; then
        echo "  {\"path\":\"$relpath\",\"status\":\"$classification\"},"
    else
        echo -e "${color}[$classification]${NC} $relpath"
    fi
}
