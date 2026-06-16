---
title: Year of AI
lastmod: 2026-06-15T00:00:00.000Z
description: >-
  The organization hub for a federated network of self-growing, year-by-year
  knowledge bases — each published as its own site, all rendered with the
  shared zer0-mistakes theme.
layout: home
permalink: /
sidebar: false
hide_intro: true
# The hero section below supplies its own visible <h1>; keep `title` for SEO
# but suppress the home layout's duplicate <h1 class="page-heading"> so the
# page exposes exactly one accessible h1 (layouts.spec.js:39).
hide_title: true
rss_subscribe: false
---

<section class="text-center py-5">
  <h1 class="display-4 fw-bold mb-3">Year of AI</h1>
  <p class="lead text-body-secondary mx-auto" style="max-width: 46rem;">
    A federated network of self-growing knowledge bases — one repository per
    year, each publishing its own site and rendered with the shared
    <a href="https://github.com/{{ site.repository | join: '' }}">zer0-mistakes</a>
    theme. Pick a year to explore, or open the hub dashboard to see everything
    at once.
  </p>
  <div class="d-flex justify-content-center gap-2 mt-4">
    <a class="btn btn-primary btn-lg" href="{{ '/hub/' | relative_url }}">
      <i class="bi bi-grid-1x2 me-1"></i>Open the hub dashboard
    </a>
    <a class="btn btn-outline-secondary btn-lg" href="https://github.com/{{ site.github_user }}">
      <i class="bi bi-github me-1"></i>Organization
    </a>
  </div>
</section>

{% assign hub = site.data.hub_index %}
{% if hub and hub.repos and hub.repos.size > 0 %}

<h2 class="h4 mb-3"><i class="bi bi-calendar3 me-2"></i>The years</h2>
<p class="text-body-secondary">{{ hub.totals.repos }} knowledge bases · {{ hub.totals.pages }} pages and growing.</p>

<div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3 mb-5">
  {% assign years = hub.repos | sort: "name" %}
  {% for repo in years %}
  <div class="col">
    {% if repo.pages_enabled %}
    <a class="card h-100 text-decoration-none text-reset shadow-sm" href="{{ repo.site_url }}">
    {% else %}
    <div class="card h-100 shadow-sm opacity-75">
    {% endif %}
      <div class="card-body text-center">
        <div class="display-6 fw-bold mb-1">{{ repo.name }}</div>
        <div class="small text-body-secondary">{{ repo.page_count }} pages</div>
        {% if repo.pages_enabled %}
        <span class="badge text-bg-success mt-2">live</span>
        {% else %}
        <span class="badge text-bg-warning mt-2">pending</span>
        {% endif %}
      </div>
    {% if repo.pages_enabled %}
    </a>
    {% else %}
    </div>
    {% endif %}
  </div>
  {% endfor %}
</div>

<p class="text-center text-body-secondary">
  <a href="{{ '/hub/' | relative_url }}">See the full dashboard →</a>
</p>

{% else %}

> The hub registry has no data yet. Run `./scripts/sync-hub-metadata.sh` to
> populate it from the repositories in
> [`_data/hub.yml`](https://github.com/{{ site.repository | join: '' }}/blob/main/_data/hub.yml).

{% endif %}
