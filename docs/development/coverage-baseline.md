---
title: "Test Coverage Baseline"
description: "Structural coverage baseline recorded as part of T-005. Identifies the lowest-covered subsystems and links to the follow-up backlog tasks."
date: 2026-06-12T00:00:00.000Z
lastmod: 2026-06-12T00:00:00.000Z
categories: [docs, development]
tags: [development, testing, coverage]
author: bamr87
---

# Test Coverage Baseline — 2026-06-12

Recorded as part of T-005 (Zer0-Mistake Quality Framework, roadmap v1.14;
coverage end-goal lives in the v3.0 LTS milestone: ≥90% automated coverage).
This document establishes the baseline from which that goal is measured and
identifies the subsystems that need the most attention.

## How coverage is estimated here

Ruby and shell have no off-the-shelf combined coverage tool in this repo.
Coverage is estimated **structurally**: for each source module we count
(a) the dedicated test files that reference it and (b) the number of
exercisable code paths (functions / methods). A subsystem with zero dedicated
test files and ≥1 function is rated "uncovered".

`./scripts/bin/test` results as of this baseline: **10 of 10 suites pass**,
and since T-012 the same suites gate every code PR in CI (no local/CI drift).

---

## Subsystem inventory

### 1 · Obsidian integration — HIGH coverage ✅

**Dedicated tests:** `test/test_obsidian.sh` (orchestrator),
`test/test_ruby_converter.rb` (23 runs / 70 assertions),
`test/test_resolver.js` (DOM-shim resolver suite)

All three rendering paths (Ruby converter → JSON index → JS resolver) have
dedicated unit tests plus a build smoke test asserting `wiki-index.json`
shape. Best-covered subsystem in the repo.

### 2 · Jekyll plugins — HIGH coverage ✅ *(was the #1 gap)*

**Dedicated tests:** `test/test_plugins.rb` (T-011), wired into the core
suite (`test_core.sh` → "Plugin Unit Specs"). The formerly-covered
`_plugins/preview_image_generator.rb` was removed as dead code (T-034) —
generation logic lives in `scripts/lib/preview_generator.py`.

| Source | Lines | Covered by |
|--------|------:|------------|
| `_plugins/content_statistics_generator.rb` | 69 | `test_plugins.rb` (script discovery incl. theme fallback) |
| `_plugins/theme_version.rb` | 88 | ❌ none — see T-019 |

### 3 · Release tooling — MODERATE coverage ⚠️ *(was the #2 gap)*

| Source | Lines | Covered by |
|--------|------:|------------|
| `scripts/lib/changelog.sh` | ~400 | `scripts/test/lib/test_changelog.sh` (categorization, message cleaning, Unreleased folding, insertion/normalization) |
| `scripts/lib/version.sh`, `gem.sh`, `git.sh`, `validation.sh` | — | `scripts/test/lib/test_*.sh` (84 assertions total incl. the T-015 locale guard) |
| `scripts/lib/migrate.sh` | 265 | ❌ none — see T-019 |

### 4 · Modular installer — MODERATE coverage ⚠️

**Dedicated tests:** `test/test_installer.sh` (profile matrix, deploy
plug-ins, agent files), `test/test_install_*.sh` (6 focused e2e suites,
all gating CI since T-012).

Remaining gaps (see T-020):

- **`scripts/lib/install/wizard_interactive.sh`** (189 lines): the prompt
  helpers and `wizard_interactive_run` have zero CI coverage (the `--ai`
  tier needs `OPENAI_API_KEY`; the interactive tier needs a TTY).
- **`scripts/lib/install/upgrade.sh`** (184 lines): the migration/upgrade
  path for an existing site has no dedicated assertions.

### 5 · Consumer audit tooling — MODERATE coverage ✅

`scripts/bin/{audit-consumer,manifest,sync-plugins}` + `scripts/lib/audit.sh`
are covered by `test/test_audit.sh` (18 assertions against gem/remote
fixtures), gating CI via the `audit` suite.

### 6 · SCSS / assets — INDIRECT coverage ⚠️

Playwright smoke tier asserts CSS load, Bootstrap tokens, and behavioral DOM
on every code PR. The pixel-snapshot tier exists but is warn-only until its
baselines are refreshed (T-013). No SCSS unit tests.

### 7 · Layouts / includes — INDIRECT coverage ⚠️

Front matter validated by `test_core.sh` and `scripts/lint-pages --strict`
(all 163 pages, schema-driven); rendering confirmed by Jekyll build smoke
tests; live DOM checked by the Playwright smoke tier (including the T-009
secret-exposure regression test).

---

## 🔴 Lowest-covered subsystems (filed as follow-up tasks)

| Rank | Subsystem | Source lines | Dedicated tests | Backlog task |
|------|-----------|-------------:|-----------------|--------------|
| 1 | `scripts/lib/migrate.sh` + `_plugins/theme_version.rb` | 353 | 0 | T-019 |
| 2 | Installer interactive wizard + upgrade path | 373 | ~0 in CI | T-020 |

(The previous baseline's #1 gap — Jekyll plugins, 523 lines / 0 tests — was
closed by T-011 on 2026-06-12; `changelog.sh` was closed by the
`test_changelog.sh` suite during the framework's first wave.)

---

## Methodology notes

- Line counts from `wc -l` on 2026-06-12; they drift as files change.
- "Dedicated tests" = test files that explicitly import, source, or name the
  module under test (verified with `grep -l`).
- Indirect coverage (a module called by a higher-level test but not directly
  asserted) is noted but not counted as "covered" for baseline purposes.
- No numeric percentage yet: no line-instrumentation tool is wired into CI.
  A future task should wire `simplecov` (Ruby) and `bashcov`/`kcov` (shell)
  to replace this structural estimate with measured percentages.
