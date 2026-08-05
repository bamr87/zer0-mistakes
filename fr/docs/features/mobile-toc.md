---
lastmod: 2026-06-15 00:00:00.000000000 Z
title: Bouton d'action flottant pour la table des matières mobile
description: Accès repensé à la table des matières mobile avec le modèle FAB pour
  une meilleure ergonomie sur les appareils tactiles.
preview: "/images/previews/mobile-toc-floating-action-button.png"
layout: default
categories:
- docs
- features
tags:
- mobile
- toc
- fab
- responsive
difficulty: beginner
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/mobile-toc/"
translation_of: pages/_docs/features/mobile-toc.md
translation_source_url: "/docs/features/mobile-toc/"
machine_translated: true
translated_from_sha: 0e7adef532b1
---

# Bouton d'action flottant du sommaire mobile

Le thème Zer0-Mistakes propose un sommaire mobile repensé avec un motif de bouton d'action flottant (FAB).

![Une page de documentation à la largeur d'un téléphone, avec des boutons d'action flottants empilés dans les coins — le FAB du sommaire, le bouton de retour en haut et le bouton d'affichage de la barre latérale](/assets/images/docs/features/mobile-toc.png)

Sur les affichages étroits, la barre latérale et le sommaire se replient en panneaux offcanvas ouvrables d'une pression, accessibles depuis ces FAB, afin que les longues pages restent lisibles sur un téléphone.

## Aperçu

Sur les appareils mobiles (< 992px), le sommaire est accessible via un bouton flottant positionné dans le coin inférieur droit de l'écran.

## Fonctionnalités

- **Motif FAB** : bouton flottant inspiré du Material Design
- **Position fixe** : toujours accessible pendant le défilement
- **Z-Index adapté** : n'entre pas en conflit avec les autres éléments
- **Accessibilité** : prise en charge complète d'ARIA

## Implémentation

### Balisage du bouton

```html
<div class="d-lg-none position-fixed bottom-0 end-0 p-3" style="z-index: 1030;">
  <button class="btn btn-primary rounded-circle shadow-lg"
          style="width: 56px; height: 56px;"
          data-bs-toggle="offcanvas"
          data-bs-target="#tocSidebar"
          aria-label="Table of contents">
    <i class="bi bi-list-ul fs-4"></i>
  </button>
</div>
```

### Attributs clés

| Attribut | Valeur | Rôle |
|-----------|-------|---------|
| `d-lg-none` | Bootstrap | Masquer sur les grands écrans |
| `position-fixed` | CSS | Garder le bouton visible |
| `bottom-0 end-0` | Bootstrap | Positionner en bas à droite |
| `z-index: 1030` | CSS | Au-dessus du contenu, sous les fenêtres modales |
| `rounded-circle` | Bootstrap | Bouton circulaire |
| `shadow-lg` | Bootstrap | Effet d'élévation |

## Dimensionnement

Conformément aux directives du Material Design :

- **Largeur** : 56px (FAB standard)
- **Hauteur** : 56px (FAB standard)
- **Icône** : 24px (fs-4)
- **Marge intérieure** : 16px autour du bouton (p-3)

## Intégration de l'offcanvas

Le bouton ouvre un offcanvas Bootstrap depuis la droite :

```html
<div class="offcanvas offcanvas-end" id="tocSidebar" tabindex="-1">
  <div class="offcanvas-header">
    <h5 class="offcanvas-title">On This Page</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
  </div>
  <div class="offcanvas-body">
    <!-- TOC content -->
  </div>
</div>
```

## Personnalisation

### Couleur du bouton

```css
/* Use secondary color */
.toc-fab {
  background-color: var(--bs-secondary);
}

/* Use custom color */
.toc-fab {
  background-color: #6366f1;
  border-color: #6366f1;
}
```

### Position

```css
/* Move to bottom-left */
.toc-fab-container {
  left: 0;
  right: auto;
}

/* Adjust spacing */
.toc-fab-container {
  padding: 1.5rem;
}
```

### Icône

```html
<!-- Alternative icons -->
<i class="bi bi-journal-text"></i>
<i class="bi bi-card-list"></i>
<i class="bi bi-menu-button-wide"></i>
```

## Accessibilité

### Attributs ARIA

```html
<button aria-label="Open table of contents"
        aria-expanded="false"
        aria-controls="tocSidebar">
```

### Gestion du focus

- Le bouton est focalisable via la touche Tab
- Ouvre l'offcanvas avec Entrée/Espace
- Le focus revient sur le bouton à la fermeture

### Lecteurs d'écran

Le bouton annonce :

1. « Ouvrir le sommaire, bouton »
2. À l'ouverture : « Sommaire, boîte de dialogue »

## Comportement responsive

| Taille d'écran | Comportement |
|-------------|----------|
| < 992px | FAB visible, sommaire en offcanvas |
| ≥ 992px | FAB masqué, sommaire en barre latérale |

### Classes CSS

```css
/* Bootstrap responsive utility */
.d-lg-none {
  /* Display: none on lg and up */
}

/* Show only on mobile */
@media (max-width: 991.98px) {
  .toc-fab { display: block; }
}
```

## Bonnes pratiques

### À faire

- ✅ Garder le bouton accessible pendant le défilement
- ✅ Utiliser une icône reconnaissable
- ✅ Fournir un retour visuel à la pression
- ✅ Garantir une cible de pression suffisante (44x44px minimum)

### À éviter

- ❌ Recouvrir du contenu important
- ❌ Utiliser trop de FAB
- ❌ Rendre le bouton trop petit
- ❌ Oublier les libellés d'accessibilité

## Dépannage

### Bouton non visible

1. Vérifiez la largeur de la fenêtre (doit être < 992px)
2. Vérifiez que le CSS Bootstrap est chargé
3. Vérifiez les conflits de z-index

### L'offcanvas ne s'ouvre pas

1. Vérifiez que le JS Bootstrap est chargé
2. Vérifiez que `data-bs-target` correspond à l'ID
3. Recherchez les erreurs JavaScript

### Problèmes de positionnement

1. Recherchez les éléments `position: fixed` en conflit
2. Vérifiez l'empilement des z-index
3. Testez sur un véritable appareil mobile

## Ressources associées

- [Navigation par barre latérale](/docs/features/sidebar-navigation/)
- [Table des matières](/docs/features/toc/)
- [Navigation au clavier](/docs/features/keyboard-navigation/)

## Voir aussi

- [[Features]]
- [[Table of Contents]]
- [[Sidebar Navigation System]]
