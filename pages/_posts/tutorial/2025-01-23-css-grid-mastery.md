---
lastmod: 2026-06-22T12:00:00.000Z
title: "CSS Grid Mastery: Build Any Layout You Can Imagine"
description: "Master CSS Grid with a hands-on tutorial of live, interactive examples rendered in the browser — from your first grid to holy-grail and magazine layouts."
preview: /images/previews/css-grid-mastery-build-any-layout-you-can-imagine.png
date: 2025-01-23T10:00:00.000Z
author: default
layout: article
categories: [Tutorial]
tags: [css, grid, layout, web-design, frontend]
keywords: [css grid tutorial, css grid layout, grid-template-columns, grid-template-areas, responsive grid layout, holy grail layout, auto-fit minmax]
featured: true
image: /assets/images/posts/css-grid.jpg
estimated_reading_time: "18 min"
---

CSS Grid is the most powerful layout system in CSS. This tutorial takes you from your first grid to complex, real-world layouts — and every concept comes with a **live demo you can see rendered right here in the browser**, sitting next to the code that produces it. Resize the window or open your browser's grid inspector to watch each example respond.

<style>
/* === Live CSS Grid demos — all selectors scoped under .gd-demo === */ .gd-demo{ --gd-rgb: var(--bs-primary-rgb, 13,110,253); margin:1.25rem 0 1.9rem; padding:1rem 1rem 1.15rem; border:1px solid var(--bs-border-color, #dee2e6); border-radius:.85rem; background:var(--bs-tertiary-bg, #f8f9fa); } .gd-demo__label{ display:inline-flex; align-items:center; gap:.45rem; margin:0 0 .75rem; font-size:.72rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--bs-secondary-color, #6c757d); } .gd-demo__label::before{ content:""; width:.55rem; height:.55rem; border-radius:50%; background:#2ecc71; box-shadow:0 0 0 .22rem rgba(46,204,113,.22); } .gd-canvas{ display:grid; gap:12px; } .gd-box{ display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; min-height:58px; padding:.5rem .65rem; line-height:1.25; font-weight:600; color:#fff; border-radius:.55rem; background:rgb(var(--gd-rgb)); } .gd-box small{ display:block; font-weight:500; opacity:.85; font-size:.72rem; } .gd-box--p2{ background:rgba(var(--gd-rgb),.78); } .gd-box--p3{ background:rgba(var(--gd-rgb),.58); } .gd-box--purple{ background:#6f42c1; } .gd-box--teal{ background:#198f7b; } .gd-box--orange{ background:#e8590c; } .gd-box--content{ color:var(--bs-body-color); font-weight:600; background:rgba(var(--gd-rgb),.1); border:1px dashed rgba(var(--gd-rgb),.45); } .gd-hint{ margin-top:.7rem; font-size:.78rem; color:var(--bs-secondary-color, #6c757d); } .gd-hint code{ font-size:.78rem; } /* basic 3-col */ .gd--basic .gd-canvas{ grid-template-columns:repeat(3,1fr); } /* column sizing */ .gd--fr .gd-canvas{ grid-template-columns:1fr 2fr 1fr; } .gd--mixed .gd-canvas{ grid-template-columns:72px 1fr 72px; } /* auto-fit vs auto-fill */ .gd--autofit .gd-canvas{ grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); } .gd--autofill .gd-canvas{ grid-template-columns:repeat(auto-fill,minmax(110px,1fr)); } /* gap */ .gd--gap .gd-canvas{ grid-template-columns:repeat(3,1fr); row-gap:6px; column-gap:36px; } /* spanning grid lines */ .gd--lines .gd-canvas{ grid-template-columns:repeat(4,1fr); grid-auto-rows:58px; } .gd--lines .gd-span-all{ grid-column:1 / -1; } .gd--lines .gd-side{ grid-column:1; grid-row:2 / 4; } .gd--lines .gd-main{ grid-column:2 / -1; grid-row:2 / 4; } /* named areas */ .gd--areas .gd-canvas{ grid-template-columns:120px 1fr; grid-template-areas:"header header" "sidebar main" "footer footer"; grid-auto-rows:minmax(46px,auto); } .gd--areas .gd-a-header{ grid-area:header; } .gd--areas .gd-a-sidebar{ grid-area:sidebar; min-height:118px; } .gd--areas .gd-a-main{ grid-area:main; min-height:118px; } .gd--areas .gd-a-footer{ grid-area:footer; } /* interactive playground */ .gd-controls{ display:flex; flex-wrap:wrap; gap:.5rem; margin-bottom:.9rem; } .gd-btn{ cursor:pointer; user-select:none; font:600 .8rem/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; padding:.55rem .7rem; border-radius:.5rem; color:var(--bs-body-color); background:var(--bs-body-bg, #fff); border:1px solid var(--bs-border-color, #dee2e6); transition:all .12s ease; } .gd-btn:hover{ border-color:rgb(var(--gd-rgb)); } .gd-btn:focus-visible{ outline:2px solid rgb(var(--gd-rgb)); outline-offset:2px; } .gd-btn.is-active{ color:#fff; background:rgb(var(--gd-rgb)); border-color:rgb(var(--gd-rgb)); } .gd--play .gd-canvas{ grid-template-columns:repeat(4,1fr); grid-auto-rows:54px; } .gd-readout{ display:block; margin-top:.85rem; padding:.55rem .7rem; border-radius:.5rem; font-size:.82rem; background:var(--bs-body-bg, #fff); border:1px solid var(--bs-border-color, #dee2e6); color:var(--bs-body-color); } /* responsive card grid */ .gd--cards .gd-canvas{ grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:16px; } .gd-card{ display:block; padding:.9rem; border-radius:.6rem; text-decoration:none; color:var(--bs-body-color); background:var(--bs-body-bg, #fff); border:1px solid var(--bs-border-color, #dee2e6); box-shadow:0 1px 2px rgba(0,0,0,.05); transition:transform .12s ease, box-shadow .12s ease, border-color .12s ease; } .gd-card:hover, .gd-card:focus-visible{ transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.1); border-color:rgb(var(--gd-rgb)); outline:none; } .gd-eyebrow{ font-size:.68rem; text-transform:uppercase; letter-spacing:.05em; color:rgb(var(--gd-rgb)); font-weight:700; } .gd-title{ display:block; font-weight:700; margin:.2rem 0 .35rem; } .gd-text{ font-size:.82rem; color:var(--bs-secondary-color, #6c757d); } /* holy grail */ .gd--holy .gd-canvas{ grid-template-columns:90px 1fr 90px; grid-template-areas:"hd hd hd" "nav main aside" "ft ft ft"; min-height:232px; } .gd--holy .gd-hd{ grid-area:hd; } .gd--holy .gd-nav{ grid-area:nav; } .gd--holy .gd-main{ grid-area:main; } .gd--holy .gd-aside{ grid-area:aside; } .gd--holy .gd-ft{ grid-area:ft; } @media (max-width:560px){ .gd--holy .gd-canvas{ grid-template-columns:1fr; grid-template-areas:"hd" "nav" "main" "aside" "ft"; } } /* magazine */ .gd--mag .gd-canvas{ grid-template-columns:repeat(4,1fr); grid-auto-rows:72px; gap:10px; } .gd--mag .gd-feature{ grid-column:1 / 3; grid-row:1 / 3; } .gd--mag .gd-wide{ grid-column:3 / 5; } @media (max-width:540px){ .gd--mag .gd-canvas{ grid-template-columns:repeat(2,1fr); } .gd--mag .gd-feature{ grid-column:1 / 3; grid-row:1 / 3; } .gd--mag .gd-wide{ grid-column:1 / 3; } } /* alignment */ .gd--align .gd-canvas{ grid-template-columns:repeat(3,1fr); grid-auto-rows:80px; justify-items:center; align-items:center; } .gd--align .gd-box{ min-height:auto; width:72px; height:40px; } .gd--align .gd-self{ justify-self:end; align-self:start; } /* implicit grid + dense packing */ .gd--dense .gd-canvas{ grid-template-columns:repeat(4,1fr); grid-auto-rows:46px; grid-auto-flow:dense; } .gd--dense .gd-w2{ grid-column:span 2; } .gd--dense .gd-h2{ grid-row:span 2; }
</style>

## How Grid Thinks

Flexbox lays out content in a single direction — a row *or* a column. Grid works in two dimensions at once: you define columns and rows, then place items into the cells they create. That makes Grid the right tool for page-level layouts, dashboards, image galleries, and any design where alignment matters both across and down.

Every demo below is real CSS Grid rendered by your browser — not a screenshot. Each one sits next to the code that produces it, so you can read the rule and see its effect in the same place.

## Getting Started with Grid

### Creating a Grid Container

Set `display: grid` on a container, declare your columns, and the children become grid items automatically.

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;
  gap: 20px;
}
```

```html
<div class="container">
  <div class="item">1</div>
  <div class="item">2</div>
  <div class="item">3</div>
  <div class="item">4</div>
  <div class="item">5</div>
  <div class="item">6</div>
</div>
```

<div class="gd-demo gd--basic">
  <div class="gd-demo__label">Live result · repeat(3, 1fr)</div>
  <div class="gd-canvas">
    <div class="gd-box">1</div>
    <div class="gd-box">2</div>
    <div class="gd-box">3</div>
    <div class="gd-box">4</div>
    <div class="gd-box">5</div>
    <div class="gd-box">6</div>
  </div>
</div>

Six items flow into three equal columns, wrapping onto a new row automatically. The `gap` is the gutter you can see between every cell.

## Essential Grid Properties

### Defining Columns and Rows

`grid-template-columns` accepts fixed lengths, flexible fractions, or a mix of both. These are the patterns you will reach for most often.

```css
/* Fixed sizes */
grid-template-columns: 200px 200px 200px;

/* Flexible sizes */
grid-template-columns: 1fr 2fr 1fr;

/* Mixed */
grid-template-columns: 200px 1fr 200px;

/* Repeat function */
grid-template-columns: repeat(4, 1fr);

/* Auto-fit for responsive grids */
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
```

The `1fr 2fr 1fr` pattern splits the row into four parts and gives the middle column two of them:

<div class="gd-demo gd--fr">
  <div class="gd-demo__label">Live result · 1fr 2fr 1fr</div>
  <div class="gd-canvas">
    <div class="gd-box">1fr</div>
    <div class="gd-box gd-box--p2">2fr</div>
    <div class="gd-box">1fr</div>
  </div>
</div>

Mixing fixed and flexible tracks pins the outer columns and lets the center absorb the rest of the width:

<div class="gd-demo gd--mixed">
  <div class="gd-demo__label">Live result · 72px 1fr 72px</div>
  <div class="gd-canvas">
    <div class="gd-box gd-box--p3">72px</div>
    <div class="gd-box">1fr</div>
    <div class="gd-box gd-box--p3">72px</div>
  </div>
</div>

### The fr Unit and minmax()

The `fr` unit represents one fraction of the *leftover* space in the container, distributed after fixed tracks and gaps are subtracted. Combine it with `minmax(min, max)` to give a track a floor and a ceiling: `minmax(250px, 1fr)` never lets a column shrink below 250px but allows it to grow and fill space. This pairing is the engine behind responsive grids that need no media queries.

### auto-fit vs auto-fill

Both keywords build as many columns as will fit, but they treat leftover space differently. `auto-fill` keeps empty "phantom" tracks, so your items stay at their minimum width. `auto-fit` collapses empty tracks to zero, letting the real items stretch to fill the row. Drop the same three items into each and the difference is obvious on a wide screen:

```css
/* Items stretch to fill the row */
grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));

