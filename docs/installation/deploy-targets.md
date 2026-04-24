# Deploy Targets

Each deploy target is a self-contained module under [`scripts/lib/install/deploy/`](../../scripts/lib/install/deploy/) backed by templates under [`templates/deploy/<target>/`](../../templates/deploy/). All modules implement the same contract:

| Function | Purpose |
|---|---|
| `deploy_<target>_check_prereqs` | Validate environment & required env vars; return non-zero on miss. |
| `deploy_<target>_install` | Render templates into the target site. Idempotent. |
| `deploy_<target>_verify` | Smoke-check the installed artifacts (yaml lint, file presence). |
| `deploy_<target>_doc_url` | Return the canonical doc URL for next-step manual setup. |

Run `./scripts/bin/install list-targets` to see available targets.

## github-pages

Generates `.github/workflows/jekyll-gh-pages.yml`, ensures `_config.yml` has the right `url`/`baseurl`, and prints the GitHub Pages enablement steps.

```bash
./scripts/bin/install deploy github-pages /path/to/site
```

| Need | Detail |
|---|---|
| **Prereqs** | Repo pushed to GitHub. `gh` CLI optional but recommended. |
| **Generated** | `.github/workflows/jekyll-gh-pages.yml` |
| **Manual step** | Settings → Pages → Source = `GitHub Actions` |
| **Custom domain** | Add a `CNAME` file at the site root. The workflow preserves it. |
| **Troubleshooting** | If the build fails on `bundler` not finding the theme gem, fall back to `remote_theme:` in `_config.yml`. |

## azure-swa

Generates the Azure Static Web Apps workflow with the correct `app_location`, `output_location`, and Jekyll-compatible build steps.

```bash
./scripts/bin/install deploy azure-swa /path/to/site
```

| Need | Detail |
|---|---|
| **Prereqs** | Azure SWA resource created. Deployment token from the Azure portal. |
| **Generated** | `.github/workflows/azure-static-web-apps.yml` |
| **Manual step** | Add `AZURE_STATIC_WEB_APPS_API_TOKEN` to repo secrets. |
| **Custom domain** | Configure under **Custom domains** in the Azure portal. |
| **Troubleshooting** | If the token name in the workflow doesn't match your portal-issued token, edit the `api_token` line. |

## docker-prod

Generates `docker-compose.prod.yml`, a multi-stage `docker/Dockerfile.prod`, an `nginx.conf`, and `.dockerignore`. Self-host on any container runtime.

```bash
./scripts/bin/install deploy docker-prod /path/to/site
```

| Need | Detail |
|---|---|
| **Prereqs** | Docker on the host. Optional reverse proxy (Caddy/Traefik) for TLS. |
| **Generated** | `docker-compose.prod.yml`, `docker/Dockerfile.prod`, `docker/nginx.conf`, `.dockerignore` |
| **Build & run** | `docker compose -f docker-compose.prod.yml up -d --build` |
| **Custom domain** | Front with your reverse proxy or set `server_name` in `nginx.conf`. |
| **Troubleshooting** | If the multi-stage build can't find `_site`, run `bundle exec jekyll build` once locally before the Docker build, or comment out the bind-mount block in `docker-compose.prod.yml`. |

## Multiple targets at once

```bash
./scripts/bin/install deploy github-pages,docker-prod /path/to/site
./scripts/bin/install init --profile full --deploy github-pages,azure-swa /path/to/site
```

Targets are processed in the order listed; failures in one do not abort the others (each module reports its own pass/fail).

## AI-assisted target picking

```bash
./scripts/bin/install deploy --ai-suggest /path/to/site
```

Without `--ai`, this is rule-based (Dockerfile + custom CNAME → docker-prod; presence of `staticwebapp.config.json` → azure-swa; otherwise github-pages). With `--ai`, it sends a small site fingerprint to OpenAI for a recommendation + rationale. See [`ai-features.md`](./ai-features.md) for the full data-flow.

## Adding a new target

1. Create `scripts/lib/install/deploy/<your-target>.sh` implementing the four `deploy_<target>_*` functions.
2. Add templates under `templates/deploy/<your-target>/`.
3. Register it in `scripts/lib/install/deploy/registry.sh`.
4. List it in [`scripts/lib/install/deploy/README.md`](../../scripts/lib/install/deploy/README.md).
5. Add a smoke test under `test/test_install_deploy.sh` (Phase 8).

---

**Last updated:** 2026-04-20 — Phase 7.
