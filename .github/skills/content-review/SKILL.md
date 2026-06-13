---
name: content-review
description: "**WORKFLOW SKILL** — Review new/changed Jekyll content (Markdown under pages/**) for SEO, consistency, polish, accessibility, and technical accuracy, using PER-COLLECTION thresholds. USE FOR: reviewing a content PR before merge, auditing a post/doc/quickstart/note you just wrote, pre-publish SEO + style checks, resolving AI-content-review feedback. INVOKES: scripts/content-review.rb (deterministic tier), the content-reviewer Claude Code agent, .github/config/content_review.yml, the per-collection .github/instructions/*.instructions.md. DO NOT USE FOR: code/theme review (use /code-review), bulk front-matter-only normalization (use /frontmatter-maintainer), or releases (use commit-publish)."
---

# Content Review

Run the Zer0-Mistakes two-tier content review on whatever a branch/PR changes.
Tier 1 is deterministic (no API key); tier 2 is the editorial Claude Code agent.
Thresholds and authoring rules are resolved **per collection** — docs follow the
documentation guidelines, posts are graded as articles, notes as short-form, etc.

## When to use

- Reviewing a PR that adds or edits content under `pages/**`.
- Before publishing a post/doc/quickstart/note/quest you just drafted.
- Resolving feedback from the [`ai-content-review.yml`](../../workflows/ai-content-review.yml) workflow.

## Inputs (source of truth)

| File | Provides |
| --- | --- |
| [`.github/config/content_review.yml`](../../config/content_review.yml) | Per-collection SEO/quality thresholds, scoring, focus, assigned skills/prompts |
| [`.github/config/frontmatter_schema.yml`](../../config/frontmatter_schema.yml) | Required front-matter fields per collection |
| `.github/instructions/content-review.instructions.md` | Baseline authoring + resolution rules |
| per-collection instructions (e.g. `documentation.instructions.md`) | Collection-specific rules (named in each file's review output) |

## Pipeline

### 1. Deterministic tier (always — no secrets)

```bash
# Everything changed vs main:
ruby scripts/content-review.rb --changed --base origin/main \
  --json /tmp/content-review.json --summary /tmp/content-review.md

# Or specific files:
ruby scripts/content-review.rb --files "pages/_posts/2026-…-foo.md"
```

Each result carries `collection`, per-collection `score`/`fail_under`, the
governing `instructions` array, and categorized `issues`. **Stop and read the
JSON** before reasoning further — don't re-derive the mechanical checks.

### 2. Editorial tier (Claude Code agent)

Delegate the judgment layer to the [`content-reviewer`](../../../.claude/agents/content-reviewer.md)
agent (or the [`/content-review`](../../prompts/content-review.prompt.md) prompt).
For each file, it reads the `instructions` paths the deterministic tier listed,
then reviews: SEO/AIEO, consistency, polish, accessibility, technical accuracy.

### 3. Report

Use the agent's output format — verdict (✅ approve / 💬 comment / 🔧 request
changes), per-file findings tagged 🔴 must-fix · 🟡 should-fix · 🔵 nice-to-have,
each with a concrete suggested rewrite. Reviews advise; they don't auto-block
(`strictness.ci: warn`).

## Resolving findings (order)

1. Front matter (required fields, list-vs-string, ISO dates)
2. SEO (title/description length, keywords)
3. Structure (headings, code-fence languages, alt text)
4. Prose (clarity, consistency, accuracy)

Re-run `ruby scripts/content-review.rb --changed` after fixing, and **always
bump `lastmod`** on any file you edit.

## Reporting back

| Tier | Status |
| --- | --- |
| Deterministic (avg score / failing files) | ✅ / ⚠️ |
| Editorial findings (🔴 / 🟡 / 🔵 counts) | … |
| Verdict | ✅ / 💬 / 🔧 |
