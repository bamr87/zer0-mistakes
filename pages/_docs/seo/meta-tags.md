---
title: SEO Meta Tags
description: Comprehensive SEO meta tag generation including Open Graph, Twitter Cards, and JSON-LD structured data.
layout: default
categories:
    - docs
    - seo
tags:
    - seo
    - meta
    - opengraph
    - twitter-cards
permalink: /docs/seo/meta-tags/
difficulty: intermediate
estimated_time: 15 minutes
sidebar:
    nav: docs
---

# SEO Meta Tags

Automatic generation of SEO meta tags for better search engine and social media visibility.

## Overview

The theme generates:

- Basic meta tags (title, description)
- Open Graph tags (Facebook, LinkedIn)
- Twitter Card tags
- Canonical URLs
- Author information
- JSON-LD structured data

## Generated Tags

### Basic Meta Tags

```html
<title>Page Title - Site Title</title>
<meta name="description" content="Page description here">
<meta name="author" content="Author Name">
<link rel="canonical" href="https://yoursite.com/page/">
```

### Open Graph Tags

```html
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description">
<meta property="og:type" content="article">
<meta property="og:url" content="https://yoursite.com/page/">
<meta property="og:image" content="https://yoursite.com/image.png">
<meta property="og:site_name" content="Site Title">
```

### Twitter Cards

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="Page description">
<meta name="twitter:image" content="https://yoursite.com/image.png">
<meta name="twitter:site" content="@username">
<meta name="twitter:creator" content="@author">
```

## Configuration

### Site-Wide Defaults

```yaml
# _config.yml
title: "Site Title"
description: "Default site description"
url: "https://yoursite.com"

author:
  name: "Your Name"
  twitter: "@yourusername"

# Default social image
og_image: "/assets/images/og-default.png"

# Twitter username
twitter:
  username: "yourusername"
```

### Per-Page Override

```yaml
---
title: "Custom Page Title"
description: "Custom page description for SEO"
image: "/assets/images/custom-og.png"
author: "Different Author"
---
```

## Implementation

### SEO Include

```liquid
{% raw %}<!-- _includes/content/seo.html -->
{% assign seo_url = site.url | append: site.baseurl %}
{% assign seo_title = page.title | default: site.title %}
{% assign seo_description = page.description | default: site.description %}

<!-- Basic Meta -->
<title>{{ seo_title }} - {{ site.title }}</title>
<meta name="description" content="{{ seo_description }}">
<link rel="canonical" href="{{ seo_url }}{{ page.url }}">

<!-- Open Graph -->
<meta property="og:title" content="{{ seo_title }}">
<meta property="og:description" content="{{ seo_description }}">
<meta property="og:url" content="{{ seo_url }}{{ page.url }}">
<meta property="og:image" content="{{ page.image | default: site.og_image | absolute_url }}">
<meta property="og:type" content="{% if page.layout == 'journals' %}article{% else %}website{% endif %}">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ seo_title }}">
<meta name="twitter:description" content="{{ seo_description }}">{% endraw %}
```

### Loading in Head

```html
{% raw %}<head>
  {% include content/seo.html %}
</head>{% endraw %}
```

## Preview Images

### Automatic Generation

The theme can generate preview images automatically. See [Preview Image Generator](/docs/features/preview-image-generator/).

### Manual Configuration

```yaml
---
image: "/assets/images/my-post-preview.png"
---
```

### Image Requirements

| Platform | Size | Ratio |
|----------|------|-------|
| Open Graph | 1200×630 | 1.91:1 |
| Twitter | 1200×600 | 2:1 |
| LinkedIn | 1200×627 | 1.91:1 |

## JSON-LD Structured Data

### Article Schema

```html
{% raw %}<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{{ page.title }}",
  "description": "{{ page.description }}",
  "image": "{{ page.image | absolute_url }}",
  "datePublished": "{{ page.date | date_to_xmlschema }}",
  "dateModified": "{{ page.last_modified_at | default: page.date | date_to_xmlschema }}",
  "author": {
    "@type": "Person",
    "name": "{{ page.author | default: site.author.name }}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "{{ site.title }}"
  }
}
</script>{% endraw %}
```

### Website Schema

```html
{% raw %}<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "{{ site.title }}",
  "url": "{{ site.url }}",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "{{ site.url }}/search/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>{% endraw %}
```

## Best Practices

### Title Tags

- Keep under 60 characters
- Include primary keyword
- Make unique per page
- Put important words first

### Descriptions

- Keep 150-160 characters
- Include call to action
- Make compelling and unique
- Include keywords naturally

### Images

- Use high-quality images
- Include alt text
- Optimize file size
- Use descriptive filenames

## Testing

### Google Rich Results Test

Test structured data at [https://search.google.com/test/rich-results](https://search.google.com/test/rich-results)

### Facebook Debugger

Test Open Graph at [https://developers.facebook.com/tools/debug/](https://developers.facebook.com/tools/debug/)

### Twitter Validator

Test Twitter Cards at [https://cards-dev.twitter.com/validator](https://cards-dev.twitter.com/validator)

## Troubleshooting

### Images Not Showing

1. Verify absolute URL
2. Check image exists
3. Clear platform cache
4. Use debugger tools

### Wrong Description

1. Check page front matter
2. Verify fallback logic
3. Clear search engine cache

### Structured Data Errors

1. Validate with Google tool
2. Check required fields
3. Verify date formats

## Related

- [Sitemap](/docs/seo/sitemap/)
- [Preview Image Generator](/docs/features/preview-image-generator/)
- [Breadcrumbs](/docs/features/breadcrumbs/)
