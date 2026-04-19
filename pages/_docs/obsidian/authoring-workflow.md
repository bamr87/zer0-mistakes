---
title: "Obsidian Authoring Workflow"
description: "From an empty Obsidian note to a published page on GitHub Pages — the daily loop."
layout: default
permalink: /docs/obsidian/authoring-workflow/
categories: [Documentation, Obsidian]
tags: [obsidian, workflow, authoring]
backlinks: true
---

# Obsidian Authoring Workflow

## The round-trip

```
Obsidian (edit)  →  git commit  →  GitHub push  →  Pages build  →  live URL
       ↑                                                                │
       └──────────── git pull (Obsidian Git plugin) ────────────────────┘
```

## Daily loop

1. **Open the vault** in Obsidian (root of the repo).
2. **Create a note** with `Cmd/Ctrl + N`. The Templates core plugin will
   offer `note-template.md` from `pages/_notes/_templates/`. Picking it
   stamps the canonical frontmatter (title, layout, permalink, …).
3. **Write freely** with `[[wiki-links]]`, `![[embeds]]`, callouts, and
   `#tags`. Every one of those renders 1:1 on the site (see
   [syntax reference]({{ "/docs/obsidian/syntax-reference/" | relative_url }})).
4. **Drop images** into the editor — Obsidian saves them under
   `assets/images/notes/` (configured in `.obsidian/app.json`), which is
   exactly where `![[image.png]]` resolves on the site.
5. **Commit & push.**
   - With **Obsidian Git plugin**: `Ctrl/Cmd + P` → *Source control: Commit
     all changes* → *Push*.
   - From the terminal: standard `git add / git commit / git push`.
6. **GitHub Pages** rebuilds automatically. Within ~1 minute the new note
   is live at the permalink declared in its frontmatter.

## Editing existing content

- **Renames are safe.** Obsidian's *Always update internal links* setting
  (`alwaysUpdateLinks: true` in shared config) rewrites every `[[link]]`
  pointing at the renamed file. For URL-level redirects, add the old slug
  to the note's `aliases:` array — `jekyll-redirect-from` will issue an
  HTTP redirect from the old URL.
- **Moves between collections** (`pages/_notes/` ↔ `pages/_posts/`) work,
  but you'll typically want to update `layout:` to match the destination
  collection's defaults.

## Local preview

The site renders the same Obsidian features locally:

```bash
docker-compose up
# → http://localhost:4000
```

Notes you edit in Obsidian are picked up by Jekyll's incremental build
within ~1 second. Refresh the browser to see your changes.

## Validation before pushing

Run the integration's smoke test to catch broken wiki-links, malformed
frontmatter, or a regressed wiki-index schema:

```bash
./test/test_obsidian.sh
```

The full theme test suite (lint, build, deployment, styling, Obsidian)
runs via:

```bash
./test/test_runner.sh --verbose
```

## Cross-machine vault sync

Use **Obsidian Git** for the canonical sync — it pulls on open and
prompts to commit on close. This keeps every machine using the same
git history that GitHub Pages publishes from, so what you see in
Obsidian is exactly what readers will see on the site.

> [!tip] Avoid Obsidian Sync for this vault
> Obsidian's paid Sync service operates outside git, so it can drift
> from what's deployed. Stick with `git push`/`git pull` (manual or via
> the Obsidian Git plugin) so the vault and the live site never diverge.
