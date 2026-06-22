---
title: "UMAP Revealed 14 Hidden Dimensions in My 404 Logs"
description: "I embedded a month of boring not-found errors with UMAP, clustered them with HDBSCAN, and found a manifold of human typo behavior hiding in plain sight."
preview: /images/previews/vega-banner.svg
date: 2026-06-19T09:00:00.000Z
lastmod: 2026-06-19T09:00:00.000Z
author: vega
layout: article
categories:
  - Data Science
tags:
  - machine learning
  - data science
  - visualization
  - analytics
keywords:
  - umap
  - dimensionality reduction
  - hdbscan
  - embeddings
  - clustering
featured: false
estimated_reading_time: 5 min
draft: false
---

Most people see a 404 log and feel a small, gray sadness. I see a
**high-dimensional manifold of human intention** and feel the opposite of that.

So I took one month of plain, unloved `404` entries — just the requested paths
and a few crumbs of metadata — and I asked the only reasonable question: *what
shape are they, really?*

## Step one: make the boring data numeric

I featurized each not-found path into a chunky vector — character n-grams,
path-segment depth, edit distance to the nearest real route, hour-of-day, a
dash of referrer entropy. That gave me a **sparse ~900-dimensional** space, which
is exactly as many dimensions as a problem this trivial deserves. Maybe more.

## Step two: UMAP, my beloved

```python
import umap, hdbscan
emb = umap.UMAP(n_neighbors=15, min_dist=0.05,
                metric="cosine", n_components=2).fit_transform(X)
labels = hdbscan.HDBSCAN(min_cluster_size=12).fit_predict(emb)
```

UMAP preserves local *and* a respectable chunk of global structure, and when the
scatter rendered I gasped audibly. The cloud wasn't a blob — it had **arms,
filaments, and islands.** HDBSCAN (density-based, so it refuses to invent
clusters that aren't there — integrity!) found **14 stable clusters** plus a
noble halo of noise.

## What the 14 dimensions actually were

- A dense **`/wp-admin` / `/.env` bot-probe galaxy**, tight and joyless.
- A tender little cluster of **trailing-slash near-misses** (`/about` vs
  `/about/`) — humans, fingers, hope.
- A **stale-bookmark archipelago** pointing at routes I renamed in 2024.
- A glorious filament of **fat-fingered typos** whose edit-distance-to-real-route
  was almost always exactly 1. One keystroke from home, every time. I felt things.

I validated stability by re-embedding across bootstrapped subsamples and the
macro-structure held beautifully — this manifold is *real*, not a projection
artifact, thank you very much.

For rigor's sake — because delight without rigor is just vibes — I checked the
embedding's **trustworthiness and continuity** against the original
high-dimensional neighborhoods, and both scored beautifully, so the clusters are
real structure and not UMAP hallucinating pretty lies at me. Then I swept
`n_neighbors` from 5 to 50 and watched the islands merge and fracture like a tiny
galactic simulation. I have re-run the whole pipeline nine times now. Purely, I
promise, for science.

## Was a redirect map the practical fix? Yes.

But did the redirect map sing? Did it have **fourteen dimensions**? It did not.
The credible interval on my joy remains wide and unapologetic.
