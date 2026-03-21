# Templates Directory

This directory contains the template engine files that power the theme's installation, fork setup, and cleanup workflows. Templates use `{{VAR_NAME}}` placeholder syntax, which is rendered by the template library at [scripts/lib/template.sh](../scripts/lib/template.sh).

## Directory Structure

### `config/`

Central configuration and build-tool templates:

- `install.conf` - Shared configuration variables sourced by all scripts (theme identity, GitHub URLs, gem versions, install modes, template variable definitions)
- `_config.fork.yml.template` - Jekyll `_config.yml` for users who fork the repository
- `Gemfile.full.template` - Full Gemfile with GitHub Pages gem and all plugins
- `Gemfile.minimal.template` - Minimal Gemfile for lightweight remote theme usage

### `pages/`

Starter page templates created during installation or fork cleanup:

- `index.md.template` - Site homepage
- `about.md.template` - About page
- `blog.md.template` - Blog listing page
- `quickstart.md.template` - Getting started guide
- `docs-index.md.template` - Documentation index
- `configuration.md.template` - Configuration reference page
- `troubleshooting.md.template` - Troubleshooting guide
- `welcome-post.md.template` - First blog post for new sites

### `data/`

Data file scaffolding for `_data/`:

- `authors.yml.template` - Author profiles configuration
- `navigation-main.yml.template` - Main navigation menu structure

### `cleanup/`

Fork cleanup definitions used when removing example content:

- `remove-paths.txt` - List of paths to delete when creating a clean fork (example posts, notebooks, preview images, etc.)
- `reset-fields.yml` - YAML fields to reset in config files during fork cleanup

## Template Variable Syntax

Templates use `{{VAR_NAME}}` placeholders that are replaced at render time. Available variables are defined in `config/install.conf` and include:

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `{{THEME_NAME}}` | `zer0-mistakes` | Theme directory/repo name |
| `{{THEME_GEM_NAME}}` | `jekyll-theme-zer0` | RubyGems package name |
| `{{THEME_DISPLAY_NAME}}` | `Zer0-Mistakes Jekyll Theme` | Human-readable theme name |
| `{{GITHUB_USER}}` | `bamr87` | GitHub username |
| `{{GITHUB_REPO}}` | `bamr87/zer0-mistakes` | Full repository path |
| `{{GITHUB_URL}}` | `https://github.com/bamr87/zer0-mistakes` | Repository URL |
| `{{SITE_TITLE}}` | *(user-provided)* | Site title for fork config |
| `{{SITE_AUTHOR}}` | *(user-provided)* | Site author name |
| `{{CURRENT_DATE}}` | `2026-03-12` | Date at render time |

See `config/install.conf` for the full list of variables and their defaults.

## Usage Scenarios

### Fresh Install (`install.sh`)

The main installation script renders templates into the target directory to scaffold a new site:

```bash
# Picks Gemfile.minimal.template or Gemfile.full.template based on mode
create_from_template "config/Gemfile.full.template" "$TARGET_DIR/Gemfile"

# Creates starter pages
create_from_template "pages/index.md.template" "$TARGET_DIR/index.md"
```

For remote pipe installs (`curl | bash`), templates may not be available locally. The script falls back to fetching templates from GitHub or using embedded fallback content.

### Fork Cleanup (`scripts/fork-cleanup.sh`)

When someone forks the repo, this script creates a clean starting point:

1. Removes example content listed in `cleanup/remove-paths.txt`
2. Resets site-specific config fields per `cleanup/reset-fields.yml`
3. Generates fresh starter content from `pages/` and `data/` templates

### Template Rendering (`scripts/lib/template.sh`)

The template library provides the rendering engine:

```bash
# Load config and render a template to a file
source scripts/lib/template.sh
render_template "templates/pages/about.md.template" "pages/_about/index.md"

# Render with custom variables
set_template_var "SITE_TITLE" "My Site"
render_template "templates/config/_config.fork.yml.template" "_config.yml"
```

## Build Exclusion

Templates are excluded from the Jekyll build output in both configurations:

- `_config.yml`: `exclude: [templates/]`
- `_config_dev.yml`: `exclude: ["templates/"]`
