---
title: "Getting Started with the Obsidian Vault"
description: "Open the Zer0-Mistakes repo as an Obsidian vault, install recommended plugins, and learn the frontmatter conventions."
layout: default
permalink: /docs/obsidian/getting-started/
categories: [Documentation, Obsidian]
tags: [obsidian, setup, vault]
backlinks: true
lastmod: "2026-04-24T15:06:30Z"
---

# Getting Started with the Obsidian Vault

## 1. Open the repository as a vault

1. Install [Obsidian](https://obsidian.md/download).
2. Launch Obsidian → **Open folder as vault**.
3. Pick the root of your `zer0-mistakes` clone.
4. Trust the author when prompted (the vault ships with shared settings
   under `.obsidian/`; nothing executes automatically).

The repo's `.gitignore` excludes Obsidian's per-user state
(`workspace*`, `cache`, `plugins/*/data.json`) so multiple contributors
can share the same vault without merge conflicts.

> [!tip] Prefer a smaller surface?
> If `_layouts/`, `_includes/`, etc. clutter the file explorer, the
> shared `.obsidian/app.json` already lists them under `userIgnoreFilters`.
> Adjust to taste — your local override stays out of git.

## 2. Recommended plugins

The repo ships an *enabled* core-plugin list in `.obsidian/core-plugins.json`
(file explorer, search, backlinks, outgoing links, tag pane, graph,
outline, page preview, templates, daily notes, properties).

Recommended community plugins (install manually, none are bundled):

| Plugin | Why |
| --- | --- |
| **Dataview** | Query frontmatter to build dynamic indexes inside Obsidian. |
| **Templater** | Power up `pages/_notes/_templates/note-template.md`. |
| **Obsidian Git** | Stage/commit/push without leaving Obsidian. |
| **Excalidraw** | Sketch diagrams that survive on the rendered site as images. |
| **Admonition** | Optional richer callouts beyond Obsidian's built-in `> [!type]`. |

## 3. Frontmatter conventions

Every note should carry the canonical Jekyll frontmatter so it picks up the
correct layout and permalink. The shared template at
`pages/_notes/_templates/note-template.md` already matches:

```yaml
---
title: "Your note title"
description: "Used for SEO and social previews (≤160 chars)."
layout: note
date: 2026-04-19T10:00:00.000Z
lastmod: 2026-04-19T10:00:00.000Z
categories: [Notes]
tags: [tag1, tag2]
permalink: /notes/your-slug/
aliases: ["Old Title"]   # → jekyll-redirect-from
backlinks: true
---
```

Obsidian shows these fields in its **Properties** sidebar; the values map
1:1 to the Jekyll defaults declared in `_config.yml`. The `aliases:` array
is honored by [`jekyll-redirect-from`](https://github.com/jekyll/jekyll-redirect-from)
so renames don't break inbound links.

## 4. Where things live

| Path | Purpose |
| --- | --- |
| `pages/_notes/` | Personal notes (renders with `layout: note`, backlinks on). |
| `pages/_docs/` | Long-form documentation pages. |
| `pages/_posts/` | Blog posts (renders with `layout: journals`). |
| `assets/images/notes/` | Default attachment folder for `![[image]]` embeds. |
| `pages/_notes/_templates/` | Obsidian Templates plugin source. |

## 5. Next steps

- Skim the [syntax reference]({{ "/docs/obsidian/syntax-reference/" | relative_url }})
  to see exactly which Obsidian features render on the site.
- Learn the [authoring workflow]({{ "/docs/obsidian/authoring-workflow/" | relative_url }})
  for the round-trip from Obsidian to published page.
- If something looks off, jump to
  [troubleshooting]({{ "/docs/obsidian/troubleshooting/" | relative_url }}).

## See also

- [[Obsidian Vault Integration]]
- [[Obsidian Syntax Reference]]
- [[Obsidian Authoring Workflow]]
- [[Obsidian Integration Troubleshooting]]
- [[Obsidian Graph View]]
- [[front-matter]]
- [[Installation]]