/* Empty tracks are preserved; items stay narrow */
grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
```

<div class="gd-demo gd--autofit">
  <div class="gd-demo__label">Live result · auto-fit (tracks collapse, items stretch)</div>
  <div class="gd-canvas">
    <div class="gd-box">1</div>
    <div class="gd-box">2</div>
    <div class="gd-box">3</div>
  </div>
</div>

<div class="gd-demo gd--autofill">
  <div class="gd-demo__label">Live result · auto-fill (empty tracks reserved)</div>
  <div class="gd-canvas">
    <div class="gd-box gd-box--purple">1</div>
    <div class="gd-box gd-box--purple">2</div>
    <div class="gd-box gd-box--purple">3</div>
  </div>
  <div class="gd-hint">↔ Resize the window on a wide screen: <code>auto-fill</code> leaves room for columns that have no item yet.</div>
</div>

### Grid Gap

`gap` sets the gutter between tracks. Use the shorthand for equal spacing, or set the row and column gutters independently.

```css
/* Shorthand */
gap: 20px;

/* Individual */
row-gap: 20px;
column-gap: 30px;
```

<div class="gd-demo gd--gap">
  <div class="gd-demo__label">Live result · row-gap 6px · column-gap 36px</div>
  <div class="gd-canvas">
    <div class="gd-box">1</div>
    <div class="gd-box">2</div>
    <div class="gd-box">3</div>
    <div class="gd-box">4</div>
    <div class="gd-box">5</div>
    <div class="gd-box">6</div>
  </div>
</div>

## Placing Items on the Grid

### Grid Lines

Grid tracks are bounded by numbered lines, starting at 1 on the left/top. `-1` is shorthand for the last line, so `grid-column: 1 / -1` spans every column. Use line numbers to make an item straddle multiple tracks.

```css
.header {
  grid-column: 1 / -1; /* Span all columns */
  grid-row: 1;
}

