---
title: "Feature Registry"
layout: admin
icon: bi-stars
excerpt: Complete registry of all theme features with references, documentation links, and implementation details.
lastmod: 2026-04-10T00:00:00.000Z
permalink: /about/features/
sidebar: false
comments: false
---

{% assign all_features = site.data.features.features %}

{% assign ai_count = all_features | where_exp: "item", "item.tags contains 'ai'" | size %}
{% assign priv_tags = all_features | where_exp: "item", "item.tags contains 'privacy'" %}
{% assign gdpr_tags = all_features | where_exp: "item", "item.tags contains 'gdpr'" %}
{% assign privacy_count = priv_tags | concat: gdpr_tags | uniq | size %}

<!-- Quick-reference stat cards -->
<div class="row g-3 mb-4">
  <div class="col-6 col-lg-3">
    <div class="card text-center h-100 border-primary">
      <div class="card-body py-3">
        <i class="bi bi-collection fs-3 text-primary"></i>
        <div class="fw-semibold mt-1 fs-4">{{ all_features.size }}</div>
        <small class="text-muted">Total Features</small>
      </div>
    </div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="card text-center h-100 border-success">
      <div class="card-body py-3">
        <i class="bi bi-check2-circle fs-3 text-success"></i>
        <div class="fw-semibold mt-1 fs-4">{{ all_features | where: "implemented", true | size }}</div>
        <small class="text-muted">Implemented</small>
      </div>
    </div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="card text-center h-100 border-info">
      <div class="card-body py-3">
        <i class="bi bi-robot fs-3 text-info"></i>
        <div class="fw-semibold mt-1 fs-4">{{ ai_count }}</div>
        <small class="text-muted">AI-Powered</small>
      </div>
    </div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="card text-center h-100 border-warning">
      <div class="card-body py-3">
        <i class="bi bi-shield-check fs-3 text-warning"></i>
        <div class="fw-semibold mt-1 fs-4">{{ privacy_count }}</div>
        <small class="text-muted">Privacy-First</small>
      </div>
    </div>
  </div>
</div>

<!-- Main tabbed interface -->
<ul class="nav nav-tabs" id="featureTabs" role="tablist">
  <li class="nav-item" role="presentation">
    <button class="nav-link active" id="tab-browse" data-bs-toggle="tab" data-bs-target="#pane-browse" type="button" role="tab" aria-selected="true">
      <i class="bi bi-grid me-1"></i> Browse
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab-reference" data-bs-toggle="tab" data-bs-target="#pane-reference" type="button" role="tab" aria-selected="false">
      <i class="bi bi-table me-1"></i> All Features
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab-categories" data-bs-toggle="tab" data-bs-target="#pane-categories" type="button" role="tab" aria-selected="false">
      <i class="bi bi-tags me-1"></i> Categories
    </button>
  </li>
</ul>

