# PostHog Analytics Integration

## Overview

Zer0-Mistakes Jekyll theme now includes full PostHog analytics integration with privacy-first design, GDPR/CCPA compliance, and comprehensive event tracking tailored for Jekyll sites.

## Features

### 🔒 Privacy-First Design

- **Cookie consent banner** with granular permission controls
- **GDPR/CCPA compliance** with user consent management
- **Do Not Track (DNT) respect** - automatically disables tracking when DNT is enabled
- **Opt-out mechanisms** with persistent user preferences
- **IP anonymization** options for enhanced privacy

### 📊 Advanced Analytics

- **Custom Jekyll event tracking** for posts, pages, and collections
- **Download tracking** for PDFs, ZIPs, and other files
- **External link click tracking**
- **Search query monitoring**
- **Scroll depth analysis**
- **Table of contents interaction tracking**
- **Code block engagement metrics**

### ⚙️ Flexible Configuration

- **Environment-specific settings** (disabled in development)
- **Configurable tracking options** via `_config.yml`
- **Session recording controls** with privacy safeguards
- **Cross-domain tracking** support
- **Custom event registration**

## Configuration

### Basic Setup

Add the following to your `_config.yml`:

```yaml
posthog:
  enabled: true
  api_key: "your-posthog-api-key"
  api_host: "https://us.i.posthog.com" # or your self-hosted instance
  person_profiles: "identified_only"
  autocapture: true
  capture_pageview: true
  capture_pageleave: true
  respect_dnt: true
```

### Advanced Configuration

```yaml
posthog:
  enabled: true
  api_key: "phc_your_api_key_here"
  api_host: "https://us.i.posthog.com"
  person_profiles: "identified_only" # Options: 'always', 'identified_only', 'never'
  autocapture: true # Automatically capture clicks, form submissions, etc.
  capture_pageview: true # Track page views
  capture_pageleave: true # Track when users leave pages
  session_recording: false # Enable session recordings (privacy consideration)
  disable_cookie: false # Set to true for cookieless tracking
  respect_dnt: true # Respect Do Not Track browser setting
  cross_subdomain_cookie: false # Enable if you have multiple subdomains
  secure_cookie: true # Use secure cookies in production
  persistence: "localStorage+cookie" # Options: 'localStorage+cookie', 'cookie', 'memory'

  # Custom event tracking configuration
  custom_events:
    track_downloads: true # Track PDF, ZIP, etc. downloads
    track_external_links: true # Track clicks to external websites
    track_search: true # Track search queries
    track_scroll_depth: true # Track how far users scroll

  # Privacy settings
  privacy:
    mask_all_text: false # Mask all text in session recordings
    mask_all_inputs: true # Mask form inputs in session recordings
    ip_anonymization: false # Anonymize IP addresses
```

### Development Environment

In `_config_dev.yml`, analytics are automatically disabled:

```yaml
# Analytics disabled in development
posthog:
  enabled: false
  api_key: null
  api_host: null
```

## Cookie Consent Management

### Features

- **GDPR/CCPA compliant** consent banner
- **Granular permissions** (Essential, Analytics, Marketing)
- **Persistent preferences** stored in localStorage
- **Modal interface** for detailed consent management
- **365-day consent expiry** with automatic re-consent

### User Experience

1. New visitors see a consent banner at the bottom of the page
2. Users can "Accept All", "Reject All", or customize preferences
3. Granular controls available through "Manage Cookies" modal
4. Preferences are remembered for future visits
5. Analytics only activate after explicit consent

### Developer Integration

Access consent state in your custom code:

```javascript
// Check if user has consented to analytics
if (window.cookieManager.hasConsent("analytics")) {
  // Analytics are enabled
  window.zer0Analytics.track("custom_event", { property: "value" });
}

// Listen for consent changes
document.addEventListener("cookieConsentChanged", function (event) {
  console.log("Consent updated:", event.detail);
});
```

## Custom Event Tracking

### Built-in Events

The theme automatically tracks:

| Event                 | Description                             | Properties                                   |
| --------------------- | --------------------------------------- | -------------------------------------------- |
| `file_download`       | PDF, ZIP, document downloads            | `file_url`, `file_name`, `page_url`          |
| `external_link_click` | Clicks to external websites             | `link_url`, `link_text`, `page_url`          |
| `search_query`        | Search functionality usage              | `search_term`, `page_url`                    |
| `scroll_depth`        | Reading engagement (25%, 50%, 75%, 90%) | `depth_percentage`, `page_url`, `page_title` |
| `code_interaction`    | Code block clicks/interactions          | `interaction_type`, `page_url`               |
| `toc_click`           | Table of contents navigation            | `toc_link`, `toc_text`, `page_url`           |
| `sidebar_navigation`  | Sidebar link clicks                     | `nav_link`, `nav_text`, `page_url`           |

### Custom Event API

Use the global `zer0Analytics` object for custom tracking:

