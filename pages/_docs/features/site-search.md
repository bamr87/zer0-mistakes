---
title: Site Search
description: Client-side search functionality with modal interface, JSON index, and keyboard shortcut activation.
layout: default
categories:
    - docs
    - features
tags:
    - search
    - navigation
    - modal
    - keyboard
permalink: /docs/features/site-search/
difficulty: intermediate
estimated_time: 10 minutes
sidebar:
    nav: docs
---

# Site Search

Client-side search functionality with a Bootstrap modal interface and keyboard shortcut activation.

## Overview

- **Client-Side**: No server required
- **JSON Index**: Pre-built search index
- **Modal UI**: Bootstrap modal interface
- **Keyboard Shortcut**: Press `/` to search

## How It Works

```mermaid
graph LR
    A[User Types] --> B[Search JSON Index]
    B --> C[Filter Results]
    C --> D[Display Matches]
    D --> E[Navigate to Page]
```

1. Jekyll builds `search.json` with all page content
2. User opens search modal (click or `/` key)
3. JavaScript filters index as user types
4. Results link to matching pages

## Search Index

### Generated File

Jekyll generates `search.json`:

```json
[
  {
    "title": "Getting Started",
    "url": "/docs/getting-started/",
    "content": "Welcome to the documentation...",
    "categories": ["docs"],
    "tags": ["setup", "installation"]
  }
]
```

### Index Template

```liquid
{% raw %}---
layout: null
---
[
  {% for page in site.pages %}
    {% if page.title %}
    {
      "title": {{ page.title | jsonify }},
      "url": {{ page.url | jsonify }},
      "content": {{ page.content | strip_html | truncate: 500 | jsonify }},
      "categories": {{ page.categories | jsonify }},
      "tags": {{ page.tags | jsonify }}
    }{% unless forloop.last %},{% endunless %}
    {% endif %}
  {% endfor %}
]{% endraw %}
```

## Modal UI

### HTML Structure

```html
<div class="modal fade" id="siteSearchModal" tabindex="-1">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <input type="search" 
               class="form-control" 
               data-search-input
               placeholder="Search documentation..."
               autofocus>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div data-search-results></div>
        <div data-search-empty class="text-center text-muted py-4">
          Type to search...
        </div>
      </div>
    </div>
  </div>
</div>
```

### Search Toggle Button

```html
<button class="btn btn-outline-secondary" data-search-toggle>
  <i class="bi bi-search"></i>
  <span class="d-none d-md-inline ms-1">Search</span>
  <kbd class="ms-2">/</kbd>
</button>
```

## JavaScript

### Search Controller

```javascript
function initSearchModal() {
  const modalEl = document.getElementById('siteSearchModal');
  const searchInput = modalEl.querySelector('[data-search-input]');
  const resultsContainer = modalEl.querySelector('[data-search-results]');
  let searchIndex = null;

  // Load search index
  async function loadIndex() {
    const response = await fetch('/search.json');
    searchIndex = await response.json();
  }

  // Perform search
  function search(query) {
    if (!searchIndex || !query) return [];
    
    const terms = query.toLowerCase().split(' ');
    return searchIndex.filter(item => {
      const content = `${item.title} ${item.content}`.toLowerCase();
      return terms.every(term => content.includes(term));
    });
  }

  // Render results
  function renderResults(results) {
    if (results.length === 0) {
      resultsContainer.innerHTML = '<p class="text-muted">No results found.</p>';
      return;
    }
    
    resultsContainer.innerHTML = results.map(item => `
      <a href="${item.url}" class="search-result d-block p-2 rounded">
        <strong>${item.title}</strong>
        <small class="d-block text-muted">${item.url}</small>
      </a>
    `).join('');
  }

  // Event listeners
  searchInput.addEventListener('input', () => {
    renderResults(search(searchInput.value));
  });

  // Load index when modal opens
  modalEl.addEventListener('show.bs.modal', loadIndex);
}
```

### Keyboard Shortcut

```javascript
document.addEventListener('keydown', (e) => {
  // Skip if typing in input
  if (e.target.matches('input, textarea')) return;
  
  if (e.key === '/') {
    e.preventDefault();
    const modal = bootstrap.Modal.getOrCreateInstance(
      document.getElementById('siteSearchModal')
    );
    modal.show();
  }
});
```

## Configuration

### Exclude Pages

```yaml
# In page front matter
search: false
```

```liquid
{% raw %}{% unless page.search == false %}
  // Include in index
{% endunless %}{% endraw %}
```

### Index Fields

Control what's indexed:

```liquid
{% raw %}"content": {{ page.content | strip_html | truncate: 1000 | jsonify }}{% endraw %}
```

## Styling

```css
.search-result {
  text-decoration: none;
  color: inherit;
  transition: background-color 0.2s;
}

.search-result:hover {
  background-color: var(--bs-light);
}

.search-result.active {
  background-color: var(--bs-primary);
  color: white;
}
```

## Keyboard Navigation

```javascript
// Arrow key navigation in results
searchInput.addEventListener('keydown', (e) => {
  const results = resultsContainer.querySelectorAll('.search-result');
  const active = resultsContainer.querySelector('.search-result.active');
  
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = active ? active.nextElementSibling : results[0];
    if (next) {
      active?.classList.remove('active');
      next.classList.add('active');
    }
  }
  
  if (e.key === 'Enter' && active) {
    window.location.href = active.href;
  }
});
```

## Performance

### Lazy Loading

Load index only when needed:

```javascript
let indexPromise = null;

function getIndex() {
  if (!indexPromise) {
    indexPromise = fetch('/search.json').then(r => r.json());
  }
  return indexPromise;
}
```

### Debouncing

```javascript
let timeout;
searchInput.addEventListener('input', () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    renderResults(search(searchInput.value));
  }, 150);
});
```

## Troubleshooting

### Index Not Building

1. Check `search.json` template exists
2. Verify Jekyll build includes it
3. Check for Liquid errors

### Search Not Working

1. Verify `search.json` is accessible
2. Check browser console for errors
3. Test JSON validity

### Keyboard Shortcut Conflicts

1. Check for other `/` handlers
2. Verify modal ID matches
3. Test in different browsers

## Related

- [Keyboard Navigation](/docs/features/keyboard-navigation/)
- [Modal Components](/docs/bootstrap/)
