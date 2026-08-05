---
layout: default
title: Publications
permalink: /publications/
description: Longer work growing out of the numbered entries.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

The original site keeps a Publications section for work that outgrows a single numbered entry.

<div class="mn-pubs">
  <article class="mn-pub">
    <h2 class="mn-pub__title">Read it on the original site</h2>
    <p class="mn-pub__meta">Swerve of Shore</p>
    <p class="mn-pub__body">
      This rebuild carries the navigation but not the publication list — that
      belongs with the writing it collects.
    </p>
    <p class="mn-pub__links">
      <a class="btn btn-outline-dark btn-sm" href="{{ site.source_site.url }}">
        Visit {{ site.source_site.name }}
      </a>
    </p>
  </article>

  <article class="mn-pub">
    <h2 class="mn-pub__title">The guides</h2>
    <p class="mn-pub__meta">Ulysses · episode by episode</p>
    <p class="mn-pub__body">
      Several entries in the Ulysses sequence are reading guides rather than
      essays — colour-coded notes tracking translated phrases, word glosses, and
      plot beats through an episode. They are marked in-progress on the original
      and grow as the reading advances.
    </p>
    <p class="mn-pub__links">
      <a class="btn btn-outline-dark btn-sm" href="{{ '/series/ulysses/' | relative_url }}">
        Browse the episodes
      </a>
    </p>
  </article>
</div>

{% include subscribe-band.html %}
