---
title: Google Analytics
description: Google Analytics 4 integration for website traffic analysis with privacy-conscious configuration.
layout: default
categories:
    - docs
    - analytics
tags:
    - analytics
    - google
    - tracking
    - ga4
permalink: /docs/analytics/google-analytics/
difficulty: beginner
estimated_time: 10 minutes
prerequisites:
    - Google Analytics account
sidebar:
    nav: docs
---

# Google Analytics

Integrate Google Analytics 4 (GA4) for comprehensive website traffic analysis.

## Quick Start

### 1. Get Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create or select a property
3. Go to Admin → Data Streams → Web
4. Copy your Measurement ID (G-XXXXXXXXXX)

### 2. Configure Jekyll

```yaml
# _config.yml
google_analytics:
  tracking_id: 'G-XXXXXXXXXX'
```

### 3. Verify Setup

Visit your site in production and check Real-Time reports in GA4.

## Implementation

### Include Template

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

### Loading in Layout

```html
<!-- In _includes/core/head.html -->
{% raw %}{% include analytics/google-analytics.html %}{% endraw %}
```

## Configuration Options

### Basic Configuration

```yaml
google_analytics:
  tracking_id: 'G-XXXXXXXXXX'
```

### Enhanced Configuration

```yaml
google_analytics:
  tracking_id: 'G-XXXXXXXXXX'
  anonymize_ip: true
  cookie_expires: 63072000  # 2 years in seconds
  require_consent: true
```

### With IP Anonymization

```javascript
gtag('config', 'G-XXXXXXXXXX', {
  'anonymize_ip': true
});
```

## Disable in Development

Analytics only load in production environment:

```yaml
# _config_dev.yml
google_analytics:
  tracking_id: null
```

Or use environment check:

```liquid
{% raw %}{% if jekyll.environment == 'production' %}
  <!-- GA code -->
{% endif %}{% endraw %}
```

## Cookie Consent Integration

### With Consent Check

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

### Consent Mode v2

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

## Custom Events

### Track Events

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

### Enhanced Measurement

Enable in GA4 dashboard:
- Page views
- Scrolls
- Outbound clicks
- Site search
- Video engagement
- File downloads

## Privacy Considerations

### GDPR Compliance

1. Enable IP anonymization
2. Implement cookie consent
3. Provide opt-out option
4. Update privacy policy

### Data Retention

Configure in GA4:
- Admin → Data Settings → Data Retention
- Set to minimum required (2 months default)

### Opt-Out

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

## Debugging

### Debug Mode

```javascript
gtag('config', 'G-XXXXXXXXXX', { 'debug_mode': true });
```

### GA4 DebugView

1. Install [GA Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) extension
2. Enable debug mode
3. View events in GA4 DebugView

### Common Issues

| Issue | Solution |
|-------|----------|
| Not tracking | Check environment is production |
| Double counting | Remove duplicate scripts |
| Missing events | Verify event names and parameters |

## Migration from UA

### Key Differences

| Universal Analytics | GA4 |
|---------------------|-----|
| Sessions-based | Events-based |
| Views (page views) | Events (page_view) |
| Goals | Conversions |
| UA-XXXXXXX-X | G-XXXXXXXXXX |

### Dual Tracking

During migration, track to both:

```javascript
// GA4
gtag('config', 'G-XXXXXXXXXX');

// UA (deprecated July 2024)
gtag('config', 'UA-XXXXXXX-X');
```

## Related

- [PostHog Analytics](/docs/features/posthog-analytics/)
- [Google Tag Manager](/docs/analytics/google-tag-manager/)
- [Cookie Consent](/docs/features/cookie-consent/)
- [Privacy Policy](/privacy-policy/)
