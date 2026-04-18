#!/bin/bash

# =========================================================================
# Frontmatter Validation Library
# =========================================================================
# Config-aware shared functions for frontmatter validation.
# All schema data is read from YAML config files — nothing hardcoded.
#
# Requires: ruby (for YAML parsing), common.sh
#
# Usage: source "$(dirname "$0")/lib/frontmatter.sh"
# =========================================================================

# Source common utilities if not already loaded
FRONTMATTER_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if ! declare -f debug &>/dev/null; then
    source "$FRONTMATTER_LIB_DIR/common.sh"
fi

# -------------------------------------------------------------------------
# Configuration paths (overridable via environment)
# -------------------------------------------------------------------------
FRONTMATTER_SCHEMA_PATH="${FRONTMATTER_SCHEMA_PATH:-.github/config/frontmatter_schema.yml}"
CONTENT_RULES_PATH="${CONTENT_RULES_PATH:-.github/config/content_rules.yml}"

# -------------------------------------------------------------------------
# Schema loading
# -------------------------------------------------------------------------

# Load and validate the schema file exists
# Usage: load_schema [schema_path]
load_schema() {
    local schema_path="${1:-$FRONTMATTER_SCHEMA_PATH}"
    local repo_root
    repo_root="$(get_repo_root)"
    local full_path="$repo_root/$schema_path"

    if [[ ! -f "$full_path" ]]; then
        echo "ERROR: Schema file not found: $full_path" >&2
        return 1
    fi

    # Validate YAML is parseable
    if ! ruby -ryaml -e "YAML.load_file('$full_path')" 2>/dev/null; then
        echo "ERROR: Invalid YAML in schema: $full_path" >&2
        return 1
    fi

    echo "$full_path"
    return 0
}

# Get list of collection names from schema
# Usage: get_collections [schema_path]
get_collections() {
    local schema_path="${1:-$FRONTMATTER_SCHEMA_PATH}"
    local repo_root
    repo_root="$(get_repo_root)"
    local full_path="$repo_root/$schema_path"

    ruby -ryaml -e "
        schema = YAML.load_file('$full_path')
        (schema['collections'] || {}).keys.each { |k| puts k }
    " 2>/dev/null
}

# Get required fields for a collection
# Usage: get_required_fields <collection> [schema_path]
get_required_fields() {
    local collection="$1"
    local schema_path="${2:-$FRONTMATTER_SCHEMA_PATH}"
    local repo_root
    repo_root="$(get_repo_root)"
    local full_path="$repo_root/$schema_path"

    ruby -ryaml -e "
        schema = YAML.load_file('$full_path')
        global_required = schema.dig('global', 'required_fields') || []
        collection_required = schema.dig('collections', '$collection', 'required') || []
        (global_required | collection_required).each { |f| puts f }
    " 2>/dev/null
}

# Get optional fields for a collection
# Usage: get_optional_fields <collection> [schema_path]
get_optional_fields() {
    local collection="$1"
    local schema_path="${2:-$FRONTMATTER_SCHEMA_PATH}"
    local repo_root
    repo_root="$(get_repo_root)"
    local full_path="$repo_root/$schema_path"

    ruby -ryaml -e "
        schema = YAML.load_file('$full_path')
        fields = schema.dig('collections', '$collection', 'optional') || []
        fields.each { |f| puts f }
    " 2>/dev/null
}

# Get allowed layout values for a collection
# Usage: get_allowed_layouts <collection> [schema_path]
get_allowed_layouts() {
    local collection="$1"
    local schema_path="${2:-$FRONTMATTER_SCHEMA_PATH}"
    local repo_root
    repo_root="$(get_repo_root)"
    local full_path="$repo_root/$schema_path"

    ruby -ryaml -e "
        schema = YAML.load_file('$full_path')
        layouts = schema.dig('collections', '$collection', 'layout', 'allowed') || []
        layouts.each { |l| puts l }
    " 2>/dev/null
}

# Get path pattern for a collection
# Usage: get_path_pattern <collection> [schema_path]
get_path_pattern() {
    local collection="$1"
    local schema_path="${2:-$FRONTMATTER_SCHEMA_PATH}"
    local repo_root
    repo_root="$(get_repo_root)"
    local full_path="$repo_root/$schema_path"

    ruby -ryaml -e "
        schema = YAML.load_file('$full_path')
        puts schema.dig('collections', '$collection', 'path_pattern') || ''
    " 2>/dev/null
}

