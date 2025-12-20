---
title: "Features"
subtitle: "Complete Feature List"
description: "Comprehensive list of zer0-mistakes Jekyll theme features with documentation links and implementation details"
layout: default
permalink: /features/
date: 2025-12-16
lastmod: 2025-12-16
tags: [features, documentation, reference]
categories: [Documentation]
comments: false
toc: true
---

# {{ page.title }}

Complete feature registry for the zer0-mistakes Jekyll theme. All {{ site.data.features.features.size }} features are documented with references, links, and implementation details.

---

## 🏗 Core Infrastructure

<div class="row row-cols-1 row-cols-md-2 g-4 mb-4">
{% assign jekyll_features = site.data.features.features | where_exp: "item", "item.tags contains 'jekyll'" %}
{% assign docker_features = site.data.features.features | where_exp: "item", "item.tags contains 'docker'" %}
{% assign bootstrap_features = site.data.features.features | where_exp: "item", "item.tags contains 'bootstrap'" %}
{% assign core_features = jekyll_features | concat: docker_features | concat: bootstrap_features | uniq | slice: 0, 3 %}
{% for feature in core_features %}
<div class="col">
  <div class="card h-100">
    <div class="card-body">
      <h5 class="card-title">
        <i class="bi bi-check-circle-fill text-success me-2"></i>
        {{ feature.title }}
      </h5>
      <p class="card-text">{{ feature.description }}</p>
      
      {% if feature.references %}
      <div class="mt-3">
        <h6 class="text-muted small">References:</h6>
        <ul class="small">
          {% for ref in feature.references %}
            {% assign key = ref[0] %}
            {% assign value = ref[1] %}
            {% if value.first %}
              {% for file in value %}
              <li><code>{{ file }}</code></li>
              {% endfor %}
            {% else %}
              <li><code>{{ value }}</code></li>
            {% endif %}
          {% endfor %}
        </ul>
      </div>
      {% endif %}
      
      <div class="mt-3">
        <span class="badge bg-primary">{{ feature.id }}</span>
        <span class="badge bg-secondary">v{{ feature.version }}</span>
        {% for tag in feature.tags limit:3 %}
        <span class="badge bg-light text-dark">{{ tag }}</span>
        {% endfor %}
      </div>
    </div>
    {% if feature.docs %}
    <div class="card-footer">
      <a href="{{ feature.docs }}" class="btn btn-sm btn-outline-primary">
        <i class="bi bi-book me-1"></i>Documentation
      </a>
    </div>
    {% endif %}
  </div>
</div>
{% endfor %}
</div>

---

## 🤖 AI-Powered Features

<div class="row row-cols-1 row-cols-md-2 g-4 mb-4">
{% assign ai_features = site.data.features.features | where_exp: "item", "item.tags contains 'ai'" %}
{% for feature in ai_features %}
<div class="col">
  <div class="card h-100 border-primary">
    <div class="card-body">
      <h5 class="card-title">
        <i class="bi bi-robot text-primary me-2"></i>
        {{ feature.title }}
      </h5>
      <p class="card-text">{{ feature.description }}</p>
      
      {% if feature.providers %}
      <div class="mt-3">
        <h6 class="text-muted small">Providers:</h6>
        <ul class="small">
          {% for provider in feature.providers %}
          <li><strong>{{ provider.name }}</strong>: {{ provider.description }}</li>
          {% endfor %}
        </ul>
      </div>
      {% endif %}
      
      <div class="mt-3">
        <span class="badge bg-primary">{{ feature.id }}</span>
        <span class="badge bg-secondary">v{{ feature.version }}</span>
        {% for tag in feature.tags limit:3 %}
        <span class="badge bg-light text-dark">{{ tag }}</span>
        {% endfor %}
      </div>
    </div>
    {% if feature.docs %}
    <div class="card-footer">
      <a href="{{ feature.docs }}" class="btn btn-sm btn-outline-primary">
        <i class="bi bi-book me-1"></i>Documentation
      </a>
    </div>
    {% endif %}
  </div>
</div>
{% endfor %}
</div>

---

## 🔒 Analytics & Privacy

<div class="row row-cols-1 row-cols-md-2 g-4 mb-4">
{% assign privacy_only = site.data.features.features | where_exp: "item", "item.tags contains 'privacy'" %}
{% assign analytics_only = site.data.features.features | where_exp: "item", "item.tags contains 'analytics'" %}
{% assign privacy_features = privacy_only | concat: analytics_only | uniq %}
{% for feature in privacy_features %}
<div class="col">
  <div class="card h-100 border-success">
    <div class="card-body">
      <h5 class="card-title">
        <i class="bi bi-shield-check text-success me-2"></i>
        {{ feature.title }}
      </h5>
      <p class="card-text">{{ feature.description }}</p>
      
      {% if feature.features %}
      <div class="mt-3">
        <h6 class="text-muted small">Key Features:</h6>
        <ul class="small">
          {% for item in feature.features limit:5 %}
          <li>{{ item }}</li>
          {% endfor %}
        </ul>
      </div>
      {% endif %}
      
      <div class="mt-3">
        <span class="badge bg-primary">{{ feature.id }}</span>
        <span class="badge bg-secondary">v{{ feature.version }}</span>
        {% for tag in feature.tags limit:3 %}
        <span class="badge bg-light text-dark">{{ tag }}</span>
        {% endfor %}
      </div>
    </div>
    {% if feature.docs %}
    <div class="card-footer">
      <a href="{{ feature.docs }}" class="btn btn-sm btn-outline-success">
        <i class="bi bi-book me-1"></i>Documentation
      </a>
    </div>
    {% endif %}
  </div>
