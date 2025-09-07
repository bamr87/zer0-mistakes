---
title: "Blog"
description: "Latest posts and updates"
layout: default
permalink: /blog/
---

## Latest posts

{% assign posts = site.posts | slice: 0, 20 %}
{% if posts and posts.size > 0 %}

{% for post in posts %}
- [{{ post.title }}]({{ post.url | relative_url }}) — {{ post.date | date: "%B %d, %Y" }}
{% endfor %}

{% else %}

No posts yet.

{% endif %}
