---
title: "The Zer0 Kitchen"
subtitle: "A demo cookbook for the recipes collection"
layout: cookbook
cookbook: zer0-kitchen
author: "The zer0-mistakes theme"
description: >-
  Three worked recipes that exercise the whole cookbook collection: structured
  ingredients, baker's-percentage ratios, serving scaling, and live US↔metric
  conversion.
permalink: /recipes/
sitemap: true
lastmod: 2026-08-23T00:00:00.000Z
---

**The Zer0 Kitchen** ships with the theme so you can see the `recipes` collection end to end before writing a recipe of your own. Each one below is deliberately different:

- **[No-Knead Focaccia](/recipes/no-knead-focaccia/)** is written in grams, so it shows the ratio table doing what it is for — every ingredient as a percentage of the flour — and converts *down* to cups when you ask for US units.
- **[Brown Butter Chocolate Chip Cookies](/recipes/brown-butter-chocolate-chip-cookies/)** is written in cups and spoons, so it shows the reverse trip: switch to metric and every volume becomes a weight, using the densities in `_data/ingredient_densities.yml`.
- **[Weeknight Tomato-Butter Pasta](/recipes/weeknight-tomato-butter-pasta/)** has no formula worth tabulating, so its ratio section simply does not render — and it shows quantity *ranges* ("4–6 cloves") and countable ingredients scaling sensibly.

Try the controls at the top of any recipe: change the servings, then switch between **As written**, **Metric**, and **US**. Nothing on the page is generated at build time for a specific scale — the amounts you land on are computed in the browser, and the page is complete and correct with JavaScript switched off.

To build your own cookbook, copy this folder's shape: one file per recipe with `layout: recipe` (the collection default) and structured front matter, plus an `index.md` with `layout: cookbook`. The full guide lives at [Cookbook collection](/docs/features/cookbook-collection/).
