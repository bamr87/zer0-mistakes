---
agent: agent
mode: agent
description: "Review new/changed Jekyll content for SEO, consistency, polish, accessibility, and technical accuracy (per-collection)"
tools: [run_in_terminal, read_file, grep_search, file_search, get_changed_files]
---

# Content Review for Zer0-Mistakes

Mirror of [`.github/prompts/content-review.prompt.md`](../../.github/prompts/content-review.prompt.md).
Review the content this branch/PR adds or changes and return an actionable
editorial + SEO review. Thresholds and authoring rules are resolved **per
collection** from `.github/config/content_review.yml`.

## Commands

| Command | Action | Modifies files? |
|---|---|---|
| `review` | Review changed files, report findings (default) | No |
| `fix` | Review **and** apply safe, high-confidence fixes | Yes |
| `score` | Run the deterministic tier only, print scores | No |

## Procedure

1. Resolve scope — files changed vs `origin/main` matching `pages/**/*.md`,
   honouring `scope.exclude` in the config.
2. Run the deterministic tier first:
   ```bash
   ruby scripts/content-review.rb --changed --base origin/main \
     --json /tmp/content-review.json --summary /tmp/content-review.md
   ```
3. For each file, read the `instructions` paths the script lists (baseline +
   collection-specific, e.g. `documentation.instructions.md` for docs), then
   judge SEO/AIEO, consistency, polish, accessibility, and accuracy.
4. Report worst-first with a verdict (✅ approve / 💬 comment / 🔧 request
   changes) and findings tagged 🔴 must-fix · 🟡 should-fix · 🔵 nice-to-have,
   each with a concrete suggested rewrite.

## Rules

- Content only — no Ruby/Liquid/SCSS/JS review (that's `/code-review`).
- Prefer suggestions with exact replacement text. In `fix` mode apply only
  objective fixes and **always bump `lastmod`** on edited files.
- Reserve 🔴 for objective problems (missing required field, broken link,
  truncated description, missing alt text, factual error) — not taste.
