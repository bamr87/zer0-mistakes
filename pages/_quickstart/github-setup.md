---
title: GitHub Setup & Deployment
author: Zer0-Mistakes Development Team
layout: default
description: Configure GitHub integration for version control and automated deployment. Fork the theme, set up SSH keys, and deploy to GitHub Pages.
permalink: /quickstart/github-setup/
preview: /images/previews/github-setup-deployment.png
categories:
  - Documentation
  - Quick Start
tags:
  - github
  - git
  - deployment
  - github-pages
  - version-control
keywords:
  primary:
    - github pages deployment
    - git workflow
  secondary:
    - ssh keys
    - github cli
    - fork repository
    - pull requests
lastmod: 2026-05-30T00:00:00.000Z
draft: false
sidebar:
  nav: quickstart
quickstart:
  step: 3
  next: /quickstart/personalization/
  prev: /quickstart/jekyll-setup/
mermaid: true
---

# GitHub Setup & Deployment

Authenticate with GitHub, fork the theme, and deploy your site to GitHub Pages.

```mermaid
flowchart LR
    A([Machine Setup done]) --> B[gh auth login]
    B --> C[Fork bamr87/zer0-mistakes]
    C --> D[./scripts/fork-cleanup.sh]
    D --> E[docker-compose up]
    E --> F[git push origin main]
    F --> G[GitHub Actions builds site]
    G --> H([username.github.io live 🚀])
```

## Prerequisites

- Completed [Machine Setup](/quickstart/machine-setup/) (Docker, Git, GitHub CLI)
- A [GitHub account](https://github.com/signup)

## Step 1 — Authenticate with GitHub CLI

```bash
gh auth login
# → GitHub.com
# → HTTPS
# → Login with a web browser
# Copy the one-time code, press Enter, paste in the browser
```

Verify:

```bash
gh auth status
```

![gh auth login output](/assets/images/quickstart/github-setup-auth.png)

## Step 2 — Fork the Repository

![bamr87/zer0-mistakes repository on GitHub](/assets/images/quickstart/github-repo-main.png)

Fork `bamr87/zer0-mistakes` into your account. The easiest path is naming it `<your-username>.github.io` so GitHub Pages deploys at your root domain — no `baseurl` needed.

**Via GitHub CLI:**

```bash
gh repo fork bamr87/zer0-mistakes --clone
cd zer0-mistakes
```

![gh repo fork dialog](/assets/images/quickstart/github-setup-fork.png)

**Or via the GitHub web UI:**

1. Go to [github.com/bamr87/zer0-mistakes](https://github.com/bamr87/zer0-mistakes)
2. Click **Fork** → set name to `<your-username>.github.io`
3. Click **Create fork**, then clone:

```bash
git clone https://github.com/<your-username>/<your-username>.github.io.git
cd <your-username>.github.io
```

![GitHub Code → Clone dialog](/assets/images/quickstart/github-repo-clone.png)

![GitHub fork dialog](/assets/images/quickstart/github-fork-dialog.png)

> See [docs/FORKING.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/FORKING.md) for the full fork → configure → personalize workflow.

## Step 3 — Run the Fork Cleanup Script

The interactive wizard strips out theme-specific content and configures the repo for your site:

```bash
./scripts/fork-cleanup.sh
```

It will prompt you for your site title, URL, author name, and other basic settings and write them into `_config.yml`.

![fork-cleanup.sh running interactively](/assets/images/quickstart/github-setup-fork-cleanup.png)

## Step 4 — Start the Dev Server

```bash
docker-compose up
```

Visit [http://localhost:4000](http://localhost:4000) to confirm your personalized site is running.

## Step 5 — Enable GitHub Pages

In your forked repo on GitHub.com:

1. **Settings** → **Pages**
2. **Source**: Deploy from branch
3. **Branch**: `main` → `/` (root)
4. Click **Save**

![GitHub Pages settings](/assets/images/quickstart/github-pages-settings.png)

After the first push, GitHub Actions builds the site and it appears at:

```
https://<your-username>.github.io
```

## Step 6 — Push Your Changes

```bash
git add -A
git commit -m "feat: initial site personalization"
git push origin main
```

![git push output](/assets/images/quickstart/github-setup-push.png)

Watch the deployment: **Actions** tab → **pages build and deployment** workflow.

## Git Workflow for Ongoing Development

```bash
# New feature branch
git checkout -b feat/my-feature

# Make changes, then commit
git add -A
git commit -m "feat(posts): add first blog post"

# Push and open PR
git push origin feat/my-feature
gh pr create --fill
```

Merge to `main` to trigger a Pages deployment.

## Troubleshooting

**Forking into a different repo name (not `username.github.io`)**

Add `baseurl` to `_config.yml`:

```yaml
baseurl: "/repo-name"
url: "https://username.github.io"
```

**Pages build failing**

```bash
# Check the Actions tab in GitHub for build logs
# Common fix: ensure _config.yml has no YAML syntax errors
bundle exec jekyll build --config '_config.yml,_config_dev.yml' --trace
```

**`gh auth login` fails**

Ensure port 443 (HTTPS) is open. Try `--web` flag or create a [Personal Access Token](https://github.com/settings/tokens) and use `gh auth login --with-token`.

**Remote origin mismatch**

```bash
git remote -v                                       # verify remotes
git remote set-url origin https://github.com/<you>/<repo>.git
```

---

<div class="d-flex justify-content-between mt-5">
  <a href="/quickstart/jekyll-setup/" class="btn btn-outline-secondary">
    <i class="bi bi-arrow-left"></i> Back: Jekyll Setup
  </a>
  <a href="/quickstart/personalization/" class="btn btn-primary">
    Next: Personalization <i class="bi bi-arrow-right"></i>
  </a>
</div>
