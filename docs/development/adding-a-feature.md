# Adding a Feature — Checklist

Use this checklist when adding a new feature to the Zer0-Mistakes framework. Each step ensures the feature is properly integrated with the schema system, testing, documentation, and CI pipeline.

## Checklist

### 1. Schema & Content Definition

- [ ] If the feature adds/requires new front matter fields, update the relevant `_data/schemas/*.yml`
- [ ] Add `feature_id: ZER0-XXX` to any schema fields the feature uses
- [ ] Update `frontmatter.json` if the new fields should appear in VS Code Front Matter CMS

### 2. Implementation

- [ ] Create/modify layout files in `_layouts/` with `@zer0-component` header
- [ ] Create/modify include files in `_includes/` with `@zer0-component` header
- [ ] Add any new SCSS styles to `_sass/` — use design token variables (`$zer0-*`) for colors/spacing instead of hardcoded values
- [ ] If adding new design tokens, update `_data/tokens/*.yml` and run `ruby scripts/generate-tokens.rb`

### 3. Feature Registry

- [ ] Add entry to `_data/features.yml` with:
  - `id: ZER0-XXX` (next available ID)
  - `title`, `description`, `version`, `tags`
  - `references` — all layout, include, style, script, and config files
  - `implemented: true`

### 4. Testing

- [ ] Add RSpec specs in the appropriate `spec/` subdirectory:
  - `spec/schemas/` — if new schema fields were added
  - `spec/features/` — for cross-reference validation
  - `spec/build/` — for build-time behavior
  - `spec/content/` — for content validation
  - `spec/integration/` — for end-to-end integration
  - `spec/tokens/` — if new tokens were added
- [ ] Run full suite: `bundle exec rspec`
- [ ] Add Playwright E2E tests in `e2e/tests/` if the feature has UI behavior

### 5. Documentation

- [ ] Add/update user-facing docs in `pages/_docs/`
- [ ] Add/update developer docs in `docs/` if needed
- [ ] Update `CHANGELOG.md` with the change

### 6. Verification

```bash
# Run all checks
bundle exec rspec --format documentation
ruby scripts/generate-tokens.rb --check
docker-compose exec -T jekyll bundle exec jekyll build --config '_config.yml,_config_dev.yml'
```

## Component Header Template

Every layout and include file should have this header:

```html
<!-- @zer0-component
  feature-id: ZER0-XXX
  type: layout|include
  dependencies: [ZER0-001, ZER0-YYY]
  schema-fields: [title, layout, custom_field]
  styles: [_sass/custom.scss]
-->
```

## Feature ID Assignment

Feature IDs are sequential: check the last ID in `_data/features.yml` and increment by 1.

Current range: `ZER0-001` through `ZER0-043+`
