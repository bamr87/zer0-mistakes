# Documentation Templates

Reusable templates for consistent documentation across the Zer0-Mistakes project.

## Templates

| Template | Use when |
|----------|----------|
| [Feature Documentation](feature-documentation-template.md) | Documenting a new theme feature or component |
| [Release Notes](release-notes-template.md) | Publishing a versioned release |
| [Change Tracking](change-tracking-template.md) | Recording a significant code change or bug fix |

## Completed Examples

Before using a template, review a completed example:

| Template | Completed example |
|----------|------------------|
| Feature documentation | [Nanobar Component](../features/nanobar-component.md) |
| Feature documentation | [Copilot Prompt Button](../implementation/copilot-agent-prompt-button.md) |
| Release notes | [v0.3.0 Release Notes](../releases/v0.3.0-release-notes.md) |
| Change tracking | [Lint Pages Fixes](../implementation/lint-pages-fixes.md) |

## How to Use

1. Copy the template to the appropriate subdirectory (`docs/features/`, `docs/implementation/`, `docs/releases/`)
2. Fill in the front matter fields (`title`, `description`, `date`, `lastmod`, `tags`)
3. Replace placeholder text with real content — delete sections that don't apply
4. Run `./scripts/docs/lint-frontmatter.sh` to verify compliance
5. Open a PR; CI will run link checking and markdownlint

## Front Matter Requirement

Every new doc needs the standard front matter. The template files include it as a starting point. Run `./scripts/docs/lint-frontmatter.sh --fix` on any file missing it.
