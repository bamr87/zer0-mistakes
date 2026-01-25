---
title: Jupyter Notebook Integration
description: Full Jupyter notebook support with GitHub Pages compatibility, automated conversion, and responsive design.
layout: default
categories:
    - docs
    - features
tags:
    - jupyter
    - notebooks
    - python
    - data-science
permalink: /docs/features/jupyter-notebooks/
difficulty: intermediate
estimated_time: 15 minutes
prerequisites:
    - Docker Desktop
    - Jupyter notebooks to convert
sidebar:
    nav: docs
---

# Jupyter Notebook Integration

The Zer0-Mistakes theme provides full Jupyter notebook support with GitHub Pages compatibility through automated pre-build conversion.

## Overview

Key features:

- **GitHub Pages Compatible**: Uses pre-build conversion (no custom plugins)
- **Automated Conversion**: GitHub Actions workflow on push
- **Rich Content**: Code, equations, plots, tables, images
- **Responsive Design**: Bootstrap 5 styling

## How It Works

```mermaid
graph LR
    A[.ipynb File] --> B[nbconvert]
    B --> C[Markdown + Images]
    C --> D[Jekyll Build]
    D --> E[HTML Page]
```

1. Notebooks stored in `pages/_notebooks/`
2. Conversion script runs during build
3. Markdown files generated with front matter
4. Images extracted to `assets/images/notebooks/`
5. Jekyll renders final HTML

## Quick Start

### Add a Notebook

1. Place `.ipynb` file in `pages/_notebooks/`:

```
pages/_notebooks/
├── data-analysis.ipynb
└── machine-learning-intro.ipynb
```

2. Convert notebooks:

```bash
# Using Docker
docker-compose exec jekyll ./scripts/convert-notebooks.sh

# Or locally (requires nbconvert)
./scripts/convert-notebooks.sh
```

3. View at `/notebooks/your-notebook-name/`

## Conversion Script

### Basic Usage

```bash
# Convert all notebooks
./scripts/convert-notebooks.sh

# Dry run (preview only)
./scripts/convert-notebooks.sh --dry-run

# Force reconvert all
./scripts/convert-notebooks.sh --force

# List notebooks
./scripts/convert-notebooks.sh --list
```

### What It Does

1. Finds `.ipynb` files in `pages/_notebooks/`
2. Runs `jupyter nbconvert --to markdown`
3. Extracts images to `assets/images/notebooks/`
4. Adds Jekyll front matter
5. Creates collection entry

## Notebook Layout

Notebooks use a specialized layout:

```yaml
# _config.yml
defaults:
  - scope:
      path: "pages/_notebooks"
      type: "notebooks"
    values:
      layout: "notebook"
      permalink: /notebooks/:basename/
```

### Layout Features

- Metadata display (author, date, kernel)
- Navigation between notebooks
- Download link to original `.ipynb`
- Comment integration
- Responsive tables and images

## Styling

### Code Cells

```css
/* Input cells */
.notebook-input {
  background: var(--bs-code-bg);
  border-left: 3px solid var(--bs-primary);
  padding: 1rem;
}

/* Output cells */
.notebook-output {
  background: var(--bs-light);
  border-left: 3px solid var(--bs-success);
  padding: 1rem;
}

/* Execution count */
.notebook-prompt {
  color: var(--bs-secondary);
  font-family: monospace;
}
```

### Tables

```css
/* Dataframe tables */
.notebook-table {
  overflow-x: auto;
}

.notebook-table table {
  border-collapse: collapse;
  width: 100%;
}
```

### Images

```css
/* Plot outputs */
.notebook-image img {
  max-width: 100%;
  height: auto;
}
```

## MathJax Integration

Equations render automatically:

**Inline Math**:
```latex
The equation $E = mc^2$ is famous.
```

**Block Math**:
```latex
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

## GitHub Actions

### Automated Conversion

```yaml
# .github/workflows/convert-notebooks.yml
on:
  push:
    paths:
      - 'pages/_notebooks/**/*.ipynb'

jobs:
  convert:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Convert notebooks
        run: ./scripts/convert-notebooks.sh
      - name: Commit changes
        run: |
          git add pages/_notebooks/*.md assets/images/notebooks/
          git commit -m "Convert notebooks" || true
          git push
```

## Configuration

### Jekyll Config

```yaml
# _config.yml
collections:
  notebooks:
    output: true
    permalink: /notebooks/:basename/

defaults:
  - scope:
      type: notebooks
    values:
      layout: notebook
      mathjax: true
      toc: true
```

### Makefile Targets

```makefile
# Convert all notebooks
convert-notebooks:
	./scripts/convert-notebooks.sh

# Preview conversion
convert-notebooks-dry-run:
	./scripts/convert-notebooks.sh --dry-run
```

## Troubleshooting

### Conversion Fails

1. Check nbconvert is installed:
   ```bash
   pip install nbconvert
   ```
2. Verify notebook is valid JSON
3. Check for special characters in path

### Images Not Showing

1. Verify images extracted to `assets/images/notebooks/`
2. Check image paths in generated Markdown
3. Rebuild Jekyll site

### Math Not Rendering

1. Ensure `mathjax: true` in front matter
2. Check MathJax script loaded
3. Verify equation syntax

### Tables Overflow

Add responsive wrapper:
```html
<div class="table-responsive">
  {{ table_content }}
</div>
```

## Related

- [MathJax Math](/docs/features/mathjax-math/)
- [Code Highlighting](/docs/jekyll/code-highlighting/)
- [Mermaid Diagrams](/docs/features/mermaid-diagrams/)
