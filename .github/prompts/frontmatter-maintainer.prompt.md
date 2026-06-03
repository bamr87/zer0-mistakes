---
mode: agent
description: "CLI-style front matter maintenance for YAML front matter across repo content"
tools: [run_in_terminal, read_file, apply_patch, get_changed_files, grep_search, file_search]
date: 2026-05-18T12:00:00.000Z
lastmod: 2026-05-18T12:00:00.000Z
---

# Front Matter Maintainer

When invoked with `/frontmatter-maintainer`, audit and fix YAML front matter across repo content. Operate as a CLI with explicit commands.

## Commands

| Command | Action | Modifies files? |
|---|---|---|
| `check` | Report violations, no changes | No |
| `fix` | Apply safe normalizations | Yes |
| `init` | Add minimal front matter to files missing it | Yes |
| `audit` | Repo-wide check, machine-readable summary | No |

## Common Options

```
--scope <glob>             default: pages/_posts/**, pages/_docs/**, docs/**
--dry-run                  preview changes without writing
--update-lastmod           bump lastmod to today on any modified file
--include-readme           also process README.md files
--verbose                  per-file diagnostics
```

## Exit Codes

- `0` — clean (or all fixes applied successfully)
- `1` — violations found (check mode)
- `2` — invalid args
- `3` — write/parse error

## Scope (default globs)

```
pages/_posts/**/*.md
pages/_docs/**/*.md
docs/**/*.md
pages/_quickstart/**/*.md
pages/_about/**/*.md
```

Excluded: `_site/`, `node_modules/`, `pkg/`, `vendor/`, `.git/`.

## Required Fields

### Baseline (all content)

```yaml
title: "≤ 60 chars"
description: "120–160 chars, complete sentence"
date: 2026-MM-DDTHH:MM:SS.sssZ        # ISO 8601
lastmod: 2026-MM-DDTHH:MM:SS.sssZ
categories: [list]
tags: [list]
author: bamr87
```

### Posts (`pages/_posts/**`) additionally

```yaml
layout: post                            # or article
excerpt: "short summary"
permalink: /posts/<slug>/               # required if linked from non-posts
```

### Docs (`pages/_docs/**`) additionally

```yaml
layout: default
nav_order: <int>                        # if part of navigation
```

## Normalization Rules

| Wrong | Right |
|---|---|
| `tags: tag1, tag2` | `tags: [tag1, tag2]` |
| `categories: blog` | `categories: [blog]` |
| `date: 2026-01-15` | `date: 2026-01-15T00:00:00.000Z` |
| missing `lastmod` | copy `date` value |
| `description: …` (> 160 chars) | flag, do **not** auto-truncate |
| description without trailing `.` | leave as-is (style choice) |
| literal secret prefix (`ghp_…`) in body | flag and refuse to write |

## Workflow Skeletons

### `check` — read-only audit

```bash
frontmatter-maintainer check --scope 'pages/_posts/**'
# → table per file: missing fields | wrong types | char-count violations
```

### `fix` — safe normalizations

Applies only deterministic fixes (list types, ISO dates, copy `date`→`lastmod`). Refuses to touch content body. Never writes if `--dry-run`.

### `init` — add minimal front matter

For files with no front matter block, inserts:

```yaml
---
title: "<derived from filename or H1>"
description: ""              # left for human
date: <file mtime ISO>
lastmod: <today ISO>
categories: []
tags: []
author: bamr87
---
```

Never overwrites existing front matter.

### `audit` — repo summary

Output (machine-readable):

```
files_scanned: N
files_clean: N
files_with_issues: N
issues_by_type:
  missing_description: N
  description_too_long: N
  tags_not_list: N
  missing_lastmod: N
top_offenders:
  - path: …
    issues: [missing_description, tags_not_list]
```

## Layout Selection

Use only layouts present in `_layouts/`. If a file declares a missing layout: flag in `check`, fix in `fix` by mapping:

| Collection | Default layout |
|---|---|
| `pages/_posts` | `post` (or `article` if defined) |
| `pages/_docs` | `default` |
| `pages/_quickstart` | `default` |

## Safe-Update Discipline

- Never rewrite the body — only the front-matter block.
- Preserve unknown keys (don't delete fields you don't recognize).
- Preserve key order when modifying; append new keys at the end.
- One commit per `fix` invocation, message: `chore(frontmatter): normalize <N> files`.

## Container-Based YAML Validation (recommended)

```bash
docker-compose exec -T jekyll ruby -ryaml -e '
  ARGV.each do |f|
    src = File.read(f)
    if src =~ /\A---\n(.*?)\n---/m
      begin YAML.safe_load($1, permitted_classes:[Date,Time])
      rescue => e; puts "#{f}: #{e.message}"; exit 1
      end
    end
  end' pages/_posts/**/*.md
```

## Output Format

```markdown
## Front Matter Report

Mode: check | fix | init | audit
Scope: <glob>
Scanned: N    Clean: N    Updated: N    Issues: N

### Updated
- path/to/file.md — added lastmod, normalized tags

### Issues (require human)
- path/to/file.md — description 187 chars (> 160)

### Notes
- 3 files skipped (no front matter; use `init`)
```

## Hard Rules

- Never modify content outside the front-matter block.
- Never auto-truncate descriptions or titles.
- Never write secrets to disk; refuse to operate on files containing literal secret prefixes.
- Never bypass `--dry-run`.

---

**Related:** [`documentation.instructions.md`](../instructions/documentation.instructions.md)
