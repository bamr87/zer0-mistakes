# `scripts/lib/install/` — Installer Library Modules

Focused modules sourced by [`install.sh`](../../../install.sh) at the repository root. Each module is self-contained and ≤ 200 lines for readability and reuse.

## Modules

| File | Purpose | Key Functions |
|------|---------|----------------|
| [`logging.sh`](logging.sh) | `log_info` / `log_success` / `log_warning` / `log_error` shim used throughout `install.sh`. | `log_info`, `log_success`, `log_warning`, `log_error` |
| [`platform.sh`](platform.sh) | OS, Ruby version, and platform detection (bash 3.2-compatible). | `detect_os`, `detect_ruby_version`, `ruby_version_lt_27`, `needs_macos_gemfile`, `detect_platform` |
| [`fs.sh`](fs.sh) | Idempotent file/directory copy with timestamped backups. | `copy_file_with_backup`, `copy_directory_with_backup` |
| [`template.sh`](template.sh) | `{{VAR}}` placeholder substitution + local/remote/fallback resolution. | `render_template`, `create_from_template`, `templates_available` |
| [`config.sh`](config.sh) | Loads `templates/config/install.conf` with hard-coded defaults as fallback. | `load_install_config` |
| [`pages.sh`](pages.sh) | Manifest-driven starter-page renderer. Replaces 8 legacy `create_*_page` heredoc functions with one driver. | `render_starter_pages`, `render_admin_settings_pages` (+ `create_starter_pages`/`create_admin_pages` aliases) |
| [`profile.sh`](profile.sh) | Pure-bash YAML reader for [`templates/profiles/*.yml`](../../../templates/profiles/). Bash 3.2 compatible (no yq/python). | `list_profile_names`, `profile_path`, `profile_get_scalar`, `profile_get_list`, `profile_print_summary` |
| [`deploy/`](deploy/) | Pluggable deployment-target modules (`github-pages`, `azure-swa`, `docker-prod`) with a uniform `check_prereqs`/`install`/`verify`/`doc_url` contract. | `deploy_run_target`, `deploy_print_summary`, `deploy_render`, `deploy_copy` (see [`deploy/README.md`](deploy/README.md)) |

## Loading

`install.sh` sources these modules when `scripts/lib/install/` is present. When it isn't (a stripped distribution or a `curl | bash` one-liner that didn't bundle the libraries), `install.sh` falls back to inlined copies of the same functions defined at the top of the script.

## CLI Entrypoint

For day-to-day use prefer the canonical dispatcher:

```bash
./scripts/bin/install help            # subcommand index
./scripts/bin/install init            # full install in CWD
./scripts/bin/install init --profile minimal /tmp/demo
./scripts/bin/install list-profiles   # available profiles
./scripts/bin/install list-targets    # available deploy targets
./scripts/bin/install deploy github-pages /tmp/demo
./scripts/bin/install deploy azure-swa,docker-prod /tmp/demo
./scripts/bin/install agents          # AGENTS.md / instructions index
./scripts/bin/install version         # theme version from version.rb
```

`init` translates `--profile` into the appropriate legacy flag and execs `install.sh`. `deploy` dispatches to the modules under `deploy/` (Phase 4). The remaining subcommands (`wizard`, `diagnose`, `doctor`, `upgrade`) are stubs that print a clear notice until their backing modules land in Phases 5-6.

## Roadmap

Phases 1, 1.5, 2, 3 (declarative profiles), and 4 (deploy modules) are complete. Future phases will add:

- `bootstrap.sh` — remote install (`download_theme_files`, `cleanup_temp_dir`)
- `wizard.sh` — interactive prompts (`gather_user_input`, `prompt_with_default`)
- `ai/{wizard,diagnose,suggest}.sh` — opt-in AI integration
- `doctor.sh` — pre-flight environment + site health checks

See the session refactor plan for the full sequence.

## Compatibility

All modules target **bash 3.2** (the macOS default `/bin/bash`). No `declare -A`, no `=~` capture groups, no `mapfile`/`readarray`.

## Conventions

- Every function documents its required globals at the top of the file
- No module calls `exit` — caller decides; modules return non-zero on recoverable failure
- Modules don't `set -euo pipefail` themselves — they inherit from the caller (`install.sh` already sets it)

---

**Last updated**: 2026-04-20 — Phase 4 (`deploy/registry.sh` + `deploy/{github-pages,azure-swa,docker-prod}.sh` + `templates/deploy/`).
