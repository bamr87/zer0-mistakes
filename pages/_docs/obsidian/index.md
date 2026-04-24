---
title: "Obsidian Vault Integration"
description: "Edit Zer0-Mistakes content as an Obsidian vault and have it render identically on GitHub Pages."
layout: default
permalink: /docs/obsidian/
categories: [Documentation, Obsidian]
tags: [obsidian, authoring, workflow]
backlinks: true
lastmod: "2026-04-24T15:06:30Z"
---

# Obsidian Vault Integration

The Zer0-Mistakes repository is a fully-functional [Obsidian](https://obsidian.md)
vault. Open the repo root (or any subfolder containing notes) as a vault and
every Markdown file is editable with Obsidian's wiki-links, embeds, callouts,
graph view, and backlinks. The same files render on GitHub Pages with the
equivalent presentation — no duplication, no separate sync step.

## In this section

| Page | What it covers |
| --- | --- |
| [Getting started]({{ "/docs/obsidian/getting-started/" | relative_url }}) | Open the repo as a vault, recommended plugins, frontmatter rules. |
| [Syntax reference]({{ "/docs/obsidian/syntax-reference/" | relative_url }}) | Every Obsidian feature and how it renders on the site. |
| [Graph view]({{ "/docs/obsidian/graph/" | relative_url }}) | Interactive force-directed map of every page and wiki-link. |
| [Authoring workflow]({{ "/docs/obsidian/authoring-workflow/" | relative_url }}) | Daily note → commit → publish loop. |
| [Troubleshooting]({{ "/docs/obsidian/troubleshooting/" | relative_url }}) | Broken links, missing embeds, conflicts. |

## How it works

The integration has two pieces:

1. **Server-side data emission.** A Liquid template emits
   `assets/data/wiki-index.json` at every Jekyll build, listing every
   collection document and standalone page (title, basename, permalink,
   tags, aliases, excerpt). This works on the default GitHub Pages
   `remote_theme` build with no custom plugins required.
2. **Client-side resolver.** `assets/js/obsidian-wiki-links.js` loads the
   index in the browser and rewrites `[[wiki-links]]`, `![[embeds]]`,
   inline `#tags`, and Obsidian callout blockquotes into Bootstrap-styled
   HTML. The result is indistinguishable from server-rendered output for
   readers, and lets the integration ship on plain GH Pages without a
   custom CI workflow.

For users who self-build with vanilla Jekyll (no `github-pages` gem), an
opt-in Ruby plugin (`_plugins/obsidian_links.rb`) performs the same
transformations server-side for slightly better SEO. See the
[syntax reference]({{ "/docs/obsidian/syntax-reference/" | relative_url }})
for the complete feature matrix.

## See also

- [[Getting Started with the Obsidian Vault]]
- [[Obsidian Syntax Reference]]
- [[Obsidian Graph View]]
- [[Obsidian Authoring Workflow]]
- [[Obsidian Integration Troubleshooting]]
- [[front-matter]]
- [[Installation]]
