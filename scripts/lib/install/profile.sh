#!/usr/bin/env bash
# scripts/lib/install/profile.sh
#
# Minimal pure-bash YAML reader for templates/profiles/*.yml.
# Bash 3.2 compatible. Schema is intentionally simple (scalar key/value
# + flat string lists) so we don't need yq/python.
#
# Public API:
#   profiles_dir <REPO_ROOT>             — absolute path to profiles dir
#   list_profile_names <REPO_ROOT>       — newline-separated profile slugs
#   profile_path <REPO_ROOT> <name>      — absolute path to a profile yml
#   profile_get_scalar <file> <key>      — print a scalar value or empty
#   profile_get_list <file> <key>        — print list items, one per line
#   profile_print_summary <file>         — pretty-print full profile

profiles_dir() {
    local repo_root="$1"
    echo "$repo_root/templates/profiles"
}

list_profile_names() {
    local repo_root="$1"
    local dir
    dir="$(profiles_dir "$repo_root")"
    [ -d "$dir" ] || return 1
    # List *.yml stems, sorted, excluding any leading-dot files
    ( cd "$dir" && for f in *.yml; do
        [ -e "$f" ] || continue
        echo "${f%.yml}"
    done ) | sort
}

profile_path() {
    local repo_root="$1" name="$2"
    local p
    p="$(profiles_dir "$repo_root")/${name}.yml"
    [ -f "$p" ] || return 1
    echo "$p"
}

# Extract a scalar value: lines like `key: value`. Strips surrounding
# whitespace and quotes. Ignores list lines (starting with `-`).
profile_get_scalar() {
    local file="$1" key="$2"
    [ -f "$file" ] || return 1
    awk -v k="$key" '
        # match "  key: value" or "key: value" at top level (no leading dash)
        $0 ~ "^[[:space:]]*" k "[[:space:]]*:" {
            sub("^[[:space:]]*" k "[[:space:]]*:[[:space:]]*", "")
            # strip trailing comments
            sub(/[[:space:]]+#.*$/, "")
            # strip surrounding quotes
            gsub(/^["'\'']|["'\'']$/, "")
            print
            exit
        }
    ' "$file"
}

# Extract a flat list under a key. Returns nothing for `key: []` or missing.
profile_get_list() {
    local file="$1" key="$2"
    [ -f "$file" ] || return 1
    awk -v k="$key" '
        BEGIN { inblock = 0 }
        # Start: "key:" line with nothing (or just a comment) after it
        $0 ~ "^[[:space:]]*" k "[[:space:]]*:[[:space:]]*(#.*)?$" {
            inblock = 1
            next
        }
        inblock {
            # End block on next non-list, non-blank, non-indented line
            if ($0 ~ /^[[:space:]]*-[[:space:]]+/) {
                line = $0
                sub(/^[[:space:]]*-[[:space:]]+/, "", line)
                sub(/[[:space:]]+#.*$/, "", line)
                gsub(/^["'\'']|["'\'']$/, "", line)
                print line
                next
            }
            if ($0 ~ /^[[:space:]]*#/) next
            if ($0 ~ /^[[:space:]]*$/) next
            inblock = 0
        }
    ' "$file"
}

profile_print_summary() {
    local file="$1"
    [ -f "$file" ] || { echo "(profile file not found: $file)" >&2; return 1; }
    local name display desc legacy rec
    name="$(profile_get_scalar "$file" name)"
    display="$(profile_get_scalar "$file" display_name)"
    desc="$(profile_get_scalar "$file" description)"
    legacy="$(profile_get_scalar "$file" legacy_flag)"
    rec="$(profile_get_scalar "$file" recommended_for)"
    printf '  %-9s %s\n' "$name" "$display"
    [ -n "$desc" ]   && printf '            %s\n' "$desc"
    [ -n "$legacy" ] && printf '            → install.sh %s\n' "$legacy"
    [ -n "$rec" ]    && printf '            For: %s\n' "$rec"
    local includes excludes
    includes="$(profile_get_list "$file" includes)"
    excludes="$(profile_get_list "$file" excludes)"
    if [ -n "$includes" ]; then
        printf '            Includes:\n'
        echo "$includes" | sed 's/^/              - /'
    fi
    if [ -n "$excludes" ]; then
        printf '            Excludes:\n'
        echo "$excludes" | sed 's/^/              - /'
    fi
    echo
}
