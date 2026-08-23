---
title: Cookbook Collection — Recipes That Scale and Convert Themselves
description: Publish recipes with structured front matter — ingredients, ratios, timings — rendered with serving scaling, US↔metric conversion, and a baker's-percentage table.
preview: /images/zer0-mistakes-wizard.png
layout: default
categories:
    - docs
    - features
tags:
    - recipes
    - cookbook
    - collections
    - layouts
    - unit-conversion
keywords:
    - jekyll recipe collection
    - jekyll cookbook theme
    - recipe scaling javascript
    - metric imperial converter
    - bakers percentage
    - schema.org recipe jekyll
permalink: /docs/features/cookbook-collection/
difficulty: beginner
estimated_reading_time: 12 minutes
lastmod: 2026-08-23T00:00:00.000Z
sidebar:
    nav: docs
---

# Cookbook Collection

The `recipes` collection turns front matter into a working recipe page. You describe the recipe as data — ingredients with amounts and units, steps, timings, a yield — and the theme renders the fact bar, the ingredient checklist, the method, a baker's-percentage table, and a control bar that rescales every quantity and switches the whole page between the units it was written in, metric, and US customary.

The theme ships a demo cookbook — [The Zer0 Kitchen](/recipes/) — that exercises everything on this page.

## What the reader gets

- **Scaling.** Change the yield and every amount follows, including the ratio table's weights. The percentages do not move, because a ratio does not care how much you make.
- **Conversion.** Cups become grams and grams become cups, using the densities in `_data/ingredient_densities.yml`. Oven temperatures follow the same switch.
- **A formula, not just a list.** Recipes that declare a `ratio_basis:` get a table of every ingredient as a percentage of it — the way bread, pastry and sauces are actually written down.
- **A page that works without JavaScript.** Every amount is rendered by Jekyll exactly as authored. The scaler is progressive enhancement: with scripting off, the controls never appear and the recipe is still complete and correct.

## Enable the collection

Add the collection and its front-matter defaults to your site's `_config.yml` (the theme's own config carries the same block):

```yaml
collections:
  recipes:
    output: true
    title: Cookbook
    icon: bi-egg-fried
    permalink: /:collection/:name/

defaults:
  - scope:
      path: pages/_recipes   # match your collections_dir
      type: recipes
    values:
      layout: recipe
      comments: false
      sidebar:
        nav: auto
```

Two optional data files tune the presentation. Both degrade gracefully — without them, courses fall back to their raw key and volumes simply never convert to weights.

| File | Purpose |
|---|---|
| `_data/recipe_courses.yml` | Course sections on the index — title, tagline, icon. Sections render in file order. |
| `_data/ingredient_densities.yml` | Grams per US cup per ingredient, keyed by the slugified name. This is what makes volume↔weight conversion possible. |

## Write a recipe

One file per recipe under `pages/_recipes/`:

```text
pages/_recipes/
  index.md                 # layout: cookbook — cover + recipe index
  no-knead-focaccia.md     # layout: recipe (the collection default)
```

### Recipe front matter

| Key | Required | Purpose |
|---|---|---|
| `title` | yes | Recipe name (page `<h1>`) |
| `description` | no | Lead paragraph, card blurb, and meta description |
| `cookbook` | no | Slug tying this recipe to a `layout: cookbook` landing page |
| `course` | no | Section key looked up in `_data/recipe_courses.yml` |
| `cuisine`, `difficulty` | no | Fact-bar entries (`difficulty`: easy / intermediate / advanced) |
| `yield` | no | `{amount, unit, singular}` — `amount` is the base the scaler works from |
| `times` | no | `{prep, cook, rest, rest_label, total}` in **minutes**; total is summed if absent |
| `oven` | no | `{temp_f, temp_c, mode}` — give either scale, the other is derived |
| `equipment` | no | List of strings |
| `ingredients` | no | List of items, or of `{group, items}` groups — see below |
| `steps` | no | List of steps, or of `{section, items}` sections — see below |
| `ratio`, `ratio_basis` | no | `ratio_basis` names the 100% ingredient and switches the ratio table on |
| `notes` | no | List of Markdown strings — "Cook's notes" |
| `nutrition` | no | `{basis, calories, protein, …}` per serving |
| `source`, `source_url` | no | Attribution line under the title |
| `scaler` | no | `false` hides the control bar |
| `units` | no | `false` hides the unit switch but keeps scaling |

### Ingredients

An ingredient is a hash. Only `item` is required:

```yaml
ingredients:
  - group: Dough              # optional grouping; omit for a flat list
    items:
      - item: bread flour
        qty: 500
        unit: g
      - item: large eggs
        singular: large egg   # used when the amount scales down to one
        qty: 2
      - item: garlic
        qty: 4
        qty_max: 6            # renders and scales as a range: "4–6 cloves"
        unit: cloves
        prep: lightly smashed
        optional: true
      - item: kosher salt
        qty: 1
        unit: tsp
        grams_per_cup: 145    # pin a density the data file does not know
        note: Diamond Crystal — Morton's is nearly twice as dense.
```

