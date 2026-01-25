---
title: Google Tag Manager
description: Google Tag Manager integration for centralized tag management and marketing analytics.
layout: default
categories:
    - docs
    - analytics
tags:
    - gtm
    - analytics
    - tracking
    - marketing
permalink: /docs/analytics/google-tag-manager/
difficulty: intermediate
estimated_time: 15 minutes
prerequisites:
    - Google Tag Manager account
sidebar:
    nav: docs
---

# Google Tag Manager

Integrate Google Tag Manager (GTM) for centralized tag management without code changes.

## Overview

GTM allows you to manage:

- Analytics tracking
- Marketing pixels
- Conversion tracking
- A/B testing
- Custom JavaScript

## Quick Start

### 1. Create GTM Container

1. Go to [Google Tag Manager](https://tagmanager.google.com/)
2. Create an account and container
3. Copy your Container ID (GTM-XXXXXXX)

### 2. Configure Jekyll

```yaml
# _config.yml
google_tag_manager:
  container_id: 'GTM-XXXXXXX'
```

### 3. Add GTM Includes

The theme automatically includes GTM when configured.

## Implementation

### Head Script

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

### Body Noscript

```html
<!-- _includes/analytics/google-tag-manager-body.html -->
{% raw %}{% if jekyll.environment == 'production' and site.google_tag_manager.container_id %}
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id={{ site.google_tag_manager.container_id }}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
{% endif %}{% endraw %}
```

### Layout Integration

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

### Basic Usage

```javascript
// Push events to dataLayer
window.dataLayer = window.dataLayer || [];
dataLayer.push({
  'event': 'buttonClick',
  'buttonName': 'signup'
});
```

### Page Variables

```javascript
dataLayer.push({
  'pageType': 'article',
  'pageCategory': 'docs',
  'pageTitle': '{{ page.title }}'
});
```

### User Data

```javascript
dataLayer.push({
  'userLoggedIn': true,
  'userType': 'subscriber'
});
```

## Common Tags

### Google Analytics 4

In GTM:
1. Add new tag → GA4 Configuration
2. Enter Measurement ID
3. Trigger: All Pages

### Facebook Pixel

1. Add new tag → Custom HTML
2. Paste Facebook Pixel code
3. Trigger: All Pages

### LinkedIn Insight

1. Add new tag → Custom HTML
2. Paste LinkedIn code
3. Trigger: All Pages

## Triggers

### Common Trigger Types

| Type | Use Case |
|------|----------|
| Page View | Track all page visits |
| Click | Button/link clicks |
| Form Submission | Contact forms |
| Scroll Depth | Content engagement |
| Timer | Time on page |
| Custom Event | DataLayer events |

### Custom Event Trigger

```javascript
// Trigger this from code
dataLayer.push({
  'event': 'formSubmit',
  'formId': 'contactForm'
});
```

In GTM: Create trigger for event name "formSubmit"

## Variables

### Built-in Variables

Enable in GTM:
- Page URL
- Page Hostname
- Page Path
- Referrer
- Click Element
- Click URL
- Click Text

### Data Layer Variables

Access dataLayer values:
1. Variables → New → Data Layer Variable
2. Set variable name (e.g., `pageTitle`)

### JavaScript Variables

```javascript
// Custom JavaScript variable
function() {
  return document.title;
}
```

## Cookie Consent

### Consent Mode

```javascript
// Set default consent state
dataLayer.push({
  'event': 'default_consent',
  'analytics_storage': 'denied',
  'ad_storage': 'denied'
});
```

### Update on Consent

```javascript
function updateConsent(analytics, ads) {
  gtag('consent', 'update', {
    'analytics_storage': analytics ? 'granted' : 'denied',
    'ad_storage': ads ? 'granted' : 'denied'
  });
}
```

### Consent Mode Tags

In GTM, configure tags to respect consent:
- Tag Settings → Consent Settings
- Require consent for firing

## Debugging

### Preview Mode

1. Click "Preview" in GTM
2. Enter your site URL
3. Debug panel shows tag firing

### Debug Panel

Shows:
- Tags fired
- Variables values
- DataLayer events
- Errors

### Console Logging

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

## Best Practices

### Organization

- Use consistent naming conventions
- Create folders for related tags
- Document custom tags
- Use workspaces for changes

### Performance

- Minimize custom HTML tags
- Use built-in tags when available
- Set appropriate triggers
- Avoid "All Pages" for heavy tags

### Security

- Review all third-party tags
- Limit container access
- Enable two-factor authentication
- Audit container regularly

## Troubleshooting

### Tags Not Firing

1. Check trigger conditions
2. Verify in Preview mode
3. Check consent requirements
4. Review blocking triggers

### Container Not Loading

1. Verify container ID
2. Check environment (production)
3. Look for JS errors
4. Verify include placement

### DataLayer Issues

1. Check dataLayer exists before push
2. Verify event names match
3. Check variable scope
4. Use console logging

## Related

- [Google Analytics](/docs/analytics/google-analytics/)
- [PostHog Analytics](/docs/features/posthog-analytics/)
- [Cookie Consent](/docs/features/cookie-consent/)
