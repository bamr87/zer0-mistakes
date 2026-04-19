---
title: "Obsidian Integration Troubleshooting"
description: "Common issues with the Obsidian + Jekyll integration and how to fix them."
layout: default
permalink: /docs/obsidian/troubleshooting/
categories: [Documentation, Obsidian]
tags: [obsidian, troubleshooting, debugging]
backlinks: true
---

# Obsidian Integration Troubleshooting

## A wiki-link renders as broken (`wiki-link-broken`) on the site, but works in Obsidian

**Cause:** the target page has no `title:` in its frontmatter and the
basename doesn't match either, or the wiki-index hasn't been regenerated
since the target was added.

**Fix:**
1. Confirm the target file has `title:` set in YAML frontmatter.
2. Trigger a rebuild — `assets/data/wiki-index.json` is built per Jekyll
   run. On GitHub Pages this happens automatically on push; locally,
   stop and restart `docker-compose up` (or save any file to retrigger
   incremental builds).
3. Add an `aliases:` entry on the target if the link uses an alternate
   spelling.

## Image embed shows a broken image icon

**Cause:** image isn't where the resolver looks.

**Fix:**
- Default attachment path is `assets/images/notes/` (set in
  `.obsidian/app.json` → `attachmentFolderPath`). If you customized that,
  set the matching path on the site via:
  ```html
  <script>window.OBSIDIAN_ATTACHMENTS_PATH = '/your/path';</script>
  ```
  before the resolver script loads.
- For an absolute path, prefix the embed target with `/`:
  `![[/assets/images/special/diagram.png]]`.

## Callout renders as a plain `<blockquote>`

**Cause:** the first non-blank line of the blockquote isn't `[!type]`.
Obsidian is permissive about whitespace; the resolver requires the marker
on the *first* line of the quote (which is what kramdown's first `<p>`
contains after parsing).

**Fix:** make sure there's no blank line between the `[!type]` head and
the body:

```markdown
> [!warning] Title       ← good
> body line

>                         ← bad: blank first line
> [!warning] Title
> body line
```

## `[[link]]` syntax appears literally inside a code block

**Expected behavior.** Both the Ruby converter and the JS resolver
explicitly skip code spans (`` `…` ``) and fenced code blocks
(``` ``` ```). To force a wiki-link, move it out of the code context.

## Tags don't link to anything

**Cause:** the inline `#tag` matches the regex but the tag aggregator page
(`pages/tags.md`) hasn't picked it up because tags are read from
frontmatter, not body.

**Fix:** also add the tag to the `tags:` array in frontmatter so it shows
on `/tags/`:

```yaml
tags: [obsidian, your-inline-tag]
```

## Backlinks panel is missing on a note

**Causes & fixes:**
- Layout other than `note`? Add `backlinks: true` to frontmatter.
- Explicitly disabled? Remove `backlinks: false`.
- No incoming links exist yet — the panel is hidden when empty rather
  than showing an empty section.

## Custom plugin (`_plugins/obsidian_links.rb`) doesn't run on my fork's GitHub Pages build

**This is expected** for sites built with the `github-pages` gem. That gem
forces `safe: true` and overrides `plugins_dir`, so no custom Ruby
plugin executes. The client-side resolver covers the same surface area.

If you want server-side rewrites (slightly better SEO, no flash before
hydration), drop `github-pages` from `Gemfile`, switch to vanilla
Jekyll, and add a custom GitHub Actions workflow that runs
`bundle exec jekyll build` and deploys with `actions/deploy-pages` or
`peaceiris/actions-gh-pages`. The plugin will pick up `_plugins/` in that
setup automatically.

## Obsidian shows files I don't want to see (`_layouts/`, `assets/vendor/`, …)

The shared `.obsidian/app.json` already excludes the most common
build/config dirs via `userIgnoreFilters`. Add more entries there if you
want them shared with collaborators, or use Obsidian Settings → Files &
Links → Excluded files for personal-only filters.

## Obsidian's vault config is conflicting with another contributor's

The repo commits a curated subset of `.obsidian/`. Per-user state
(`workspace*.json`, `cache`, `plugins/*/data.json`, `graph.json`) is
gitignored. If you see merge conflicts inside `.obsidian/` for one of
those files, it slipped through — drop it from git with:

```bash
git rm --cached .obsidian/workspace.json
echo ".obsidian/workspace.json" >> .gitignore
```

Then commit. The pattern is already in `.gitignore`; this is just for
files that were committed before the gitignore took effect.

## Still stuck?

Open an issue at
[github.com/bamr87/zer0-mistakes/issues](https://github.com/bamr87/zer0-mistakes/issues)
with:

- The exact Markdown source that misbehaves.
- The rendered HTML (View Source on the live page).
- The output of `./test/test_obsidian.sh`.