.sidebar {
  grid-column: 1;
  grid-row: 2 / 4; /* Span rows 2 and 3 */
}

.main {
  grid-column: 2 / -1;
  grid-row: 2;
}
```

<div class="gd-demo gd--lines">
  <div class="gd-demo__label">Live result · spanning with line numbers</div>
  <div class="gd-canvas">
    <div class="gd-box gd-span-all">header<small>grid-column: 1 / -1</small></div>
    <div class="gd-box gd-box--purple gd-side">sidebar<small>row 2 / 4</small></div>
    <div class="gd-box gd-box--content gd-main">main<small>grid-column: 2 / -1</small></div>
  </div>
</div>

### Named Grid Areas

For layouts you can describe in words, `grid-template-areas` lets you draw the layout as ASCII art, then assign each item to a named region. It is the most readable way to express a page skeleton.

```css
.container {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header  header"
    "sidebar main"
    "footer  footer";
  min-height: 100vh;
}

.header {
  grid-area: header;
}
.sidebar {
  grid-area: sidebar;
}
.main {
  grid-area: main;
}
.footer {
  grid-area: footer;
}
```

<div class="gd-demo gd--areas">
  <div class="gd-demo__label">Live result · grid-template-areas</div>
  <div class="gd-canvas">
    <div class="gd-box gd-a-header">header</div>
    <div class="gd-box gd-box--purple gd-a-sidebar">sidebar</div>
    <div class="gd-box gd-box--content gd-a-main">main</div>
    <div class="gd-box gd-a-footer">footer</div>
  </div>
</div>

## Try It: Interactive Grid Playground

Reading about tracks is one thing — feeling them snap into place is another. Click a value below to rewrite `grid-template-columns` on the live grid and watch the eight items reflow instantly.

<div class="gd-demo gd--play" id="gd-playground">
  <div class="gd-demo__label">Interactive · choose a column template</div>
  <div class="gd-controls">
    <span class="gd-btn is-active" role="button" tabindex="0" aria-pressed="true" data-cols="repeat(4, 1fr)">repeat(4, 1fr)</span>
    <span class="gd-btn" role="button" tabindex="0" aria-pressed="false" data-cols="1fr 2fr 1fr">1fr 2fr 1fr</span>
    <span class="gd-btn" role="button" tabindex="0" aria-pressed="false" data-cols="repeat(2, 1fr)">repeat(2, 1fr)</span>
    <span class="gd-btn" role="button" tabindex="0" aria-pressed="false" data-cols="80px 1fr 80px">80px 1fr 80px</span>
    <span class="gd-btn" role="button" tabindex="0" aria-pressed="false" data-cols="repeat(auto-fit, minmax(90px, 1fr))">auto-fit minmax</span>
  </div>
  <div class="gd-canvas">
    <div class="gd-box">1</div>
    <div class="gd-box gd-box--p2">2</div>
    <div class="gd-box gd-box--p3">3</div>
    <div class="gd-box gd-box--purple">4</div>
    <div class="gd-box gd-box--teal">5</div>
    <div class="gd-box gd-box--orange">6</div>
    <div class="gd-box gd-box--p2">7</div>
    <div class="gd-box gd-box--p3">8</div>
  </div>
  <code class="gd-readout">grid-template-columns: repeat(4, 1fr);</code>
</div>

## Real-World Layout Examples

### Card Grid (Auto-responsive)

The single most useful Grid recipe: a card grid that reflows on its own, no breakpoints required. `auto-fill` plus `minmax` decides how many cards fit per row as the container resizes.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 24px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

<div class="gd-demo gd--cards">
  <div class="gd-demo__label">Live result · hover a card, then resize</div>
  <div class="gd-canvas">
    <a class="gd-card" href="#card-grid-auto-responsive">
      <span class="gd-eyebrow">Start</span>
      <span class="gd-title">Getting Started</span>
      <span class="gd-text">Install the theme and publish your first page.</span>
    </a>
    <a class="gd-card" href="#card-grid-auto-responsive">
      <span class="gd-eyebrow">Design</span>
      <span class="gd-title">Customization</span>
      <span class="gd-text">Adjust layouts, navigation, colors, and includes.</span>
    </a>
    <a class="gd-card" href="#card-grid-auto-responsive">
      <span class="gd-eyebrow">Publish</span>
      <span class="gd-title">Deployment</span>
      <span class="gd-text">Ship to GitHub Pages, Netlify, or a custom domain.</span>
    </a>
    <a class="gd-card" href="#card-grid-auto-responsive">
      <span class="gd-eyebrow">Extend</span>
      <span class="gd-title">Plugins</span>
      <span class="gd-text">Add search, sitemaps, and Obsidian-style links.</span>
    </a>
  </div>
</div>

### Holy Grail Layout

The classic application shell — header, footer, a main column, and two flanking rails. Named areas make it a four-line declaration, and a single media query collapses it into a single column on small screens.

```css
.holy-grail {
  display: grid;
  grid-template:
    "header header header" auto
    "nav    main   aside" 1fr
    "footer footer footer" auto
    / 200px 1fr 200px;
  min-height: 100vh;
}