</div>
{% endfor %}
</div>

---

## 🧭 Navigation & User Interface

<div class="row row-cols-1 row-cols-md-2 g-4 mb-4">
{% assign nav_only = site.data.features.features | where_exp: "item", "item.tags contains 'navigation'" %}
{% assign access_only = site.data.features.features | where_exp: "item", "item.tags contains 'accessibility'" %}
{% assign ui_only = site.data.features.features | where_exp: "item", "item.tags contains 'ui'" %}
{% assign nav_features = nav_only | concat: access_only | concat: ui_only | uniq %}
{% for feature in nav_features %}
<div class="col">
  <div class="card h-100">
    <div class="card-body">
      <h5 class="card-title">
        <i class="bi bi-compass text-info me-2"></i>
        {{ feature.title }}
      </h5>
      <p class="card-text">{{ feature.description }}</p>
      
      {% if feature.shortcuts %}
      <div class="mt-3">
        <h6 class="text-muted small">Keyboard Shortcuts:</h6>
        <ul class="small">
          {% for shortcut in feature.shortcuts %}
          <li><kbd>{{ shortcut.key }}</kbd> - {{ shortcut.action }}</li>
          {% endfor %}
        </ul>
      </div>
      {% endif %}
      
      <div class="mt-3">
        <span class="badge bg-primary">{{ feature.id }}</span>
        <span class="badge bg-secondary">v{{ feature.version }}</span>
        {% for tag in feature.tags limit:3 %}
        <span class="badge bg-light text-dark">{{ tag }}</span>
        {% endfor %}
      </div>
    </div>
    {% if feature.docs %}
    <div class="card-footer">
      <a href="{{ feature.docs }}" class="btn btn-sm btn-outline-info">
        <i class="bi bi-book me-1"></i>Documentation
      </a>
    </div>
    {% endif %}
  </div>
</div>
{% endfor %}
</div>

---

## 📓 Content Management

<div class="row row-cols-1 row-cols-md-2 g-4 mb-4">
{% assign content_only = site.data.features.features | where_exp: "item", "item.tags contains 'content'" %}
{% assign jupyter_only = site.data.features.features | where_exp: "item", "item.tags contains 'jupyter'" %}
{% assign mermaid_only = site.data.features.features | where_exp: "item", "item.tags contains 'mermaid'" %}
{% assign content_features = content_only | concat: jupyter_only | concat: mermaid_only | uniq %}
{% for feature in content_features %}
<div class="col">
  <div class="card h-100">
    <div class="card-body">
      <h5 class="card-title">
        <i class="bi bi-file-earmark-text text-warning me-2"></i>
        {{ feature.title }}
      </h5>
      <p class="card-text">{{ feature.description }}</p>
      
      {% if feature.diagram_types %}
      <div class="mt-3">
        <h6 class="text-muted small">Supported Diagram Types:</h6>
        <div class="d-flex flex-wrap gap-1">
          {% for type in feature.diagram_types limit:6 %}
          <span class="badge bg-secondary">{{ type }}</span>
          {% endfor %}
        </div>
      </div>
      {% endif %}
      
      <div class="mt-3">
        <span class="badge bg-primary">{{ feature.id }}</span>
        <span class="badge bg-secondary">v{{ feature.version }}</span>
        {% for tag in feature.tags limit:3 %}
        <span class="badge bg-light text-dark">{{ tag }}</span>
        {% endfor %}
      </div>
    </div>
    {% if feature.docs %}
    <div class="card-footer">
      <a href="{{ feature.docs }}" class="btn btn-sm btn-outline-warning">
        <i class="bi bi-book me-1"></i>Documentation
      </a>
    </div>
    {% endif %}
  </div>
</div>
{% endfor %}
</div>

---

## 🔧 Developer Experience

