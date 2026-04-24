---
title: "Obsidian Graph View"
description: "Interactive force-directed map of every wiki-link in the site, mirroring Obsidian's local graph."
layout: default
permalink: /docs/obsidian/graph/
categories: [Documentation, Obsidian]
tags: [obsidian, graph, navigation]
backlinks: false
sitemap: false
lastmod: "2026-04-24T15:06:30Z"
---

<style>
  /* Scoped to the graph page so we don't leak into other docs. */
  #obsidian-graph {
    width: 100%;
    height: 82vh;
    min-height: 620px;
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: var(--bs-border-radius-lg, .5rem);
    background: var(--bs-tertiary-bg, #f8f9fa);
    box-shadow: 0 1px 2px rgba(0, 0, 0, .04), 0 4px 12px rgba(0, 0, 0, .04);
    position: relative;
    overflow: hidden;
  }
  #obsidian-graph-stats {
    display: flex;
    flex-wrap: wrap;
    gap: .375rem;
  }
  #obsidian-graph-stats .badge {
    font-size: .8125rem;
    font-weight: 500;
    padding: .35rem .6rem;
  }
  .obsidian-graph-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem .75rem;
    align-items: center;
    margin: .75rem 0;
    padding: .625rem .75rem;
    background: var(--bs-tertiary-bg, #f8f9fa);
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: var(--bs-border-radius, .375rem);
  }
  .obsidian-graph-toolbar .form-control {
    max-width: 280px;
    flex: 1 1 200px;
  }
  .obsidian-graph-toolbar .form-check {
    margin-bottom: 0;
  }
  #obsidian-graph-status {
    flex-basis: 100%;
    font-size: .8125rem;
    color: var(--bs-secondary-color, #6c757d);
    min-height: 1.25rem;
  }
  .obsidian-graph-legend {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
    margin-top: .75rem;
    font-size: .8125rem;
  }
  .obsidian-graph-legend > span {
    display: inline-flex;
    align-items: center;
    gap: .375rem;
    padding: .25rem .55rem;
    background: var(--bs-body-bg, #fff);
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: 999px;
    color: var(--bs-body-color, #212529);
  }
  .obsidian-graph-legend .swatch {
    display: inline-block;
    width: .7rem;
    height: .7rem;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, .15);
  }
  .obsidian-graph-legend .swatch-broken {
    border: 1.5px dashed #dc3545;
    background: transparent !important;
    box-shadow: none;
  }
  .obsidian-graph-tips {
    margin-top: .75rem;
    padding: .625rem .75rem;
    font-size: .8125rem;
    color: var(--bs-secondary-color, #6c757d);
    background: var(--bs-tertiary-bg, #f8f9fa);
    border-left: 3px solid var(--bs-primary, #0d6efd);
    border-radius: .25rem;
  }
  .obsidian-graph-tips strong {
    color: var(--bs-body-color, #212529);
  }
</style>

# Obsidian Graph View

A live, force-directed map of every page on this site and every
`[[wiki-link]]` between them. This is the rendered-site equivalent of
Obsidian's local graph view — built from the same
[`assets/data/wiki-index.json`]({{ "/assets/data/wiki-index.json" | relative_url }})
that powers the [client-side resolver]({{ "/docs/obsidian/syntax-reference/" | relative_url }})
and [backlinks panel]({{ "/docs/obsidian/syntax-reference/#backlinks-panel" | relative_url }}).

<div id="obsidian-graph-stats" class="mb-2" aria-live="polite"></div>

<div class="obsidian-graph-toolbar">
  <input type="search"
         class="form-control form-control-sm"
         id="obsidian-graph-search"
         placeholder="Filter nodes by title…"
         aria-label="Filter graph nodes by title" />
  <button type="button"
          class="btn btn-outline-secondary btn-sm"
          id="obsidian-graph-fit">
    <i class="bi bi-arrows-fullscreen" aria-hidden="true"></i>
    Reset view
  </button>
  <div class="form-check form-switch">
    <input class="form-check-input"
           type="checkbox"
           role="switch"
           id="obsidian-graph-orphans" />
    <label class="form-check-label" for="obsidian-graph-orphans">
      Show orphans
    </label>
  </div>
  <span id="obsidian-graph-status" role="status"></span>
</div>

<div id="obsidian-graph" role="img" aria-label="Site knowledge graph"></div>

<div class="obsidian-graph-legend" aria-label="Graph legend">
  <span><span class="swatch" style="background:#0d6efd"></span>Posts</span>
  <span><span class="swatch" style="background:#198754"></span>Docs</span>
  <span><span class="swatch" style="background:#6f42c1"></span>Notes</span>
  <span><span class="swatch" style="background:#d63384"></span>Notebooks</span>
  <span><span class="swatch" style="background:#fd7e14"></span>Quickstart</span>
  <span><span class="swatch" style="background:#6c757d"></span>Pages</span>
  <span><span class="swatch swatch-broken"></span>Broken links</span>
</div>

<div class="obsidian-graph-tips">
  <strong>Tips:</strong> click a node to open the page · ⌘/Ctrl-click to
  open in a new tab · drag to reposition · scroll to zoom · hover to
  highlight a node's neighborhood · type in the search box to filter.
</div>

## How it's built

| Piece | File |
| --- | --- |
| Build-time index (nodes + outgoing edges) | [`assets/data/wiki-index.json`]({{ "/assets/data/wiki-index.json" | relative_url }}) (Liquid template at [`assets/data/wiki-index.json`](https://github.com/bamr87/zer0-mistakes/blob/main/assets/data/wiki-index.json)) |
| Renderer | `assets/js/obsidian-graph.js` |
| Layout engine | [cytoscape.js](https://js.cytoscape.org/) (loaded from CDN, only on this page) |

Outgoing edges come from the same `[[…]]` syntax the resolver handles —
unresolved targets show up as dashed red nodes so you can find dangling
links at a glance. The graph is regenerated every Jekyll build; nothing
runs client-side except cytoscape's force layout.

<!-- Cytoscape.js (only loaded on this page). -->
<script src="https://cdn.jsdelivr.net/npm/cytoscape@3.30.0/dist/cytoscape.min.js"
        integrity="sha384-kpMsYllYzyaWU69Piok08rPNktpnjqAoDMdB00fjqUkEk3lkuUbSuwJ+oXrjvN6B"
        crossorigin="anonymous"
        defer></script>
<script src="{{ '/assets/js/obsidian-graph.js' | relative_url }}" defer></script>

## See also

- [[Obsidian Vault Integration]]
- [[Obsidian Syntax Reference]]
- [[Obsidian Authoring Workflow]]
- [[Getting Started with the Obsidian Vault]]
- [[Obsidian Integration Troubleshooting]]
