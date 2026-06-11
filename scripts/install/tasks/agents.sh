#!/bin/bash
# =============================================================================
# scripts/install/tasks/agents.sh — Write AI agent files
# =============================================================================
# Writes agent-specific files based on SPEC_AGENTS (space-separated list):
#   copilot   → .github/copilot-instructions.md
#   claude    → CLAUDE.md
#   cursor    → .cursor/rules/zer0.mdc
#   aider     → .aider.conf.yml
#   generic   → AGENTS.md (always written as baseline)
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_TASK_AGENTS:-}" ]] && return 0
_HAS_TASK_AGENTS=1

task_agents_run() {
    local target="$1"
    local agents="${SPEC_AGENTS:-}"

    [[ -z "$agents" ]] && { log_debug "agents task: no agents configured (skipping)"; return 0; }

    log_info "Writing AI agent files..."

    local agent
    for agent in $agents; do
        case "$agent" in
            generic)
                tmpl_apply "agents/AGENTS.md.template" "${target}/AGENTS.md"
                ;;
            copilot)
                fs_ensure_dir "${target}/.github"
                tmpl_apply "agents/copilot-instructions.md.template" \
                    "${target}/.github/copilot-instructions.md"
                ;;
            claude)
                tmpl_apply "agents/CLAUDE.md.template" "${target}/CLAUDE.md"
                ;;
            cursor)
                fs_ensure_dir "${target}/.cursor/rules"
                tmpl_apply "agents/cursor-rule.mdc.template" \
                    "${target}/.cursor/rules/zer0.mdc"
                ;;
            aider)
                tmpl_apply "agents/aider.conf.yml.template" \
                    "${target}/.aider.conf.yml"
                ;;
            all)
                # Re-invoke with each known agent
                SPEC_AGENTS="generic copilot claude cursor aider" task_agents_run "$target"
                return $?
                ;;
            *)
                log_warning "agents task: unknown agent '$agent' (skipping)"
                ;;
        esac
    done

    log_success "Agent files written"
}
