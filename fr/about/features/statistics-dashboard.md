---
lastmod: 2026-04-18 19:30:05.000000000 Z
title: Fonctionnalité Tableau de bord des statistiques
description: Système complet d'analyse de site et de métriques de contenu pour les
  thèmes Jekyll
preview: "/images/previews/statistics-dashboard-feature.png"
layout: default
date: 2025-10-10
lang: fr
permalink: "/fr/about/features/statistics-dashboard/"
translation_of: pages/_about/features/statistics-dashboard.md
translation_source_url: "/about/features/statistics-dashboard/"
machine_translated: true
translated_from_sha: c42451b6434b
---

# Fonctionnalité de tableau de bord statistique

Le thème Zer0-Mistakes inclut désormais un tableau de bord statistique complet qui fournit des analyses et des informations en temps réel sur le contenu de votre site Jekyll.

## Vue d'ensemble

Le tableau de bord statistique est un système d'analyse modulaire et responsive qui analyse automatiquement le contenu de votre site et présente des métriques pertinentes via une interface interactive basée sur Bootstrap 5.

### Fonctionnalités clés

- **📊 Analyse de contenu en temps réel** : Analyse automatique des articles, des pages et des collections
- **🎯 Catégorisation intelligente** : Calculs avisés des niveaux d'activité basés sur l'utilisation réelle
- **📱 Design responsive** : Approche mobile-first avec les composants Bootstrap 5
- **🔧 Architecture modulaire** : Six composants spécialisés pour un code maintenable
- **⚡ Optimisé pour les performances** : CSS personnalisé minimal, en tirant parti des utilitaires Bootstrap
- **♿ Conforme à l'accessibilité** : Prise en charge ARIA et compatibilité avec les lecteurs d'écran

## Ce qui est inclus

### Composants principaux

#### 1. Mise en page des statistiques (`_layouts/stats.html`)

- Conteneur principal du tableau de bord
- Gère la validation des données et les états d'erreur
- Inclut du JavaScript pour les animations et les interactions

#### 2. Composant d'en-tête (`_includes/stats/stats-header.html`)

- Affichage du titre de la page et des métadonnées
- Informations d'horodatage de la génération
- Fil d'Ariane de navigation

#### 3. Composant de vue d'ensemble (`_includes/stats/stats-overview.html`)

- Cartes de métriques de haut niveau
- Nombre total d'articles, de pages, de catégories et d'étiquettes
- Statistiques et moyennes du nombre de mots

#### 4. Composant de catégories (`_includes/stats/stats-categories.html`)

- Catégories principales avec le nombre d'articles
- Indicateurs dynamiques de niveau d'activité
- Pied de page des statistiques récapitulatives

#### 5. Composant d'étiquettes (`_includes/stats/stats-tags.html`)

- Analyse de la fréquence d'utilisation des étiquettes
- Visualisation interactive d'un nuage d'étiquettes
- Informations sur les modèles d'utilisation

#### 6. Composant de métriques (`_includes/stats/stats-metrics.html`)

- Faits marquants supplémentaires
- Informations sur la répartition du contenu
- Indicateurs de performance

#### 7. Composant d'absence de données (`_includes/stats/stats-no-data.html`)

- Gestion élégante des erreurs
- Aide à l'utilisateur lorsque les statistiques sont indisponibles
- Instructions de récupération

### Système de génération de données

#### Générateur de statistiques Ruby (`_data/generate_statistics.rb`)

Le cœur du système est un script Ruby complet qui :

- **Analyse le contenu** : Parcourt tous les articles, pages et collections Jekyll
- **Traite les métadonnées** : Extrait les catégories, les étiquettes et les données de frontmatter
- **Calcule les métriques** : Calcule le nombre de mots, les moyennes et les répartitions
- **Génère du YAML** : Crée un fichier de données structuré pour être exploité par Jekyll
- **Gère les erreurs** : Gestion élégante des données mal formées ou manquantes

```ruby
# Usage
ruby _data/generate_statistics.rb

# Output: _data/content_statistics.yml
```

#### Les statistiques générées incluent :

