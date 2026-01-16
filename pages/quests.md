---
title: "Quests"
description: "Browse quests and tutorials."
layout: default
permalink: /quests/
---

# Quests

{% if site.quests and site.quests.size > 0 %}
<ul>
  {% for quest in site.quests %}
    <li><a href="{{ quest.url | relative_url }}">{{ quest.title | default: quest.name }}</a></li>
  {% endfor %}
</ul>
{% else %}
<p>No quests published yet.</p>
{% endif %}
