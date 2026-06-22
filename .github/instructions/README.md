# Copilot Instructions for Zer0-Mistakes

This directory contains file-specific instructions for GitHub Copilot to provide context-aware assistance when working with different parts of the Zer0-Mistakes Jekyll theme codebase.

> 🤖 **Working with another AI agent?** (Codex, Cursor, Aider, Jules, Continue, Claude Code, …) Start at [`AGENTS.md`](../../AGENTS.md) in the repository root — it is the cross-tool entry point and links into the layered guidance described below.

## 📂 Structure

```
.github/
├── copilot-instructions.md          # Main project-wide instructions
├── instructions/                    # File-scoped instructions (this directory)
│   ├── README.md                     # This file
│   ├── layouts.instructions.md       # Jekyll layout development
│   ├── includes.instructions.md      # Reusable component development
│   ├── scripts.instructions.md       # Shell script automation
│   ├── install.instructions.md       # Modular installer (CLI, profiles, deploy plugins)
│   ├── testing.instructions.md       # Testing guidelines
│   ├── documentation.instructions.md # Documentation development
│   ├── features.instructions.md      # Feature registry schema + sync contract
│   ├── obsidian.instructions.md      # Obsidian vault integration (wiki-links, JS resolver, Ruby plugin)
│   ├── sass.instructions.md          # Sass partials, Bootstrap overrides, CSS custom properties
│   ├── version-control.instructions.md  # Git workflow and releases
│   ├── backlog.instructions.md       # Tactical backlog schema + sync contract
│   ├── content-review.instructions.md   # AI content reviewer: SEO/quality + resolution
│   └── ai-chat.instructions.md       # AI chat assistant + chat-proxy: auth, caps, safety
├── prompts/                         # Reusable agent/chat prompts (.prompt.md)
│   ├── commit-publish.prompt.md      # Full release pipeline
│   ├── frontmatter-maintainer.prompt.md  # Front matter audit / fix
│   ├── content-review.prompt.md      # Content SEO/consistency/polish review
│   ├── repo-audit.prompt.md          # Review repo → file backlog tasks
│   ├── backlog-implement.prompt.md   # Implement next backlog task → PR
│   └── seed.prompt.md                # Theme rebuild blueprint
├── skills/                          # Operational workflow checklists (SKILL.md)
│   ├── change-workflow/SKILL.md      # Branch → commit → PR for any change
│   ├── validate-build/SKILL.md       # Pre-commit / pre-PR validation pipeline
│   └── content-review/SKILL.md       # Content SEO/consistency/polish review
└── seed/                            # Deep architectural blueprint docs

.cursor/
└── commands/                        # Cursor IDE slash-commands (mirror of prompts/)

AGENTS.md                            # Cross-tool agent entry point (repo root)
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
| `features.instructions.md`        | `_data/features.yml`, `features/**`, `pages/features.md`, `_includes/components/feature-card.html` | Feature registry schema, sync contract, update-on-change rules |
| `install.instructions.md`         | `scripts/lib/install/**`, `scripts/bin/install`, `install.sh`, `templates/{profiles,deploy,agents,ai}/**` | Modular installer architecture, profiles, deploy plugins, safety contracts |
| `obsidian.instructions.md`        | `_plugins/obsidian_links.rb`, `assets/js/obsidian-*.js`, `assets/data/wiki-index.json`, `_includes/content/backlinks.html`, `pages/_docs/obsidian/**`, Obsidian tests | Wiki-link/embed/callout contract across Liquid index, JS resolver, and Ruby plugin |
| `sass.instructions.md`            | `_sass/**`, `assets/css/**`        | Sass partial layering, Bootstrap variable overrides, no-double-Bootstrap rule |
| `version-control.instructions.md` | `CHANGELOG.md`, `**/version.*`, `*.gemspec`, `package.json` | Git workflow, semantic versioning, releases        |
| `backlog.instructions.md`         | `_data/backlog.yml`, `scripts/sync-backlog.*`, `.github/workflows/sync.yml` | Tactical backlog schema, sync contract, ownership rules |
| `content-review.instructions.md`  | `pages/**/*.md`, `.github/config/content_review.yml`, `.claude/agents/content-reviewer.md`, `scripts/content-review.rb`, `.github/workflows/ai-content-review.yml` | AI content reviewer: per-collection SEO/quality targets, review resolution |
| `ai-chat.instructions.md`         | `_includes/components/ai-chat.html`, `assets/js/ai-chat.js`, `templates/deploy/chat-proxy/**` | AI chat assistant + chat-proxy: auth modes, server caps, confirmation/safety contracts |

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

## 🧩 Extending Agent Capabilities

The agent guidance system is designed to be **extendable**. Use these patterns when adding new capabilities:

### Add a new file-scoped instruction set

1. Create `.github/instructions/<area>.instructions.md` with the front matter template above.
2. Cover overview, structure, standards, patterns, best practices, testing, and documentation (mirror existing files such as `layouts.instructions.md`).
3. Add the file to the **Structure** diagram and table at the top of this README.
4. Add a row to the file-scoped instruction map in [`AGENTS.md`](../../AGENTS.md) so non-Copilot agents can find it.

### Add a reusable prompt / agent mode

1. Create `.github/prompts/<task>.prompt.md` with this front matter:

   ```yaml
   ---
   agent: agent
   mode: agent
   description: "Short description of the multi-step task"
   tools: [optional, list, of, tool, names]
   ---
   ```

2. Write the prompt as a numbered, checkable workflow (see `commit-publish.prompt.md` for the canonical pattern).
3. To make it available as a Cursor slash-command, mirror the file into `.cursor/commands/<task>.md`.
4. Add it to the prompts table in [`AGENTS.md`](../../AGENTS.md).

### Add a workflow skill

Skills are operational checklists an agent reads before performing a recurring
action (validating, branching, reviewing). They differ from prompts: a prompt is
a task you invoke; a skill is a reusable procedure referenced by prompts,
agents, and `CLAUDE.md`.

1. Create `.github/skills/<name>/SKILL.md` with this front matter (mirror
   `change-workflow` / `validate-build`):

   ```yaml
   ---
   name: <name>
   description: "**WORKFLOW SKILL** — <what it does>. USE FOR: … INVOKES: … DO NOT USE FOR: …"
   ---
   ```

2. Write it as a numbered, checkable procedure with a "When to use" section and a
   "Reporting back to the user" section.
3. Add it to the **Structure** diagram above and the workflow-skills table in
   [`AGENTS.md`](../../AGENTS.md).
4. If it governs how *all* changes are made, reference it from `CLAUDE.md` and
   the relevant `*.instructions.md`.

### Onboard a new AI tool / IDE

When adding support for a new agent that uses its own config file, **do not duplicate** instruction content — point the new file at `AGENTS.md` and the layered guidance under `.github/`. Examples:

- Claude Code: `CLAUDE.md` → "See `AGENTS.md`."
- Aider: `.aider.conf.yml` with `read: [AGENTS.md, .github/copilot-instructions.md]`.
- Continue: `.continuerc.json` referencing the same files.

This keeps a single source of truth and prevents drift between tools.

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
