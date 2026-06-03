---
lastmod: 2026-04-18T19:29:54.000Z
title: Dependency Updates
description: Guide to automated dependency management and Ruby gem updates for the Zer0-Mistakes theme.
preview: /images/previews/dependency-updates.png
layout: default
categories:
    - docs
    - development
tags:
    - dependencies
    - gems
    - automation
    - security
permalink: /docs/development/dependency-updates/
difficulty: beginner
estimated_reading_time: 10 minutes
prerequisites:
    - GitHub repository access
sidebar:
    nav: docs
---

# Dependency Updates

The theme uses a Zero-Pin strategy: `Gemfile` specifies no pinned versions; `Gemfile.lock` is committed to ensure reproducible builds. Dependencies are updated weekly via `bundle update` and a small automated PR workflow.

## Quick Reference

```bash
# Update all gems
bundle update

# Check for security advisories
bundle exec bundle-audit check --update

# Verify site still builds
bundle exec jekyll build
```

## Full Reference

The complete dependency management guide — Zero-Pin strategy rationale, Dependabot configuration, update policy, lockfile management:

**[Dependency Management → docs/systems/dependency-management.md](../../../docs/systems/dependency-management.md)**
