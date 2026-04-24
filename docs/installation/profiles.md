# Profiles

A **profile** is a declarative YAML manifest under [`templates/profiles/`](../../templates/profiles/) that tells the installer what to install and how to brand it. Profiles replaced the old if/elif `--minimal | --full | --fork | --remote | --github` mode dispatcher.

## Schema

```yaml
name: <slug>                        # required, must match filename stem
display_name: <Pretty Name>         # required
description: <one-liner>            # required, shown in `install list-profiles`
legacy_flag: --<mode>               # required, the install.sh flag this maps to
recommended_for: <use case>         # optional, free-form hint

includes:                           # optional, human-readable list of what gets installed
  - Gemfile
  - _config.yml
  - pages/index.md
  - ...

excludes: []                        # optional, anything explicitly omitted

deploy_targets:                     # optional, suggested defaults for `install deploy`
  - github-pages
  - azure-swa
  - docker-prod

ai_features:                        # optional, what `install agents` ships by default
  agent_files: [copilot, claude]    # any of: copilot, cursor, claude, aider
```

## Currently shipped profiles

| Profile | Legacy flag | When to pick it |
|---|---|---|
| [`full`](../../templates/profiles/full.yml) | `--full` | Default. Starter pages, navigation, admin settings, dev wizard. |
| [`minimal`](../../templates/profiles/minimal.yml) | `--minimal` | Smallest viable site. No starter pages. |
| [`fork`](../../templates/profiles/fork.yml) | `--fork` | Fork of the theme repo; resets identity, removes example content. |
| [`remote`](../../templates/profiles/remote.yml) | `--remote` | Consume the theme as a remote theme on GitHub Pages. |
| [`github`](../../templates/profiles/github.yml) | `--github` | GitHub-Pages-targeted layout with workflow scaffolding. |

Run `./scripts/bin/install list-profiles` to see what's installed locally.

## Picking a profile

```bash
./scripts/bin/install init --profile full /path/to/site        # default
./scripts/bin/install init --profile minimal /path/to/site
./scripts/bin/install init --profile fork                       # in a fresh fork checkout
```

`install wizard` (without `--ai`) discovers profiles dynamically and prompts you to pick one.

## Authoring a custom profile

1. Create `templates/profiles/<your-slug>.yml` matching the schema above. The `name:` field **must** equal the filename stem.
2. Map `legacy_flag:` to whichever existing `install.sh` mode flag (`--full`, `--minimal`, `--fork`, …) most closely matches your intent — that's what the dispatcher hands to the bootstrap.
3. List your profile in [`templates/profiles/README.md`](../../templates/profiles/README.md).
4. Test:
   ```bash
   ./scripts/bin/install list-profiles            # confirm it shows up
   ./scripts/bin/install init --profile <your-slug> /tmp/test-profile
   ```
5. Optional: open a PR against `bamr87/zer0-mistakes` to upstream it.

## What profiles cannot do

Profiles are **declarative only**. They cannot:

- Run shell commands. (Use a deploy module for that.)
- Conditionally include files based on user input. (Compose with a CLI flag instead.)
- Mutate other profiles. (Each profile is self-contained.)

If you need procedural logic, write a small library module under `scripts/lib/install/` and call it from the CLI dispatcher — keep YAML pure.

## Programmatic access

The pure-bash YAML reader lives in [`scripts/lib/install/profile.sh`](../../scripts/lib/install/profile.sh):

```bash
source scripts/lib/install/profile.sh

list_profile_names                               # -> full minimal fork remote github
profile_path full                                # -> templates/profiles/full.yml
profile_get_scalar full legacy_flag              # -> --full
profile_get_list full deploy_targets             # -> github-pages\nazure-swa\ndocker-prod
profile_print_summary full                       # human-readable summary
```

Bash 3.2 compatible — no `yq`, no `python`, no external deps.

---

**Last updated:** 2026-04-20 — Phase 7.
