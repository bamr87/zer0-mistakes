---
agent: agent
mode: agent
description: "CLI-style front matter maintenance for YAML front matter across repo content"
tools: [run_in_terminal, read_file, apply_patch, get_changed_files, grep_search, file_search]
---

# Front Matter Maintainer (CLI) — Zer0-Mistakes

Maintain high-quality YAML front matter for repo content that contains (or should contain) a YAML front matter section.

This prompt is written as a command-line style interface so you can run it in different modes (check-only vs fix, changed-files vs repo audit) while keeping behavior consistent and safe.

---

## Usage

```
frontmatter-maintainer <command> [options]
```

### Commands

- `check` — Validate front matter (syntax + required fields) and report.
- `fix` — Apply safe fixes (syntax fixes, add missing required keys, normalize formatting, update `lastmod` when appropriate).
- `init` — Add minimal front matter to files that should have it but do not.
- `audit` — Repo-wide scan and report (no edits unless `--fix`).

### Common Options

- `--changed` — Operate on changed files only (default for `check`/`fix`).
- `--staged` — Use staged changes (`--cached`) instead of working tree.
- `--files <f1> <f2> ...` — Explicit file list.
- `--paths <p1> <p2> ...` — Scan paths recursively.
- `--include <glob>` — Additional include globs.
- `--exclude <glob>` — Additional exclude globs.
- `--check-only` — Never modify files (alias of `check`, or forces no edits).
- `--dry-run` — Show intended edits but do not apply patches.
- `--update-lastmod [auto|always|never]` — Default `auto`.
- `--report <markdown|json>` — Default `markdown`.
- `--help` — Print a concise help summary.

### Exit Semantics (for automation)

- Success: no invalid YAML; required fields present (or intentionally skipped by rules).
- Failure: invalid YAML or unresolved blockers remain.

---

## Scope

**In scope**: Content files where Jekyll front matter is expected/allowed.

- Markdown: `*.md`, `*.markdown`
- HTML pages that contain front matter: `*.html`
- Typical locations: root pages, `pages/`, `docs/`, `features/`, `posts/`, and Jekyll collections under `pages/_*/`

**Out of scope** (never edit):

- Generated output: `_site/**`
- Dependencies/vendor: `vendor/**`, `node_modules/**` (if present)
- Build artifacts: `pkg/**`, logs, caches

If unsure, default to **only changed files** from `git diff`.

---

## Operational Model

### File Discovery (defaults)

Unless `--files` or `--paths` is provided:

- `check`/`fix`: use `--changed` by default
- `audit`: scan typical content locations (`pages/`, `docs/`, `features/`, root `*.md/*.html`) unless constrained by `--paths`

Always filter to `*.md`, `*.markdown`, `*.html` and always exclude `_site/**`, `vendor/**`, `pkg/**`, and (if present) `node_modules/**`.

### Front Matter Detection

- A file “has front matter” only if it starts with `---` on the first line.
- The YAML block ends at the next `---` delimiter.
- If delimiters are present but malformed, treat as a blocker unless it can be unambiguously corrected.

---

## Primary Workflows

### `frontmatter-maintainer check` (Quick Review)

Use this for every commit/release. Prefer changed files.

**Steps**

1. Determine candidate files:
   - Default: `git diff --name-only --diff-filter=ACMRT`
   - With `--staged`: `git diff --cached --name-only --diff-filter=ACMRT`
   - Then filter to `*.md`, `*.markdown`, `*.html`
   - Exclude `_site/**`, `vendor/**`, `pkg/**`, `node_modules/**`

2. For each candidate file:
   - Detect if it has YAML front matter (starts with `---` at the top).
   - If it has front matter:
     - Validate YAML syntax.
     - Ensure required keys for the file type (see “Required Fields”).
     - Ensure formatting consistency (see “Normalization Rules”).
     - Check `lastmod` (see `--update-lastmod`).
   - If it does **not** have front matter:
     - Decide if it should (see “When Front Matter Is Required”).
     - Report as missing (or, in `init`/`fix` modes, add minimal front matter).

3. Produce a short report:
   - Files checked, files changed
   - YAML errors fixed (or remaining blockers)
   - Missing required fields added

Stop if YAML is invalid and cannot be safely corrected.

### `frontmatter-maintainer fix` (Safe Fixes)

Apply safe edits only:

- Fix YAML syntax when correction is unambiguous
- Add missing required keys (with conservative defaults)
- Normalize formatting without reflowing body content
- Update `lastmod` when content meaningfully changed (`--update-lastmod auto`)

Never edit `_site/**`.

### `frontmatter-maintainer init` (Add Minimal Front Matter)

For files that should have front matter but don’t, add a minimal YAML block at the top.

Defaults must be conservative:

- `layout`: infer from neighboring files; otherwise `default`
- `title`: infer from first H1 if present; otherwise filename-based title
- `description`: placeholder only if absolutely required; prefer deriving from first paragraph
- `permalink`: infer from existing site conventions and path
- `lastmod`: set to current timestamp

