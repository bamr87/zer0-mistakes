---
title: Sitemap Generation
description: Automatic XML sitemap and JSON search index generation for search engine discovery and site search.
layout: default
categories:
    - docs
    - seo
tags:
    - sitemap
    - seo
    - search
    - indexing
permalink: /docs/seo/sitemap/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
---

# Sitemap Generation

Automatic generation of XML sitemaps for search engines and JSON indexes for site search.

## Overview

The theme generates:

- **XML Sitemap**: For search engine crawlers
- **JSON Search Index**: For client-side search
- **robots.txt**: Crawler instructions

## XML Sitemap

### Automatic Generation

Using `jekyll-sitemap` plugin:

```yaml
# _config.yml
plugins:
  - jekyll-sitemap
```

### Output

Generated at `/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yoursite.com/</loc>
    <lastmod>2025-01-25T00:00:00+00:00</lastmod>
  </url>
  <url>
    <loc>https://yoursite.com/docs/</loc>
    <lastmod>2025-01-20T00:00:00+00:00</lastmod>
  </url>
</urlset>
```

### Custom Sitemap

Create `sitemap.xml` manually:

```liquid
{% raw %}---
layout: null
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  {% for page in site.pages %}
    {% unless page.sitemap == false %}
    <url>
      <loc>{{ page.url | absolute_url }}</loc>
      <lastmod>{{ page.last_modified_at | default: site.time | date_to_xmlschema }}</lastmod>
      <changefreq>{{ page.sitemap.changefreq | default: 'monthly' }}</changefreq>
      <priority>{{ page.sitemap.priority | default: '0.5' }}</priority>
    </url>
    {% endunless %}
  {% endfor %}
</urlset>{% endraw %}
```

## JSON Search Index

### Generated File

`search.json` for client-side search:

```json
[
  {
    "title": "Getting Started",
    "url": "/docs/getting-started/",
    "content": "Welcome to the documentation...",
    "categories": ["docs"],
    "tags": ["setup"]
  }
]
```

### Search Template

```liquid
{% raw %}---
layout: null
---
[
  {% assign pages = site.pages | where_exp: "page", "page.title" %}
  {% for page in pages %}
  {
    "title": {{ page.title | jsonify }},
    "url": {{ page.url | jsonify }},
    "content": {{ page.content | strip_html | truncatewords: 100 | jsonify }},
    "categories": {{ page.categories | jsonify }},
    "tags": {{ page.tags | jsonify }}
  }{% unless forloop.last %},{% endunless %}
  {% endfor %}
]{% endraw %}
```

## robots.txt

### Basic Configuration

```
# robots.txt
User-agent: *
Allow: /

Sitemap: https://yoursite.com/sitemap.xml
```

### Jekyll Template

```liquid
{% raw %}---
layout: null
permalink: /robots.txt
---
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/

Sitemap: {{ site.url }}/sitemap.xml{% endraw %}
```

## Excluding Pages

### From XML Sitemap

```yaml
---
sitemap: false
---
```

Or with plugin config:

```yaml
# _config.yml
defaults:
  - scope:
      path: "admin/*"
    values:
      sitemap: false
```

### From Search Index

```yaml
---
search: false
---
```

```liquid
{% raw %}{% unless page.search == false %}
  // Include in search index
{% endunless %}{% endraw %}
```

## Priority and Frequency

### Per-Page Settings

```yaml
---
sitemap:
  priority: 0.8
  changefreq: weekly
---
```

### Default Settings

```yaml
# _config.yml
defaults:
  - scope:
      path: ""
      type: "posts"
    values:
      sitemap:
        changefreq: monthly
        priority: 0.7
  - scope:
      path: ""
      type: "pages"
    values:
      sitemap:
        changefreq: weekly
        priority: 0.5
```

## Search Engine Submission

### Google Search Console

1. Go to [Search Console](https://search.google.com/search-console)
2. Add your site
3. Submit sitemap URL: `https://yoursite.com/sitemap.xml`

### Bing Webmaster Tools

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add your site
3. Submit sitemap

## Validation

### XML Validation

Test at [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)

### Google Search Console

Check sitemap status in Search Console → Sitemaps

## Troubleshooting

### Sitemap Not Found

1. Check plugin is installed
2. Verify `_site/sitemap.xml` exists
3. Check file permissions

### Pages Missing

1. Verify page isn't excluded
2. Check front matter for `sitemap: false`
3. Ensure page has title

### JSON Invalid

1. Check for unescaped characters
2. Validate JSON syntax
3. Check Liquid template errors

## Best Practices

### Keep Sitemap Updated

- Regenerate on deploy
- Include lastmod dates
- Remove deleted pages

### Optimize for Search

- Include all important pages
- Use descriptive titles
- Keep URLs clean

### Monitor Performance

- Check indexing status
- Monitor crawl errors
- Review search analytics

## Related

- [Meta Tags](/docs/seo/meta-tags/)
- [Site Search](/docs/features/site-search/)
- [Breadcrumbs](/docs/features/breadcrumbs/)
