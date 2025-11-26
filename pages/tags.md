---
title: "Tags"
description: "Browse all tags and discover content by topic"
layout: default
permalink: /tags/
---
<!--
  ===================================================================
  TAGS INDEX PAGE - Browse all tags
  ===================================================================
  
  File: tags.md
  Path: pages/tags.md
  Purpose: Display all tags with post counts and links to tagged posts
  
  This page provides:
  - Alphabetical list of all tags
  - Post count for each tag
  - Direct links to posts grouped by tag
  - Tag cloud visualization
  ===================================================================
-->

<header class="tags-header mb-5">
  <h1 class="display-5">
    <i class="bi bi-tags me-2"></i>Browse by Tag
  </h1>
  <p class="lead text-muted">
    Explore content organized by topic. Click any tag to see related articles.
  </p>
</header>

<!-- ========================== -->
<!-- TAG CLOUD                  -->
<!-- ========================== -->
{% comment %} Collect all tags with counts {% endcomment %}
{% assign all_tags = "" | split: "" %}
{% assign tag_counts = "" | split: "" %}
{% for post in site.posts %}
  {% for tag in post.tags %}
    {% assign all_tags = all_tags | push: tag %}
  {% endfor %}
{% endfor %}
{% assign unique_tags = all_tags | uniq | sort_natural %}

<section class="tag-cloud mb-5 p-4 bg-body-tertiary rounded">
  <h2 class="h5 mb-3">
    <i class="bi bi-cloud me-2"></i>Tag Cloud
  </h2>
  <div class="d-flex flex-wrap gap-2 justify-content-center">
    {% for tag in unique_tags %}
      {% assign count = all_tags | where_exp: "t", "t == tag" | size %}
      {% comment %} Size badge based on count {% endcomment %}
      {% if count > 5 %}
        {% assign badge_class = "fs-5" %}
      {% elsif count > 2 %}
        {% assign badge_class = "fs-6" %}
      {% else %}
        {% assign badge_class = "" %}
      {% endif %}
      <a href="#{{ tag | slugify }}" 
         class="badge bg-primary text-decoration-none {{ badge_class }}">
        {{ tag }}
        <span class="badge bg-light text-dark ms-1">{{ count }}</span>
      </a>
    {% endfor %}
  </div>
</section>

<!-- ========================== -->
<!-- TAGS WITH POSTS            -->
<!-- ========================== -->
<section class="tags-list">
  <h2 class="h4 mb-4 pb-2 border-bottom">
    <i class="bi bi-list-ul me-2"></i>All Tags ({{ unique_tags.size }})
  </h2>
  
  {% for tag in unique_tags %}
    {% assign tagged_posts = site.posts | where_exp: "post", "post.tags contains tag" %}
    
    <article class="tag-section mb-5" id="{{ tag | slugify }}">
      <!-- Tag Header -->
      <div class="d-flex align-items-center mb-3">
        <h3 class="h5 mb-0">
          <i class="bi bi-tag-fill text-primary me-2"></i>{{ tag }}
        </h3>
        <span class="badge bg-secondary ms-2">{{ tagged_posts.size }}</span>
        <a href="#top" class="ms-auto small text-muted">
          <i class="bi bi-arrow-up"></i> top
        </a>
      </div>
      
      <!-- Posts with this tag -->
      <ul class="list-group list-group-flush">
        {% for post in tagged_posts %}
          <li class="list-group-item d-flex justify-content-between align-items-start px-0">
            <div class="ms-2 me-auto">
              <a href="{{ post.url | relative_url }}" class="fw-semibold text-decoration-none">
                {{ post.title }}
              </a>
              {% if post.featured %}
                <span class="badge bg-warning text-dark ms-1">
                  <i class="bi bi-star-fill"></i>
                </span>
              {% endif %}
              {% if post.breaking %}
                <span class="badge bg-danger ms-1">
                  <i class="bi bi-lightning-fill"></i>
                </span>
              {% endif %}
              <br>
              <small class="text-muted">
                {{ post.excerpt | strip_html | truncate: 100 }}
              </small>
            </div>
            <span class="text-muted small text-nowrap ms-3">
              {{ post.date | date: "%b %d, %Y" }}
            </span>
          </li>
        {% endfor %}
      </ul>
    </article>
  {% endfor %}
</section>

<!-- ========================== -->
<!-- BACK TO TOP                -->
<!-- ========================== -->
<div class="text-center mt-5 pt-4 border-top" id="top">
  <a href="#" class="btn btn-outline-secondary">
    <i class="bi bi-arrow-up me-2"></i>Back to Top
  </a>
</div>
