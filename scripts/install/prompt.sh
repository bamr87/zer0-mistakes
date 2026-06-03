#!/bin/bash
# =============================================================================
# scripts/install/prompt.sh — Interactive TTY prompts
# =============================================================================
# Provides:
#   prompt_ask     VAR_NAME QUESTION [DEFAULT]
#       Read a string answer into VAR_NAME. Prints default in brackets.
#       Returns default if user enters blank.
#       No-ops (uses DEFAULT) when _PROMPT_NON_INTERACTIVE=1.
#
#   prompt_confirm QUESTION [DEFAULT_Y]
#       Ask a y/N question. Returns 0 for yes, 1 for no.
#       DEFAULT_Y="y" makes the default yes.
#       No-ops returning yes when _PROMPT_AUTO_ACCEPT=1.
#
#   prompt_select  VAR_NAME QUESTION OPTION1 [OPTION2 ...]
#       Present a numbered menu. Sets VAR_NAME to chosen option.
#       No-ops (uses first option) when _PROMPT_NON_INTERACTIVE=1.
#
# Globals:
#   _PROMPT_NON_INTERACTIVE  — "1" → never read, use defaults
#   _PROMPT_AUTO_ACCEPT      — "1" → confirm always returns yes
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_PROMPT_LIB:-}" ]] && return 0
_HAS_PROMPT_LIB=1

_PROMPT_NON_INTERACTIVE="${_PROMPT_NON_INTERACTIVE:-0}"
_PROMPT_AUTO_ACCEPT="${_PROMPT_AUTO_ACCEPT:-0}"

# Prompt for a string value.
# Usage: prompt_ask VARNAME "Question text" ["default value"]
prompt_ask() {
    local _var_name="$1"
    local _question="$2"
    local _default="${3:-}"
    local _answer=""

    if [[ "${_PROMPT_NON_INTERACTIVE:-0}" == "1" ]]; then
        # Non-interactive: use default or fail if required
        if [[ -z "$_default" ]]; then
            log_error "prompt_ask: required value '$_var_name' has no default in non-interactive mode"
            return 1
        fi
        _answer="$_default"
    else
        if [[ -n "$_default" ]]; then
            printf "${_LOG_BLUE:-}?${_LOG_NC:-} %s [%s]: " "$_question" "$_default" >&2
        else
            printf "${_LOG_BLUE:-}?${_LOG_NC:-} %s: " "$_question" >&2
        fi
        read -r _answer </dev/tty
        _answer="${_answer:-$_default}"
    fi

    # Assign to the named variable (bash 3.2 compatible — no nameref)
    eval "${_var_name}=\$_answer"
}

# Ask a yes/no confirmation.
# Usage: prompt_confirm "Question?" ["y"|"n"]  → returns 0=yes 1=no
prompt_confirm() {
    local _question="$1"
    local _default="${2:-n}"

    if [[ "${_PROMPT_AUTO_ACCEPT:-0}" == "1" || "${_PROMPT_NON_INTERACTIVE:-0}" == "1" ]]; then
        return 0
    fi

    local _prompt
    if [[ "$_default" == "y" || "$_default" == "Y" ]]; then
        _prompt="[Y/n]"
    else
        _prompt="[y/N]"
    fi

    local _answer=""
    printf "${_LOG_BLUE:-}?${_LOG_NC:-} %s %s: " "$_question" "$_prompt" >&2
    read -r _answer </dev/tty
    _answer="${_answer:-$_default}"

    case "$_answer" in
        [yY][eE][sS]|[yY]) return 0 ;;
        *)                  return 1 ;;
    esac
}

# Present a numbered menu.
# Usage: prompt_select VARNAME "Question?" opt1 opt2 opt3
prompt_select() {
    local _var_name="$1"
    local _question="$2"
    shift 2
    local _options=("$@")
    local _count=${#_options[@]}

    if [[ "${_PROMPT_NON_INTERACTIVE:-0}" == "1" ]]; then
        eval "${_var_name}=\${_options[0]}"
        return 0
    fi

    printf "${_LOG_BLUE:-}?${_LOG_NC:-} %s\n" "$_question" >&2
    local _i=1
    while [[ $_i -le $_count ]]; do
        printf "  %d) %s\n" "$_i" "${_options[$(( _i - 1 ))]}" >&2
        _i=$(( _i + 1 ))
    done

    local _choice=""
    while true; do
        printf "  Enter 1-%d [1]: " "$_count" >&2
        read -r _choice </dev/tty
        _choice="${_choice:-1}"
        if [[ "$_choice" =~ ^[0-9]+$ ]] && \
           [[ "$_choice" -ge 1 ]] && \
           [[ "$_choice" -le "$_count" ]]; then
            break
        fi
        printf "  Invalid choice. Try again.\n" >&2
    done

    eval "${_var_name}=\${_options[$(( _choice - 1 ))]}"
}
