---
title: Analytics
description: Analytics integration options for the Zer0-Mistakes theme including PostHog, Google Analytics, and Tag Manager.
layout: default
categories:
    - docs
    - analytics
tags:
    - analytics
    - tracking
    - privacy
permalink: /docs/analytics/
difficulty: beginner
estimated_time: 5 minutes
sidebar:
    nav: docs
---

# Analytics

The Zer0-Mistakes theme supports multiple analytics platforms with privacy-first configurations.

## Available Integrations

| Platform | Privacy Focus | Free Tier |
|----------|--------------|-----------|
| [PostHog](/docs/features/posthog-analytics/) | Yes (self-hostable) | 1M events/mo |
| [Google Analytics](/docs/analytics/google-analytics/) | Limited | 10M hits/mo |
| [Google Tag Manager](/docs/analytics/google-tag-manager/) | Varies | Unlimited |

## Quick Comparison

### PostHog (Recommended)

- **Privacy**: GDPR compliant, self-hostable
- **Features**: Analytics, session recording, feature flags
- **Best for**: Privacy-conscious sites

### Google Analytics

- **Privacy**: Data sent to Google
- **Features**: Comprehensive analytics
- **Best for**: Marketing insights

### Google Tag Manager

- **Privacy**: Depends on tags used
- **Features**: Centralized tag management
- **Best for**: Marketing teams

## Configuration Overview

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

## Environment-Aware Loading

All analytics only load in production:

```liquid
{% raw %}{% if jekyll.environment == 'production' %}
  {% include analytics/posthog.html %}
{% endif %}{% endraw %}
```

## Privacy Compliance

See [Cookie Consent](/docs/features/cookie-consent/) for GDPR/CCPA compliant consent management.

## Related

- [PostHog Analytics](/docs/features/posthog-analytics/)
- [Google Analytics](/docs/analytics/google-analytics/)
- [Google Tag Manager](/docs/analytics/google-tag-manager/)
- [Cookie Consent](/docs/features/cookie-consent/)
- [Privacy Policy](/privacy-policy/)
