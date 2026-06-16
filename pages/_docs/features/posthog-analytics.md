---
lastmod: 2026-06-16T00:00:00.000Z
title: PostHog Analytics
description: Implement privacy-first web analytics in Jekyll using PostHog with GDPR/CCPA compliance, custom event tracking, and Do Not Track support.
preview: /images/previews/posthog-analytics.png
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
permalink: /docs/features/posthog-analytics/
difficulty: intermediate
estimated_reading_time: 20 minutes
prerequisites:
    - PostHog account (free tier available)
    - Jekyll site deployed to production
sidebar:
    nav: docs
---

# PostHog Analytics

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

In this theme the integration lives in `_includes/analytics/posthog.html`, which
`_layouts/root.html` includes near the end of the page. It reads the `posthog:`
block from `_config.yml` and only emits the loader when both
`site.posthog.enabled` is true **and** `jekyll.environment == "production"`.

## Prerequisites

1. **PostHog account** — Sign up at [posthog.com](https://posthog.com/)
2. **Project API key** — Found in Project Settings
3. **Jekyll site** in production environment

## Configuration

### Step 1: Configure `_config.yml`

Add the PostHog configuration block:

These keys mirror the block shipped in this theme's `_config.yml`:

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

### Step 2: Disable in Development

In `_config_dev.yml`, disable analytics for local development:

```yaml
posthog:
  enabled: false
```

### Verify

Because the loader is production-only, a local `jekyll serve` (which runs in the
`development` environment) never injects PostHog — that is expected. To confirm
the gate works, build with the production environment and grep the output:

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

In the browser, open DevTools → Console on a production page; on success the
include logs `PostHog analytics loaded successfully`, and accepting the analytics
cookie logs `PostHog analytics enabled via consent`.

---

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

---

## Privacy Compliance

### GDPR/CCPA Compliance

1. **Cookie consent integration** — The PostHog loader runs in production, then
   `_includes/components/cookie-consent.html` calls `posthog.opt_in_capturing()`
   when a visitor accepts analytics cookies and `posthog.opt_out_capturing()`
   otherwise. Consent therefore gates event *capturing*, not whether the library
   loads.
2. **Disable cookies** — Set `disable_cookie: true` for cookieless tracking
3. **IP anonymization** — Set `privacy.ip_anonymization: true` (the include then
   passes `ip: false` to `posthog.init`)
4. **Session recordings** — Keep `session_recording: false` unless needed
5. **Data retention** — Configure in PostHog dashboard

### Do Not Track Support

The implementation respects browser DNT settings:

```javascript
if (navigator.doNotTrack === '1') {
  console.log('PostHog: Respecting Do Not Track setting');
  // PostHog not loaded
}
```

---

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

---

## Comparison with Google Analytics

| Feature | PostHog | Google Analytics |
|---------|---------|------------------|
| Privacy-first | Yes | Limited |
| Self-hostable | Yes | No |
| DNT support | Yes | No |
| Session recordings | Built-in | No |
| Free tier | 1M events/mo | 10M hits/mo |
| Data ownership | Full | Google-owned |

---

## Further Reading

- [PostHog Documentation](https://posthog.com/docs)
- [PostHog JavaScript Library](https://posthog.com/docs/libraries/js)
- [Privacy-Friendly Analytics](https://posthog.com/blog/privacy-friendly-analytics)
- [GDPR Compliance Guide](https://posthog.com/docs/privacy/gdpr-compliance)

---

*This guide is part of the [Zer0-Mistakes Jekyll Theme](https://github.com/bamr87/zer0-mistakes) documentation.*

## Technical Reference

For implementation details (GDPR/CCPA configuration, event tracking architecture, integration notes):

- [PostHog Integration → docs/implementation/posthog-analytics-integration.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/implementation/posthog-analytics-integration.md)

## See also

- [[Features]]
- [[Google Analytics]]
- [[Cookie Consent Management]]
- [[Analytics]]