# Get a global setting from schema
# Usage: get_global_setting <key> [schema_path]
get_global_setting() {
    local key="$1"
    local schema_path="${2:-$FRONTMATTER_SCHEMA_PATH}"
    local repo_root
    repo_root="$(get_repo_root)"
    local full_path="$repo_root/$schema_path"

    ruby -ryaml -e "
        schema = YAML.load_file('$full_path')
        val = schema.dig('global', '$key')
        if val.is_a?(Hash)
            val.each { |k, v| puts \"#{k}=#{v}\" }
        elsif val.is_a?(Array)
            val.each { |v| puts v }
        else
            puts val
        end
    " 2>/dev/null
}

# Get field type pattern from schema
# Usage: get_field_type_pattern <type_name> [schema_path]
get_field_type_pattern() {
    local type_name="$1"
    local schema_path="${2:-$FRONTMATTER_SCHEMA_PATH}"
    local repo_root
    repo_root="$(get_repo_root)"
    local full_path="$repo_root/$schema_path"

    ruby -ryaml -e "
        schema = YAML.load_file('$full_path')
        puts schema.dig('field_types', '$type_name', 'pattern') || ''
    " 2>/dev/null
}

# Get canonical field mappings (deprecated → canonical)
# Usage: get_canonical_fields [schema_path]
get_canonical_fields() {
    local schema_path="${1:-$FRONTMATTER_SCHEMA_PATH}"
    local repo_root
    repo_root="$(get_repo_root)"
    local full_path="$repo_root/$schema_path"

    ruby -ryaml -e "
        schema = YAML.load_file('$full_path')
        (schema.dig('global', 'canonical_fields') || {}).each { |k, v| puts \"#{k}=#{v}\" }
    " 2>/dev/null
}

# -------------------------------------------------------------------------
# Content rules loading
# -------------------------------------------------------------------------

# Get template mappings from content rules
# Usage: get_template_mappings [rules_path]
get_template_mappings() {
    local rules_path="${1:-$CONTENT_RULES_PATH}"
    local repo_root
    repo_root="$(get_repo_root)"
    local full_path="$repo_root/$rules_path"

    if [[ ! -f "$full_path" ]]; then
        return 1
    fi

    ruby -ryaml -e "
        rules = YAML.load_file('$full_path')
        (rules['template_mappings'] || {}).each { |k, v| puts \"#{k}=#{v}\" }
    " 2>/dev/null
}

# Get auto-fixable rule names
# Usage: get_auto_fixable_rules [rules_path]
get_auto_fixable_rules() {
    local rules_path="${1:-$CONTENT_RULES_PATH}"
    local repo_root
    repo_root="$(get_repo_root)"
    local full_path="$repo_root/$rules_path"

    if [[ ! -f "$full_path" ]]; then
        return 1
    fi

    ruby -ryaml -e "
        rules = YAML.load_file('$full_path')
        (rules['auto_fixable'] || []).each { |r| puts r }
    " 2>/dev/null
}

# -------------------------------------------------------------------------
# Collection detection
# -------------------------------------------------------------------------

# Detect which collection a file belongs to based on path_pattern in schema
# Usage: detect_collection <filepath> [schema_path]
detect_collection() {
    local filepath="$1"
    local schema_path="${2:-$FRONTMATTER_SCHEMA_PATH}"
    local repo_root
    repo_root="$(get_repo_root)"
    local full_path="$repo_root/$schema_path"

    ruby -ryaml -e "
        require 'pathname'
        schema = YAML.load_file('$full_path')
        filepath = '$filepath'
        # Make path relative to repo root if absolute
        filepath = Pathname.new(filepath).relative_path_from(Pathname.new('$repo_root')).to_s rescue filepath

        matched = nil
        (schema['collections'] || {}).each do |name, config|
            pattern = config['path_pattern'] || ''
            # Convert glob pattern to regex
            regex_str = pattern.gsub('**/', '(.+/)?').gsub('**', '.*').gsub('*', '[^/]*')
            if filepath.match?(Regexp.new('^' + regex_str + '$'))
                matched = name
                break
            end
        end
        puts matched || 'unknown'
    " 2>/dev/null
}

# -------------------------------------------------------------------------
# Frontmatter extraction
# -------------------------------------------------------------------------

# Extract frontmatter from a markdown file as YAML
# Usage: extract_frontmatter <filepath>
# Returns: YAML content between --- delimiters, or empty string
extract_frontmatter() {
    local filepath="$1"

    if [[ ! -f "$filepath" ]]; then
        echo ""
        return 1
    fi

    # Frontmatter must START on the first line with ---
    # Otherwise mid-document horizontal rules would be misread as frontmatter.
    local first_line
    IFS= read -r first_line < "$filepath" || true
    if [[ ! "$first_line" =~ ^---[[:space:]]*$ ]]; then
        echo ""
        return 1
    fi

    # Extract content between first pair of ---
    awk '
        /^---[[:space:]]*$/ {
            if (count == 0) { count++; next }
            if (count == 1) { exit }
        }
        count == 1 { print }
    ' "$filepath"
}

# Get a specific frontmatter field value
# Usage: get_frontmatter_field <filepath> <field_name>
get_frontmatter_field() {
    local filepath="$1"
    local field="$2"
    local fm

    fm="$(extract_frontmatter "$filepath")"
    if [[ -z "$fm" ]]; then
        echo ""
        return 1
    fi

    echo "$fm" | ruby -ryaml -rdate -e "
        begin
            data = YAML.safe_load(STDIN.read, permitted_classes: [Date, Time, Symbol], aliases: true) || {}
            val = data['$field']
            format = lambda do |v|
                case v
                when Time then v.utc.strftime('%Y-%m-%dT%H:%M:%S.') + format('%03d', v.usec / 1000) + 'Z'
                when Date then v.strftime('%Y-%m-%d')
                else v.to_s
                end
            end
            if val.is_a?(Array)
                val.each { |v| puts format.call(v) }
            elsif val.nil?
                # output nothing
            else
                puts format.call(val)
            end
        rescue => e
            STDERR.puts \"YAML parse error: #{e.message}\"
            exit 1
        end
    " 2>/dev/null
}

# List all frontmatter field names in a file
# Usage: list_frontmatter_fields <filepath>
list_frontmatter_fields() {
    local filepath="$1"
    local fm

    fm="$(extract_frontmatter "$filepath")"
    if [[ -z "$fm" ]]; then
        return 1
    fi

    echo "$fm" | ruby -ryaml -rdate -e "
        begin
            data = YAML.safe_load(STDIN.read, permitted_classes: [Date, Time, Symbol], aliases: true) || {}
            data.keys.each { |k| puts k }
        rescue => e
            STDERR.puts \"YAML parse error: #{e.message}\"
            exit 1
        end
    " 2>/dev/null
}

# -------------------------------------------------------------------------
# Field validation
# -------------------------------------------------------------------------

# Validate a field value matches a pattern from schema
# Usage: validate_field_pattern <value> <pattern>
# Returns: 0 if valid, 1 if invalid
validate_field_pattern() {
    local value="$1"
    local pattern="$2"

    if echo "$value" | grep -qE "$pattern"; then
        return 0
    fi
    return 1
}

# Check if a value is a valid boolean
# Usage: validate_boolean <value>
validate_boolean() {
    local value="$1"
    case "$value" in
        true|false) return 0 ;;
        *) return 1 ;;
    esac
}

# Check if a category follows the expected casing
# Usage: validate_category_casing <value> <casing_rule>
validate_category_casing() {
    local value="$1"
    local casing="${2:-title}"

    case "$casing" in
        title)
            # Title case: first letter of each word is uppercase
            local expected
            expected=$(echo "$value" | ruby -e "puts STDIN.read.strip.split(/\s+/).map(&:capitalize).join(' ')" 2>/dev/null)
            [[ "$value" == "$expected" ]]
            ;;
        lower)
            [[ "$value" == "$(echo "$value" | tr '[:upper:]' '[:lower:]')" ]]
            ;;
        upper)
            [[ "$value" == "$(echo "$value" | tr '[:lower:]' '[:upper:]')" ]]
            ;;
        *)
            return 0
            ;;
    esac
}

