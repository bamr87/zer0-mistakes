---
lastmod: 2026-06-15 00:00:00.000000000 Z
title: Architecture de navigation modulaire ES6
description: Le système de navigation de zer0-mistakes sous forme de modules ES6 —
  menus déroulants au survol, accessibilité clavier, défilement fluide, persistance
  de la barre latérale et dégradation progressive.
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
translated_from_sha: 2f062d7f74fb
---

# Architecture de navigation modulaire ES6

Le JavaScript de navigation de zer0-mistakes est organisé sous forme de modules ES6 dans `assets/js/modules/navigation/`. Cette approche modulaire permet le tree-shaking, des tests unitaires indépendants et une extension facile sans toucher à des fichiers monolithiques.

![La barre de navigation avec un menu déroulant ouvert au survol — l'un des comportements (menus déroulants, accès clavier, défilement fluide, état de la barre latérale) fournis par les modules de navigation](/assets/images/docs/features/dynamic-navigation.png)

## Aperçu des modules

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

Les menus déroulants de la barre de navigation desktop s'ouvrent au survol avec un court délai pour éviter les déclenchements accidentels. Définis dans `config.js` :

```javascript
export const TOOLTIP_DELAY = { show: 400, hide: 100 };
export const MOBILE_BREAKPOINT = 992; // px — Bootstrap lg breakpoint
```

### Navigation au clavier

`keyboard.js` gère :

| Touche | Action |
|---|---|
| `Tab` / `Shift+Tab` | Déplacement standard du focus |
| `Arrow Down` / `Arrow Up` | Déplacement entre les éléments du menu déroulant |
| `Escape` | Fermer le menu déroulant / le panneau latéral |
| `Enter` / `Space` | Activer l'élément ayant le focus |

### Persistance de l'état de la barre latérale

`sidebar-state.js` enregistre les sections de la barre latérale qui sont développées dans `localStorage` afin que l'état soit conservé après le rechargement de la page :

```javascript
// Key format: zer0-sidebar-<section-id>
localStorage.setItem(`zer0-sidebar-${sectionId}`, 'expanded');
```

### Espion de défilement

`scroll-spy.js` met en évidence la section courante dans la table des matières de la barre latérale au fur et à mesure que l'utilisateur fait défiler la page, en utilisant `IntersectionObserver` pour les performances.

### Dégradation progressive

Toutes les fonctionnalités de navigation sont encapsulées dans une détection de fonctionnalités :

```javascript
if ('IntersectionObserver' in window) {
  initScrollSpy();
}
```

La barre de navigation s'affiche et fonctionne comme un composant Bootstrap standard, même lorsque JavaScript est désactivé ou échoue.

## Include de navigation principale

```text
_includes/navigation/navbar.html
```

L'include de la barre de navigation affiche la barre de navigation Bootstrap 5, remplit les liens à partir de `_data/navigation.yml` (ou du fallback de collection dynamique) et génère les attributs de données ciblés par les modules JS.

## Ajouter un module de navigation

1. Créez `assets/js/modules/navigation/my-feature.js` :

```javascript
export function initMyFeature() {
  // implementation
}
```

1. Importez-le et appelez-le depuis `index.js` :

```javascript
import { initMyFeature } from './my-feature.js';

export function initNavigation() {
  // … existing init calls …
  initMyFeature();
}
```

## Ressources associées

- [Fallback de navigation dynamique](/docs/features/dynamic-navigation/)
- [Navigation de la barre latérale](/docs/features/sidebar-navigation/)
- [Navigation au clavier](/docs/features/keyboard-navigation/)

## Voir aussi

- [[Navigation]]
- [[JavaScript]]
- [[Features]]
