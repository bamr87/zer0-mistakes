---
title: "Fleet Harmonization Audit — theme consistency across the nine downstream consumers"
description: "A ground-truth review of every repo that builds on zer0-mistakes: version pins, undocumented overrides, tooling bugs in the consumer-audit scripts, CI coverage gaps, and docs-vs-reality drift, verified against the live repos."
date: 2026-08-18
lastmod: 2026-08-18
categories: [docs]
tags: [audit, consumers, propagation, harmonization, retrospective]
author: bamr87
---

# Fleet Harmonization Audit (August 2026)

A point-in-time, ground-truth review of every repo building on `bamr87/zer0-mistakes`
(theme at `v1.28.0`), commissioned to identify differences, issues, inconsistencies,
and improvements across the fleet and propose a harmonization plan. It complements
[`theme-propagation.md`](./theme-propagation.md) (how the system is *supposed* to
work) with what was actually found on disk.

**Companion artifact (same content, designed for scanning):**
https://claude.ai/code/artifact/0d77e2c6-8f69-4bfd-83aa-d56ed00b4cf9

## Scope & method

Repos audited: the theme itself, plus its nine consumers —
`year-of-ai/year-of-ai.github.io`, `ai-world-view/ai-world-view.github.io`,
`bamr87/lifehacker.dev`, `bamr87/irony-works`, `bamr87/bashconsultants`,
`bamr87/it-journey`, `bamr87/zer0-pages`, `bamr87/zer0-pages-remote`,
`bamr87/wargames`.