@media (max-width: 768px) {
  .holy-grail {
    grid-template:
      "header" auto
      "nav" auto
      "main" 1fr
      "aside" auto
      "footer" auto
      / 1fr;
  }
}
```

<div class="gd-demo gd--holy">
  <div class="gd-demo__label">Live result · resize narrow to watch it stack</div>
  <div class="gd-canvas">
    <div class="gd-box gd-hd">header</div>
    <div class="gd-box gd-box--purple gd-nav">nav</div>
    <div class="gd-box gd-box--content gd-main">main content</div>
    <div class="gd-box gd-box--orange gd-aside">aside</div>
    <div class="gd-box gd-ft">footer</div>
  </div>
</div>

### Magazine Layout

Editorial layouts mix a large feature tile with smaller stories. Span the feature across two columns and two rows, let a secondary block run wide, and allow the rest to auto-place around them.

```css
.magazine {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 200px);
  gap: 16px;
}

.featured {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
}

.secondary {
  grid-column: 3 / 5;
}
```

<div class="gd-demo gd--mag">
  <div class="gd-demo__label">Live result · feature + auto-placed stories</div>
  <div class="gd-canvas">
    <div class="gd-box gd-feature">Featured<small>spans 2 × 2</small></div>
    <div class="gd-box gd-box--purple gd-wide">Secondary<small>spans 2 cols</small></div>
    <div class="gd-box gd-box--p2">1</div>
    <div class="gd-box gd-box--p2">2</div>
    <div class="gd-box gd-box--teal">3</div>
    <div class="gd-box gd-box--teal">4</div>
    <div class="gd-box gd-box--p3">5</div>
    <div class="gd-box gd-box--p3">6</div>
  </div>
</div>

## Advanced Techniques

### Alignment

Grid gives you two axes of control. `justify-*` works along the row (horizontal), `align-*` along the column (vertical). Set defaults on the container with `justify-items`/`align-items`, then override a single item with `justify-self`/`align-self`.

```css
.container {
  /* Align all items within their cells */
  justify-items: center; /* horizontal */
  align-items: center; /* vertical */

  /* Align the whole grid within the container */
  justify-content: center;
  align-content: center;
}

