---
title: "Documentation Workflow"
description: "Contributor guide to the dual docs architecture: when to write in docs/ vs pages/_docs/, front matter requirements, and the review pipeline."
date: 2026-05-31T20:54:46.000Z
lastmod: 2026-05-31T20:54:46.000Z
categories: [docs]
tags: [development, contributing, documentation]
author: bamr87
---

# Documentation Workflow

> **Canonical rules** are in [`.github/instructions/documentation.instructions.md`](../../.github/instructions/documentation.instructions.md). This file is a quick-reference summary for contributors.

## Two-Tier Architecture

| Tier | Location | Audience | Format |
|------|----------|----------|--------|
| Technical | `docs/` | Maintainers, contributors | Markdown (not served by Jekyll) |
| Public | `pages/_docs/` | End users of the theme | Markdown (rendered by Jekyll) |

**Rule:** Never link from `pages/_docs/` into `docs/` — `docs/` is not served. Use full GitHub URLs instead.

## Where Does New Content Go?

```
New content → Who reads it?
  ├─ Contributor / maintainer → docs/
  │     ├─ Architecture decision      → docs/architecture/
  │     ├─ Feature design notes       → docs/features/
  │     ├─ CI/CD, release system      → docs/systems/
  │     ├─ Implementation changelog   → docs/implementation/
  │     └─ Developer how-to           → docs/development/
  │
  └─ End user of the theme → pages/_docs/
        ├─ Setup / install guide      → pages/_docs/
        ├─ Config reference           → pages/_docs/
        └─ Troubleshooting for users  → pages/_docs/
```

## Required Front Matter

Every `docs/**/*.md` content file (not READMEs) must include:

```yaml
---
title: "≤ 60 chars"
description: "120–160 chars, complete sentence"
date: 2026-MM-DDTHH:MM:SS.000Z
lastmod: 2026-MM-DDTHH:MM:SS.000Z
categories: [docs]
tags: [tag1, tag2]
author: bamr87
---
```

Run `./scripts/docs/lint-frontmatter.sh` to check compliance. Use `--fix` to inject skeletons.

## Mandatory Update Triggers

Update docs **in the same PR as the code change** when:

| Code change | Doc to update |
|-------------|---------------|
| `_layouts/` or `_includes/` | `docs/ui/` or `docs/architecture/layouts-includes.md` |
| `scripts/` | `docs/systems/` or `docs/development/` |
| `install.sh` or `templates/` | `docs/installation/` |
| New feature ships | `docs/features/` + update `lastmod` |
| Breaking change | relevant doc + `CHANGELOG.md` |

## Validation

```bash
./scripts/docs/validate.sh             # all checks
./scripts/docs/lint-frontmatter.sh     # front matter only
./scripts/docs/check-links.sh          # broken links
./scripts/docs/check-freshness.sh      # stale lastmod
```

## Promoting a Technical Doc to Public

When a `docs/` document is ready for end users:

1. Copy to `pages/_docs/` and add Jekyll front matter (`layout`, `permalink`)
2. Strip any MDX/JSX → plain Markdown
3. Rewrite `docs/...` links → full GitHub URLs
4. Add a working **Verify** section (required for public docs)
5. Run `markdownlint` and `bundle exec jekyll build` to validate