Two passes: (1) direct deterministic verification — running this repo's own
`scripts/bin/audit-consumer` against every consumer, cross-checked with raw
`grep`/`diff`/`git log` against every config, `Gemfile`, and `Gemfile.lock` in the
fleet; (2) a ten-agent independent re-derivation pass (one per consumer plus one
cataloguing the theme's own test suite/instructions/propagation tooling), each
tasked to re-verify every claim from pass one from scratch — reading real file
diffs for every flagged override, downloading and inspecting a published gem to
confirm one drift claim, tracing Liquid include chains to confirm functional
impact rather than assume it. Corrections an agent found are reported as the
finding, not the original guess.

Citations below include file:line where useful — treat them as pointers to
re-verify, not permanent addresses; several will drift as each repo evolves.

## TL;DR

- **4 of 9 consumers are invisible to `_data/consumers.yml`** — `irony-works`,
  `zer0-pages`, `zer0-pages-remote`, `wargames` get no dispatch, no drift report,
  no risk tracking, ever.
- **0 of 9 consumers have adopted `templates/consumer/`** (`theme-bump.yml`,
  `bump-theme-pins.sh`, `.theme-overrides.yml`) — the self-service bump pipeline
  this repo built exists on one side of a conversation nobody joined.
- **`detect_consumer_mode()` misclassifies 6 of 9 consumers as `gem` mode**
  because their `_config.yml` uses padded key-alignment YAML — confirmed
  independently against six repos — which silently skips the required-plugin
  check wherever it fires.
- **`audit-consumer --format json` emits invalid JSON** (trailing comma before
  the closing bracket) — unusable for CI without a workaround.
- **The theme's own homepage JSON-LD describes the theme, not the consumer** —
  live today on bashconsultants.com, whose structured data currently claims a
  Denver IT-consulting practice is a free, open-source Ruby gem.
- **Two org hubs (year-of-ai, ai-world-view) run zero pre-merge validation**
  of their own themed Jekyll build, while fanning their pin out to a dozen-plus
  member repos each.
- **Real version drift**: both hubs pinned `@v1.26.0` (2 minors stale);
  `zer0-pages` resolves gem `1.25.0` (3 minors stale) though its own Gemfile
  constraint already permits `1.28.0`; `bashconsultants`' dev Gemfile runs a
  path-gem workaround whose stated justification was verifiably obsolete
  roughly nine releases ago.
- **`consumers.yml`'s own risk prose has drifted from the code it describes** —
  it-journey's entry claims "~55 shadowed files … ~75 lines of !important CSS
  working around #338"; the theme's own audit tool finds 2–3 real shadow files,
  31 `!important` lines, and no substantiable reference to a fix numbered #338
  inside that repo.

## A. Harmonization infrastructure

| # | Finding | Severity |
|---|---|---|
| A1 | `_data/consumers.yml` registers 5 of 9 real consumers. `irony-works`, `zer0-pages`, `zer0-pages-remote`, `wargames` are absent — confirmed by direct grep, independently re-confirmed by four separate agents auditing those repos. | Critical |
| A2 | Even inside the 5 registered consumers, only 3 (`bashconsultants`, `year-of-ai`, `ai-world-view`) carry `dispatch: true`. `propagate-theme.yml`'s release-triggered job only reaches those three; the rest depend entirely on a consumer-side `theme-bump.yml` cron nobody has installed (A3). | Medium |
| A3 | Zero of the 9 consumers have copied any of `templates/consumer/theme-bump.yml`, `bump-theme-pins.sh`, or `.theme-overrides.yml`. Every override found in Section E is undocumented for exactly this reason — there's nowhere in any consumer to document it. | Critical |

**Recommendation:** add the four missing repos to `consumers.yml` (this audit's
inventory table below is a ready-made source; note `zer0-pages`' `gem` mode and
`pages/` source root explicitly). Land `.theme-overrides.yml` in `irony-works`,
`bashconsultants`, `it-journey`, and `zer0-pages` first — pure documentation,
zero workflow risk, and every override in Section E already has a verified
reason to write down.

## B. Bugs in the theme's own audit & propagation scripts

| # | Finding | Evidence | Severity |
|---|---|---|---|
| B1 | `detect_consumer_mode()` (`scripts/lib/audit.sh:208`) runs `grep -qE '^remote_theme:'` — anchored, no whitespace tolerated before the colon. Six of nine consumers write padded, column-aligned config (`remote_theme             : "..."`). Reproduced live against `wargames/_config.yml:44`, `year-of-ai/_config.yml:40`, `ai-world-view/_config.yml:35`, `lifehacker.dev/_config.yml:40`, `bashconsultants/_config.yml:31`, `it-journey/_config.yml:36` — every one reports `Detected mode: gem`; none are gem-mode sites. `classify_plugin()` only runs the required-plugin check when mode is exactly `remote_theme`, so this silently skips that check fleet-wide. | reproduced independently 6×; fix is `^remote_theme\s*:` or a real YAML parse | High |
| B2 | `print_classification()`'s JSON branch (`audit.sh:279`) unconditionally appends a trailing comma after every entry; the last entry always leaves a dangling comma before the closing `]}`. Confirmed via `python3 -m json.tool` and `jq` against three independent runs — both reject it. | `--format json` unusable for CI parsing | High |
| B3 | `audit-consumer` has no `source:` awareness. `zer0-pages` sets `source: pages`; run the tool at the repo root and it reports a false "0 overrides, 0 unique, no plugin issue." Point it at `pages/` and the real picture appears (2 overrides, 137 identical vendored files, a real plugin gap). | — | Medium |
| B4 | The required-plugin rule contradicts its own documentation. `_data/theme-manifest.yml:26-29`: "consumers using remote_theme MUST vendor locally … `_plugins/obsidian_links.rb`" — unconditional. `.github/instructions/obsidian.instructions.md` calls the same file "Server plugin (opt-in) … skipped under the `github-pages` gem." `audit-consumer` enforces the manifest's unconditional version: fired as a false positive on a bare demo site with zero Obsidian content (`zer0-pages-remote`), and is dubious for a consumer that resolves all wikilinks before Jekyll runs (`irony-works`). | — | Medium |

## C. What the theme itself ships onto every consumer

| # | Finding | Severity |
|---|---|---|
| C1 | `_includes/content/jsonld-software.html`, wired unconditionally into `core/head.html:127` (gated only on `page.permalink == "/"`), emits `SoftwareApplication` JSON-LD naming the theme's own GitHub repo, RubyGems page, and install URL, mixed with the consumer's own `site.title`. The include's header comment says its purpose is to describe "the zer0-mistakes Jekyll theme as a SoftwareApplication entity" — clearly meant for the theme's own demo site, shipped by default to everyone's homepage. **Live today**: bashconsultants.com never overrode this include; its homepage structured data currently asserts a Denver IT-consulting practice is a free, MIT-licensed, RubyGems-distributed developer tool. | High |
| C2 | CLAUDE.md's Essential Commands still list `installation` as a `test/test_runner.sh` suite; `test_runner.sh`'s own comment says it "was also retired after its scenarios were ported into `test_install_legacy_flags.sh`." Running it today exits 1, "Unknown test suite." | Low |
| C3 | `assets/images/wizard-on-journey.png` is actually WebP data (`file(1)`-confirmed), mislabeled with a `.png` extension, and pinned as canonical in `theme-manifest.yml:505`. Harmless, but it's the same path `bashconsultants` coincidentally reused for its own real asset — the source of a false "override" flag in Section E. | Low |

## D. Version drift

| Repo | File | Pin | Minors behind v1.28.0 | Note |
|---|---|---|---|---|
| year-of-ai.github.io | `_config.yml` | `@v1.26.0` | 2 | fans this pin out to every provisioned member via `_data/hub.yml` |
| year-of-ai.github.io | `_config_dev.yml` | unpinned | — | local dev floats HEAD; can diverge silently from prod |
| ai-world-view.github.io | `_config.yml` | `@v1.26.0` | 2 | same hub shape; fans out to 3 member repos today |
| bashconsultants | `_config.yml` | `@v1.26.0` | 2 | GitHub Pages stack |
| bashconsultants | `Gemfile.azure` | `~> 1.26.0` | 2 | Azure stack |
| bashconsultants | `Gemfile` | path gem | n/a | dev stack; workaround comment confirmed obsolete — downloaded and inspected the actual published `1.26.0` gem, which already contains the "admin includes" the comment says to wait for (shipped ~v0.22.10, April 2026) |
| zer0-pages | `Gemfile.lock` | `1.25.0` | 3 | Gemfile constraint (`~> 1.25`) already permits `1.28.0` — nothing blocks a `bundle lock --update` today |
| lifehacker.dev / it-journey / irony-works / wargames / zer0-pages-remote | `_config.yml` | unpinned | — | floating on `main`; see CI coverage (G) for what compensates, if anything |

Five consumers float with no version string anywhere. That's a legitimate design
choice only where it's paired with a compensating control — `lifehacker.dev`'s
nightly fresh-clone rebuild, or `it-journey`'s PR-gated cross-platform build.
For `irony-works`, `wargames`, and `zer0-pages-remote` it's simply the default
nobody revisited, with a weaker (push-to-main-only, or no Gemfile at all)
safety net underneath.

## E. Undocumented overrides, judged individually

Every file `audit-consumer` flags `DIFFERS_UNJUSTIFIED` was diffed against the
theme's copy, not just counted.

| Repo | File | Verdict | Why |
|---|---|---|---|
| irony-works | `_layouts/section.html` | legit — content model | full rewrite for a data model (Alanis-gate irony entries) the theme's news-section layout has no concept of |
| irony-works | `_includes/components/cookie-consent.html` | legit — policy | site sets no cookies; stub self-documents its own removal condition |
| irony-works | `_includes/custom/head.html` | legit — by design | the theme's own stub literally instructs consumers to shadow this file |
| bashconsultants | `_layouts/landing.html` | legit — brand | bespoke marketing homepage, not a patch over the generic template |
| bashconsultants | `_includes/analytics/google-tag-manager-head.html` | legit — policy | GTM deliberately disabled fleet-wide; PostHog is the sole analytics tool |
| bashconsultants | `_includes/analytics/posthog.html` | **retirable** | full fork of a privacy fix the theme has since upstreamed as `posthog.privacy.*` config keys — delete the fork, adopt the keys |
| bashconsultants | `assets/images/wizard-on-journey.png` | legit — coincidence | real, unrelated 2.4MB brand asset sharing a path with the theme's own (mislabeled, see C3) mascot image |
| it-journey | `_includes/content/giscus.html` | legit — real bug | fixes a genuine Liquid-inside-HTML-comment build break; one of its two stated reasons is itself wrong (references a gem pin this repo doesn't have) |
| it-journey | `assets/js/particles-source.js` | **retirable** | byte-identical to the theme copy except one missing tracking comment — stale duplicate, not a customization |
| zer0-pages | `_includes/content/intro.html` | legit, wrong stated reason | cited bug #293 shipped fixed in v1.26.0; fork survives only because this repo is locked to pre-fix `1.25.0` |
| zer0-pages | `_includes/obsidian/full-graph.html` | stale, not safe to drop | cited bug #294 also fixed in v1.26.0, but the fork has since drifted into an entire older graph-page design; dropping it outright would break the graph on this repo's actually-locked `1.25.0` gem |

`lifehacker.dev`'s two additive includes (`_includes/home/card.html`,
`home/cover.html`) don't shadow any theme file at all — the theme has no
`_includes/home/` — so they're not listed above; see Section I for why they're
worth a second look anyway.

## F. Data-contract consistency

`remote_theme` ships no `_data`; every consumer is expected to supply its own
`navigation/`, `ui-text.yml`, `theme_skins.yml`, `theme_backgrounds.yml`,
`authors.yml`.

| Repo | navigation | ui-text | skins | backgrounds | authors |
|---|:---:|:---:|:---:|:---:|:---:|
| year-of-ai / ai-world-view / lifehacker.dev | ✓ | ✓ | ✓ | ✓ | ✓ |
| zer0-pages (`pages/_data`) | ✓ | ✓ | ✓ | ✓ | ✓ |
| it-journey | ✓ | ✓ | — | — | — |
| wargames | ✓ | — | — | — | ✓ |
| bashconsultants | ✓ | — | — | — | — |
| irony-works | ✓ | — | — | — | — |
| zer0-pages-remote | — | — | — | — | — |

Traced what a missing file actually does, rather than assuming:

- **skins & backgrounds** — not a defect anywhere. `theme-customizer.html`
  explicitly falls back to a compiled skin registry because `remote_theme`
  can't ship `_data`. Working as designed.
- **ui-text.yml** — low impact where missing. Every sampled `ui.*` reference in
  the always-on includes chains a `default: "…"` filter, degrading to hardcoded
  English rather than blank text.
- **authors.yml** — the one real, visible break. Traced on **bashconsultants**,
  which sets `author:` front matter on every post: with no `authors.yml`,
  `is_known` is always false, so every post's "About the author" section
  renders a bare name string, a generic fallback icon, and no bio — on every
  article of a real customer-facing site.

## G. CI build coverage

| Repo | Pre-merge build gate? | What actually runs it |
|---|---|---|
| lifehacker.dev | Yes | `pipeline.yml` (required `verify`) + `nightly.yml` fresh uncached theme clone specifically to catch upstream drift — has a documented incident (1,987 phantom broken links from a theme `_data` change) proving the nightly job earns its keep |
| it-journey | Yes | `build-validation.yml`, cross-platform (Docker + 3 OS) |
| bashconsultants | Yes | `build-validate.yml` builds both Pages and Azure stacks on every PR; `site-health.yml` repeats nightly |
| zer0-pages-remote | Push-to-main only | `ci.yml` → shared `standard-ci.yml`; proven real by PR #8, which caught and fixed an actual `include_cached` failure |
| irony-works | Push-to-main only | `publish.yml` builds via `actions/jekyll-build-pages` after merge — a broken build ships before anyone finds out |
| zer0-pages | Push-to-main only | `pages.yml` is the only workflow that runs a real themed build; no `pull_request` trigger exists for it |
| wargames | Push-to-main only | `jekyll-gh-pages.yml`, same shape |
| year-of-ai.github.io | **None** | zero workflows invoke `jekyll build`/`serve` anywhere; only downstream signal is an hourly Pages-liveness probe that doesn't even watch this repo's own site |
| ai-world-view.github.io | **None** | identical gap |

## H. Docs-vs-reality drift (condensed; full detail in the artifact)

- **year-of-ai / ai-world-view**: ai-world-view's CLAUDE.md still describes a
  single-member org; it has three. Its `_config_dev.yml` comment claims to
  disable `remote_theme` — it doesn't. Both hubs' "never float on HEAD" rule
  is scoped to `_config.yml`/`hub.yml` in the docs, but `_config_dev.yml`
  floats in both, unremarked.
- **lifehacker.dev**: entry-point table omits the fully-wired `theme-scout`
  agent; documented commit types cover barely half of what the log actually uses.
- **irony-works**: CLAUDE.md never mentions any theme-layer file; five exist.
- **bashconsultants**: "three build stacks" implied equally validated; CI only
  ever builds two. Gemfile's "ZERO VERSION PINS" philosophy is immediately
  contradicted by a hard local path pin, and cites a doc file that doesn't exist.
- **it-journey**: two whole collections (`_docs`, `_quickstart`) are documented
  but don't exist on disk or in config; a real collection (`_quest-reports`,
  117 files) isn't documented at all. `AGENTS.md`'s Ruby/Jekyll version claims
  are already known-stale per the repo's own quest-walkthrough ledger.
