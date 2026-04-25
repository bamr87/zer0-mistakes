---
agent: agent
mode: agent
description: "Add a new Obsidian wiki-link, embed, or callout syntax to all three rendering paths (Liquid wiki-index, JS resolver, optional Ruby plugin), update tests, and document it — without breaking the GitHub Pages deployment."
---

# Add an Obsidian Syntax Feature

Use this prompt when extending the Obsidian integration with a new piece of syntax (e.g. a new callout type, a new embed shorthand, a new inline annotation). It enforces the cross-file contract documented in [`.github/instructions/obsidian.instructions.md`](../instructions/obsidian.instructions.md).

> **Inputs to gather first** (ask the user if not provided):
> - **Syntax**: the literal Obsidian markdown to support (e.g. `> [!hypothesis]`, `[[Page#^block]]`, `==highlight==`).
> - **Rendered HTML**: the target Bootstrap-compatible output.
> - **Scope**: links/embeds/callouts/inline — determines which converters need changes.

## 🎯 Workflow Checklist

Track progress with `manage_todo_list`. **Do not skip steps** — the GH Pages path depends on the JS resolver having parity with the Ruby plugin.

```
1. Confirm syntax + target HTML with the user
2. Add failing test cases (Ruby + JS) for the new syntax
3. Update assets/data/wiki-index.json template (only if new index data is needed)
4. Update assets/js/obsidian-wiki-links.js (primary GH Pages path)
5. Update _plugins/obsidian_links.rb (vanilla Jekyll / SEO path)
6. Add styles in _sass/core/_obsidian.scss if needed
7. Run the three-layer test suite
8. Update pages/_docs/obsidian/syntax-reference.md
9. Add a CHANGELOG entry
```

---

## Step 1 — Establish behavioural parity tests FIRST

Before changing any converter, add fixtures so both implementations can be verified:

- **Ruby**: extend [`test/test_ruby_converter.rb`](../../test/test_ruby_converter.rb) with a new `def test_<feature>` that calls `@converter.convert(input)` and asserts on the returned HTML.
- **JS**: extend the fixture array in [`test/test_resolver.js`](../../test/test_resolver.js) with the input markdown, the seeded `wiki-index.json` entries it depends on, and the expected DOM after `resolveWikiLinks(...)` runs.

Run the suite and confirm both new tests **fail** for the right reason:

```bash
bundle exec ruby test/test_ruby_converter.rb
node test/test_resolver.js
```

## Step 2 — Update the JS resolver (GH Pages path)

Edit [`assets/js/obsidian-wiki-links.js`](../../assets/js/obsidian-wiki-links.js).

- Mask fenced (` ``` ` / `~~~`), indented, and inline code spans **before** matching — do not rewrite content inside them.
- Reuse the existing key normalizer: `value.toLowerCase().trim().replace(/\s+/g, ' ')`. Wiki-link lookups must agree with the Ruby `Index#normalize` method.
- Generate Bootstrap-flavoured HTML (alerts use `alert alert-<level>`, icons use `bi-*`).

## Step 3 — Mirror in the Ruby plugin

Edit [`_plugins/obsidian_links.rb`](../../_plugins/obsidian_links.rb).

- Add the regex/handler inside `Jekyll::Obsidian::Converter`.
- If you add a new callout type, extend the `CALLOUT_TYPES` hash (alert + icon).
- Honour `obsidian.enabled: false` (`Converter#convert` returns the raw markdown when disabled).
- Preserve the "first registration wins + warn" behaviour in `Index#register` if your feature touches the index.

## Step 4 — Update the Liquid index (only if new data is needed)

[`assets/data/wiki-index.json`](../../assets/data/wiki-index.json) is emitted by Liquid at build time. Only modify it if the new syntax requires additional fields (e.g. a new `aliases` source). When you do, update **all** consumers:

- `assets/js/obsidian-wiki-links.js`
- `assets/js/obsidian-graph.js`
- `_includes/content/backlinks.html`
- The `to_h` shape in `_plugins/obsidian_links.rb` (Ruby parity)

## Step 5 — Style hooks

If the new syntax needs styling, add rules in [`_sass/core/_obsidian.scss`](../../_sass/core/_obsidian.scss) (already imported via `_sass/custom.scss`). Follow [`.github/instructions/sass.instructions.md`](../instructions/sass.instructions.md): prefer CSS custom properties so color-mode switching works.

## Step 6 — Run the full test suite

All three layers must pass. **Do not stop at unit tests** — the build smoke test catches index-shape regressions.

```bash
./test/test_obsidian.sh
docker-compose exec -T jekyll bundle exec jekyll build \
  --config '_config.yml,_config_dev.yml'
```

If `docker-compose` isn't running:

```bash
docker-compose up -d jekyll && sleep 5
```

## Step 7 — Update user-facing documentation

Edit [`pages/_docs/obsidian/syntax-reference.md`](../../pages/_docs/obsidian/syntax-reference.md):

- Add a row to the relevant feature table.
- Show the input on the left, the rendered output / Bootstrap class on the right.
- If behaviour differs between the GH Pages (JS) and self-build (Ruby) paths, call it out explicitly — agents and humans both rely on this for triage.

## Step 8 — Changelog

Add an entry to `CHANGELOG.md` under `### Added` with the format:

```markdown
- **Obsidian**: `<syntax>` now renders as `<output>` on both GitHub Pages and self-build deployments.
```

## ✅ Definition of Done

- [ ] Ruby and JS tests both pass with identical expectations.
- [ ] `./test/test_obsidian.sh` is green (all three layers).
- [ ] `assets/data/wiki-index.json` is well-formed in `_site/`.
- [ ] No new `<style>` blocks in includes/layouts (use `_sass/`).
- [ ] `pages/_docs/obsidian/syntax-reference.md` documents the new syntax with a working example.
- [ ] `CHANGELOG.md` has a user-visible entry.

> **Do not bump the version or run `./scripts/bin/release`** as part of this prompt — that's the job of [`commit-publish.prompt.md`](./commit-publish.prompt.md).
