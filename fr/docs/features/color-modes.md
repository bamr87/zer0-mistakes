---
lastmod: 2026-06-15 00:00:00.000000000 Z
title: Bascule mode sombre/clair
description: Sélecteur de mode de couleur du thème prenant en charge les modes clair,
  sombre et automatique avec détection des préférences du système.
preview: "/images/previews/dark-light-mode-toggle.png"
layout: default
categories:
- docs
- features
tags:
- dark-mode
- theme
- accessibility
- ui
difficulty: beginner
estimated_reading_time: 10 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/color-modes/"
translation_of: pages/_docs/features/color-modes.md
translation_source_url: "/docs/features/color-modes/"
machine_translated: true
translated_from_sha: 42ea6fdec8a0
---

# Bascule mode sombre/clair

Le thème Zer0-Mistakes inclut un sélecteur de mode de couleur prenant en charge les modes clair, sombre et la détection automatique des préférences du système.

La page **Theme Preview** (`/about/settings/theme-preview/`) est un guide de style en direct pour tester les modes de couleur et les neuf skins sur de vrais composants Bootstrap — typographie, boutons, alertes, cartes, formulaires, et plus encore :

![Page Theme Preview : une bascule de mode et un sélecteur de skin (Air, Aqua, Dirt, Neon, Mint, Plum, Sunrise) au-dessus d'échantillons de composants en direct, avec l'état actuel affiché comme « Active: air, Mode: auto (light) »](/assets/images/docs/features/theme-preview.png)

## Aperçu

- **Trois modes** : clair, sombre et automatique
- **Détection du système** : respecte `prefers-color-scheme`
- **Persistant** : enregistre la préférence dans localStorage
- **Bootstrap 5.3** : utilise l'attribut natif `data-bs-theme`

## Fonctionnement

### Application du thème

Le thème est appliqué via l'attribut `data-bs-theme` sur `<html>` :

```html
<html data-bs-theme="dark">
```

Bootstrap 5.3+ ajuste automatiquement toutes les couleurs des composants en fonction de cet attribut.

### Détection du mode

```javascript
const getPreferredTheme = () => {
  const stored = localStorage.getItem('theme');
  if (stored) return stored;
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light';
};
```

## Implémentation

### JavaScript

```javascript
(() => {
  'use strict';

  const getStoredTheme = () => localStorage.getItem('theme');
  const setStoredTheme = theme => localStorage.setItem('theme', theme);

  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    if (storedTheme) return storedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  };

  const setTheme = theme => {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-bs-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-bs-theme', theme);
    }
  };

  // Apply theme immediately (before DOM ready)
  setTheme(getPreferredTheme());

  // Handle theme toggle clicks
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-bs-theme-value]').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const theme = toggle.getAttribute('data-bs-theme-value');
        setStoredTheme(theme);
        setTheme(theme);
      });
    });
  });

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getStoredTheme() === 'auto' || !getStoredTheme()) {
      setTheme('auto');
    }
  });
})();
```

### Interface de la bascule

```html
<div class="dropdown">
  <button class="btn btn-link dropdown-toggle" data-bs-toggle="dropdown">
    <i class="bi bi-circle-half"></i>
    <span class="visually-hidden">Toggle theme</span>
  </button>
  <ul class="dropdown-menu dropdown-menu-end">
    <li>
      <button class="dropdown-item" data-bs-theme-value="light">
        <i class="bi bi-sun me-2"></i> Light
      </button>
    </li>
    <li>
      <button class="dropdown-item" data-bs-theme-value="dark">
        <i class="bi bi-moon me-2"></i> Dark
      </button>
    </li>
    <li>
      <button class="dropdown-item" data-bs-theme-value="auto">
        <i class="bi bi-circle-half me-2"></i> Auto
      </button>
    </li>
  </ul>
</div>
```

## Personnalisation

### Couleurs personnalisées

Remplacez les variables CSS de Bootstrap :

```css
[data-bs-theme="dark"] {
  --bs-body-bg: #1a1a2e;
  --bs-body-color: #eaeaea;
  --bs-primary: #4f46e5;
}

[data-bs-theme="light"] {
  --bs-body-bg: #ffffff;
  --bs-body-color: #212529;
  --bs-primary: #3b82f6;
}
```

### Thèmes des blocs de code

```css
[data-bs-theme="dark"] pre {
  background-color: #1e1e1e;
}

[data-bs-theme="light"] pre {
  background-color: #f8f9fa;
}
```

### Images

Échangez les images selon le thème :

```html
<picture>
  <source srcset="logo-dark.png" media="(prefers-color-scheme: dark)">
  <img src="logo-light.png" alt="Logo">
</picture>
```

Ou avec du CSS :

```css
[data-bs-theme="dark"] .logo {
  content: url('logo-dark.png');
}
```

## Stockage

### Clé localStorage

La préférence de thème est stockée sous :

```javascript
localStorage.setItem('theme', 'dark'); // 'light', 'dark', or 'auto'
```

### Effacer la préférence

```javascript
localStorage.removeItem('theme');
```

## Transitions

### Changement de thème fluide

```css
html {
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Disable during page load */
html.no-transition,
html.no-transition * {
  transition: none !important;
}
```

```javascript
// Disable transitions during initial load
document.documentElement.classList.add('no-transition');
setTheme(getPreferredTheme());
requestAnimationFrame(() => {
  document.documentElement.classList.remove('no-transition');
});
```

## Accessibilité

### Étiquettes ARIA

```html
<button aria-label="Switch to dark mode">
  <i class="bi bi-moon"></i>
</button>
```

### État actuel

```html
<button aria-pressed="true" data-bs-theme-value="dark">
  Dark
</button>
```

### Mouvement réduit

```css
@media (prefers-reduced-motion: reduce) {
  html {
    transition: none;
  }
}
```

## Dépannage

### Affichage du mauvais thème (flash)

Assurez-vous que le script du thème s'exécute avant le body :

```html
<head>
  <script src="/assets/js/color-modes.js"></script>
</head>
```

### Le thème ne persiste pas

1. Vérifiez l'accès à localStorage
2. Vérifiez que le script enregistre bien le stockage
3. Testez en navigation privée

### Les composants Bootstrap ne se thématisent pas

Assurez-vous d'utiliser Bootstrap 5.3+ :

```html
<!-- Required for data-bs-theme support -->
<link href="bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
```

## Voir aussi

- [Intégration Bootstrap](/docs/bootstrap/)
- [Styles personnalisés](/docs/customization/styles/)

## Voir aussi

- [[Features]]
- [[Customization]]
- [[Bootstrap Integration]]
