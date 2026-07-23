---
lastmod: 2026-06-22 12:00:00.000000000 Z
title: Intégration de Bootstrap 5 dans Zer0-Mistakes
description: Comment le thème Jekyll Zer0-Mistakes embarque Bootstrap 5.3.3 versionné
  — grille, composants, modes de couleur, icônes et personnalisation Sass, avec des
  exemples prêts à copier-coller.
keywords:
- bootstrap 5
- jekyll bootstrap theme
- bootstrap grid
- bootstrap components
- responsive design
preview: "/images/previews/bootstrap-integration.png"
layout: default
categories:
- docs
- bootstrap
tags:
- bootstrap
- css
- responsive
- components
difficulty: beginner
estimated_reading_time: 15 minutes
prerequisites: []
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/bootstrap/"
translation_of: pages/_docs/bootstrap/index.md
translation_source_url: "/docs/bootstrap/"
machine_translated: true
translated_from_sha: 3df6221d99c3
---

# Intégration de Bootstrap 5.3.3

Le thème Zer0-Mistakes est construit sur **Bootstrap 5.3.3**, offrant des mises en page responsives, des composants modernes et de puissants utilitaires.

## Comment Bootstrap est chargé

Le thème embarque **Bootstrap 5.3.3** et **Bootstrap Icons** sous [`assets/vendor/`](⟦1⟧), si bien que les builds **GitHub Pages** ne nécessitent aucun `npm` ni accès réseau au moment de la publication. Actualisez les fichiers avec `./scripts/vendor-install.sh` (voir [Ressources fournisseurs](⟦2⟧)). Bootstrap 5 a supprimé la dépendance à jQuery, le thème ne regroupe donc plus et ne charge plus jQuery.

### CSS (regroupé — par défaut)

```liquid
{% raw %}
<!-- In _includes/core/head.html -->
<link href="{{ '/assets/vendor/bootstrap/css/bootstrap.min.css' | relative_url }}" rel="stylesheet">
{% endraw %}
```

### JavaScript

```liquid
{% raw %}
<!-- In _includes/components/js-cdn.html -->
<script src="{{ '/assets/vendor/bootstrap/js/bootstrap.bundle.min.js' | relative_url }}"></script>
{% endraw %}
```

### Bootstrap Icons

```liquid
{% raw %}
<link rel="stylesheet" href="{{ '/assets/vendor/bootstrap-icons/font/bootstrap-icons.css' | relative_url }}">
{% endraw %}
```

### Optionnel : exemple CDN (forks uniquement)

