# Developer Documentation

Technical documentation for contributors and maintainers of the Zer0-Mistakes Jekyll theme.

> **For Users:** Looking for docs on *using* the theme? See [`pages/_docs/`](../pages/_docs/) for user-facing guides.

## Directory Structure

```
docs/
├── README.md                  # This file
│
├── ui/                        # Theme styling and component reference
│   ├── design-system.md
│   ├── design-tokens.md
│   ├── theming.md
│   ├── configuration.md
│   ├── components.md
│   ├── layouts-and-navigation.md
│   ├── code-blocks.md
│   ├── customization.md
│   ├── extending.md
│   └── js-api.md
│
├── architecture/              # ADRs and system design
│   ├── prd-requirements.md
│   ├── prd-roadmap.md
│   ├── project-structure.md
│   ├── layouts-includes.md
│   └── build-system.md
│
├── development/               # Contributor setup and conventions
│   ├── local-setup.md
│   ├── testing.md
│   ├── code-style.md
│   ├── troubleshooting.md
│   └── documentation-workflow.md
│
├── systems/                   # Infrastructure and CI/CD
│   ├── release-automation.md
│   ├── automated-version-system.md
│   ├── gem-publication-system.md
│   ├── dependency-management.md
│   ├── ruby-version-management.md
│   └── github-secrets-setup.md
│
├── implementation/            # Feature implementation changelogs
│   ├── feature-change-log.md
│   ├── navigation-redesign.md
│   ├── posthog-analytics-integration.md
│   ├── preview-image-generator.md
│   └── sitemap-integration.md
│
├── features/                  # Per-feature design notes
│   ├── jupyter-notebooks.md
│   ├── nanobar-component.md
│   └── theme-version.md
│
├── installation/              # Installer and deployment guides
│   ├── index.md
│   ├── forking.md
│   ├── url-configuration.md
│   ├── profiles.md
│   ├── ai-features.md
│   ├── deploy-targets.md
│   ├── customization.md
│   ├── architecture.md
│   └── migration-from-0.x.md
│
├── releases/                  # Release notes by version
│   └── v*.md
│
├── templates/                 # Documentation templates
│   ├── feature-documentation-template.md
│   ├── release-notes-template.md
│   └── change-tracking-template.md
│
└── archive/                   # Historical / superseded docs
```

## Quick Links

### Styling and UI (start here)

- [Design system](ui/design-system.md) — tokens, SCSS pipeline, Bootstrap integration
- [Theming](ui/theming.md) — skins, backgrounds, color modes, preview pages
- [Configuration](ui/configuration.md) — `_config.yml` styling keys with examples
- [Components](ui/components.md) — Liquid include library
- [Layouts and navigation](ui/layouts-and-navigation.md) — sidebars, TOC, navbar, FABs
- [Code blocks](ui/code-blocks.md) — syntax highlighting and copy button
- [Customization](ui/customization.md) — decision tree for fork-safe changes
- [Design tokens](ui/design-tokens.md) — quick reference
- [Extending](ui/extending.md) — add layouts, components, skins
- [JavaScript API](ui/js-api.md) — `zer0Navigation`, `zer0Bg`, `zer0UI`

Live preview (built site): `/about/settings/theme-preview/`

### Getting Started (Contributors)

- [Local Development Setup](development/local-setup.md)
- [Testing Guide](development/testing.md)
- [Code Style Guide](development/code-style.md)
- [Documentation Workflow](development/documentation-workflow.md)

### Understanding the Codebase

- [Project Structure](architecture/project-structure.md)
- [Layouts and Includes](architecture/layouts-includes.md)
- [Build System](architecture/build-system.md)
- [Product Requirements](architecture/prd-requirements.md)

### Release Process

- [Release Automation v2.0](systems/release-automation.md)
- [Gem Publication System](systems/gem-publication-system.md)
- [Troubleshooting](development/troubleshooting.md)

### Installation and Forking

- [Installation Overview](installation/index.md)
- [Forking Guide](installation/forking.md)
- [URL Configuration](installation/url-configuration.md)
- [Profiles](installation/profiles.md)
- [AI Features](installation/ai-features.md)
- [Migration from 0.x](installation/migration-from-0.x.md)

### Features

- [Jupyter Notebooks](features/jupyter-notebooks.md)
- [Theme Version Display](features/theme-version.md)
- [Nanobar Component](features/nanobar-component.md)

### Systems and Infrastructure

- [Dependency Management](systems/dependency-management.md)
- [Ruby Version Management](systems/ruby-version-management.md)
- [GitHub Secrets Setup](systems/github-secrets-setup.md)

## Documentation Locations

| Location | Purpose | Audience |
|----------|---------|----------|
| `/docs/` (this directory) | Developer/contributor documentation | Maintainers |
| `/pages/_docs/` | User-facing theme documentation | End users |
| `README.md` | Project overview | All users |
| `CONTRIBUTING.md` | Contribution guidelines | Contributors |

## Recent Updates

- **May 2026** — All root-level docs moved into subdirectories; `ui/` created for styling reference; `DOCUMENTATION_WORKFLOW.md` moved to `development/`
- **v1.8** — Comprehensive styling documentation set (design system, theming, configuration, components, layouts, code blocks)
- **v0.22.21** — Nanobar component refactoring, footer full-width fix, UI/UX improvements
- **v0.22.0** — Copilot Agent prompt button with data-driven prompt registry
- **v0.6.0** — Release automation modernization

---

**Last Updated:** May 2026
**Maintained By:** Zer0-Mistakes Contributors
