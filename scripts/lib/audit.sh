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

# manifest_has_key <manifest_file> <key>
# Succeeds when the manifest declares the top-level key at all, so a list that
# is deliberately empty is told apart from a snapshot that predates the key.
manifest_has_key() {
    local manifest_file="$1"
    local key="$2"
    grep -qE "^${key}:" "$manifest_file"
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
# Vendored theme data
# ---------------------------------------------------------------------------
# Jekyll 3.10 (GitHub Pages, and the theme's own Gemfile) never loads a theme's
# _data/, so a consumer reads the theme's data only from its own copy, and that
# copy does not float with remote_theme. A fix the theme makes to its data
# (#240 added the `dark` and `contrast` skins) never reaches the sites that
# vendored the file before it, and nothing reported it (#556).
#
# Theme-owned registries a consumer copies verbatim. scripts/bin/manifest
# publishes this list as `vendored_data_paths`; scripts/bin/audit-consumer falls
# back to it when the manifest it reads was cut before that key existed.
# shellcheck disable=SC2034  # read by scripts/bin/manifest and scripts/bin/audit-consumer
THEME_VENDORED_DATA_PATHS=(
    "_data/theme_skins.yml"
    "_data/theme_backgrounds.yml"
)

# classify_vendored_data <theme_root> <consumer_root> <relpath> <override_paths_file>
# Emits one of: IDENTICAL STALE DIFFERS_JUSTIFIED MISSING, or nothing when the
# theme checkout does not ship the file (an older theme has nothing to compare).
classify_vendored_data() {
    local theme_root="$1"
    local consumer_root="$2"
    local relpath="$3"
    local override_paths_file="$4"

    [[ -f "$theme_root/$relpath" ]] || return 0

    case "$(classify_file "$theme_root" "$consumer_root" "$relpath" "$override_paths_file")" in
        IDENTICAL)           echo "IDENTICAL" ;;
        DIFFERS_JUSTIFIED)   echo "DIFFERS_JUSTIFIED" ;;
        DIFFERS_UNJUSTIFIED) echo "STALE" ;;
        MISSING_LOCALLY)     echo "MISSING" ;;
    esac
}

# missing_data_keys <theme_yml> <consumer_yml>
# Prints, one per line, every key the theme's `en:` block has that the
# consumer's `en:` block lacks (the top-level keys, for a file without an `en:`
# block). A consumer customises the VALUES in these files, so bytes are not
# compared; a key it lacks is a label the theme reads and the site never got.
# Returns 2 when ruby is unavailable, 1 when either file does not parse.
missing_data_keys() {
    local theme_yml="$1"
    local consumer_yml="$2"

    command -v ruby >/dev/null 2>&1 || return 2

    # Runs on Ruby 2.6: its Psych 3.1 already takes these keywords. `aliases`
    # is needed because ui-text.yml builds its regional blocks from &DEFAULT_EN.
    ruby -ryaml -rdate -e '
        def load_yaml(path)
          YAML.safe_load(File.read(path), permitted_classes: [Date, Time], aliases: true)
        end
        begin
          theme = load_yaml(ARGV[0])
          consumer = load_yaml(ARGV[1])
        rescue Psych::Exception, SystemCallError => e
          abort e.message
        end
        abort "#{ARGV[0]}: not a YAML mapping" unless theme.is_a?(Hash)
        scoped = theme["en"].is_a?(Hash)
        want = scoped ? theme["en"] : theme
        have = consumer.is_a?(Hash) ? (scoped ? consumer["en"] : consumer) : nil
        have = {} unless have.is_a?(Hash)
        (want.keys.map(&:to_s) - have.keys.map(&:to_s)).each { |key| puts key }
    ' "$theme_yml" "$consumer_yml"
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

    # Match a top-level `remote_theme` key. The whitespace class before the
    # colon is load-bearing: most fleet consumers write column-aligned YAML
    # (`remote_theme             : "bamr87/zer0-mistakes"`), which a bare
    # `^remote_theme:` never matches — every one of them was silently
    # misreported as gem mode, skipping the plugin checks entirely.
    # `|| true` keeps a no-match grep from tripping the caller's `set -o pipefail`.
    local line value
    line=$(grep -m1 -E '^remote_theme[[:space:]]*:' "$config" 2>/dev/null || true)
    value=$(printf '%s' "$line" \
            | sed -E 's/^remote_theme[[:space:]]*:[[:space:]]*//; s/[[:space:]]*(#.*)?$//; s/^"(.*)"$/\1/; s/^'\''(.*)'\''$/\1/')

    # `remote_theme: false` (or an empty value) is how a consumer turns the
    # remote theme OFF and resolves the theme as a gem instead.
    if [[ -n "$value" && "$value" != "false" ]]; then
        echo "remote_theme"
    else
        echo "gem"
    fi
}

# detect_consumer_source <consumer_root>
# Echoes the Jekyll `source:` value from _config.yml (relative path), or empty.
#
# Jekyll's `source:` relocates the whole site tree — zer0-pages keeps every
# theme-shadowing file under `pages/`. Auditing the repo root there reports a
# falsely clean "0 overrides, 0 unique files"; the real surface only appears
# when the scan follows `source:`.
detect_consumer_source() {
    local consumer_root="$1"
    local config="$consumer_root/_config.yml"

    [[ -f "$config" ]] || return 0

    local line
    line=$(grep -m1 -E '^source[[:space:]]*:' "$config" 2>/dev/null || true)
    printf '%s' "$line" \
        | sed -E 's/^source[[:space:]]*:[[:space:]]*//; s/[[:space:]]*(#.*)?$//; s/^"(.*)"$/\1/; s/^'\''(.*)'\''$/\1/; s#^\./##; s#/$##'
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
        STALE)
            local color="${RED}"
            local icon="✗"
            ;;
        MISSING)
            local color="${YELLOW}"
            local icon="?"
            ;;
        MISSING_KEYS)
            local color="${YELLOW}"
            local icon="!"
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
        # Separator goes BEFORE each entry but the first, so the array never
        # ends on a dangling comma. Emitting a trailing comma per entry (the
        # previous behaviour) produced `...},\n]}` — which no JSON parser
        # accepts, making --format json unusable for any CI consumer.
        if [[ "${JSON_ENTRY_EMITTED:-0}" == "1" ]]; then
            printf ',\n'
        fi
        JSON_ENTRY_EMITTED=1
        printf '  {"path":"%s","status":"%s"}' "$relpath" "$classification"
    else
        echo -e "${color}[$classification]${NC} $relpath"
    fi
}

