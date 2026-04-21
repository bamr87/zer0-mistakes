# scripts/lib/install/deploy/

Pluggable deploy-target modules consumed by `scripts/bin/install deploy`
(Phase 4 of the installer refactor). Each module configures one target;
the registry coordinates discovery, dispatch, and verification.

## Files

| File              | Role                                                                |
| ----------------- | ------------------------------------------------------------------- |
| `registry.sh`     | Module discovery, dispatch, shared `deploy_render` / `deploy_copy`. |
| `github-pages.sh` | Actions workflow that publishes `_site/` to `gh-pages`.             |
| `azure-swa.sh`    | Azure SWA workflow + `staticwebapp.config.json`.                    |
| `docker-prod.sh`  | Multi-stage Docker build + production compose + nginx config.       |

## Module contract

Every module must define:

| Symbol                                  | Purpose                                                  |
| --------------------------------------- | -------------------------------------------------------- |
| `DEPLOY_<SLUG_UPPER>_TITLE`             | One-line display name shown by `install list-targets`.   |
| `DEPLOY_<SLUG_UPPER>_SUMMARY`           | One-line description shown by `install list-targets`.    |
| `deploy_<slug>_check_prereqs <dir>`     | Print warnings; return non-zero only on hard blockers.   |
| `deploy_<slug>_install <dir>`           | Idempotent file install (uses `deploy_render_if_absent`).|
| `deploy_<slug>_verify <dir>`            | Confirm expected files exist + look correct.             |
| `deploy_<slug>_doc_url`                 | Print the canonical upstream documentation URL.          |

Modules use the lightweight `deploy_render` placeholder set
(`{{RUBY_VERSION}}`, `{{DEFAULT_BRANCH}}`, `{{GITHUB_USER}}`,
`{{SITE_NAME}}`) so they can run without the full install.sh global
environment.

## Adding a target

1. Add `templates/deploy/<slug>/` with the assets (workflow YAML,
   Dockerfile, README, etc.). Use `*.template` for files that need
   variable substitution.
2. Create `scripts/lib/install/deploy/<slug>.sh` exporting the four
   hooks above.
3. Add `<slug>` to `DEPLOY_TARGETS_LIST` in `registry.sh` (alphabetical).
4. Optionally reference `<slug>` under `deploy_targets:` in
   `templates/profiles/*.yml` so the profile can suggest it.
5. Update `templates/deploy/README.md` with the new target row.

## CLI integration

```bash
./scripts/bin/install list-targets
./scripts/bin/install deploy github-pages /path/to/site
./scripts/bin/install deploy azure-swa,docker-prod /path/to/site
```
