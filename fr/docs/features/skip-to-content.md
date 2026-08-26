---
lastmod: 2026-08-26 00:00:00.000000000 Z
title: Lien d'accessibilité « Aller au contenu »
description: Un lien d'évitement conforme au niveau AA de la WCAG 2.1 permet aux utilisateurs
  du clavier de contourner la navigation et d'accéder directement à la zone de contenu
  principal sur chaque page du thème.
preview: "/images/previews/skip-to-content-accessibility-link.png"
layout: default
categories:
- docs
- features
tags:
- accessibility
- wcag
- keyboard
- skip-link
difficulty: beginner
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/skip-to-content/"
translation_of: pages/_docs/features/skip-to-content.md
translation_source_url: "/docs/features/skip-to-content/"
machine_translated: true
translated_from_sha: 4389fc104c05
---

# Lien d'accessibilité « Aller au contenu »

Le thème Zer0-Mistakes inclut un lien d'évitement conforme au niveau AA de la norme WCAG 2.1 qui permet aux utilisateurs du clavier de contourner la navigation.

## Vue d'ensemble

Le lien « Aller au contenu » :

- **Masqué visuellement** : visible uniquement lors du focus clavier
- **Premier élément focalisable** : apparaît dès l'appui sur Tab
- **Navigation directe** : saute directement à la zone de contenu principal
- **Conforme WCAG** : respecte les standards d'accessibilité

## Fonctionnement

### Parcours utilisateur

1. L'utilisateur arrive sur la page
2. Il appuie sur la touche `Tab`
3. Le lien « Aller au contenu principal » devient visible
4. L'utilisateur appuie sur `Enter`
5. Le focus se déplace vers le contenu principal

### Implémentation

Le lien est le premier élément focalisable dans `_includes/core/header.html`, et sa cible est un unique conteneur `#main-content` commun à tout le site dans `_layouts/root.html`. Le thème construit le lien entièrement à partir des classes utilitaires de Bootstrap 5 — `visually-hidden-focusable` le maintient masqué jusqu'à ce qu'il reçoive le focus clavier :

```html
<!-- _includes/core/header.html -->
<a href="#main-content" class="visually-hidden-focusable position-absolute top-0 start-0 z-3 m-3 btn btn-primary">
  Skip to main content
</a>
```

```html
<!-- _layouts/root.html -->
<main id="main-content" tabindex="-1">
  {% raw %}{{ content }}{% endraw %}
</main>
```

`tabindex="-1"` est obligatoire : `<main>` n'est pas focalisable nativement, et Safari/WebKit se contente de faire défiler la page lors d'un saut d'ancre vers un conteneur non focalisable — le focus clavier ne bouge pas, si bien que le `Tab` suivant ramène l'utilisateur à la navigation qu'il venait d'éviter. La valeur `-1` exclut le conteneur de l'ordre de tabulation séquentiel tout en permettant au lien d'y déplacer le focus. Le thème supprime l'anneau de focus sur le conteneur dans `_sass/utilities/_focus.scss` (`#main-content:focus { outline: none; }`) ; les éléments *à l'intérieur* du contenu conservent leurs propres indicateurs.

## Style

### Utilitaire Bootstrap (par défaut)

Le lien du thème s'appuie sur la classe `visually-hidden-focusable` de Bootstrap ainsi que sur quelques utilitaires de positionnement et de bouton — aucun CSS personnalisé à maintenir :

```html
<a href="#main-content" class="visually-hidden-focusable position-absolute top-0 start-0 z-3 m-3 btn btn-primary">
  Skip to main content
</a>
```

La classe `visually-hidden-focusable` :

- Masque visuellement l'élément jusqu'à ce qu'il reçoive le focus
- Le garde accessible aux lecteurs d'écran en permanence
- Le révèle lors du focus clavier (les utilitaires `position-absolute top-0 start-0 m-3`
  l'épinglent dans le coin supérieur gauche lorsqu'il est affiché)

### Alternative SCSS basée sur les tokens

Le thème fournit également un utilitaire `.zer0-skip-link` dans `_sass/utilities/_focus.scss` qui fait apparaître le lien depuis le hors-champ lors du focus. Il lit les tokens de design du thème (`--zer0-color-primary`, `--zer0-layer-skip-link`, les tokens de mouvement) afin de rester synchronisé avec le reste du thème. Appliquez-le à la place des utilitaires Bootstrap si vous préférez une révélation basée sur une transformation :

```scss
.zer0-skip-link {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: var(--zer0-layer-skip-link); // 1100
  padding: 0.5rem 1rem;
  background: var(--zer0-color-primary);
  color: #fff;
  border-radius: 0.25rem;
  transform: translateY(-200%);
  transition: transform var(--zer0-motion-duration-base) var(--zer0-motion-ease-standard);

  &:focus,
  &:focus-visible {
    transform: translateY(0);
    outline: 2px solid #fff;
    outline-offset: 2px;
  }
}
```

## Personnalisation

