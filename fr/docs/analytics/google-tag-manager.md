---
lastmod: 2026-04-18 19:30:03.000000000 Z
title: Google Tag Manager
description: Intégration de Google Tag Manager pour une gestion centralisée des balises
  et l'analyse marketing.
preview: "/images/previews/google-tag-manager.png"
layout: default
categories:
- docs
- analytics
tags:
- gtm
- analytics
- tracking
- marketing
difficulty: intermediate
estimated_reading_time: 15 minutes
prerequisites:
- Google Tag Manager account
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/analytics/google-tag-manager/"
translation_of: pages/_docs/analytics/google-tag-manager.md
translation_source_url: "/docs/analytics/google-tag-manager/"
machine_translated: true
translated_from_sha: bdf049472147
---

# Google Tag Manager

Intégrez Google Tag Manager (GTM) pour une gestion centralisée des balises sans modification de code.

## Aperçu

GTM vous permet de gérer :

- Le suivi analytique
- Les pixels marketing
- Le suivi des conversions
- Les tests A/B
- Le JavaScript personnalisé

## Démarrage rapide

### 1. Créer un conteneur GTM

1. Accédez à [Google Tag Manager](https://tagmanager.google.com/)
2. Créez un compte et un conteneur
3. Copiez votre identifiant de conteneur (GTM-XXXXXXX)

### 2. Configurer Jekyll

```yaml
# _config.yml
google_tag_manager:
  container_id: 'GTM-XXXXXXX'
```

### 3. Ajouter les inclusions GTM

Le thème inclut automatiquement GTM lorsqu'il est configuré.

## Implémentation

### Script d'en-tête

```html
<!-- _includes/analytics/google-tag-manager-head.html -->
{% raw %}{% if jekyll.environment == 'production' and site.google_tag_manager.container_id %}
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','{{ site.google_tag_manager.container_id }}');</script>
<!-- End Google Tag Manager -->
{% endif %}{% endraw %}
```

### Noscript du corps

```html
<!-- _includes/analytics/google-tag-manager-body.html -->
{% raw %}{% if jekyll.environment == 'production' and site.google_tag_manager.container_id %}
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id={{ site.google_tag_manager.container_id }}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
{% endif %}{% endraw %}
```

### Intégration à la mise en page

```html
<head>
  {% raw %}{% include analytics/google-tag-manager-head.html %}{% endraw %}
</head>
<body>
  {% raw %}{% include analytics/google-tag-manager-body.html %}{% endraw %}
  <!-- content -->
</body>
```

## Data Layer

### Utilisation de base

```javascript
// Push events to dataLayer
window.dataLayer = window.dataLayer || [];
dataLayer.push({
  'event': 'buttonClick',
  'buttonName': 'signup'
});
```

### Variables de page

```javascript
dataLayer.push({
  'pageType': 'article',
  'pageCategory': 'docs',
  'pageTitle': '{{ page.title }}'
});
```

### Données utilisateur

```javascript
dataLayer.push({
  'userLoggedIn': true,
  'userType': 'subscriber'
});
```

## Balises courantes

### Google Analytics 4

Dans GTM :

1. Ajoutez une nouvelle balise → Configuration GA4
2. Saisissez l'identifiant de mesure
3. Déclencheur : Toutes les pages

### Facebook Pixel

1. Ajoutez une nouvelle balise → HTML personnalisé
2. Collez le code du Facebook Pixel
3. Déclencheur : Toutes les pages

### LinkedIn Insight

1. Ajoutez une nouvelle balise → HTML personnalisé
2. Collez le code LinkedIn
3. Déclencheur : Toutes les pages

## Déclencheurs

### Types de déclencheurs courants

| Type | Cas d'usage |
|------|----------|
| Page vue | Suivre toutes les visites de pages |
| Clic | Clics sur boutons/liens |
| Envoi de formulaire | Formulaires de contact |
| Profondeur de défilement | Engagement avec le contenu |
| Minuteur | Temps passé sur la page |
| Événement personnalisé | Événements DataLayer |

### Déclencheur d'événement personnalisé

```javascript
// Trigger this from code
dataLayer.push({
  'event': 'formSubmit',
  'formId': 'contactForm'
});
```

Dans GTM : créez un déclencheur pour l'événement nommé "formSubmit"

## Variables

### Variables intégrées

Activez dans GTM :

- URL de la page
- Nom d'hôte de la page
- Chemin de la page
- Référent
- Élément cliqué
- URL du clic
- Texte du clic

### Variables de la couche de données

Accéder aux valeurs de dataLayer :

1. Variables → Nouveau → Variable de couche de données
2. Définir le nom de la variable (par exemple, `pageTitle`)

### Variables JavaScript

```javascript
// Custom JavaScript variable
function() {
  return document.title;
}
```

## Consentement aux cookies

### Mode de consentement

```javascript
// Set default consent state
dataLayer.push({
  'event': 'default_consent',
  'analytics_storage': 'denied',
  'ad_storage': 'denied'
});
```

### Mise à jour lors du consentement

```javascript
function updateConsent(analytics, ads) {
  gtag('consent', 'update', {
    'analytics_storage': analytics ? 'granted' : 'denied',
    'ad_storage': ads ? 'granted' : 'denied'
  });
}
```

### Balises du mode de consentement

Dans GTM, configurez les balises pour respecter le consentement :

- Paramètres de la balise → Paramètres de consentement
- Exiger le consentement pour le déclenchement

## Débogage

### Mode aperçu

1. Cliquez sur « Aperçu » dans GTM
2. Saisissez l'URL de votre site
3. Le panneau de débogage affiche le déclenchement des balises

### Panneau de débogage

Affiche :

- Balises déclenchées
- Valeurs des variables
- Événements du dataLayer
- Erreurs

### Journalisation dans la console

```javascript
// Log all dataLayer pushes
(function() {
  var push = dataLayer.push;
  dataLayer.push = function() {
    console.log('dataLayer push:', arguments[0]);
    return push.apply(this, arguments);
  };
})();
```

## Bonnes pratiques

### Organisation

- Utilisez des conventions de nommage cohérentes
- Créez des dossiers pour les balises associées
- Documentez les balises personnalisées
- Utilisez des espaces de travail pour les modifications

### Performance

- Réduisez au minimum les balises HTML personnalisées
- Utilisez les balises intégrées lorsqu'elles sont disponibles
- Définissez des déclencheurs appropriés
- Évitez « Toutes les pages » pour les balises lourdes

### Sécurité

- Examinez toutes les balises tierces
- Limitez l'accès au conteneur
- Activez l'authentification à deux facteurs
- Auditez régulièrement le conteneur

## Dépannage

### Les balises ne se déclenchent pas

1. Vérifiez les conditions de déclenchement
2. Vérifiez en mode aperçu
3. Vérifiez les exigences de consentement
4. Examinez les déclencheurs de blocage

### Le conteneur ne se charge pas

1. Vérifiez l'ID du conteneur
2. Vérifiez l'environnement (production)
3. Recherchez les erreurs JS
4. Vérifiez l'emplacement de l'inclusion

### Problèmes de dataLayer

1. Vérifiez que dataLayer existe avant le push
2. Vérifiez que les noms d'événements correspondent
3. Vérifiez la portée de la variable
4. Utilisez la journalisation dans la console

## Ressources associées

- [Google Analytics](/docs/analytics/google-analytics/)
- [PostHog Analytics](/docs/features/posthog-analytics/)
- [Consentement aux cookies](/docs/features/cookie-consent/)

## Voir aussi

- [[Analytics]]
- [[Google Analytics]]
- [[PostHog Analytics]]
