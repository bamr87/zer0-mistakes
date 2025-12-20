# Features Directory

This directory contains the comprehensive feature registry for the zer0-mistakes Jekyll theme.

## Files

- **features.yml** - Master feature registry with all documented features

## Usage

The features.yml file is synced to `_data/features.yml` for Jekyll to use. Any updates to `features/features.yml` should be copied to the `_data/` directory:

```bash
cp features/features.yml _data/features.yml
```

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

1. **Core Infrastructure** - Bootstrap, Docker, Installation
2. **AI-Powered Features** - Preview Generation, Copilot Integration
3. **Analytics & Privacy** - PostHog, Cookie Consent
4. **Navigation & UI** - Sidebar, Keyboard Navigation, Mobile TOC
5. **Content Management** - Jupyter Notebooks, Mermaid, Collections
6. **Developer Experience** - Testing, CI/CD, Release Automation
7. **Layouts & Templates** - 15+ layouts, 70+ includes
8. **Plugins & Extensions** - Custom Jekyll plugins
9. **Legal & Compliance** - Privacy Policy, Terms of Service
10. **Documentation** - PRD, Dual Architecture
11. **Automation & Workflows** - GitHub Actions
12. **Utility Scripts** - Automation library

## Adding New Features

When adding a new feature:

1. Add the feature to `features/features.yml`
2. Use the next sequential ID (ZER0-XXX)
3. Include all required fields (id, title, description, implemented, version, tags, date)
4. Add file references under `references:`
5. Link to documentation if available
6. Copy to `_data/features.yml`
7. Update the features page if needed

## Validation

Validate YAML syntax:

```bash
python3 -c "import yaml; yaml.safe_load(open('features/features.yml'))"
```

## Feature Count

Current count: **28 features** (as of 2025-12-16)
