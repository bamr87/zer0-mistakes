# Implementation Documentation

Technical implementation details and changelogs for theme features. This documentation is intended for contributors and maintainers.

## Contents

| Document | Description |
|----------|-------------|
| [Feature Change Log](feature-change-log.md) | Implementation notes: Mermaid v2, sidebar improvements, frontmatter bug fixes, Copilot prompt button |
| [Navigation Redesign](navigation-redesign.md) | UI/UX overhaul: responsive design, WCAG 2.1 AA, animations, keyboard navigation |
| [PostHog Analytics Integration](posthog-analytics-integration.md) | Analytics implementation with GDPR/CCPA compliance |
| [Preview Image Generator](preview-image-generator.md) | AI-powered preview image generation (OpenAI, xAI Grok) |
| [Sitemap Integration](sitemap-integration.md) | Comprehensive sitemap feature implementation |

## Purpose

This directory contains:

- **Implementation changelogs** — Detailed records of feature development
- **Technical specifications** — Architecture decisions and design rationale
- **Integration guides** — How features were integrated into the theme

## For Users

If you're looking for **how to use** these features, see the user documentation:

- [Features Documentation](/docs/features/) — User guides for theme features
- [Mermaid Diagrams](/docs/features/mermaid-diagrams/)
- [PostHog Analytics](/docs/features/posthog-analytics/)

## Contributing

When implementing new features:

1. Create an implementation document in this directory
2. Document the technical approach and decisions
3. Create corresponding user documentation in `pages/_docs/features/`
4. Update this README with the new document
