---
title: Jekyll Analytics with PostHog
description: "Implement privacy-first web analytics in Jekyll using PostHog with GDPR/CCPA compliance, custom event tracking, and Do Not Track support."
date: 2026-01-24T00:00:00.000Z
lastmod: 2026-01-24T00:00:00.000Z
tags:
  - posthog
  - jekyll
  - analytics
  - privacy
  - gdpr
categories:
  - Jekyll
  - Analytics
layout: default
permalink: /docs/jekyll/analytics-posthog/
difficulty_level: intermediate
estimated_time: "20 minutes"
prerequisites:
  - PostHog account (free tier available)
  - Jekyll site deployed to production
  - Basic understanding of JavaScript
keywords:
  primary: ["posthog analytics", "jekyll analytics", "privacy-first analytics"]
  secondary: ["gdpr compliant", "web analytics", "event tracking", "static site analytics"]
---

# Jekyll Analytics with PostHog

> Implement privacy-first, GDPR-compliant analytics in your Jekyll site using PostHog with custom event tracking and Do Not Track support.

## Overview

[PostHog](https://posthog.com/) is an open-source product analytics platform that respects user privacy. Unlike traditional analytics (Google Analytics), PostHog offers:

- **Self-hostable** — full data ownership option
- **Privacy-first** — GDPR/CCPA compliant by design
- **Do Not Track support** — respects browser DNT settings
- **Custom events** — track any user interaction
- **Session recordings** — optional, with input masking
- **Feature flags** — A/B testing built-in
- **Free tier** — 1 million events/month free

## Prerequisites

1. **PostHog account** — Sign up at [posthog.com](https://posthog.com/)
2. **Project API key** — Found in Project Settings
3. **Jekyll site** in production environment

## Configuration

### Step 1: Configure `_config.yml`

Add the PostHog configuration block:

```yaml
# PostHog Analytics Configuration
# Documentation: https://posthog.com/docs/libraries/js
posthog:
  enabled: true
  api_key: 'phc_YOUR_API_KEY_HERE'
  api_host: 'https://us.i.posthog.com'  # or eu.i.posthog.com for EU
  
  # Profile settings
  person_profiles: 'identified_only'  # 'always', 'identified_only', 'never'
  
  # Automatic tracking
  autocapture: true        # Auto-capture clicks, form submissions
  capture_pageview: true   # Track page views
  capture_pageleave: true  # Track when users leave pages
  
  # Privacy settings
  session_recording: false # Enable session recordings (privacy consideration)
  disable_cookie: false    # Set true for cookieless tracking
  respect_dnt: true        # Respect Do Not Track browser setting
  cross_subdomain_cookie: false
  secure_cookie: true
  persistence: 'localStorage+cookie'  # 'localStorage+cookie', 'cookie', 'memory'
  
  # Custom event tracking
  custom_events:
    track_downloads: true      # Track PDF, ZIP, etc. downloads
    track_external_links: true # Track clicks to external websites
    track_search: true         # Track search queries
    track_scroll_depth: true   # Track how far users scroll
  
  # Session recording privacy (if enabled)
  privacy:
    mask_all_text: false    # Mask all text in recordings
    mask_all_inputs: true   # Mask form inputs in recordings
    ip_anonymization: false # Anonymize IP addresses
```

### Step 2: Disable in Development

In `_config_dev.yml`, disable analytics for local development:

```yaml
# Disable analytics in development
posthog:
  enabled: false
```

### Step 3: Create the Include File

Create `_includes/analytics/posthog.html`:

```html
{% raw %}{% if site.posthog.enabled and jekyll.environment == "production" %}
<script>
  // PostHog Configuration
  window.posthogConfig = {
    apiKey: '{{ site.posthog.api_key }}',
    apiHost: '{{ site.posthog.api_host }}',
    autocapture: {{ site.posthog.autocapture | default: true }},
    capturePageview: {{ site.posthog.capture_pageview | default: true }},
    respectDnt: {{ site.posthog.respect_dnt | default: true }}
  };

  // Check for Do Not Track before loading
  if (window.posthogConfig.respectDnt && navigator.doNotTrack === '1') {
    console.log('PostHog: Respecting Do Not Track setting');
  } else {
    // PostHog Loading Script
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister getFeatureFlag isFeatureEnabled".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    
    posthog.init(window.posthogConfig.apiKey, {
      api_host: window.posthogConfig.apiHost,
      autocapture: window.posthogConfig.autocapture,
      capture_pageview: window.posthogConfig.capturePageview
    });
  }
</script>
{% else %}
<script>
  // No-op analytics for development
  window.posthog = { capture: function(){}, identify: function(){} };
</script>
{% endif %}{% endraw %}
```

### Step 4: Add to Layout

Include in `_includes/core/head.html`:

```liquid
{% raw %}{% include analytics/posthog.html %}{% endraw %}
```

## Custom Event Tracking

### File Downloads

Track when users download PDFs, ZIPs, and other files:

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

### External Links

Track clicks to external websites:

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

### Scroll Depth

Track how far users scroll:

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

### Jekyll-Specific Properties

Register Jekyll page properties for all events:

```javascript
posthog.register({
  'site_title': '{{ site.title }}',
  'page_layout': '{{ page.layout }}',
  'page_categories': {{ page.categories | jsonify }},
  'page_tags': {{ page.tags | jsonify }},
  'page_author': '{{ page.author | default: site.author.name }}'
});
```

## Privacy Compliance

### GDPR/CCPA Compliance

1. **Cookie consent integration** — Only load PostHog after user consent
2. **Disable cookies** — Set `disable_cookie: true` for cookieless tracking
3. **IP anonymization** — Enable `ip_anonymization: true`
4. **Session recordings** — Keep `session_recording: false` unless needed
5. **Data retention** — Configure in PostHog dashboard

### Cookie Consent Integration

```javascript
// Example: Load PostHog only after consent
document.addEventListener('cookieConsentGranted', function() {
  posthog.opt_in_capturing();
});

// Opt out when consent withdrawn
document.addEventListener('cookieConsentWithdrawn', function() {
  posthog.opt_out_capturing();
});
```

### Do Not Track Support

The implementation respects browser DNT settings:

```javascript
if (navigator.doNotTrack === '1') {
  console.log('PostHog: Respecting Do Not Track setting');
  // PostHog not loaded
}
```

## Theme Integration

The Zer0-Mistakes theme exposes a global `zer0Analytics` object:

```javascript
// Track custom events
window.zer0Analytics.track('custom_event', { property: 'value' });

// Identify users (for logged-in features)
window.zer0Analytics.identify('user123', { name: 'User Name' });

// Reset tracking (e.g., on logout)
window.zer0Analytics.reset();
```

This works even when PostHog is disabled (logs to console in development).

## Troubleshooting

### Analytics Not Loading

1. **Check environment** — Must be `production`, not `development`
2. **Verify API key** — Ensure key is correct in `_config.yml`
3. **Check browser console** — Look for PostHog errors
4. **Test DNT setting** — Try with DNT disabled

### Events Not Appearing

1. **Wait a few minutes** — Events can be delayed
2. **Check PostHog dashboard** — Events → Live Events
3. **Verify autocapture** — Ensure `autocapture: true`
4. **Check custom event code** — Console log to debug

### High Event Volume

If exceeding free tier limits:

1. Disable `autocapture` (captures many events)
2. Reduce `track_scroll_depth` granularity
3. Limit `session_recording` to specific pages
4. Use sampling in PostHog dashboard

## Comparison with Google Analytics

| Feature | PostHog | Google Analytics |
|---------|---------|------------------|
| Privacy-first | ✅ Yes | ⚠️ Limited |
| Self-hostable | ✅ Yes | ❌ No |
| DNT support | ✅ Yes | ❌ No |
| Session recordings | ✅ Built-in | ❌ No |
| Free tier | 1M events/mo | 10M hits/mo |
| Data ownership | ✅ Full | ❌ Google-owned |

## Further Reading

- [PostHog Documentation](https://posthog.com/docs)
- [PostHog JavaScript Library](https://posthog.com/docs/libraries/js)
- [Privacy-Friendly Analytics](https://posthog.com/blog/privacy-friendly-analytics)
- [GDPR Compliance Guide](https://posthog.com/docs/privacy/gdpr-compliance)

---

*This guide is part of the [Zer0-Mistakes Jekyll Theme](https://github.com/bamr87/zer0-mistakes) documentation.*
