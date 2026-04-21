#!/usr/bin/env bash
# scripts/lib/install/doctor.sh
#
# `install doctor` — environment + site health check.
#
# Runs platform-specific prerequisite checks (delegating to
# scripts/platform/setup-{macos,linux,wsl}.sh in check-only mode), then
# layers zer0-mistakes-specific checks on top: gh CLI, Docker compose,
# Bundler/Jekyll versions, agent files, and OpenAI connectivity (opt-in).
#
# Output: structured pass/warn/fail report. Exits 0 when no FAIL,
# 1 when at least one FAIL.
#
# Public API:
#     doctor_run <target_dir> <repo_root> [--ai] [--quiet] [--json]
#
# Bash 3.2-compatible. Pure shell — no jq required.

# shellcheck disable=SC2034
DOCTOR_LIB_VERSION="1.0.0"

# Counters (reset on every doctor_run call)
DOCTOR_PASS=0
DOCTOR_WARN=0
DOCTOR_FAIL=0
DOCTOR_REPORT=""

# Append a structured row.
# args: status (PASS|WARN|FAIL) name detail [remediation]
_doctor_row() {
    local status="$1" name="$2" detail="$3" remediation="${4:-}"
    case "$status" in
        PASS) DOCTOR_PASS=$((DOCTOR_PASS+1)); log_success "$name: $detail" ;;
        WARN) DOCTOR_WARN=$((DOCTOR_WARN+1)); log_warning "$name: $detail"; [[ -n "$remediation" ]] && log_info "  → $remediation" ;;
        FAIL) DOCTOR_FAIL=$((DOCTOR_FAIL+1)); log_error "$name: $detail"; [[ -n "$remediation" ]] && log_info "  → $remediation" ;;
    esac
    DOCTOR_REPORT="${DOCTOR_REPORT}${status}|${name}|${detail}|${remediation}
"
}

# ── Platform checks ────────────────────────────────────────────────────────
_doctor_platform() {
    local repo_root="$1"
    local os
    os="$(uname -s 2>/dev/null || echo unknown)"

    local script=""
    case "$os" in
        Darwin)              script="$repo_root/scripts/platform/setup-macos.sh" ;;
        Linux)
            # Distinguish WSL from native Linux
            if grep -qi microsoft /proc/version 2>/dev/null; then
                script="$repo_root/scripts/platform/setup-wsl.sh"
            else
                script="$repo_root/scripts/platform/setup-linux.sh"
            fi
            ;;
        *)
            _doctor_row WARN "Platform" "$os not directly supported" \
                "Doctor will only run zer0-mistakes-specific checks"
            return 0
            ;;
    esac

    if [[ ! -f "$script" ]]; then
        _doctor_row WARN "Platform script" "Not found at ${script#$repo_root/}" \
            "Falling back to inline checks"
        _doctor_inline_platform_checks
        return 0
    fi

    log_info "Running platform checks: $(basename "$script")"
    # Source so we can call individual check functions; suppress its main
    # entrypoint by setting a guard env.
    # shellcheck source=/dev/null
    if ! source "$script" 2>/dev/null; then
        _doctor_row WARN "Platform script" "Failed to source" \
            "Falling back to inline checks"
        _doctor_inline_platform_checks
        return 0
    fi

    # Each setup script exposes check_* functions. Probe the common set.
    local suffix=""
    case "$os" in
        Darwin) suffix="macos" ;;
        Linux)  suffix="linux"; grep -qi microsoft /proc/version 2>/dev/null && suffix="wsl" ;;
    esac

    if declare -F "check_git_${suffix}" >/dev/null 2>&1; then
        if "check_git_${suffix}"; then
            _doctor_row PASS "Git" "$(git --version 2>/dev/null | head -1)"
        else
            _doctor_row FAIL "Git" "Not installed" "Install via your package manager"
        fi
    fi
    if declare -F "check_docker_${suffix}" >/dev/null 2>&1; then
        if "check_docker_${suffix}"; then
            _doctor_row PASS "Docker" "$(docker --version 2>/dev/null)"
        elif command -v docker >/dev/null 2>&1; then
            _doctor_row WARN "Docker" "Installed but daemon not reachable" \
                "Start Docker Desktop / 'sudo systemctl start docker'"
        else
            _doctor_row WARN "Docker" "Not installed" \
                "Optional — only needed for containerized dev"
        fi
    fi
    if declare -F "check_ruby_${suffix}" >/dev/null 2>&1; then
        if "check_ruby_${suffix}"; then
            _doctor_row PASS "Ruby" "$(ruby --version 2>/dev/null)"
        elif command -v ruby >/dev/null 2>&1; then
            _doctor_row WARN "Ruby" "$(ruby --version 2>/dev/null) (3.0+ recommended)" \
                "Upgrade via Homebrew/rbenv for best compatibility"
        else
            _doctor_row WARN "Ruby" "Not installed" \
                "Optional — only needed for native (non-Docker) dev"
        fi
    fi
}

