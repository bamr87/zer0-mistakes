# Deploy templates

Each subdirectory holds the static files (workflow YAML, Dockerfile,
config snippets, README) for a single deploy target. The matching
`scripts/lib/install/deploy/<target>.sh` module copies / renders these
files into a target site when the user runs:

```bash
./scripts/bin/install deploy <target> [TARGET_DIR]
```

## Targets

| Slug          | Module                                            | Purpose                                              |
| ------------- | ------------------------------------------------- | ---------------------------------------------------- |
| `github-pages` | `scripts/lib/install/deploy/github-pages.sh`      | GitHub Pages via Actions (`peaceiris/actions-gh-pages`) |
| `azure-swa`    | `scripts/lib/install/deploy/azure-swa.sh`         | Azure Static Web Apps (`Azure/static-web-apps-deploy`) |
| `docker-prod`  | `scripts/lib/install/deploy/docker-prod.sh`       | Self-hosted production Docker image + compose        |

## File suffix convention

| Suffix              | Treatment                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `*.template`        | Rendered via `scripts/lib/install/template.sh::render_template` (variable substitution).   |
| `*` (no suffix)     | Copied verbatim through `scripts/lib/install/fs.sh::copy_file_with_backup`.                |
| `README.md`         | Documentation only — never copied to the target site.                                      |

## Adding a new target

1. Create `templates/deploy/<slug>/` with the assets.
2. Add `scripts/lib/install/deploy/<slug>.sh` exporting the four hooks
   (`deploy_<slug>_check_prereqs`, `_install`, `_verify`, `_doc_url`).
3. Register the slug in `scripts/lib/install/deploy/registry.sh`.
4. (Optional) Reference the slug under `deploy_targets:` in any
   `templates/profiles/*.yml` profile that should suggest it.
