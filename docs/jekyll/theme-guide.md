---
title: Jekyll Theme Guide
description: "Comprehensive guide to using and customizing the Zer0-Mistakes Jekyll theme with Docker-first development, Bootstrap 5, and modern integrations."
date: 2026-01-24T00:00:00.000Z
lastmod: 2026-01-24T00:00:00.000Z
tags:
  - jekyll
  - tutorial
  - customization
  - docker
  - bootstrap
categories:
  - Jekyll
  - Getting Started
layout: default
permalink: /docs/jekyll/theme-guide/
difficulty_level: beginner
estimated_time: "30 minutes"
prerequisites:
  - Docker Desktop installed
  - Basic command line knowledge
  - Text editor (VS Code recommended)
keywords:
  primary: ["jekyll theme", "zer0-mistakes", "static site"]
  secondary: ["docker development", "bootstrap 5", "customization"]
---

# Jekyll Theme Guide

> Complete guide to the Zer0-Mistakes Jekyll theme — from setup to customization to deployment.

## Overview

The Zer0-Mistakes theme is a Docker-first Jekyll theme with:

- **Bootstrap 5.3** — Modern, responsive UI framework
- **Giscus Comments** — GitHub Discussions-powered comments
- **PostHog Analytics** — Privacy-first analytics
- **Mermaid Diagrams** — Text-based diagramming
- **MathJax** — Mathematical notation
- **GitHub Pages Compatible** — Works with free GitHub hosting

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/bamr87/zer0-mistakes.git
cd zer0-mistakes

# Start development server
docker-compose up

# Site available at http://localhost:4000
```

### Using Ruby (Alternative)

```bash
# Install dependencies
bundle install

# Start development server
bundle exec jekyll serve --config "_config.yml,_config_dev.yml"
```

---

## Project Structure

```
zer0-mistakes/
├── _config.yml          # Production configuration
├── _config_dev.yml      # Development overrides
├── _layouts/            # Page templates
│   ├── root.html        # Base HTML structure
│   ├── default.html     # Main wrapper
│   ├── journals.html    # Blog posts
│   └── home.html        # Homepage
├── _includes/           # Reusable components
│   ├── core/            # head, header, footer
│   ├── content/         # giscus, toc, seo
│   ├── analytics/       # posthog, google
│   └── navigation/      # sidebar, breadcrumbs
├── _sass/               # Stylesheets
├── assets/              # Static files
│   ├── css/
│   ├── js/
│   └── images/
├── pages/               # Content collections
│   ├── _posts/          # Blog posts
│   └── _docs/           # Documentation
└── docker-compose.yml   # Docker configuration
```

---

## Configuration

### Dual Configuration System

The theme uses two configuration files:

| File | Purpose | When Used |
|------|---------|-----------|
| `_config.yml` | Production settings | GitHub Pages, Netlify |
| `_config_dev.yml` | Development overrides | Local development |

**Production** (`_config.yml`):
```yaml
remote_theme: "bamr87/zer0-mistakes"
posthog:
  enabled: true
```

**Development** (`_config_dev.yml`):
```yaml
remote_theme: false
posthog:
  enabled: false
show_drafts: true
```

### Key Configuration Options

```yaml
# Site Settings
title: "Your Site Title"
description: "Site description for SEO"
url: "https://yourdomain.com"
baseurl: ""  # Subpath, e.g., /blog

# Author
author:
  name: "Your Name"
  email: "you@example.com"
  bio: "About the author"

# Features
giscus:
  enabled: true
  data-repo-id: "YOUR_REPO_ID"
  data-category-id: "YOUR_CATEGORY_ID"

posthog:
  enabled: true
  api_key: "YOUR_API_KEY"

mermaid:
  src: 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
```

---

## Creating Content

### Blog Posts

Create posts in `pages/_posts/` with the naming convention:

```
YYYY-MM-DD-title-slug.md
```

**Example front matter:**

```yaml
---
title: "My Blog Post"
description: "A brief description (150-160 chars)"
date: 2026-01-24T10:00:00.000Z
layout: journals
categories: [Category, Subcategory]
tags: [tag1, tag2, tag3]
author: "Your Name"
permalink: /blog/my-post/
---

Your content here...
```

### Documentation Pages

Create docs in `pages/_docs/`:

```yaml
---
title: "Documentation Page"
description: "What this page covers"
layout: default
permalink: /docs/section/page-name/
difficulty_level: beginner
estimated_time: "10 minutes"
---
```

### Collections

Custom collections in `_config.yml`:

```yaml
collections:
  docs:
    output: true
    permalink: /docs/:path/
  tutorials:
    output: true
    permalink: /tutorials/:path/
```

---

## Liquid Templating

### Filtering and Sorting

```liquid
{% raw %}{% comment %} Filter posts by category {% endcomment %}
{% assign posts = site.posts | where: "categories", "Tutorial" %}

{% comment %} Sort by date, newest first {% endcomment %}
{% assign posts = site.posts | sort: "date" | reverse %}

