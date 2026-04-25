---
applyTo: "_plugins/obsidian_links.rb,assets/js/obsidian-*.js,assets/data/wiki-index.json,_includes/content/backlinks.html,_includes/content/wiki-graph*.html,pages/_docs/obsidian/**,test/test_obsidian.sh,test/test_ruby_converter.rb,test/test_resolver.js"
description: "Use when editing the Obsidian vault integration: wiki-links, embeds, callouts, backlinks, graph view, the Liquid wiki-index, the JS client resolver, or the optional Ruby plugin. Enforces the contract that keeps GitHub Pages and self-build deployments rendering identically."
---

# Obsidian Integration

End-user docs (link, don't duplicate): [pages/_docs/obsidian/](../../pages/_docs/obsidian/index.md) — getting started, full syntax reference, graph view, authoring workflow, troubleshooting.

## Architecture (load before editing)

Two parallel rendering paths must stay in sync:

| Layer | File | Runs on |
| --- | --- | --- |
| Wiki-index (data) | [assets/data/wiki-index.json](../../assets/data/wiki-index.json) (Liquid-emitted) | Every build, including default GitHub Pages `remote_theme` |
| Client resolver | [assets/js/obsidian-wiki-links.js](../../assets/js/obsidian-wiki-links.js) | Browser — primary path on GH Pages |
| Server plugin (opt-in) | [_plugins/obsidian_links.rb](../../_plugins/obsidian_links.rb) | Vanilla Jekyll only (skipped under `github-pages` gem) |
| Backlinks panel | [_includes/content/backlinks.html](../../_includes/content/backlinks.html) | All builds; reads the same index |
| Graph view | [assets/js/obsidian-graph.js](../../assets/js/obsidian-graph.js) | Browser; reads `wiki-index.json` `targets[]` |

**Implication:** `assets/data/wiki-index.json` is the contract. Both the Ruby plugin (`Jekyll::Obsidian::Index#normalize`) and the JS resolver normalize keys identically: `value.toLowerCase().trim().replace(/\s+/g, ' ')`. Any change to that normalization or to the JSON shape **must** be applied in all three places (Liquid template, Ruby plugin, JS resolver) **and** the test fixtures.

## Hard rules

1. **Do not break the GH Pages path.** The Ruby plugin does **not** run under the `github-pages` gem (`safe: true`, `plugins_dir` is sandboxed). Any new feature must work via Liquid + JS first; the Ruby plugin is an SEO-quality enhancement for forks that self-build.
2. **Keep the Ruby and JS converters behaviourally equivalent** for: `[[Page]]`, `[[Page|Alias]]`, `[[Page#Heading]]`, `[[Page^block]]` (block-id stripped), `![[image.ext|width]]`, `![[Note Title]]` (transclusion), inline `#tags` (skipped inside code/links), and the full callout type list in `Jekyll::Obsidian::CALLOUT_TYPES`.
3. **Never rewrite inside code.** Both converters must skip fenced (` ``` ` / `~~~`), indented, and inline code. The Ruby regexes `FENCED_CODE_RE` / `INLINE_CODE_RE` define the contract — match them in JS via the same masking strategy.
4. **Toggle gate.** Honour `obsidian.enabled: false` in `_config.yml` in both Ruby (early return in `Converter#convert`) and the Liquid template that emits `wiki-index.json`. The JS resolver no-ops when the index is empty/missing.
5. **Bootstrap-only output.** Callouts render as Bootstrap 5 alerts using Bootstrap Icons (`bi-*`). Do not introduce custom CSS frameworks or inline styles — extend `_sass/` if needed.
6. **Aliases ↔ redirects.** Frontmatter `aliases:` is also consumed by `jekyll-redirect-from`. Do not repurpose the field; add new keys instead.
7. **Collisions are warnings, not errors.** Preserve the deterministic "first registration wins + warn" behaviour in `Index#register` so builds stay green when authors add a duplicate title.

## Required tests

Any change in this area must pass:

```bash
./test/test_obsidian.sh                         # Orchestrates all three layers
bundle exec ruby test/test_ruby_converter.rb    # Layer 1 — Ruby plugin
node test/test_resolver.js                      # Layer 2 — JS resolver
docker-compose exec -T jekyll bundle exec jekyll build \
  --config '_config.yml,_config_dev.yml'        # Layer 3 — wiki-index.json shape
```

When adding new wiki-link / callout syntax, extend the fixture in [test/test_resolver.js](../../test/test_resolver.js) **and** the cases in [test/test_ruby_converter.rb](../../test/test_ruby_converter.rb) before changing implementation code.

## Authoring conventions for vault content

When editing notes under `pages/_notes/**` or other collections that opt into the vault:

- Wiki-links target the **title** or **basename** (case-insensitive, whitespace-collapsed). Add a frontmatter `aliases:` entry instead of renaming a file to preserve a friendlier `[[link]]` target.
- Embed images with `![[file.png|400]]` (width hint). Default attachment path is `/assets/images/notes/` (`obsidian.attachments_path`).
- Use Obsidian callouts (`> [!tip] Title`) — they render as Bootstrap alerts, so they are preferred over raw `<div class="alert">` markup.
- Set `backlinks: true` in frontmatter for non-`_notes` pages that should display the backlinks panel.

## Common pitfalls

- **Editing `_plugins/obsidian_links.rb` only.** Easy to forget the JS resolver, which is the path actually used by GH Pages visitors. If you change behaviour, update both.
- **Changing the index JSON shape** without updating consumers: `obsidian-wiki-links.js`, `obsidian-graph.js`, and `_includes/content/backlinks.html` all read it.
- **Adding new callout types in Ruby only.** The JS resolver has its own copy of the type → Bootstrap-alert mapping; keep them aligned.
- **Forgetting the `:pre_render` ordering.** The Ruby converter mutates the raw markdown body before kramdown runs; do not move it to a post-render hook (kramdown will already have HTML-escaped the `[[…]]` syntax).
