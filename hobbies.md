---
title: "Hobbies"
description: "Browse hobbies content."
layout: default
permalink: /hobbies/
---

# Hobbies

{% if site.hobbies and site.hobbies.size > 0 %}
<ul>
  {% for hobby in site.hobbies %}
    <li><a href="{{ hobby.url | relative_url }}">{{ hobby.title | default: hobby.name }}</a></li>
  {% endfor %}
</ul>
{% else %}
<p>No hobbies published yet.</p>
{% endif %}
