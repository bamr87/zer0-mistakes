---
lastmod: 2026-04-18 19:30:02.000000000 Z
title: Google Analytics
description: Intégration de Google Analytics 4 pour l'analyse du trafic du site web
  avec une configuration respectueuse de la confidentialité.
preview: "/images/previews/google-analytics.png"
layout: default
categories:
- docs
- analytics
tags:
- analytics
- google
- tracking
- ga4
difficulty: beginner
estimated_reading_time: 10 minutes
prerequisites:
- Google Analytics account
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/analytics/google-analytics/"
translation_of: pages/_docs/analytics/google-analytics.md
translation_source_url: "/docs/analytics/google-analytics/"
machine_translated: true
translated_from_sha: 2ae7ac85b18d
---

# Google Analytics

Intégrez Google Analytics 4 (GA4) pour une analyse complète du trafic de votre site web.

## Démarrage rapide

### 1. Obtenir l'ID de mesure

1. Rendez-vous sur [Google Analytics](https://analytics.google.com/)
2. Créez ou sélectionnez une propriété
3. Allez dans Admin → Flux de données → Web
4. Copiez votre ID de mesure (G-XXXXXXXXXX)

### 2. Configurer Jekyll

```yaml
# _config.yml
google_analytics:
  tracking_id: 'G-XXXXXXXXXX'
```

### 3. Vérifier la configuration

Visitez votre site en production et consultez les rapports en temps réel dans GA4.

## Implémentation

### Inclure le template

```html
<!-- _includes/analytics/google-analytics.html -->
{% raw %}{% if jekyll.environment == 'production' and site.google_analytics.tracking_id %}
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id={{ site.google_analytics.tracking_id }}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '{{ site.google_analytics.tracking_id }}');
</script>
{% endif %}{% endraw %}
```

### Chargement dans la mise en page

```html
<!-- In _includes/core/head.html -->
{% raw %}{% include analytics/google-analytics.html %}{% endraw %}
```

## Options de configuration

### Configuration de base

```yaml
google_analytics:
  tracking_id: 'G-XXXXXXXXXX'
```

### Configuration avancée

```yaml
google_analytics:
  tracking_id: 'G-XXXXXXXXXX'
  anonymize_ip: true
  cookie_expires: 63072000  # 2 years in seconds
  require_consent: true
```

### Avec anonymisation de l'IP

```javascript
gtag('config', 'G-XXXXXXXXXX', {
  'anonymize_ip': true
});
```

## Désactiver en développement

Analytics ne se charge qu'en environnement de production :

```yaml
# _config_dev.yml
google_analytics:
  tracking_id: null
```

Ou utilisez une vérification d'environnement :

```liquid
{% raw %}{% if jekyll.environment == 'production' %}
  <!-- GA code -->
{% endif %}{% endraw %}
```

## Intégration du consentement aux cookies

### Avec vérification du consentement

```javascript
{% raw %}{% if site.google_analytics.require_consent %}
// Only load if consent given
if (CookieConsent.hasConsent('analytics')) {
  gtag('config', '{{ site.google_analytics.tracking_id }}');
}
{% else %}
gtag('config', '{{ site.google_analytics.tracking_id }}');
{% endif %}{% endraw %}
```

### Mode consentement v2

```javascript
// Default to denied
gtag('consent', 'default', {
  'analytics_storage': 'denied'
});

// Update on consent
function grantConsent() {
  gtag('consent', 'update', {
    'analytics_storage': 'granted'
  });
}
```

## Événements personnalisés

### Suivre les événements

```javascript
// Button click
gtag('event', 'click', {
  'event_category': 'engagement',
  'event_label': 'signup_button'
});

// Form submission
gtag('event', 'form_submission', {
  'event_category': 'conversion',
  'event_label': 'contact_form'
});

// File download
gtag('event', 'file_download', {
  'file_name': 'brochure.pdf'
});
```

### Mesure améliorée

Activez dans le tableau de bord GA4 :

- Pages vues
- Défilements
- Clics sortants
- Recherche sur le site
- Engagement vidéo
- Téléchargements de fichiers

## Considérations relatives à la confidentialité

### Conformité au RGPD

1. Activez l'anonymisation de l'IP
2. Mettez en place le consentement aux cookies
3. Proposez une option de désabonnement
4. Mettez à jour votre politique de confidentialité

### Conservation des données

Configurez dans GA4 :

- Admin → Paramètres des données → Conservation des données
- Réglez sur le minimum requis (2 mois par défaut)

### Désabonnement

```javascript
// Add opt-out function
function gaOptout() {
  document.cookie = 'ga-disable-G-XXXXXXXXXX=true; expires=Thu, 31 Dec 2099 23:59:59 UTC; path=/';
  window['ga-disable-G-XXXXXXXXXX'] = true;
}
```

```html
<a href="#" onclick="gaOptout(); return false;">Opt out of Google Analytics</a>
```

## Débogage

### Mode débogage

```javascript
gtag('config', 'G-XXXXXXXXXX', { 'debug_mode': true });
```

### GA4 DebugView

1. Installez l'extension [GA Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)
2. Activez le mode débogage
3. Consultez les événements dans GA4 DebugView

### Problèmes courants

| Problème | Solution |
|-------|----------|
| Aucun suivi | Vérifiez que l'environnement est en production |
| Double comptage | Supprimez les scripts en double |
| Événements manquants | Vérifiez les noms et paramètres des événements |

## Migration depuis UA

### Différences clés

| Universal Analytics | GA4 |
|---------------------|-----|
| Basé sur les sessions | Basé sur les événements |
| Vues (pages vues) | Événements (page_view) |
| Objectifs | Conversions |
| UA-XXXXXXX-X | G-XXXXXXXXXX |

### Double suivi

Pendant la migration, effectuez le suivi vers les deux :

```javascript
// GA4
gtag('config', 'G-XXXXXXXXXX');

// UA (deprecated July 2024)
gtag('config', 'UA-XXXXXXX-X');
```

## Ressources associées

- [Analytics PostHog](/docs/features/posthog-analytics/)
- [Google Tag Manager](/docs/analytics/google-tag-manager/)
- [Consentement aux cookies](/docs/features/cookie-consent/)
- [Politique de confidentialité](/privacy-policy/)

## Voir aussi

- [[Analytics]]
- [[PostHog Analytics]]
- [[Google Tag Manager]]
- [[Cookie Consent Management]]
