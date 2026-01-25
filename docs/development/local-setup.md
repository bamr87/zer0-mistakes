# Local Development Setup

Set up your development environment for contributing to the Zer0-Mistakes theme.

## Prerequisites

### Required

- **Docker Desktop** — [Download](https://www.docker.com/products/docker-desktop)
- **Git** — [Download](https://git-scm.com/downloads)

### Optional

- **Ruby 3.0+** — For native development without Docker
- **Node.js** — For asset compilation (if modifying JS)
- **VS Code** — Recommended editor with Jekyll extensions

## Setup Methods

### Method 1: Docker (Recommended)

Docker provides a consistent environment without installing Ruby locally.

```bash
# Clone the repository
git clone https://github.com/bamr87/zer0-mistakes.git
cd zer0-mistakes

# Start development server
docker-compose up

# Site available at http://localhost:4000
```

**Benefits:**
- No Ruby installation required
- Consistent environment across machines
- Matches production build environment

### Method 2: Native Ruby

For faster rebuilds and direct access to Jekyll.

```bash
# macOS: Install Ruby
brew install ruby

# Ubuntu: Install Ruby
sudo apt-get install ruby-full build-essential

# Install dependencies
bundle install

# Start development server
bundle exec jekyll serve --config "_config.yml,_config_dev.yml"
```

## Docker Commands

```bash
# Start server
docker-compose up

# Start in background
docker-compose up -d

# Rebuild after Gemfile changes
docker-compose up --build

# Stop server
docker-compose down

# View logs
docker-compose logs -f jekyll

# Access container shell
docker-compose exec jekyll bash

# Run Jekyll commands
docker-compose exec jekyll jekyll build --verbose
```

## Development Configuration

The development config (`_config_dev.yml`) overrides production settings:

```yaml
# Local URL
url: "http://localhost:4000"
baseurl: ""

# Disable production features
remote_theme: false
posthog:
  enabled: false

# Enable development features
show_drafts: true
future: true
```

## VS Code Setup

### Recommended Extensions

- **Jekyll Snippets** — Jekyll code snippets
- **Liquid** — Liquid syntax highlighting
- **SCSS IntelliSense** — SCSS autocomplete
- **Docker** — Docker integration
- **EditorConfig** — Consistent formatting

### Tasks

Press `Cmd+Shift+P` → "Tasks: Run Task":

- **Jekyll: Serve** — Start development server
- **Jekyll: Build** — Build site
- **Docker: Up** — Start Docker containers

## File Watching

Jekyll watches for changes automatically. However:

- `_config.yml` changes require server restart
- Some changes need a full rebuild

```bash
# Force clean rebuild
docker-compose exec jekyll jekyll clean
docker-compose down
docker-compose up
```

## Port Configuration

Default port is 4000. If in use:

```yaml
# docker-compose.yml
ports:
  - "4001:4000"  # Use port 4001 instead
```

Or with native Jekyll:

```bash
bundle exec jekyll serve --port 4001
```

## Troubleshooting

### Docker Issues

```bash
# Reset Docker
docker-compose down -v
docker-compose up --build

# Check logs
docker-compose logs jekyll
```

### Ruby Issues

```bash
# Clear bundler cache
bundle clean --force
bundle install

# Reset gems
rm -rf vendor/bundle
bundle install
```

### Build Issues

```bash
# Check configuration
bundle exec jekyll doctor

# Verbose build
bundle exec jekyll build --verbose --trace

# Clean build
bundle exec jekyll clean
bundle exec jekyll build
```

## Next Steps

- [Testing](testing.md) — Validate your changes
- [Code Style](code-style.md) — Follow coding conventions
- [Architecture](../architecture/README.md) — Understand the codebase
