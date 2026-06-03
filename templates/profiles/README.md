# `templates/profiles/` — Declarative install profiles

Each `*.yml` file in this directory describes one install profile consumable by
[`scripts/bin/install`](../../scripts/bin/install) and the loader in
[`scripts/lib/install/profile.sh`](../../scripts/lib/install/profile.sh).

## Schema

```yaml
name: <slug>                # required, must match filename stem
display_name: <Pretty Name> # required
description: <one-liner>    # required
legacy_flag: --<mode>       # required, the install.sh flag this maps to
recommended_for: <use case>
includes:
  - <bullet>
  - <bullet>
excludes:
  - <bullet>
deploy_targets:
  - github-pages | azure-swa | docker-prod
```

## Currently shipped profiles

| Profile | Legacy flag | Description |
|---------|-------------|-------------|
| [`minimal`](minimal.yml) | `--minimal` | Smallest viable site. |
| [`full`](full.yml)       | `--full`    | Default. Starter pages + admin + wizard. |
| [`fork`](fork.yml)       | `--fork`    | Fork-friendly: resets site identity. |
| [`github`](github.yml)   | `--github`  | GitHub Pages via `remote_theme`. |
| [`remote`](remote.yml)   | `--remote`  | Bootstrap from raw.githubusercontent.com. |

## Adding a new profile

1. Copy an existing YAML and edit the fields.
2. The filename stem **must** match the `name:` field.
3. `./scripts/bin/install list-profiles` will pick it up automatically.
4. To wire a new `legacy_flag`, add support in `install.sh` (or wait for the
   Phase 4 deploy modules to consume `steps:` declaratively).

## Notes

- These YAMLs are intentionally simple (key/value + flat lists) so the bash
  3.2 loader can parse them with grep/awk/sed — no external `yq` or python
  dependency required.
- Future phases will extend the schema with `steps:` (manifest-driven file
  copies) and `deploy:` (target-specific configuration overlays).
