---
title: Jekyll Collections
description: Organized content collections for posts, docs, notebooks, and other content types with custom permalinks.
layout: default
categories:
    - docs
    - jekyll
tags:
    - collections
    - jekyll
    - content
    - organization
permalink: /docs/jekyll/collections/
difficulty: intermediate
estimated_time: 15 minutes
sidebar:
    nav: docs
---

# Jekyll Collections

The Zer0-Mistakes theme uses Jekyll collections to organize different content types with custom permalinks and layouts.

## Available Collections

| Collection | Location | Permalink | Layout |
|------------|----------|-----------|--------|
| `posts` | `pages/_posts/` | `/posts/:year/:month/:day/:title/` | `journals` |
| `docs` | `pages/_docs/` | `/docs/:path/` | `default` |
| `notebooks` | `pages/_notebooks/` | `/notebooks/:basename/` | `notebook` |
| `about` | `pages/_about/` | `/about/:title/` | `default` |
| `quickstart` | `pages/_quickstart/` | `/quickstart/:title/` | `default` |

## Configuration

### Collection Definition

```yaml
# _config.yml
collections:
  posts:
    output: true
    permalink: /posts/:year/:month/:day/:title/
  docs:
    output: true
    permalink: /docs/:path/
  notebooks:
    output: true
    permalink: /notebooks/:basename/
  about:
    output: true
    permalink: /about/:title/
  quickstart:
    output: true
    permalink: /quickstart/:title/
```

### Collection Defaults

```yaml
# _config.yml
defaults:
  # Posts
  - scope:
      path: "pages/_posts"
      type: posts
    values:
      layout: journals
      author: default
      
  # Documentation
  - scope:
      path: "pages/_docs"
      type: docs
    values:
      layout: default
      sidebar:
        nav: docs
        
  # Notebooks
  - scope:
      path: "pages/_notebooks"
      type: notebooks
    values:
      layout: notebook
      mathjax: true
      toc: true
```

## Creating Content

### Posts

Create in `pages/_posts/`:

```yaml
---
title: "My Blog Post"
date: 2025-01-25
categories: [technology, jekyll]
tags: [tutorial, beginner]
preview: /images/previews/my-post.png
---

Post content here...
```

Filename format: `YYYY-MM-DD-title-slug.md`

### Documentation

Create in `pages/_docs/`:

```yaml
---
title: "Getting Started"
description: "Quick start guide for new users"
permalink: /docs/getting-started/
difficulty: beginner
estimated_time: 10 minutes
---

Documentation content...
```

### Notebooks

Create in `pages/_notebooks/`:

```yaml
---
title: "Data Analysis Example"
description: "Jupyter notebook demonstrating data analysis"
kernel: python3
---
```

Or use `.ipynb` files with conversion script.

## Accessing Collections

### In Templates

```liquid
{% raw %}<!-- Loop through all docs -->
{% for doc in site.docs %}
  <a href="{{ doc.url }}">{{ doc.title }}</a>
{% endfor %}

<!-- Filter by category -->
{% assign tutorials = site.docs | where: "category", "tutorials" %}

<!-- Sort by date -->
{% assign recent = site.posts | sort: "date" | reverse %}{% endraw %}
```

### Collection Properties

```liquid
{% raw %}{{ site.docs.size }}         <!-- Number of docs -->
{{ site.docs.first.title }}  <!-- First doc title -->
{{ site.posts.last.date }}   <!-- Last post date -->{% endraw %}
```

## Custom Collections

### Creating New Collection

1. **Add to config**:

```yaml
collections:
  tutorials:
    output: true
    permalink: /tutorials/:title/
```

2. **Set defaults**:

```yaml
defaults:
  - scope:
      path: "pages/_tutorials"
      type: tutorials
    values:
      layout: tutorial
```

3. **Create directory**:

```bash
mkdir pages/_tutorials
```

4. **Add content**:

```yaml
---
title: "My Tutorial"
difficulty: beginner
---
```

## Organization Strategies

### By Category

```
pages/_docs/
├── getting-started/
│   ├── index.md
│   └── quick-start.md
├── features/
│   ├── index.md
│   └── feature-name.md
└── customization/
    ├── index.md
    └── styles.md
```

### By Date

```
pages/_posts/
├── 2025-01-25-first-post.md
├── 2025-01-24-second-post.md
└── 2025-01-23-third-post.md
```

### By Topic

```
pages/_notebooks/
├── data-science/
│   ├── pandas-basics.ipynb
│   └── visualization.ipynb
└── machine-learning/
    └── classification.ipynb
```

## Permalinks

### Permalink Variables

| Variable | Description |
|----------|-------------|
| `:collection` | Collection name |
| `:path` | Path from collection root |
| `:name` | Filename without extension |
| `:title` | Slugified title |
| `:basename` | Filename without date |
| `:year` | 4-digit year |
| `:month` | 2-digit month |
| `:day` | 2-digit day |

### Custom Permalinks

```yaml
# In front matter
---
permalink: /my-custom-url/
---
```

### Pretty URLs

```yaml
# _config.yml
permalink: pretty  # Adds trailing slash
```

## Collection Pages

### Index Pages

Create collection index pages:

```yaml
# pages/_docs/index.md
---
title: Documentation
layout: collection
collection: docs
---

Welcome to the documentation...
```

### Collection Layout

```html
{% raw %}<!-- _layouts/collection.html -->
---
layout: default
---

<h1>{{ page.title }}</h1>

{% assign items = site[page.collection] | sort: "title" %}
{% for item in items %}
  <article>
    <h2><a href="{{ item.url }}">{{ item.title }}</a></h2>
    <p>{{ item.description }}</p>
  </article>
{% endfor %}{% endraw %}
```

## Best Practices

### Naming Conventions

- Use lowercase for directories
- Use hyphens in filenames
- Keep URLs short and descriptive

### Front Matter

- Always include `title`
- Add `description` for SEO
- Use consistent date format

### Organization

- Group related content
- Use index pages for sections
- Keep hierarchy shallow

## Troubleshooting

### Collection Not Appearing

1. Verify `output: true` in config
2. Check directory path matches config
3. Ensure files have front matter

### Wrong Permalink

1. Check permalink pattern in config
2. Verify front matter permalink
3. Clear Jekyll cache

### Missing Defaults

1. Verify scope path is correct
2. Check type matches collection name
3. Restart Jekyll server

## Related

- [Jekyll Configuration](/docs/jekyll/jekyll-config/)
- [Layouts](/docs/customization/layouts/)
- [Front Matter](/docs/front-matter/)
