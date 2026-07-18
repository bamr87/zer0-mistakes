---
applyTo: "fr/**,_data/i18n/**,scripts/translate.rb,_includes/core/i18n.html,_includes/core/hreflang.html,_includes/components/language-toggle.html,_includes/components/translation-notice.html,.github/workflows/translate.yml"
description: "Multilingual translation pipeline — generated-content rules, English source of truth, provider contract"
date: 2026-07-17T00:00:00.000Z
lastmod: 2026-07-17T00:00:00.000Z
---

# Multilingual Translation — generated content rules

Full architecture: [`docs/systems/multilingual-translation.md`](../../docs/systems/multilingual-translation.md). Feature: ZER0-078.

## Hard rules

1. **Never hand-edit generated files.** `fr/**` (and any future `<lang>/**` output root), `_data/i18n/<lang>.yml`, and `_data/i18n/manifest.yml` are build artifacts owned by `scripts/translate.rb` via the Translate workflow. To change a translation, change the **English source** (`pages/**`, `_data/ui-text.yml` `en`) and let the workflow regenerate. A hand edit will be silently overwritten by the next run.
2. **English is the only source language.** Do not add hand-written language blocks back into `_data/ui-text.yml` — alternates live in generated `_data/i18n/<lang>.yml`. The one hand-maintained file under `_data/i18n/` is `languages.yml` (native display names — configuration, not content).
3. **Generated translations never ride in feature PRs.** They arrive exclusively through the workflow's `chore/i18n-translations` PR, like other generated data (`content_statistics.yml`, roadmap README).
4. **UI strings go through `ui`.** Any include/layout needing a translatable label must resolve it via `{% include core/i18n.html %}` (giving the `ui` variable) with an English literal in `| default:`, and add the key to `_data/ui-text.yml` `en`. Never read `site.data.ui-text[...]` directly.
5. **`include_cached` callers must pass `lang`.** A cached include that renders `ui` strings must be invoked as `{% include_cached foo.html lang=page.lang %}` so each language gets its own cache entry — otherwise one language's chrome leaks into the other.
6. **Keep the provider contract intact.** `scripts/translate.rb` is stdlib-only Ruby (no new gems — `Gemfile` is CODEOWNERS-owned) and must preserve: OAuth precedence (`CLAUDE_CODE_OAUTH_TOKEN` → `ANTHROPIC_AUTH_TOKEN` → `ANTHROPIC_API_KEY`), the Claude Code identity as the first system block in OAuth mode, `⟦N⟧` placeholder masking with set-equality validation, and single-line segment output (the markdown-oneline CI check depends on it).
7. **Tests are offline.** `test/test_i18n.sh` (suite `i18n`) uses `--provider stub`; never add a test that performs a real API call.

## When changing the pipeline

- Any change to segmentation, masking, or the prompt should bump `PROMPT_VERSION` in `scripts/translate.rb` and be verified with `./test/test_i18n.sh` plus a `--dry-run` against the real repo.
- Any change to URL resolution must be re-verified against a real Jekyll build (the utility mirrors this repo's observed Jekyll 3.10 behavior: explicit front-matter `permalink` wins, else the collection template — front-matter *defaults* permalinks do not apply to collection documents).
- New languages: config + `languages.yml` + dispatch `mode=full` (see the systems doc).
