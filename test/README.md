# Testing Framework for zer0-mistakes Jekyll Theme

## Overview

The zer0-mistakes testing framework uses **RSpec** for Ruby/Jekyll testing and **Playwright** for browser E2E testing.

## Test Architecture

| Framework | Location | Purpose | Runtime |
|-----------|----------|---------|---------|
| RSpec | `spec/` | Ruby specs: schemas, plugins, features, build, content, quality | ~4s |
| Playwright | `e2e/` | Browser E2E: navigation, search, dark mode, responsive, a11y, analytics | ~30-60s |

## RSpec Test Suite

### Running Tests

```bash
# Run all specs
bundle exec rspec

# Run with documentation format
bundle exec rspec --format documentation

# Run specific category
bundle exec rspec spec/build/
bundle exec rspec spec/quality/
bundle exec rspec spec/schemas/
bundle exec rspec spec/content/

# Run in Docker
docker-compose exec -T jekyll bundle exec rspec
```

### Spec Categories

| Category | Directory | Examples |
|----------|-----------|----------|
| Schemas | `spec/schemas/` | Front matter validation, collection schemas |
| Plugins | `spec/plugins/` | Theme version plugin, preview image generator |
| Features | `spec/features/` | Feature definitions, cross-references |
| Build | `spec/build/` | Jekyll build, HTML output, asset compilation, version consistency |
| Content | `spec/content/` | Post structure, preview images |
| Integration | `spec/integration/` | Cross-reference validation |
| Quality | `spec/quality/` | Security, accessibility, compatibility |

### Rake Tasks

```bash
rake spec              # All specs (default)
rake spec:schemas      # Schema specs
rake spec:build        # Build specs
rake spec:quality      # Quality specs
rake spec:plugins      # Plugin specs
rake spec:features     # Feature specs
rake spec:content      # Content specs
rake spec:integration  # Integration specs
```

## Playwright E2E Tests

### Setup

```bash
cd e2e
npm install
npx playwright install --with-deps chromium
```

### Running Tests

```bash
cd e2e

# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/navigation.spec.ts
npx playwright test tests/accessibility.spec.ts

# Run by project (viewport)
npx playwright test --project=desktop
npx playwright test --project=mobile
npx playwright test --project=tablet

# Update visual regression baselines
npx playwright test tests/visual-regression.spec.ts --update-snapshots
```

### E2E Test Files

| File | Tests |
|------|-------|
| `navigation.spec.ts` | Header, nav links, dropdowns, skip-to-content, mobile offcanvas |
| `search.spec.ts` | Search modal, input, form action, keyboard hints |
| `dark-mode.spec.ts` | Theme attribute, dark background, text readability |
| `responsive.spec.ts` | Desktop, tablet, mobile breakpoints |
| `accessibility.spec.ts` | axe-core WCAG 2.1 AA, heading hierarchy, alt text, landmarks |
| `analytics.spec.ts` | Cookie consent flow, localStorage, PostHog gating |
| `visual-regression.spec.ts` | Screenshot comparisons for homepage, about, header, footer |

## CI Integration

Tests run automatically in GitHub Actions CI:

- **RSpec**: Matrix build across Ruby 3.2 and 3.3
- **Playwright**: Desktop project with Chromium on ubuntu-latest
- **Quality**: RSpec quality specs as separate job

See `.github/workflows/ci.yml` for the full pipeline configuration.

---

**Test Framework Version**: 4.0 (RSpec + Playwright)
**Last Updated**: June 2025
**Compatibility**: Jekyll 3.x (github-pages), Ruby 3.2+, Node.js 20+, Playwright 1.45+
