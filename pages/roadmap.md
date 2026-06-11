---
title: "Roadmap"
description: "Development roadmap for the zer0-mistakes Jekyll theme — past releases, current focus, and future plans."
layout: default
permalink: /roadmap/
date: 2026-04-18T00:00:00.000Z
lastmod: 2026-04-18T00:00:00.000Z
mermaid: true
tags:
  - roadmap
  - releases
  - planning
categories:
  - documentation
---

# {{ page.title }}

{{ site.data.roadmap.meta.tagline }} All versions follow [Semantic Versioning](https://semver.org/).

> **Single source of truth.** This page and the [README roadmap section](https://github.com/bamr87/zer0-mistakes#-roadmap) are both rendered from [`_data/roadmap.yml`](https://github.com/bamr87/zer0-mistakes/blob/main/_data/roadmap.yml). Edit that file (and run `./scripts/generate-roadmap.sh` to refresh the README) to update the roadmap everywhere.
>
> _Last reviewed: {{ site.data.roadmap.meta.updated }}_

---

## Visual Timeline

```mermaid
gantt
    title {{ site.data.roadmap.meta.title }}
    dateFormat YYYY-MM
{%- assign sections = "" | split: "" -%}
{%- for m in site.data.roadmap.milestones -%}
  {%- unless sections contains m.section -%}
    {%- assign sections = sections | push: m.section -%}
  {%- endunless -%}
{%- endfor %}
{%- for section in sections %}
    section {{ section }}
{%- for m in site.data.roadmap.milestones -%}
{%- if m.section == section %}
{%- if m.status == "completed" %}{% assign prefix = "done, " %}
{%- elsif m.status == "active" %}{% assign prefix = "active, " %}
{%- elsif m.status == "milestone" %}{% assign prefix = "milestone, " %}
{%- else %}{% assign prefix = "" %}{% endif -%}
{%- if m.status == "milestone" %}{% assign range = m.start | append: ", 1d" %}
{%- else %}{% assign range = m.start | append: ", " | append: m.end %}{% endif %}
    v{{ m.version }} {{ m.title }} :{{ prefix }}{{ range }}
{%- endif -%}
{%- endfor -%}
{%- endfor %}
```

---

## Release Summary

| Version | Status | Target | Summary |
|---------|--------|--------|---------|
{%- for m in site.data.roadmap.milestones %}
{%- case m.status %}
{%- when "completed" %}{% assign status_label = "✅ Completed" %}{% assign target_label = m.released | default: m.target %}
{%- when "active" %}{% assign status_label = "🚧 In Progress" %}{% assign target_label = m.target %}
{%- when "milestone" %}{% assign status_label = "🎯 Milestone" %}{% assign target_label = m.target %}
{%- else %}{% assign status_label = "🗓 Planned" %}{% assign target_label = m.target %}
{%- endcase %}
| **v{{ m.version }}** | {{ status_label }} | {{ target_label }} | {{ m.summary }} |
{%- endfor %}

See the full [CHANGELOG](/CHANGELOG) for detailed release notes.

---

## Milestone Detail

{% for m in site.data.roadmap.milestones %}
### v{{ m.version }} — {{ m.title }}

{% case m.status -%}
{% when "completed" %}**Status:** ✅ Completed{% if m.released %} ({{ m.released }}){% endif %}
{% when "active" %}**Status:** 🚧 In Progress &nbsp;·&nbsp; **Target:** {{ m.target }}
{% when "milestone" %}**Status:** 🎯 Milestone &nbsp;·&nbsp; **Target:** {{ m.target }}
{% else %}**Status:** 🗓 Planned &nbsp;·&nbsp; **Target:** {{ m.target }}
{% endcase %}

{{ m.summary }}

{% if m.features and m.features.size > 0 -%}
**Highlights:**

{% for feature in m.features -%}
- {{ feature }}
{% endfor %}
{%- endif %}

---
{% endfor %}

## How We Prioritize

Roadmap priorities are informed by:

{% for signal in site.data.roadmap.prioritization -%}
{{ forloop.index }}. {{ signal }}
{% endfor %}

Want to influence the roadmap? [Open a discussion](https://github.com/bamr87/zer0-mistakes/discussions) with your use case, or [propose an edit](https://github.com/bamr87/zer0-mistakes/edit/main/_data/roadmap.yml) to `_data/roadmap.yml` directly.