<div class="row row-cols-1 row-cols-md-2 g-4 mb-4">
{% assign testing_only = site.data.features.features | where_exp: "item", "item.tags contains 'testing'" %}
{% assign cicd_only = site.data.features.features | where_exp: "item", "item.tags contains 'ci-cd'" %}
{% assign auto_only = site.data.features.features | where_exp: "item", "item.tags contains 'automation'" %}
{% assign release_only = site.data.features.features | where_exp: "item", "item.tags contains 'release'" %}
{% assign dev_features = testing_only | concat: cicd_only | concat: auto_only | concat: release_only | uniq %}
{% for feature in dev_features %}
<div class="col">
  <div class="card h-100 border-danger">
    <div class="card-body">
      <h5 class="card-title">
        <i class="bi bi-tools text-danger me-2"></i>
        {{ feature.title }}
      </h5>
      <p class="card-text">{{ feature.description }}</p>
      
      {% if feature.features %}
      <div class="mt-3">
        <h6 class="text-muted small">Features:</h6>
        <ul class="small">
          {% for item in feature.features limit:5 %}
          <li>{{ item }}</li>
          {% endfor %}
        </ul>
      </div>
      {% endif %}
      
      <div class="mt-3">
        <span class="badge bg-primary">{{ feature.id }}</span>
        <span class="badge bg-secondary">v{{ feature.version }}</span>
        {% for tag in feature.tags limit:3 %}
        <span class="badge bg-light text-dark">{{ tag }}</span>
        {% endfor %}
      </div>
    </div>
    {% if feature.docs %}
    <div class="card-footer">
      <a href="{{ feature.docs }}" class="btn btn-sm btn-outline-danger">
        <i class="bi bi-book me-1"></i>Documentation
      </a>
    </div>
    {% endif %}
  </div>
</div>
{% endfor %}
</div>

---

## 📚 All Features Reference

<div class="table-responsive">
  <table class="table table-striped table-hover">
    <thead>
      <tr>
        <th>ID</th>
        <th>Feature</th>
        <th>Version</th>
        <th>Tags</th>
        <th>Documentation</th>
      </tr>
    </thead>
    <tbody>
      {% for feature in site.data.features.features %}
      <tr>
        <td><code>{{ feature.id }}</code></td>
        <td>
          <strong>{{ feature.title }}</strong>
          <br>
          <small class="text-muted">{{ feature.description | truncate: 80 }}</small>
        </td>
        <td><span class="badge bg-secondary">v{{ feature.version }}</span></td>
        <td>
          {% for tag in feature.tags limit:3 %}
          <span class="badge bg-light text-dark">{{ tag }}</span>
          {% endfor %}
        </td>
        <td>
          {% if feature.docs %}
          <a href="{{ feature.docs }}" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-book"></i>
          </a>
          {% endif %}
          {% if feature.link and feature.link != '/' %}
          <a href="{{ feature.link }}" class="btn btn-sm btn-outline-secondary">
            <i class="bi bi-link-45deg"></i>
          </a>
          {% endif %}
        </td>
      </tr>
      {% endfor %}
    </tbody>
  </table>
</div>

---

## 📊 Feature Statistics

<div class="row text-center my-5">
  <div class="col-6 col-md-3">
    <div class="card">
      <div class="card-body">
        <h3 class="display-4">{{ site.data.features.features.size }}</h3>
        <p class="text-muted">Total Features</p>
      </div>
    </div>
  </div>
  <div class="col-6 col-md-3">
    <div class="card">
      <div class="card-body">
        <h3 class="display-4">{{ site.data.features.features | where: "implemented", true | size }}</h3>
        <p class="text-muted">Implemented</p>
      </div>
    </div>
  </div>
  <div class="col-6 col-md-3">
    <div class="card">
      <div class="card-body">
        {% assign ai_count = site.data.features.features | where_exp: "item", "item.tags contains 'ai'" | size %}
        <h3 class="display-4">{{ ai_count }}</h3>
        <p class="text-muted">AI-Powered</p>
      </div>
    </div>
  </div>
  <div class="col-6 col-md-3">
    <div class="card">
      <div class="card-body">
        {% assign priv_tags = site.data.features.features | where_exp: "item", "item.tags contains 'privacy'" %}
        {% assign gdpr_tags = site.data.features.features | where_exp: "item", "item.tags contains 'gdpr'" %}
        {% assign privacy_count = priv_tags | concat: gdpr_tags | uniq | size %}
        <h3 class="display-4">{{ privacy_count }}</h3>
        <p class="text-muted">Privacy-First</p>
      </div>
    </div>
  </div>
</div>

---

## 🎯 Feature Categories

{% assign all_tags = "" | split: "" %}
{% for feature in site.data.features.features %}
  {% for tag in feature.tags %}
    {% unless all_tags contains tag %}
      {% assign all_tags = all_tags | push: tag %}
    {% endunless %}
  {% endfor %}
{% endfor %}

<div class="d-flex flex-wrap gap-2">
  {% for tag in all_tags %}
  <span class="badge bg-primary">{{ tag }}</span>
  {% endfor %}
</div>

---

<div class="alert alert-info mt-5" role="alert">
  <i class="bi bi-info-circle me-2"></i>
  <strong>Note:</strong> This feature list is automatically generated from <code>_data/features.yml</code>. 
  For the most up-to-date information, see the <a href="https://github.com/bamr87/zer0-mistakes/blob/main/features/features.yml" class="alert-link">features registry on GitHub</a>.
</div>
