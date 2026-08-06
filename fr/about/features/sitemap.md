---
title: Fonctionnalité de plan du site amélioré
lastmod: 2025-12-20 22:15:46.563000000 Z
description: Navigation complète du site avec recherche avancée, filtrage et outils
  de découverte
preview: "/images/previews/enhanced-sitemap-feature.png"
layout: default
categories:
- Features
- Navigation
tags:
- sitemap
- navigation
- search
- discovery
lang: fr
permalink: "/fr/about/features/navigation/sitemap/"
translation_of: pages/_about/features/sitemap.md
translation_source_url: "/about/features/navigation/sitemap/"
machine_translated: true
translated_from_sha: 59933f686482
---

# 🗺️ Fonctionnalité de plan de site amélioré

Le plan de site amélioré est un puissant outil de navigation et de découverte de contenu qui offre une vue d'ensemble complète de tout le contenu du site, avec des capacités avancées de recherche, de filtrage et de tri.

## 🌟 Fonctionnalités clés

### 📊 Tableau de bord d'ensemble

- **Statistiques du site** : nombre total de pages et de collections
- **Répartition par collection** : distribution visuelle du contenu entre les collections
- **Compteurs en temps réel** : affiche les résultats filtrés par rapport au total

### 🔍 Recherche avancée

- **Recherche multi-champs** : recherche dans les titres, descriptions, catégories, étiquettes et contenu
- **Résultats en temps réel** : recherche instantanée avec anti-rebond pour les performances
- **Paramètres d'URL** : recherche directe via `?q=search-term` dans l'URL
- **Raccourcis clavier** : `Ctrl/Cmd + K` pour cibler la recherche, `Escape` pour effacer

### 🎛️ Filtrage intelligent

- **Filtre par collection** : filtre par collections de contenu spécifiques (articles, docs, pages, etc.)
- **Filtre par plage de dates** : filtre par récence (aujourd'hui, semaine, mois, année)
- **Filtres combinés** : plusieurs filtres fonctionnent ensemble pour des résultats précis

### 📋 Tableau interactif

- **Tri multi-colonnes** : cliquez sur les en-têtes pour trier par n'importe quelle colonne
- **Design responsive** : s'adapte à différentes tailles d'écran
- **Indicateurs visuels** : sens de tri clair et mise en évidence de la colonne active
- **Boutons d'action** : liens directs pour consulter les pages et copier les URL

### 📱 Optimisé pour mobile

- **Mise en page responsive** : affichage optimal sur toutes les tailles d'appareils
- **Adapté au tactile** : interaction facile sur les appareils mobiles
- **Divulgation progressive** : affiche d'abord les informations essentielles, les détails sur les grands écrans

## 🚀 Utilisation

### Accéder au plan de site

- **Barre de navigation** : cliquez sur l'icône de carte (🗺️) dans la navigation principale
- **URL directe** : visitez `/sitemap/` sur le site
- **Recherche avec paramètres** : utilisez `/sitemap/?q=search-term` pour une recherche directe

### Recherche et découverte

1. **Recherche de base** : saisissez des mots-clés dans la barre de recherche
2. **Filtrer par collection** : utilisez le menu déroulant pour cibler des types de contenu spécifiques
3. **Filtrage par date** : filtrez par récence du contenu
4. **Trier les résultats** : cliquez sur les en-têtes de colonne pour trier selon différents critères

### Fonctionnalités avancées

- **Copier les URL** : cliquez sur l'icône presse-papiers pour copier les URL des pages
- **Vue des statistiques** : activez les statistiques des collections pour un aperçu du contenu
- **Réinitialiser les filtres** : effacez tous les filtres et revenez à la vue complète

## 🎨 Design visuel

### Interface moderne

- **Style Bootstrap 5** : apparence épurée et professionnelle
- **Mise en page par cartes** : sections de contenu organisées
- **Intégration d'icônes** : Bootstrap Icons pour une navigation intuitive
- **Badges à code couleur** : distinction visuelle entre les types de contenu

### Accessibilité

- **Prise en charge des lecteurs d'écran** : étiquettes ARIA appropriées et HTML sémantique
- **Navigation au clavier** : accessibilité complète au clavier
- **Contraste élevé** : distinction visuelle claire entre les éléments
- **Texte responsive** : lisible sur toutes les tailles d'écran

## 🔧 Implémentation technique

### Architecture

- **Intégration Jekyll** : intégration transparente avec les collections et pages Jekyll
- **Bootstrap 5** : framework responsive moderne
- **JavaScript vanilla** : aucune dépendance externe pour les fonctionnalités de base
- **Propriétés personnalisées CSS** : thématisation cohérente et personnalisation facile

### Performances

- **Filtrage côté client** : recherche et filtrage rapides sans requêtes serveur
- **Recherche avec anti-rebond** : performances de recherche optimisées
- **Manipulation efficace du DOM** : opérations minimales de reflow et de repaint
- **Chargement différé** : Optimisation du chargement initial de la page

### Sources de données

- **Collections Jekyll** : Inclut automatiquement tous les documents de collection
- **Pages du site** : Pages et articles Jekyll standards
- **Intégration des métadonnées** : Utilise le frontmatter pour enrichir les informations
- **Mises à jour dynamiques** : Reflète automatiquement les changements du site

## 📈 Avantages

### Pour les utilisateurs

- **Découverte facile** : Trouvez du contenu rapidement et efficacement
- **Points d'accès multiples** : Différentes façons de localiser l'information
- **Vue d'ensemble visuelle** : Comprenez la structure du site en un coup d'œil
- **Accessibilité mobile** : Accédez depuis n'importe quel appareil

### Pour les responsables du site

- **Audit de contenu** : Vue d'ensemble facile de tout le contenu du site
- **Analyse de la navigation** : Comprenez la répartition du contenu
- **Avantages SEO** : Meilleure visibilité du contenu
- **Expérience utilisateur** : Convivialité du site améliorée

## 🔄 Améliorations futures

### Fonctionnalités prévues

- **Fonction d'exportation** : Exportez les données du plan du site dans divers formats
- **Analyses avancées** : Métriques d'utilisation et de popularité du contenu
- **Système de favoris** : Enregistrez les pages consultées fréquemment
- **Nuage de tags** : Représentation visuelle des tags populaires

### Possibilités d'intégration

- **API de recherche** : Connectez-vous à des services de recherche externes
- **Gestion de contenu** : Liens d'édition directe pour les administrateurs
- **Partage social** : Partagez des résultats de recherche spécifiques
- **Outils d'accessibilité** : Prise en charge améliorée des lecteurs d'écran

## 🛠️ Personnalisation

### Options de configuration

Le plan du site peut être personnalisé via la configuration Jekyll et les variables CSS :

```yaml
# _config.yml
sitemap:
  enabled: true
  show_statistics: true
  default_sort: "date"
  items_per_page: 50
```

### Personnalisation du style

Surchargez les propriétés personnalisées CSS pour correspondre à votre thème :

```css
:root {
  --sitemap-col-collection: 120px;
  --sitemap-col-title: 200px;
  --sitemap-col-date: 120px;
  --sitemap-col-actions: 80px;
}
```

## 📚 Documentation associée

- Système de navigation
- Fonctionnalité de recherche
- Organisation du contenu
- Expérience mobile

---

Le plan du site amélioré représente une avancée significative dans la navigation du site et la découverte de contenu, offrant aux utilisateurs des outils puissants pour explorer et trouver l'information efficacement tout en maintenant d'excellentes performances et des standards d'accessibilité.
