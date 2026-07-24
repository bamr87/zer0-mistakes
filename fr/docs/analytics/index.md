---
lastmod: 2026-04-18 19:30:03.000000000 Z
title: Analytics
description: Options d'intégration d'analytics pour le thème Zer0-Mistakes, incluant
  PostHog, Google Analytics et Tag Manager.
preview: "/images/previews/analytics.png"
layout: default
categories:
- docs
- analytics
tags:
- analytics
- tracking
- privacy
difficulty: beginner
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/analytics/"
translation_of: pages/_docs/analytics/index.md
translation_source_url: "/docs/analytics/"
machine_translated: true
translated_from_sha: 3e75b181bb84
---

# Analytics

Le thème Zer0-Mistakes prend en charge plusieurs plateformes d'analytics avec des configurations privilégiant la confidentialité.

## Intégrations disponibles

| Plateforme | Priorité confidentialité | Offre gratuite |
|----------|--------------|-----------|
| [PostHog](/docs/features/posthog-analytics/) | Oui (auto-hébergeable) | 1M d'événements/mois |
| [Google Analytics](/docs/analytics/google-analytics/) | Limitée | 10M de hits/mois |
| [Google Tag Manager](/docs/analytics/google-tag-manager/) | Variable | Illimité |

## Comparaison rapide

### PostHog (recommandé)

- **Confidentialité** : conforme RGPD, auto-hébergeable
- **Fonctionnalités** : analytics, enregistrement de sessions, feature flags
- **Idéal pour** : les sites soucieux de la confidentialité

### Google Analytics

- **Confidentialité** : données envoyées à Google
- **Fonctionnalités** : analytics complètes
- **Idéal pour** : les analyses marketing

### Google Tag Manager

- **Confidentialité** : dépend des balises utilisées
- **Fonctionnalités** : gestion centralisée des balises
- **Idéal pour** : les équipes marketing

## Aperçu de la configuration

### PostHog

```yaml
# _config.yml
posthog:
  enabled: true
  api_key: 'phc_YOUR_KEY'
  api_host: 'https://us.i.posthog.com'
```

### Google Analytics

```yaml
# _config.yml
google_analytics:
  tracking_id: 'G-XXXXXXXXXX'
```

### Google Tag Manager

```yaml
# _config.yml
google_tag_manager:
  container_id: 'GTM-XXXXXXX'
```

## Chargement selon l'environnement

Toutes les analytics ne se chargent qu'en production :

```liquid
{% raw %}{% if jekyll.environment == 'production' %}
  {% include analytics/posthog.html %}
{% endif %}{% endraw %}
```

## Conformité en matière de confidentialité

Consultez [Cookie Consent](/docs/features/cookie-consent/) pour une gestion du consentement conforme au RGPD/CCPA.

## Ressources associées

- [PostHog Analytics](/docs/features/posthog-analytics/)
- [Google Analytics](/docs/analytics/google-analytics/)
- [Google Tag Manager](/docs/analytics/google-tag-manager/)
- [Cookie Consent](/docs/features/cookie-consent/)
- [Politique de confidentialité](/privacy-policy/)

## Voir aussi

- [[Features]]
- [[Customization]]
- [[SEO]]
- [[Deployment]]
