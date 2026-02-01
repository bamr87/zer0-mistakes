---
title: "Jekyll Front Matter Reference"
description: "Complete reference for Jekyll front matter variables used in the Zer0-Mistakes theme with examples and best practices"
layout: note
date: 2026-01-29T10:00:00.000Z
lastmod: 2026-01-31T10:00:00.000Z
categories: [Notes, Documentation]
tags: [jekyll, yaml, front-matter, documentation]
author: "Zer0-Mistakes Team"
difficulty: beginner
comments: true
permalink: /notes/jekyll-front-matter/
---

## What is Front Matter?

Front matter is YAML metadata at the beginning of any Jekyll file (Markdown or HTML). It must be the first thing in the file and must be enclosed between triple-dashed lines.

```yaml
---
title: "My Page Title"
layout: default
---

Page content starts here...
```

---

## Core Variables

### Required for All Pages

```yaml
---
title: "Page Title"           # Required - Display title
layout: default               # Required - Template to use
---
```

### Common Optional Variables

```yaml
---
title: "My Page"
description: "SEO description (150-160 characters)"
date: 2026-01-31T10:00:00.000Z
lastmod: 2026-01-31T10:00:00.000Z
author: "Author Name"
permalink: /custom-url/
published: true                # Set to false to hide
draft: false                   # Draft status
---
```

---

## Layout-Specific Variables

### Blog Posts (`layout: article`)

```yaml
---
title: "Blog Post Title"
description: "Post description for SEO"
layout: article
date: 2026-01-31T10:00:00.000Z
lastmod: 2026-01-31T10:00:00.000Z
categories: [Category, Subcategory]
tags: [tag1, tag2, tag3]
author: "Author Name"

# Article-specific
post_type: standard           # standard, featured, breaking, tutorial
featured: false               # Feature on homepage
preview: /assets/images/preview.png  # Preview image

# Engagement
comments: true                # Enable comments
share: true                   # Show share buttons
related: true                 # Show related posts

# Sidebar
sidebar: true
author_profile: true
read_time: true
---
```

### Documentation (`layout: default`)

```yaml
---
title: "Documentation Page"
description: "Doc page description"
layout: default
categories: [docs, category]
tags: [documentation]
permalink: /docs/page-name/

# Documentation-specific
difficulty: beginner          # beginner, intermediate, advanced
estimated_time: 10 minutes
prerequisites: []
updated: 2026-01-31

# Sidebar navigation
sidebar:
  nav: docs                   # Navigation group name
  # OR
  nav: auto                   # Auto-generate
  # OR
  nav: tree                   # Tree view

toc_sticky: true              # Sticky table of contents
---
```

### Notes (`layout: note`)

```yaml
---
title: "Note Title"
description: "Brief note description"
layout: note
date: 2026-01-31T10:00:00.000Z
lastmod: 2026-01-31T10:00:00.000Z
categories: [Notes, Category]
tags: [reference, cheatsheet]
author: "Author Name"
difficulty: beginner
comments: true
permalink: /notes/note-name/
---
```

### Notebooks (`layout: notebook`)

```yaml
---
title: "Jupyter Notebook Title"
description: "Notebook description"
layout: notebook
collection: notebooks
date: 2026-01-31T10:00:00.000Z
lastmod: 2026-01-31T10:00:00.000Z
categories: [Notebooks, Data Science]
tags: [python, pandas, jupyter]
author: "Author Name"

# Notebook-specific
jupyter_metadata: true        # Show kernel info
difficulty: intermediate

# Engagement
comments: true
share: true
related: true

permalink: /notebooks/notebook-name/
---
```

### Landing Pages (`layout: landing`)

```yaml
---
title: "Landing Page"
description: "Landing page description"
layout: landing
permalink: /landing/

# Hero section
hero:
  title: "Hero Title"
  subtitle: "Hero subtitle text"
  cta_text: "Get Started"
  cta_url: /quickstart/
  background: /assets/images/hero-bg.jpg

# Features section
features:
  - title: "Feature 1"
    description: "Feature description"
    icon: "bi-lightning"
---
```

---

## Organization Variables

### Categories

Categories create a hierarchical organization. Use arrays for multiple levels:

```yaml
# Single category
categories: Documentation

# Multiple categories (hierarchy)
categories: [Development, Jekyll, Themes]

# Will create URL: /categories/development/jekyll/themes/
```

