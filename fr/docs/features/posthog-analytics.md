---
lastmod: 2026-06-16 00:00:00.000000000 Z
title: PostHog Analytics
description: Mettez en place une analytique web axée sur la confidentialité dans Jekyll
  avec PostHog, avec conformité RGPD/CCPA, suivi d'événements personnalisés et prise
  en charge de Do Not Track.
preview: "/images/previews/posthog-analytics.png"
layout: default
categories:
- docs
- features
tags:
- posthog
- jekyll
- analytics
- privacy
- gdpr
difficulty: intermediate
estimated_reading_time: 20 minutes
prerequisites:
- PostHog account (free tier available)
- Jekyll site deployed to production
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/posthog-analytics/"
translation_of: pages/_docs/features/posthog-analytics.md
translation_source_url: "/docs/features/posthog-analytics/"
machine_translated: true
translated_from_sha: b61e1e545b0d
---

# Analytics PostHog

> Mettez en place des analytics respectueux de la vie privée et conformes au RGPD dans votre site Jekyll grâce à PostHog, avec suivi d'événements personnalisés et prise en charge de Do Not Track.

## Vue d'ensemble

[PostHog](https://posthog.com/) est une plateforme open source d'analytique produit qui respecte la vie privée des utilisateurs. Contrairement aux analytics traditionnels (Google Analytics), PostHog offre :

- **Auto-hébergeable** — option de propriété totale des données
- **Respect de la vie privée** — conforme RGPD/CCPA par conception
- **Prise en charge de Do Not Track** — respecte les réglages DNT du navigateur
- **Événements personnalisés** — suivez n'importe quelle interaction utilisateur
- **Enregistrements de session** — optionnels, avec masquage des saisies
- **Feature flags** — tests A/B intégrés
- **Offre gratuite** — 1 million d'événements/mois gratuits

Dans ce thème, l'intégration réside dans `_includes/analytics/posthog.html`, que `_layouts/root.html` inclut vers la fin de la page. Il lit le bloc `posthog:` depuis `_config.yml` et n'émet le loader que lorsque `site.posthog.enabled` est true **et** `jekyll.environment == "production"`.

## Prérequis

1. **Compte PostHog** — Inscrivez-vous sur [posthog.com](https://posthog.com/)
2. **Clé API de projet** — Disponible dans les paramètres du projet
3. **Site Jekyll** en environnement de production

## Configuration

### Étape 1 : Configurer `_config.yml`

Ajoutez le bloc de configuration PostHog :

Ces clés reprennent le bloc fourni avec le `_config.yml` de ce thème :

```yaml
# PostHog Analytics Configuration
posthog:
  enabled: true
  api_key: 'phc_YOUR_API_KEY_HERE'
  api_host: 'https://us.i.posthog.com'  # or https://eu.i.posthog.com for EU
  person_profiles: 'identified_only'    # 'always' | 'identified_only' | 'never'

  # Automatic tracking
  autocapture: true
  capture_pageview: true
  capture_pageleave: true

  # Privacy / cookie settings
  session_recording: false
  disable_cookie: false                 # true = cookieless tracking
  respect_dnt: true
  cross_subdomain_cookie: false
  secure_cookie: true
  persistence: 'localStorage+cookie'    # 'localStorage+cookie' | 'cookie' | 'memory'

  # Custom event tracking
  custom_events:
    track_downloads: true
    track_external_links: true
    track_search: true
    track_scroll_depth: true

  # Session-recording masking + IP options
  privacy:
    mask_all_text: false
    mask_all_inputs: true
    ip_anonymization: false
```

### Étape 2 : Désactiver en développement

Dans `_config_dev.yml`, désactivez les analytics pour le développement local :

```yaml
posthog:
  enabled: false
```

### Vérifier

Comme le loader est réservé à la production, un `jekyll serve` local (qui s'exécute dans l'environnement `development`) n'injecte jamais PostHog — c'est le comportement attendu. Pour confirmer que le contrôle fonctionne, construisez avec l'environnement de production et faites un grep sur la sortie :

```bash
# Dev build: no PostHog loader is emitted (development environment)
docker-compose exec -T jekyll bundle exec jekyll build \
  --config '_config.yml,_config_dev.yml'
grep -rl "posthog.init" _site/ || echo "No PostHog in dev build (expected)"

# Production build with PostHog enabled: the loader appears
JEKYLL_ENV=production docker-compose exec -T -e JEKYLL_ENV=production jekyll \
  bundle exec jekyll build
grep -rl "posthog.init" _site/ | head
```

Dans le navigateur, ouvrez les DevTools → Console sur une page de production ; en cas de succès, l'include journalise `PostHog analytics loaded successfully`, et l'acceptation du cookie d'analytics journalise `PostHog analytics enabled via consent`.

---

## Suivi d'événements personnalisés

### Téléchargements de fichiers

Suivez le moment où les utilisateurs téléchargent des PDF, des ZIP et d'autres fichiers :

```javascript
document.addEventListener('click', function(e) {
  var target = e.target.closest('a');
  if (target && target.href) {
    var href = target.href.toLowerCase();
    var downloadExts = ['.pdf', '.zip', '.doc', '.xlsx'];
    var isDownload = downloadExts.some(ext => href.includes(ext));
    
    if (isDownload) {
      posthog.capture('file_download', {
        'file_url': target.href,
        'file_name': target.href.split('/').pop()
      });
    }
  }
});
```

### Liens externes

Suivez les clics vers des sites externes :

```javascript
document.addEventListener('click', function(e) {
  var target = e.target.closest('a');
  if (target && target.href && target.hostname !== window.location.hostname) {
    posthog.capture('external_link_click', {
      'link_url': target.href,
      'link_text': target.innerText
    });
  }
});
```

### Profondeur de défilement

Suivez jusqu'où les utilisateurs font défiler la page :

```javascript
var scrollDepths = [25, 50, 75, 90];
var triggeredDepths = [];

window.addEventListener('scroll', function() {
  var scrollPercent = Math.round(
    (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
  );
  
  scrollDepths.forEach(function(depth) {
    if (scrollPercent >= depth && !triggeredDepths.includes(depth)) {
      triggeredDepths.push(depth);
      posthog.capture('scroll_depth', { 'depth_percentage': depth });
    }
  });
});
```

---

## Conformité vie privée

### Conformité RGPD/CCPA

1. **Intégration du consentement aux cookies** — Le loader PostHog s'exécute en production, puis
`_includes/components/cookie-consent.html` appelle `posthog.opt_in_capturing()` lorsqu'un visiteur accepte les cookies d'analytics et `posthog.opt_out_capturing()` dans le cas contraire. Le consentement conditionne donc la *capture* des événements, et non le chargement de la bibliothèque.
2. **Désactiver les cookies** — Définissez `disable_cookie: true` pour un suivi sans cookies
3. **Anonymisation de l'IP** — Définissez `privacy.ip_anonymization: true` (l'include
   transmet alors `ip: false` à `posthog.init`)
4. **Enregistrements de session** — Laissez `session_recording: false` sauf si nécessaire
5. **Conservation des données** — Configurez dans le tableau de bord PostHog

### Prise en charge de Do Not Track

L'implémentation respecte les réglages DNT du navigateur :

```javascript
if (navigator.doNotTrack === '1') {
  console.log('PostHog: Respecting Do Not Track setting');
  // PostHog not loaded
}
```

---

## Dépannage

### Les analytics ne se chargent pas

1. **Vérifiez l'environnement** — Doit être `production`, et non `development`
2. **Vérifiez la clé API** — Assurez-vous que la clé est correcte dans `_config.yml`
3. **Vérifiez la console du navigateur** — Recherchez les erreurs PostHog
4. **Testez le réglage DNT** — Essayez avec DNT désactivé

### Les événements n'apparaissent pas

1. **Patientez quelques minutes** — Les événements peuvent être retardés
2. **Vérifiez le tableau de bord PostHog** — Events → Live Events
3. **Vérifiez l'autocapture** — Assurez-vous que `autocapture: true`
4. **Vérifiez le code d'événement personnalisé** — Journalisez dans la console pour déboguer

### Volume d'événements élevé

Si vous dépassez les limites de l'offre gratuite :

1. Désactivez `autocapture` (capture de nombreux événements)
2. Réduisez la granularité de `track_scroll_depth`
3. Limitez `session_recording` à des pages spécifiques
4. Utilisez l'échantillonnage dans le tableau de bord PostHog

---

## Comparaison avec Google Analytics

| Fonctionnalité | PostHog | Google Analytics |
|---------|---------|------------------|
| Priorité à la confidentialité | Oui | Limité |
| Auto-hébergeable | Oui | Non |
| Prise en charge DNT | Oui | Non |
| Enregistrements de session | Intégré | Non |
| Offre gratuite | 1M d'événements/mois | 10M de hits/mois |
| Propriété des données | Complète | Détenues par Google |

---

## Pour aller plus loin

- [Documentation PostHog](https://posthog.com/docs)
- [Bibliothèque JavaScript PostHog](https://posthog.com/docs/libraries/js)
- [Analytique respectueuse de la confidentialité](https://posthog.com/blog/privacy-friendly-analytics)
- [Guide de conformité au RGPD](https://posthog.com/docs/privacy/gdpr-compliance)

---

*Ce guide fait partie de la documentation du [thème Jekyll Zer0-Mistakes](https://github.com/bamr87/zer0-mistakes).*

## Référence technique

Pour les détails d'implémentation (configuration RGPD/CCPA, architecture de suivi des événements, notes d'intégration) :

- [Intégration PostHog → docs/implementation/posthog-analytics-integration.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/implementation/posthog-analytics-integration.md)

## Voir aussi

- [[Features]]
- [[Google Analytics]]
- [[Cookie Consent Management]]
- [[Analytics]]
