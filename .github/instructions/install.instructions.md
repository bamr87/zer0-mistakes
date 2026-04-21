---
applyTo: "scripts/lib/install/**,scripts/bin/install,install.sh,templates/profiles/**,templates/deploy/**,templates/agents/**,templates/ai/**"
description: "Architecture, conventions, and safety contracts for the modular installer (CLI dispatcher, library modules, declarative profiles, deploy plugins, AI integration). Read this when touching anything under scripts/lib/install/, scripts/bin/install, install.sh, or installer-related templates."
---

# Installer Development Instructions

These instructions govern the modular, profile-driven, AI-aware installer introduced in `zer0-mistakes` 1.0. Read [`docs/installation/architecture.md`](../../docs/installation/architecture.md) for the layered overview before changing anything.

## Architectural ground rules

| Rule | Why |
|---|---|
| **Templates are the single source of truth.** Never inline a heredoc in `install.sh` or any library module. | Keeps generated content reviewable and forkable. |
| **Profiles are declarative.** Pure YAML. No code. No conditionals. | If you need procedural logic, write a library module — keep YAML pure. |
| **Each library module ≤ 300 lines.** One concern per file. | Readability and reuse. |
| **Bash 3.2 compatible.** No `declare -A`, no `=~` capture groups, no `mapfile`/`readarray`. | macOS default `/bin/bash`. |
| **Modules don't `set -euo pipefail`.** Caller (`install.sh` / `scripts/bin/install`) does. | Prevents accidental abort in sourced contexts. |
| **Modules don't `exit`.** Return non-zero on recoverable failure. Caller decides. | Composability. |
| **Every file write goes through `fs.sh::copy_file_with_backup` or `template.sh::create_from_template`.** | Idempotency + timestamped backups. |
| **`.zer0-installed` marker file format is part of the public contract.** | `install upgrade` depends on it. |

## Module layout (do not reorganize without updating docs)

```
scripts/
├── bin/install                       # CLI dispatcher — public surface
└── lib/
    ├── common.sh                     # logging, dry_run_exec, confirm
    └── install/
        ├── core.sh                   # arg parsing, mode dispatch, summary
        ├── platform.sh               # OS / Ruby / platform detection
        ├── template.sh               # {{VAR}} substitution + local/remote/fallback
        ├── fs.sh                     # idempotent copy + backup
        ├── config.sh                 # loads templates/config/install.conf
        ├── pages.sh                  # manifest-driven starter pages
        ├── profile.sh                # pure-bash YAML reader
        ├── wizard_interactive.sh     # non-AI prompt-based wizard
        ├── doctor.sh                 # health checks (PASS/WARN/FAIL)
        ├── upgrade.sh                # idempotent in-place upgrade
        ├── agents.sh                 # AI agent file distribution
        ├── ai/
        │   ├── openai.sh             # shared curl client + sanitizer
        │   ├── wizard.sh             # install wizard --ai
        │   ├── diagnose.sh           # install diagnose --ai
        │   └── suggest.sh            # install deploy --ai-suggest
        └── deploy/
            ├── registry.sh           # discovery, dispatch, deploy_render/deploy_copy
            ├── github-pages.sh
            ├── azure-swa.sh
            └── docker-prod.sh
```

## CLI surface (do not break without a major bump)

```
install init [--profile X] [--deploy a,b,c] [--skip-doctor] [--dry-run] [--force] [target]
install wizard [--ai] [--auto-accept] [target]
install agents [--cursor|--claude|--aider|--all] [--force] [target]
install deploy <target>[,<target>] [--ai-suggest] [--force] [target-dir]
install doctor [--ai] [--quiet] [--json] [target]
install diagnose [--ai] [--log <file>] [target]
install upgrade [--from <ver>] [--force] [--dry-run] [--auto-accept] [target]
install list-profiles | list-targets | version | help
```

Each subcommand also accepts `<subcommand> --help`.

## Source-guard pattern

Every library module starts with a guard so it's safe to source multiple times:

```bash
# scripts/lib/install/<name>.sh
[[ -n "${_HAS_<NAME>_LIB:-}" ]] && return 0
_HAS_<NAME>_LIB=1
```

The dispatcher (`scripts/bin/install`) sources what it needs lazily inside each `run_*` function — never at the top of the file.

## Adding a new subcommand

1. Add `scripts/lib/install/<name>.sh` exposing a single public entrypoint `<name>_run`.
2. Add a `run_<name>` wrapper in `scripts/bin/install` that:
   - Parses subcommand-specific flags
   - Sources the library
   - Calls `<name>_run` with positional args
   - Handles `--help` locally
