---
title: "Categories"
description: "Browse all categories and discover content by topic"
layout: default
permalink: /categories/
---

<!--
  ===================================================================
  CATEGORIES INDEX PAGE - Browse all categories
  ===================================================================

  File: categories.md
  Path: pages/categories.md
  Purpose: Display all categories with post counts and links to categorized posts

  This page provides:
  - Alphabetical list of all categories
  - Post count for each category
  - Direct links to posts grouped by category
  - Category overview visualization
  ===================================================================
-->

<header class="categories-header mb-5">
  <h1 class="display-5">
    <i class="bi bi-collection me-2"></i>Browse by Category
  </h1>
  <p class="lead text-muted">
    Explore content organized by category. Click any category to see related articles.
  </p>
</header>

<!-- ========================== -->
<!-- CATEGORY OVERVIEW          -->
<!-- ========================== -->

{% comment %} Collect all categories with counts {% endcomment %}
{% assign all_categories = "" | split: "" %}
{% for post in site.posts %}
{% for category in post.categories %}
{% assign all_categories = all_categories | push: category %}
{% endfor %}
{% endfor %}
{% assign unique_categories = all_categories | uniq | sort_natural %}

<section class="category-overview mb-5 p-4 bg-body-tertiary rounded">
  <h2 class="h5 mb-3">
    <i class="bi bi-grid me-2"></i>Category Overview
  </h2>
  <div class="d-flex flex-wrap gap-2 justify-content-center">
    {% for category in unique_categories %}
      {% assign count = all_categories | where_exp: "c", "c == category" | size %}
      {% comment %} Size badge based on count {% endcomment %}
      {% if count > 5 %}
        {% assign badge_class = "fs-5" %}
      {% elsif count > 2 %}
        {% assign badge_class = "fs-6" %}
      {% else %}
        {% assign badge_class = "" %}
      {% endif %}
      <a href="#{{ category | slugify }}" 
         class="badge bg-success text-decoration-none {{ badge_class }}">
        {{ category }}
        <span class="badge bg-light text-dark ms-1">{{ count }}</span>
      </a>
    {% endfor %}
  </div>
</section>

<!-- ========================== -->
<!-- CATEGORIES WITH POSTS      -->
<!-- ========================== -->
<section class="categories-list">
  <h2 class="h4 mb-4 pb-2 border-bottom">
    <i class="bi bi-list-ul me-2"></i>All Categories ({{ unique_categories.size }})
  </h2>
  
  {% for category in unique_categories %}
    {% assign categorized_posts = site.posts | where_exp: "post", "post.categories contains category" %}
    
    <article class="category-section mb-5" id="{{ category | slugify }}">
      <!-- Category Header -->
      <div class="d-flex align-items-center mb-3">
        <h3 class="h5 mb-0">
          <i class="bi bi-folder-fill text-success me-2"></i>{{ category }}
        </h3>
        <span class="badge bg-secondary ms-2">{{ categorized_posts.size }}</span>
        <a href="#top" class="ms-auto small text-muted">
          <i class="bi bi-arrow-up"></i> top
        </a>
      </div>
      
      <!-- Posts in this category -->
      <ul class="list-group list-group-flush">
        {% for post in categorized_posts %}
          <li class="list-group-item d-flex justify-content-between align-items-start px-0">
            <div class="ms-2 me-auto">
              <a href="{{ post.url | relative_url }}" class="fw-semibold text-decoration-none">
                {{ post.title }}
              </a>
              {% if post.description %}
                <p class="text-muted small mb-0">{{ post.description | truncate: 100 }}</p>
              {% endif %}
            </div>
            <small class="text-muted ms-3 text-nowrap">
              <i class="bi bi-calendar3 me-1"></i>
              {{ post.date | date: "%b %d, %Y" }}
            </small>
          </li>
        {% endfor %}
      </ul>
    </article>
  {% endfor %}
  
  {% if unique_categories.size == 0 %}
    <!-- Empty state -->
    <div class="text-center py-5">
      <i class="bi bi-folder-x display-1 text-muted mb-3"></i>
      <h3 class="h5 text-muted">No Categories Yet</h3>
      <p class="text-muted">
        Posts will be organized by category as content is added.
      </p>
    </div>
  {% endif %}
</section>

<!-- ========================== -->
<!-- BACK TO TOP LINK           -->
<!-- ========================== -->
<div class="text-center mt-5" id="top">
  <a href="{{ '/pages/' | relative_url }}" class="btn btn-outline-primary">
    <i class="bi bi-arrow-left me-1"></i>Back to All Posts
  </a>
</div>