| Key | Purpose |
|---|---|
| `item` | Ingredient name (required) |
| `qty`, `qty_max` | Amount, and the top of a range. Numbers, not strings — `0.5`, not `"1/2"` |
| `unit` | As you'd write it: `g`, `cups`, `tbsp`, `cloves`, or nothing at all |
| `prep` | Trailing clause: "finely chopped" |
| `note` | Sub-line under the ingredient |
| `singular` | Singular form, used once the amount scales to one or below |
| `optional` | `true` adds an "optional" badge |
| `link` | Links the ingredient name |
| `grams_per_cup` | Density override, beating `_data/ingredient_densities.yml` |
| `weigh` | `false` keeps this amount a volume even in metric |
| `scale` | `false` pins the amount when the recipe is rescaled |
| `ratio` | `false` leaves it out of the ratio table |
| `baker_percent` | Pins the percentage instead of computing it |

Quantities render with vulgar fractions (`0.5` → ½) for cups, spoons and countable things, and as decimals for metric weights — a scale shows `40.5 g`, not `40½ g`.

### Steps

A step is a plain string or a hash:

```yaml
steps:
  - section: "The night before"    # optional; numbering continues across sections
    items:
      - title: Mix
        text: Stir until no dry flour remains. The dough will be **wet**.
        time: 5                     # minutes
        temp_f: 450                 # converts with the unit switch
        image: /assets/images/step-1.jpg
        image_alt: Shaggy dough in a bowl
        note: Do not knead it.
```

Step text is markdownified, so links and emphasis work.

## Unit conversion, precisely

Switching to **Metric** or **US** rewrites every quantity on the page:

- **Mass ↔ mass, volume ↔ volume** always work: `g ⇄ oz`, `ml ⇄ cups`.
- **Volume ↔ weight** works only where a density is known — from the ingredient's own `grams_per_cup:` or from `_data/ingredient_densities.yml`, matched on the slugified ingredient name (`Bread flour` → `bread-flour`). Metric turns a known volume into grams; US turns a known weight back into cups and spoons. Set `weigh: false` to opt an ingredient out.
- **Units are chosen for readability.** 3 tsp becomes 1 tbsp; 1500 g becomes 1.5 kg. US amounts round to a quarter above one cup and an eighth below, because that is what measuring spoons can do.
- **Temperatures** show both scales by default and narrow to the selected one.
- **Nutrition never scales.** A serving is a serving however many you make.

The reader's unit choice is remembered across recipes, and each recipe remembers its own scale. A link can carry either: `?servings=24` or `?scale=2`.

## The ratio table

Declare which ingredient is 100%:

```yaml
ratio: "5 flour : 4 water"   # optional prose summary
ratio_basis: flour           # matched as a substring — covers every "… flour"
```

Every ingredient that can be resolved to a weight gets a row and a percentage; ones that cannot (a clove of garlic, an egg, a volume with no density) are listed without a percentage rather than guessed at. The table also totals the batch and divides it by the yield, which is the number a baker actually wants — grams per roll, per loaf, per pizza ball.

Percentages are computed by Jekyll at build time, so they are correct with JavaScript disabled and can never drift from the ingredient list.

## The cookbook landing page

```yaml
---
title: The Zer0 Kitchen
layout: cookbook
cookbook: zer0-kitchen     # omit to index every recipe on the site
permalink: /recipes/
---
```

The page renders a cover, your Markdown body, a jump-nav of its courses, and the recipe index grouped into course sections.

## Components

Drop any of these on any page. Pages outside the `recipe` layout need `recipe_tools: true` in their front matter to load the scaler script.

| Include | Purpose |
|---|---|
| `components/recipe-index.html` | Grid of recipes, grouped by course (`cookbook`, `heading`, `grouped`) |
| `components/recipe-card.html` | One recipe's card (`recipe`, `heading_level`) |
| `components/recipe-meta.html` | Fact bar (`recipe`) |
| `components/recipe-scaler.html` | Scaling + unit controls (`base_yield`, `yield_unit`, `units`) |
| `components/recipe-ingredients.html` | Ingredient checklist (`ingredients`, `checklist`, `id_prefix`) |
| `components/recipe-steps.html` | Numbered method (`steps`, `heading`) |
| `components/recipe-ratio.html` | Baker's-percentage table (`recipe`, `basis`) |
| `components/recipe-nutrition.html` | Per-serving nutrition (`recipe`) |
| `components/recipe-qty.html` | One scalable quantity (`qty`, `unit`, `grams_per_cup`, `scale`) |
| `components/recipe-temp.html` | A convertible temperature (`f`, `c`) |

A recipe index on a home page is one line:

```liquid
{% raw %}{% include components/recipe-index.html heading="What we're cooking" %}{% endraw %}
```

And a convertible temperature drops straight into prose:

```liquid
{% raw %}Heat the oven to {% include components/recipe-temp.html f=375 %}.{% endraw %}
```

## Structured data

Every recipe page emits one `schema.org/Recipe` JSON-LD block — name, image, author, times as ISO 8601 durations, yield, category, cuisine, keywords, ingredients, instructions, and calories — so recipes are eligible for search rich results without any extra plugin.

## Files

| Path | Role |
|---|---|
| `_layouts/recipe.html`, `_layouts/cookbook.html` | The two layouts |
| `_includes/components/recipe-*.html` | The component set |
| `assets/js/recipe-scaler.js` | Scaling and conversion engine (loaded only on recipe pages) |
| `_sass/components/_recipe.scss` | Styles, including a print stylesheet |
| `_data/recipe_courses.yml`, `_data/ingredient_densities.yml` | Course metadata and densities |

The unit table in `recipe-scaler.js` mirrors the one in `components/recipe-grams.html` — the build-time table feeds the ratio percentages, the runtime one feeds conversion. Change them together.
