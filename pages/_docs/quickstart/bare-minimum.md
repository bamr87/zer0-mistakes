---
lastmod: 2026-05-05T00:00:00.000Z
title: Bare-Minimum Remote-Theme Starter
description: Start a working GitHub Pages site that uses zer0-mistakes as a remote theme with just three files — _config.yml, Gemfile, and index.md.
preview: /images/previews/bare-minimum-remote-theme-starter.png
layout: default
categories:
  - docs
  - quickstart
tags:
  - setup
  - quickstart
  - remote-theme
  - github-pages
permalink: /docs/quickstart/bare-minimum/
difficulty: beginner
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
---

# Bare-Minimum Remote-Theme Starter

You can run a full zer0-mistakes site on GitHub Pages with only **three files**. Everything else — layouts, includes, Bootstrap assets — is loaded automatically from the published gem.

## The Three Files

### 1. `_config.yml`

```yaml
title: My Site
description: A site powered by zer0-mistakes
preview: /images/previews/bare-minimum-remote-theme-starter.png
remote_theme: bamr87/zer0-mistakes

plugins:
  - jekyll-remote-theme
  - jekyll-feed
  - jekyll-seo-tag
```

### 2. `Gemfile`

```ruby
source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins
gem "jekyll-remote-theme"
```

### 3. `index.md`

```markdown
---
layout: home
title: Welcome
---

Hello, world! This site uses the zer0-mistakes theme.
```

## Deploy to GitHub Pages

1. Create a new repository on GitHub (e.g. `my-site`)
2. Add the three files above
3. Go to **Settings → Pages → Source** and choose **Deploy from a branch → main**
4. GitHub Pages builds and publishes automatically

Your site will be live at `https://<username>.github.io/<repo>/` within a minute or two.

## Graceful Degradation

When collections (`_posts`, `_docs`, `_notes`, etc.) are absent, the theme's
footer, welcome partial, and info partial degrade gracefully — no Liquid errors
or broken layouts.

## Local Preview (Docker)

Add a `docker-compose.yml` to test locally:

```yaml
version: "3.8"
services:
  jekyll:
    image: jekyll/jekyll:latest
    platform: linux/amd64
    command: jekyll serve --config "_config.yml" --watch --force_polling --drafts
    ports:
      - "4000:4000"
    volumes:
      - .:/srv/jekyll
    environment:
      JEKYLL_ENV: development
```

Then run:

```bash
docker-compose up
```

Visit `http://localhost:4000`.

## Growing from the Starter

| Next Step | What to Add |
|-----------|-------------|
| Blog posts | `_posts/YYYY-MM-DD-title.md` |
| Documentation | `_docs/` collection + `_config.yml` entry |
| Custom nav | `_data/navigation.yml` |
| Analytics | `posthog:` or `google_analytics:` keys in `_config.yml` |
| Full theme | Use the [AI Install Wizard](/docs/getting-started/quick-start/) |

## See also

- [[Quick Start]]
- [[Installation]]
- [[Docker]]
