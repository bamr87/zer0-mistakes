---
title: "Glossary"
description: "Definitions of key terms used in the zer0-mistakes Jekyll theme — Jekyll, Docker, Bootstrap, Liquid, and more."
layout: default
permalink: /glossary/
date: 2026-03-28T00:00:00.000Z
lastmod: 2026-03-28T00:00:00.000Z
tags:
  - glossary
  - reference
  - documentation
categories:
  - documentation
---

# {{ page.title }}

Key terms and definitions used throughout the **zer0-mistakes** Jekyll theme. Each term includes a concise definition, related concepts, and links to learn more.

---

{% for entry in site.data.glossary %}
### {{ entry.term }}

{{ entry.definition }}

{% if entry.url %}[Learn more →]({{ entry.url }}){% endif %}
{% if entry.related %}<small class="text-body-secondary">Related: {{ entry.related | join: ", " }}</small>{% endif %}

{% unless forloop.last %}---{% endunless %}

{% endfor %}
