# Migration: 0.x → 1.0

`zer0-mistakes` 1.0 introduces a modular CLI (`scripts/bin/install`) with subcommands and declarative profiles. The legacy `install.sh` flags **still work** as a bootstrap path — they translate to the new CLI under the hood and emit a one-line deprecation notice — but new sites and scripts should adopt the CLI directly.

## TL;DR

| You used to do… | You now do… | Status |
|---|---|---|
| `curl ... | bash` | Same. Still the recommended quickstart. | ✅ unchanged |
| `bash install.sh --full` | `install init --profile full` | Old flag still works; warns. |
| `bash install.sh --minimal` | `install init --profile minimal` | Old flag still works; warns. |
| `bash install.sh --fork` | `install init --profile fork` | Old flag still works; warns. |
| `bash install.sh --remote` | `install init --profile remote` | Old flag still works; warns. |
| `bash install.sh --github` | `install init --profile github` | Old flag still works; warns. |
| `bash install.sh --azure` | `install deploy azure-swa` | The Azure path is now a deploy module. |
| `./scripts/migrate.sh /site` | `install agents /site` for AI guidance; `install init --profile full /site` to scaffold pages. | `migrate.sh` continues to work for the admin-pages drop-in. |

## Flag-by-flag

### Install modes

| Old flag | New command | Notes |
|---|---|---|
| `--full` | `install init --profile full` | Default if no profile specified. |
| `--minimal` | `install init --profile minimal` | |
| `--fork` | `install init --profile fork` | Run inside a fresh fork checkout. |
| `--remote` | `install init --profile remote` | Sets `remote_theme:` instead of vendoring. |
| `--github` | `install init --profile github` | Pre-wires the GH Pages workflow. |
| `--target /path` | positional arg: `install init --profile X /path` | Trailing path is the target dir. |
| `--dry-run` | Same: `install init --profile X --dry-run` | Honored by every subcommand. |
| `--force` | Same: `install init --profile X --force` | Overwrites without backups. |
| `--verbose` | Same: `install init --profile X --verbose` | Inherited from `scripts/lib/common.sh`. |
| `--help` | `install help` (top level) or `install <subcommand> --help` | |

### Azure / deploy

| Old behavior | New command |
|---|---|
| `--azure` (or implicit Azure workflow) | `install deploy azure-swa /path` |
| (no equivalent) | `install deploy github-pages /path` |
| (no equivalent) | `install deploy docker-prod /path` |

### Brand-new in 1.0

| Command | Purpose |
|---|---|
| `install wizard [--ai]` | Interactive setup; `--ai` uses OpenAI for `_config.yml` |
| `install agents [--cursor\|--claude\|--aider\|--all]` | Drop AI agent guidance into a site |
| `install doctor [--ai] [--quiet] [--json]` | Health check |
| `install diagnose [--ai] [--log <file>]` | Diagnose a build error; `--ai` proposes a patch |
| `install upgrade [--from X] [--force] [--dry-run]` | Idempotent in-place upgrade tracked via `.zer0-installed` |
| `install list-profiles` / `install list-targets` | Discovery |

## What changed under the hood

- **`install.sh`** is now a bootstrap. The 2,400-line monolith from 0.22 is gone — its logic moved into `scripts/lib/install/*.sh` and `templates/`. The `curl | bash` entrypoint behaves identically from the user's perspective.
- **`templates/profiles/*.yml`** replaces the if/elif mode dispatcher. Adding a new install mode no longer requires touching `install.sh`.
- **`templates/deploy/<target>/`** + **`scripts/lib/install/deploy/<target>.sh`** replaces the inline Azure workflow generator. Adding a new deploy target is a self-contained drop-in.
- **`scripts/lib/install/ai/*`** — new opt-in AI integration (wizard, diagnose, suggest, openai client).
- **`.zer0-installed`** — new marker file at the site root tracking which theme version installed it. Used by `install upgrade` for idempotency. Safe to commit or `.gitignore`.

## Migrating an existing 0.x site

You don't have to do anything. Existing sites continue to work with the 1.0 theme as a remote theme or a gem. To adopt the new CLI on an existing site:

```bash
cd /path/to/your-existing-site
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash -s -- --target . --force
# or, after cloning the theme repo locally:
/path/to/zer0-mistakes/scripts/bin/install upgrade /path/to/your-existing-site
/path/to/zer0-mistakes/scripts/bin/install agents /path/to/your-existing-site --all
```

## Removed / replaced

| Removed | Replacement |
|---|---|
| Embedded heredoc fallbacks for every generated file in `install.sh` | `templates/` directory; `template.sh::create_from_template` |
| 8 near-identical `create_*_page` functions | `pages.sh::render_starter_pages` driven by `profile.includes` |
| Inline `create_azure_static_web_apps_workflow` | `scripts/lib/install/deploy/azure-swa.sh` + `templates/deploy/azure-swa/` |
| Branding-only "AI-powered" claim | Real `install agents` (file copy) + `install wizard --ai` (OpenAI) + `install diagnose --ai` (patch generator) + `install deploy --ai-suggest` |

## Breaking changes (read carefully)

1. **`install.sh` no longer maintains its own copy of every generated file.** A stripped distribution (theme tarball without `templates/`) will fail. The bootstrap downloads the templates tarball alongside `install.sh` for `curl | bash`. If you previously vendored only `install.sh`, vendor `templates/` too.
2. **`scripts/migrate.sh` scope narrowed.** It still installs the 6 admin pages but no longer attempts to scaffold a full site — use `install init --profile full` for that.
3. **The `--azure` flag is gone.** Use `install deploy azure-swa`. The old flag emits a clear error pointing at the new command.
4. **Deprecation timeline.** Legacy mode flags (`--full`, `--minimal`, `--fork`, `--remote`, `--github`) print a one-line deprecation warning in 1.0.x and will be removed in 2.0.

---

**Last updated:** 2026-04-20 — Phase 7. Targeted release: 1.0.0.
