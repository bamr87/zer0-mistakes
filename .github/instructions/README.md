# Copilot Instructions for Zer0-Mistakes

This directory contains file-specific instructions for GitHub Copilot to provide context-aware assistance when working with different parts of the Zer0-Mistakes Jekyll theme codebase.

## 📂 Structure

```
.github/
├── copilot-instructions.md          # Main project-wide instructions
└── instructions/
    ├── README.md                     # This file
    ├── layouts.instructions.md       # Jekyll layout development
    ├── includes.instructions.md      # Reusable component development
    ├── scripts.instructions.md       # Shell script automation
    ├── testing.instructions.md       # Testing guidelines
    ├── documentation.instructions.md # Documentation development
    └── version-control.instructions.md  # Git workflow and releases
```

## 🎯 How It Works

GitHub Copilot automatically applies these instructions based on the files you're editing:

| Instruction File                  | Applies To                         | Purpose                                            |
| --------------------------------- | ---------------------------------- | -------------------------------------------------- |
| `copilot-instructions.md`         | **All files**                      | Project overview, architecture, essential commands |
| `layouts.instructions.md`         | `_layouts/**`                      | Jekyll layout patterns, Bootstrap integration      |
| `includes.instructions.md`        | `_includes/**`                     | Reusable components, parameters, accessibility     |
| `scripts.instructions.md`         | `scripts/**`                       | Shell script standards, error handling             |
| `testing.instructions.md`         | `test/**`                          | Test development, assertions, CI/CD                |
| `documentation.instructions.md`   | `docs/**,pages/_docs/**,*docs*.md` | Documentation development guidelines               |
| `version-control.instructions.md` | `**` (all files)                   | Git workflow, semantic versioning, releases        |

## 📖 Main Instructions (copilot-instructions.md)

The main instruction file provides:

### Project Context

- **Project overview**: Purpose, key features, and architecture
- **Project structure**: Directory layout and file organization
- **Essential commands**: Development, testing, building, and deployment
- **Tooling information**: Docker, Jekyll, testing frameworks

### Development Guidelines

- **Critical workflows**: Setup, development, content creation
- **Bootstrap 5 integration**: CSS framework usage, components
- **Front matter standards**: Jekyll metadata for posts, layouts, includes
- **Docker optimization**: Container configuration, platform support

### Quality Standards

- **Error handling patterns**: Logging, recovery strategies
- **Documentation standards**: CHANGELOG, README, inline comments
- **SEO optimization**: Meta tags, structured data
- **Accessibility**: WCAG compliance, ARIA labels

### Best Practices

- **Security**: Input validation, credential management
- **Performance**: Asset optimization, lazy loading
- **Testing**: Test coverage, CI/CD integration
- **AI integration**: Code generation, debugging assistance

## 📝 File-Specific Instructions

### layouts.instructions.md

**Applies to**: `_layouts/**`

Guidelines for Jekyll layout development:

- Layout hierarchy and inheritance patterns
- Bootstrap 5 grid system and components
- Responsive design implementation (mobile-first)
- SEO optimization with meta tags
- Accessibility standards (ARIA, semantic HTML)
- Liquid templating best practices
- Performance optimization techniques

### includes.instructions.md

**Applies to**: `_includes/**`

Guidelines for reusable Jekyll components:

- Component naming conventions
- Parameter handling and defaults
- Bootstrap component integration
- Navigation patterns (navbar, breadcrumbs)
- Content cards and modals
- Accessibility requirements
- Performance optimization
- Usage examples and documentation

### scripts.instructions.md

**Applies to**: `scripts/**`

Guidelines for shell script development:

- Script structure and organization
- Error handling with `set -euo pipefail`
- Logging functions (info, success, error)
- Parameter validation
- Environment detection (OS, architecture)
- Security best practices
- Testing and debugging
- Documentation requirements

### testing.instructions.md

**Applies to**: `test/**`

