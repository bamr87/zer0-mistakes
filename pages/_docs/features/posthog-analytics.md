---
title: PostHog Analytics
description: Implement privacy-first web analytics in Jekyll using PostHog with GDPR/CCPA compliance, custom event tracking, and Do Not Track support.
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
estimated_time: 20 minutes
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

## Prerequisites

1. **PostHog account** — Sign up at [posthog.com](https://posthog.com/)
2. **Project API key** — Found in Project Settings
3. **Jekyll site** in production environment

## Configuration

### Step 1: Configure `_config.yml`

Add the PostHog configuration block:

```yaml
# PostHog Analytics Configuration
posthog:
  enabled: true
  api_key: 'phc_YOUR_API_KEY_HERE'
  api_host: 'https://us.i.posthog.com'  # or eu.i.posthog.com for EU
  
  # Automatic tracking
  autocapture: true
  capture_pageview: true
  capture_pageleave: true
  
  # Privacy settings
  session_recording: false
  respect_dnt: true
  
  # Custom event tracking
  custom_events:
    track_downloads: true
    track_external_links: true
    track_search: true
    track_scroll_depth: true
```

### Step 2: Disable in Development

In `_config_dev.yml`, disable analytics for local development:

```yaml
posthog:
  enabled: false
```

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

1. **Cookie consent integration** — Only load PostHog after user consent
2. **Disable cookies** — Set `disable_cookie: true` for cookieless tracking
3. **IP anonymization** — Enable `ip_anonymization: true`
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
