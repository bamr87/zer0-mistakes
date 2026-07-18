---
title: "Multilingual Translation System"
description: "Build-time AI translation pipeline: English stays the only human-maintained language while scripts/translate.rb (Claude Code OAuth) generates alternate-language pages, UI strings, and the manifest behind the language toggle."
date: 2026-07-17T00:00:00.000Z
lastmod: 2026-07-17T00:00:00.000Z
categories: [docs]
tags: [systems, automation, i18n]
author: bamr87
---

# Multilingual Translation System

The zer0-mistakes multilingual system (ZER0-078) generates alternate-language versions of the site from the English source at build time, instead of storing hand-written translations in the repository. English is the only human-maintained language; every other language is a **build artifact** produced by an AI translation utility and committed by automation.

## Design constraints

- **GitHub Pages safe mode.** Production builds on the classic GitHub Pages pipeline, where custom `_plugins/` never run. Translated pages therefore must exist as real committed files that plain Jekyll can render — the "build step" that creates them is a CI job, not a Jekyll plugin.
- **No hand-maintained translations.** The former `_data/ui-text.yml` es/fr/de/ar blocks were removed. Nobody edits French by hand; you edit the English source and the pipeline regenerates the alternates.
- **Markdown must survive.** Generated files must pass the same checks as human content (markdown-oneline CI, Liquid parsing, front-matter validity) and never corrupt code blocks, Liquid tags, wiki-links, or URLs.

## Components

| Piece | Path | Role |
| --- | --- | --- |
| Translation utility | `scripts/translate.rb` | Ruby-stdlib CLI: discovers English sources, translates via Claude, writes generated output + manifest |
| Workflow | `.github/workflows/translate.yml` | The "one large translation job" (`workflow_dispatch`, mode=full) + incremental runs on pushes that change English content; proposes output as a PR |
| Generated pages | `fr/**` | Plain Jekyll pages, one per translated source, explicit `permalink: /fr<en-url>` |
| Generated UI strings | `_data/i18n/<lang>.yml` | Machine-translated copy of `_data/ui-text.yml` `en` |
| Manifest | `_data/i18n/manifest.yml` | en URL → per-language `{url, path, sha}`; drives the toggle, hreflang, and incremental change detection |
| Language metadata | `_data/i18n/languages.yml` | Hand-maintained native display names (config, not content) |
| String resolver | `_includes/core/i18n.html` | Sets `ui` per page language: generated `_data/i18n/<lang>.yml` for translations, `ui-text.yml` for English |
| Language toggle | `_includes/components/language-toggle.html` | Navbar dropdown: active language, links to existing translations, disabled entries otherwise; remembers the pick in `localStorage("zer0-lang")` |
| hreflang | `_includes/core/hreflang.html` | `<link rel="alternate" hreflang>` pairs + `x-default` on every translated page and its English original |
| Disclosure | `_includes/components/translation-notice.html` | Banner on machine-translated pages linking back to the original |
| Tests | `test/test_i18n.sh` | Offline (stub-provider) pipeline suite, registered as the `i18n` suite in `test_runner.sh` |

## How translation works

1. **Discovery** — `translation.sources` in `_config.yml` lists the English roots (`pages/_posts`, `_docs`, `_about`, `_quickstart`, `_notes`). Files with `published: false`, `translate: false`, or a non-English `lang` are skipped.
2. **Change detection** — each source's SHA-256 is compared with the manifest; only new/changed files (or everything with `--full`) are translated. Deleted sources have their generated outputs pruned.
3. **URL mapping** — the utility resolves each source's English URL the same way Jekyll 3.10 does for this repo (explicit front-matter `permalink`, else the collection's permalink template), verified against a real build. The translation's permalink is `/<lang><en-url>`.
4. **Segmentation & masking** — the body is split per line (the house "one paragraph per line" rule makes lines ≈ paragraphs). Fenced code, `{% highlight %}`/`{% raw %}` regions and front matter are never sent. Inline code, Liquid tags, wiki-links, HTML tags, autolinks and link destinations are masked as `⟦N⟧` placeholders.
5. **Translation call** — segments go to the Claude Messages API as a JSON map; the model returns the same map with translated values. Front-matter fields (`title`, `description`, `excerpt`, …) ride along as `fm:` segments; UI strings as `ui:` segments.
6. **Validation** — a response must echo every key, keep values single-line, and preserve the exact placeholder set; a failing chunk is retried once with a corrective note, then that file is marked failed (the English page simply stays untranslated — the site never breaks).
7. **Write-out** — the generated page copies the source front matter (minus `permalink`, `redirect_from`, `aliases`, …), swaps in translated fields, and adds `lang`, `permalink`, `translation_of`, `translation_source_url`, `machine_translated: true`. Front-matter defaults for the `fr/` tree in `_config.yml` supply layouts (`article` for posts, `note` for notes, `default` otherwise).

## Authentication (Claude Code OAuth)

The provider mirrors the chat proxy (`templates/deploy/chat-proxy/worker.js`), in precedence order:

1. `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`) — `Authorization: Bearer` + `anthropic-beta: oauth-2025-04-20`, with the Claude Code identity as the first system block (required for OAuth tokens).
2. `ANTHROPIC_AUTH_TOKEN` — same Bearer/OAuth headers.
3. `ANTHROPIC_API_KEY` — standard `x-api-key`.

In CI the workflow reads the `CLAUDE_CODE_OAUTH_TOKEN` (or `ANTHROPIC_API_KEY`) repository secret and skips gracefully with a warning when neither exists (fork safety).

## Operating it

```bash
# The one large job: translate the whole site (run once, then as needed)
gh workflow run translate.yml -f mode=full

# Incremental top-up happens automatically on pushes to main that touch
# pages/** or _data/ui-text.yml (bounded to 50 jobs/run to cap spend).

# Local, offline (no API): deterministic stub provider
ruby scripts/translate.rb --provider stub --dry-run

# Targeted runs
ruby scripts/translate.rb --only "pages/_docs/quickstart" --langs fr
ruby scripts/translate.rb --check        # exit 1 if stale translations exist
```

The workflow never pushes to `main`; it opens/updates a PR on the stable branch `chore/i18n-translations` (same pattern as the roadmap sync). Merging that PR does not re-trigger the workflow — its push path filter watches only English sources.

## Adding a language

1. Add the code to `translation.languages` in `_config.yml` (e.g. `[fr, es]`).
2. Add a display-name entry to `_data/i18n/languages.yml` if missing.
3. Dispatch the Translate workflow with `mode=full` (optionally `languages: es` to backfill just the new one).

The toggle shows the new language immediately; pages render as disabled entries until their translations merge.

## Known limitations (v1)

- Navigation data files (`_data/navigation/*.yml`) and the landing page are not translated yet; the chrome around them is.
- Translated pages are plain pages, not collection documents: they don't appear in post listings, feeds, or `site.related_posts` (deliberate — English remains the canonical index), and collection-mode sidebars fall back to category mode.
- Wiki-links (`[[Page]]`) are preserved verbatim, so their display text stays English and they resolve to the English target.
- No automatic redirect by browser language — the toggle stores the preference but never navigates on its own.