# -------------------------------------------------------------------------
# Fix transformations
# -------------------------------------------------------------------------

# Normalize a date to ISO 8601 format
# Usage: fix_date_format <date_string>
fix_date_format() {
    local date_str="$1"

    # Already ISO 8601 with time
    if echo "$date_str" | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}T'; then
        echo "$date_str"
        return 0
    fi

    # Simple date: append time
    if echo "$date_str" | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'; then
        echo "${date_str}T00:00:00.000Z"
        return 0
    fi

    # Return as-is if unrecognized
    echo "$date_str"
    return 1
}

# Convert string draft values to boolean
# Usage: fix_draft_to_boolean <value>
fix_draft_to_boolean() {
    local value="$1"

    case "$value" in
        true|True|TRUE|draft|Draft|"in progress"|"In Progress")
            echo "true"
            ;;
        false|False|FALSE|published|Published)
            echo "false"
            ;;
        *)
            echo "$value"
            return 1
            ;;
    esac
}

# Export functions for use by other scripts
export -f load_schema get_collections get_required_fields get_optional_fields
export -f get_allowed_layouts get_path_pattern get_global_setting
export -f get_field_type_pattern get_canonical_fields
export -f get_template_mappings get_auto_fixable_rules
export -f detect_collection extract_frontmatter get_frontmatter_field
export -f list_frontmatter_fields validate_field_pattern validate_boolean
export -f validate_category_casing fix_date_format fix_draft_to_boolean
