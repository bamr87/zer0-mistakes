---
title: Author Profiles
description: How to define author profiles and surface "About the Author" bylines, bio cards, and per-author profile pages across every collection in the Zer0-Mistakes theme.
layout: default
author: bamr87
categories:
  - docs
  - customization
tags:
  - authors
  - components
  - collections
  - seo
permalink: /docs/customization/author-profiles/
difficulty: beginner
estimated_reading_time: 8 minutes
---

The theme ships a single, layered author system so every collection — posts,
docs, notes, notebooks, quickstart, about, and any you add — presents authors
consistently: a linked byline with an avatar, an "About the Author" bio card,
and a per-author profile page that aggregates everything they've written.

## 1. Define authors in `_data/authors.yml`

`_data/authors.yml` is the single source of truth. Each top-level key is an
**author key** you reference from front matter.

```yaml
bamr87:
  name: "Amr Abdel-Motaleb"        # required — display name
  bio: "Creator of zer0-mistakes…" # shown in the bio card + profile hero
  avatar: "/images/authors/bamr87.png"  # path under public_folder (assets)
  role: "Creator & Lead Developer"
  github: "bamr87"
  twitter: "bamr87"
  linkedin: "bamr87"
  website: "https://zer0-mistakes.com"
  expertise:                       # optional — rendered as chips
    - "Jekyll theme development"
    - "Docker containerization"
  # profile: false                 # optional — opt out of a generated profile page
```

A `default` entry is used as the fallback for any unknown author. See the file
header for the full field list.

## 2. Reference an author from content

Set `author` in a page's front matter to an **author key**:

```yaml
---
title: My Post
author: bamr87
---
```

When the value matches a key, the theme renders the avatar, resolves the
display name, links the byline to the profile page, and shows the
"About the Author" card. If the value is a plain string that is *not* a key
(e.g. `author: "Jane Doe"`), it is shown as-is with no avatar or profile link —
so existing content keeps working.

## 3. What renders where

| Surface | Component | Appears in |
| --- | --- | --- |
| Inline byline | `components/author-card.html` (`style="inline"`) | `article`, `note`, `notebook`, `news`, `section`, `post-card` |
| "About the Author" card | `components/author-bio.html` → `author-card.html` (`style="full"`) | `article`, `note`, `notebook` |
| Profile hero + content grid | `_layouts/author.html` | `/authors/:key/` |
| Author directory | `_layouts/authors.html` | `/authors/` |

The "About the Author" card is gated by the `author_profile` front-matter flag
(defaulted to `true` for content collections in `_config.yml`). Set
`author_profile: false` on a page to hide it.

### Reusing the component directly

`components/author-card.html` is the rendering primitive. Drop it anywhere:

```liquid
{% raw %}{% include components/author-card.html author=page.author style="inline" %}
{% include components/author-card.html author="bamr87" style="full" %}
{% include components/author-card.html author=post.author style="inline" show_avatar=false %}{% endraw %}
```

Parameters: `style` (`inline`/`compact`/`full`), `link`, `show_avatar`,
`show_bio`, `show_social`, `show_expertise`, `avatar_size`, `name_itemprop`.

## 4. Profile pages

Each author gets a page at `/authors/:key/` that lists **all** of their content
across every collection (matched by author key, `name`, or `display_name`), and
they're all linked from the `/authors/` directory.

These pages are created two ways:

1. **Automatically** by `_plugins/author_pages_generator.rb` during a normal
   `jekyll build`. Opt a single author out with `profile: false`, or disable the
   generator entirely with `authors: { generate_pages: false }` in `_config.yml`.
2. **As committed pages** under `/authors/` in this repo. GitHub Pages' classic
   builder runs in *safe mode* and does not load custom plugins, so the pages
   for this site's authors are committed (just front matter — `layout: author`
   and `author_key`) the same way `search.json` and the sitemap are. The
   generator detects existing pages and skips them, so there are no duplicates.

To add a profile for a new author on a safe-mode site, copy an existing stub:

```yaml
---
layout: author
author_key: yourkey
title: Your Name
permalink: /authors/yourkey/
sidebar: false
---
```

## SEO / AIEO

Bylines and cards emit schema.org `Person` microdata (`name`, `image`,
`jobTitle`, `knowsAbout`, `sameAs`), reinforcing the E-E-A-T signals the theme
already surfaces via `components/author-eeat.html`.
