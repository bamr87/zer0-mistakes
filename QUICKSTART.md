# QUICKSTART — zer0-mistakes

This guide is the starting point for installing, running, and personalizing **zer0-mistakes**.

Published (site) version of this guide:
- `/quickstart/` (source: `pages/_quickstart/index.md`)

If you’re **building a new site**, use the **AI Install Wizard** (recommended). If you’re **developing the theme itself**, fork/clone this repo and run it with Docker.

---

## Choose Your Path

| Path | Method | Best For |
|------|--------|----------|
| **A** | AI Install Wizard | Creating a new site (recommended) |
| **B** | GitHub Template Repo | One-click copy of the entire repo |
| **C** | GitHub Codespaces | Zero-install cloud development |
| **D** | Fork/Clone | Theme development & customization |
| **E** | Remote Theme | GitHub Pages without copying files |
| **F** | Ruby Gem | Traditional Jekyll workflow |

---

## Path A — AI Install Wizard (recommended)

### Prerequisites
- Docker Desktop
- Git (optional, but recommended)

### 1) Full install (default)
Create a new folder and run the installer:

```bash
mkdir my-site
cd my-site
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash -s -- --full
```

Notes:
- `--full` is the default; it installs the full theme structure, Docker config, and development overrides.
- The installer runs in “remote mode” when it’s executed via `curl` and downloads the theme files automatically.
- The installer creates a project-local `INSTALLATION.md` inside the generated site folder.

### 2) Start the dev server (Docker)
From inside your generated site folder:

```bash
docker-compose up
```

Then open:
- `http://localhost:4000`

### 3) Minimal install (optional)
If you want a barebones starting point:

```bash
mkdir my-site-min
cd my-site-min
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash -s -- --minimal
```

You can upgrade a minimal install to full later:

```bash
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash -s -- --full
```

### 4) (Optional) Run the self-healing setup
If you are working inside this theme repo (or you copied it into your site), you can run `init_setup.sh`:

```bash
./init_setup.sh
```

---

## First Personalization Checklist (do this early)

---

## Path B — GitHub Template Repository

One-click to create your own copy of the entire repo.

### Option 1: GitHub UI

1. Go to [github.com/bamr87/zer0-mistakes](https://github.com/bamr87/zer0-mistakes)
2. Click **"Use this template"** → **"Create a new repository"**
3. Clone your new repo and start developing

### Option 2: GitHub CLI

```bash
gh repo create my-site --template bamr87/zer0-mistakes --clone
cd my-site
docker-compose up
```

> **Note:** You must enable "Template repository" in repo Settings → General for this to work.

---

## Path C — GitHub Codespaces (zero-install)

Develop entirely in the cloud — no local Docker or Ruby required.

### Option 1: One-click

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/bamr87/zer0-mistakes)

### Option 2: From the repo

