---
mode: agent
description: "Review new/changed Jekyll content for SEO, consistency, polish, accessibility, and technical accuracy"
tools: [run_in_terminal, read_file, grep_search, file_search, get_changed_files]
date: 2026-06-13T15:45:00.000Z
lastmod: 2026-06-13T15:45:00.000Z
---

# Content Review

When invoked with `/content-review`, review the content this branch/PR adds or changes and return an actionable editorial + SEO review. This is the interactive twin of the `content-reviewer` Claude Code agent and the [`ai-content-review.yml`](../workflows/ai-content-review.yml) workflow. Operate as a CLI with explicit commands.

## Commands

| Command | Action | Modifies files? |
|---|---|---|
| `review` | Review changed files, report findings (default) | No |
| `fix` | Review **and** apply safe, high-confidence fixes | Yes |
| `score` | Run the deterministic tier only, print scores | No |

## Options

```
--base <ref>      diff base for changed files (default: origin/main)
--files <glob>    review specific files instead of the diff
--collection <c>  limit to one collection (posts|docs|quickstart|notes|about|quests)
--strict          treat scores < 70 as failures (non-zero exit)
```

## Procedure

1. **Resolve scope.** Default to files changed vs `--base`:
   ```bash
   git diff --name-only --diff-filter=ACMR origin/main...HEAD | grep -E '^pages/.*\.md$'
   ```
Honour the `scope.exclude` globs in [`.github/config/content_review.yml`](../config/content_review.yml).

2. **Run the deterministic tier first** (frontmatter + SEO + structure):
   ```bash
   ruby scripts/content-review.rb --changed --base origin/main \
     --json /tmp/content-review.json --summary /tmp/content-review.md
   ```
   Read the JSON; treat its findings as given.

3. **Read each file and judge** the dimensions in
[`content-review.instructions.md`](../instructions/content-review.instructions.md): SEO/AIEO, consistency, polish, accessibility, technical accuracy. Verify any factual claim about the theme against the repo (grep the include/config).

4. **Report** in this shape, worst file first:

   ```markdown
   ## 🤖 Content Review

   **Verdict:** ✅ Approve | 💬 Comment | 🔧 Request changes — <one line>

   ### `pages/_posts/…md` — 🟡 acceptable (N findings)
   - 🔴 SEO — <problem> → Suggested: "<concrete rewrite>"
   - 🟡 Consistency — "Github" → "GitHub" (lines 12, 40)
   - 🔵 Polish — <nice-to-have>

   ### Summary
   <must-fix vs nice-to-have>
   ```

   Severity: 🔴 must-fix · 🟡 should-fix · 🔵 nice-to-have.

## Rules

- Content only — no Ruby/Liquid/SCSS/JS review (that's `/code-review`). Note any
  code bug in one line under "Out of scope".
- Prefer suggestions with exact replacement text over silent edits. In `fix`
mode, only apply objective fixes (front matter, terminology, alt text, fenced languages) and **always bump `lastmod`** on edited files.
- Reserve 🔴 for objective problems (missing required field, broken link,
  truncated description, missing alt text, factual error) — not taste.
- Re-run `ruby scripts/content-review.rb --changed` after any `fix`.