- **zer0-pages**: the headline override-justification claim is backwards — both
  cited bugs are documented as *fixed inside* the v1.26.0 release it cites as
  "still broken as of." The repo actually runs `1.25.0`, so the forks are real
  and needed, just not for the stated reason.
- **zer0-pages-remote**: CLAUDE.md is a mostly-unfilled scaffold — fair for a
  bare demo, but real.
- **wargames**: `AGENTS.md` is stale installer boilerplate that contradicts the
  repo's real structure on three points; CLAUDE.md gets all three right.

## I. Patterns worth propagating fleet-wide

- **Documented forks with an upstream issue number** (zer0-pages) — even with
  a now-outdated justification, this is exactly what `.theme-overrides.yml` is
  meant to formalize everywhere.
- **A fresh, uncached theme rebuild on a schedule** (lifehacker.dev's
  `nightly.yml`) — the only fleet mechanism that would catch an upstream break
  on a floating pin before a human does, with a real incident on record.
- **Filing theme bugs upstream instead of patching around them**
  (lifehacker.dev's and it-journey's `theme-scout` agents) — it-journey pairs
  each of its three CSS workarounds with a written upstream-fix proposal under
  `TODO/theme-issues/`.
- **Accessibility-conscious overrides** — lifehacker.dev's two additive
  includes add `role="img" aria-label` / `aria-hidden` handling the theme's
  own stock markup lacks; a candidate for upstreaming.
