---
lastmod: 2026-09-05 00:00:00.000000000 Z
title: Table des matières avec Scroll Spy
description: Table des matières automatique générée à partir des titres h1-h3 d'une
  page, avec un scroll spy positionnel qui met en gras la section en cours de lecture
  et un défilement fluide des ancres.
keywords:
- table of contents
- toc
- scroll spy
- anchor navigation
- page headings
- jekyll theme
- sidebar
preview: "/images/previews/table-of-contents.png"
layout: default
categories:
- docs
- features
tags:
- toc
- navigation
- headings
- documentation
difficulty: beginner
estimated_reading_time: 10 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/toc/"
translation_of: pages/_docs/features/toc.md
translation_source_url: "/docs/features/toc/"
machine_translated: true
translated_from_sha: 0560ebf13ef1
---

# Table des matières

Génération automatique de la table des matières à partir des titres de la page, avec mise en évidence de la section active.

![Une page de documentation avec la table des matières « Sur cette page » dans la colonne de droite, listant les titres de la page ; la section actuelle est mise en évidence au défilement](/assets/images/docs/features/docs-layout.png)

Le panneau **Sur cette page** à droite est la table des matières, construite à partir des titres `h1`–`h3` de la page.

## Vue d'ensemble

- **Auto-générée** : Extraite des titres h1-h3 (la plage est un paramètre, voir [Niveaux de titre](#heading-levels))
- **Scroll Spy** : Met en évidence la section actuelle
- **Défilement fluide** : Navigation animée
- **Responsive** : Barre latérale sur ordinateur, panneau hors-écran sur mobile

## Implémentation

### Modèle d'inclusion

```liquid
{% raw %}{% include content/toc.html %}{% endraw %}
```

### Génération de la table des matières

L'inclusion `toc.html` utilise la table des matières intégrée de Kramdown :

```liquid
{% raw %}<nav id="TableOfContents" class="toc">
  <h2 class="toc-title">On This Page</h2>
  {{ content | toc_only }}
</nav>{% endraw %}
```

Ou extraction manuelle :

```liquid
{% raw %}<nav id="TableOfContents">
  <ul class="toc-list">
    {% for heading in page.content | split: '<h' %}
      {% if heading contains 'id="' %}
        {% assign id = heading | split: 'id="' | last | split: '"' | first %}
        {% assign level = heading | slice: 0, 1 %}
        {% assign text = heading | split: '>' | last | split: '<' | first %}
        <li class="toc-item toc-level-{{ level }}">
          <a href="#{{ id }}" class="toc-link">{{ text }}</a>
        </li>
      {% endif %}
    {% endfor %}
  </ul>
</nav>{% endraw %}
```

## Configuration

### Activer la table des matières

Dans le front matter :

```yaml
---
toc: true
---
```

Ou pour tout le site dans `_config.yml` :

```yaml
defaults:
  - scope:
      type: docs
    values:
      toc: true
```

### Niveaux de titre

La plage est définie à l'endroit où la table des matières est incluse, avec les paramètres `h_min` / `h_max`. `_includes/navigation/sidebar-right.html` génère le panneau de droite avec `h_min=1 h_max=3`, de sorte que le titre de la page et ses sections h2/h3 apparaissent :

```liquid
{% raw %}{% include content/toc.html html=content h_min=1 h_max=3 %}{% endraw %}
```

L'inclusion elle-même utilise par défaut `h_min=1` et `h_max=6` ; tout ce qui est en dehors de la plage est ignoré, tout comme tout titre sans `id`.

## Mise en forme

### Styles de base

```css
.toc {
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.toc-title {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-link {
  display: block;
  padding: 0.25rem 0;
  color: var(--bs-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  border-left: 2px solid transparent;
  padding-left: 0.75rem;
}

.toc-link:hover {
  color: var(--bs-primary);
}

.toc-link.active {
  color: var(--bs-primary);
  border-left-color: var(--bs-primary);
  font-weight: 500;
}
```

### Niveaux imbriqués

```css
.toc-level-3 {
  padding-left: 1rem;
}

.toc-level-4 {
  padding-left: 2rem;
  font-size: 0.8125rem;
}
```

## Scroll Spy

`assets/js/modules/navigation/scroll-spy.js` met en gras l'entrée de la section que vous lisez. La règle est positionnelle plutôt que basée sur la visibilité : le titre actif est le **dernier dont le haut a franchi la ligne de lecture** — une ligne située `scroll-padding-top` sous le haut de la fenêtre, c'est-à-dire juste sous l'en-tête fixe, qui est aussi l'endroit où cliquer sur une entrée de la table des matières place son titre. Une fois la page défilée jusqu'en bas, le dernier titre l'emporte, de sorte que les sections finales plus courtes que la fenêtre restent accessibles.

```javascript
// Simplified: the active heading, recomputed on each scroll frame.
function activeHeading(headings) {          // headings sorted by document offset
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
  const atBottom =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  if (atBottom) return headings[headings.length - 1];

  const line = window.scrollY + pad + 4;
  let active = headings[0];
  for (const heading of headings) {
    if (heading.top > line) break;
    active = heading;
  }
  return active;
}
```

Les décalages des titres sont mesurés une fois et re-mesurés au redimensionnement ou au réagencement du contenu (`ResizeObserver`), et le recalcul est limité à une image d'animation par défilement, de sorte que toute la page est réévaluée à chaque image sans mesurer le DOM à chaque fois.

Demander à `IntersectionObserver` le titre « le plus visible » semble plus simple mais ne fonctionne pas : les titres ne font que quelques pixels de haut, de sorte que chaque titre à l'intérieur de la bande d'observation renvoie le même `intersectionRatio`, et les titres qui quittent la bande ne déclenchent aucun rappel. La mise en évidence se pose alors sur le titre qui se trouvait dans le dernier lot de rappels.

Deux détails comptent pour le ressenti. Une entrée cliquée reste active pendant que le défilement fluide s'anime, au lieu de faire clignoter chaque titre traversé en chemin. Et garder l'entrée active visible dans une longue table des matières ajuste le `scrollTop` du conteneur de la table des matières lui-même — `scrollIntoView()` remonterait et ferait défiler la page, ce qui reboucle directement sur le scroll spy.

**Configuration** (`assets/js/modules/navigation/config.js`) :

| Clé | Défaut | Objet |
|-----|---------|---------|
| `scrollSpy.offset` | `null` | Distance de la ligne de lecture par rapport au haut de la fenêtre. `null` la dérive de `scroll-padding-top` ; définissez un nombre pour la fixer. |
| `scrollSpy.tolerance` | `4` | Marge (px) à la ligne de lecture et lors de la détection du bas de la page. |

## Défilement fluide

### Méthode CSS

```css
html {
  scroll-behavior: smooth;
}
```

### Méthode JavaScript

```javascript
document.querySelectorAll('.toc-link').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href').slice(1);
    const target = document.getElementById(targetId);
    const headerOffset = 80;
    const position = target.offsetTop - headerOffset;
    
    window.scrollTo({
      top: position,
      behavior: 'smooth'
    });
    
    history.pushState(null, '', `#${targetId}`);
  });
});
```

## Comportement responsive

### Ordinateur

La table des matières apparaît dans la barre latérale droite :

```html
<aside class="d-none d-lg-block">
  {% raw %}{% include content/toc.html %}{% endraw %}
