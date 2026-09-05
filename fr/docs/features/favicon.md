---
title: Configuration du favicon et de l'identité du navigateur
description: Balises favicon, icône Apple touch, manifeste web et theme-color pilotées
  par la configuration et émises sur chaque page, avec un repli /favicon.ico sans
  configuration.
keywords:
- favicon
- browser identity
- apple touch icon
- web manifest
- theme color
- svg favicon
- jekyll theme
lastmod: 2026-09-03 00:00:00.000000000 Z
layout: default
categories:
- docs
- features
tags:
- seo
- branding
- configuration
difficulty: beginner
estimated_reading_time: 4 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/favicon/"
translation_of: pages/_docs/features/favicon.md
translation_source_url: "/docs/features/favicon/"
machine_translated: true
translated_from_sha: 29f638af9118
---

# Favicon et identité du navigateur

Le thème émet les balises d'identité du navigateur — favicon, icône SVG vectorielle, icône Apple touch, manifeste web et `theme-color` — depuis `_includes/core/favicon.html`, inclus dans l'en-tête du document sur chaque page.

## Pourquoi les balises explicites comptent

Avant l'existence de cet include, les sites s'appuyaient sur la sonde `/favicon.ico` *implicite* du navigateur. Celle-ci échoue silencieusement de trois façons :

- Un site sans `favicon.ico` à la racine affiche le globe générique du navigateur et enregistre une erreur 404 à chaque visite.
- Les déploiements en page de projet avec un `baseurl` ne résolvent jamais `/favicon.ico` à la racine du domaine.
- Il n'existe aucun moyen de fournir implicitement une icône SVG, une icône d'écran d'accueil iOS ou un manifeste PWA.

## Comportement sans configuration

Sans aucune configuration, chaque page lie `/favicon.ico` explicitement (résolu via `relative_url`, de sorte que les sites `baseurl` fonctionnent) **et émet les deux balises `theme-color`** :

```html
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#212529">
```

Ces valeurs par défaut sont les propres `--bs-body-bg` de Bootstrap 5.3.3 pour chaque schéma, de sorte que la barre d'adresse mobile correspond à la **surface** de la page dès le départ. Cela compte surtout pour les consommateurs `remote_theme`, qui n'héritent pas de la `_config.yml` du thème — avant ce changement, la balise était conditionnée par la configuration, si bien qu'un tel site n'en obtenait aucune.

Conservez un `favicon.ico` à la racine de votre site — une icône 32×32 suffit.

## Configuration complète

Toutes les clés sont facultatives. Ajoutez un bloc `favicon:` à `_config.yml` :

```yaml
favicon:
  ico         : /favicon.ico                    # legacy .ico (default)
  svg         : /assets/images/favicon.svg      # scalable icon, preferred by modern browsers
  png         : /assets/images/favicon-32.png   # PNG icon
  png_size    : 32x32                           # sizes attribute for the png entry
  apple_touch : /assets/images/apple-touch.png  # iOS home-screen icon (180×180 or larger)
  manifest    : /site.webmanifest               # PWA manifest
  theme_color       : "#0d1117"                 # pin ONE chrome color for both schemes
  theme_color_light : "#ffffff"                 # light-scheme chrome (default: #ffffff)
  theme_color_dark  : "#212529"                 # dark-scheme chrome  (default: #212529)
```

Ce qui produit :

```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" type="image/svg+xml" href="/assets/images/favicon.svg">
<link rel="icon" type="image/png" href="/assets/images/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/images/apple-touch.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0d1117">
```

`theme_color` fixe une seule couleur pour les deux schémas, elle l'emporte donc sur la paire. Omettez-la pour obtenir les valeurs par défaut adaptées au schéma présentées ci-dessus (ou vos propres `theme_color_light` / `theme_color_dark`).

### Quelle forme est émise

`media="(prefers-color-scheme: …)"` dépend du réglage de l'**OS**, la paire n'est donc correcte que lorsque le site suit l'OS :

| votre configuration | émis |
| --- | --- |
| `color_mode_default: auto` (par défaut) | les deux balises, une par schéma |
| `color_mode_default: dark` ou `light` | une balise inconditionnelle pour cette surface |
| `color_mode_lock: true` | une balise inconditionnelle pour la surface fixée (`auto` se résout en sombre) |
| `favicon.theme_color` défini | une balise inconditionnelle avec votre valeur |