3. Add the dispatch case under `main()`'s subcommand switch.
4. Update `show_usage` in the dispatcher.
5. Update [`scripts/lib/install/README.md`](../../scripts/lib/install/README.md).
6. Update [`docs/installation/index.md`](../../docs/installation/index.md) subcommand reference table.

## Adding a new profile

See [`docs/installation/profiles.md`](../../docs/installation/profiles.md). Profile YAML is the only thing you need to add — the loader picks it up via filename.

## Adding a new deploy target

See [`docs/installation/customization.md`](../../docs/installation/customization.md). Implement the four-function contract:

```bash
deploy_<target>_check_prereqs   # validate env + return non-zero on miss
deploy_<target>_install         # render templates idempotently
deploy_<target>_verify          # smoke check post-install
deploy_<target>_doc_url         # echo canonical doc URL
```

Register in `scripts/lib/install/deploy/registry.sh::DEPLOY_TARGETS=`.

## AI integration safety contracts

Read [`docs/installation/ai-features.md`](../../docs/installation/ai-features.md) before touching `scripts/lib/install/ai/*`.

| Rule | Implementation |
|---|---|
| **Opt-in only.** | Every AI codepath gated behind `--ai` / `--ai-suggest` flag. |
| **Honor `ZER0_NO_AI=1`.** | Check at the top of every public AI entrypoint; fall back or no-op. |
| **Sanitize before send.** | All payloads pass through `ai/openai.sh::_sanitize` (BSD-sed compatible). |
| **Diff before write.** | Show unified diff, prompt y/N, only then write. `--auto-accept` short-circuits the prompt for CI. |
| **Cost transparency.** | Print estimated tokens + USD before each call. |
| **Single-attempt, 30s timeout.** | No retry storms. Graceful fallback or clean exit on failure. |
| **API keys read from env only.** | Never write to disk, never log, never accept via flag. |

## Logging

Use `log_info / log_success / log_warning / log_error` from `scripts/lib/common.sh`. Don't add color codes inline — the helpers handle it. Don't `echo` user-facing status (use `log_info`); `echo` is reserved for emitting structured output (e.g., `doctor --json`).

## Testing what you touch

| Change | Minimum smoke test |
|---|---|
| New library module | `bash -n scripts/lib/install/<name>.sh` then run the wrapping subcommand against `/tmp/zer0-test-<name>` |
| New profile | `./scripts/bin/install list-profiles` then `init --profile <slug> /tmp/test-<slug>` |
| New deploy target | `./scripts/bin/install list-targets` then `deploy <target> /tmp/test-deploy-<target>` then verify generated YAML lints |
| AI module | Test with `OPENAI_API_KEY` unset (must abort cleanly), with `ZER0_NO_AI=1` (must short-circuit), and with a mocked endpoint |
| Anything | Run `./test/test_installation.sh` and ensure no new regressions |

## Bug patterns to avoid

These bit us during the 1.0 refactor — don't repeat:

1. **Bundler probes from inside a directory with a mismatched `Gemfile.lock`** spew Ruby errors. Wrap version probes in `(cd / && bundle --version 2>/dev/null)` or pipe stderr to `/dev/null`.
2. **Empty arrays under `set -u`** crash bash 3.2. Use `${arr[@]+"${arr[@]}"}` everywhere.
3. **Single-line `fi    local foo=bar`** parses as one command on bash 3.2 in some contexts. Always put `local` on its own line after `fi`.
4. **Sourcing modules at the top of `scripts/bin/install`** balloons startup time and breaks `--help`. Source lazily inside each `run_*`.
5. **Using `sed -i` without an extension** is GNU-only. Always `sed -i.bak ... && rm -f file.bak` for BSD/macOS compat.

## When in doubt

Read the relevant doc first:

- Architecture & lifecycle → [`docs/installation/architecture.md`](../../docs/installation/architecture.md)
- Profile schema & authoring → [`docs/installation/profiles.md`](../../docs/installation/profiles.md)
- Deploy modules → [`docs/installation/deploy-targets.md`](../../docs/installation/deploy-targets.md) + [`docs/installation/customization.md`](../../docs/installation/customization.md)
- AI safety → [`docs/installation/ai-features.md`](../../docs/installation/ai-features.md)
- 0.x → 1.0 mapping → [`docs/installation/migration-from-0.x.md`](../../docs/installation/migration-from-0.x.md)

---

**Last updated:** 2026-04-20 — Phase 7.