# Fallback when platform script is missing.
_doctor_inline_platform_checks() {
    if command -v git >/dev/null 2>&1; then
        _doctor_row PASS "Git" "$(git --version 2>/dev/null | head -1)"
    else
        _doctor_row FAIL "Git" "Not installed" "Required for cloning + version control"
    fi
    if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
        _doctor_row PASS "Docker" "$(docker --version 2>/dev/null)"
    else
        _doctor_row WARN "Docker" "Not running or not installed" \
            "Optional — needed for containerized dev"
    fi
    if command -v ruby >/dev/null 2>&1; then
        _doctor_row PASS "Ruby" "$(ruby --version 2>/dev/null)"
    else
        _doctor_row WARN "Ruby" "Not installed" "Optional — needed for native dev"
    fi
}

# ── Tooling checks ─────────────────────────────────────────────────────────
_doctor_tooling() {
    # gh CLI (used by deploy + agent flows that touch repos)
    if command -v gh >/dev/null 2>&1; then
        _doctor_row PASS "GitHub CLI" "$(gh --version 2>/dev/null | head -1)"
    else
        _doctor_row WARN "GitHub CLI" "Not installed" \
            "Optional — install from https://cli.github.com for repo automation"
    fi

    # Docker Compose v2
    if docker compose version >/dev/null 2>&1; then
        _doctor_row PASS "Docker Compose" "$(docker compose version --short 2>/dev/null)"
    elif command -v docker-compose >/dev/null 2>&1; then
        _doctor_row WARN "Docker Compose" "v1 detected ($(docker-compose --version 2>/dev/null))" \
            "Upgrade to v2: docker compose plugin"
    else
        _doctor_row WARN "Docker Compose" "Not available" \
            "Optional — needed for 'docker compose up'"
    fi

    # Bundler
    if command -v bundle >/dev/null 2>&1; then
        # bundle --version may fail when run inside a dir with a Gemfile.lock
        # pinning a different bundler. Probe in a neutral cwd to avoid noise.
        local bv
        bv="$(cd / && bundle --version 2>/dev/null | head -1)"
        if [[ -n "$bv" ]]; then
            _doctor_row PASS "Bundler" "$bv"
        else
            _doctor_row WARN "Bundler" "Installed but version probe failed" \
                "Likely Gemfile.lock pins an unavailable bundler — run 'bundle update --bundler'"
        fi
    else
        _doctor_row WARN "Bundler" "Not installed" \
            "Install: gem install bundler (only needed for native dev)"
    fi
}

# ── Site checks (run inside target_dir) ────────────────────────────────────
_doctor_site() {
    local target_dir="$1"

    if [[ ! -d "$target_dir" ]]; then
        _doctor_row FAIL "Target dir" "Does not exist: $target_dir" "Run 'install init' first"
        return
    fi

    if [[ -f "$target_dir/_config.yml" ]]; then
        _doctor_row PASS "_config.yml" "Present"
    else
        _doctor_row WARN "_config.yml" "Missing in $target_dir" \
            "Run 'install init' to scaffold a site"
    fi

    if [[ -f "$target_dir/Gemfile" ]]; then
        _doctor_row PASS "Gemfile" "Present"
    else
        _doctor_row WARN "Gemfile" "Missing" "Run 'install init' or 'install deploy'"
    fi

    if [[ -f "$target_dir/AGENTS.md" ]]; then
        _doctor_row PASS "AI agent files" "AGENTS.md present"
    else
        _doctor_row WARN "AI agent files" "AGENTS.md not installed" \
            "Run 'install agents' to add AI guidance"
    fi

    # Basic _config.yml sanity
    if [[ -f "$target_dir/_config.yml" ]]; then
        if grep -qE "^(remote_theme|theme):" "$target_dir/_config.yml" 2>/dev/null; then
            _doctor_row PASS "Theme config" "remote_theme/theme set in _config.yml"
        else
            _doctor_row WARN "Theme config" "Neither 'theme' nor 'remote_theme' found" \
                "Set 'remote_theme: bamr87/zer0-mistakes' or 'theme: jekyll-theme-zer0'"
        fi
    fi
}