- **Métriques de vue d'ensemble** : Total des articles, pages, catégories, étiquettes et mots
- **Répartition du contenu** : Distribution par type de contenu
- **Analyse des catégories** : Fréquence d'utilisation et niveaux d'activité
- **Analyse des étiquettes** : Données du nuage d'étiquettes et modèles d'utilisation
- **Répartition mensuelle** : Chronologie de création du contenu
- **Statistiques de mots** : Nombre moyen de mots par article, nombre total de mots

### Système de style

#### CSS personnalisé (`assets/css/stats.css`)

Styles personnalisés minimaux, axés uniquement sur les fonctionnalités indisponibles dans Bootstrap 5 :

- **Animations d'icônes** : Effets fluides de rotation et de survol
- **Effets de scintillement** : Animations d'état de chargement
- **Dimensionnement du nuage de tags** : Tailles de police dynamiques selon l'utilisation
- **Indicateurs de progression** : Style amélioré des barres de progression
- **Optimisation pour l'impression** : Mises en page épurées pour l'impression

#### Intégration de Bootstrap 5

Exploite les utilitaires de Bootstrap 5 pour :

- **Système de grille** : Structure de mise en page responsive
- **Composants Card** : Conteneurs de métriques et hiérarchie visuelle
- **Système de badges** : Indicateurs de comptage et étiquettes
- **Typographie** : Style et dimensionnement de texte cohérents
- **Espacement** : Utilitaires de marge et de rembourrage
- **Système de couleurs** : Palette de couleurs cohérente avec le thème

## Instructions d'utilisation

### Configuration des statistiques

1. **Inclure la mise en page** : Créez une page avec `layout: stats`
2. **Générer les données** : Exécutez le script Ruby pour créer les statistiques
3. **Accéder au tableau de bord** : Rendez-vous sur `/about/stats/` ou votre permalien personnalisé

### Exemple de configuration de page

```yaml
---
title: "Site Statistics"
description: "Comprehensive analytics for site content"
preview: /images/previews/statistics-dashboard-feature.png
layout: stats
permalink: /stats/
---
Optional content here will appear below the statistics dashboard.
```

### Génération des statistiques

```bash
# Navigate to your Jekyll site directory
cd /path/to/your/site

# Run the statistics generator
ruby _data/generate_statistics.rb

# Start Jekyll to see updated statistics
bundle exec jekyll serve
```

### Développement avec Docker

```bash
# Access Docker container
docker-compose exec jekyll bash

# Generate statistics inside container
ruby _data/generate_statistics.rb

# Exit container (Jekyll auto-reloads)
exit
```

## Options de personnalisation

### Seuils de niveau d'activité

Le système calcule automatiquement les niveaux d'activité en fonction de la répartition de votre contenu :

- **Catégories** : Élevé (≥70 % du max), Moyen (≥40 % du max), Faible (le reste)
- **Tags** : Fréquent (≥60 % du max), Modéré (≥20 % du max), Occasionnel (le reste)

### Personnalisation du style

Remplacez les styles par défaut en ajoutant du CSS personnalisé :

```css
/* Custom activity indicators */
.stats-card .badge.high-activity {
  background-color: var(--bs-success) !important;
}

/* Custom tag cloud sizing */
.tag-cloud .fs-xl {
  font-size: 1.5rem !important;
}

/* Custom animation timing */
.stats-card {
  transition: transform 0.3s ease-in-out;
}
```

### Personnalisation des composants

Chaque composant peut être personnalisé indépendamment :

```liquid
<!-- Override in _includes/stats/stats-overview.html -->
{% if site.data.content_statistics.overview.total_posts > 100 %}
  <div class="alert alert-success">
    🎉 Congratulations! You have over 100 posts!
  </div>
{% endif %}
```

## Implémentation technique

### Structure des données

Le fichier YAML généré suit cette structure :

