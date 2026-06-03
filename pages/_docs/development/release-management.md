---
lastmod: 2026-05-31T00:00:00.000Z
title: Release Management
description: Overview of the release process for the Zer0-Mistakes theme. See docs/ for the full release automation reference.
preview: /images/previews/release-management.png
layout: default
categories:
    - docs
    - development
tags:
    - release
    - versioning
    - changelog
    - rubygems
permalink: /docs/development/release-management/
difficulty: advanced
estimated_reading_time: 5 minutes
sidebar:
    nav: docs
---

# Release Management

Releases follow [Conventional Commits](https://www.conventionalcommits.org/) and [Semantic Versioning](https://semver.org/). The release process is fully automated via `scripts/bin/release`:

```bash
./scripts/bin/release patch           # e.g. 1.9.8 → 1.9.9
./scripts/bin/release minor           # e.g. 1.9.8 → 1.10.0
./scripts/bin/release patch --dry-run # preview without changes
```

The command handles version bumping, CHANGELOG generation, gem build, RubyGems publication, and GitHub release creation in one step.

## Full Reference

The complete release automation guide — 10-step workflow, flags, troubleshooting, library architecture — is in the contributor docs:

**[Release Automation → docs/systems/release-automation.md](../../../docs/systems/release-automation.md)**

See also: [Automated Version System → docs/systems/automated-version-system.md](../../../docs/systems/automated-version-system.md)
