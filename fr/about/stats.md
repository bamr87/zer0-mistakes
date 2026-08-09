---
title: Portail de statistiques du site
description: Analyses et métriques complètes pour la base de connaissances Zer0-Mistakes
preview: "/images/previews/site-statistics-portal.png"
layout: admin
icon: bi-bar-chart-line
lastmod: 2026-04-04 00:00:00.000000000 Z
excerpt: Analyses et métriques complètes pour le contenu de votre site.
lang: fr
permalink: "/fr/about/stats/"
translation_of: pages/_about/stats.md
translation_source_url: "/about/stats/"
machine_translated: true
translated_from_sha: 06c9f7519562
---

{% include stats/stats-header.html %}

{% if site.data.content_statistics %}

  {% include stats/stats-overview.html %}

  <div class="row g-4 mb-5">
    <div class="col-lg-6">
      {% include stats/stats-categories.html %}
    </div>
    <div class="col-lg-6">
      {% include stats/stats-tags.html %}
    </div>
  </div>

  {% include stats/stats-metrics.html %}

{% else %}

  {% include stats/stats-no-data.html %}

{% endif %}
