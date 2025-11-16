---
title: "Blog"
description: "Latest posts and updates from the Zer0-Mistakes community"
layout: default
permalink: /blog/
categories:
  - blog
  - content
tags:
  - posts
  - updates
  - community
date: 2025-11-16T00:00:00.000Z
lastmod: 2025-11-16T00:00:00.000Z
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