> [!NOTE]
> Pour personnaliser le lien fourni, modifiez `_includes/core/header.html`. Les exemples CSS
> ci-dessous ciblent l'utilitaire SCSS `.zer0-skip-link` ; ajoutez la classe
> `zer0-skip-link` au lien (et retirez les utilitaires Bootstrap) si vous
> souhaitez remplacer son apparence avec les extraits qui suivent.

### Texte du lien

```html
<!-- Custom text -->
<a href="#main-content" class="visually-hidden-focusable position-absolute top-0 start-0 z-3 m-3 btn btn-primary">
  Jump to content
</a>
```

### Style

```css
/* Custom styling for the .zer0-skip-link helper */
.zer0-skip-link:focus {
  background: var(--bs-dark);
  color: var(--bs-light);
  border-radius: var(--bs-border-radius);
  box-shadow: var(--bs-box-shadow);
}
```

### Position

```css
/* Center the link */
.zer0-skip-link:focus {
  left: 50%;
  transform: translateX(-50%);
}

/* Right-aligned */
.zer0-skip-link:focus {
  left: auto;
  right: 1rem;
}
```

## Liens d'évitement multiples

Le thème fournit un unique lien d'évitement qui cible `#main-content`. Pour les pages comportant plusieurs points de repère majeurs, vous pouvez ajouter d'autres liens, en faisant pointer chaque `href` vers un ID présent dans votre balisage. L'en-tête est rendu avec `id="navbar"`, donc un lien « aller à la navigation » ciblerait `#navbar` :

```html
<div class="skip-links">
  <a href="#main-content" class="visually-hidden-focusable position-absolute top-0 start-0 z-3 m-3 btn btn-primary">
    Skip to main content
  </a>
  <a href="#navbar" class="visually-hidden-focusable position-absolute top-0 start-0 z-3 m-3 btn btn-primary">
    Skip to navigation
  </a>
</div>
```

## Conformité WCAG

### Exigences satisfaites

| Critère | Statut |
|-----------|--------|
| 2.4.1 Contournement de blocs (A) | ✅ |
| 2.1.1 Clavier (A) | ✅ |
| 2.4.3 Ordre de focus (A) | ✅ |
| 2.4.7 Visibilité du focus (AA) | ✅ |

### Bonnes pratiques

1. **Premier lien** : le lien d'évitement doit être le premier élément focalisable
2. **Texte clair** : utilisez un texte de lien descriptif
3. **Visible au focus** : doit devenir visible lorsqu'il est focalisé
4. **Cible valide** : l'élément cible doit exister et être focalisable

## Tests

### Tests manuels

1. Chargez la page
2. Appuyez immédiatement sur `Tab`
3. Vérifiez que le lien d'évitement apparaît
4. Appuyez sur `Enter`
5. Confirmez que le focus se déplace vers le contenu principal

### Tests automatisés

Sélectionnez le lien par son `href`, et non par une classe. L'élément livré porte des utilitaires Bootstrap (`visually-hidden-focusable position-absolute …`) et aucune classe `.skip-link` : un sélecteur de classe ne correspond donc à rien et le test réussit à vide ou échoue de manière trompeuse.

```javascript
// Accessibility test
describe('Skip Link', () => {
  it('should be first focusable element', () => {
    cy.get('body').tab();
    cy.focused().should('have.attr', 'href', '#main-content');
  });

  it('should skip to main content', () => {
    cy.get('[href="#main-content"]').focus().click();
    cy.focused().should('have.id', 'main-content');
  });
});
```

Le test de non-régression du thème pour ce comportement utilise Playwright, et non Cypress — voir `activating the skip link moves keyboard focus into main content` dans `test/visual/core/accessibility.spec.js`. Il active le lien et vérifie que le focus s'est réellement déplacé, l'assertion qui échoue lorsque `tabindex="-1"` est absent.

### Tests avec lecteur d'écran

Testez avec :

- NVDA (Windows)
- VoiceOver (macOS)
- JAWS (Windows)

Le lien devrait annoncer :
> "Aller au contenu principal, lien"

## Dépannage

### Le lien n'apparaît pas

1. Vérifiez que l'élément existe dans le DOM
2. Vérifiez que le CSS ne le masque pas
3. Assurez-vous que le JavaScript n'interfère pas

### Le lien ne fonctionne pas

1. Vérifiez que l'ID cible existe (`#main-content`)
2. Vérifiez que la cible possède `tabindex="-1"`
3. Testez sans JavaScript

### Le focus ne se déplace pas

1. Ajoutez `tabindex="-1"` à la cible
2. Vérifiez la présence de pièges à focus
3. Vérifiez l'absence de `e.preventDefault()` sur les liens

## Ressources associées

- [Navigation au clavier](/docs/features/keyboard-navigation/)
- [Navigation de la barre latérale](/docs/features/sidebar-navigation/)
- [Normes d'accessibilité](https://www.w3.org/WAI/WCAG21/quickref/)

## Voir aussi

- [[Features]]
- [[Keyboard Navigation]]
