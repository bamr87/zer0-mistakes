---
title: Troubleshooting
description: Common setup and build issues when running Zer0-Mistakes.
layout: default
categories:
    - docs
    - troubleshooting
tags:
    - troubleshooting
    - jekyll
    - docker
permalink: /docs/troubleshooting/
difficulty: beginner
estimated_time: 10 minutes
prerequisites: []
updated: 2025-12-20
lastmod: 2025-12-20T22:15:46.061Z
sidebar:
    nav: docs
---

# Troubleshooting

Solutions to common issues when developing with Zer0-Mistakes.

## Docker Issues

### Container Won't Start

**Symptoms:** `docker-compose up` fails or container immediately exits.

**Solutions:**

```bash
# 1. Clean rebuild
docker-compose down -v
docker-compose up --build

# 2. Check Docker is running
docker info

# 3. View detailed logs
docker-compose logs -f jekyll
```

### Port 4000 Already in Use

**Symptoms:** Error about port binding or address already in use.

**Solutions:**

```bash
# Find what's using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or use a different port
docker-compose run -p 4001:4000 jekyll
```

### Slow Performance on macOS

**Symptoms:** File changes take a long time to reflect.

**Solutions:**
- Enable "Use Rosetta for x86/amd64 emulation" in Docker Desktop settings
- Use `docker-compose.yml` which includes performance optimizations

## Jekyll Build Issues

### Liquid Syntax Errors

**Symptoms:** Build fails with Liquid template errors.

**Solutions:**

```bash
# Get detailed error output
docker-compose exec jekyll jekyll build --trace

# Check specific file syntax
docker-compose exec jekyll jekyll doctor
```

### Missing Dependencies

**Symptoms:** `Bundler::GemNotFound` or similar errors.

**Solutions:**

```bash
# Update bundle
docker-compose exec jekyll bundle install
docker-compose exec jekyll bundle update

# Clean rebuild
docker-compose down -v && docker-compose up --build
```

### Configuration Problems

**Symptoms:** Site doesn't load or pages are missing.

**Solutions:**

```bash
# Validate configuration
docker-compose exec jekyll jekyll doctor

# Check for YAML syntax errors
# Install yamllint locally or check online validators
```

## Common Front Matter Issues

### Page Not Appearing

Check these front matter requirements:

```yaml
---
layout: default          # Required
title: "Page Title"      # Required
permalink: /your-url/    # Recommended
---
```

### Wrong Layout

Ensure the layout exists in `_layouts/`:

```yaml
---
layout: journals    # Must match a file in _layouts/
---
```

## Performance Issues

### Slow Build Times

```bash
# Use incremental builds
docker-compose exec jekyll jekyll serve --incremental

# Exclude unnecessary files in _config.yml
exclude:
  - node_modules/
  - vendor/
  - .git/
```

### Live Reload Not Working

Ensure you're using the development config:

```bash
docker-compose exec jekyll jekyll serve --config "_config.yml,_config_dev.yml"
```

## Getting More Help

1. **Check logs:** `docker-compose logs -f jekyll`
2. **Jekyll doctor:** `docker-compose exec jekyll jekyll doctor`
3. **Verbose build:** `docker-compose exec jekyll jekyll build --verbose --trace`
4. **[GitHub Issues](https://github.com/bamr87/zer0-mistakes/issues):** Search or create an issue

## Related

- [Installation Guide](/docs/installation/)
- [Docker Guide](/docs/docker/)
- [Jekyll Configuration](/docs/jekyll/jekyll-config/)