Si vous préférez un CDN public plutôt que des fichiers fournisseurs versionnés, vous pouvez remplacer les liens ci-dessus par des URL jsDelivr (ce n'est pas le comportement par défaut de ce thème).

## Système de grille

### Grille de base

```html
<div class="container">
  <div class="row">
    <div class="col-md-8">Main content</div>
    <div class="col-md-4">Sidebar</div>
  </div>
</div>
```

### Colonnes responsives

```html
<!-- Stack on mobile, side-by-side on tablet+ -->
<div class="row">
  <div class="col-12 col-md-6">Left</div>
  <div class="col-12 col-md-6">Right</div>
</div>
```

### Colonnes à largeur automatique

```html
<div class="row">
  <div class="col">Equal</div>
  <div class="col">Equal</div>
  <div class="col">Equal</div>
</div>
```

> **Pour aller plus loin :** la grille de Bootstrap repose sur flexbox et excelle pour les rangées de colonnes. Lorsque vous avez besoin d'un vrai contrôle bidimensionnel — zones qui se chevauchent, régions nommées ou mises en page façon magazine — tournez-vous vers CSS Grid natif. Le [tutoriel Maîtrise de CSS Grid](/posts/2025/01/23/css-grid-mastery/) le présente avec des démos interactives directement dans le navigateur.

## Points de rupture responsives

| Point de rupture | Classe | Dimensions |
|------------|-------|------------|
| Très petit | (par défaut) | < 576px |
| Petit | `sm` | ≥ 576px |
| Moyen | `md` | ≥ 768px |
| Grand | `lg` | ≥ 992px |
| Très grand | `xl` | ≥ 1200px |
| XXL | `xxl` | ≥ 1400px |

### Utilitaires responsives

```html
<!-- Hide on mobile -->
<div class="d-none d-md-block">Desktop only</div>

<!-- Show only on mobile -->
<div class="d-block d-md-none">Mobile only</div>
```

## Composants du thème

### Navigation (Navbar)

```html
<nav class="navbar navbar-expand-lg bg-body-tertiary">
  <div class="container">
    <a class="navbar-brand" href="/">Brand</a>
    <button class="navbar-toggler" type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav">
        <li class="nav-item">
          <a class="nav-link active" href="#">Home</a>
        </li>
      </ul>
    </div>
  </div>
</nav>
```

### Cartes

```html
<div class="card">
  <img src="image.jpg" class="card-img-top" alt="...">
  <div class="card-body">
    <h5 class="card-title">Card title</h5>
    <p class="card-text">Some quick example text.</p>
    <a href="#" class="btn btn-primary">Go somewhere</a>
  </div>
</div>
```

### Fenêtres modales

```html
<!-- Button trigger -->
<button type="button" class="btn btn-primary" 
        data-bs-toggle="modal" 
        data-bs-target="#exampleModal">
  Launch demo modal
</button>

<!-- Modal -->
<div class="modal fade" id="exampleModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Modal title</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        Modal content here.
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">Save changes</button>
      </div>
    </div>
  </div>
</div>
```

### Offcanvas (barre latérale mobile)

```html
<!-- Button -->
<button class="btn btn-primary" 
        data-bs-toggle="offcanvas" 
        data-bs-target="#sidebar">
  Open Sidebar
</button>

<!-- Offcanvas -->
<div class="offcanvas offcanvas-start" id="sidebar">
  <div class="offcanvas-header">
    <h5 class="offcanvas-title">Menu</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
  </div>
  <div class="offcanvas-body">
    Sidebar content...
  </div>
</div>
```

## Modes de couleur (sombre/clair)

Bootstrap 5.3 prend en charge les modes de couleur via `data-bs-theme` :

```html
<html data-bs-theme="dark">
```

### Bascule de thème

```javascript
const setTheme = (theme) => {
  document.documentElement.setAttribute('data-bs-theme', theme);
};

// Toggle
setTheme('dark');  // or 'light'
```

Voir [Modes de couleur](/docs/features/color-modes/) pour l'implémentation complète.

## Bootstrap Icons

### Icônes courantes

```html
<!-- Navigation -->
<i class="bi bi-house"></i>
<i class="bi bi-search"></i>
<i class="bi bi-gear"></i>

<!-- Actions -->
<i class="bi bi-plus-circle"></i>
<i class="bi bi-pencil"></i>
<i class="bi bi-trash"></i>

<!-- Social -->
<i class="bi bi-github"></i>
<i class="bi bi-twitter"></i>
<i class="bi bi-linkedin"></i>

<!-- States -->
<i class="bi bi-check-circle text-success"></i>
<i class="bi bi-x-circle text-danger"></i>
<i class="bi bi-exclamation-circle text-warning"></i>
```

### Taille des icônes

```html
<i class="bi bi-house fs-1"></i>  <!-- Large -->
<i class="bi bi-house fs-3"></i>  <!-- Medium -->
<i class="bi bi-house fs-5"></i>  <!-- Small -->
```

## Classes utilitaires

### Espacement

```html
<!-- Margin -->
<div class="mt-3">margin-top: 1rem</div>
<div class="mb-4">margin-bottom: 1.5rem</div>
<div class="mx-auto">center horizontally</div>

<!-- Padding -->
<div class="p-3">padding: 1rem</div>
<div class="py-4">padding-y: 1.5rem</div>
```

### Flexbox

```html
<div class="d-flex justify-content-between align-items-center">
  <span>Left</span>
  <span>Right</span>
</div>
```

### Texte

```html
<p class="text-primary">Primary text</p>
<p class="text-muted">Muted text</p>
<p class="text-center">Centered text</p>
<p class="fw-bold">Bold text</p>
```

## Personnalisation

### Variables CSS

Redéfinissez les variables CSS de Bootstrap :

```css
:root {
  --bs-primary: #0d6efd;
  --bs-secondary: #6c757d;
  --bs-body-bg: #fff;
  --bs-body-color: #212529;
}

[data-bs-theme="dark"] {
  --bs-body-bg: #212529;
  --bs-body-color: #f8f9fa;
}
```

### Sass personnalisé

```scss
// _sass/custom.scss
$primary: #3b82f6;
$secondary: #64748b;

// Then import Bootstrap
@import "bootstrap/scss/bootstrap";
```

## Formulaires

### Formulaire de base

```html
<form>
  <div class="mb-3">
    <label for="email" class="form-label">Email</label>
    <input type="email" class="form-control" id="email">
  </div>
  <div class="mb-3">
    <label for="message" class="form-label">Message</label>
    <textarea class="form-control" id="message" rows="3"></textarea>
  </div>
  <button type="submit" class="btn btn-primary">Submit</button>
</form>
```

### Validation de formulaire

```html
<form class="needs-validation" novalidate>
  <div class="mb-3">
    <input type="email" class="form-control" required>
    <div class="invalid-feedback">Please provide a valid email.</div>
  </div>
</form>

<script>
document.querySelectorAll('.needs-validation').forEach(form => {
  form.addEventListener('submit', event => {
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
    }
    form.classList.add('was-validated');
  });
});
</script>
```

## Ressources

- [Documentation de Bootstrap 5](https://getbootstrap.com/docs/5.3/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)
- [Exemples Bootstrap](https://getbootstrap.com/docs/5.3/examples/)
- [Aide-mémoire Bootstrap](https://getbootstrap.com/docs/5.3/examples/cheatsheet/)

## Voir aussi

- [Modes de couleur](/docs/features/color-modes/)
- [Mises en page](/docs/customization/layouts/)
- [Composants d'inclusion](/docs/customization/includes/)
- [Maîtrise de CSS Grid (tutoriel)](/posts/2025/01/23/css-grid-mastery/)

## Voir aussi

- [[Customization]]
- [[Features]]
- [[Jekyll]]
- [[Liquid]]
