---
name: validate-build
description: "**WORKFLOW SKILL** — Validate a Zer0-Mistakes change before commit/release. USE FOR: pre-commit checks, pre-PR verification, debugging a broken build, confirming theme/include/layout/Sass/Obsidian changes work end-to-end, smoke-testing the gem, reproducing CI failures locally. INVOKES: docker-compose, bundle exec jekyll, yamllint, markdownlint, the project test runners under test/. DO NOT USE FOR: actual releases (use the commit-publish prompt) or one-off `jekyll build` invocations where you already know what to run."
---

# Validate Build

Run the standard Zer0-Mistakes pre-commit / pre-release validation pipeline. Mirrors the checks performed by CI and by [`commit-publish.prompt.md`](../../prompts/commit-publish.prompt.md) — use this any time you want confidence that a change is shippable, without going through the full release workflow.

## When to use

- Before staging a commit that touches `_layouts/`, `_includes/`, `_sass/`, `_plugins/`, `assets/`, or any Obsidian integration file.
- Before opening a PR.
- After pulling `main` to confirm the local environment still builds.
- To reproduce a failing CI check locally.

## Prerequisites

```bash
# Docker must be running (the canonical Jekyll environment).
docker-compose ps

# If the jekyll service isn't up, start it (detached) and give it a moment to boot.
docker-compose up -d jekyll
```

If you don't have Docker available, fall back to `bundle exec jekyll …` for the Jekyll steps; everything else runs on the host.

## Validation pipeline

Run these in order. **Stop at the first failure** — fix it before continuing, otherwise downstream errors will be misleading.

### 1. YAML configs parse

```bash
ruby -ryaml -e "
  YAML.load_file('_config.yml')
  YAML.load_file('_config_dev.yml')
  puts '✓ YAML configs valid'
"
```

### 2. Jekyll build (production + dev configs layered, matches CI)

```bash
docker-compose exec -T jekyll bundle exec jekyll build \
  --config '_config.yml,_config_dev.yml'
```

This is the primary check. A green build catches Liquid syntax errors, missing includes, broken front matter, Sass compile errors, and (via `_plugins/`) most Obsidian regressions.

### 3. Jekyll doctor

```bash
docker-compose exec -T jekyll bundle exec jekyll doctor
```

Surfaces config drift, conflicting URLs, and deprecated options.

### 4. Compiled assets exist

```bash
test -s _site/assets/css/main.css       && echo "✓ main.css"
test -s _site/assets/data/wiki-index.json && echo "✓ wiki-index.json"
test -s _site/feed.xml                  && echo "✓ feed.xml"
test -s _site/sitemap.xml               && echo "✓ sitemap.xml"
```

### 5. Obsidian integration (only if you touched it)

If your diff touches `_plugins/obsidian_links.rb`, `assets/js/obsidian-*.js`, `assets/data/wiki-index.json`, `_includes/content/backlinks.html`, or anything under `pages/_docs/obsidian/`:

```bash
./test/test_obsidian.sh
```

This runs the Ruby converter unit tests, the JS resolver unit tests, **and** the build smoke test in one orchestrated suite.

### 6. Theme test runner (only for layout/include/script/test changes)

```bash
./test/test_runner.sh
# or, for the unified runner (lib + theme + integration):
./scripts/bin/test
```

### 7. Linters (advisory)

These are advisory in this project (not enforced by CI on every PR), but worth running when you've added documentation or workflows:

```bash
markdownlint "**/*.md" --ignore node_modules || true
yamllint -c .github/config/.yamllint.yml . || true
```

## Quick "is everything green?" one-liner

```bash
docker-compose exec -T jekyll bundle exec jekyll build \
  --config '_config.yml,_config_dev.yml' \
  && docker-compose exec -T jekyll bundle exec jekyll doctor \
  && ./test/test_obsidian.sh \
  && echo "✅ Validation passed"
```

## Reporting back to the user

After running the pipeline, summarize as a small table:

| Check | Status |
| --- | --- |
| YAML configs | ✅ / ❌ |
| Jekyll build | ✅ / ❌ |
| Jekyll doctor | ✅ / ❌ |
| Compiled assets | ✅ / ❌ |
| Obsidian tests (if relevant) | ✅ / ❌ / ⏭ skipped |
| Theme tests (if relevant) | ✅ / ❌ / ⏭ skipped |

If any check failed, include the first ~20 lines of the failure output and stop — do not attempt unrelated fixes in the same pass.

## Common failure patterns

- **`Liquid Exception: undefined variable …`** — usually a missing front matter field or a typo'd include parameter. Run with `--verbose --trace` to find the file.
- **`Conversion error: Jekyll::Converters::Scss …`** — Sass partial naming mismatch (case-sensitive on CI; see [`.github/instructions/sass.instructions.md`](../../instructions/sass.instructions.md)).
- **`wiki-link target collision`** — informational, not a failure. Add an `aliases:` entry to disambiguate.
- **`docker-compose: command not found`** or container exits immediately — run `docker-compose down -v && docker-compose up -d --build` to rebuild from scratch.
