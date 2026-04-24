# Installation Guide

The `zer0-mistakes` installer is a modular, profile-driven, AI-aware CLI built around the canonical entrypoint [`scripts/bin/install`](../../scripts/bin/install). The classic `install.sh` one-liner still works — it now bootstraps the same modular pipeline.

## Pick your path

```mermaid
flowchart TD
    Start([New site?]) -->|"yes — quickest"| Curl["curl ... | bash<br/>(legacy bootstrap)"]
    Start -->|"yes — guided"| Wizard["install wizard<br/>(interactive)"]
    Start -->|"yes — opinionated"| Init["install init --profile X"]
    Start -->|"existing site, upgrade"| Upgrade["install upgrade"]
    Start -->|"existing site, add deploy"| Deploy["install deploy <target>"]
    Start -->|"something is broken"| Doctor["install doctor"]

    Curl --> Done([✅ working site])
    Wizard --> Done
    Init --> Done
    Upgrade --> Done
    Deploy --> Done
    Doctor --> Diagnose["install diagnose [--ai]"]
    Diagnose --> Done
```

## Subcommand reference

| Command | Purpose |
|---|---|
| `install init [--profile X] [--deploy a,b,c]` | Scaffold a new site from a profile |
| `install wizard [--ai]` | Interactive setup; `--ai` uses OpenAI for `_config.yml` generation |
| `install agents [--cursor\|--claude\|--aider\|--all]` | Drop AI agent guidance files into a site |
| `install deploy <target>[,<target>] [--ai-suggest]` | Add a deploy target to an existing site |
| `install list-profiles` | Show available profiles |
| `install list-targets` | Show available deploy targets |
| `install doctor [--ai] [--quiet] [--json]` | Health check (platform, tooling, site, AI) |
| `install diagnose [--ai] [--log <file>]` | Pattern-match build errors; `--ai` proposes a patch |
| `install upgrade [--from X] [--force] [--dry-run]` | Idempotent in-place upgrade tracked via `.zer0-installed` |
| `install version` | Print theme version |
| `install help` | Show full command index |

## What's where

| Topic | Doc |
|---|---|
| Bootstrap → CLI → libs → profiles → deploy modules | [`architecture.md`](./architecture.md) |
| Schema for `templates/profiles/*.yml` and how to author your own | [`profiles.md`](./profiles.md) |
| Per-target setup, prereqs, troubleshooting | [`deploy-targets.md`](./deploy-targets.md) |
| What AI does, what data is sent, how to disable, cost notes | [`ai-features.md`](./ai-features.md) |
| Flag-by-flag mapping from 0.x to 1.0 | [`migration-from-0.x.md`](./migration-from-0.x.md) |
| Overriding templates, custom profiles, custom deploy modules | [`customization.md`](./customization.md) |

## Two-minute start

```bash
mkdir my-site && cd my-site
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash
docker-compose up   # http://localhost:4000
```

For local development against the repo:

```bash
git clone https://github.com/bamr87/zer0-mistakes.git
cd zer0-mistakes
./scripts/bin/install help
./scripts/bin/install doctor
```

---

**Last updated:** 2026-04-20 — Phase 7 docs refresh (1.0.0 prep).
