---
title: Testing
description: Comprehensive testing guide including RSpec unit/integration tests, Playwright E2E tests, and CI/CD integration.
layout: default
categories:
    - docs
    - development
tags:
    - testing
    - ci-cd
    - quality
permalink: /docs/development/testing/
difficulty: intermediate
estimated_time: 15 minutes
prerequisites:
    - Docker Desktop
    - Ruby with Bundler
sidebar:
    nav: docs
---

# Testing Guide

This guide covers the testing infrastructure for the Zer0-Mistakes Jekyll theme, built on **RSpec** for unit/integration tests and **Playwright** for end-to-end browser tests.

## Test Suite Structure

```
spec/
├── spec_helper.rb           # RSpec configuration & shared context
├── build/                   # Jekyll build & output tests
├── content/                 # Content validation tests
├── features/                # Theme feature tests
├── integration/             # Cross-component integration tests
├── plugins/                 # Jekyll plugin tests
├── quality/                 # Code quality & security tests
└── schemas/                 # Data file schema validation

e2e/
├── playwright.config.ts     # Playwright configuration
├── tests/                   # E2E browser test specs
│   ├── navigation.spec.ts
│   ├── search.spec.ts
│   ├── dark-mode.spec.ts
│   ├── responsive.spec.ts
│   ├── accessibility.spec.ts
│   ├── analytics.spec.ts
│   └── visual-regression.spec.ts
└── baselines/               # Visual regression baselines
```

## Running Tests

### RSpec Tests

```bash
# Run all tests
bundle exec rspec

# Run with detailed output
bundle exec rspec --format documentation

# Run specific category
bundle exec rspec spec/build/
bundle exec rspec spec/quality/
bundle exec rspec spec/features/

# Run a single spec file
bundle exec rspec spec/build/jekyll_build_spec.rb

# Run in Docker
docker-compose exec jekyll bundle exec rspec
```

### Playwright E2E Tests

```bash
# Install dependencies
cd e2e && npm install && npx playwright install chromium

# Run all E2E tests
npx playwright test

# Run specific project (desktop, tablet, mobile)
npx playwright test --project=desktop
npx playwright test --project=mobile

# Run with UI mode
npx playwright test --ui
```

### Rake Tasks

```bash
rake spec              # All RSpec tests
rake spec:build        # Build tests only
rake spec:quality      # Quality tests only
rake e2e:all           # All Playwright tests
rake e2e:desktop       # Desktop E2E tests
rake e2e:a11y          # Accessibility E2E tests
```

## Test Categories

### Build Tests (`spec/build/`)

| Spec | Description |
|------|-------------|
| `jekyll_build_spec.rb` | Verifies site builds, checks file structure |
| `asset_compilation_spec.rb` | Tests CSS/JS asset processing |
| `html_output_spec.rb` | Validates HTML output quality |
| `version_consistency_spec.rb` | Checks version across all files |

### Quality Tests (`spec/quality/`)

| Spec | Description |
|------|-------------|
| `security_spec.rb` | Checks for hardcoded secrets, sensitive files |
| `accessibility_spec.rb` | Validates ARIA attributes, semantic HTML |
| `compatibility_spec.rb` | Cross-platform and browser compatibility |

### Feature Tests (`spec/features/`)

| Spec | Description |
|------|-------------|
| `search_spec.rb` | Search functionality validation |
| `navigation_spec.rb` | Navigation component tests |
| `dark_mode_spec.rb` | Dark mode theme switching |
| `cookie_consent_spec.rb` | GDPR consent system |

### Schema Tests (`spec/schemas/`)

| Spec | Description |
|------|-------------|
| `config_schema_spec.rb` | Validates `_config.yml` structure |
| `data_files_spec.rb` | Validates YAML data files |
| `front_matter_spec.rb` | Checks front matter in content |

## Writing Tests

### RSpec Example

```ruby
# spec/features/my_feature_spec.rb
RSpec.describe "My Feature" do
  let(:site_dir) { File.join(PROJECT_ROOT, "_site") }

  it "generates expected output" do
    expect(File.exist?(File.join(site_dir, "expected-file.html"))).to be true
  end

  it "includes required content" do
    html = File.read(File.join(site_dir, "index.html"))
    expect(html).to include("expected-content")
  end
end
```

### Playwright Example

```typescript
// e2e/tests/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test('feature works correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.feature')).toBeVisible();
});
```

## CI/CD Integration

Tests run automatically via GitHub Actions on pull requests and pushes to main.

### GitHub Actions Configuration

```yaml
test:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      ruby-version: ['3.2', '3.3']
  steps:
    - uses: actions/checkout@v4
    - uses: ruby/setup-ruby@v1
      with:
        ruby-version: ${{ matrix.ruby-version }}
        bundler-cache: true
    - run: bundle exec jekyll build
    - run: bundle exec rspec --format documentation
```

## Best Practices

- Each test should be independent — don't rely on execution order
- Use `let` and `before` blocks for shared setup
- Test both positive and negative cases
- Keep tests fast — mock external dependencies when possible
- Use meaningful `describe`/`it` descriptions

## Troubleshooting

### Tests Fail Locally but Pass in CI

1. Ensure `_site/` is built: `bundle exec jekyll build`
2. Check Ruby version matches CI matrix
3. Verify environment variables

### Missing Dependencies

```bash
bundle install                              # Ruby dependencies
cd e2e && npm install                       # Node dependencies
npx playwright install chromium             # Browser binary
```

## Related

- [CI/CD Pipeline](/docs/development/ci-cd/)
- [Security Scanning](/docs/development/security/)
- [Release Management](/docs/development/release-management/)