{% comment %} Limit results {% endcomment %}
{% assign recent = site.posts | limit: 5 %}{% endraw %}
```

### Conditionals

```liquid
{% raw %}{% if page.layout == 'journals' %}
  <div class="post-meta">
    <time datetime="{{ page.date | date: '%Y-%m-%d' }}">
      {{ page.date | date: '%B %d, %Y' }}
    </time>
  </div>
{% endif %}{% endraw %}
```

### Loops

```liquid
{% raw %}{% for post in site.posts limit:10 %}
  <article>
    <h2><a href="{{ post.url }}">{{ post.title }}</a></h2>
    <p>{{ post.excerpt | strip_html | truncate: 150 }}</p>
  </article>
{% endfor %}{% endraw %}
```

### Safe Defaults

```liquid
{% raw %}{{ page.title | default: "Untitled" }}
{{ page.description | default: site.description }}
{{ page.author | default: site.author.name }}{% endraw %}
```

---

## Code Highlighting

### Configuration

The theme uses Kramdown with Rouge for syntax highlighting:

```yaml
# _config.yml
markdown: kramdown
highlighter: rouge

kramdown:
  input: GFM
  syntax_highlighter: rouge
```

### Usage

Specify the language after the opening fence:

````markdown
```python
def hello_world():
    print("Hello, World!")
```
````

**Supported languages:** Ruby, Python, JavaScript, HTML, CSS, YAML, JSON, Bash, and [many more](https://github.com/rouge-ruby/rouge/wiki/List-of-supported-languages-and-lexers).

---

## Links and References

### Internal Links

Use the `link` tag for validated internal links:

```liquid
{% raw %}[View Documentation]({% link pages/_docs/getting-started.md %})
[Read Post]({% link pages/_posts/2026-01-24-my-post.md %}){% endraw %}
```

**Benefits:**
- Build fails if link target doesn't exist
- Automatically handles URL changes

### External Links

Open in new tab with `target="_blank"`:

```markdown
[External Site](https://example.com){:target="_blank" rel="noopener"}
```

### Relative URLs

```liquid
{% raw %}<a href="{{ '/about/' | relative_url }}">About</a>
<img src="{{ '/assets/images/logo.png' | relative_url }}" alt="Logo">{% endraw %}
```

---

## Customization

### Layouts

Create custom layouts in `_layouts/`:

```html
---
layout: default
---
{% raw %}<article class="custom-layout">
  <header>
    <h1>{{ page.title }}</h1>
  </header>
  <div class="content">
    {{ content }}
  </div>
</article>{% endraw %}
```

### Includes

Create reusable components in `_includes/`:

```html
{% raw %}<!-- _includes/components/alert.html -->
<div class="alert alert-{{ include.type | default: 'info' }}">
  {{ include.message }}
</div>{% endraw %}
```

**Usage:**
```liquid
{% raw %}{% include components/alert.html type="warning" message="Important notice!" %}{% endraw %}
```

### Styling

Add custom styles in `_sass/custom.scss`:

```scss
// Custom variables
$primary-color: #007bff;

// Custom styles
.my-component {
  background: $primary-color;
  padding: 1rem;
  border-radius: 0.5rem;
}
```

---

## Features Reference

| Feature | Documentation | Front Matter |
|---------|---------------|--------------|
| Comments | [Giscus Guide](comments-giscus.md) | `comments: true` |
| Analytics | [PostHog Guide](analytics-posthog.md) | (auto) |
| Diagrams | [Mermaid Guide](diagrams-mermaid.md) | `mermaid: true` |
| Math | [MathJax Guide](math-mathjax.md) | `mathjax: true` |
| Pagination | [Pagination Guide](pagination.md) | (auto) |

---

## Deployment

### GitHub Pages

1. Push to GitHub repository
2. Go to Settings → Pages
3. Select source branch (usually `main`)
4. Site deploys automatically

### Netlify

1. Connect repository to Netlify
2. Build command: `jekyll build`
3. Publish directory: `_site`
4. Add `netlify.toml` for headers/redirects

### Custom Domain

See [Custom Domain Setup](custom-domain.md).

---

## Troubleshooting

### Docker Issues

```bash
# Rebuild containers
docker-compose down && docker-compose up --build

# View logs
docker-compose logs -f jekyll

# Access container shell
docker-compose exec jekyll bash
```

### Build Errors

```bash
# Check Jekyll configuration
bundle exec jekyll doctor

# Build with verbose output
bundle exec jekyll build --verbose --trace

# Clear cache
bundle exec jekyll clean
```

### Common Problems

| Issue | Solution |
|-------|----------|
| Port 4000 in use | Use `--port 4001` or stop other processes |
| Gem not found | Run `bundle install` |
| Styles not updating | Clear browser cache, run `jekyll clean` |
| Layout not found | Check `layout:` in front matter matches filename |

---

## Next Steps

- **[Giscus Comments](jekyll-comments-with-giscus.md)** — Add comment functionality
- **[PostHog Analytics](jekyll-analytics-with-posthog.md)** — Track site usage
- **[Mermaid Diagrams](jekyll-diagrams-with-mermaid.md)** — Create visual documentation
- **[Security Headers](jekyll-security.md)** — Harden your site

---

*This guide is part of the [Zer0-Mistakes Jekyll Theme](https://github.com/bamr87/zer0-mistakes) documentation.*
