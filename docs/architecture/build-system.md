# Build System

Documentation of the Jekyll build process, Docker configuration, and deployment pipeline.

## Overview

The Zer0-Mistakes theme uses:

- **Jekyll** — Static site generator
- **Docker** — Development environment
- **GitHub Actions** — CI/CD pipeline
- **RubyGems** — Theme distribution

## Local Development

### Docker (Recommended)

```bash
# Start development server
docker-compose up

# Rebuild after Gemfile changes
docker-compose up --build

# Run Jekyll commands
docker-compose exec jekyll jekyll build --verbose

# Access container shell
docker-compose exec jekyll bash
```

### Native Ruby

```bash
# Install dependencies
bundle install

# Start development server
bundle exec jekyll serve --config "_config.yml,_config_dev.yml"

# Build for production
bundle exec jekyll build
```

## Docker Configuration

### `docker-compose.yml`

```yaml
version: '3.8'
services:
  jekyll:
    image: jekyll/jekyll:4.2.2
    platform: linux/amd64
    volumes:
      - .:/srv/jekyll
      - bundle:/usr/local/bundle
    ports:
      - "4000:4000"
    command: >
      jekyll serve --config "_config.yml,_config_dev.yml"
      --host 0.0.0.0 --livereload --drafts --incremental

volumes:
  bundle:
```

### `docker/Dockerfile`

Custom Docker image with additional dependencies.

## Build Process

### Jekyll Build Steps

1. **Read configuration** — `_config.yml` (and overrides)
2. **Load plugins** — From `_plugins/` and Gemfile
3. **Process content** — Markdown to HTML conversion
4. **Apply layouts** — Wrap content in templates
5. **Process includes** — Resolve include tags
6. **Generate output** — Write to `_site/`

### Build Modes

| Mode | Command | Use Case |
|------|---------|----------|
| Development | `jekyll serve` | Local development with live reload |
| Production | `jekyll build` | Deployment build |
| Incremental | `--incremental` | Faster rebuilds (dev only) |
| Verbose | `--verbose` | Debug build issues |

## Configuration

### `_config.yml` (Production)

Full configuration for deployed site:

```yaml
url: "https://yourdomain.com"
baseurl: ""

# Remote theme for GitHub Pages
remote_theme: "bamr87/zer0-mistakes"

# Production settings
posthog:
  enabled: true
```

### `_config_dev.yml` (Development)

Overrides for local development:

```yaml
url: "http://localhost:4000"
baseurl: ""

# Disable remote theme locally
remote_theme: false

# Development settings
posthog:
  enabled: false
show_drafts: true
```

### Multiple Configs

Jekyll merges multiple config files:

```bash
jekyll serve --config "_config.yml,_config_dev.yml"
```

Later files override earlier ones.

## Gem Building

### Build Commands

```bash
# Build gem
./scripts/build

# Build with dry-run
./scripts/build --dry-run
```

### Gem Specification

`jekyll-theme-zer0.gemspec` defines:

- Version number
- Dependencies
- Included files
- Author/license info

### Version Management

Version is defined in `lib/jekyll-theme-zer0/version.rb`:

```ruby
module JekyllThemeZer0
  VERSION = "0.18.1"
end
```

## Release Process

See [Release Automation](../systems/release-automation.md) for full details.

### Quick Release

```bash
# Preview release
./scripts/release patch --dry-run

# Execute release
./scripts/release patch
```

### Release Types

| Type | Version Change | Example |
|------|----------------|---------|
| `patch` | x.x.X | 0.18.0 → 0.18.1 |
| `minor` | x.X.0 | 0.18.0 → 0.19.0 |
| `major` | X.0.0 | 0.18.0 → 1.0.0 |

## CI/CD Pipeline

### GitHub Actions

Located in `.github/workflows/`:

- **Build test** — Test Jekyll build on PRs
- **Deploy** — Deploy to GitHub Pages
- **Release** — Publish gem to RubyGems

### Build Validation

```bash
# Check configuration
bundle exec jekyll doctor

# Build with trace
bundle exec jekyll build --trace

# HTML validation
bundle exec htmlproofer _site
```

## Performance Optimization

### Build Speed

1. **Incremental builds** — Use `--incremental` in development
2. **Exclude files** — Add non-content files to `exclude:`
3. **Limit collections** — Only output needed collections
4. **Cache dependencies** — Use Docker volumes for gems

### Output Optimization

1. **Minify HTML** — Use `jekyll-compress-html`
2. **Optimize images** — Pre-compress before adding
3. **Lazy loading** — Load scripts conditionally

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Build timeout | Check for infinite loops in Liquid |
| Missing layout | Verify layout name matches file |
| Broken links | Run HTML proofer |
| Style not updating | Clear `_site/` and rebuild |

### Debug Commands

```bash
# Verbose build
bundle exec jekyll build --verbose --trace

# Check configuration
bundle exec jekyll doctor

# View effective config
bundle exec jekyll build --config _config.yml --verbose 2>&1 | head -50
```

## Related

- [Project Structure](project-structure.md)
- [Release Automation](../systems/release-automation.md)
