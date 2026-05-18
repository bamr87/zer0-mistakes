---
lastmod: 2026-05-05T00:00:00.000Z
title: AIEO — AI Engine Optimization
description: AI-Engine Optimization toolkit for zer0-mistakes — Schema.org JSON-LD structured data, E-E-A-T signals, FAQ page, and glossary collection for stronger AI search and LLM grounding.
layout: default
categories:
  - docs
  - seo
tags:
  - seo
  - aieo
  - structured-data
  - faq
  - glossary
  - ai
permalink: /docs/seo/aieo/
difficulty: intermediate
estimated_reading_time: 10 minutes
sidebar:
  nav: docs
---

# AIEO — AI Engine Optimization

**AI Engine Optimization (AIEO)** extends traditional SEO practices to improve how AI-powered search engines, LLMs, and AI assistants discover, understand, and cite your content. zer0-mistakes ships a built-in AIEO toolkit.

## Overview

| Component | Purpose |
|---|---|
| Schema.org JSON-LD | Machine-readable structured data for search engines and AI crawlers |
| E-E-A-T signals | Demonstrates Experience, Expertise, Authoritativeness, and Trustworthiness |
| FAQ page | Directly answers common questions (eligible for rich results) |
| Glossary collection | Provides LLM-grounding definitions for domain vocabulary |

## Structured Data (JSON-LD)

The theme injects Schema.org structured data via dedicated include files:

### Software Application Schema

```
_includes/content/jsonld-software.html
```

Outputs `SoftwareApplication` markup with name, version, description, and license. Used on the home page and theme overview pages.

### FAQ Schema

```
_includes/content/jsonld-faq.html
```

Outputs `FAQPage` markup from a page's `faq_items` frontmatter array:

```yaml
faq_items:
  - question: "What is zer0-mistakes?"
    answer: "A professional Jekyll theme…"
  - question: "Is it free?"
    answer: "Yes, MIT licensed."
```

Add `{% raw %}{% include content/jsonld-faq.html %}{% endraw %}` to any layout or page to emit the FAQ structured data block.

## E-E-A-T Signals

Google and AI crawlers reward content that demonstrates:

- **Experience**: Author bios, case studies, real-world examples
- **Expertise**: Technical depth, code samples, citations
- **Authoritativeness**: Backlinks, GitHub stars, version history
- **Trustworthiness**: Privacy policy, ToS, HTTPS, contact page

The theme ships standard supporting pages:

| Page | Permalink |
|---|---|
| Privacy Policy | `/privacy-policy/` |
| Terms of Service | `/terms-of-service/` |
| Contact | `/contact/` |
| About | `/about/` |

## FAQ Page

```
pages/faq.md  →  /faq/
```

The FAQ page uses the `faq_items` frontmatter array and the `jsonld-faq.html` include to output both human-readable Q&A and machine-readable `FAQPage` JSON-LD in a single file.

## Glossary Collection

```
pages/glossary.md  →  /glossary/
```

The glossary provides domain-specific definitions that help LLMs ground responses about zer0-mistakes in accurate, up-to-date vocabulary. Terms include Jekyll, Bootstrap, Liquid, Docker, Obsidian, and more.

## SEO Include (`_includes/content/seo.html`)

The main SEO include emits:

- `<title>` and `<meta name="description">`
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:type`)
- Twitter Card tags
- Canonical URL
- `robots` meta

It is included automatically by `_includes/core/head.html` on every page.

## Configuration

```yaml
# _config.yml
title: "My Site"
description: "Site description for search engines"
url: "https://example.com"

# Author / E-E-A-T
author:
  name: "Author Name"
  email: "author@example.com"
  bio: "Expert in …"
  twitter: "@handle"

# Schema.org type for the site
schema_type: "SoftwareApplication"
```

## Related

- [Meta Tags & SEO](/docs/seo/meta-tags/)
- [Sitemap](/docs/seo/sitemap/)
- [FAQ Page](/faq/)
- [Glossary](/glossary/)

## See also

- [[SEO]]
- [[Structured Data]]
- [[Features]]