<div class="tab-content pt-4" id="featureTabContent">

  <!-- ═══════ Browse Tab ═══════ -->
  <div class="tab-pane fade show active" id="pane-browse" role="tabpanel">

    <h5 class="text-body-secondary fw-semibold mb-3"><i class="bi bi-buildings me-1"></i> Core Infrastructure</h5>
    <div class="row row-cols-1 row-cols-md-2 g-3 mb-5">
      {% assign jekyll_features = all_features | where_exp: "item", "item.tags contains 'jekyll'" %}
      {% assign docker_features = all_features | where_exp: "item", "item.tags contains 'docker'" %}
      {% assign bootstrap_features = all_features | where_exp: "item", "item.tags contains 'bootstrap'" %}
      {% assign core_features = jekyll_features | concat: docker_features | concat: bootstrap_features | uniq | slice: 0, 3 %}
      {% for feature in core_features %}
      <div class="col">
        <div class="card h-100">
          <div class="card-body">
            <h6 class="card-title"><i class="bi bi-check-circle-fill text-success me-2"></i>{{ feature.title }}</h6>
            <p class="card-text small">{{ feature.description }}</p>
            {% if feature.references %}
            <details class="small mb-2">
              <summary class="text-muted">References</summary>
              <ul class="mt-1 mb-0">
                {% for ref in feature.references %}{% assign key = ref[0] %}{% assign value = ref[1] %}{% if value.first %}{% for file in value %}<li><code>{{ file }}</code></li>{% endfor %}{% else %}<li><code>{{ value }}</code></li>{% endif %}{% endfor %}
              </ul>
            </details>
            {% endif %}
            <div><span class="badge bg-primary">{{ feature.id }}</span><span class="badge bg-secondary ms-1">v{{ feature.version }}</span>{% for tag in feature.tags limit:3 %}<span class="badge bg-body-secondary text-body ms-1">{{ tag }}</span>{% endfor %}</div>
          </div>
          {% if feature.docs %}<div class="card-footer py-2"><a href="{{ feature.docs }}" class="btn btn-sm btn-outline-primary"><i class="bi bi-book me-1"></i>Docs</a></div>{% endif %}
        </div>
      </div>
      {% endfor %}
    </div>

    <h5 class="text-body-secondary fw-semibold mb-3"><i class="bi bi-robot me-1"></i> AI-Powered Features</h5>
    <div class="row row-cols-1 row-cols-md-2 g-3 mb-5">
      {% assign ai_features = all_features | where_exp: "item", "item.tags contains 'ai'" %}
      {% for feature in ai_features %}
      <div class="col">
        <div class="card h-100 border-primary">
          <div class="card-body">
            <h6 class="card-title"><i class="bi bi-robot text-primary me-2"></i>{{ feature.title }}</h6>
            <p class="card-text small">{{ feature.description }}</p>
            {% if feature.providers %}<ul class="small mb-2">{% for provider in feature.providers %}<li><strong>{{ provider.name }}</strong>: {{ provider.description }}</li>{% endfor %}</ul>{% endif %}
            <div><span class="badge bg-primary">{{ feature.id }}</span><span class="badge bg-secondary ms-1">v{{ feature.version }}</span>{% for tag in feature.tags limit:3 %}<span class="badge bg-body-secondary text-body ms-1">{{ tag }}</span>{% endfor %}</div>
          </div>
          {% if feature.docs %}<div class="card-footer py-2"><a href="{{ feature.docs }}" class="btn btn-sm btn-outline-primary"><i class="bi bi-book me-1"></i>Docs</a></div>{% endif %}
        </div>
      </div>
      {% endfor %}
    </div>

    <h5 class="text-body-secondary fw-semibold mb-3"><i class="bi bi-shield-check me-1"></i> Analytics &amp; Privacy</h5>
    <div class="row row-cols-1 row-cols-md-2 g-3 mb-5">
      {% assign privacy_only = all_features | where_exp: "item", "item.tags contains 'privacy'" %}
      {% assign analytics_only = all_features | where_exp: "item", "item.tags contains 'analytics'" %}
      {% assign privacy_features = privacy_only | concat: analytics_only | uniq %}
      {% for feature in privacy_features %}
      <div class="col">
        <div class="card h-100 border-success">
          <div class="card-body">
            <h6 class="card-title"><i class="bi bi-shield-check text-success me-2"></i>{{ feature.title }}</h6>
            <p class="card-text small">{{ feature.description }}</p>
            {% if feature.features %}<ul class="small mb-2">{% for item in feature.features limit:5 %}<li>{{ item }}</li>{% endfor %}</ul>{% endif %}
            <div><span class="badge bg-primary">{{ feature.id }}</span><span class="badge bg-secondary ms-1">v{{ feature.version }}</span>{% for tag in feature.tags limit:3 %}<span class="badge bg-body-secondary text-body ms-1">{{ tag }}</span>{% endfor %}</div>
          </div>
          {% if feature.docs %}<div class="card-footer py-2"><a href="{{ feature.docs }}" class="btn btn-sm btn-outline-success"><i class="bi bi-book me-1"></i>Docs</a></div>{% endif %}
        </div>
      </div>
      {% endfor %}
    </div>

    <h5 class="text-body-secondary fw-semibold mb-3"><i class="bi bi-compass me-1"></i> Navigation &amp; UI</h5>
    <div class="row row-cols-1 row-cols-md-2 g-3 mb-5">
      {% assign nav_only = all_features | where_exp: "item", "item.tags contains 'navigation'" %}
      {% assign access_only = all_features | where_exp: "item", "item.tags contains 'accessibility'" %}
      {% assign ui_only = all_features | where_exp: "item", "item.tags contains 'ui'" %}
      {% assign nav_features = nav_only | concat: access_only | concat: ui_only | uniq %}
      {% for feature in nav_features %}
      <div class="col">
        <div class="card h-100">
          <div class="card-body">
            <h6 class="card-title"><i class="bi bi-compass text-info me-2"></i>{{ feature.title }}</h6>
            <p class="card-text small">{{ feature.description }}</p>
            {% if feature.shortcuts %}<ul class="small mb-2">{% for shortcut in feature.shortcuts %}<li><kbd>{{ shortcut.key }}</kbd> — {{ shortcut.action }}</li>{% endfor %}</ul>{% endif %}
            <div><span class="badge bg-primary">{{ feature.id }}</span><span class="badge bg-secondary ms-1">v{{ feature.version }}</span>{% for tag in feature.tags limit:3 %}<span class="badge bg-body-secondary text-body ms-1">{{ tag }}</span>{% endfor %}</div>
          </div>
          {% if feature.docs %}<div class="card-footer py-2"><a href="{{ feature.docs }}" class="btn btn-sm btn-outline-info"><i class="bi bi-book me-1"></i>Docs</a></div>{% endif %}
        </div>
      </div>
      {% endfor %}
    </div>

    <h5 class="text-body-secondary fw-semibold mb-3"><i class="bi bi-file-earmark-text me-1"></i> Content Management</h5>
    <div class="row row-cols-1 row-cols-md-2 g-3 mb-5">
      {% assign content_only = all_features | where_exp: "item", "item.tags contains 'content'" %}
      {% assign jupyter_only = all_features | where_exp: "item", "item.tags contains 'jupyter'" %}
      {% assign mermaid_only = all_features | where_exp: "item", "item.tags contains 'mermaid'" %}
      {% assign content_features = content_only | concat: jupyter_only | concat: mermaid_only | uniq %}
      {% for feature in content_features %}
      <div class="col">
        <div class="card h-100">
          <div class="card-body">
            <h6 class="card-title"><i class="bi bi-file-earmark-text text-warning me-2"></i>{{ feature.title }}</h6>
            <p class="card-text small">{{ feature.description }}</p>
            {% if feature.diagram_types %}<div class="d-flex flex-wrap gap-1 mb-2">{% for type in feature.diagram_types limit:6 %}<span class="badge bg-secondary">{{ type }}</span>{% endfor %}</div>{% endif %}
            <div><span class="badge bg-primary">{{ feature.id }}</span><span class="badge bg-secondary ms-1">v{{ feature.version }}</span>{% for tag in feature.tags limit:3 %}<span class="badge bg-body-secondary text-body ms-1">{{ tag }}</span>{% endfor %}</div>
          </div>
          {% if feature.docs %}<div class="card-footer py-2"><a href="{{ feature.docs }}" class="btn btn-sm btn-outline-warning"><i class="bi bi-book me-1"></i>Docs</a></div>{% endif %}
        </div>
      </div>
      {% endfor %}
    </div>

    <h5 class="text-body-secondary fw-semibold mb-3"><i class="bi bi-tools me-1"></i> Developer Experience</h5>
    <div class="row row-cols-1 row-cols-md-2 g-3 mb-4">
      {% assign testing_only = all_features | where_exp: "item", "item.tags contains 'testing'" %}
      {% assign cicd_only = all_features | where_exp: "item", "item.tags contains 'ci-cd'" %}
      {% assign auto_only = all_features | where_exp: "item", "item.tags contains 'automation'" %}
      {% assign release_only = all_features | where_exp: "item", "item.tags contains 'release'" %}
      {% assign dev_features = testing_only | concat: cicd_only | concat: auto_only | concat: release_only | uniq %}
      {% for feature in dev_features %}
      <div class="col">
        <div class="card h-100 border-danger">
          <div class="card-body">
            <h6 class="card-title"><i class="bi bi-tools text-danger me-2"></i>{{ feature.title }}</h6>
            <p class="card-text small">{{ feature.description }}</p>
            {% if feature.features %}<ul class="small mb-2">{% for item in feature.features limit:5 %}<li>{{ item }}</li>{% endfor %}</ul>{% endif %}
            <div><span class="badge bg-primary">{{ feature.id }}</span><span class="badge bg-secondary ms-1">v{{ feature.version }}</span>{% for tag in feature.tags limit:3 %}<span class="badge bg-body-secondary text-body ms-1">{{ tag }}</span>{% endfor %}</div>
          </div>
          {% if feature.docs %}<div class="card-footer py-2"><a href="{{ feature.docs }}" class="btn btn-sm btn-outline-danger"><i class="bi bi-book me-1"></i>Docs</a></div>{% endif %}
        </div>
      </div>
      {% endfor %}
    </div>

  </div>

  <!-- ═══════ All Features Tab ═══════ -->
  <div class="tab-pane fade" id="pane-reference" role="tabpanel">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <p class="text-body-secondary mb-0 small">{{ all_features.size }} features in the registry</p>
      <a href="https://github.com/bamr87/zer0-mistakes/blob/main/features/features.yml" class="btn btn-sm btn-outline-secondary" target="_blank">
        <i class="bi bi-github me-1"></i>Source YAML
      </a>
    </div>
    <div class="table-responsive">
      <table class="table table-sm table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th>ID</th>
            <th>Feature</th>
            <th>Version</th>
            <th>Tags</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {% for feature in all_features %}
          <tr>
            <td><code class="small">{{ feature.id }}</code></td>
            <td>
              <strong class="small">{{ feature.title }}</strong>
              <div class="text-muted" style="font-size:.75rem">{{ feature.description | truncate: 80 }}</div>
            </td>
            <td><span class="badge bg-secondary">v{{ feature.version }}</span></td>
            <td>{% for tag in feature.tags limit:3 %}<span class="badge bg-body-secondary text-body me-1">{{ tag }}</span>{% endfor %}</td>
            <td class="text-end">
              {% if feature.docs %}<a href="{{ feature.docs }}" class="btn btn-sm btn-outline-primary me-1"><i class="bi bi-book"></i></a>{% endif %}
              {% if feature.link and feature.link != '/' %}<a href="{{ feature.link }}" class="btn btn-sm btn-outline-secondary"><i class="bi bi-link-45deg"></i></a>{% endif %}
            </td>
          </tr>
          {% endfor %}
        </tbody>
      </table>
    </div>
  </div>

  <!-- ═══════ Categories Tab ═══════ -->
  <div class="tab-pane fade" id="pane-categories" role="tabpanel">

    {% assign all_tags = "" | split: "" %}
    {% for feature in all_features %}
      {% for tag in feature.tags %}
        {% unless all_tags contains tag %}
          {% assign all_tags = all_tags | push: tag %}
        {% endunless %}
      {% endfor %}
    {% endfor %}

    <p class="text-body-secondary small mb-3">{{ all_tags.size }} categories across {{ all_features.size }} features</p>

    {% for tag in all_tags %}
    {% assign tagged = all_features | where_exp: "item", "item.tags contains tag" %}
    <div class="mb-4">
      <div class="d-flex align-items-center mb-2 gap-2">
        <span class="badge bg-primary">{{ tag }}</span>
        <span class="text-body-secondary small">{{ tagged.size }} feature{% if tagged.size != 1 %}s{% endif %}</span>
      </div>
      <div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-2">
        {% for feature in tagged %}
        <div class="col">
          <div class="card card-body py-2 px-3 h-100">
            <div class="small fw-semibold">{{ feature.title }}</div>
            <div class="text-muted" style="font-size:.75rem">{{ feature.description | truncate: 70 }}</div>
          </div>
        </div>
        {% endfor %}
      </div>
    </div>
    {% endfor %}

  </div>

