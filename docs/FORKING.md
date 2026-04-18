# Forking Guide: From Fork to Personalized Site

This guide walks you through the progressive workflow of deploying your own site using the Zer0-Mistakes theme — from fork to configuration to personalization.

## Overview

| Phase | Effort | What You Get |
|-------|--------|-------------|
| **1. Fork** | ~2 minutes | Working site at `username.github.io` |
| **2. Configure** | ~5 minutes | Your name, title, branding, and clean content |
| **3. Personalize** | Ongoing | Custom content, styles, and features |

---

## Phase 1: Fork & Deploy

Fork the repo into a repository named `<your-username>.github.io`. This is a **GitHub Pages user site**, which deploys from the root domain — no `baseurl` issues, no special workflows needed.

> **Prerequisites:**
> - You **do not** already have a repository named `<your-username>.github.io`. GitHub only allows one user site per account. If you already have one, you'll need to rename or delete it first, or fork into a different repo name and [set `baseurl` manually](#site-deploys-but-has-no-styling).
> - This will become your **primary GitHub Pages site** — the one free `username.github.io` domain that every GitHub account gets. You can only have one of these; all other repos deploy as project sites under `username.github.io/repo-name/`.

### Steps

1. **Fork the repository**
   - Go to [bamr87/zer0-mistakes](https://github.com/bamr87/zer0-mistakes) → **Fork**
   - **Repository name: `<your-username>.github.io`** (this is the key step)
   - Uncheck "Copy the `main` branch only" if you want all branches

2. **Enable GitHub Pages** (if not already enabled)
   - Go to **Settings → Pages**
   - Under **Source**, select **Deploy from a branch**
   - Branch: `main`, folder: `/ (root)`
   - Click **Save**

3. **Wait for the first build**
   - GitHub Pages automatically builds Jekyll sites on push
   - Check the **Actions** tab for build status

4. **Visit your site**
   - `https://<your-username>.github.io`

### Why `username.github.io`?

GitHub Pages has two site types:

| Type | Repo name | URL | `baseurl` needed |
|------|-----------|-----|-----------------|
| **User site** | `username.github.io` | `https://username.github.io` | No (`""`) |
| **Project site** | any other name | `https://username.github.io/repo-name` | Yes (`"/repo-name"`) |

By forking into `username.github.io`, the site deploys at the domain root. The theme's `_config.yml` ships with `baseurl: ""`, so all asset paths, navigation links, and images work immediately — zero config needed.

---

## Phase 2: Configure Your Identity

Clone the fork locally and run the configuration script to make the site yours.

### Step 1: Clone your fork

```bash
git clone https://github.com/<your-username>/<your-username>.github.io.git
cd <your-username>.github.io
```

### Step 2: Run the Fork Cleanup Script (Recommended)

```bash
# Interactive mode — prompts you for each value
./scripts/fork-cleanup.sh

# Or non-interactive with all values
./scripts/fork-cleanup.sh --non-interactive \
  --site-name "My Site" \
  --github-user "your-username" \
  --author "Your Name" \
  --email "you@example.com"

# Preview changes first without making edits
./scripts/fork-cleanup.sh --dry-run
```

The script:
- Updates identity fields in `_config.yml` (preserving YAML anchors)
- Sets `repository_name`, `local_repo`, and `github_user` to match your fork
- Sets `url` to `https://<your-username>.github.io`
- Removes example blog posts, notebooks, and sample content
- Clears analytics IDs (Google Analytics, PostHog)
- Creates a welcome post
- Resets `_data/authors.yml`

### Step 2 (Alternative): Manual Edit

If you prefer to edit by hand, update these fields in `_config.yml`:

```yaml
# Identity
founder                  : "Your Name"
github_user              : &github_user "your-username"
repository_name          : &github_repository "your-username.github.io"
local_repo               : &local_repo "your-username.github.io"
title                    : &title "Your Site Title"
name                     : &name "Your Name"
email                    : "you@example.com"

# URL — set to your GitHub Pages URL
url                      : &url https://your-username.github.io

# Analytics — clear these so you don't send data to the upstream site
google_analytics         : ''
# Under posthog:
#   enabled              : false
#   api_key              : ''
```

### Step 3: Push and Deploy

```bash
git add -A
git commit -m "chore: configure site identity for fork"
git push
```

GitHub Pages rebuilds automatically on push to `main`. Your site at `https://<your-username>.github.io` will update within a few minutes.

---

## Phase 3: Personalize

### Content

| What | Where | Notes |
|------|-------|-------|
| Blog posts | `pages/_posts/` | `YYYY-MM-DD-title.md` naming convention |
| Documentation | `pages/_docs/` | Organized by category |
| Quests/tutorials | `pages/_quests/` | Gamified learning paths |
| About page | `pages/_about/` | Profile, features, bios |
| Navigation | `_data/navigation/` | YAML menu definitions |

### Styles

- **Custom CSS**: Override in `assets/css/main.css` (compiled from `_sass/`)
- **Bootstrap variables**: Modify via `_sass/` custom files
- **Theme colors**: Uses Bootstrap 5.3.3 CSS variables

### Custom Domain (Optional)

1. Add a `CNAME` file to the repo root containing your domain (e.g. `www.example.com`)
2. Configure your DNS to point to GitHub Pages ([GitHub docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site))
3. Update `url` in `_config.yml` to `https://www.example.com`
4. Push — GitHub Pages handles the rest

### Local Development

```bash
# Docker (recommended)
docker-compose up
# Visit http://localhost:4000

# Or without Docker
bundle install
bundle exec jekyll serve --config "_config.yml,_config_dev.yml"
```

The `_config_dev.yml` overlay disables analytics, enables drafts, and sets `url` to `localhost:4000`.

---

## Architecture: Config Layering

The config system uses layered YAML files so the same source works across environments:

```
_config.yml                 ← Base config (identity, collections, plugins, url)
  + _config_dev.yml         ← Local dev overlay (analytics off, localhost)
```

**Key design decisions:**

- **`username.github.io` naming** eliminates `baseurl` issues entirely — the site always deploys at the domain root
- **YAML anchors** (`&github_user`, `*github_user`) keep config DRY — change a value once, it propagates everywhere
- **`relative_url` filter** used in all templates — assets resolve correctly regardless of deployment path
- **Bundled assets** (Bootstrap, MathJax, Mermaid in `assets/vendor/`) — no CDN dependencies; works offline and avoids CORS issues on Pages

---

## Troubleshooting

### Site deploys but has no styling

**Cause:** Your repo is named something other than `username.github.io`, making it a project site. The default `baseurl: ""` doesn't include the repo name prefix.

**Fix:** Either:
- Rename the repo to `<your-username>.github.io` (Settings → General → Repository name)
- Or manually set `baseurl` in `_config.yml` to `"/your-repo-name"`

### 404 on all pages except index

**Cause:** `baseurl` mismatch between what Jekyll generates and where GitHub Pages serves.

**Fix:** Same as above — rename the repo to `username.github.io` or set `baseurl` to match.

### Build fails on GitHub Pages

Check the **Actions** tab (or the commit status on the **Code** tab) for build logs. Common issues:
- Missing gem or incompatible version → run `bundle update` locally, commit `Gemfile.lock`
- Invalid YAML in `_config.yml` → validate with `ruby -ryaml -e "YAML.load_file('_config.yml')"`
- Liquid syntax errors → check the template file referenced in the error

### Analytics tracking the upstream site

Run `./scripts/fork-cleanup.sh` or manually clear `google_analytics` and `posthog.api_key` in `_config.yml`.

---

## Quick Reference

| Task | Command / Action |
|------|-----------------|
| Fork the repo | Fork → name it `username.github.io` |
| Enable Pages | Settings → Pages → Deploy from branch → `main` |
| Configure identity | `./scripts/fork-cleanup.sh` |
| Preview cleanup safely | `./scripts/fork-cleanup.sh --dry-run` |
| Start local dev | `docker-compose up` |
| Build locally | `bundle exec jekyll build` |
| Add a blog post | Create `pages/_posts/YYYY-MM-DD-title.md` |
| Set custom domain | Add `CNAME` file + update `url` in `_config.yml` |

---

## Verifying the Cleanup Script

If you're modifying or auditing `scripts/fork-cleanup.sh` itself, run the test suite:

```bash
./test/test_fork_cleanup.sh           # 32 assertions, ~30 seconds
./test/test_fork_cleanup.sh --verbose # show failure details
./test/test_fork_cleanup.sh --no-cleanup  # keep temp workspaces for inspection
```

The suite snapshots the working tree into a throwaway `/tmp` workspace, runs the
cleanup script, and asserts that:

- Required example paths (`pages/_posts`, `CNAME`, `assets/images/previews`, …) are removed
- A welcome post is generated under `pages/_posts/`
- `_config.yml` remains valid YAML and identity / URL / analytics fields are reset
- YAML anchors (`&github_user`, `&title`, `&url`, …) are preserved so existing alias references keep working
- Re-running the cleanup is idempotent (safe to invoke twice)

A backup of the original `_config.yml` is written next to it as
`_config.yml.backup.YYYYMMDDHHMMSS` on every real (non-dry) run.
