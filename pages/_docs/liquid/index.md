---
title: Liquid
description: Liquid templating basics used by Jekyll and this theme.
layout: default
categories:
    - docs
    - liquid
tags:
    - liquid
    - jekyll
permalink: /docs/liquid/
difficulty: beginner
estimated_time: 5 minutes
prerequisites: []
updated: 2025-12-20
lastmod: 2025-12-20T22:15:46.126Z
sidebar:
    nav: docs
---

# Liquid

Liquid is the templating language used by Jekyll to process templates and create dynamic content.

## Basic Syntax

### Output (Double Braces)

{% raw %}
```liquid
{{ page.title }}
{{ site.description }}
{{ content }}
```
{% endraw %}

### Logic (Braces with Percent)

{% raw %}
```liquid
{% if page.title %}
  <h1>{{ page.title }}</h1>
{% endif %}

{% for post in site.posts %}
  <li>{{ post.title }}</li>
{% endfor %}
```
{% endraw %}

## Common Filters

### Text Manipulation

{% raw %}
```liquid
{{ "hello" | capitalize }}       <!-- Hello -->
{{ "hello world" | upcase }}     <!-- HELLO WORLD -->
{{ page.content | truncate: 100 }}
{{ page.content | strip_html }}
```
{% endraw %}

### URL Helpers

{% raw %}
```liquid
{{ "/about/" | relative_url }}   <!-- Prepends baseurl -->
{{ "/about/" | absolute_url }}   <!-- Full URL with domain -->
```
{% endraw %}

### Date Formatting

{% raw %}
```liquid
{{ page.date | date: "%B %d, %Y" }}  <!-- January 15, 2025 -->
{{ page.date | date_to_xmlschema }}   <!-- 2025-01-15T00:00:00+00:00 -->
```
{% endraw %}

### Arrays

{% raw %}
```liquid
{{ page.tags | join: ", " }}
{{ site.posts | size }}
{{ page.categories | first }}
```
{% endraw %}

## Control Flow

### Conditionals

{% raw %}
```liquid
{% if page.layout == "post" %}
  <!-- Post content -->
{% elsif page.layout == "page" %}
  <!-- Page content -->
{% else %}
  <!-- Default content -->
{% endif %}
```
{% endraw %}

### Loops

{% raw %}
```liquid
{% for post in site.posts limit:5 %}
  <a href="{{ post.url }}">{{ post.title }}</a>
{% endfor %}

{% for tag in page.tags %}
  <span>{{ tag }}</span>
{% endfor %}
```
{% endraw %}

## Includes

Include reusable components:

{% raw %}
```liquid
{% include navigation/navbar.html %}
{% include components/post-card.html post=post %}
```
{% endraw %}

Pass parameters to includes:

{% raw %}
```liquid
{% include card.html 
   title="My Card" 
   content="Card content here" 
%}
```
{% endraw %}

## Theme Examples

Explore Liquid usage in Zer0-Mistakes:

- `_layouts/` - Page templates
- `_includes/` - Reusable components
- `_includes/navigation/` - Navigation components

## Resources

- [Liquid Documentation](https://shopify.github.io/liquid/)
- [Jekyll Liquid Reference](https://jekyllrb.com/docs/liquid/)
- [Liquid Cheat Sheet](https://www.shopify.com/partners/shopify-cheat-sheet)

## Related

- [Jekyll Guide](/docs/jekyll/)
- [Front Matter](/docs/front-matter/)
- [Jekyll Liquid Templating](/docs/jekyll/jekyll-liquid/)
