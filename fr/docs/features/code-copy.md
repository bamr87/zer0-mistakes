---
lastmod: 2026-06-15 00:00:00.000000000 Z
title: Bouton de copie de code
description: Fonctionnalité de copie en un clic pour les blocs de code, avec retour
  visuel et intégration de l'API Clipboard.
preview: "/images/previews/code-copy-button.png"
layout: default
categories:
- docs
- features
tags:
- code
- clipboard
- developer-experience
- ui
difficulty: beginner
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/code-copy/"
translation_of: pages/_docs/features/code-copy.md
translation_source_url: "/docs/features/code-copy/"
machine_translated: true
translated_from_sha: 747017052ef0
---

# Bouton de copie de code

Boutons de copie automatiques sur tous les blocs de code pour une copie facile dans le presse-papiers.

![Un bloc de code JavaScript surligné avec un bouton « Copy » dans son coin supérieur droit, tel qu'il est rendu dans la documentation](/assets/images/docs/features/code-copy.png)

Le bouton est injecté automatiquement dans chaque bloc de code délimité — il n'y a aucun front matter à définir et rien à importer. Survolez un bloc et cliquez sur **Copy** pour placer son contenu dans le presse-papiers, avec une brève confirmation « Copied! ».

## Vue d'ensemble

- **Injection automatique** : boutons ajoutés à tous les blocs de code
- **API Clipboard** : accès moderne et asynchrone au presse-papiers
- **Retour visuel** : confirmation « Copied! »
- **Accessible** : étiquettes ARIA et prise en charge du clavier

## Implémentation

### JavaScript

```javascript
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('pre.highlight, pre code').forEach(function(pre) {
    // Skip if already has button
    if (pre.querySelector('.copy')) return;
    
    var preElement = pre.tagName === 'PRE' ? pre : pre.closest('pre');
    if (!preElement) return;
    
    var button = document.createElement('button');
    button.className = 'copy';
    button.type = 'button';
    button.setAttribute('aria-label', 'Copy code to clipboard');
    button.innerHTML = '<i class="bi bi-clipboard me-1"></i>Copy';
    
    button.addEventListener('click', function(e) {
      e.preventDefault();
      var code = preElement.querySelector('code');
      if (!code) return;
      
      navigator.clipboard.writeText(code.textContent).then(function() {
        button.innerHTML = '<i class="bi bi-check me-1"></i>Copied!';
        setTimeout(function() {
          button.innerHTML = '<i class="bi bi-clipboard me-1"></i>Copy';
        }, 2000);
      });
    });
    
    preElement.appendChild(button);
  });
});
```

## Style

### Positionnement du bouton

```css
pre.highlight {
  position: relative;
}

pre .copy {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  background: var(--bs-secondary);
  color: white;
  border: none;
  border-radius: var(--bs-border-radius);
  opacity: 0;
  transition: opacity 0.2s;
}

pre:hover .copy {
  opacity: 1;
}

pre .copy:hover {
  background: var(--bs-primary);
}
```

### État de succès

```css
pre .copy.copied {
  background: var(--bs-success);
}
```

## Personnalisation

### Texte du bouton

```javascript
var copyText = 'Copy';
var copiedText = 'Copied!';
```

### Icônes

```javascript
// Bootstrap Icons
button.innerHTML = '<i class="bi bi-clipboard"></i>';

// Text only
button.textContent = 'Copy';

// SVG icon
button.innerHTML = '<svg>...</svg>';
```

### Toujours visible

```css
pre .copy {
  opacity: 1;
}
```

### Position différente

```css
/* Bottom right */
pre .copy {
  top: auto;
  bottom: 0.5rem;
}

/* Top left */
pre .copy {
  right: auto;
  left: 0.5rem;
}
```

## API Clipboard

### Approche moderne

```javascript
navigator.clipboard.writeText(text)
  .then(() => console.log('Copied!'))
  .catch(err => console.error('Failed to copy:', err));
```

### Solution de repli pour les navigateurs plus anciens

```javascript
function copyToClipboard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  
  // Fallback
  var textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  return Promise.resolve();
}
```

## Accessibilité

### Étiquettes ARIA

```html
<button aria-label="Copy code to clipboard"
        title="Copy code to clipboard">
  Copy
</button>
```

### Styles de focus

```css
pre .copy:focus {
  outline: 2px solid var(--bs-primary);
  outline-offset: 2px;
}

pre .copy:focus-visible {
  opacity: 1;
}
```

### Retour pour lecteur d'écran

```javascript
// Announce copy success
button.setAttribute('aria-label', 'Copied to clipboard');
setTimeout(() => {
  button.setAttribute('aria-label', 'Copy code to clipboard');
}, 2000);
```

## Spécifique au langage

### Ignorer certains langages

```javascript
// Don't add to terminal output
if (pre.classList.contains('language-output')) return;
if (pre.classList.contains('language-console')) return;
```

### Étiquette personnalisée par langage

```javascript
var lang = pre.className.match(/language-(\w+)/);
if (lang) {
  button.setAttribute('aria-label', `Copy ${lang[1]} code`);
}
```

## Dépannage

### Le bouton n'apparaît pas

1. Vérifiez que le bloc de code comporte `pre.highlight` ou `pre code`
2. Vérifiez que le JavaScript est chargé
3. Vérifiez que le CSS ne masque pas le bouton
4. Inspectez la présence de boutons en double

### La copie ne fonctionne pas

1. Vérifiez les autorisations du presse-papiers du navigateur
2. Vérifiez le HTTPS (requis pour l'API Clipboard)
3. Testez la méthode de repli
4. Recherchez les erreurs JavaScript

### Problèmes de style

1. Vérifiez `position: relative` sur pre
2. Vérifiez les conflits de z-index
3. Testez les états de survol
4. Vérifiez que le bouton se trouve à l'intérieur de pre

## Ressources associées

- [Coloration syntaxique du code](/docs/jekyll/code-highlighting/)
- [Diagrammes Mermaid](/docs/features/mermaid-diagrams/)

## Voir aussi

- [[Features]]
- [[Code Highlighting]]
