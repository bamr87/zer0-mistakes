---
title: "Archives"
description: "Post archives by month."
layout: default
permalink: /archives/
---

# Archives

{% assign posts_by_month = site.posts | group_by_exp: 'post', "post.date | date: '%B %Y'" %}

{% if posts_by_month and posts_by_month.size > 0 %}
<ul>
{% for month in posts_by_month %}
  {% assign anchor = month.name | downcase | replace: ' ', '-' %}
  <li><a href="#{{ anchor }}">{{ month.name }} ({{ month.items | size }})</a></li>
{% endfor %}
</ul>

{% for month in posts_by_month %}
  {% assign anchor = month.name | downcase | replace: ' ', '-' %}
  <h2 id="{{ anchor }}">{{ month.name }}</h2>
  <ul>
  {% for post in month.items %}
    <li><a href="{{ post.url | relative_url }}">{{ post.title }}</a></li>
  {% endfor %}
  </ul>
{% endfor %}
{% else %}
  <p>No posts yet.</p>
{% endif %}