</aside>
```

### Mobile

Table des matières en panneau hors-écran (voir [Table des matières mobile](/docs/features/mobile-toc/)) :

```html
<div class="offcanvas offcanvas-end d-lg-none" id="tocSidebar">
  {% raw %}{% include content/toc.html %}{% endraw %}
</div>
```

## Accessibilité

### Attributs ARIA

```html
<nav id="TableOfContents" 
     aria-label="Table of contents"
     role="navigation">
```

### Navigation au clavier

- Tabulation à travers les liens de la table des matières
- Entrée pour naviguer vers la section
- Le focus se déplace vers le titre

## Dépannage

### La table des matières ne se génère pas

1. Vérifiez que les titres ont des ID
2. Vérifiez `toc: true` dans le front matter
3. Assurez-vous d'utiliser le processeur Kramdown

### Le Scroll Spy ne fonctionne pas

1. Vérifiez que les ID des titres correspondent aux hrefs de la table des matières — le scroll spy résout le `href` de chaque lien de la table des matières vers un titre par `id`, donc un lien sans élément correspondant est ignoré
2. Vérifiez la ligne de lecture — `scroll-padding-top` sur `html` (ou `config.scrollSpy.offset`) décide quand un titre devient actif
3. Vérifiez que rien d'autre ne revendique `#TableOfContents` — un second scroll spy (un élément `data-bs-spy="scroll"` le ciblant) se dispute la classe `.active`

### Problèmes de mise en forme

1. Vérifiez le positionnement sticky
2. Vérifiez le z-index
3. Testez le comportement du débordement

## Associés

- [Navigation dans la barre latérale](/docs/features/sidebar-navigation/)
- [TOC mobile](/docs/features/mobile-toc/)
- [Navigation au clavier](/docs/features/keyboard-navigation/)

## Voir aussi

- [[Features]]
- [[Mobile TOC Floating Action Button]]
- [[Sidebar Navigation System]]