.item {
  /* Override one item */
  justify-self: end;
  align-self: start;
}
```

<div class="gd-demo gd--align">
  <div class="gd-demo__label">Live result · all centered, one self-aligned</div>
  <div class="gd-canvas">
    <div class="gd-box">center</div>
    <div class="gd-box">center</div>
    <div class="gd-box gd-box--orange gd-self">end / start</div>
    <div class="gd-box">center</div>
    <div class="gd-box">center</div>
    <div class="gd-box">center</div>
  </div>
</div>

### Implicit Grid and Dense Packing

When items land outside your explicit tracks, Grid creates *implicit* rows to hold them — size those with `grid-auto-rows`. Set `grid-auto-flow: dense` and Grid backfills earlier gaps with later items that fit, producing a tight, masonry-like pack.

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  /* Size auto-created rows */
  grid-auto-rows: minmax(100px, auto);
  /* Backfill holes with items that fit */
  grid-auto-flow: dense;
}
```

<div class="gd-demo gd--dense">
  <div class="gd-demo__label">Live result · mixed spans packed with dense</div>
  <div class="gd-canvas">
    <div class="gd-box gd-w2">span 2</div>
    <div class="gd-box gd-box--purple gd-h2">span row 2</div>
    <div class="gd-box gd-box--teal">3</div>
    <div class="gd-box gd-box--orange">4</div>
    <div class="gd-box gd-w2 gd-box--p2">span 2</div>
    <div class="gd-box gd-box--p3">6</div>
    <div class="gd-box">7</div>
    <div class="gd-box gd-box--purple">8</div>
    <div class="gd-box gd-box--teal">9</div>
  </div>
