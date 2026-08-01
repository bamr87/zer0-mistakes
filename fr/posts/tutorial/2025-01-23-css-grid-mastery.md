---
lastmod: 2026-06-22 12:00:00.000000000 Z
title: 'Maîtriser CSS Grid : construire toutes les mises en page imaginables'
description: Maîtrisez CSS Grid grâce à un tutoriel pratique d'exemples interactifs
  en direct affichés dans le navigateur — de votre première grille aux mises en page
  holy-grail et magazine.
preview: "/images/previews/css-grid-mastery-build-any-layout-you-can-imagine.png"
date: 2025-01-23 10:00:00.000000000 Z
author: default
layout: article
categories:
- Tutorial
tags:
- css
- grid
- layout
- web-design
- frontend
keywords:
- css grid tutorial
- css grid layout
- grid-template-columns
- grid-template-areas
- responsive grid layout
- holy grail layout
- auto-fit minmax
featured: true
image: "/assets/images/posts/css-grid.jpg"
estimated_reading_time: 18 min
lang: fr
permalink: "/fr/posts/2025/01/23/css-grid-mastery/"
translation_of: pages/_posts/tutorial/2025-01-23-css-grid-mastery.md
translation_source_url: "/posts/2025/01/23/css-grid-mastery/"
machine_translated: true
translated_from_sha: bdc8ce77df05
---

CSS Grid est le système de mise en page le plus puissant de CSS. Ce tutoriel vous accompagne depuis votre première grille jusqu'à des mises en page complexes et concrètes — et chaque concept s'accompagne d'une **démo interactive que vous pouvez voir rendue directement ici dans le navigateur**, à côté du code qui la produit. Redimensionnez la fenêtre ou ouvrez l'inspecteur de grille de votre navigateur pour observer la réaction de chaque exemple.

