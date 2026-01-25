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
│   ├── mermaid-integration-v2.md
│   ├── posthog-analytics-integration.md
│   └── sitemap-integration.md
├── development/            # Development guides
│   ├── local-setup.md
│   ├── testing.md
│   └── code-style.md
├── releases/               # Release notes and history
│   └── v*.md
├── configuration/          # Configuration guides
│   └── url-configuration-guide.md
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

- **v0.18.x** — Documentation refactoring (user vs developer docs separation)
- **v0.6.0** — Release automation modernization
- **v0.5.0** — Comprehensive sitemap integration
- **v0.4.0** — Statistics dashboard

---

**Last Updated:** January 2026
**Maintained By:** Zer0-Mistakes Contributors
