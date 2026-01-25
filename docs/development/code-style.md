# Code Style Guide

Coding conventions and best practices for contributing to the Zer0-Mistakes theme.

## General Principles

1. **Consistency** — Match existing code style
2. **Readability** — Clear, self-documenting code
3. **Simplicity** — Avoid over-engineering
4. **Documentation** — Comment non-obvious code

## File Organization

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Layouts | `lowercase.html` | `journals.html` |
| Includes | `kebab-case.html` | `table-of-contents.html` |
| Sass partials | `_kebab-case.scss` | `_variables.scss` |
| Data files | `kebab-case.yml` | `main-nav.yml` |
| Scripts | `kebab-case` | `release`, `build` |
| Documentation | `kebab-case.md` | `quick-start.md` |

### Directory Structure

- Group related files in directories
- Use meaningful directory names
- Keep nesting shallow (max 3 levels)

## HTML/Liquid

### Formatting

```html
{% raw %}<!-- Good: Readable indentation -->
<div class="container">
  {% if page.title %}
    <h1>{{ page.title }}</h1>
  {% endif %}
  <div class="content">
    {{ content }}
  </div>
</div>

<!-- Bad: Inconsistent indentation -->
<div class="container">
{% if page.title %}
<h1>{{ page.title }}</h1>
{% endif %}
<div class="content">
{{ content }}
</div>
</div>{% endraw %}
```

### Liquid Best Practices

```liquid
{% raw %}<!-- Use whitespace control for clean output -->
{%- if condition -%}
  content
{%- endif -%}

<!-- Use default filter for safety -->
{{ page.title | default: "Untitled" }}
{{ page.description | default: site.description | truncate: 160 }}

<!-- Break complex logic into assigns -->
{% assign sorted_posts = site.posts | sort: "date" | reverse %}
{% assign recent_posts = sorted_posts | limit: 5 %}

<!-- Comment complex logic -->
{% comment %}
  Filter posts that have both 'featured' flag and a valid date
{% endcomment %}
{% assign featured = site.posts | where: "featured", true %}{% endraw %}
```

### Include Parameters

```liquid
{% raw %}<!-- Pass parameters explicitly -->
{% include components/alert.html 
   type="warning" 
   title="Note" 
   message="Important information" 
%}

<!-- In the include, provide defaults -->
<div class="alert alert-{{ include.type | default: 'info' }}">
  {% if include.title %}
    <strong>{{ include.title }}</strong>
  {% endif %}
  {{ include.message }}
</div>{% endraw %}
```

## SCSS/CSS

### Variables

```scss
// Use semantic variable names
$color-primary: #007bff;
$color-text: #333;
$color-background: #fff;

$spacing-small: 0.5rem;
$spacing-medium: 1rem;
$spacing-large: 2rem;

$font-size-base: 1rem;
$font-size-large: 1.25rem;
$font-size-small: 0.875rem;
```

### Selectors

```scss
// Good: Low specificity, reusable classes
.card {
  padding: $spacing-medium;
  
  &-header {
    font-weight: bold;
  }
  
  &-body {
    margin-top: $spacing-small;
  }
}

// Bad: High specificity, hard to override
div.container > section.main article.post .card-header {
  font-weight: bold;
}
```

### Media Queries

```scss
// Mobile-first approach
.element {
  padding: 1rem;
  
  @include media-breakpoint-up(md) {
    padding: 2rem;
  }
  
  @include media-breakpoint-up(lg) {
    padding: 3rem;
  }
}
```

## YAML

### Front Matter

```yaml
---
# Required fields first
title: "Page Title"
layout: default
permalink: /page-url/

# Optional metadata
description: "Page description for SEO"
date: 2026-01-24T00:00:00.000Z
lastmod: 2026-01-24T00:00:00.000Z

# Categories and tags (arrays)
categories:
    - category1
    - category2
tags:
    - tag1
    - tag2

# Feature flags
mermaid: true
mathjax: false
comments: true
---
```

### Data Files

```yaml
# Use consistent indentation (2 or 4 spaces)
navigation:
  - title: "Home"
    url: /
    
  - title: "Documentation"
    url: /docs/
    children:
      - title: "Getting Started"
        url: /docs/getting-started/
      - title: "Features"
        url: /docs/features/
```

## JavaScript

### Modern JavaScript

```javascript
// Use const/let, not var
const config = {
  theme: 'default',
  startOnLoad: true
};

// Use arrow functions for callbacks
document.addEventListener('DOMContentLoaded', () => {
  initializeFeature();
});

// Use template literals
const message = `Hello, ${user.name}!`;
```

### Event Handling

```javascript
// Delegate events when possible
document.addEventListener('click', (event) => {
  const target = event.target.closest('.clickable');
  if (target) {
    handleClick(target);
  }
});

// Clean up event listeners
const handler = () => { /* ... */ };
element.addEventListener('click', handler);
// Later:
element.removeEventListener('click', handler);
```

## Shell Scripts

### Shebang and Headers

```bash
#!/bin/bash
#
# Script description
# Usage: ./script.sh [options]
#

set -euo pipefail
```

### Functions

```bash
# Document functions
# Description: Does something useful
# Arguments:
#   $1 - First argument description
# Returns:
#   0 on success, 1 on failure
do_something() {
    local arg1="$1"
    
    if [[ -z "$arg1" ]]; then
        echo "Error: Missing argument" >&2
        return 1
    fi
    
    # Implementation
    return 0
}
```

### Error Handling

```bash
# Check command success
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed" >&2
    exit 1
fi

# Use meaningful exit codes
EXIT_SUCCESS=0
EXIT_ERROR=1
EXIT_USAGE=2
```

## Documentation

### Markdown

```markdown
# Main Heading

Brief description of the document.

## Section Heading

Content organized in logical sections.

### Subsection

- Use bullet points for lists
- Keep items concise
- Group related items

### Code Examples

Include working code examples:

```bash
# Command with explanation
docker-compose up
```

### Tables

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add mermaid diagram support
fix: resolve sidebar collapse on mobile
docs: update installation guide
refactor: simplify layout inheritance
test: add pagination tests
chore: update dependencies
```

## Pull Request Guidelines

1. **Clear title** — Describe the change
2. **Description** — Explain what and why
3. **Tests** — Include or update tests
4. **Documentation** — Update relevant docs
5. **Small PRs** — Keep changes focused

## Related

- [Local Setup](local-setup.md)
- [Testing](testing.md)
- [Architecture](../architecture/README.md)
