#!/usr/bin/env bash
# scripts/lib/install/wizard_interactive.sh
#
# Non-AI interactive wizard. Prompts the user for site config + profile,
# then dispatches to `install init` with the chosen options.
#
# Complementary to ai/wizard.sh (which uses OpenAI). This one is fully
# offline and works in any environment.
#
# Public API:
#     wizard_interactive_run <target_dir> <repo_root> [--auto-accept]
#
# Bash 3.2-compatible.

# shellcheck disable=SC2034
WIZARD_INTERACTIVE_LIB_VERSION="1.0.0"

# Prompt with a default value. Returns the user's input on stdout.
# args: prompt default
_wiz_prompt() {
    local prompt="$1" default="$2" reply
    if [[ -n "$default" ]]; then
        printf "  %s [%s]: " "$prompt" "$default" >&2
    else
        printf "  %s: " "$prompt" >&2
    fi
    read -r reply || reply=""
    [[ -z "$reply" ]] && reply="$default"
    printf '%s\n' "$reply"
}

# Prompt for a yes/no answer. Returns 0 for yes, 1 for no.
# args: prompt default(y|n)
_wiz_confirm() {
    local prompt="$1" default="${2:-n}" reply hint
    case "$default" in
        y|Y) hint="[Y/n]" ;;
        *)   hint="[y/N]" ;;
    esac
    printf "  %s %s: " "$prompt" "$hint" >&2
    read -r reply || reply=""
    [[ -z "$reply" ]] && reply="$default"
    case "$reply" in
        y|Y|yes|YES) return 0 ;;
        *) return 1 ;;
    esac
}

# Pick from a numbered list. Returns the chosen value on stdout.
# args: prompt default option1 option2 ...
_wiz_choose() {
    local prompt="$1" default="$2"
    shift 2
    local options=("$@")
    local i=1 opt
    echo "  $prompt" >&2
    for opt in "${options[@]}"; do
        if [[ "$opt" = "$default" ]]; then
            printf "    %d) %s  (default)\n" "$i" "$opt" >&2
        else
            printf "    %d) %s\n" "$i" "$opt" >&2
        fi
        i=$((i+1))
    done
    printf "  Choice [%s]: " "$default" >&2
    local reply
    read -r reply || reply=""
    [[ -z "$reply" ]] && { printf '%s\n' "$default"; return; }
    # Numeric or by-name
    case "$reply" in
        ''|*[!0-9]*)
            # by name; verify it exists
            for opt in "${options[@]}"; do
                [[ "$opt" = "$reply" ]] && { printf '%s\n' "$reply"; return; }
            done
            printf '%s\n' "$default" ;;
        *)
            local idx=$((reply))
            if (( idx >= 1 && idx <= ${#options[@]} )); then
                printf '%s\n' "${options[$((idx-1))]}"
            else
                printf '%s\n' "$default"
            fi ;;
    esac
}

# Public entrypoint.
wizard_interactive_run() {
    local target_dir="$1" repo_root="$2"
    shift 2 || true
    local auto_accept=0
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --auto-accept) auto_accept=1 ;;
            *) log_warning "wizard_interactive_run: ignoring unknown flag: $1" ;;
        esac
        shift
    done

    log_info "🧙 Interactive wizard (non-AI)"
    log_info "  This wizard collects site settings and runs 'install init'."
    log_info "  Press Enter to accept defaults shown in [brackets]."
    echo

    # Discover available profiles dynamically if loader is present.
    local default_profile="full"
    local profiles_csv="minimal full fork github remote"
    if declare -F list_profile_names >/dev/null 2>&1; then
        local discovered
        discovered="$(list_profile_names "$repo_root" 2>/dev/null | tr '\n' ' ')"
        [[ -n "$discovered" ]] && profiles_csv="$discovered"
    fi
    # shellcheck disable=SC2206
    local profile_options=( $profiles_csv )

    log_info "── Site basics ──────────────────────────"
    local site_name site_desc author email
    site_name="$(_wiz_prompt "Site name"        "$(basename "$target_dir")")"
    site_desc="$(_wiz_prompt "Description"      "A Jekyll site powered by zer0-mistakes")"
    author="$(_wiz_prompt    "Author name"      "${USER:-author}")"
    email="$(_wiz_prompt     "Author email"     "${USER:-author}@example.com")"
    echo

    log_info "── Profile ──────────────────────────────"
    local profile
    profile="$(_wiz_choose "Choose an install profile:" "$default_profile" "${profile_options[@]}")"
    echo

    log_info "── Optional integrations ────────────────"
    local want_agents=0 want_docker=0
    _wiz_confirm "Install AI agent guidance files?" "y" && want_agents=1
    _wiz_confirm "Add docker-prod deploy target?"   "n" && want_docker=1
    echo

    log_info "── Summary ──────────────────────────────"
    log_info "  Target dir:  $target_dir"
    log_info "  Site name:   $site_name"
    log_info "  Description: $site_desc"
    log_info "  Author:      $author <$email>"
    log_info "  Profile:     $profile"
    log_info "  Agents:      $([ "$want_agents" = "1" ] && echo yes || echo no)"
    log_info "  docker-prod: $([ "$want_docker" = "1" ] && echo yes || echo no)"
    echo

    if [[ "$auto_accept" != "1" ]]; then
        if ! _wiz_confirm "Proceed with these settings?" "y"; then
            log_warning "Wizard cancelled."
            return 0
        fi
    fi

    # Export for any downstream consumers (legacy install.sh reads SITE_NAME etc.)
    export SITE_NAME="$site_name"
    export SITE_DESCRIPTION="$site_desc"
    export AUTHOR_NAME="$author"
    export AUTHOR_EMAIL="$email"

    # Dispatch
    local install_bin="$repo_root/scripts/bin/install"
    if [[ ! -x "$install_bin" ]]; then
        log_error "Cannot find $install_bin"
        return 1
    fi

    log_info "Running: install init --profile $profile $target_dir"
    "$install_bin" init --profile "$profile" --skip-doctor "$target_dir" || {
        log_error "init failed"
        return 1
    }

    if [[ "$want_agents" = "1" ]]; then
        echo
        log_info "Running: install agents $target_dir"
        "$install_bin" agents "$target_dir" || log_warning "agents install reported issues"
    fi

    if [[ "$want_docker" = "1" ]]; then
        echo
        log_info "Running: install deploy docker-prod $target_dir"
        "$install_bin" deploy docker-prod "$target_dir" || log_warning "docker-prod install reported issues"
    fi

    echo
    log_success "Wizard complete!"
    log_info "Next steps:"
    log_info "  cd $target_dir"
    log_info "  docker compose up   # or: bundle exec jekyll serve"
    return 0
}