Guidelines for test development:

- Test suite organization
- Test script structure
- Assertion patterns
- Test categories (core, deployment, quality)
- Docker-based testing
- CI/CD integration
- Test reporting
- Security testing

### version-control.instructions.md

**Applies to**: All files (`**`)

Guidelines for version control and releases:

- Git workflow strategies (Git Flow, GitHub Flow)
- Branch management
- Semantic versioning (MAJOR.MINOR.PATCH)
- Testing requirements before release
- Changelog management
- Documentation updates
- Release process
- Publication to RubyGems.org

### documentation.instructions.md

**Applies to**: `docs/**`, `pages/_docs/**`, `*documentation*.md`, `*docs*.md`

Guidelines for the dual documentation architecture:

- **Technical Documentation** (`/docs/`) - MDX format for developers/contributors
- **Public Documentation** (`/pages/_docs/`) - Markdown format for end-users
- Content conversion workflow (MDX to Markdown)
- External documentation import processes
- Documentation testing and validation
- AI-optimized documentation patterns
- Cross-reference standards
- Publication workflows

## 🚀 Using These Instructions

### For Developers

When you edit a file, GitHub Copilot automatically:

1. Loads the main `copilot-instructions.md`
2. Applies relevant file-specific instructions
3. Provides context-aware suggestions
4. Follows project conventions and standards

### For AI Agents

These instructions help AI coding agents:

- Understand project architecture and dependencies
- Follow established patterns and conventions
- Generate code consistent with project style
- Make appropriate security and performance decisions
- Provide accurate debugging and troubleshooting help

### Best Practices

1. **Read before modifying**: Review instructions before working on a new area
2. **Keep updated**: Update instructions when patterns change
3. **Be specific**: Add detailed examples for complex scenarios
4. **Test instructions**: Verify Copilot suggestions follow guidelines
5. **Document decisions**: Capture architectural decisions in instructions

## 📋 Instruction File Template

When adding new instruction files, use this frontmatter template:

```markdown
---
applyTo: "pattern/**"
description: "Brief description of what these instructions cover"
---

# Title of Instructions

## Overview

Brief introduction and purpose

## Structure

Organization of files/components

## Standards

Coding standards and conventions

## Patterns

Common patterns and examples

## Best Practices

Best practices and anti-patterns

## Testing

How to test these components

## Documentation

Documentation requirements

---

_Closing notes or references_
```

## 🔄 Maintenance

### When to Update Instructions

- **New features**: Add guidelines for new patterns or components
- **Breaking changes**: Update when architecture or conventions change
- **Best practices**: Incorporate lessons learned from development
- **Tool updates**: Reflect changes in dependencies (Bootstrap, Jekyll, etc.)
- **Security**: Add new security guidelines as needed

### Review Schedule

- **Monthly**: Review for accuracy and completeness
- **Before major releases**: Ensure instructions match current codebase
- **After architectural changes**: Update affected instruction files
- **When onboarding**: Gather feedback from new contributors

### Contributing to Instructions

To improve these instructions:

1. **Identify gaps**: Note missing or unclear guidelines
2. **Propose changes**: Open an issue or PR with specific improvements
3. **Provide examples**: Include concrete code examples
4. **Test with Copilot**: Verify suggestions improve with changes
5. **Document rationale**: Explain why changes are needed

## 📚 Additional Resources

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Best Practices for Copilot Instructions](https://gh.io/copilot-coding-agent-tips)
- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [Docker Documentation](https://docs.docker.com/)

## 🤝 Support

If you have questions about these instructions or need help:

- Open an issue in the repository
- Check [CONTRIBUTING.md](../../CONTRIBUTING.md)
- Review the main [README.md](../../README.md)
- Contact the maintainers

---

_These instructions are designed to help both human developers and AI coding agents work effectively with the Zer0-Mistakes codebase. Keep them updated and comprehensive for the best development experience._