1. Go to [github.com/bamr87/zer0-mistakes](https://github.com/bamr87/zer0-mistakes)
2. Click **Code** → **Codespaces** → **Create codespace on main**
3. Wait for the environment to build (~2 min)
4. Site auto-starts at port 4000

### Option 3: VS Code

1. Install the [GitHub Codespaces extension](https://marketplace.visualstudio.com/items?itemName=GitHub.codespaces)
2. Open Command Palette → **Codespaces: Create New Codespace**
3. Select `bamr87/zer0-mistakes`

---

## First Personalization Checklist (do this early)

Most customization starts in `_config.yml` (production) and `_config_dev.yml` (development overrides).

### 1) Update your site identity (`_config.yml`)
Common fields to change:
- `title`, `subtitle`, `description`
- `url` and `baseurl`
- `author.*` / `name` / `email`
- `logo` / `teaser` / `og_image`

Important:
- `_config.yml` changes are **not hot-reloaded** by Jekyll; restart your dev server after edits.

### 2) Disable or replace analytics (`_config.yml`)
This repo ships with analytics settings (Google Analytics + PostHog). For your own site:
- set `google_analytics: null` (or your own ID)
- for PostHog, either set `posthog.enabled: false` or replace `posthog.api_key` + `posthog.api_host`

In development, analytics are already disabled in `_config_dev.yml`.

### 3) Customize navigation
Navigation data lives under:
- `_data/navigation/`

If you want to change menus/sidebars, start there, then check:
- `_includes/navigation/`

### 4) Add/replace content
Typical content locations:
- `index.html` / `index.md` (homepage)
- `pages/` (site pages)
- `pages/_posts/` (blog posts, if you use posts)
- `pages/_docs/` (published end-user documentation)
- `docs/` (technical/maintainer documentation)

---

## Path D — Fork/Clone (theme development)

### Prerequisites
- Docker Desktop

### 1) Clone (or fork) the repo

```bash
git clone https://github.com/bamr87/zer0-mistakes.git
cd zer0-mistakes
```

### 2) Start development (Docker)

```bash
docker-compose up
```

This uses both configs:
- `_config.yml,_config_dev.yml`

### 3) Useful Docker commands

```bash
# Rebuild when dependencies change
docker-compose up --build

# Open a shell in the container
docker-compose exec jekyll bash

# Stop containers
docker-compose stop

# Remove containers + network
docker-compose down
```

---

## Path E — GitHub Pages Remote Theme

Use this if you want your own repo to reference the theme without copying files.

In your site repo’s `_config.yml`:

```yaml
remote_theme: "bamr87/zer0-mistakes"
plugins:
  - jekyll-remote-theme
```

Notes:
- GitHub Pages has a plugin whitelist; keep custom plugins to a minimum.
- Local development via Docker is usually simpler than trying to match GitHub Pages Ruby/Jekyll versions by hand.

---

## Path F — Ruby Gem Theme

Use this if you prefer installing the theme as a gem.

In your `Gemfile`:

```ruby
gem "jekyll-theme-zer0"
```

In your `_config.yml`:

```yaml
theme: "jekyll-theme-zer0"
```

Then:

```bash
bundle install
bundle exec jekyll serve --config "_config.yml,_config_dev.yml"
```

---

## Optional Features

### Jupyter Notebooks
- Put notebooks in `pages/_notebooks/`
- Convert:

```bash
make convert-notebooks
```

Docs:
- `docs/JUPYTER_NOTEBOOKS.md`

### AI Preview Image Generation
The theme includes preview-image generation settings under `preview_images:` in `_config.yml`.

To list missing previews:

```bash
./scripts/generate-preview-images.sh --list-missing
```

To generate previews you’ll typically need an API key available in your environment (the repo scripts reference `OPENAI_API_KEY`).

---

## Testing & Validation

### Run the consolidated test runner

```bash
./test/test_runner.sh
```

Examples:

```bash
./test/test_runner.sh --suites core,deployment --verbose
./test/test_runner.sh --suites quality --skip-docker
```

### Handy Make targets

```bash
make test
make test-verbose
make lint
```

---

## Troubleshooting

### Port already in use
If `4000` is taken, change the host port mapping in `docker-compose.yml`:

```yaml
ports:
  - "4001:4000"
```

### Apple Silicon (M-series Macs)
This repo’s Docker config uses `platform: linux/amd64` for compatibility. If Docker warns, it’s usually safe to proceed.

### Theme not found / remote theme issues
For local Docker development, `_config_dev.yml` disables `remote_theme` to avoid requiring GitHub theme fetches.

### Config changes don’t show up
- `_config.yml` changes require restarting the Jekyll server.
- Try:

```bash
docker-compose down
docker-compose up
```

---

## Where to Go Next

- Start with `README.md` for architecture and feature overview.
- Use `/pages/_docs/` for user-facing docs you’ll publish.
- Use `/docs/` for technical notes as you customize the theme.
