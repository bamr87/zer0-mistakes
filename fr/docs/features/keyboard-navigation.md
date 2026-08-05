---
lastmod: 2026-06-16 00:00:00.000000000 Z
title: Navigation au clavier
description: Guide complet des raccourcis clavier et des fonctionnalités d'accessibilité
  de la navigation dans le thème Zer0-Mistakes.
preview: "/images/previews/keyboard-navigation.png"
layout: default
categories:
- docs
- features
- accessibility
tags:
- keyboard
- shortcuts
- accessibility
- navigation
difficulty: beginner
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/keyboard-navigation/"
translation_of: pages/_docs/features/keyboard-navigation.md
translation_source_url: "/docs/features/keyboard-navigation/"
machine_translated: true
translated_from_sha: d0be119d5f6c
---

# Navigation au clavier

Le thème Zer0-Mistakes inclut une prise en charge complète de la navigation au clavier pour améliorer l'accessibilité et l'efficacité de la navigation pour tous les utilisateurs.

![La fenêtre modale d'aide sur les raccourcis clavier répertoriant des actions telles qu'Ouvrir la recherche, Section précédente/suivante et Afficher la table des matières](/assets/images/docs/features/keyboard-navigation.png)

Appuyez sur <kbd>?</kbd> sur n'importe quelle page pour ouvrir cette référence des raccourcis.

## Référence rapide

| Raccourci | Action | Contexte |
|----------|--------|---------|
| `Tab` / `Shift+Tab` | Naviguer en avant/en arrière parmi les liens | N'importe où |
| `Enter` / `Space` | Activer un lien ou un bouton | Sur un élément focalisable |
| `[` | Aller à la section précédente | Table des matières |
| `]` | Aller à la section suivante | Table des matières |
| `Esc` | Fermer la barre latérale offcanvas | Quand la barre latérale est ouverte |
| `/` | Focaliser la recherche (à venir) | N'importe où |

## Navigation par saut

### Aller au contenu principal

Appuyez sur `Tab` immédiatement après le chargement de la page pour afficher le lien « Aller au contenu principal ». Cela permet aux utilisateurs du clavier de contourner le menu de navigation et d'accéder directement au contenu de la page.

**Comment ça fonctionne :**

1. La page se charge
2. Appuyez une fois sur `Tab`
3. Le bouton « Aller au contenu principal » apparaît
4. Appuyez sur `Enter` pour accéder au contenu principal

## Navigation par barre latérale

### Barre latérale gauche

La barre latérale gauche fournit la navigation à l'échelle du site et peut être contrôlée au clavier :

- **Ouvrir sur mobile** : atteignez le bouton de menu avec Tab, appuyez sur `Enter`
- **Naviguer parmi les éléments** : utilisez `Tab` pour parcourir les liens
- **Développer les catégories** : appuyez sur `Enter` sur les boutons de catégorie
- **Fermer** : appuyez sur `Esc`

### Barre latérale droite (table des matières)

La barre latérale de la table des matières inclut une navigation au clavier avancée :

#### Navigation par section

- **Section précédente** : appuyez sur `[` pour faire défiler jusqu'au titre précédent
- **Section suivante** : appuyez sur `]` pour faire défiler jusqu'au titre suivant
- **Sélection directe** : parcourez les liens de la table des matières avec Tab et appuyez sur `Enter`

#### Accès mobile

Sur les appareils mobiles :

1. Le bouton de la table des matières apparaît dans le coin inférieur droit
2. Atteignez le bouton avec Tab ou balayez depuis le bord droit
3. Appuyez sur `Enter` pour ouvrir
4. Naviguez avec `Tab`, fermez avec `Esc`

## Gestion du focus

Le thème gère automatiquement le focus pour offrir une expérience clavier fluide :

### Piège de focus offcanvas

Lorsqu'une barre latérale s'ouvre :

- Le focus se déplace à l'intérieur du panneau offcanvas
- `Tab` parcourt en boucle les éléments du panneau
- `Esc` ferme le panneau et redonne le focus au bouton déclencheur

### Liens d'ancrage

En cliquant sur les liens de la table des matières :

- La page défile jusqu'au titre ciblé
- Le focus se déplace vers le titre pour poursuivre la navigation au clavier
- L'URL se met à jour sans recharger la page

## Fonctionnalités d'accessibilité

### Prise en charge des lecteurs d'écran

- Tous les éléments interactifs disposent d'étiquettes ARIA descriptives
- Les repères de navigation sont clairement définis
- Liens de saut pour une navigation efficace
- Indicateurs de focus visibles en permanence

### Indicateurs visuels de focus

- Contours de focus à contraste élevé sur tous les éléments interactifs
- Mise en surbrillance de la section active dans la table des matières
- Indication de la page courante dans la navigation
- États de survol pour une meilleure visibilité

### Mouvement réduit

Le thème respecte le paramètre système `prefers-reduced-motion` :

- Défilement fluide désactivé lorsque demandé
- Animations de transition minimisées
- Changements de page instantanés plutôt qu'animés

## Gestes tactiles et balayages

Sur les appareils tactiles, des commandes gestuelles supplémentaires sont disponibles :

### Balayer pour ouvrir

- **Balayer vers la droite** depuis le bord gauche : ouvre la barre latérale gauche
- **Balayer vers la gauche** depuis le bord droit : ouvre la table des matières

### Cibles tactiles

Tous les éléments interactifs respectent la taille minimale requise des cibles tactiles (44x44px) pour une meilleure accessibilité.

## Prise en charge des navigateurs

Les fonctionnalités de navigation au clavier fonctionnent dans :

- Chrome/Edge 58+
- Firefox 55+
- Safari 12.1+
- Tous les navigateurs mobiles modernes

## Dépannage

### Focus non visible

Si vous ne voyez pas les indicateurs de focus :

1. Vérifiez les paramètres du navigateur concernant le « surlignage de tabulation »
2. Assurez-vous que du CSS personnalisé n'a pas remplacé les styles `:focus`
3. Essayez un autre navigateur

### Raccourcis ne fonctionnant pas

Si les raccourcis clavier ne répondent pas :

1. Assurez-vous que JavaScript est activé
2. Vérifiez la console du navigateur pour d'éventuelles erreurs
3. Vérifiez que vous n'êtes pas en train de saisir dans un champ de formulaire
4. Essayez de rafraîchir la page

### Problèmes de lecteur d'écran

Pour les problèmes de lecteur d'écran :

1. Assurez-vous d'utiliser la dernière version du lecteur d'écran
2. Vérifiez la prise en charge d'ARIA dans votre navigateur
3. Consultez les [directives WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

## Retours

Vous avez des suggestions pour améliorer la navigation au clavier ? [Ouvrez un ticket](https://github.com/bamr87/zer0-mistakes/issues) ou contribuez à nos [améliorations d'accessibilité](https://github.com/bamr87/zer0-mistakes/blob/main/CONTRIBUTING.md).

---

*Ce guide respecte les normes d'accessibilité [WCAG 2.1 niveau AA](https://www.w3.org/WAI/WCAG21/quickref/).*

## Référence technique

Pour les détails d'implémentation (conformité WCAG 2.1 AA, attributs ARIA, gestion des événements clavier, gestion du focus) :

- [Refonte de la navigation → docs/implementation/navigation-redesign.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/implementation/navigation-redesign.md)

## Voir aussi

- [[Features]]
- [[Skip-to-Content Accessibility Link]]
- [[Sidebar Navigation System]]
