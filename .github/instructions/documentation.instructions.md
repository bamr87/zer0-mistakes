---
applyTo: "docs/**,pages/_docs/**,DOCUMENTATION_WORKFLOW.md,**/*documentation*.md,**/*docs*.md"
description: "Documentation development guidelines for Zer0-Mistakes theme dual documentation architecture"
date: 2026-05-18T12:00:00.000Z
lastmod: 2026-06-01T03:42:37.000Z
---

# Documentation Guidelines

Zer0-Mistakes runs two documentation tiers. Pick the right one for the audience.

| Tier | Location | Audience | Format | Build |
|---|---|---|---|---|
| **Technical** | `docs/` | Maintainers, contributors | MDX | Excluded from Jekyll (see `_config.yml`) |
| **Public** | `pages/_docs/` | End users of the theme | Markdown | Rendered by Jekyll |

⚠️ Never link from `pages/_docs/` to `../../docs/...` — `docs/` is not served. Use a full GitHub URL.

## Required Front Matter

```yaml
---
title: "≤ 60 chars"
description: "120–160 chars, complete sentence"
date: 2026-MM-DDTHH:MM:SS.sssZ
lastmod: 2026-MM-DDTHH:MM:SS.sssZ
categories: [docs]            # YAML list, never bare string
tags: [tag1, tag2]
author: bamr87
---
```

For `pages/_docs/` add: `layout: default`, optional `permalink:`.

## Technical Docs (`docs/`)

Structure under `docs/`:

```
docs/
├── architecture/       # ADRs, system diagrams
├── features/           # Per-feature design notes
├── systems/            # Infrastructure, CI/CD
├── configuration/      # Config schemas
├── templates/          # Doc templates
└── releases/           # Release notes
```

Use MDX features (components, JSX) freely. Always cite source files with relative paths to `.github/`, `scripts/`, etc.

## Public Docs (`pages/_docs/`)

For end users who installed `jekyll-theme-zer0`. Cover: setup, config, customization, troubleshooting.

Required sections in each guide:

1. **What you'll do** (one sentence)
2. **Prerequisites** (bulleted)
3. **Steps** (numbered, copy-pasteable commands)
4. **Verify** (what success looks like)
5. **Troubleshooting** (issue → fix table)

## Code Examples

```liquid
{% raw %}
{% include components/card.html title="Example" %}
{% endraw %}
```

- Always specify language on fenced code blocks.
- Use `{% raw %}…{% endraw %}` around Liquid examples (or the renderer eats them).
- Nested code blocks → outer fence needs at least one more backtick than inner.
- Test every command in a clean Docker container before publishing.

## Cross-References

- Use markdown links with workspace-relative paths: `[layouts](../instructions/layouts.instructions.md)`.
- Maintain bidirectional links — if A references B, B's "Related" section references A.
- Run `markdown-link-check` in CI; fail the build on broken links.

## Conversion: MDX → Markdown

When promoting an internal doc (`docs/`) to public (`pages/_docs/`):

1. Strip JSX/MDX components → plain Markdown equivalents.
2. Replace `import` statements → Jekyll `{% include %}` where possible.
3. Convert callouts (`:::note`) → blockquotes with `> [!NOTE]`.
4. Rewrite all `docs/...` links → public URLs or GitHub raw URLs.
5. Add `pages/_docs/`-style front matter.

## Validation

```bash
# Docs maintenance suite (front matter, internal links, freshness)
./scripts/docs/validate.sh              # all checks
./scripts/docs/lint-frontmatter.sh      # required front matter (rejects TODO/stub descriptions)
./scripts/docs/check-links.sh           # internal links in docs/ resolve on disk
./scripts/docs/check-freshness.sh       # lastmod > 60 days behind last commit
./scripts/docs/lint-frontmatter.sh --fix  # inject skeleton front matter where missing

# Markdown / YAML / Jekyll
markdownlint "docs/**/*.md" "pages/_docs/**/*.md"
yamllint -c .github/config/.yamllint.yml docs/ pages/_docs/
docker-compose exec -T jekyll bundle exec jekyll build --config '_config.yml,_config_dev.yml'
```

CI runs `lint-frontmatter.sh`, `check-links.sh`, and `markdownlint` on every PR touching docs or content — the docs jobs in `.github/workflows/ai-content-review.yml` (Content & Docs Review). `check-freshness.sh` is available to run locally/manually (the scheduled freshness workflow was retired).

## Style

- Active voice, present tense, second person ("you run", not "the user runs").
- Sentence-case headings, no terminal punctuation.
- Spell out the first acronym, then abbreviate: "Static Site Generator (SSG)".
- One screenshot per major step, max 1200px wide, alt text required.

## Update Triggers (mandatory)

Update docs in the same PR as the code change when:

- A user-visible option, command, or layout changes
- Installation/setup steps change
- A breaking change is introduced (also: add to CHANGELOG.md)
- A new feature ships (also: add front matter `lastmod`)

## Hard Rules

- Never duplicate `docs/` content into `pages/_docs/` — link or extract a shared snippet.
- Never publish a public doc without a working `Verify` section.
- Never let `lastmod` go stale on a touched file.
- Never link to `_site/` or absolute file paths.

---

**Related:** [`README.instructions.md`](README.instructions.md) (IT-Journey README rules) · [`version-control.instructions.md`](version-control.instructions.md) · [`testing.instructions.md`](testing.instructions.md)
