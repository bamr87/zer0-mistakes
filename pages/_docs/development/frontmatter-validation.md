---
lastmod: 2026-05-05T00:00:00.000Z
title: Config-Driven Frontmatter Validation
description: Schema-driven frontmatter validation that catches missing required fields, bad date formats, and unknown layouts before Jekyll builds.
layout: default
categories:
  - docs
  - development
tags:
  - validation
  - frontmatter
  - content
  - ci-cd
  - automation
permalink: /docs/development/frontmatter-validation/
difficulty: intermediate
estimated_reading_time: 8 minutes
sidebar:
  nav: docs
mermaid: true
---

# Config-Driven Frontmatter Validation

The zer0-mistakes theme ships with a schema-driven frontmatter validation system. It catches missing required fields, invalid date formats, and unknown layout references before Jekyll even starts its build, saving time in CI and preventing silent content errors.

## How It Works

The validator reads a YAML schema that defines per-collection rules, then checks every Markdown file's frontmatter against those rules.

```mermaid
graph LR
    A[Schema YAML] --> C[Validator]
    B[Content files] --> C
    C --> D{Valid?}
    D -- Yes --> E[Jekyll build proceeds]
    D -- No --> F[Error report + exit 1]
```

## Schema File

The schema lives at:

```
.github/config/frontmatter_schema.yml
```

### Example Schema

```yaml
collections:
  _posts:
    required:
      - title
      - date
      - categories
    date_fields:
      - date
      - lastmod
    allowed_layouts:
      - article
      - default

  _docs:
    required:
      - title
      - description
      - permalink
    allowed_layouts:
      - default
```

## Running Validation

```bash
# Via the unified validate script
./scripts/bin/validate

# Quick host-only checks (no Jekyll build)
./scripts/bin/validate --quick
```

The validation step is embedded in the standard preflight check and runs automatically in CI before every build.

## CI Integration

The `.github/workflows/` CI pipeline runs `./scripts/bin/validate` on every push and pull request. Frontmatter errors are surfaced as workflow failures with line-level diagnostics.

## AI-Assisted Maintenance

A dedicated Copilot prompt helps you audit and repair frontmatter across the entire site:

```
.github/prompts/frontmatter-maintainer.prompt.md
```

Use it via GitHub Copilot Chat:

```
@workspace /frontmatter-maintainer
```

## Frontmatter Standards

All pages in this theme follow a consistent frontmatter schema. Common fields:

| Field | Required | Description |
|---|---|---|
| `title` | ✅ | Human-readable page title |
| `description` | ✅ | SEO meta description (150–160 chars) |
| `layout` | ✅ | Jekyll layout file (without `.html`) |
| `permalink` | ✅ for docs | Canonical URL path |
| `date` | ✅ for posts | ISO 8601 publication date |
| `lastmod` | Recommended | Last modification date (ISO 8601) |
| `categories` | Recommended | Array of category strings |
| `tags` | Recommended | Array of tag strings |
| `draft` | Optional | `true` hides from production builds |

## Troubleshooting

### "Required field missing"

Add the missing field to the page's frontmatter.

### "Unknown layout"

Check that the layout name matches a file under `_layouts/` (without the `.html` extension).

### "Invalid date format"

Use ISO 8601: `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SSZ`.

## Related

- [Documentation Guide](/docs/development/documentation/)
- [Scripts Overview](/docs/development/scripts/)
- [CI/CD Pipeline](/docs/development/ci-cd/)

## See also

- [[Development]]
- [[Testing]]
- [[CI/CD]]
