# Customization

The installer is designed for forking. Three extension points cover almost every customization scenario without modifying the bootstrap or CLI dispatcher.

## 1. Override an existing template

Templates live under [`templates/`](../../templates/). To override one, copy it into your fork and edit. The installer always prefers files under `templates/` in its own checkout — if you fork the repo, your edits win.

```bash
# inside your fork
$EDITOR templates/pages/admin/theme.md.template
./scripts/bin/install init --profile full /tmp/test-fork
```

For one-off site-level overrides (without forking the theme), the installer **does not** overwrite existing files unless you pass `--force`. Edit the file in your generated site directly; future `install upgrade` runs preserve it (and warn if the upstream template diverged).

## 2. Author a custom profile

See [`profiles.md`](./profiles.md). Drop a `templates/profiles/<your-slug>.yml` into your fork; `install list-profiles` picks it up automatically.

```yaml
# templates/profiles/blog-only.yml
name: blog-only
display_name: Blog Only
description: Just the blog scaffold, no docs/admin pages
legacy_flag: --minimal
recommended_for: writers who want zero ceremony

includes:
  - Gemfile
  - _config.yml
  - pages/blog.md
  - _data/navigation/main.yml

deploy_targets:
  - github-pages

ai_features:
  agent_files: [copilot]
```

## 3. Add a custom deploy target

Two artifacts to add:

**a) The module:** `scripts/lib/install/deploy/<your-target>.sh` implementing the four-function contract.

```bash
# scripts/lib/install/deploy/cloudflare-pages.sh
deploy_cloudflare-pages_check_prereqs() {
  command -v wrangler >/dev/null || {
    log_warning "wrangler CLI not found"; return 1
  }
}

deploy_cloudflare-pages_install() {
  local target_dir="$1" repo_root="$2"
  deploy_render "$repo_root/templates/deploy/cloudflare-pages/wrangler.toml.template" \
                "$target_dir/wrangler.toml"
  deploy_render "$repo_root/templates/deploy/cloudflare-pages/pages-deploy.yml.template" \
                "$target_dir/.github/workflows/pages-deploy.yml"
}

deploy_cloudflare-pages_verify() {
  [[ -f "$1/wrangler.toml" ]] || return 1
}

deploy_cloudflare-pages_doc_url() {
  echo "https://developers.cloudflare.com/pages/"
}
```

**b) The templates:** `templates/deploy/cloudflare-pages/wrangler.toml.template` and `pages-deploy.yml.template`. Use `{{VAR}}` placeholders — `template.sh::render_template` substitutes them. Allowed placeholders: `{{SITE_NAME}}`, `{{GITHUB_USER}}`, `{{GITHUB_REPO}}`, `{{RUBY_VERSION}}`. Add more by extending the allow-list in `deploy/registry.sh::deploy_render`.

**c) Register it:** Add the module name to `DEPLOY_TARGETS=` in `scripts/lib/install/deploy/registry.sh`.

After that:

```bash
./scripts/bin/install list-targets         # confirms registration
./scripts/bin/install deploy cloudflare-pages /tmp/test
```

## 4. Custom agent files

`install agents` copies from [`templates/agents/`](../../templates/agents/) plus the canonical guidance under `.github/`. To ship a different set:

- Edit `templates/agents/CLAUDE.md.template` or `aider.conf.yml.template` in your fork.
- For a brand-new agent type, add `templates/agents/<tool>.template` and extend `agents.sh::agents_install` with a new `--<tool>` flag.

## 5. Custom AI prompts

System prompts live under [`templates/ai/prompts/`](../../templates/ai/prompts/). They are plain markdown — fork and edit. `install wizard --ai`, `install diagnose --ai`, and `install deploy --ai-suggest` pick them up automatically.

## What you should NOT customize

- **`scripts/bin/install`** — keep this stable; it's the public CLI surface. Add subcommands by adding modules under `scripts/lib/install/` and wiring them in.
- **Public function signatures in `scripts/lib/install/*.sh`** — other modules (and forks) depend on them.
- **`.zer0-installed` marker file format** — `install upgrade` parses it.

## Upstreaming

If your customization could help others, open a PR against [`bamr87/zer0-mistakes`](https://github.com/bamr87/zer0-mistakes). Profiles, deploy targets, and prompt improvements are especially welcome.

---

**Last updated:** 2026-04-20 — Phase 7.
