---
title: Layouts
description: Create and customize page layouts in the Zer0-Mistakes Jekyll theme.
layout: default
categories:
    - docs
    - customization
tags:
    - layouts
    - templates
    - jekyll
permalink: /docs/customization/layouts/
difficulty: intermediate
estimated_time: 15 minutes
sidebar:
    nav: docs
---

# Layouts

Layouts define the structure and appearance of your pages. The Zer0-Mistakes theme includes several built-in layouts.

## Available Layouts

| Layout | Purpose | Use Case |
|--------|---------|----------|
| `default` | Standard page with sidebar | Documentation, general pages |
| `journals` | Blog post layout | Blog posts with metadata |
| `home` | Homepage layout | Site homepage |
| `collection` | Collection index | Listing pages for collections |
| `landing` | Full-width page | Marketing/landing pages |
| `root` | Base HTML | Don't use directly |

## Using Layouts

Specify a layout in your page's front matter:

```yaml
---
title: "My Page"
layout: default
---
```

## Layout Hierarchy

Layouts inherit from each other:

```
root.html
└── default.html
    ├── home.html
    ├── journals.html
    ├── collection.html
    └── landing.html
```

## Creating Custom Layouts

### Step 1: Create the Layout File

Create a file in `_layouts/`:

```html
---
layout: default
---
<!-- _layouts/tutorial.html -->
<article class="tutorial">
  <header class="tutorial-header">
    <h1>{{ page.title }}</h1>
    <div class="meta">
      <span class="difficulty">{{ page.difficulty }}</span>
      <span class="time">{{ page.estimated_time }}</span>
    </div>
  </header>
  
  <div class="tutorial-content">
    {{ content }}
  </div>
  
  {% if page.next_tutorial %}
  <footer class="tutorial-footer">
    <a href="{{ page.next_tutorial }}">Next Tutorial →</a>
  </footer>
  {% endif %}
</article>
```

### Step 2: Use the Layout

```yaml
---
title: "Getting Started Tutorial"
layout: tutorial
difficulty: beginner
estimated_time: "15 minutes"
next_tutorial: /tutorials/part-2/
---
```

## Layout Variables

Access these variables in your layouts:

| Variable | Description |
|----------|-------------|
| `{{ content }}` | Page content (required) |
| `{{ page.title }}` | Page title |
| `{{ page.description }}` | Page description |
| `{{ page.layout }}` | Current layout name |
| `{{ page.url }}` | Page URL |
| `{{ site.title }}` | Site title |

## Overriding Theme Layouts

To customize a theme layout:

1. Copy the layout from the theme to your `_layouts/` directory
2. Modify as needed
3. Jekyll uses your version instead

## Conditional Content

Show content based on layout or page variables:

```html
{% raw %}{% if page.layout == 'journals' %}
  <div class="post-meta">
    <time>{{ page.date | date: "%B %d, %Y" }}</time>
    <span class="author">{{ page.author }}</span>
  </div>
{% endif %}

{% if page.sidebar %}
  {% include navigation/sidebar.html %}
{% endif %}{% endraw %}
```

## Including Components

Use includes for reusable parts:

```html
{% raw %}{% include core/head.html %}
{% include navigation/header.html %}
{% include content/toc.html %}
{% include core/footer.html %}{% endraw %}
```

## Best Practices

1. **Start with `default`** — Inherit from default for consistency
2. **Keep layouts focused** — Each layout should have one purpose
3. **Use includes** — Extract reusable components
4. **Document custom layouts** — Note purpose and required variables
5. **Test responsiveness** — Verify layouts work on all screen sizes

## Reference

- [Jekyll Layouts Documentation](https://jekyllrb.com/docs/layouts/)
- [Liquid Template Language](https://shopify.github.io/liquid/)
