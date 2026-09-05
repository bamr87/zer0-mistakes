---
lastmod: 2026-09-05 00:00:00.000000000 Z
title: Architecture de navigation modulaire ES6
description: Le système de navigation de zer0-mistakes sous forme de modules ES6 —
  menus déroulants au survol, accessibilité clavier, défilement fluide, persistance
  de la barre latérale et dégradation gracieuse.
keywords:
- navigation architecture
- es6 modules
- scroll spy
- keyboard navigation
- sidebar state
- jekyll theme
preview: "/images/previews/es6-modular-navigation-architecture.png"
layout: default
categories:
- docs
- features
tags:
- navigation
- javascript
- es6
- ui
- performance
difficulty: intermediate
estimated_reading_time: 10 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/navigation-architecture/"
translation_of: pages/_docs/features/navigation-architecture.md
translation_source_url: "/docs/features/navigation-architecture/"
machine_translated: true
translated_from_sha: 4e083aa40f50
---

# Architecture de navigation modulaire ES6

Le JavaScript de navigation de zer0-mistakes est organisé en modules ES6 sous `assets/js/modules/navigation/`. Cette approche modulaire permet le tree-shaking, des tests unitaires indépendants et une extension facile sans toucher à des fichiers monolithiques.

![La barre de navigation avec un menu déroulant ouvert au survol — l'un des comportements (menus déroulants, accès clavier, défilement fluide, état de la barre latérale) fournis par les modules de navigation](/assets/images/docs/features/dynamic-navigation.png)

## Vue d'ensemble des modules

```text
assets/js/modules/navigation/
├── index.js         — Entry point: imports and initializes all modules
├── config.js        — Shared constants (breakpoints, selectors, timing)
├── focus.js         — Focus trapping for offcanvas / modals
├── gestures.js      — Touch/swipe support for mobile nav
├── keyboard.js      — Arrow-key navigation, Escape handling
├── scroll-spy.js    — Active section highlighting in sidebars
├── sidebar-state.js — Persist collapsed/expanded state (localStorage)
└── smooth-scroll.js — Smooth scroll to anchor links
```

Le point d'entrée est importé par `assets/js/navigation.js` :

```javascript
// assets/js/navigation.js
import { initNavigation } from './modules/navigation/index.js';

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
});
```

## Fonctionnalités clés

### Menus déroulants au survol

Les menus déroulants de la barre de navigation sur ordinateur s'ouvrent au survol avec un léger délai afin d'éviter les déclenchements accidentels. Ce délai est une constante locale au module dans `navbar.js` ; le point de rupture `lg` qui conditionne le comportement au survol provient de `config.breakpoints`, que `syncBreakpointsFromCss()` actualise au moment de l'exécution à partir des propriétés personnalisées `--zer0-bp-*`, de sorte que les jetons SCSS restent la source unique de vérité :

```javascript
// assets/js/modules/navigation/navbar.js
const TOOLTIP_DELAY = { show: 400, hide: 100 };

// assets/js/modules/navigation/config.js
breakpoints: { sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400 }
```

### Navigation au clavier

`keyboard.js` gère :

| Touche | Action |
|---|---|
| `Tab` / `Shift+Tab` | Déplacement standard du focus |
| `Arrow Down` / `Arrow Up` | Passer d'un élément du menu déroulant à l'autre |
| `Escape` | Fermer le menu déroulant / l'offcanvas |
| `Enter` / `Space` | Activer l'élément focalisé |

### Persistance de l'état de la barre latérale

`sidebar-state.js` enregistre quelles sections de la barre latérale sont déployées dans `localStorage` afin que l'état soit conservé après un rechargement de page :

```javascript
// One key holds every expanded node: `state.storagePrefix` + `state.keys.expandedNodes`
localStorage.setItem('zer0-nav-expanded-nodes', JSON.stringify([...expandedNodeIds]));
```

### Scroll Spy

`scroll-spy.js` met en évidence la section en cours dans la table des matières à mesure que l'utilisateur fait défiler la page. L'entrée active est le dernier titre dont le haut a franchi la ligne de lecture (`scroll-padding-top` sous le haut de la fenêtre), recalculée à chaque image d'animation à partir des décalages de titres mis en cache. Voir [Table des matières](/docs/features/toc/#scroll-spy).

### Dégradation gracieuse

Les API de navigateur optionnelles sont détectées par fonctionnalité, de sorte qu'un module se dégrade au lieu de générer une erreur. Le scroll spy n'a besoin de rien de plus que `scrollY` — il ne fait appel à `ResizeObserver` que pour remesurer les décalages de titres lorsque le contenu est réagencé :

```javascript
if (typeof ResizeObserver !== 'undefined') {
  this._resizeObserver = new ResizeObserver(this._onReflow);
  this._resizeObserver.observe(content);
}
```

La barre de navigation s'affiche et fonctionne comme un composant Bootstrap standard, même lorsque JavaScript est désactivé ou échoue.

## Inclusion de la navigation principale

```text
_includes/navigation/navbar.html
```

L'inclusion de la barre de navigation restitue la barre Bootstrap 5, remplit les liens à partir de `_data/navigation.yml` (ou du repli sur la collection dynamique) et produit les attributs de données ciblés par les modules JS.

## Ajouter un module de navigation

1. Créez `assets/js/modules/navigation/my-feature.js` :

   ```javascript
   export function initMyFeature() {
     // implementation
   }
   ```

2. Importez-le et appelez-le depuis `index.js` :

   ```javascript
   import { initMyFeature } from './my-feature.js';

   export function initNavigation() {
     // … existing init calls …
     initMyFeature();
   }
   ```

## Voir aussi

- [Repli de navigation dynamique](/docs/features/dynamic-navigation/)
- [Navigation par barre latérale](/docs/features/sidebar-navigation/)
- [Navigation au clavier](/docs/features/keyboard-navigation/)

## Voir aussi

- [[Navigation]]
- [[Keyboard Navigation]]
- [[Features]]
