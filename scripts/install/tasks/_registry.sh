#!/bin/bash
# =============================================================================
# scripts/install/tasks/_registry.sh — Task discovery and metadata
# =============================================================================
# Describes the canonical task graph: dependencies, conditions, descriptions.
# Sourced by apply.sh and diff.sh.
#
# Provides:
#   task_list_all       → print all task names, one per line
#   task_description    TASK → print one-line description
#   task_depends        TASK → print space-separated dependency names
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_TASK_REGISTRY:-}" ]] && return 0
_HAS_TASK_REGISTRY=1

# Ordered canonical task list (deps must appear before dependents)
_TASK_ALL="config gemfile docker theme pages scrape nav data devcontainer agents gitignore readme marker"

# One-line descriptions
_task_desc_config="Write _config.yml and _config_dev.yml"
_task_desc_gemfile="Write Gemfile (variant: gem|remote|macos)"
_task_desc_docker="Write docker-compose.yml and docker/Dockerfile"
_task_desc_theme="Copy _layouts _includes _sass assets (vendor|local)"
_task_desc_pages="Generate starter pages from templates"
_task_desc_scrape="Import content from an existing website (spec.scrape.source_url)"
_task_desc_nav="Generate _data/navigation/ from template"
_task_desc_data="Generate _data/authors.yml and seed data"
_task_desc_devcontainer="Write .devcontainer/devcontainer.json"
_task_desc_agents="Write AI agent files (AGENTS.md, CLAUDE.md, etc.)"
_task_desc_gitignore="Write .gitignore"
_task_desc_readme="Write INSTALLATION.md and README seed"
_task_desc_marker="Write .zer0-installed marker + persist spec"

# Dependencies (space-separated, empty = no deps)
_task_deps_config=""
_task_deps_gemfile="config"
_task_deps_docker="config"
_task_deps_theme=""
_task_deps_pages="config"
_task_deps_scrape="config pages"
_task_deps_nav="config"
_task_deps_data="config"
_task_deps_devcontainer=""
_task_deps_agents=""
_task_deps_gitignore=""
_task_deps_readme=""
_task_deps_marker="config gemfile"

task_list_all() {
    echo "$_TASK_ALL" | tr ' ' '\n'
}

task_description() {
    local task="$1"
    local var="_task_desc_${task}"
    eval "echo \"\${${var}:-unknown task: $task}\""
}

task_depends() {
    local task="$1"
    local var="_task_deps_${task}"
    eval "echo \"\${${var}:-}\""
}
