# MDX and Tailwind CSS Integration Guide

This guide explains how to use MDX (Markdown + JSX) files with Tailwind CSS in the zer0-mistakes Jekyll theme.

## Overview

The zer0-mistakes theme now supports:

- **MDX files** - Write markdown with embedded JSX components
- **Tailwind CSS** - Utility-first CSS framework alongside Bootstrap 5
- **Seamless integration** - Both frameworks work together without conflicts

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

This installs:
- MDX compiler and tools
- Tailwind CSS and PostCSS
- Tailwind CSS plugins (typography, forms, aspect-ratio)

### 2. Build Assets

```bash
# Build both MDX and Tailwind CSS
npm run build

# Or build separately
npm run build:mdx      # Process MDX files
npm run build:css      # Compile Tailwind CSS

# Watch mode for development
npm run dev            # Watch Tailwind CSS changes
```

## Using MDX Files

### Creating an MDX File

Create a file with `.mdx` extension in any content directory:

```mdx
---
title: "My MDX Page"
description: "Example MDX page"
layout: default
permalink: /my-page/
---

# My MDX Page

Regular markdown content works here.

<div className="tw-bg-blue-100 tw-p-4 tw-rounded">
  <p className="tw-font-bold">This is JSX content with Tailwind classes!</p>
</div>
```

### Front Matter

MDX files support the same front matter as regular markdown files:

```yaml
---
title: "Page Title"
description: "SEO description"
layout: default
date: 2025-01-27T10:00:00.000Z
categories: [category1, category2]
tags: [tag1, tag2]
permalink: /custom-url/
---
```

### Build Process

When you run `npm run build:mdx`, the script:

1. Finds all `.mdx` files in your project
2. Parses the front matter
3. Compiles the MDX content
4. Generates `.html` files in `_mdx-generated/`
5. Jekyll processes these HTML files normally

## Using Tailwind CSS

### Tailwind Configuration

The theme is configured with:

- **Prefix**: All Tailwind classes use the `tw-` prefix (e.g., `tw-bg-blue-500`)
- **No Preflight**: Tailwind's base styles are disabled to preserve Bootstrap
- **Content Paths**: Configured to scan all relevant files for class usage

### Why Use a Prefix?

The `tw-` prefix prevents conflicts between Bootstrap and Tailwind:

```html
<!-- Bootstrap class (no prefix) -->
<div class="container bg-primary text-white">
  Bootstrap styled content
</div>

<!-- Tailwind classes (tw- prefix) -->
<div class="tw-container tw-bg-blue-500 tw-text-white">
  Tailwind styled content
</div>
```

### Common Tailwind Classes

Here are frequently used Tailwind utilities with the `tw-` prefix:

#### Layout
- `tw-container` - Responsive container
- `tw-flex`, `tw-grid` - Flexbox and grid layouts
- `tw-hidden`, `tw-block` - Display utilities

#### Spacing
- `tw-p-4`, `tw-px-6`, `tw-py-2` - Padding
- `tw-m-4`, `tw-mx-auto`, `tw-my-8` - Margin

#### Typography
- `tw-text-lg`, `tw-text-xl` - Font sizes
- `tw-font-bold`, `tw-font-semibold` - Font weights
- `tw-text-blue-500` - Text colors

#### Backgrounds & Borders
- `tw-bg-blue-500` - Background colors
- `tw-rounded`, `tw-rounded-lg` - Border radius
- `tw-shadow`, `tw-shadow-lg` - Box shadows

#### Responsive Design
- `md:tw-flex` - Apply on medium screens and up
- `lg:tw-grid-cols-3` - Grid columns on large screens
- `tw-hidden md:tw-block` - Responsive visibility

### Custom Classes

The theme includes custom Tailwind component classes:

```css
/* Button component */
.tw-btn-primary {
  /* Combines multiple Tailwind utilities */
}

/* MDX content wrapper */
.tw-mdx-content {
  /* Styling for MDX-generated content */
}
```

## Examples

### Example 1: Info Box

```mdx
<div className="tw-bg-blue-100 tw-border-l-4 tw-border-blue-500 tw-p-4 tw-my-4">
  <p className="tw-font-bold tw-text-blue-700">Information</p>
  <p className="tw-text-blue-600">This is an informational message.</p>
</div>
```

### Example 2: Card Grid

