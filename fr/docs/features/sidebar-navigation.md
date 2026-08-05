---
lastmod: 2026-07-01 00:00:00.000000000 Z
title: Système de navigation par barre latérale
description: Barre latérale adaptée aux collections avec les modes auto, collection,
  catégories, tags et arborescence, plus le scroll spy, les raccourcis clavier et
  les gestes de balayage.
preview: "/images/previews/sidebar-navigation-system.png"
layout: default
categories:
- docs
- features
tags:
- sidebar
- navigation
- scroll-spy
- accessibility
difficulty: intermediate
estimated_reading_time: 15 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/sidebar-navigation/"
translation_of: pages/_docs/features/sidebar-navigation.md
translation_source_url: "/docs/features/sidebar-navigation/"
machine_translated: true
translated_from_sha: 7b2f6d514ad2
---

# Système de navigation par barre latérale amélioré

Le thème Zer0-Mistakes inclut un système moderne de navigation par barre latérale avec un suivi du défilement optimisé pour les performances et des fonctionnalités d'accessibilité.

![Une page de documentation affichant la barre latérale rétractable « Browse docs » à gauche, l'article au centre et une table des matières « On this page » à droite](/assets/images/docs/features/docs-layout.png)

La barre latérale **Browse docs** à gauche est le système de navigation amélioré ; le panneau **On this page** à droite est la [table des matières](/docs/features/toc/).

## Vue d'ensemble

Fonctionnalités clés :

- **Intersection Observer** : réduction de 70 % de la surcharge liée aux événements de défilement
- **Défilement fluide** : tenant compte du décalage avec mise à jour de l'URL
- **Raccourcis clavier** : navigation entre sections avec `[` et `]`
- **Gestes de balayage** : balayages depuis les bords adaptés au mobile
- **Gestion du focus** : flux de navigation accessible

## Composants

### Barre latérale gauche

Panneau de navigation à l'échelle du site rendu par la mise en page par défaut :

```liquid
{% raw %}{% include navigation/sidebar-left.html %}{% endraw %}
```

Le panneau résout son contenu via deux includes partagés — utilisés par la barre latérale de bureau, l'offcanvas mobile et le tiroir unifié optionnel, afin qu'ils ne puissent jamais diverger :

| Include | Rôle |
|---|---|
| `navigation/sidebar-config.html` | Résout le mode effectif, le titre et l'icône de la page courante |
| `navigation/sidebar-nav.html` | Rend le mode résolu |
| `navigation/sidebar-folders.html` | Mode `collection` — arborescence de dossiers en direct d'une collection |
| `navigation/sidebar-categories.html` | Modes `categories` / `tags` — articles regroupés par taxonomie |
| `navigation/nav-tree.html` | Arborescences `_data/navigation/*.yml` organisées manuellement |

## Modes de navigation

Définissez le mode avec la clé de front matter `sidebar.nav` (ou une valeur par défaut de collection/site — voir [Configuration](#configuration)) :

| Mode | Rend | Idéal pour |
|---|---|---|
| `auto` | Le meilleur mode pour la collection de la page (voir ci-dessous) | Valeurs par défaut sans configuration |
| `collection` | Arborescence de dossiers en direct et rétractable des documents de la collection de la page | Notes, carnets, toute collection en croissance |
| `categories` | Articles regroupés par catégorie, avec nombre d'articles | Blogs organisés par catégorie |
| `tags` | Articles regroupés par étiquette, avec nombre d'articles | Blogs pilotés par étiquettes |
| toute autre valeur | `_data/navigation/<value>.yml` rendu comme une arborescence organisée manuellement | Docs ordonnés à la main (par ex. `nav: docs`) |

### Comment `auto` résout

`auto` choisit le mode le plus utile pour la page, en fonction de sa collection :

1. **L'arborescence organisée l'emporte** — si `_data/navigation/<collection>.yml` existe
(par ex. `docs.yml` pour la collection `docs`), elle est rendue avec `nav-tree.html`.
2. **Arborescence de collection** — sinon, une page à l'intérieur d'une collection obtient l'arborescence de dossiers
   `collection` en direct.
3. **Catégories** — les pages en dehors de toute collection reviennent aux
   catégories d'articles (lorsque le site comporte des articles avec catégories).

La colonne de gauche n'est rendue que lorsque le mode résolu contient réellement du contenu, de sorte qu'une page ne réserve jamais une colonne de barre latérale vide.

### Options du mode collection

Le mode `collection` regroupe les documents de la collection par sous-dossier en sections rétractables. Le fichier `index.md` d'un dossier devient le lien du dossier lui-même ; les noms de dossiers sont rendus lisibles (`getting-started` → « Getting started ») ; et le groupe contenant la page courante démarre déplié. Options (toutes facultatives) :

```yaml
sidebar:
  nav: collection
  collection: docs   # list a different collection than the page's own
  sort: title        # path (default) | title | date
  reverse: true      # reverse the sort (e.g. newest-first with sort: date)
  expand: true       # expand every folder group (default: active group only)
```

Masquez un document individuel de l'arborescence avec `sidebar_exclude: true` dans son front matter.

### Options du mode catégories / étiquettes

```yaml
sidebar:
  nav: categories    # or tags
  limit: 10          # max posts listed per term (default: all)
```

Remarque : Jekyll n'indexe que les **articles** dans `site.categories` / `site.tags`, donc ces modes listent des articles, pas des documents de collection.

## Configuration

Les paramètres se résolvent du plus spécifique au plus général : **front matter de la page → métadonnées de collection → configuration du site → valeurs par défaut du thème**.

### Front matter de la page

```yaml
sidebar:
  nav: docs            # mode or _data/navigation file (see table above)
  title: "Guides"      # panel heading override
  icon: bi-book        # Bootstrap Icons class for the heading
sidebar: false         # or: hide the sidebar (and TOC) entirely
```

### Métadonnées de collection (`_config.yml`)

```yaml
collections:
  notes:
    output: true
    title: Notes               # heading for the collection tree
    icon: bi-journal-richtext  # Bootstrap Icons class
    sidebar:
      nav: collection          # default mode for pages in this collection
```

### Valeurs par défaut du site (`_config.yml`)

```yaml
sidebar:
  title: "Browse docs"         # default panel heading
  icon: "bi-journal-bookmark"  # default heading icon
  nav: auto                    # optional site-wide fallback mode
```

Les valeurs par défaut du front matter restent la manière conventionnelle d'attribuer des modes par chemin de contenu (ce thème définit `nav: auto` pour docs/about/quickstart et notes/carnets dans son propre bloc `_config.yml` `defaults:`).

### Barre latérale droite (table des matières)

Navigation par titres spécifique à la page :

```liquid
{% raw %}{% include navigation/sidebar-right.html %}{% endraw %}
```

Fonctionnalités :

- Générée automatiquement à partir des titres
- Mise en surbrillance par scroll spy
- Bouton d'action flottant sur mobile

## Scroll Spy

### Comment ça fonctionne

Utilise Intersection Observer pour les performances :

```javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        highlightTocLink(entry.target.id);
      }
    });
  },
  { rootMargin: '-20% 0% -70% 0%' }
);
```

### Configuration

```javascript
// Adjust observer margins
const scrollSpyConfig = {
  rootMargin: '-20% 0% -70% 0%',
  threshold: 0
};
```

### Mise en surbrillance de la section active

Les liens actifs de la table des matières reçoivent la classe `.active` :

```css
.toc-link.active {
  color: var(--bs-primary);
  font-weight: 600;
  border-left: 2px solid var(--bs-primary);
}
```

## Défilement fluide

### Navigation tenant compte du décalage

Prend en compte l'en-tête fixe :

```javascript
function scrollToSection(id) {
  const element = document.getElementById(id);
  const headerOffset = 80; // Fixed header height
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.scrollY - headerOffset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}
```

### Mises à jour de l'URL

Les URL se mettent à jour sans rechargement de la page :

```javascript
history.pushState(null, '', `#${sectionId}`);
```

## Navigation au clavier

### Raccourcis disponibles

| Touche | Action |
|-----|--------|
| `[` | Section précédente |
| `]` | Section suivante |
| `Esc` | Fermer la barre latérale |
| `Tab` | Naviguer entre les liens |

### Implémentation

```javascript
document.addEventListener('keydown', (e) => {
  // Only when not in input
  if (e.target.matches('input, textarea')) return;
  
  if (e.key === '[') navigateToPrevSection();
  if (e.key === ']') navigateToNextSection();
});
```

## Gestes de balayage

### Navigation tactile

| Geste | Action |
|---------|--------|
| Balayer vers la droite depuis le bord gauche | Ouvrir la barre latérale gauche |
| Balayer vers la gauche depuis le bord droit | Ouvrir la table des matières |

### Configuration

```javascript
const swipeConfig = {
  threshold: 50,     // Minimum swipe distance
  edgeZone: 30       // Edge detection area
};
```

## Expérience mobile

### Bouton d'action flottant

Bouton de table des matières sur mobile :

```html
<div class="d-lg-none position-fixed bottom-0 end-0 p-3">
  <button class="btn btn-primary rounded-circle shadow-lg"
          data-bs-toggle="offcanvas"
          data-bs-target="#tocSidebar">
    <i class="bi bi-list-ul"></i>
  </button>
</div>
```

### Barre latérale hors-cadre

Barre latérale hors-cadre Bootstrap 5 pour mobile :

```html
<div class="offcanvas offcanvas-end" id="tocSidebar">
  <div class="offcanvas-header">
    <h5>On This Page</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
  </div>
  <div class="offcanvas-body">
    {% raw %}{% include content/toc.html %}{% endraw %}
  </div>
</div>
```

## Personnalisation

### Largeur de la barre latérale

```css
/* Left sidebar */
.sidebar-left {
  width: 280px;
}

/* Right sidebar (TOC) */
.sidebar-right {
  width: 250px;
}

/* Responsive */
@media (max-width: 991px) {
  .sidebar-left,
  .sidebar-right {
    width: 100%;
  }
}
```

### Icônes

Utilisation des Bootstrap Icons partout :

```html
<i class="bi bi-folder2-open"></i>  <!-- Categories -->
<i class="bi bi-file-earmark-text"></i>  <!-- Documents -->
<i class="bi bi-list-ul"></i>  <!-- TOC toggle -->
```

### Couleurs

```css
/* Sidebar theming */
.sidebar {
  --sidebar-bg: var(--bs-body-bg);
  --sidebar-text: var(--bs-body-color);
  --sidebar-active: var(--bs-primary);
}
```

## Performance

### Optimisations implémentées

1. **Intersection Observer** plutôt que les événements de défilement
2. **Gestionnaires temporisés** (délai de 100 ms)
3. **Initialisation paresseuse** (uniquement lorsque la table des matières existe)
4. **Transitions CSS** (accélérées matériellement)
5. **Requêtes efficaces** avec gestion des erreurs

### Métriques

- Réduction des événements de défilement : 70 %
- Réduction du rendu graphique : 50 %
- Utilisation de la mémoire : minimale

## Dépannage

### Le scroll spy ne fonctionne pas

1. Vérifiez que les identifiants des titres existent
2. Vérifiez que les liens de la table des matières correspondent aux identifiants des titres
3. Vérifiez la prise en charge de l'Intersection Observer

### Raccourcis clavier désactivés

1. Assurez-vous de ne pas être dans un champ de saisie
2. Vérifiez l'absence de raccourcis conflictuels
3. Vérifiez que le JavaScript est chargé

### Problèmes de barre latérale mobile

1. Vérifiez la cible du hors-cadre
2. Vérifiez que le JS de Bootstrap est chargé
3. Testez les événements tactiles

## Ressources associées

- [Navigation au clavier](/docs/features/keyboard-navigation/)
- [Bouton de table des matières mobile](/docs/features/mobile-toc/)
- [Table des matières](/docs/features/toc/)

## Référence technique

Pour les détails d'implémentation (scroll spy, gestes de balayage, raccourcis clavier, améliorations ARIA) :

- [Refonte de la navigation → docs/implementation/navigation-redesign.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/implementation/navigation-redesign.md)
- [Améliorations de la barre latérale → docs/implementation/feature-change-log.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/implementation/feature-change-log.md#sidebar-uiux-improvements-december-2025)

## Voir aussi

- [[Features]]
- [[Breadcrumbs Navigation]]
- [[Mobile TOC Floating Action Button]]