<style>
/* === Live CSS Grid demos — all selectors scoped under .gd-demo === */ .gd-demo{ --gd-rgb: var(--bs-primary-rgb, 13,110,253); margin:1.25rem 0 1.9rem; padding:1rem 1rem 1.15rem; border:1px solid var(--bs-border-color, #dee2e6); border-radius:.85rem; background:var(--bs-tertiary-bg, #f8f9fa); } .gd-demo__label{ display:inline-flex; align-items:center; gap:.45rem; margin:0 0 .75rem; font-size:.72rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--bs-secondary-color, #6c757d); } .gd-demo__label::before{ content:""; width:.55rem; height:.55rem; border-radius:50%; background:#2ecc71; box-shadow:0 0 0 .22rem rgba(46,204,113,.22); } .gd-canvas{ display:grid; gap:12px; } .gd-box{ display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; min-height:58px; padding:.5rem .65rem; line-height:1.25; font-weight:600; color:#fff; border-radius:.55rem; background:rgb(var(--gd-rgb)); } .gd-box small{ display:block; font-weight:500; opacity:.85; font-size:.72rem; } .gd-box--p2{ background:rgba(var(--gd-rgb),.78); } .gd-box--p3{ background:rgba(var(--gd-rgb),.58); } .gd-box--purple{ background:#6f42c1; } .gd-box--teal{ background:#198f7b; } .gd-box--orange{ background:#e8590c; } .gd-box--content{ color:var(--bs-body-color); font-weight:600; background:rgba(var(--gd-rgb),.1); border:1px dashed rgba(var(--gd-rgb),.45); } .gd-hint{ margin-top:.7rem; font-size:.78rem; color:var(--bs-secondary-color, #6c757d); } .gd-hint code{ font-size:.78rem; } /* basic 3-col */ .gd--basic .gd-canvas{ grid-template-columns:repeat(3,1fr); } /* column sizing */ .gd--fr .gd-canvas{ grid-template-columns:1fr 2fr 1fr; } .gd--mixed .gd-canvas{ grid-template-columns:72px 1fr 72px; } /* auto-fit vs auto-fill */ .gd--autofit .gd-canvas{ grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); } .gd--autofill .gd-canvas{ grid-template-columns:repeat(auto-fill,minmax(110px,1fr)); } /* gap */ .gd--gap .gd-canvas{ grid-template-columns:repeat(3,1fr); row-gap:6px; column-gap:36px; } /* spanning grid lines */ .gd--lines .gd-canvas{ grid-template-columns:repeat(4,1fr); grid-auto-rows:58px; } .gd--lines .gd-span-all{ grid-column:1 / -1; } .gd--lines .gd-side{ grid-column:1; grid-row:2 / 4; } .gd--lines .gd-main{ grid-column:2 / -1; grid-row:2 / 4; } /* named areas */ .gd--areas .gd-canvas{ grid-template-columns:120px 1fr; grid-template-areas:"header header" "sidebar main" "footer footer"; grid-auto-rows:minmax(46px,auto); } .gd--areas .gd-a-header{ grid-area:header; } .gd--areas .gd-a-sidebar{ grid-area:sidebar; min-height:118px; } .gd--areas .gd-a-main{ grid-area:main; min-height:118px; } .gd--areas .gd-a-footer{ grid-area:footer; } /* interactive playground */ .gd-controls{ display:flex; flex-wrap:wrap; gap:.5rem; margin-bottom:.9rem; } .gd-btn{ cursor:pointer; user-select:none; font:600 .8rem/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; padding:.55rem .7rem; border-radius:.5rem; color:var(--bs-body-color); background:var(--bs-body-bg, #fff); border:1px solid var(--bs-border-color, #dee2e6); transition:all .12s ease; } .gd-btn:hover{ border-color:rgb(var(--gd-rgb)); } .gd-btn:focus-visible{ outline:2px solid rgb(var(--gd-rgb)); outline-offset:2px; } .gd-btn.is-active{ color:#fff; background:rgb(var(--gd-rgb)); border-color:rgb(var(--gd-rgb)); } .gd--play .gd-canvas{ grid-template-columns:repeat(4,1fr); grid-auto-rows:54px; } .gd-readout{ display:block; margin-top:.85rem; padding:.55rem .7rem; border-radius:.5rem; font-size:.82rem; background:var(--bs-body-bg, #fff); border:1px solid var(--bs-border-color, #dee2e6); color:var(--bs-body-color); } /* responsive card grid */ .gd--cards .gd-canvas{ grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:16px; } .gd-card{ display:block; padding:.9rem; border-radius:.6rem; text-decoration:none; color:var(--bs-body-color); background:var(--bs-body-bg, #fff); border:1px solid var(--bs-border-color, #dee2e6); box-shadow:0 1px 2px rgba(0,0,0,.05); transition:transform .12s ease, box-shadow .12s ease, border-color .12s ease; } .gd-card:hover, .gd-card:focus-visible{ transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.1); border-color:rgb(var(--gd-rgb)); outline:none; } .gd-eyebrow{ font-size:.68rem; text-transform:uppercase; letter-spacing:.05em; color:rgb(var(--gd-rgb)); font-weight:700; } .gd-title{ display:block; font-weight:700; margin:.2rem 0 .35rem; } .gd-text{ font-size:.82rem; color:var(--bs-secondary-color, #6c757d); } /* holy grail */ .gd--holy .gd-canvas{ grid-template-columns:90px 1fr 90px; grid-template-areas:"hd hd hd" "nav main aside" "ft ft ft"; min-height:232px; } .gd--holy .gd-hd{ grid-area:hd; } .gd--holy .gd-nav{ grid-area:nav; } .gd--holy .gd-main{ grid-area:main; } .gd--holy .gd-aside{ grid-area:aside; } .gd--holy .gd-ft{ grid-area:ft; } @media (max-width:560px){ .gd--holy .gd-canvas{ grid-template-columns:1fr; grid-template-areas:"hd" "nav" "main" "aside" "ft"; } } /* magazine */ .gd--mag .gd-canvas{ grid-template-columns:repeat(4,1fr); grid-auto-rows:72px; gap:10px; } .gd--mag .gd-feature{ grid-column:1 / 3; grid-row:1 / 3; } .gd--mag .gd-wide{ grid-column:3 / 5; } @media (max-width:540px){ .gd--mag .gd-canvas{ grid-template-columns:repeat(2,1fr); } .gd--mag .gd-feature{ grid-column:1 / 3; grid-row:1 / 3; } .gd--mag .gd-wide{ grid-column:1 / 3; } } /* alignment */ .gd--align .gd-canvas{ grid-template-columns:repeat(3,1fr); grid-auto-rows:80px; justify-items:center; align-items:center; } .gd--align .gd-box{ min-height:auto; width:72px; height:40px; } .gd--align .gd-self{ justify-self:end; align-self:start; } /* implicit grid + dense packing */ .gd--dense .gd-canvas{ grid-template-columns:repeat(4,1fr); grid-auto-rows:46px; grid-auto-flow:dense; } .gd--dense .gd-w2{ grid-column:span 2; } .gd--dense .gd-h2{ grid-row:span 2; }
</style>

## Comment fonctionne Grid

Flexbox dispose le contenu dans une seule direction — une ligne *ou* une colonne. Grid travaille dans deux dimensions à la fois : vous définissez des colonnes et des lignes, puis vous placez les éléments dans les cellules qu'elles créent. Cela fait de Grid l'outil idéal pour les mises en page de niveau page, les tableaux de bord, les galeries d'images et tout design où l'alignement compte à la fois horizontalement et verticalement.

Chaque démonstration ci-dessous est un véritable CSS Grid rendu par votre navigateur — pas une capture d'écran. Chacune est placée à côté du code qui la produit, afin que vous puissiez lire la règle et en voir l'effet au même endroit.

## Premiers pas avec Grid

### Créer un conteneur Grid

Définissez `display: grid` sur un conteneur, déclarez vos colonnes, et les enfants deviennent automatiquement des éléments de grille.

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
  <div class="gd-demo__label">Résultat en direct · repeat(3, 1fr)</div>
  <div class="gd-canvas">
    <div class="gd-box">1</div>
    <div class="gd-box">2</div>
    <div class="gd-box">3</div>
    <div class="gd-box">4</div>
    <div class="gd-box">5</div>
    <div class="gd-box">6</div>
  </div>
</div>

Six éléments se répartissent dans trois colonnes égales, passant automatiquement à une nouvelle ligne. Le `gap` est la gouttière visible entre chaque cellule.

## Propriétés essentielles de Grid

### Définir les colonnes et les lignes

`grid-template-columns` accepte des longueurs fixes, des fractions flexibles ou un mélange des deux. Voici les modèles auxquels vous ferez le plus souvent appel.

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

Le modèle `1fr 2fr 1fr` divise la ligne en quatre parts et en attribue deux à la colonne centrale :

<div class="gd-demo gd--fr">
  <div class="gd-demo__label">Résultat en direct · 1fr 2fr 1fr</div>
  <div class="gd-canvas">
    <div class="gd-box">1fr</div>
    <div class="gd-box gd-box--p2">2fr</div>
    <div class="gd-box">1fr</div>
  </div>
</div>

Mélanger des pistes fixes et flexibles fige les colonnes extérieures et laisse le centre absorber le reste de la largeur :

<div class="gd-demo gd--mixed">
  <div class="gd-demo__label">Résultat en direct · 72px 1fr 72px</div>
  <div class="gd-canvas">
    <div class="gd-box gd-box--p3">72px</div>
    <div class="gd-box">1fr</div>
    <div class="gd-box gd-box--p3">72px</div>
  </div>
</div>

### L'unité fr et minmax()

L'unité `fr` représente une fraction de l'espace *restant* dans le conteneur, réparti après soustraction des pistes fixes et des gouttières. Combinez-la avec `minmax(min, max)` pour donner à une piste un plancher et un plafond : `minmax(250px, 1fr)` ne laisse jamais une colonne descendre sous 250px mais lui permet de grandir et de remplir l'espace. Cette association est le moteur des grilles responsives qui n'ont besoin d'aucune media query.

### auto-fit vs auto-fill

Les deux mots-clés créent autant de colonnes que possible, mais ils traitent l'espace restant différemment. `auto-fill` conserve des pistes « fantômes » vides, de sorte que vos éléments restent à leur largeur minimale. `auto-fit` réduit les pistes vides à zéro, laissant les éléments réels s'étirer pour remplir la ligne. Placez les trois mêmes éléments dans chacun et la différence est évidente sur un écran large :

```css
/* Items stretch to fill the row */
grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));

/* Empty tracks are preserved; items stay narrow */
grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
```

<div class="gd-demo gd--autofit">
  <div class="gd-demo__label">Résultat en direct · auto-fit (les pistes s'effondrent, les éléments s'étirent)</div>
  <div class="gd-canvas">
    <div class="gd-box">1</div>
    <div class="gd-box">2</div>
    <div class="gd-box">3</div>
  </div>
</div>

<div class="gd-demo gd--autofill">
  <div class="gd-demo__label">Résultat en direct · auto-fill (pistes vides réservées)</div>
  <div class="gd-canvas">
    <div class="gd-box gd-box--purple">1</div>
    <div class="gd-box gd-box--purple">2</div>
    <div class="gd-box gd-box--purple">3</div>
  </div>
  <div class="gd-hint">↔ Redimensionnez la fenêtre sur un écran large : <code>auto-fill</code> laisse de la place pour des colonnes qui n'ont pas encore d'élément.</div>
</div>

### Espacement de la grille

`gap` définit la gouttière entre les pistes. Utilisez le raccourci pour un espacement égal, ou définissez indépendamment les gouttières de ligne et de colonne.

```css
/* Shorthand */
gap: 20px;

/* Individual */
row-gap: 20px;
column-gap: 30px;
```

<div class="gd-demo gd--gap">
  <div class="gd-demo__label">Résultat en direct · row-gap 6px · column-gap 36px</div>
  <div class="gd-canvas">
    <div class="gd-box">1</div>
    <div class="gd-box">2</div>
    <div class="gd-box">3</div>
    <div class="gd-box">4</div>
    <div class="gd-box">5</div>
    <div class="gd-box">6</div>
  </div>
</div>

## Placer des éléments sur la grille

### Lignes de grille

Les pistes de grille sont délimitées par des lignes numérotées, commençant à 1 à gauche/en haut. `-1` est un raccourci pour la dernière ligne, ainsi `grid-column: 1 / -1` s'étend sur toutes les colonnes. Utilisez les numéros de ligne pour faire chevaucher plusieurs pistes à un élément.

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
  <div class="gd-demo__label">Résultat en direct · étendue avec numéros de ligne</div>
  <div class="gd-canvas">
    <div class="gd-box gd-span-all">header<small>grid-column: 1 / -1</small></div>
    <div class="gd-box gd-box--purple gd-side">sidebar<small>row 2 / 4</small></div>
    <div class="gd-box gd-box--content gd-main">main<small>grid-column: 2 / -1</small></div>
  </div>
</div>

### Zones de grille nommées

Pour les mises en page que vous pouvez décrire avec des mots, `grid-template-areas` vous permet de dessiner la disposition comme de l'art ASCII, puis d'affecter chaque élément à une région nommée. C'est la façon la plus lisible d'exprimer la structure d'une page.

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
  <div class="gd-demo__label">Résultat en direct · grid-template-areas</div>
  <div class="gd-canvas">
    <div class="gd-box gd-a-header">header</div>
    <div class="gd-box gd-box--purple gd-a-sidebar">sidebar</div>
    <div class="gd-box gd-box--content gd-a-main">main</div>
    <div class="gd-box gd-a-footer">footer</div>
  </div>
</div>

## Essayez : bac à sable Grid interactif

Lire des articles sur les pistes est une chose — les sentir se mettre en place en est une autre. Cliquez sur une valeur ci-dessous pour réécrire `grid-template-columns` sur la grille en direct et regardez les huit éléments se réagencer instantanément.

<div class="gd-demo gd--play" id="gd-playground">
  <div class="gd-demo__label">Interactif · choisissez un modèle de colonnes</div>
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

## Exemples de mises en page réelles

### Grille de cartes (auto-responsive)

La recette Grid la plus utile de toutes : une grille de cartes qui se réagence toute seule, sans point de rupture requis. `auto-fill` combiné à `minmax` détermine combien de cartes tiennent par ligne au fur et à mesure que le conteneur se redimensionne.

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
  <div class="gd-demo__label">Résultat en direct · survolez une carte, puis redimensionnez</div>
  <div class="gd-canvas">
    <a class="gd-card" href="#card-grid-auto-responsive">
      <span class="gd-eyebrow">Démarrer</span>
      <span class="gd-title">Premiers pas</span>
      <span class="gd-text">Installez le thème et publiez votre première page.</span>
    </a>
    <a class="gd-card" href="#card-grid-auto-responsive">
      <span class="gd-eyebrow">Conception</span>
      <span class="gd-title">Personnalisation</span>
      <span class="gd-text">Ajustez les mises en page, la navigation, les couleurs et les includes.</span>
    </a>
    <a class="gd-card" href="#card-grid-auto-responsive">
      <span class="gd-eyebrow">Publier</span>
      <span class="gd-title">Déploiement</span>
      <span class="gd-text">Déployez sur GitHub Pages, Netlify ou un domaine personnalisé.</span>
    </a>
    <a class="gd-card" href="#card-grid-auto-responsive">
      <span class="gd-eyebrow">Étendre</span>
      <span class="gd-title">Plugins</span>
      <span class="gd-text">Ajoutez la recherche, les sitemaps et les liens de style Obsidian.</span>
    </a>
  </div>
</div>

### Mise en page Holy Grail

La coquille d'application classique — en-tête, pied de page, une colonne principale et deux rails latéraux. Les zones nommées en font une déclaration de quatre lignes, et une seule media query la réduit à une colonne unique sur les petits écrans.

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
  <div class="gd-demo__label">Résultat en direct · redimensionnez en étroit pour le voir s'empiler</div>
  <div class="gd-canvas">
    <div class="gd-box gd-hd">en-tête</div>
    <div class="gd-box gd-box--purple gd-nav">nav</div>
    <div class="gd-box gd-box--content gd-main">contenu principal</div>
    <div class="gd-box gd-box--orange gd-aside">aside</div>
    <div class="gd-box gd-ft">pied de page</div>
  </div>
</div>

### Mise en page magazine

Les mises en page éditoriales combinent une grande tuile vedette avec des articles plus petits. Étendez la vedette sur deux colonnes et deux lignes, laissez un bloc secondaire s'étaler en largeur et permettez au reste de se placer automatiquement autour d'eux.

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
  <div class="gd-demo__label">Résultat en direct · vedette + articles auto-placés</div>
  <div class="gd-canvas">
    <div class="gd-box gd-feature">En vedette<small>s'étend sur 2 × 2</small></div>
    <div class="gd-box gd-box--purple gd-wide">Secondaire<small>s'étend sur 2 colonnes</small></div>
    <div class="gd-box gd-box--p2">1</div>
    <div class="gd-box gd-box--p2">2</div>
    <div class="gd-box gd-box--teal">3</div>
    <div class="gd-box gd-box--teal">4</div>
    <div class="gd-box gd-box--p3">5</div>
    <div class="gd-box gd-box--p3">6</div>
  </div>
</div>

## Techniques avancées

### Alignement

Grid vous offre deux axes de contrôle. `justify-*` agit le long de la ligne (horizontal), `align-*` le long de la colonne (vertical). Définissez les valeurs par défaut sur le conteneur avec `justify-items`/`align-items`, puis surchargez un élément individuel avec `justify-self`/`align-self`.

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
  <div class="gd-demo__label">Résultat en direct · tout centré, un auto-aligné</div>
  <div class="gd-canvas">
    <div class="gd-box">center</div>
    <div class="gd-box">center</div>
    <div class="gd-box gd-box--orange gd-self">end / start</div>
    <div class="gd-box">center</div>
    <div class="gd-box">center</div>
    <div class="gd-box">center</div>
  </div>
</div>

### Grille implicite et empilement dense

Lorsque des éléments se placent en dehors de vos pistes explicites, Grid crée des lignes *implicites* pour les accueillir — dimensionnez-les avec `grid-auto-rows`. Définissez `grid-auto-flow: dense` et Grid comble les espaces antérieurs avec des éléments ultérieurs qui s'y adaptent, produisant un empilement serré de type maçonnerie.

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
  <div class="gd-demo__label">Résultat en direct · étendues mixtes empilées en mode dense</div>
  <div class="gd-canvas">
    <div class="gd-box gd-w2">étend sur 2</div>
    <div class="gd-box gd-box--purple gd-h2">étend sur 2 lignes</div>
    <div class="gd-box gd-box--teal">3</div>
    <div class="gd-box gd-box--orange">4</div>
    <div class="gd-box gd-w2 gd-box--p2">étend sur 2</div>
    <div class="gd-box gd-box--p3">6</div>
    <div class="gd-box">7</div>
    <div class="gd-box gd-box--purple">8</div>
    <div class="gd-box gd-box--teal">9</div>
  </div>
</div>

### Subgrid

Lorsqu'un élément de grille est lui-même une grille, `grid-template-columns: subgrid` (ou `subgrid` pour les lignes) permet à l'enfant de réutiliser les lignes de piste du parent au lieu de définir les siennes. C'est la solution la plus propre pour les grilles de cartes où l'en-tête, le corps et le pied de chaque carte doivent s'aligner sur toute la ligne, quelle que soit la longueur du contenu. Subgrid est désormais pris en charge par tous les principaux navigateurs.

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

## Outils de développement du navigateur

L'inspecteur de grille de votre navigateur transforme ces abstractions en quelque chose de visible :

1. Ouvrez les DevTools (<kbd>F12</kbd>, ou <kbd>Cmd</kbd>+<kbd>Opt</kbd>+<kbd>I</kbd> sur macOS).
2. Sélectionnez le conteneur de grille dans le panneau Éléments.
3. Cliquez sur le badge **grid** situé à côté pour activer la superposition.
4. Activez les numéros de ligne et les noms de zone pour étiqueter chaque piste.

Chrome et Firefox affichent tous deux la superposition en direct, si bien que modifier `grid-template-columns` dans le panneau Styles met à jour les lignes à mesure que vous tapez — essayez sur n'importe quelle démo de cette page.

## Conclusion

CSS Grid simplifie les mises en page complexes. Commencez avec `display: grid` et un modèle de colonnes, appuyez-vous sur `fr` et `minmax` pour un dimensionnement responsive, recourez aux zones nommées lorsqu'une mise en page se lit mieux comme une image, et terminez par l'alignement et l'empilement dense pour les détails. Avec les motifs ci-dessus — et les démos en direct pour expérimenter — vous avez tout ce qu'il faut pour construire des mises en page sophistiquées en toute confiance.

Pour la référence complète des propriétés, gardez le [guide CSS Grid Layout de MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout) à portée de main pendant que vous pratiquez.

## Lectures complémentaires

- [Construire une grille de cartes de documentation responsive](/posts/2026/04/28/responsive-documentation-card-grid/) — mettez `auto-fit` et `minmax()` à l'œuvre sur un véritable index de documentation.
- [Modèles de formulaires accessibles : libellés, erreurs et états utiles](/posts/2026/04/28/accessible-form-patterns/) — associez ces mises en page à des formulaires utilisables par tous.
- [Intégration de Bootstrap 5](/docs/bootstrap/) — comment la grille Bootstrap basée sur flexbox du thème complète CSS Grid natif.
- [Personnalisation des mises en page](/docs/customization/layouts/) — la hiérarchie des mises en page du thème et où s'insèrent vos grilles.

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