Un site à valeur fixée obtient une seule balise à dessein : une paire media donnerait un habillage de navigateur clair à un visiteur en mode clair de l'OS consultant une page que le site affiche en sombre.

> **Remarque.** Sur un site déverrouillé, un visiteur peut remplacer le mode depuis le panneau Apparence, et aucune meta statique ne peut suivre cela. Maintenir l'habillage synchronisé avec le panneau nécessite un point d'ancrage à l'exécution dans le chemin de bascule.

## Recommandations

- **SVG d'abord.** Une icône SVG carrée reste nette à toutes les tailles et peut respecter `prefers-color-scheme`. Conservez le `.ico` comme solution de repli héritée.
- **Réutilisez votre marque.** Si votre `logo` est déjà un SVG carré, pointez `favicon.svg` vers le même fichier.
- **Les icônes Apple touch ne se réduisent pas bien à partir de sources minuscules.** Utilisez au moins un PNG 180×180.
- **Consommateurs de thème distant** : cet include est fourni avec le thème — vous ne portez que les *assets* d'icônes et le bloc facultatif `favicon:` dans votre propre dépôt.

## Vérifier

L'intérêt de ces balises est que vous ne pouvez pas voir la plupart d'entre elles, alors vérifiez-les plutôt que de les supposer :

1. **Les icônes se résolvent.** Ouvrez les DevTools de votre navigateur → Réseau, rechargez et filtrez sur `favicon`. Chaque entrée doit être `200`, pas `404`. Sur un déploiement en page de projet (`baseurl`), c'est le contrôle qui compte — une sonde implicite à la racine renverrait une 404 ici.
2. **Les deux balises `theme-color` sont présentes.** Dans les DevTools du navigateur → Éléments, recherchez `<head>` pour `theme-color`. Un site `auto` devrait en afficher deux, une par `prefers-color-scheme` ; un site à valeur fixée, une seule. Si vous en voyez **zéro**, vous êtes sur un build antérieur à ce correctif.
3. **La valeur est la surface, pas l'accent.** Le `content` doit correspondre à l'arrière-plan de la page, pas à la couleur de vos liens. `#007bff` apparaissant ici signifie que quelque chose résout encore `theme_color.main`.
4. **L'habillage suit réellement.** Sur Chrome Android, chargez la page et basculez l'OS entre clair et sombre — la barre d'adresse et la carte du sélecteur de tâches devraient suivre. Safari iOS l'applique à la zone de la barre d'état.

## Dépannage

| Problème | Solution |
| --- | --- |
| Le changement de `theme-color` ne s'affiche pas après un déploiement | Les navigateurs mettent cette balise fortement en cache. Rechargez de force, ou vérifiez dans une fenêtre privée avant de supposer que le build est erroné. |
| La barre d'adresse reste claire sur une page sombre | Le visiteur a remplacé le mode dans le panneau Apparence ; `media` suit l'**OS**, pas ce panneau. Comportement attendu — voir la remarque ci-dessus. Pour forcer une correspondance à l'échelle du site, définissez `color_mode_lock: true`. |
| La barre d'adresse est votre couleur de marque | `favicon.theme_color` est défini et fixe une seule valeur pour les deux schémas. Supprimez-le pour obtenir la paire adaptée au schéma. |
| Aucun `theme-color` du tout | Vous utilisez une version antérieure à cette correction, où la balise était conditionnée par la configuration et un consommateur ne déclarant aucun `theme_color` n'en obtenait aucun. |
| Icône Apple touch absente de l'écran d'accueil iOS | iOS ne suit pas de redirection pour cette image. Vérifiez que `favicon.apple_touch` se résout directement sous votre `baseurl`. |
| `favicon.theme_color_light` ne se résout à rien | Le code hexadécimal n'est pas entre guillemets, donc YAML a interprété `#ffffff` comme un commentaire. Mettez-le entre guillemets. |

## Voir aussi

- [Liste de contrôle du consommateur Remote-Theme](/docs/deployment/remote-theme-checklist/) — ce qu'un site `remote_theme` doit déclarer lui-même, y compris les ressources d'icônes et le bloc optionnel `favicon:`
- [Fonctionnalités](/docs/features/) — index de toutes les fonctionnalités du thème
