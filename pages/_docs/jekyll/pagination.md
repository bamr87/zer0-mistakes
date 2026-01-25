---
title: Pagination
description: Implement previous/next navigation buttons and paginated post lists in your Jekyll site.
layout: default
categories:
    - docs
    - jekyll
tags:
    - pagination
    - jekyll
    - navigation
permalink: /docs/jekyll/pagination/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
---

# Pagination

> Add pagination buttons for navigating between pages and posts.

## Overview

Pagination provides convenience for users navigating through content. This guide covers:

1. Previous/Next buttons for posts
2. Paginated post lists
3. Keyboard shortcuts for navigation

## Previous/Next Navigation

### Basic Implementation

Create `_includes/pagination.html`:

```html
{% raw %}<ul class="pager">
  {% if page.previous.url %}
    <li><a class="btn btn-outline-primary" href="{{page.previous.url}}">Previous</a></li>
  {% else %}
    <li class="disable"><a class="btn btn-outline-primary disabled">Previous</a></li>
  {% endif %}
  {% if page.next.url %}
    <li class="next"><a class="btn btn-outline-primary" href="{{page.next.url}}">Next</a></li>
  {% else %}
    <li class="next disable"><a class="btn btn-outline-primary disabled">Next</a></li>
  {% endif %}
</ul>{% endraw %}
```

### Include in Your Layout

Add to your template (e.g., `_layouts/journals.html`):

```html
{% raw %}{% include pagination.html %}
<hr />
<div class="post">{{ content }}</div>
<hr />
{% include pagination.html %}{% endraw %}
```

## Custom Sort Order

Sort by a custom field (like `index`) instead of date:

```html
{% raw %}{% if page.collection %}
  {% assign posts = site[page.collection] | sort: 'index' %}
  {% for links in posts %}
    {% if links.title == page.title %}
      {% unless forloop.first %}
        {% assign prevurl = prev.url %}
      {% endunless %}
      {% unless forloop.last %}
        {% assign next = posts[forloop.index] %}
        {% assign nexturl = next.url %}
      {% endunless %}
    {% endif %}
    {% assign prev = links %}
  {% endfor %}

  <ul class="pager">
    {% if prevurl %}
      <li><a class="btn btn-outline-primary" href="{{prevurl}}">Previous</a></li>
    {% else %}
      <li class="disable"><a class="btn btn-outline-primary disabled">Previous</a></li>
    {% endif %}
    {% if nexturl %}
      <li class="next"><a class="btn btn-outline-primary" href="{{nexturl}}">Next</a></li>
    {% else %}
      <li class="next disable"><a class="btn btn-outline-primary disabled">Next</a></li>
    {% endif %}
  </ul>
{% endif %}{% endraw %}
```

## Keyboard Navigation

Add keyboard shortcuts for arrow key navigation:

```html
{% raw %}<script>
document.body.onkeyup = function(e){
  if (e.keyCode == '37') { window.location = '{{prevurl}}'; }
  if (e.keyCode == '39') { window.location = '{{nexturl}}'; }
};
</script>{% endraw %}
```

This allows users to press `←` and `→` arrow keys to navigate.

## Paginated Post Lists

For paginating a list of posts, use the `jekyll-paginate` plugin:

### Configuration

```yaml
# _config.yml
plugins:
  - jekyll-paginate

paginate: 10
paginate_path: "/blog/page:num/"
```

### Template

```html
{% raw %}{% for post in paginator.posts %}
  <article>
    <h2><a href="{{ post.url }}">{{ post.title }}</a></h2>
    <p>{{ post.excerpt }}</p>
  </article>
{% endfor %}

<!-- Pagination Links -->
<nav>
  {% if paginator.previous_page %}
    <a href="{{ paginator.previous_page_path }}">← Newer</a>
  {% endif %}
  
  <span>Page {{ paginator.page }} of {{ paginator.total_pages }}</span>
  
  {% if paginator.next_page %}
    <a href="{{ paginator.next_page_path }}">Older →</a>
  {% endif %}
</nav>{% endraw %}
```

## Styling

Add CSS for pagination buttons:

```css
.pager {
  display: flex;
  justify-content: space-between;
  list-style: none;
  padding: 0;
  margin: 2rem 0;
}

.pager li.disable a {
  pointer-events: none;
  opacity: 0.5;
}

.pager .next {
  margin-left: auto;
}
```

## Reference

- [Jekyll Pagination Documentation](https://jekyllrb.com/docs/pagination/)
- [Previous/Next Links in Collections](http://stories.upthebuzzard.com/jekyll_notes/2017-02-19-prev-and-next-within-a-jekyll-collection.html)
