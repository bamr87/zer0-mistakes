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

<header class="blog-header mb-5">
  <h1 class="display-5">
    <i class="bi bi-journal-richtext me-2"></i>Blog
  </h1>
  <p class="lead text-muted">Latest posts and updates from the Zer0-Mistakes community.</p>
  
  <!-- Category Navigation -->
  <nav class="mb-4">
    <div class="d-flex flex-wrap gap-2">
      <a href="{{ site.baseurl }}/posts/" class="btn btn-primary">
        <i class="bi bi-newspaper me-1"></i>News Home
      </a>
      {% for nav_item in site.data.navigation.posts %}
        <a href="{{ nav_item.url | relative_url }}" class="btn btn-outline-secondary">
          {% if nav_item.icon %}<i class="bi bi-{{ nav_item.icon }} me-1"></i>{% endif %}
          {{ nav_item.title }}
        </a>
      {% endfor %}
      <a href="{{ site.baseurl }}/tags/" class="btn btn-outline-secondary">
        <i class="bi bi-tags me-1"></i>Tags
      </a>
    </div>
  </nav>
</header>

## Latest Posts

{% assign posts = site.posts | where_exp: "post", "post.layout != 'blog'" | slice: 0, 20 %}
{% if posts and posts.size > 0 %}

<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mb-5">
{% for post in posts %}
  <div class="col">
    <div class="card h-100 border-0 shadow-sm">
      <div class="position-relative">
        {% if post.breaking %}
          <span class="badge bg-danger position-absolute top-0 start-0 m-2 z-1">Breaking</span>
        {% endif %}
        {% if post.featured %}
          <span class="badge bg-warning text-dark position-absolute top-0 end-0 m-2 z-1">Featured</span>
        {% endif %}
        <a href="{{ post.url | relative_url }}">
          {% assign blog_img = post.preview | default: site.teaser %}
          {% include components/preview-image.html src=blog_img alt=post.title class="card-img-top img-fluid" style="height: 180px; object-fit: cover;" %}
        </a>
      </div>
      <div class="card-body">
        {% if post.categories.size > 0 %}
          <a href="{{ site.baseurl }}/posts/{{ post.categories | first | slugify }}/" class="badge bg-primary text-decoration-none mb-2">
            {{ post.categories | first }}
          </a>
        {% endif %}
        <h5 class="card-title">
          <a href="{{ post.url | relative_url }}" class="text-decoration-none text-body-emphasis">
            {{ post.title | truncate: 60 }}
          </a>
        </h5>
        <p class="card-text text-muted small">{{ post.excerpt | strip_html | truncate: 100 }}</p>
      </div>
      <div class="card-footer bg-transparent">
        <small class="text-muted">
          <i class="bi bi-calendar me-1"></i>{{ post.date | date: "%b %d, %Y" }}
        </small>
      </div>
    </div>
  </div>
{% endfor %}
</div>

{% else %}

<div class="text-center py-5">
  <i class="bi bi-inbox fs-1 text-muted"></i>
  <p class="text-muted mt-3">No posts yet.</p>
</div>

{% endif %}
