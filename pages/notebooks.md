---
title: "Notebooks"
description: "Browse published notebooks."
layout: default
permalink: /notebooks/
---

# Notebooks

{% if site.notebooks and site.notebooks.size > 0 %}
<ul>
  {% for nb in site.notebooks %}
    <li><a href="{{ nb.url | relative_url }}">{{ nb.title | default: nb.name }}</a></li>
  {% endfor %}
</ul>
{% else %}
<p>No notebooks published yet.</p>
{% endif %}