# ── AI connectivity (opt-in) ───────────────────────────────────────────────
_doctor_ai_connectivity() {
    if [[ "${ZER0_NO_AI:-0}" = "1" ]]; then
        _doctor_row WARN "OpenAI connectivity" "Skipped (ZER0_NO_AI=1)" \
            "Unset ZER0_NO_AI to enable AI checks"
        return
    fi
    if [[ -z "${OPENAI_API_KEY:-}" ]]; then
        _doctor_row WARN "OpenAI API key" "OPENAI_API_KEY not set" \
            "Export OPENAI_API_KEY to enable AI features"
        return
    fi
    # Lightweight ping: check we can reach the API and the key authenticates.
    local http_code
    http_code="$(curl -sS -o /dev/null -w '%{http_code}' \
        --max-time 10 \
        -H "Authorization: Bearer ${OPENAI_API_KEY}" \
        https://api.openai.com/v1/models 2>/dev/null || echo "000")"
    case "$http_code" in
        200)  _doctor_row PASS "OpenAI connectivity" "Authenticated (HTTP 200)" ;;
        401)  _doctor_row FAIL "OpenAI connectivity" "Authentication failed (HTTP 401)" \
                "Verify OPENAI_API_KEY is valid" ;;
        000)  _doctor_row WARN "OpenAI connectivity" "No network response" \
                "Check internet connection / firewall" ;;
        *)    _doctor_row WARN "OpenAI connectivity" "Unexpected response (HTTP $http_code)" \
                "Inspect with: curl -v https://api.openai.com/v1/models" ;;
    esac
}

# ── Public entrypoint ──────────────────────────────────────────────────────
doctor_run() {
    local target_dir="$1" repo_root="$2"
    shift 2 || true

    local check_ai=0 quiet=0 emit_json=0
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --ai)   check_ai=1 ;;
            --quiet) quiet=1 ;;
            --json) emit_json=1 ;;
            *) log_warning "doctor_run: ignoring unknown flag: $1" ;;
        esac
        shift
    done

    DOCTOR_PASS=0; DOCTOR_WARN=0; DOCTOR_FAIL=0; DOCTOR_REPORT=""

    [[ "$quiet" = "1" ]] || log_info "🩺 Running zer0-mistakes doctor..."
    [[ "$quiet" = "1" ]] || echo

    [[ "$quiet" = "1" ]] || log_info "── Platform ─────────────────────────────"
    _doctor_platform "$repo_root"
    [[ "$quiet" = "1" ]] || echo

    [[ "$quiet" = "1" ]] || log_info "── Tooling ──────────────────────────────"
    _doctor_tooling
    [[ "$quiet" = "1" ]] || echo

    [[ "$quiet" = "1" ]] || log_info "── Site ($target_dir) ───"
    _doctor_site "$target_dir"
    [[ "$quiet" = "1" ]] || echo

    if [[ "$check_ai" = "1" ]]; then
        [[ "$quiet" = "1" ]] || log_info "── AI ────────────────────────────────────"
        _doctor_ai_connectivity
        [[ "$quiet" = "1" ]] || echo
    fi

    if [[ "$emit_json" = "1" ]]; then
        # Emit a tiny JSON summary — no jq, just printf.
        printf '{"pass":%d,"warn":%d,"fail":%d}\n' \
            "$DOCTOR_PASS" "$DOCTOR_WARN" "$DOCTOR_FAIL"
    else
        log_info "── Summary ──────────────────────────────"
        log_info "  ✅ PASS: $DOCTOR_PASS"
        log_info "  ⚠️  WARN: $DOCTOR_WARN"
        log_info "  ❌ FAIL: $DOCTOR_FAIL"
    fi

    [[ "$DOCTOR_FAIL" = "0" ]] && return 0
    return 1
}
