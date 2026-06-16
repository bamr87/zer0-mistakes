---
lastmod: 2026-06-15T00:00:00.000Z
title: GitHub Copilot Integration
description: Comprehensive AI development assistance with structured instructions for maximum productivity with the Zer0-Mistakes theme.
preview: /images/previews/github-copilot-integration.png
layout: default
categories:
    - docs
    - features
tags:
    - copilot
    - ai
    - development
    - github
permalink: /docs/features/copilot-integration/
difficulty: beginner
estimated_reading_time: 10 minutes
sidebar:
    nav: docs
---

# GitHub Copilot Integration

The Zer0-Mistakes theme includes comprehensive GitHub Copilot instructions to enhance AI-assisted development.

## Overview

The theme provides structured instruction files that help GitHub Copilot understand:

- Project structure and conventions
- File-specific development patterns
- Testing and quality requirements
- Release management workflows

## Instruction Files

### Main Instructions

Location: `.github/copilot-instructions.md`

This file provides:

- Project overview and structure
- Essential commands and tooling
- Development workflows
- Code quality standards

### File-Specific Instructions

Located in `.github/instructions/`. Each file declares an `applyTo:` glob in
its front matter; this is a representative subset (run
`ls .github/instructions/` for the full list):

| File | Applies To (`applyTo:`) | Purpose |
|------|------------|---------|
| `layouts.instructions.md` | `_layouts/**` | Layout development |
| `includes.instructions.md` | `_includes/**` | Component patterns |
| `scripts.instructions.md` | `scripts/**` | Shell scripting |
| `testing.instructions.md` | `test/**` | Test development |
| `version-control.instructions.md` | `CHANGELOG.md`, `**/version.*`, `**/*.gemspec`, … | Version management |
| `documentation.instructions.md` | `docs/**`, `pages/_docs/**` | Documentation style |
| `sass.instructions.md` | `_sass/**` | SCSS conventions |
| `obsidian.instructions.md` | Obsidian vault content | Wiki-links and callouts |

> [!NOTE]
> The `.github/instructions/` directory ships several more file-scoped rule sets
> (for example `ai-chat`, `backlog`, `content-review`, `features`, `install`).
> The repo also carries a cross-tool entry point at `AGENTS.md` and reusable
> multi-step workflows under `.github/prompts/` (mirrored as Cursor commands in
> `.cursor/commands/`).

## How It Works

### Instruction Loading

When you open a file, Copilot automatically loads relevant instructions based on the `applyTo` front matter:

```yaml
---
applyTo: "_layouts/**"
description: "Jekyll layout development guidelines for Zer0-Mistakes theme"
date: 2026-05-18T12:00:00.000Z
lastmod: 2026-05-18T12:00:00.000Z
---
```

### Context-Aware Suggestions

Copilot uses the instructions to provide:

- Project-specific code patterns
- Consistent naming conventions
- Proper error handling
- Test coverage requirements

## Using Copilot Effectively

### Opening Files

When working on layouts:

```text
1. Open _layouts/default.html
2. Copilot loads layouts.instructions.md
3. Suggestions follow theme patterns
```

### Writing Code

Copilot understands theme conventions:

```liquid
{% raw %}{% comment %}
Copilot suggests proper include patterns:
{% include navigation/sidebar-left.html %}

With correct parameters:
{% include components/post-card.html post=post %}
{% endcomment %}{% endraw %}
```

### Running Commands

Copilot suggests correct commands:

```bash
# Development
docker-compose up

# Testing
./test/test_runner.sh

# Release (canonical entry point; --dry-run previews)
./scripts/bin/release patch
```

## Best Practices

### Keep Instructions Updated

When adding new patterns:

1. Update relevant instruction file
2. Add code examples
3. Document conventions

### Use Comments

Help Copilot understand intent:

```ruby
# Generate preview image for post
# Uses DALL-E API if configured
def generate_preview(post)
  # Copilot knows the pattern from instructions
end
```

### Review Suggestions

Always verify Copilot suggestions:

- Check for theme consistency
- Verify Bootstrap class usage
- Ensure accessibility compliance

## How to verify

Confirm the instruction files are present and that each declares an `applyTo`
glob. From the repository root:

```bash
# Main instructions exist
ls .github/copilot-instructions.md AGENTS.md

# List every file-scoped rule set
ls .github/instructions/

# Confirm each instruction file declares an applyTo glob
grep -m1 "applyTo:" .github/instructions/layouts.instructions.md
```

Expected output for the last command:

```text
applyTo: "_layouts/**"
```

Open `_layouts/default.html` in an editor with GitHub Copilot enabled — the
matching `layouts.instructions.md` glob (`_layouts/**`) loads automatically, and
suggestions follow the theme's include and layout patterns.

## Configuration

### Enabling Copilot

1. Install GitHub Copilot extension
2. Sign in with GitHub account
3. Open the project in VS Code/Cursor

### Copilot Settings

Recommended settings:

```json
{
  "github.copilot.enable": {
    "*": true,
    "yaml": true,
    "markdown": true,
    "liquid": true
  }
}
```

## Troubleshooting

### Instructions Not Loading

1. Check file path matches `applyTo` pattern
2. Ensure instruction file exists
3. Restart editor

### Poor Suggestions

1. Add more context in comments
2. Update instruction files
3. Provide example code

### Copilot Not Available

1. Check subscription status
2. Verify network connection
3. Re-authenticate with GitHub

## Related

- [Development Documentation](/docs/development/documentation/)
- [Contributing Guide](https://github.com/bamr87/zer0-mistakes/blob/main/CONTRIBUTING.md)
- [Scripts Guide](/docs/development/scripts/)

## See also

- [[Features]]
- [[Development]]
