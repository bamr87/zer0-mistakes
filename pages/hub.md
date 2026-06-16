---
title: Content Hub
description: >-
  Browse, monitor, and maintain every content site in the organization. Each
  repository publishes its own GitHub Pages site with the zer0-mistakes theme;
  this dashboard tracks them all in one place.
layout: default
permalink: /hub/
sidebar:
  nav: hub
---

# Content Hub

Every repository in the organization publishes **its own** GitHub Pages site —
content stays in each repo and renders with the shared
[zer0-mistakes]({{ site.repository | prepend: "https://github.com/" }}) theme
via `remote_theme`. This page is the dashboard that tracks them all; the data
below is refreshed automatically by the
[hub metadata sync]({{ site.repository | prepend: "https://github.com/" }}/blob/main/scripts/sync-hub-metadata.rb).

{% assign hub = site.data.hub_index %}
{% if hub and hub.repos and hub.repos.size > 0 %}

<p class="text-body-secondary">
  <i class="bi bi-collection me-1"></i>
  {{ hub.totals.repos }} repositories · {{ hub.totals.pages }} content pages ·
  org <a href="https://github.com/{{ hub.org }}">{{ hub.org }}</a>
</p>

<div class="row row-cols-1 row-cols-md-2 g-4 mb-5">
  {% for repo in hub.repos %}
  <div class="col">
    <div class="card h-100">
      <div class="card-body">
        <h2 class="card-title h5 mb-2 d-flex align-items-center">
          <i class="bi bi-journal-richtext me-2"></i>
          <span class="flex-grow-1">{{ repo.title | default: repo.name }}</span>
          {% if repo.pages_enabled %}
          <span class="badge text-bg-success" title="GitHub Pages is live">live</span>
          {% else %}
          <span class="badge text-bg-warning" title="GitHub Pages not enabled yet">pending</span>
          {% endif %}
        </h2>
        {% if repo.description and repo.description != "" %}
        <p class="card-text">{{ repo.description }}</p>
        {% endif %}
        <p class="card-text small text-body-secondary mb-2">
          {{ repo.page_count }} pages · {{ repo.sections.size }} sections
          {% if repo.pushed_at and repo.pushed_at != "" %}
          · updated {{ repo.pushed_at | date: "%Y-%m-%d" }}
          {% endif %}
          {% unless repo.scaffolded %}
          · <span class="text-warning">not scaffolded</span>
          {% endunless %}
        </p>
        {% for section in repo.sections %}
          <a class="badge text-bg-light text-decoration-none me-1 mb-1"
             href="{{ section.url }}">{{ section.title }} ({{ section.count }})</a>
        {% endfor %}
      </div>
      <div class="card-footer bg-transparent d-flex gap-2">
        {% if repo.pages_enabled %}
        <a class="btn btn-sm btn-primary" href="{{ repo.site_url }}" target="_blank" rel="noopener">
          <i class="bi bi-box-arrow-up-right me-1"></i>Visit site
        </a>
        {% else %}
        <span class="btn btn-sm btn-outline-secondary disabled">
          <i class="bi bi-hourglass-split me-1"></i>Pages pending
        </span>
        {% endif %}
        <a class="btn btn-sm btn-outline-secondary" href="{{ repo.url }}" target="_blank" rel="noopener">
          <i class="bi bi-github me-1"></i>Source
        </a>
      </div>
    </div>
  </div>
  {% endfor %}
</div>

> **Add a repository:** auto-discovery picks up new org repos on the next
> metadata sync. To publish one as a Pages site, run
> `./scripts/provision-org-sites.sh --enable-pages` from the theme repo.

{% else %}

> No hub data yet. Run `./scripts/sync-hub-metadata.sh` to populate the
> dashboard from the repositories registered in
> [`_data/hub.yml`]({{ site.repository | prepend: "https://github.com/" }}/blob/main/_data/hub.yml),
> or wait for the scheduled **Hub Metadata Sync** workflow.

{% endif %}
