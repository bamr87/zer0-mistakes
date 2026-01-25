---
title: Documentation
description: Guide to the dual documentation architecture with technical docs, public docs, and AI instructions.
layout: default
categories:
    - docs
    - development
tags:
    - documentation
    - mdx
    - markdown
    - architecture
permalink: /docs/development/documentation/
difficulty: intermediate
estimated_time: 15 minutes
sidebar:
    nav: docs
---

# Documentation Architecture

The Zer0-Mistakes theme implements a dual documentation system designed to serve different audiences with appropriate content formats.

## Overview

```
Documentation Architecture
├── /docs/                    # Technical Documentation (MDX)
│   ├── Developer/contributor focused
│   └── Repository implementation details
├── /pages/_docs/             # Public Documentation (Markdown)
│   ├── End-user focused
│   └── General technology guides
└── /.github/instructions/    # AI Guidance
    ├── GitHub Copilot optimization
    └── File-specific instructions
```

## Technical Documentation (`/docs/`)

### Purpose

- **Audience**: Developers, contributors, maintainers
- **Content**: Architecture, build processes, implementation details
- **Format**: MDX (Markdown + JSX) with interactive components

### Directory Structure

| Directory | Content |
|-----------|---------|
| `/docs/systems/` | Infrastructure and automation |
| `/docs/features/` | Component implementation |
| `/docs/releases/` | Release notes and changelogs |
| `/docs/architecture/` | System design documents |

### Front Matter Template

```yaml
---
title: "Descriptive Technical Title"
description: "Technical implementation summary"
type: "system|feature|configuration|release"
audience: "developers|contributors|maintainers"
components: ["file1.rb", "file2.html"]
dependencies: ["Jekyll", "Bootstrap"]
last_updated: "2025-01-25"
complexity: "beginner|intermediate|advanced"
---
```

### MDX Components

- **CodeBlock**: Syntax-highlighted code with file references
- **ArchitectureDiagram**: Mermaid diagrams for system design
- **ComponentDiagram**: Component relationship visualization
- **ConfigurationExample**: Configuration file examples

## Public Documentation (`/pages/_docs/`)

### Purpose

- **Audience**: Theme users, Jekyll beginners
- **Content**: Guides, tutorials, configuration
- **Format**: Standard Markdown for Jekyll rendering

### Directory Structure

| Directory | Content |
|-----------|---------|
| `/pages/_docs/getting-started/` | Quick start guides |
| `/pages/_docs/features/` | Feature documentation |
| `/pages/_docs/customization/` | Theme customization |
| `/pages/_docs/deployment/` | Deployment guides |
| `/pages/_docs/development/` | Developer guides |

### Front Matter Template

```yaml
---
title: Feature Name
description: One-line description for SEO
layout: default
categories: [docs, features]
tags: [relevant, tags]
permalink: /docs/category/feature-name/
difficulty: beginner|intermediate|advanced
estimated_time: X minutes
prerequisites: []
sidebar:
    nav: docs
---
```

### Required Sections

1. **Overview** - What and why
2. **Quick Start** - Minimal steps
3. **Configuration** - Available options
4. **Usage Examples** - Code samples
5. **Troubleshooting** - Common issues
6. **Related** - Links to related docs

## AI Instructions (`/.github/instructions/`)

### Purpose

- **Audience**: GitHub Copilot, AI assistants
- **Content**: File-specific development guidance
- **Format**: Markdown with `applyTo` front matter

### Structure

```yaml
---
applyTo: "path/to/files/**"
description: "Guidance for these files"
---

# Development Guidelines

## Best Practices
...
```

### Available Instructions

| File | Applies To |
|------|------------|
| `documentation.instructions.md` | docs/**, pages/_docs/** |
| `layouts.instructions.md` | _layouts/** |
| `includes.instructions.md` | _includes/** |
| `scripts.instructions.md` | scripts/** |
| `testing.instructions.md` | test/** |
| `version-control.instructions.md` | CHANGELOG.md, *.gemspec |

## Content Workflow

### Creating New Documentation

1. **Identify audience**: Technical or end-user?
2. **Choose location**: `/docs/` or `/pages/_docs/`
3. **Use template**: Copy appropriate front matter
4. **Write content**: Follow section requirements
5. **Add links**: Cross-reference related docs
6. **Test locally**: Verify rendering

### Converting Between Formats

**Technical → Public**:
1. Copy MDX file to `/pages/_docs/`
2. Remove JSX components
3. Simplify technical details
4. Add user-focused examples
5. Update front matter

**Public → Technical**:
1. Copy Markdown to `/docs/`
2. Add MDX components
3. Include implementation details
4. Reference source files
5. Update front matter

## Style Guide

### Writing Style

- Use active voice
- Keep sentences concise
- Define technical terms
- Include code examples
- Add visual aids

### Code Examples

```markdown
# Good: Complete, runnable example
\```yaml
---
title: "My Page"
layout: default
mermaid: true
---
\```

# Bad: Incomplete fragment
\```yaml
mermaid: true
\```
```

### Cross-References

```markdown
## Related

- [Feature Name](/docs/features/name/)
- [Configuration Guide](/docs/customization/)
- [Source Code](https://github.com/bamr87/zer0-mistakes/blob/main/path/to/file)
```

## Maintenance

### Regular Updates

- Review docs with each release
- Update version numbers
- Check for broken links
- Refresh screenshots

### Documentation Testing

```bash
# Build and check for errors
bundle exec jekyll build

# Check for broken links
bundle exec htmlproofer _site --check-links
```

## Related

- [PRD](/docs/development/prd/)
- [Contributing Guide](https://github.com/bamr87/zer0-mistakes/blob/main/CONTRIBUTING.md)