- **CODEOWNERS + branch protection paired together** (lifehacker.dev,
  it-journey) — makes "a bot's own PR can't approve itself" structural.
- **Cross-stack CI that builds every real deployment target**
  (bashconsultants' Pages + Azure gate).

## Recommended actions

**Quick, low-risk, high-signal**
1. Fix `detect_consumer_mode()`'s regex (B1) — one line, unblocks accurate
   plugin checks for 6 repos immediately.
2. Fix the trailing comma in `audit-consumer --format json` (B2) — one line.
3. Add the four unregistered repos to `consumers.yml` (A1) — note `zer0-pages`'
   `gem` mode and `pages/` source root explicitly.
4. `bundle lock --update jekyll-theme-zer0` in `zer0-pages` (D) — nothing is
   blocking except that nobody ran it.
5. Delete the retirable overrides: bashconsultants' `posthog.html` fork
   (adopt `posthog.privacy.*` instead) and it-journey's `particles-source.js`.

**Structural**
6. Land `.theme-overrides.yml` in irony-works, bashconsultants, it-journey,
   and zer0-pages (A3) — every override already has a verified reason.
7. Resolve the obsidian-plugin contradiction (B4) — gate the manifest
   requirement on actual wikilink usage, or stop calling the plugin optional.
8. Scope `jsonld-software.html` to the theme's own site (C1) — currently
   live and incorrect on at least one real consumer homepage.
9. Give year-of-ai and ai-world-view a real pre-merge `jekyll build` gate (G).
10. Regenerate `consumers.yml`'s prose risk notes from the audit tool's actual
    output rather than hand-maintained estimates that drift from the code.

**Worth a decision, not urgent**
11. Retire bashconsultants' obsolete path-gem dev workaround (D) — touches
    `docker-compose.yml`, `Dockerfile`, and an agent doctrine file.
12. Backfill `_data/authors.yml` on bashconsultants (F) — the one
    missing-data-file gap with a verified visible UX cost today.