</div>


<div class="row text-center mb-5">
  <div class="col-6 col-md-3">
    <div class="card border-0 bg-primary bg-opacity-10">
      <div class="card-body py-3">
        <h2 class="display-5 fw-bold text-primary mb-0">{{ site.data.features.features.size }}</h2>
        <p class="text-muted small mb-0">Total Features</p>
      </div>
    </div>
  </div>
  <div class="col-6 col-md-3">
    <div class="card border-0 bg-success bg-opacity-10">
      <div class="card-body py-3">
        <h2 class="display-5 fw-bold text-success mb-0">{{ site.data.features.features | where: "implemented", true | size }}</h2>
        <p class="text-muted small mb-0">Implemented</p>
      </div>
    </div>
  </div>
  <div class="col-6 col-md-3">
    <div class="card border-0 bg-info bg-opacity-10">
      <div class="card-body py-3">
        {% assign ai_count = site.data.features.features | where_exp: "item", "item.tags contains 'ai'" | size %}
        <h2 class="display-5 fw-bold text-info mb-0">{{ ai_count }}</h2>
        <p class="text-muted small mb-0">AI-Powered</p>
      </div>
    </div>
  </div>
  <div class="col-6 col-md-3">
    <div class="card border-0 bg-warning bg-opacity-10">
      <div class="card-body py-3">
        {% assign priv_tags = site.data.features.features | where_exp: "item", "item.tags contains 'privacy'" %}
        {% assign gdpr_tags = site.data.features.features | where_exp: "item", "item.tags contains 'gdpr'" %}
        {% assign privacy_count = priv_tags | concat: gdpr_tags | uniq | size %}
        <h2 class="display-5 fw-bold text-warning mb-0">{{ privacy_count }}</h2>
        <p class="text-muted small mb-0">Privacy-First</p>
      </div>
    </div>
  </div>
</div>

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

## 🎯 Feature Categories

{% assign all_tags = "" | split: "" %}
{% for feature in site.data.features.features %}
  {% for tag in feature.tags %}
    {% unless all_tags contains tag %}
      {% assign all_tags = all_tags | push: tag %}
    {% endunless %}
  {% endfor %}
{% endfor %}

<div class="d-flex flex-wrap gap-2 mb-4">
  {% for tag in all_tags %}
  <span class="badge bg-secondary">{{ tag }}</span>
  {% endfor %}
</div>

<div class="alert alert-info" role="alert">
  <i class="bi bi-info-circle me-2"></i>
  <strong>Note:</strong> This feature list is automatically generated from <code>_data/features.yml</code>. 
  For the most up-to-date information, see the <a href="https://github.com/bamr87/zer0-mistakes/blob/main/features/features.yml" class="alert-link">features registry on GitHub</a>.
</div>
