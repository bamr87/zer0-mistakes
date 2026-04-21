# Developer Documentation

Technical documentation for contributors and maintainers of the Zer0-Mistakes Jekyll theme.

## Purpose

This `/docs/` directory contains **developer-focused documentation** for the Zer0-Mistakes Jekyll theme:

- **Architecture** — Codebase structure and design decisions
- **Systems** — CI/CD, release automation, gem publication
- **Implementation** — Feature implementation details and changelogs
- **Development** — Setup guides and coding conventions
- **Releases** — Version history and release notes

> **For Users:** If you're looking for documentation on **using** the theme, see [`pages/_docs/`](../pages/_docs/) which contains user-facing guides and tutorials.

## Directory Structure

```
docs/
├── architecture/           # Codebase architecture
│   ├── project-structure.md
│   ├── layouts-includes.md
│   └── build-system.md
├── systems/                # Automation and CI/CD
│   ├── release-automation.md
│   ├── automated-version-system.md
│   └── gem-publication-system.md
├── implementation/         # Feature implementation details
│   ├── copilot-agent-prompt-button.md
│   ├── mermaid-integration-v2.md
│   ├── posthog-analytics-integration.md
│   ├── preview-image-generator.md
│   ├── sitemap-enhancement-summary.md
│   └── sitemap-integration.md
├── development/            # Development guides
│   ├── local-setup.md
│   ├── testing.md
│   └── code-style.md
├── releases/               # Release notes and history
│   └── v*.md
├── features/               # Feature documentation
│   └── nanobar-component.md
├── configuration/          # Configuration guides
│   └── url-configuration-guide.md
├── jekyll/                 # Jekyll-specific documentation
│   ├── config-reference.md
│   ├── security-headers.md
│   └── troubleshooting-port.md
├── templates/              # Documentation templates
└── archive/                # Historical documentation
```

## Quick Links

### Getting Started (Contributors)

- [Local Development Setup](development/local-setup.md)
- [Testing Guide](development/testing.md)
- [Code Style Guide](development/code-style.md)

### Understanding the Codebase

- [Project Structure](architecture/project-structure.md)
- [Layouts and Includes](architecture/layouts-includes.md)
- [Build System](architecture/build-system.md)

### Release Process

- [Release Automation v2.0](systems/release-automation.md)
- [Gem Publication System](systems/gem-publication-system.md)

## Documentation Locations

| Location | Purpose | Audience |
|----------|---------|----------|
| `/docs/` (this directory) | Developer/contributor documentation | Maintainers |
| `/pages/_docs/` | User-facing theme documentation | End users |
| `README.md` | Project overview | All users |
| `CONTRIBUTING.md` | Contribution guidelines | Contributors |

## Contributing to Documentation

### Adding Developer Documentation

1. Choose the appropriate subdirectory
2. Follow existing formatting conventions
3. Link from relevant README files
4. Update this README if adding new sections

### Documentation Standards

- **Markdown format** with clear headers
- **Code examples** for technical content
- **Tables** for reference information
- **Links** to related documentation

## Recent Updates

- **v0.22.21** — Nanobar component refactoring, footer full-width fix, UI/UX improvements
- **v0.22.9** — Skin editor, palette generator, Playwright visual tests
- **v0.22.0** — Copilot Agent prompt button with data-driven prompt registry
- **v0.21.3** — Vendor assets (Bootstrap, Icons, Mermaid), AIEO structured data
- **v0.20.0** — Scaffolding templates, expanded test suite
- **v0.19.0** — 43 features documented, 40+ user-facing doc pages
- **v0.18.x** — Documentation refactoring (user vs developer docs separation)
- **v0.6.0** — Release automation modernization
- **v0.5.0** — Comprehensive sitemap integration

---

**Last Updated:** April 2026
**Maintained By:** Zer0-Mistakes Contributors
