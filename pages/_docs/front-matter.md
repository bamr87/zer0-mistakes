---
title: Front Matter
description: How to use front matter for Jekyll pages, posts, and collections.
layout: default
categories:
    - docs
    - jekyll
tags:
    - front-matter
    - yaml
permalink: /docs/front-matter/
difficulty: beginner
estimated_time: 10 minutes
prerequisites: []
updated: 2025-12-20
lastmod: 2025-12-20T22:15:46.744Z
sidebar:
    nav: docs
---

# Front Matter

Front matter is YAML metadata at the top of Markdown or HTML files that controls how Jekyll processes the content.

## Basic Structure

```yaml
---
title: "My Page Title"
layout: default
permalink: /my-page/
---

Your content starts here...
```

## Required Fields

### For All Pages

```yaml
---
title: "Page Title"      # Required: Displayed in browser tab and headings
layout: default          # Required: Template to use from _layouts/
---
```

### For Blog Posts

```yaml
---
title: "Post Title"
layout: journals
date: 2025-01-15         # Required for posts: Publication date
---
```

## Common Optional Fields

### SEO & Metadata

```yaml
---
description: "A brief description for search engines (150-160 chars)"
author: "Your Name"
lastmod: 2025-01-20      # Last modified date
keywords:
  primary: ["keyword1", "keyword2"]
  secondary: ["keyword3"]
---
```

### Organization

```yaml
---
categories:
    - category1
    - subcategory
tags:
    - tag1
    - tag2
    - tag3
permalink: /custom-url/   # Override default URL
---
```

### Display Options

```yaml
---
preview: /images/preview.png    # Social sharing image
toc: true                       # Show table of contents
comments: true                  # Enable comments (if configured)
sidebar:
    nav: docs                   # Use 'docs' navigation in sidebar
---
```

## Layout Options

Available layouts in Zer0-Mistakes:

| Layout | Purpose |
|--------|---------|
| `default` | Standard page with sidebar |
| `journals` | Blog posts with metadata display |
| `home` | Homepage layout |
| `collection` | Collection index pages |
| `landing` | Full-width landing pages |

## Collection-Specific Fields

### Documentation (`_docs`)

```yaml
---
difficulty: beginner          # beginner, intermediate, advanced
estimated_time: "10 minutes"
prerequisites:
    - Docker installed
    - Basic Jekyll knowledge
updated: 2025-01-15
---
```

### Blog Posts (`_posts`)

```yaml
---
excerpt: "Custom excerpt for listings"
preview: /images/post-preview.png
featured: true               # Feature on homepage
---
```

## Navigation Sidebar

Control which navigation appears in the sidebar:

```yaml
---
sidebar:
    nav: docs      # Uses _data/navigation/docs.yml
---
```

Available navigation files:
- `main` - Primary site navigation
- `docs` - Documentation sidebar
- `quickstart` - Quick start guide

## Examples

### Complete Documentation Page

```yaml
---
title: "Installation Guide"
description: "Step-by-step installation instructions"
layout: default
categories:
    - docs
    - setup
tags:
    - installation
    - docker
permalink: /docs/installation/
difficulty: beginner
estimated_time: "10 minutes"
prerequisites:
    - Docker Desktop
updated: 2025-01-15
sidebar:
    nav: docs
---
```

### Complete Blog Post

```yaml
---
title: "Getting Started with Jekyll"
description: "Learn the basics of Jekyll static site generation"
layout: journals
date: 2025-01-15
lastmod: 2025-01-20
author: "Amr"
categories:
    - tutorials
    - jekyll
tags:
    - jekyll
    - getting-started
preview: /images/jekyll-tutorial.png
comments: true
---
```

## Related

- [Jekyll Guide](/docs/jekyll/)
- [Jekyll Configuration](/docs/jekyll/jekyll-config/)
- [Liquid Templating](/docs/liquid/)