### Tags

Tags are flat labels for content discovery:

```yaml
# Single tag
tags: jekyll

# Multiple tags (array)
tags: [jekyll, ruby, static-site, tutorial]

# Alternative syntax
tags:
  - jekyll
  - ruby
  - static-site
```

---

## SEO Variables

```yaml
---
title: "Page Title"           # Used in <title> tag
description: "Meta description for search engines (150-160 chars)"

# Open Graph (Social sharing)
og_image: /assets/images/og-image.png
og_type: article              # website, article, etc.

# Twitter Cards
twitter_card: summary_large_image
twitter_image: /assets/images/twitter-card.png

# Canonical URL (prevent duplicates)
canonical_url: https://example.com/original-page/

# Robots
noindex: false                # Exclude from search engines
nofollow: false               # Don't follow links
---
```

---

## Navigation Variables

### Sidebar Configuration

```yaml
---
sidebar:
  nav: docs                   # Use named navigation from _data/navigation/
  
# OR auto-generate based on content
sidebar:
  nav: auto

# OR tree view
sidebar:
  nav: tree

# Disable sidebar
sidebar: false
---
```

### Table of Contents

```yaml
---
toc: true                     # Enable ToC
toc_label: "Contents"         # Custom label
toc_icon: "list"              # Bootstrap icon
toc_sticky: true              # Stick to viewport
toc_levels: "1..3"            # Heading levels to include
---
```

---

## Date Formats

Jekyll accepts various date formats:

```yaml
# ISO 8601 (Recommended)
date: 2026-01-31T10:00:00.000Z

# Date only
date: 2026-01-31

# With timezone
date: 2026-01-31 10:00:00 -0500

# In filename
# 2026-01-31-post-title.md automatically sets date
```

---

## Custom Variables

You can define any custom variables:

```yaml
---
title: "My Page"
layout: default

# Custom variables
project_version: "2.0.0"
github_repo: "user/repo"
demo_url: "https://demo.example.com"
sponsors:
  - name: "Sponsor 1"
    url: "https://sponsor1.com"
  - name: "Sponsor 2"
    url: "https://sponsor2.com"
---

<!-- Access in templates -->
Version: {{ page.project_version }}
Repo: {{ page.github_repo }}
```

---

## Collection-Specific Defaults

Define defaults in `_config.yml` to avoid repetition:

```yaml
# _config.yml
defaults:
  # All pages
  - scope:
      path: ""
    values:
      layout: default
      author_profile: false

  # Posts collection
  - scope:
      path: pages/_posts
    values:
      layout: article
      comments: true
      share: true

  # Notes collection  
  - scope:
      path: pages/_notes
      type: notes
    values:
      layout: note
      comments: true
```

---

## Variables Reference Table

| Variable | Type | Description |
|----------|------|-------------|
| `title` | string | Page title |
| `description` | string | Meta description |
| `layout` | string | Template name |
| `date` | datetime | Publication date |
| `lastmod` | datetime | Last modified |
| `author` | string | Author name |
| `categories` | array | Content categories |
| `tags` | array | Content tags |
| `permalink` | string | Custom URL |
| `published` | boolean | Publish status |
| `draft` | boolean | Draft status |
| `comments` | boolean | Enable comments |
| `share` | boolean | Show share buttons |
| `sidebar` | object/boolean | Sidebar config |
| `toc` | boolean | Table of contents |
| `difficulty` | string | Content difficulty |

---

## Best Practices

1. **Always include `title` and `layout`** - These are essential for proper rendering

2. **Write good descriptions** - Keep between 150-160 characters for SEO

3. **Use ISO 8601 dates** - `2026-01-31T10:00:00.000Z` for consistency

4. **Limit tags to 5-7** - Too many tags dilute their usefulness

5. **Use meaningful categories** - 2-3 levels maximum

6. **Set `lastmod` when updating** - Helps with SEO and user trust

7. **Use permalinks** - Stable URLs prevent broken links

8. **Don't forget `description`** - Critical for SEO and social sharing

---

## Resources

- [Jekyll Front Matter Docs](https://jekyllrb.com/docs/front-matter/)
- [YAML Syntax Guide](https://yaml.org/spec/1.2.2/)
- [Zer0-Mistakes Theme Documentation](/docs/)
