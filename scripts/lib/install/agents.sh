#!/usr/bin/env bash
# scripts/lib/install/agents.sh
#
# `install agents` — copy AI agent guidance files into a target site.
#
# Pure file copy. No network. No AI calls. Source of truth is the theme
# repo's own .github/ + AGENTS.md, so the theme is self-canonical:
# whatever the theme dogfoods is what consumers receive.
#
# Public API:
#     agents_install <target_dir> <repo_root> [--cursor] [--claude] [--aider] [--force]
#
# Always installs the core set (AGENTS.md + .github/copilot-instructions.md
# + .github/instructions/ + .github/prompts/). Optional flags add:
#   --cursor   .cursor/commands/*.md  (mirrors prompts as slash commands)
#   --claude   CLAUDE.md stub pointing to AGENTS.md
#   --aider    .aider.conf.yml referencing AGENTS.md as read-only context
#
# Idempotent: skips files that already exist unless --force.

# shellcheck disable=SC2034  # script intended to be sourced
AGENTS_LIB_VERSION="1.0.0"

# Copy a single file with skip/force semantics. Returns 0 on copy, 1 on skip.
_agents_copy_file() {
    local src="$1" dst="$2" force="$3"
    if [[ ! -f "$src" ]]; then
        log_warning "Source not found, skipping: ${src#$REPO_ROOT/}"
        return 1
    fi
    if [[ -f "$dst" ]] && [[ "$force" != "1" ]]; then
        log_warning "Exists, skipping: ${dst#$PWD/}  (use --force to overwrite)"
        return 1
    fi
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
    log_success "Wrote ${dst#$PWD/}"
    return 0
}

# Copy every file in a source dir matching a glob into a dest dir.
_agents_copy_glob() {
    local src_dir="$1" pattern="$2" dst_dir="$3" force="$4"
    local copied=0 skipped=0
    if [[ ! -d "$src_dir" ]]; then
        log_warning "Source dir not found: ${src_dir#$REPO_ROOT/}"
        return 0
    fi
    local f base
    for f in "$src_dir"/$pattern; do
        [[ -f "$f" ]] || continue
        base="$(basename "$f")"
        if _agents_copy_file "$f" "$dst_dir/$base" "$force"; then
            copied=$((copied+1))
        else
            skipped=$((skipped+1))
        fi
    done
    log_info "  → $copied copied, $skipped skipped in ${dst_dir#$PWD/}"
}

agents_install() {
    local target_dir="$1" repo_root="$2"
    shift 2 || true

    local with_cursor=0 with_claude=0 with_aider=0 force=0
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --cursor) with_cursor=1 ;;
            --claude) with_claude=1 ;;
            --aider)  with_aider=1 ;;
            --all)    with_cursor=1; with_claude=1; with_aider=1 ;;
            -f|--force) force=1 ;;
            *) log_warning "agents_install: ignoring unknown flag: $1" ;;
        esac
        shift
    done

    if [[ ! -d "$target_dir" ]]; then
        log_error "Target directory does not exist: $target_dir"
        return 1
    fi

    log_info "Installing AI agent guidance into: $target_dir"
    [[ "$force" = "1" ]] && log_info "  (--force: overwrite enabled)"

    # 1. Core: AGENTS.md (cross-tool entry point)
    _agents_copy_file "$repo_root/AGENTS.md" "$target_dir/AGENTS.md" "$force" || true

    # 2. Copilot main instructions
    _agents_copy_file \
        "$repo_root/.github/copilot-instructions.md" \
        "$target_dir/.github/copilot-instructions.md" \
        "$force" || true

    # 3. File-scoped instructions
    log_info "Copying .github/instructions/*.md ..."
    _agents_copy_glob \
        "$repo_root/.github/instructions" "*.md" \
        "$target_dir/.github/instructions" "$force"

    # 4. Reusable prompts
    log_info "Copying .github/prompts/*.md ..."
    _agents_copy_glob \
        "$repo_root/.github/prompts" "*.md" \
        "$target_dir/.github/prompts" "$force"

    # 5. Optional: Cursor slash-commands
    if [[ "$with_cursor" = "1" ]]; then
        log_info "Copying .cursor/commands/*.md ..."
        _agents_copy_glob \
            "$repo_root/.cursor/commands" "*.md" \
            "$target_dir/.cursor/commands" "$force"
    fi

    # 6. Optional: Claude stub
    if [[ "$with_claude" = "1" ]]; then
        local claude_tpl="$repo_root/templates/agents/CLAUDE.md.template"
        if [[ -f "$claude_tpl" ]]; then
            _agents_copy_file "$claude_tpl" "$target_dir/CLAUDE.md" "$force" || true
        else
            cat > "$target_dir/CLAUDE.md.tmp" <<'EOF'
# Claude Code Instructions

This project uses [`AGENTS.md`](./AGENTS.md) as the single source of truth for
AI agent guidance. Please read it first.

For detailed conventions, see:
- `.github/copilot-instructions.md`
- `.github/instructions/*.instructions.md`
- `.github/prompts/*.prompt.md`
EOF
            if [[ -f "$target_dir/CLAUDE.md" ]] && [[ "$force" != "1" ]]; then
                rm -f "$target_dir/CLAUDE.md.tmp"
                log_warning "Exists, skipping: CLAUDE.md (use --force to overwrite)"
            else
                mv "$target_dir/CLAUDE.md.tmp" "$target_dir/CLAUDE.md"
                log_success "Wrote CLAUDE.md"
            fi
        fi
    fi

    # 7. Optional: Aider config
    if [[ "$with_aider" = "1" ]]; then
        local aider_tpl="$repo_root/templates/agents/aider.conf.yml.template"
        if [[ -f "$aider_tpl" ]]; then
            _agents_copy_file "$aider_tpl" "$target_dir/.aider.conf.yml" "$force" || true
        else
            if [[ -f "$target_dir/.aider.conf.yml" ]] && [[ "$force" != "1" ]]; then
                log_warning "Exists, skipping: .aider.conf.yml (use --force to overwrite)"
            else
                cat > "$target_dir/.aider.conf.yml" <<'EOF'
# Aider configuration — see https://aider.chat
# Loads project agent guidance as read-only context for every session.
read:
  - AGENTS.md
  - .github/copilot-instructions.md
EOF
                log_success "Wrote .aider.conf.yml"
            fi
        fi
    fi

    log_success "Agent guidance installation complete."
    return 0
}