</div>

### Subgrid

When a grid item is itself a grid, `grid-template-columns: subgrid` (or `subgrid` for rows) lets the child reuse the parent's track lines instead of defining its own. It is the cleanest fix for card grids where every card's header, body, and footer must line up across the whole row regardless of content length. Subgrid is now supported across all major browsers.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.card {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid; /* share the parent's row lines */
}
```

## Browser DevTools

Your browser's grid inspector turns these abstractions into something you can see:

1. Open DevTools (<kbd>F12</kbd>, or <kbd>Cmd</kbd>+<kbd>Opt</kbd>+<kbd>I</kbd> on macOS).
2. Select the grid container in the Elements panel.
3. Click the **grid** badge next to it to toggle the overlay.
4. Enable line numbers and area names to label every track.

Chrome and Firefox both render the overlay live, so editing `grid-template-columns` in the Styles panel updates the lines as you type — try it on any demo on this page.

## Conclusion

CSS Grid makes complex layouts simple. Start with `display: grid` and a column template, lean on `fr` and `minmax` for responsive sizing, reach for named areas when a layout reads better as a picture, and finish with alignment and dense packing for the details. With the patterns above — and the live demos to experiment against — you have everything you need to build sophisticated layouts with confidence.

For the complete property reference, keep [MDN's CSS Grid Layout guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout) close while you practice.

## Related Reading

- [Build a Responsive Documentation Card Grid](/posts/2026/04/28/responsive-documentation-card-grid/) — put `auto-fit` and `minmax()` to work on a real documentation index.
- [Accessible Form Patterns: Labels, Errors, and Helpful States](/posts/2026/04/28/accessible-form-patterns/) — pair these layouts with forms everyone can use.
- [Bootstrap 5 integration](/docs/bootstrap/) — how the theme's flexbox-based Bootstrap grid complements native CSS Grid.
- [Customizing layouts](/docs/customization/layouts/) — the theme's layout hierarchy and where your grids fit in.

<script>
(function () { var pg = document.getElementById('gd-playground'); if (pg) {
    var canvas = pg.querySelector('.gd-canvas');
    var readout = pg.querySelector('.gd-readout');
    var btns = pg.querySelectorAll('.gd-btn');
    var apply = function (cols, btn) {
      canvas.style.gridTemplateColumns = cols;
      readout.textContent = 'grid-template-columns: ' + cols + ';';
      btns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    };
    btns.forEach(function (b) {
      var cols = b.getAttribute('data-cols');
      b.addEventListener('click', function () { apply(cols, b); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apply(cols, b); }
      });
    });
} document.querySelectorAll('.gd-demo .gd-card').forEach(function (c) {
    c.addEventListener('click', function (e) { e.preventDefault(); });
}); })();
</script>
