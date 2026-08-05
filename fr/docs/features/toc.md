---
lastmod: 2026-06-15 00:00:00.000000000 Z
title: Table des matières
description: Génération automatique de la table des matières à partir des titres de
  la page avec scroll spy et défilement fluide.
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
translated_from_sha: 6e3a36b8d8b9
---

# Table des matières

Génération automatique de la table des matières à partir des titres de la page avec mise en évidence de la section active.

![Une page de documentation avec la table des matières « On this page » dans la colonne de droite, listant les titres de la page ; la section courante est mise en évidence au défilement](/assets/images/docs/features/docs-layout.png)

Le panneau **On this page** à droite est la table des matières, construite à partir des titres `h2`–`h6` de la page.

## Vue d'ensemble

- **Auto-générée** : Extraite des titres h2-h6
- **Scroll Spy** : Met en évidence la section courante
- **Défilement fluide** : Navigation animée
- **Responsive** : Barre latérale sur ordinateur, offcanvas sur mobile

## Implémentation

### Modèle d'inclusion

```liquid
{% raw %}{% include content/toc.html %}{% endraw %}
```

### Génération de la TOC

L'include `toc.html` utilise la TOC intégrée de Kramdown :

```liquid
{% raw %}<nav id="TableOfContents" class="toc">
  <h2 class="toc-title">On This Page</h2>
  {{ content | toc_only }}
</nav>{% endraw %}
```

Ou une extraction manuelle :

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

### Activer la TOC

Dans le front matter :

```yaml
---
toc: true
---
```

Ou à l'échelle du site dans `_config.yml` :

```yaml
defaults:
  - scope:
      type: docs
    values:
      toc: true
```

### Niveaux de titres

Configurer les titres à afficher :

```yaml
toc:
  min_level: 2  # Start at h2
  max_level: 4  # End at h4
```

## Style

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

### Intersection Observer

```javascript
function initScrollSpy() {
  const headings = document.querySelectorAll('h2[id], h3[id], h4[id]');
  const tocLinks = document.querySelectorAll('.toc-link');
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          tocLinks.forEach((link) => link.classList.remove('active'));
          const activeLink = document.querySelector(
            `.toc-link[href="#${entry.target.id}"]`
          );
          activeLink?.classList.add('active');
        }
      });
    },
    { rootMargin: '-20% 0% -70% 0%' }
  );
  
  headings.forEach((heading) => observer.observe(heading));
}
```

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

La TOC apparaît dans la barre latérale droite :

```html
<aside class="d-none d-lg-block">
  {% raw %}{% include content/toc.html %}{% endraw %}
</aside>
```

### Mobile

TOC en offcanvas (voir [Mobile TOC](/docs/features/mobile-toc/)) :

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

- Tabulation à travers les liens de la TOC
- Entrée pour naviguer vers la section
- Le focus se déplace vers le titre

## Dépannage

### La TOC ne se génère pas

1. Vérifiez que les titres ont des ID
2. Vérifiez `toc: true` dans le front matter
3. Assurez-vous d'utiliser le processeur Kramdown

### Le Scroll Spy ne fonctionne pas

1. Vérifiez que les ID des titres correspondent aux href de la TOC
2. Vérifiez la prise en charge d'Intersection Observer
3. Testez les marges de l'observer

### Problèmes de style

1. Vérifiez le positionnement sticky
2. Vérifiez le z-index
3. Testez le comportement d'overflow

## Voir aussi

- [Navigation dans la barre latérale](/docs/features/sidebar-navigation/)
- [Mobile TOC](/docs/features/mobile-toc/)
- [Navigation au clavier](/docs/features/keyboard-navigation/)

## Voir aussi

- [[Features]]
- [[Mobile TOC Floating Action Button]]
- [[Sidebar Navigation System]]
