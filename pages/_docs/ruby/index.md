---
title: Ruby
description: Ruby versioning and Bundler tips for Zer0-Mistakes.
layout: default
categories:
    - docs
    - ruby
tags:
    - ruby
    - bundler
permalink: /docs/ruby/
difficulty: beginner
estimated_time: 5 minutes
prerequisites: []
updated: 2025-12-20
lastmod: 2025-12-20T22:15:46.090Z
sidebar:
    nav: docs
---

# Ruby & Bundler

Jekyll is built with Ruby. Understanding the basics helps with troubleshooting and customization.

## Quick Reference

### Check Versions

```bash
# Ruby version
ruby --version

# Bundler version
bundle --version

# Jekyll version
bundle exec jekyll --version
```

### Common Commands

```bash
# Install dependencies from Gemfile
bundle install

# Update all gems
bundle update

# Update specific gem
bundle update jekyll

# Run Jekyll through Bundler
bundle exec jekyll serve
```

## Key Files

| File | Purpose |
|------|---------|  
| `Gemfile` | Lists Ruby gem dependencies |
| `Gemfile.lock` | Locks exact versions |
| `jekyll-theme-zer0.gemspec` | Theme gem specification |

## With Docker

When using Docker, Ruby commands run inside the container:

```bash
# Check Ruby version in container
docker-compose exec jekyll ruby --version

# Update gems in container
docker-compose exec jekyll bundle update
```

## Troubleshooting

### Gem Installation Errors

```bash
# Clear bundle cache
bundle clean --force

# Reinstall everything
rm -rf vendor/bundle
bundle install
```

### Version Conflicts

```bash
# Check for outdated gems
bundle outdated

# Update Gemfile.lock
bundle update
```

## Learn More

- [Ruby 101](/docs/ruby-101/) - Detailed Ruby basics
- [Official Ruby Documentation](https://www.ruby-lang.org/en/documentation/)
- [Bundler Documentation](https://bundler.io/docs.html)

## Related

- [Installation Guide](/docs/installation/)
- [Jekyll Guide](/docs/jekyll/)
- [Docker Development](/docs/docker/)
