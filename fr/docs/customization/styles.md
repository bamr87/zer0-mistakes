---
lastmod: 2026-06-22 12:00:00.000000000 Z
title: Styles
description: Personnalisez les styles CSS et SCSS dans le thème Jekyll Zer0-Mistakes.
preview: "/images/previews/styles.png"
layout: default
categories:
- docs
- customization
tags:
- css
- scss
- styles
- bootstrap
difficulty: intermediate
estimated_reading_time: 15 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/customization/styles/"
translation_of: pages/_docs/customization/styles.md
translation_source_url: "/docs/customization/styles/"
machine_translated: true
translated_from_sha: 76ceef73178c
---

# Styles

Personnalisez l'apparence visuelle de votre site à l'aide de SCSS et CSS.

## Structure des fichiers

```text
_sass/
├── core/           # Core theme styles
│   ├── _variables.scss
│   ├── _base.scss
│   └── ...
├── custom.scss     # Your customizations
└── notebooks.scss  # Jupyter notebook styles

assets/css/
└── main.scss       # Main stylesheet entry point
```

## Ajouter des styles personnalisés

### Option 1 : custom.scss (recommandé)

Modifiez `_sass/custom.scss` :

```scss
// Override Bootstrap variables
$primary: #007bff;
$secondary: #6c757d;
$font-family-base: 'Inter', sans-serif;

// Custom styles
.my-component {
  background: $primary;
  padding: 1rem;
  border-radius: 0.5rem;
}

.custom-header {
  border-bottom: 3px solid $primary;
  margin-bottom: 2rem;
}
```

### Option 2 : Directement dans main.scss

Ajoutez des styles directement dans `assets/css/main.scss` :

```scss
---
---

@import "custom";

// Additional styles here
.site-footer {
  background: #f8f9fa;
  padding: 2rem 0;
}
```

## Personnalisation de Bootstrap

### Redéfinir les variables Bootstrap

Avant les imports de Bootstrap, définissez vos variables :

```scss
// Colors
$primary: #0d6efd;
$secondary: #6c757d;
$success: #198754;
$danger: #dc3545;
$warning: #ffc107;
$info: #0dcaf0;
$light: #f8f9fa;
$dark: #212529;

// Typography
$font-family-sans-serif: 'Inter', system-ui, sans-serif;
$font-family-monospace: 'Fira Code', monospace;
$font-size-base: 1rem;
$line-height-base: 1.6;

// Spacing
$spacer: 1rem;

// Border radius
$border-radius: 0.375rem;
$border-radius-lg: 0.5rem;
$border-radius-sm: 0.25rem;
```

### Utiliser les utilitaires Bootstrap

Tirez parti des classes utilitaires de Bootstrap :

```html
<div class="p-4 mb-3 bg-primary text-white rounded">
  Custom styled box
</div>

<p class="text-muted fs-5 fw-light">
  Styled paragraph
</p>
```

## Propriétés personnalisées CSS

Définissez et utilisez des variables CSS pour un thème facile à gérer :

```scss
:root {
  --brand-color: #007bff;
  --text-color: #333;
  --bg-color: #fff;
  --code-bg: #f5f5f5;
}

// Dark mode
@media (prefers-color-scheme: dark) {
  :root {
    --brand-color: #4dabf7;
    --text-color: #e9ecef;
    --bg-color: #212529;
    --code-bg: #2d2d2d;
  }
}

// Usage
.element {
  color: var(--text-color);
  background: var(--bg-color);
}
```

## Personnalisations courantes

### Typographie

```scss
// Headings
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

// Links
a {
  color: $primary;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
}

// Code blocks
pre, code {
  font-family: 'Fira Code', monospace;
  font-size: 0.9em;
}
```

### Mise en page

```scss
// Container width
.container {
  max-width: 1200px;
}

// Sidebar width
.sidebar {
  width: 280px;
}

// Content area
.content {
  max-width: 800px;
  margin: 0 auto;
}
```

### Composants

```scss
// Cards
.card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
}

// Buttons
.btn-custom {
  @extend .btn;
  background: linear-gradient(135deg, $primary, darken($primary, 10%));
  border: none;
  color: white;
}
```

## Styles responsives

Utilisez les points de rupture de Bootstrap :

```scss
// Mobile first approach
.element {
  padding: 1rem;
  
  @include media-breakpoint-up(md) {
    padding: 2rem;
  }
  
  @include media-breakpoint-up(lg) {
    padding: 3rem;
  }
}

// Or use media queries directly
@media (min-width: 768px) {
  .sidebar {
    display: block;
  }
}
```

## Bonnes pratiques

1. **Utilisez des variables** — Définissez les couleurs et les tailles sous forme de variables
2. **Mobile d'abord** — Commencez par les styles mobiles, puis ajoutez des points de rupture pour les écrans plus grands
3. **Tirez parti de Bootstrap** — Ne réinventez pas les utilitaires Bootstrap
4. **Gardez une faible spécificité** — Évitez `!important` et l'imbrication profonde
5. **Commentez les sections** — Documentez vos personnalisations
6. **Testez les navigateurs** — Vérifiez les styles dans Chrome, Firefox et Safari

## Débogage

```scss
// Temporary debug outline
* {
  outline: 1px solid red;
}

// Debug specific element
.debug {
  background: yellow !important;
  border: 2px solid red !important;
}
```

## Référence

- [Documentation Bootstrap 5](https://getbootstrap.com/docs/5.3/)
- [Documentation Sass](https://sass-lang.com/documentation/)
- [Propriétés personnalisées CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Maîtriser CSS Grid (tutoriel)](/posts/2025/01/23/css-grid-mastery/) — mises en page CSS Grid pratiques avec des démonstrations interactives dans le navigateur

## Référence technique

Pour les détails destinés aux contributeurs (pipeline SCSS, catalogue des tokens de conception, rouages de l'intégration Bootstrap, extension du design system) :

- [Design System → docs/ui/design-system.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/ui/design-system.md)
- [Thématisation → docs/ui/theming.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/ui/theming.md)
- [Design Tokens → docs/ui/design-tokens.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/ui/design-tokens.md)

## Voir aussi

- [[Customization]]
- [[Bootstrap Integration]]
- [[Dark/Light Mode Toggle]]
