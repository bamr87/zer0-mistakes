---
layout: author
author_key: guest
title: Become an Author — Contribute to zer0-mistakes
description: How to contribute articles and become a credited author on zer0-mistakes — the workflow, front matter, review process, and adding your own author profile.
permalink: /authors/guest/
sidebar: false
hide_intro: true
author_profile: false
---

The **Guest Author** credits one-off and first-time contributions. Anyone can
write for zer0-mistakes — this page is your starting point, from a single guest
post all the way to your own author profile.

## Contribute an article

1. **Fork** the repository and create a branch.
2. **Add your content** as Markdown in the matching collection under `pages/`:
   - `pages/_posts/` — articles & news (`layout: article`, filename `YYYY-MM-DD-slug.md`)
   - `pages/_docs/` — documentation (`layout: default`)
   - `pages/_notes/`, `pages/_quickstart/`, `pages/_notebooks/` — notes, guides, notebooks
3. **Add front matter** (template below) and write your piece. Aim for **≥ 300
   words**, a **30–60 char** `title`, a **120–160 char** `description`, 3–10
   `keywords`, and a `preview` image (see the
   [preview-image generator]({{ '/docs/features/preview-image-generator/' | relative_url }})).
4. **Preview locally** with `docker-compose up` → <http://localhost:4000>.
5. **Open a pull request.** An automated content review plus a maintainer review
   check SEO, accessibility, links, and accuracy before merge.

Credit a one-off contribution to the Guest author with `author: guest`.

### Front matter template

```yaml
---
title: "Your concise, descriptive title"
description: "A 120–160 character summary used for SEO and content cards."
author: guest            # or your own key once you have a profile (see below)
layout: article          # article | default — match the collection
date: 2026-01-01T09:00:00.000Z
lastmod: 2026-01-01T09:00:00.000Z
categories: [Tutorial]
tags: [jekyll, how-to]
keywords: [jekyll, contributing, how-to]
preview: /images/previews/your-slug.png
draft: false
---
```

## Become a recognized author

Contributing once, or planning to write regularly? Get your own byline, avatar,
and an aggregated profile page:

1. **Add yourself to [`_data/authors.yml`](https://github.com/bamr87/zer0-mistakes/blob/main/_data/authors.yml)**
   with a unique key:

   ```yaml
   yourkey:
     name: "Your Name"
     bio: "One or two sentences about you."
     avatar: "/images/authors/yourname.png"
     role: "Contributor"
     github: "yourhandle"
     tagline: "A one-line blurb for your profile hero."
     expertise:
       - "Topic one"
       - "Topic two"
   ```

2. **Use your key** in front matter — `author: yourkey`. Your linked byline, the
   "About the Author" card, and an aggregated profile at `/authors/yourkey/`
   (every post, doc, and note you write, across all collections) all light up
   automatically — no other code changes needed.
3. **On GitHub Pages (safe mode) only**, also commit a small profile stub so the
   page builds without the plugin. The full field list, the stub format, and how
   profile pages are generated live in
   [Author Profiles and About-the-Author Bylines]({{ '/docs/customization/author-profiles/' | relative_url }}).

That's it — your name now links to your profile everywhere you're credited.

## Writing with AI assistance

If a piece is AI-generated or AI-assisted, **disclose it**. Mark the author
`ai: true` with a `persona` block and follow the
[AI author template](https://github.com/bamr87/zer0-mistakes/blob/main/.github/prompts/ai-author.prompt.md);
the theme then shows an "AI" badge and an authorship disclosure automatically.
See [AI author personas]({{ '/docs/customization/author-profiles/' | relative_url }}#6-ai-author-personas)
for the two example personas, Cassandra and Vega.

## What the review checks

- **SEO / AIEO** — `title` and `description` lengths, `keywords`, slug, and a
  preview image.
- **Accessibility** — image alt text, heading order, and descriptive link text.
- **Accuracy & polish** — working links, code that runs, and a consistent voice.
- A **`CHANGELOG.md`** entry for user-visible content where it applies.

Questions, or want to propose a topic? Open an issue or start a discussion on
[GitHub](https://github.com/bamr87/zer0-mistakes). We're glad you're here.
