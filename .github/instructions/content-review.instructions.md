---
applyTo: "pages/**/*.md,.github/config/content_review.yml,.claude/agents/content-reviewer.md,scripts/content-review.rb,.github/workflows/ai-content-review.yml"
description: "Authoring + review-resolution rules for the AI content reviewer framework — SEO targets, content quality, and how to act on review feedback"
date: 2026-06-13T15:45:00.000Z
lastmod: 2026-06-13T15:45:00.000Z
---

# AI Content Review — Authoring & Resolution

This file governs the **AI content reviewer framework**: how content under
`pages/**` is reviewed on pull requests and how contributors (human or agent)
resolve the feedback. It is the prose contract behind three artifacts:

| Artifact | Role |
| --- | --- |
| [`scripts/content-review.rb`](../../scripts/content-review.rb) | Deterministic tier — frontmatter + SEO + structure, no API key |
| [`.claude/agents/content-reviewer.md`](../../.claude/agents/content-reviewer.md) | Claude Code agent tier — editorial / consistency / polish |
| [`.github/workflows/ai-content-review.yml`](../workflows/ai-content-review.yml) | Runs both tiers on every content PR |

Thresholds live in [`.github/config/content_review.yml`](../config/content_review.yml);
required front matter lives in
[`.github/config/frontmatter_schema.yml`](../config/frontmatter_schema.yml).
**Those configs win** — quote their numbers, don't invent new ones here.

### Thresholds are per collection

Quality and SEO limits are **derived per collection** from the site's
collections, not applied as one flat rule. The effective rules for a file are
`deep-merge(defaults, collections.<name>)` in `content_review.yml`, and each
collection names the governing instruction file(s):

| Collection | Lens | Also governed by |
| --- | --- | --- |
| `posts` | Full articles (≥300 words, preview image) | this file |
| `docs` | Public documentation | [`documentation.instructions.md`](documentation.instructions.md) |
| `quickstart` | Short action guides | [`documentation.instructions.md`](documentation.instructions.md) |
| `quests` | Long-form tutorials (≥400 words) | this file |
| `notes` / `hobbies` | Short-form (keywords optional) | this file |
| `notebooks` | Generated (relaxed prose checks) | this file |
| `about` / `pages` | Landing/profile (relaxed length) | this file |
| `pages/_docs/obsidian/**` | Vault content | [`obsidian.instructions.md`](obsidian.instructions.md) |

The numbers in §1–§2 below are the **defaults**; a collection may tighten or
relax them. Always grade a file by its own collection's effective values.

---

## 1. SEO targets (default — collections may override)

| Field | Target | Why |
| --- | --- | --- |
| `title` | 30–60 chars | Google truncates ~60; under 30 reads thin |
| `description` | 120–160 chars (optimal 120–155), complete sentence | Meta snippet / AI answer |
| `keywords` | 3–10 real search phrases (recommended) | AIEO discoverability |
| First ~100 words | Answer the page's implied question | Featured snippets / LLM answers |
| Headings | Phrased as the questions readers ask | Scannability + snippet capture |

See [`pages/_docs/seo/meta-tags.md`](../../pages/_docs/seo/meta-tags.md) and
[`pages/_docs/seo/aieo.md`](../../pages/_docs/seo/aieo.md) for the rendered
implementation.

### Pitfalls (do not repeat)
- ❌ Cutting a `description` mid-sentence to hit the cap — rewrite tighter.
- ❌ `keywords` used as a tag dump instead of searched phrases.
- ❌ `categories: blog` (bare string) — must be a YAML list `[blog]`.

---

## 2. Content quality (default — collections may override)

- **Word count**: 100–3500 words (posts ≥300, quests ≥400, notes ≥50, …).
  Split, don't trim meaningful content.
- **Headings**: ≥1 H2; never skip a level (no H2 → H4).
- **Code fences**: always language-tagged (```` ```bash ````, ```` ```ruby ````).
- **Images**: every image needs meaningful alt text.
- **Links**: descriptive text (never "click here"); no bare URLs in prose.
- **No placeholders**: strip TODOs, lorem ipsum, and dead links before merge.

---

## 3. Consistency & style

- Canonical casing (from `content_review.yml` → `style.terminology`):
  *GitHub*, *Jekyll*, *JavaScript*, *Markdown*, *front matter*, *Bootstrap 5*.
- Voice: second person, active, present tense for instructions.
- Reuse existing `categories`/`tags` taxonomy — grep before inventing new ones.
- Commands must match the repo's real tooling (Docker-first, `scripts/bin/*`,
  `bundle exec jekyll …`).

---

## 4. Scoring & severity

The deterministic tier scores each file 0–100 (`scoring` in the config):

| Score | Verdict | Action |
| --- | --- | --- |
| ≥ 90 | 🟢 excellent | merge |
| ≥ 70 | 🟡 acceptable | merge; address nits when convenient |
| < 70 | 🔴 needs work | fix before merge |

The agent tier tags findings 🔴 must-fix · 🟡 should-fix · 🔵 nice-to-have.
**Reviews advise; they do not auto-block merges** (`strictness.ci: warn`).

---

## 5. Resolving review feedback

Work in this order — cheapest, highest-impact first:

1. **Front matter** (missing required fields, list-vs-string, ISO dates).
2. **SEO** (title/description length, keywords).
3. **Structure** (headings, code-fence languages, alt text).
4. **Prose** (clarity, consistency, accuracy).

Then re-run locally before pushing:

```bash
ruby scripts/content-review.rb --files pages/_<collection>/path/to/file.md
# or everything changed vs main:
ruby scripts/content-review.rb --changed --base origin/main
```

Always update `lastmod` on any file you edit.

---

## 6. Out of scope (open a separate PR)

- ❌ Editing the reviewer itself (`scripts/content-review.rb`,
  `.claude/agents/content-reviewer.md`, the workflow) inside a content PR.
- ❌ Code/theme bugs — note them under "Out of scope" and use `/code-review`.
- ❌ Renaming/restructuring directories or changing permalinks in bulk.

---

## 7. Running it manually

```bash
# Deterministic tier on whatever changed vs main:
ruby scripts/content-review.rb --changed --base origin/main

# Full editorial pass (Claude Code), via the reusable prompt:
/content-review
```
