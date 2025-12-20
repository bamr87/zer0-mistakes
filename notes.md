---
title: "Notes"
description: "Browse published notes."
layout: default
permalink: /notes/
---

# Notes

{% if site.notes and site.notes.size > 0 %}
<ul>
  {% for note in site.notes %}
    <li><a href="{{ note.url | relative_url }}">{{ note.title | default: note.name }}</a></li>
  {% endfor %}
</ul>
{% else %}
<p>No notes published yet.</p>
{% endif %}