```yaml
generated_at: "2025-10-10 12:00:00"
overview:
  total_posts: 61
  total_pages: 15
  total_content: 76
  total_categories: 19
  total_tags: 47
  total_words: 43601
  average_words_per_post: 714.8
categories:
  - ["Documentation", 4]
  - ["How-To", 3]
  - ["Development", 3]
tags:
  - ["jekyll", 15]
  - ["docker", 4]
  - ["mermaid", 4]
content_breakdown:
  post: 61
  page: 15
monthly_distribution:
  2025-01: 15
  2025-02: 8
```

### Considérations de performance

- **Génération des données** : À exécuter périodiquement, pas à chaque chargement de page
- **Mise en cache** : Le fichier YAML fait office de cache pour les statistiques calculées
- **Chargement différé** : Les images et les éléments non critiques se chargent de manière asynchrone
- **JavaScript minimal** : Seules les interactions essentielles sont incluses

### Compatibilité des navigateurs

- **Navigateurs modernes** : Prise en charge complète des fonctionnalités
- **Prise en charge des anciens navigateurs** : Dégradation élégante sans JavaScript
- **Optimisé pour mobile** : Interface tactile conviviale
- **Prêt pour l'impression** : Mises en page épurées pour l'impression

## Exemples d'intégration

### Menu de navigation

```yaml
# _data/navigation.yml
- title: Statistics
  url: /stats/
  icon: bi-bar-chart-line
```

### Liens de pied de page

```html
<!-- _includes/footer.html -->
<a href="/stats/" class="text-muted">
  <i class="bi bi-graph-up"></i> Site Statistics
</a>
```

### Intégration de widget

```liquid
<!-- Show quick stats in sidebar -->
{% if site.data.content_statistics %}
  <div class="card mb-3">
    <div class="card-body text-center">
      <h6 class="card-title">Quick Stats</h6>
      <p class="mb-1">
        <strong>{{ site.data.content_statistics.overview.total_posts }}</strong> Posts
      </p>
      <p class="mb-0">
        <strong>{{ site.data.content_statistics.overview.total_categories }}</strong> Categories
      </p>
      <a href="/stats/" class="btn btn-sm btn-outline-primary mt-2">
        View All Statistics
      </a>
    </div>
  </div>
{% endif %}
```

## Bonnes pratiques

### Organisation du contenu

- **Catégorisation cohérente** : Utilisez des noms de catégories standardisés
- **Étiquetage stratégique** : Appliquez des tags pertinents pour de meilleures analyses
- **Mises à jour régulières** : Exécutez la génération de statistiques périodiquement
- **Qualité du contenu** : Maintenez de bons standards de rédaction pour un décompte de mots précis

### Maintenance

- **Génération automatisée** : Configurez des scripts pour exécuter la génération de statistiques
- **Validation des données** : Surveillez les valeurs aberrantes ou les problèmes de qualité des données
- **Surveillance des performances** : Suivez le temps de génération et la taille des fichiers
- **Retour des utilisateurs** : Recueillez des avis sur l'utilité du tableau de bord

### Avantages SEO

- **Analyses de contenu** : Identifiez les lacunes dans la couverture du contenu
- **Autorité thématique** : Comprenez les domaines de spécialisation abordés
- **Suivi de la croissance** : surveillez l'expansion du contenu au fil du temps
- **Engagement des utilisateurs** : décisions de stratégie de contenu fondées sur les données

## Dépannage

### Problèmes courants

1. **Statistiques vides** : assurez-vous que le contenu possède un frontmatter approprié
2. **Erreurs de génération** : vérifiez les autorisations et la syntaxe du script Ruby
3. **Problèmes d'affichage** : vérifiez que Bootstrap 5 est correctement chargé
4. **Performances** : envisagez de limiter le traitement des données pour les grands sites

### Mode débogage

Activez la sortie de débogage dans le script Ruby :

```ruby
# Add to generate_statistics.rb
DEBUG = true
puts "Processing: #{file}" if DEBUG
```

---

Le tableau de bord des statistiques représente une amélioration significative du thème Zer0-Mistakes, offrant des informations précieuses sur le contenu de votre site Jekyll tout en préservant l'accent mis par le thème sur la simplicité, les performances et l'expérience utilisateur.
