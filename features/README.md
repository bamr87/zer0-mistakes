# Features Directory

This directory contains the comprehensive feature registry for the zer0-mistakes Jekyll theme.

## Files

- The registry itself lives at [`_data/features.yml`](../_data/features.yml) (single source of truth, read by Jekyll as `site.data.features`).

## Usage

Edit `_data/features.yml` directly; there is no second copy to sync (the former `features/features.yml` duplicate was removed, UPS-WORK-06).

## Features Page

A dedicated features showcase page is available at `/features/` which displays all features organized by category.

## Feature Structure

Each feature includes:

```yaml
- id: ZER0-XXX
  title: "Feature Name"
  description: "Detailed description"
  implemented: true
  version: "X.X.X"
  link: "/link/to/feature/"
  docs: "path/to/documentation.md"
  tags: [tag1, tag2, tag3]
  date: YYYY-MM-DD
  references:
    # File references for implementation
  features:
    # List of sub-features or capabilities
```

## Categories

Features are organized into these categories:

1. **Core Infrastructure** — Bootstrap, Docker, Modular Installer
2. **AI-Powered Features** — Preview generation, Copilot/AGENTS.md integration, Multilingual translation pipeline
3. **Analytics & Privacy** — PostHog, Cookie Consent, Google Analytics, GTM
4. **Navigation & UI** — Sidebar, Keyboard nav, Mobile TOC, ES6 modular nav, Dynamic nav fallback
5. **Content Management** — Jupyter Notebooks, Mermaid, Collections, Notes
6. **Obsidian Vault Integration** — Wiki-links, embeds, callouts, backlinks, graph view
7. **Developer Experience** — Testing, CI/CD, Release Automation, DevContainer, Local Docker Publishing
8. **Layouts & Templates** — 15+ layouts, 70+ includes, Admin dashboard
9. **Plugins & Extensions** — Custom Jekyll plugins
10. **Legal & Compliance** — Privacy Policy, Terms of Service
11. **Documentation** — PRD, Dual Architecture, AGENTS.md, Roadmap
12. **Automation & Workflows** — GitHub Actions, Frontmatter Validation
13. **Utility Scripts** — Automation library, Vendored assets
14. **SEO & AIEO** — Meta tags, sitemap, structured data, FAQ, glossary
15. **Setup & Quickstart** — Bare-minimum starter, Smart 404, Site config detection

## Adding New Features

When adding a new feature:

1. Add the feature to `_data/features.yml`
2. Use the next sequential ID (ZER0-XXX) — never reuse retired IDs
3. Include all required fields (id, title, description, implemented, version, tags, date, link, docs)
4. Add file references under `references:`
5. Link to documentation if available
6. Update the features page if needed

See [.github/instructions/features.instructions.md](../.github/instructions/features.instructions.md) for the full schema and validation steps.

## Validation

Validate YAML syntax:

```bash
python3 -c "import yaml; yaml.safe_load(open('_data/features.yml'))"
```

## Feature Count

Current count: **87 features** (as of 2026-09-07, gem v1.29.0)
