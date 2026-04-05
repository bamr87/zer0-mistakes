---
title: "Site Statistics Portal"
description: "Comprehensive analytics and metrics for the Zer0-Mistakes knowledge base"
layout: admin
icon: bi-bar-chart-line
permalink: /about/stats/
lastmod: 2026-04-04T00:00:00.000Z
excerpt: Comprehensive analytics and metrics for your site content.
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
