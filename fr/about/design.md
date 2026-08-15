---
title: Design system
description: Le design system zer0-mistakes, en direct — tokens, spécimens de fondation,
  jumeaux de composants et l'aller-retour Claude Design qui les maintient synchronisés
  avec le thème.
layout: default
icon: bi-palette2
lastmod: 2026-08-14 00:00:00.000000000 Z
categories:
- about
tags:
- design-system
- tokens
- ui
lang: fr
permalink: "/fr/design/"
translation_of: pages/_about/design.md
translation_source_url: "/design/"
machine_translated: true
translated_from_sha: 1603b6e4656c
---

Un contrat visuel unique, énoncé une seule fois. Les tokens `--zer0-*` du thème se compilent dans chaque page de ce site, se reflètent dans un [projet Claude Design](https://claude.ai/design/p/e75121c0-9210-42d1-ade3-2c8af9111cbe) pour le travail de conception, et sont publiés ici sous forme de CSS vivant et liable — maintenus synchronisés par une vérification de parité en CI.

## Utilisez les tokens partout

Le design system est livré comme un unique point d'entrée en CSS pur. Liez-le depuis n'importe quel prototype, maquette ou page — sans Bootstrap, sans étape de build :

```html
<link rel="stylesheet" href="{{ '/_design-system/styles.css' | absolute_url }}">
<div style="color: var(--zer0-color-primary); border-radius: var(--zer0-radius-xl);">…</div>
```

Chaque fichier de tokens est également adressable individuellement — [couleurs](⟦3⟧), [typographie](⟦4⟧), [espacement](⟦5⟧), [rayons](⟦6⟧), [points de rupture](⟦7⟧), [ombres](⟦8⟧), [mouvement](⟦9⟧), [couches](⟦10⟧), [thèmes](⟦11⟧).

## Fondations, en direct

Chaque spécimen ci-dessous est la véritable carte du design system, rendue à partir des tokens publiés — pas une capture d'écran.

<div class="row g-4 mt-1">
  {% assign ds_cards = "colors-brand.card.html|Brand & primary|240,colors-semantic.card.html|Semantic state|240,colors-surfaces.card.html|Surfaces & ink|260,colors-skins.card.html|Theme skins|260,type-headings.card.html|Display & headings|320,type-body.card.html|Body & weights|230,type-mono.card.html|Monospace & code|220,spacing-scale.card.html|Spacing scale|220,spacing-radii-elevation.card.html|Radii & elevation|240,motion.card.html|Durations & easing|260,layers.card.html|Z-index stack|300,brand-iconography.card.html|Iconography|260" | split: "," %}
  {% for card in ds_cards %}
    {% assign parts = card | split: "|" %}
    <div class="col-md-6">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-header bg-body-tertiary d-flex justify-content-between align-items-center">
          <span class="fw-semibold">{{ parts[1] }}</span>
          <a class="small text-decoration-none" href="⟦24⟧" target="_blank" rel="noopener">ouvrir <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i></a>
        </div>
        <iframe src="{{ '/_design-system/guidelines/' | append: parts[0] | relative_url }}" title="{{ parts[1] }} specimen" loading="lazy" class="w-100 border-0 rounded-bottom" style="height: {{ parts[2] }}px;"></iframe>
      </div>
    </div>
  {% endfor %}
</div>

## Composants

Les motifs emblématiques du thème existent deux fois à dessein : sous forme de Liquid + Sass qui rend ce site, et sous forme de jumeaux React pour le travail de conception dans Claude Design. Les jumeaux se rendent de façon interactive dans le [projet Claude Design](https://claude.ai/design/p/e75121c0-9210-42d1-ade3-2c8af9111cbe) (le bundle de composants est compilé par l'application Design) ; leurs sources sont publiées ici.

| Composant | Source du thème | Spécification de design |
|-----------|--------------|-------------|
| Bouton | `cta-button.html` + Bootstrap `.btn` | [`core/Button`](⟦35⟧) |
| Badge | `post-type-badge.html` + Bootstrap `.badge` | [`core/Badge`](⟦40⟧) |
| Pile FAB | boutons retour en haut / chat / TOC / graphe | [`core/Fab`](⟦45⟧) |
| Carte | motif `.card border-0 shadow-sm` | [`surfaces/Card`](⟦48⟧) |
| Carte de fonctionnalité | cartes de fonctionnalité de la page d'accueil | [`surfaces/FeatureCard`](⟦52⟧) |
| Carte d'article | `post-card.html` | [`surfaces/PostCard`](⟦55⟧) |
| Encadré | `callout.html` | [`feedback/Callout`](⟦59⟧) |
| Squelette | scintillement `_skeleton.scss` | [`feedback/Skeleton`](⟦63⟧) |
| Champ de saisie | contrôles de formulaire Bootstrap + anneau de focus | [`forms/Input`](⟦67⟧) |

Chaque spécification est livrée avec une surface de types `.d.ts` et une invite d'utilisation `.prompt.md` aux côtés du `.jsx` — changez l'extension sur n'importe quel lien ci-dessus.

## Designs de pages

Chaque écran de ce thème — la page d'accueil, les 24 layouts, le framework de navigation, les actualités, la recherche, le panneau latéral des paramètres — est également recréé comme un canevas de design navigable construit sur ces tokens :

- **[Thème zer0-mistakes — canevas de page](https://claude.ai/design/p/54d4394c-4500-4e52-9cea-05e56fc54706?file=zer0-mistakes+Theme.dc.html&present=1)** (présentation Claude Design)
- Le canevas relie chaque écran à ses fichiers du dépôt, afin que la revue de design et l'implémentation pointent toujours vers la même source.

## Comment cela reste fiable

- `_sass/tokens/` dans le [dépôt du thème](https://github.com/bamr87/zer0-mistakes) est l'unique source de vérité ; `/_design-system/` en est le miroir publié.
- `scripts/design-system-check.rb` s'exécute en CI et échoue lorsque les deux divergent — noms de tokens *et* valeurs résolues.
- Le contrat complet réside dans [`_design-system/SYNC.md`](⟦78⟧) ; guide de design dans [`_design-system/readme.md`](⟦79⟧).

> Vous voulez la galerie de composants interactive avec chaque thème appliqué ? Consultez l'[aperçu du thème](⟦84⟧).