# json_escape <string> — escape backslashes and double quotes for a JSON string.
json_escape() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    printf '%s' "$s"
}

# print_data_classification <classification> <relpath> <format> [missing_keys]
# Text and github output for the vendored-data pass. missing_keys is the
# newline-separated list missing_data_keys printed. (--format json collects
# these into the report's separate "vendored_data" array instead: for data,
# IDENTICAL means "current, keep it", never the themable "safe to delete".)
print_data_classification() {
    local classification="$1"
    local relpath="$2"
    local format="${3:-text}"
    local keys="${4:-}"
    local count=0 list=""

    if [[ -n "$keys" ]]; then
        count=$(printf '%s\n' "$keys" | wc -l | tr -d ' ')
        list=$(printf '%s\n' "$keys" | paste -s -d ',' - | sed 's/,/, /g')
    fi

    if [[ "$format" == "github" ]]; then
        case "$classification" in
            STALE)
                echo "::warning file=$relpath::STALE vendored theme data: differs from the theme and is not declared in .theme-overrides.yml (refresh it with audit-consumer --fix)" ;;
            MISSING)
                echo "::notice file=$relpath::MISSING: this site has no copy, so the theme's includes fall back to built-in defaults" ;;
            MISSING_KEYS)
                echo "::warning file=$relpath::MISSING_KEYS ($count): $list" ;;
        esac
        return 0
    fi

    print_classification "$classification" "$relpath" "$format"
    if [[ "$classification" == "MISSING_KEYS" ]]; then
        echo "    $count key(s) absent from en: $list"
    fi
    return 0
}

# data_json_entry <classification> <relpath> [missing_keys]
# One object of the JSON report's "vendored_data" array.
data_json_entry() {
    local classification="$1"
    local relpath="$2"
    local keys="${3:-}"
    local entry key sep=""

    entry="{\"path\":\"$(json_escape "$relpath")\",\"status\":\"$classification\""
    if [[ -n "$keys" ]]; then
        entry+=',"missing_keys":['
        while IFS= read -r key; do
            [[ -n "$key" ]] || continue
            entry+="${sep}\"$(json_escape "$key")\""
            sep=","
        done <<< "$keys"
        entry+=']'
    fi
    printf '%s}' "$entry"
}
