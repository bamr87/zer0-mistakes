---
lastmod: 2026-06-16T00:00:00.000Z
title: Version Bump Workflow
description: How semantic versioning and version bumping work in zer0-mistakes. Full reference in docs/systems/.
preview: /images/previews/version-bump-workflow.png
layout: default
categories:
    - docs
    - development
tags:
    - version
    - automation
    - github-actions
permalink: /docs/development/version-bump/
difficulty: intermediate
estimated_reading_time: 10 minutes
prerequisites:
    - GitHub repository access
    - Understanding of semantic versioning
sidebar:
    nav: docs
---

# Version Bump Workflow

The theme uses [Conventional Commits](https://www.conventionalcommits.org/) to determine version increments automatically:

| Commit prefix | Version bump |
|---------------|-------------|
| `fix:` | Patch (1.0.0 → 1.0.1) |
| `feat:` | Minor (1.0.0 → 1.1.0) |
| `feat!:` or `BREAKING CHANGE:` | Major (1.0.0 → 2.0.0) |

Version is stored in `lib/jekyll-theme-zer0/version.rb` and `package.json`. The `scripts/bin/release` command reads commit history, calculates the correct bump, and updates both files.

## Full Reference

The complete automated version system docs — conventional commit analysis, calculation algorithm, GitHub Actions integration — are in the contributor docs:

**[Automated Version System → docs/systems/automated-version-system.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/systems/automated-version-system.md)**

See also: [Release Management](release-management/) for the end-to-end release workflow.
