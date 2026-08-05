---
lastmod: 2026-06-15 00:00:00.000000000 Z
title: Bouton Retour en haut
description: Bouton flottant qui apparaît au défilement, permettant aux utilisateurs
  de revenir rapidement en haut de la page.
preview: "/images/previews/back-to-top-button.png"
layout: default
categories:
- docs
- features
tags:
- ui
- navigation
- scroll
- accessibility
difficulty: beginner
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/back-to-top/"
translation_of: pages/_docs/features/back-to-top.md
translation_source_url: "/docs/features/back-to-top/"
machine_translated: true
translated_from_sha: 07233eb5a5a3
---

# Bouton Retour en haut

Un bouton flottant qui apparaît lorsque les utilisateurs font défiler la page vers le bas, offrant une navigation rapide vers le haut de la page.

![Une page de documentation partiellement défilée, avec un bouton circulaire de retour en haut flottant dans le coin inférieur](/assets/images/docs/features/back-to-top.png)

Le bouton reste masqué en haut de la page et apparaît en fondu dès que vous dépassez la première fenêtre d'affichage, afin de ne jamais gêner.

## Aperçu

- **Apparaît au défilement** : S'affiche après un défilement de 200px
- **Animation fluide** : Défilement animé vers le haut
- **Accessible** : Sémantique de bouton appropriée
- **Performance** : Écouteur de défilement passif

## Implémentation

### Balisage HTML

```html
<button id="backToTopBtn" 
        class="btn btn-primary rounded-circle position-fixed"
        aria-label="Back to top"
        style="bottom: 20px; right: 20px; display: none; z-index: 1000;">
  <i class="bi bi-arrow-up"></i>
</button>
```

### JavaScript

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('backToTopBtn');
  if (!btn) return;

  // Scroll to top
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Show/hide based on scroll position
  const toggle = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    btn.style.display = y > 200 ? 'block' : 'none';
  };

  toggle();
  window.addEventListener('scroll', toggle, { passive: true });
});
```

## Configuration

### Seuil de défilement

Ajustez le moment où le bouton apparaît :

```javascript
// Show after scrolling 500px
btn.style.display = y > 500 ? 'block' : 'none';
```

### Position

```css
#backToTopBtn {
  bottom: 20px;  /* Distance from bottom */
  right: 20px;   /* Distance from right */
}

/* Or use Bootstrap utilities */
.back-to-top {
  bottom: 1rem;
  right: 1rem;
}
```

### Style

```css
#backToTopBtn {
  width: 48px;
  height: 48px;
  background-color: var(--bs-primary);
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: opacity 0.3s ease;
}

#backToTopBtn:hover {
  background-color: var(--bs-primary-dark);
  transform: translateY(-2px);
}
```

## Personnalisation

### Différentes icônes

```html
<!-- Arrow up -->
<i class="bi bi-arrow-up"></i>

<!-- Chevron up -->
<i class="bi bi-chevron-up"></i>

<!-- Caret up -->
<i class="bi bi-caret-up-fill"></i>
```

### Avec texte

```html
<button id="backToTopBtn" class="btn btn-primary">
  <i class="bi bi-arrow-up me-1"></i>
  Top
</button>
```

### Animation en fondu

```css
#backToTopBtn {
  opacity: 0;
  transition: opacity 0.3s ease;
}

#backToTopBtn.visible {
  opacity: 1;
}
```

```javascript
btn.classList.toggle('visible', y > 200);
```

## Accessibilité

### Attributs ARIA

```html
<button aria-label="Scroll to top of page"
        role="button"
        tabindex="0">
```

### Focus visible

```css
#backToTopBtn:focus-visible {
  outline: 2px solid var(--bs-primary);
  outline-offset: 2px;
}
```

### Prise en charge du clavier

Le bouton est focalisable et s'active avec Entrée/Espace.

## Performance

### Écouteur passif

```javascript
window.addEventListener('scroll', toggle, { passive: true });
```

L'option `passive: true` améliore les performances de défilement en indiquant que l'écouteur n'appellera pas `preventDefault()`.

### Anti-rebond (Optionnel)

Pour les pages lourdes, appliquez un anti-rebond au gestionnaire de défilement :

```javascript
function debounce(fn, wait) {
  let timeout;
  return function() {
    clearTimeout(timeout);
    timeout = setTimeout(fn, wait);
  };
}

window.addEventListener('scroll', debounce(toggle, 100), { passive: true });
```

## Considérations mobiles

### Taille adaptée au tactile

Assurez-vous que le bouton respecte la cible tactile minimale (44x44px) :

```css
#backToTopBtn {
  width: 48px;
  height: 48px;
  min-width: 44px;
  min-height: 44px;
}
```

### Éviter le chevauchement

Positionnez-le pour ne pas interférer avec le bouton de sommaire mobile :

```css
/* When mobile TOC FAB is present */
@media (max-width: 991px) {
  #backToTopBtn {
    bottom: 80px; /* Above TOC button */
  }
}
```

## Dépannage

### Le bouton n'apparaît pas

1. Vérifiez le seuil de défilement
2. Confirmez que l'élément existe dans le DOM
3. Vérifiez les conflits de z-index
4. Inspectez le style d'affichage

### Pas de défilement

1. Vérifiez la prise en charge de `behavior: 'smooth'`
2. Vérifiez le verrouillage du défilement sur le body
3. Testez sans autres scripts de défilement

### Problèmes de performance

1. Ajoutez l'option d'écouteur passif
2. Utilisez l'anti-rebond
3. Réduisez les vérifications du seuil de défilement

## Connexe

- [Navigation latérale](/docs/features/sidebar-navigation/)
- [Navigation au clavier](/docs/features/keyboard-navigation/)

## Voir aussi

- [[Features]]
- [[Keyboard Navigation]]
- [[Mobile TOC Floating Action Button]]
