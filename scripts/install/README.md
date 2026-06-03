# scripts/install/ — Modular Installer v2

Spec-driven, AI-integrated Jekyll theme installer for zer0-mistakes.

## Architecture

```
scripts/install/
├── cli.sh          Subcommand dispatcher — main entry point
├── plan.sh         Spec builder (flags + profile + env + platform)
├── apply.sh        Executor — reads spec, runs tasks in order
├── diff.sh         Spec-vs-disk diff renderer (preview before apply)
├── spec.sh         JSON spec I/O (jq optional; awk fallback)
├── log.sh          Color-coded logging (human + JSON-line modes)
├── platform.sh     OS / Ruby / Docker / git / gh detection
├── fs.sh           THE ONLY filesystem writer (dry-run, backup, force)
├── template.sh     {{VAR}} template renderer (reads from templates/)
├── prompt.sh       TTY-aware interactive prompts
├── doctor.sh       Pre-install health checks
├── tui.sh          Non-AI interactive wizard → spec
├── upgrade.sh      Re-apply spec to existing install
├── repair.sh       Fix drift: re-apply only changed tasks
├── tasks/
│   ├── _registry.sh    Task metadata + dependency graph
│   ├── config.sh       _config.yml + _config_dev.yml
│   ├── gemfile.sh      Gemfile (variant per profile/platform)
│   ├── docker.sh       docker-compose.yml + docker/Dockerfile
│   ├── theme.sh        Copy _layouts _includes _sass assets
│   ├── pages.sh        Starter pages from templates/pages/
│   ├── nav.sh          _data/navigation/main.yml
│   ├── data.sh         _data/authors.yml + seed data
│   ├── devcontainer.sh .devcontainer/devcontainer.json
│   ├── agents.sh       AI agent files (AGENTS.md, copilot, claude, cursor, aider)
│   ├── gitignore.sh    .gitignore
│   ├── readme.sh       INSTALLATION.md + README seed
│   └── marker.sh       .zer0-installed + spec persistence
└── ai/
    ├── client.sh       HTTP wrapper (OpenAI-compatible, 30s timeout)
    ├── wizard.sh       LLM → spec (AI-driven setup)
    ├── diagnose.sh     Jekyll build errors → fix suggestions
    ├── suggest.sh      Goal text → profile + deploy recommendation
    └── prompts/
        ├── spec.schema.json     JSON Schema (AI contract)
        ├── wizard.system.md     AI wizard system prompt
        ├── diagnose.system.md   AI diagnose system prompt
        └── suggest.system.md    AI suggest system prompt
```

## Core concepts

### The Spec

A single JSON document (`.zer0/install.spec.json`) is the universal contract
between all front-ends and the executor:

```
CLI flags → plan.sh → spec.json → apply.sh → tasks → files on disk
AI wizard → spec.json → apply.sh → tasks → files on disk
TUI wizard → spec.json → apply.sh → tasks → files on disk
```

The spec schema is defined in `ai/prompts/spec.schema.json`. The AI is
constrained to emit only valid spec JSON — never raw file content.

### Write contract

**ALL filesystem writes go through `fs.sh`**. No raw `>`, `cp`, or `echo >` 
outside of `fs.sh` functions. This enforces:
- `--dry-run`: zero mutations
- `--backup`: auto-backup before overwrite
- `--force`: overwrite without prompting

### Template contract

**ALL generated file content comes from `templates/`**. No heredocs in shell
code. Templates use `{{VARIABLE}}` substitution via `template.sh::tmpl_apply`.

### Bash 3.2 compatibility

This installer runs on macOS's `/bin/bash` (3.2). Restrictions:
- No `declare -A` (associative arrays)
- No `=~` capture groups  
- No `mapfile`/`readarray`
- Source guards (`[[ -n "${_HAS_FOO:-}" ]] && return 0`) on every module
- Modules do not `set -euo pipefail` or call `exit` (caller does)

## Usage

```bash
# Local development
./scripts/bin/install help
./scripts/bin/install init . --profile blog --site-title "My Blog"
./scripts/bin/install wizard . --ai
./scripts/bin/install doctor .
./scripts/bin/install diff .
./scripts/bin/install plan . --profile docs

# Remote (curl|bash)
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/scripts/bin/install | bash -s -- init . --profile github-pages
```

## Adding a new task

1. Create `tasks/mytask.sh` with:
   ```bash
   [[ -n "${_HAS_TASK_MYTASK:-}" ]] && return 0
   _HAS_TASK_MYTASK=1
   task_mytask_run() {
       local target="$1"
       tmpl_apply "config/mytask.template" "${target}/output-file"
   }
   ```
2. Add to `tasks/_registry.sh` (`_TASK_ALL`, `_task_desc_mytask`, `_task_deps_mytask`)
3. Add template to `templates/config/` or `templates/pages/`
4. List in the appropriate profile YAML under `templates/profiles/`

## AI integration

The AI path is a first-class citizen but never mandatory:

- `ai_wizard_run` → interactive LLM spec generation
- `ai_diagnose_run` → post-build error analysis  
- `ai_suggest_run` → profile + deploy recommendation

All three are guarded by `ZER0_NO_AI=1` kill-switch and degrade gracefully
to defaults or rule-based logic when AI is unavailable.

To enable: set `OPENAI_API_KEY` (or `OPENAI_BASE_URL` for Azure/Ollama).

## Deploy plugins

Deploy targets listed in the spec (`SPEC_DEPLOY`) are dispatched as
`tasks/deploy_<target>.sh` modules that render reusable templates from
`templates/deploy/<target>/`. Built-in plugins:

| Target            | Writes                                                              |
|-------------------|---------------------------------------------------------------------|
| `github-pages`    | `.github/workflows/jekyll-gh-pages.yml`                             |
| `azure-swa`       | `.github/workflows/azure-static-web-apps.yml`, `staticwebapp.config.json` |
| `docker-prod`     | `Dockerfile.prod`, `docker-compose.prod.yml`, `nginx.conf`, `.dockerignore` |

Add a new plugin by dropping `tasks/deploy_<target>.sh` with a
`task_deploy_<target>_run` function plus a `templates/deploy/<target>/`
template directory. The dispatcher is generic — no registry changes needed.

## Testing

A regression harness lives at [`test/test_installer.sh`](../../test/test_installer.sh)
and is wired into the main runner as the `installer` suite:

```bash
# Standalone (auto-enables AI tier when OPENAI_API_KEY is set)
./test/test_installer.sh
./test/test_installer.sh --ai      # force AI tier on
./test/test_installer.sh --no-ai   # skip AI tier

# Via the unified runner (included in --suites all and --suites full)
./test/test_runner.sh --suites installer
```

The harness covers: module syntax, all 6 profile inits, all 3 deploy plugins,
all 5 agent flavours, and (when keyed) the full AI wizard → apply pipeline.