```mdx
<div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
  <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-md">
    <h3 className="tw-text-xl tw-font-bold">Card 1</h3>
    <p className="tw-text-gray-600">Description</p>
  </div>
  <!-- More cards... -->
</div>
```

### Example 3: Gradient Header

```mdx
<div className="tw-bg-gradient-to-r tw-from-blue-500 tw-to-purple-600 tw-text-white tw-p-8 tw-rounded-lg">
  <h2 className="tw-text-3xl tw-font-bold">Gradient Header</h2>
  <p className="tw-text-lg">Beautiful gradient backgrounds</p>
</div>
```

### Example 4: Responsive Layout

```mdx
<div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-4">
  <div className="tw-flex-1 tw-bg-gray-100 tw-p-4 tw-rounded">
    Left column (stacks on mobile)
  </div>
  <div className="tw-flex-1 tw-bg-gray-100 tw-p-4 tw-rounded">
    Right column (stacks on mobile)
  </div>
</div>
```

## Combining Bootstrap and Tailwind

You can use both frameworks in the same page:

```mdx
<!-- Bootstrap components -->
<div class="container">
  <div class="row">
    <div class="col-md-6">
      <div class="card">
        <div class="card-body">
          Bootstrap Card
        </div>
      </div>
    </div>
    
    <!-- Tailwind-styled column -->
    <div class="col-md-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-4">
        Tailwind Card
      </div>
    </div>
  </div>
</div>
```

## Best Practices

### 1. Use Appropriate Framework

- **Bootstrap**: Navigation, modals, layout grid, existing components
- **Tailwind**: Custom styling, rapid prototyping, unique designs

### 2. Maintain Consistency

- Use Bootstrap for main UI structure
- Use Tailwind for custom components and one-off styling
- Don't duplicate styles across both frameworks

### 3. Performance

- Tailwind automatically purges unused classes in production
- Only used utilities are included in the final CSS
- Generated CSS is minified

### 4. Responsive Design

Use Tailwind's responsive utilities:

```html
<!-- Mobile-first approach -->
<div className="tw-text-sm md:tw-text-base lg:tw-text-lg">
  Responsive text size
</div>
```

### 5. JSX vs HTML

In MDX files:
- Use `className` instead of `class`
- Self-closing tags must include `/` (e.g., `<img />`)
- JavaScript expressions work: `{variable}`, `{expression}`

## Development Workflow

### Local Development

1. Start Jekyll server (in Docker or locally):
   ```bash
   docker-compose up
   # or
   bundle exec jekyll serve
   ```

2. In a separate terminal, watch Tailwind CSS:
   ```bash
   npm run dev
   ```

3. Edit `.mdx` files and run build:
   ```bash
   npm run build:mdx
   ```

4. Jekyll will auto-reload with changes

### Production Build

```bash
# Full build process
npm run build

# Jekyll build
bundle exec jekyll build
```

## Troubleshooting

### MDX Files Not Processing

- Ensure files have `.mdx` extension
- Check that front matter is valid YAML
- Run `npm run build:mdx` manually to see errors

### Tailwind Classes Not Working

- Verify the `tw-` prefix is used
- Check that Tailwind CSS is compiled: `npm run build:css`
- Include the compiled CSS in your layout:
  ```html
  <link rel="stylesheet" href="/assets/css/tailwind.output.css">
  ```

### Style Conflicts

- Use the `tw-` prefix consistently
- Don't override Bootstrap base styles with Tailwind
- Use browser DevTools to inspect conflicting styles

### Build Errors

```bash
# Clear caches and rebuild
rm -rf _site _mdx-generated node_modules
npm install
npm run build
```

## Additional Resources

- [MDX Documentation](https://mdxjs.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.0/)
- [Jekyll Documentation](https://jekyllrb.com/docs/)

## Advanced Usage

### Custom Tailwind Components

Add custom components in `assets/css/tailwind.css`:

```css
@layer components {
  .tw-custom-component {
    @apply tw-px-4 tw-py-2 tw-bg-blue-500 tw-text-white;
  }
}
```

### Tailwind Configuration

Customize colors, spacing, and more in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      'brand': '#007bff',
    },
  },
}
```

### MDX Custom Components

Extend the MDX build script to support custom React components by editing `scripts/build-mdx.js`.

---

**Need help?** Open an issue on the [GitHub repository](https://github.com/bamr87/zer0-mistakes/issues).