### `frontmatter-maintainer audit` (Repo-wide)

Use only when requested (it can be noisy).

- Find front matter coverage across the repo content.
- Identify:
  - Missing front matter where it should exist
  - Invalid YAML
  - Missing required fields
  - Low-quality metadata (empty descriptions, bad permalinks, etc.)

With `audit --fix`, you may apply the same safe fixes as `fix`, but keep scope constrained (prefer `--paths`).

---

## When Front Matter Is Required

Add front matter when **any** of the following are true:

- The file is meant to be a Jekyll-rendered page/post/doc and is referenced in navigation.
- The file lives under a Jekyll collection (e.g., `pages/_posts/`, `pages/_docs/`, `pages/_quests/`).
- The file needs a non-default layout, permalink, or metadata (title/description).

Do **not** add front matter to random notes/scratch files unless they are part of the site.

---

## Required Fields

### Baseline (most pages)

- `title` (string)
- `description` (string, ideally 150–160 chars)
- `layout` (string; use an existing layout)
- `permalink` (string starting with `/`)
- `lastmod` (ISO timestamp; update when content changes)

### Posts (`pages/_posts/**`)

- Baseline fields, plus:
- `date` (ISO timestamp)
- `categories` (array)
- `tags` (array)

### Docs / Guides (common pattern)

- Baseline fields
- `tags` (array) and/or `categories` (array) when used for navigation/organization

If the repo uses additional keys in nearby files (e.g., `preview`, `excerpt`, `author`, `comments`, `keywords`, `ai_content_hints`), keep them consistent with existing patterns—don’t invent new schemas.

---

## Normalization Rules

- Front matter must be the **first thing** in the file (no leading blank lines).
- YAML block delimiters:
  - Start: `---`
  - End: `---`
- Use valid YAML:
  - Strings quoted only when needed.
  - Arrays in YAML list form: `tags: [a, b]` or multiline `- a` style.
- Prefer consistent casing and key naming already used in the repo.
- `permalink`:
  - Prefer leading `/`.
  - Prefer trailing `/` for directory-style URLs (match existing conventions).

---

## Documentation: Defaults and Heuristics

### `lastmod` behavior (`--update-lastmod`)

- `auto` (default): update only when content meaningfully changed (not whitespace-only).
- `always`: always update `lastmod` for touched files.
- `never`: never update `lastmod`.

### Conservative key addition

When adding missing keys:

- Never remove existing keys.
- Never rename keys unless the repo already standardized the schema.
- Prefer adding only what’s required to make the file valid and consistent.

---

## Layout Selection (use existing layouts only)

Common layouts in this repo include:

- `default`
- `journals`
- `home`
- `landing`
- `notebook`

Pick the simplest layout that matches the file’s intent and neighbors.

---

## Safe Updates

- Update `lastmod` only when content meaningfully changes (not whitespace-only edits).
- Do not rewrite or reflow the page body.
- Do not touch `_site/**`.

---

## Optional: Container-Based YAML Validation (recommended)

For changed content files, you can validate front matter YAML using the Docker container’s Ruby:

```bash
# Example (replace with your file list)
docker-compose exec jekyll ruby -ryaml -e '
files = ARGV
errors = 0
files.each do |path|
  next unless File.file?(path)
  body = File.read(path)
  next unless body.start_with?("---")
  m = body.match(/\A---\s*\n(.*?)\n---\s*\n/m)
  next unless m
  begin
    YAML.safe_load(m[1], permitted_classes: [], permitted_symbols: [], aliases: true)
  rescue => e
    warn "YAML front matter error: #{path}: #{e.class}: #{e.message}"
    errors += 1
  end
end
exit(errors == 0 ? 0 : 1)
' -- file1.md file2.html
```

If this fails, fix YAML first before proceeding.

---

## Examples

```bash
# Check changed content files (default)
frontmatter-maintainer check --changed

# Check staged content files
frontmatter-maintainer check --staged

# Fix front matter for changed files (safe edits)
frontmatter-maintainer fix --changed

# Initialize front matter for a specific file
frontmatter-maintainer init --files pages/_docs/new-page.md

# Audit docs and pages only (no edits)
frontmatter-maintainer audit --paths docs pages

# Audit and apply safe fixes (constrained)
frontmatter-maintainer audit --paths pages/_docs --fix
```

---

## Output Format

Return a concise report:

```markdown
## Front Matter Report

### Checked
- N files

### Updated
- `path/to/file.md`: Added missing `description`, updated `lastmod`

### Issues
- `path/to/file.md`: YAML invalid (blocked)

### Notes
- Any assumptions (e.g., layout chosen based on neighboring files)
```

---

## Help (short)

If invoked with `--help`, print:

- Commands and most common options
- Current defaults (changed-files for `check`/`fix`)
- Hard excludes (`_site/**`, `vendor/**`, `pkg/**`)

Then stop.