```javascript
// Track a custom event
window.zer0Analytics.track("button_click", {
  button_id: "subscribe",
  page_section: "header",
  user_type: "visitor",
});

// Identify a user (for logged-in users)
window.zer0Analytics.identify("user123", {
  email: "user@example.com",
  subscription: "pro",
  signup_date: "2024-01-15",
});

// Reset user session (for logout)
window.zer0Analytics.reset();
```

## Jekyll-Specific Tracking

### Automatic Page Properties

Every event includes Jekyll-specific context:

```javascript
{
  'site_title': 'Your Site Title',
  'site_description': 'Your site description',
  'jekyll_version': '4.3.2',
  'theme': 'bamr87/zer0-mistakes',
  'page_layout': 'journals',
  'page_collection': 'posts',
  'page_categories': ['development', 'jekyll'],
  'page_tags': ['tutorial', 'analytics'],
  'page_url': '/posts/2024/01/15/analytics-setup/',
  'page_title': 'Setting Up Analytics',
  'page_author': 'Your Name',
  'page_date': '2024-01-15'
}
```

### Collection-Specific Tracking

Different Jekyll collections get specialized tracking:

- **Blog posts** (`_posts`): Tracks reading time, social shares, related post clicks
- **Documentation** (`_docs`): Monitors navigation patterns, search usage
- **Pages**: Tracks form submissions, contact interactions
- **Collections**: Custom event tracking per collection type

## Security & Privacy

### Data Protection

- **No PII collection** without explicit consent
- **Anonymized analytics** with IP masking options
- **Local preference storage** - no server-side tracking of consent
- **Secure cookie configuration** for production environments

### Compliance Features

- **Cookie consent banner** meets GDPR requirements
- **DNT header respect** for privacy-conscious users
- **Granular consent controls** for different tracking types
- **Data retention controls** through PostHog configuration
- **Audit trail** for compliance reporting

### Development vs Production

| Feature           | Development | Production             |
| ----------------- | ----------- | ---------------------- |
| Analytics Loading | Disabled    | Enabled (with consent) |
| Console Logging   | Verbose     | Minimal                |
| Cookie Banner     | Hidden      | Visible                |
| DNT Respect       | N/A         | Active                 |
| Session Recording | Disabled    | Configurable           |

## Installation & Setup

### 1. PostHog Account Setup

1. Create account at [PostHog.com](https://posthog.com)
2. Get your API key and host URL
3. Configure your PostHog project settings

### 2. Theme Configuration

Update your `_config.yml` with PostHog settings:

```yaml
posthog:
  enabled: true
  api_key: "phc_your_api_key_here"
  api_host: "https://us.i.posthog.com"
  # Add other configuration options as needed
```

### 3. Privacy Policy Update

Update your privacy policy to include:

- PostHog analytics usage
- Cookie consent information
- User rights and opt-out procedures
- Data retention policies

### 4. Testing

1. **Development**: Analytics disabled automatically
2. **Staging**: Test with `enabled: true` in staging config
3. **Production**: Verify cookie consent and event tracking

## Troubleshooting

### Common Issues

**Analytics not loading**

- Check `jekyll.environment` is set to "production"
- Verify `site.posthog.enabled` is `true`
- Ensure API key is correctly configured

**Cookie banner not appearing**

- Clear localStorage: `localStorage.removeItem('zer0-cookie-consent')`
- Check browser console for JavaScript errors
- Verify Bootstrap 5 is loaded

**Events not tracking**

- Check user has consented to analytics
- Verify PostHog project is receiving data
- Test with PostHog's debug mode

### Debug Mode

Enable PostHog debug mode in browser console:

```javascript
posthog.debug(true);
```

### Console Commands

Useful browser console commands:

```javascript
// Check consent status
console.log(window.cookieManager.getConsent());

// Force show cookie banner
window.cookieManager.showBanner();

// Test analytics
window.zer0Analytics.track("test_event", { source: "manual" });
```

## Best Practices

### Performance

- **Async loading**: Analytics load asynchronously to prevent blocking
- **Conditional loading**: Only loads in production with consent
- **Efficient tracking**: Debounced scroll events, optimized selectors

### Privacy

- **Minimal data collection**: Only track what's necessary
- **Clear consent UI**: Easy-to-understand cookie preferences
- **Regular audits**: Review tracked events and data usage

### Development

- **Test thoroughly**: Use staging environment for analytics testing
- **Document custom events**: Keep track of custom tracking implementations
- **Monitor performance**: Watch for analytics impact on site speed

## Support

For issues or questions about PostHog integration:

1. **Theme Issues**: Create issue on [zer0-mistakes GitHub](https://github.com/bamr87/zer0-mistakes/issues)
2. **PostHog Issues**: Check [PostHog documentation](https://posthog.com/docs)
3. **Privacy Questions**: Review GDPR/CCPA compliance guides
4. **Custom Implementation**: Refer to Jekyll and PostHog documentation

---

_This integration provides a complete, privacy-compliant analytics solution for Jekyll sites with the flexibility to grow with your needs while respecting user privacy._
