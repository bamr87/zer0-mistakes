---
title: "Test Coverage Baseline"
description: "Structural coverage baseline recorded as part of T-005. Identifies the three lowest-covered subsystems and links to the follow-up backlog tasks."
date: 2026-06-02T00:00:00.000Z
lastmod: 2026-06-02T00:00:00.000Z
categories: [docs]
tags: [development, testing, coverage]
author: agent
---

# Test Coverage Baseline — 2026-06-02

Recorded as part of T-005. The v1.0 milestone targets ≥90% automated test
coverage. This document establishes the baseline from which that goal is
measured and identifies the subsystems that need the most attention.

## How coverage is estimated here

Ruby and shell have no off-the-shelf combined coverage tool in this repo.
Coverage is estimated **structurally**: for each source module we count
(a) the dedicated test files that reference it and (b) the number of
exercisable code paths (functions / methods). A subsystem with zero dedicated
test files and ≥1 function is rated "uncovered".

`./scripts/bin/test` results as of this baseline: **7 of 10 suites pass** (3
pre-existing failures in `test_core.sh` — theme-version auto-detection,
mermaid, and main-docs path — are tracked separately).

---

## Subsystem inventory

### 1 · Obsidian integration — HIGH coverage ✅

| Source | Lines | Functions/methods |
|--------|------:|------------------:|
| `_plugins/obsidian_links.rb` | 475 | ~20 |
| `assets/js/obsidian-wiki-links.js` | — | — |

**Dedicated tests:** `test/test_obsidian.sh` (orchestrator), `test/test_ruby_converter.rb` (56 assertions), `test/test_resolver.js`

All three rendering paths (Ruby converter → JSON index → JS resolver) have
dedicated unit tests plus a build smoke test. This is the best-covered
subsystem in the repo.

---

### 2 · Modular installer — MODERATE coverage ⚠️

| Source | Lines | Functions |
|--------|------:|----------:|
| `scripts/lib/install/agents.sh` | 166 | — |
| `scripts/lib/install/config.sh` | 56 | — |
| `scripts/lib/install/doctor.sh` | 301 | — |
| `scripts/lib/install/fs.sh` | 52 | — |
| `scripts/lib/install/logging.sh` | 33 | — |
| `scripts/lib/install/pages.sh` | 255 | — |
| `scripts/lib/install/platform.sh` | 71 | — |
| `scripts/lib/install/profile.sh` | 113 | — |
| `scripts/lib/install/template.sh` | 138 | — |
| `scripts/lib/install/upgrade.sh` | 184 | — |
| `scripts/lib/install/wizard_interactive.sh` | 189 | 4 |

**Dedicated tests:** `test/test_installer.sh` (profile matrix, deploy
plug-ins, agent files), `test/test_install_*.sh` (6 focused suites)

The happy paths for `init` profiles and deploy/agent plug-ins are well-covered
via `test_installer.sh`. However:

- **`wizard_interactive.sh`** (189 lines, 4 exported functions) is exercised
  only when `OPENAI_API_KEY` is set (the `--ai` tier of `test_installer.sh`).
  The interactive prompt helpers (`_wiz_prompt`, `_wiz_confirm`, `_wiz_choose`)
  and `wizard_interactive_run` have **zero CI coverage**.
- **`upgrade.sh`** (184 lines) — only one test file contains the keyword and
  that reference is incidental. The migration/upgrade path for an existing site
  has no dedicated assertions.

---

### 3 · Jekyll plugins (non-Obsidian) — NO coverage ❌

| Source | Lines | Methods |
|--------|------:|--------:|
| `_plugins/preview_image_generator.rb` | 350 | 17 |
| `_plugins/content_statistics_generator.rb` | 69 | 1 |
| `_plugins/admin_page_urls.rb` | 16 | — |
| `_plugins/theme_version.rb` | 88 | — |
| **Total** | **523** | **≥18** |

**Dedicated tests:** none.

These four plugins run on every `jekyll build` and are invoked indirectly by
build smoke tests. But none have a unit-test file. Bugs in
`preview_image_generator.rb` (the largest at 350 lines) or
`content_statistics_generator.rb` are only caught when a full Jekyll build
fails, which makes diagnosis slow and regression detection unreliable.

---

### 4 · Release tooling (migrate + changelog) — NO coverage ❌

| Source | Lines | Functions |
|--------|------:|----------:|
| `scripts/lib/migrate.sh` | 265 | 5 |
| `scripts/lib/changelog.sh` | 352 | 5 |
| **Total** | **617** | **10** |

**Dedicated tests:** none.

`migrate.sh` handles site upgrade/migration between theme versions
(`detect_jekyll_site`, `validate_theme_connection`, `install_admin_pages`,
`verify_admin_pages`, `detect_version_gap`). `changelog.sh` generates and
updates `CHANGELOG.md` entries (`categorize_commit`, `clean_commit_message`,
`generate_changelog`, `update_changelog_file`, `extract_release_notes`).
Both are used by the release pipeline but have **zero automated assertions**.

---

### 5 · Core scripts (common, validation, version, gem, git) — PARTIAL coverage ⚠️

Referenced by 6+ test files each. Exercised indirectly through install and
deployment tests. No dedicated unit-test file.

---

### 6 · SCSS / assets — INDIRECT coverage ⚠️

Tested via Playwright smoke + snapshot tiers (CSS load, Bootstrap token
assertions, visual regression). No SCSS unit tests.

---

### 7 · Layouts / includes — INDIRECT coverage ⚠️

Front-matter validated by `test_core.sh`; layout rendering confirmed by Jekyll
build smoke tests. Playwright smoke tier checks live DOM.

---

## 🔴 Three lowest-covered subsystems

| Rank | Subsystem | Source lines | Dedicated tests | New backlog task |
|------|-----------|-------------:|-----------------|-----------------|
| 1 | Jekyll plugins (non-Obsidian) | 523 | 0 | T-011 |
| 2 | Release tooling (migrate + changelog) | 617 | 0 | T-012 |
| 3 | Installer interactive wizard + upgrade path | 373 | ~0 in CI | T-013 |

Follow-up tasks T-011, T-012, and T-013 have been filed in `_data/backlog.yml`.

---

## Methodology notes

- Line counts taken from `wc -l` on 2026-06-02; may drift as files change.
- "Dedicated tests" = test files that explicitly import, source, or name the
  module under test (verified with `grep -l`).
- Indirect coverage (a module called by a higher-level test but not directly
  asserted) is noted but not counted as "covered" for baseline purposes.
- This baseline does not produce a numeric percentage because no
  line-instrumentation tool is wired into the CI pipeline yet. The follow-up
  tasks (T-011–T-013) address the identified gaps; a future task should wire
  up `simplecov` (Ruby) and `bashcov`/`kcov` (shell) to produce percentage
  reports.
