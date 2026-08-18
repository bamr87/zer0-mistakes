# Evidence — SoftwareApplication JSON-LD is now opt-in (2026-08 fleet audit, finding C1)

`_includes/content/jsonld-software.html` emitted a `SoftwareApplication` JSON-LD
graph on **every** consumer's homepage. The payload is hardcoded to this theme,
so on any other site it was factually wrong in machine-readable form.

## The problem

The include is wired unconditionally into `_includes/core/head.html` (line 127),
gated only on `page.permalink == "/"`. Its payload hardcodes:

| Field | Value emitted on *every* consumer homepage |
|---|---|
| `@type` | `SoftwareApplication` / `DeveloperApplication` |
| `name` | `{{ site.title }}` — **the consumer's own name** |
| `alternateName` | `jekyll-theme-zer0` |
| `codeRepository` | `https://github.com/bamr87/zer0-mistakes` |
| `downloadUrl` | `https://rubygems.org/gems/jekyll-theme-zer0` |
| `installUrl` | the theme's own GitHub quick-start anchor |
| `license` | MIT, `isAccessibleForFree: true`, `price: 0` |
| `featureList` | 12 entries describing **the theme's** features |
| `screenshot` | the theme's mascot image |
| `Person` node | a specific named author + their GitHub and X profiles, referenced as the site's `publisher` |

Live consequence found in the audit: `bashconsultants.com` — a Denver IT
consulting practice — told search engines and any JSON-LD consumer that it was
a free, MIT-licensed, RubyGems-distributed developer tool authored by someone
else. It had not overridden the include; there was no way to.

The include's own header stated its purpose was "to accurately cite and describe
the zer0-mistakes Jekyll theme as a SoftwareApplication entity" — written for the
theme's own marketing site, but shipped to everyone.

## What changed

| File | Change |
|---|---|
| `_includes/content/jsonld-software.html` | Renders only when `site.jsonld_software_application` is true (and the page is the homepage). Homepage detection moved into an explicit `_is_homepage` assign — Liquid has no parentheses and evaluates `and`/`or` right-to-left, so the combined condition would have been fragile. Header rewritten to say the block describes THE THEME, not the site rendering it. |
| `_config.yml` | Sets `jsonld_software_application: true` with a comment explaining that only the theme's own site may truthfully claim it. Behaviour on this site is unchanged. |

Consumers need to do nothing: absent config is falsey, so the block simply stops
rendering. Their standard SEO metadata (`jekyll-seo-tag`'s own `WebSite` block)
is untouched — see the `graph_node_types` in `metrics.json`.

## Measured result

Two real builds of this repo, identical but for the flag. The opt-out column is
exactly what every consumer homepage emitted **before** this change, since the
include was previously ungated.

| | theme's own site (opt-in) | consumer default (opt-out) |
|---|---|---|
| `ld+json` blocks | 2 | 1 |
| graph node types | WebPage, WebSite, **SoftwareApplication**, **Person**, WebSite | WebSite |
| false software claim | present | **gone** |
| hardcoded Person node | present | **gone** |
| homepage bytes | 294,601 | 290,843 (−3,758) |

Full numbers in [`metrics.json`](./metrics.json).

## How to reproduce

```bash
# Opt-in (this repo's own site — schema present)
bundle exec jekyll build --config '_config.yml,_config_dev.yml' -d /tmp/optin

# Opt-out (simulates any consumer — schema absent)
printf 'jsonld_software_application: false\n' > /tmp/off.yml
bundle exec jekyll build --config '_config.yml,_config_dev.yml,/tmp/off.yml' -d /tmp/consumer

grep -c '"@type": "SoftwareApplication"' /tmp/optin/index.html     # 1
grep -c '"@type": "SoftwareApplication"' /tmp/consumer/index.html  # 0
```

No screenshots: this change touches `<head>` structured data only and has zero
visual effect. The rendered page is byte-identical apart from the removed
`<script type="application/ld+json">` block.

Regression test:
[`../../features/jsonld-software-optin.spec.js`](../../features/jsonld-software-optin.spec.js)
— asserts the opted-in site emits exactly one valid `SoftwareApplication` graph
describing this theme, that the homepage gate still holds, and that the payload
stays internally consistent.
