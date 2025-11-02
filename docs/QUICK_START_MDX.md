# Quick Start: MDX and Tailwind CSS

Get started with MDX and Tailwind CSS in minutes!

## Installation

```bash
# Install Node.js dependencies
npm install
```

## Build Assets

```bash
# Build everything (MDX + Tailwind CSS)
npm run build

# Or build separately
npm run build:mdx      # Process .mdx files
npm run build:css      # Compile Tailwind CSS
```

## Using Makefile

```bash
# Build all assets
make build-assets

# Build just CSS
make build-css

# Build just MDX
make build-mdx

# Watch CSS for changes (development)
make watch-css
```

## Create Your First MDX File

1. Create a new file with `.mdx` extension:

```bash
touch my-page.mdx
```

2. Add front matter and content:

```mdx
---
title: "My First MDX Page"
layout: default
permalink: /my-first-page/
---

# Hello from MDX!

Regular markdown content works here.

## Styled with Tailwind

<div className="tw-bg-blue-100 tw-p-4 tw-rounded">
  <p className="tw-font-bold tw-text-blue-700">
    This box is styled with Tailwind CSS!
  </p>
</div>
```

3. Build and view:

```bash
npm run build:mdx
# Start Jekyll to see your page
```

## Tailwind CSS Classes

All Tailwind classes use the `tw-` prefix to avoid conflicts with Bootstrap:

```html
<!-- Backgrounds -->
<div className="tw-bg-blue-500">Blue background</div>

<!-- Text -->
<p className="tw-text-lg tw-font-bold tw-text-gray-700">Styled text</p>

<!-- Spacing -->
<div className="tw-p-4 tw-m-2">Padding and margin</div>

<!-- Flexbox -->
<div className="tw-flex tw-gap-4 tw-justify-center">Flex container</div>

<!-- Responsive -->
<div className="tw-hidden md:tw-block">Hidden on mobile</div>
```

## Common Patterns

### Alert Box
```html
<div className="tw-bg-yellow-100 tw-border-l-4 tw-border-yellow-500 tw-p-4">
  <p className="tw-font-bold tw-text-yellow-700">Warning!</p>
  <p className="tw-text-yellow-600">This is a warning message.</p>
</div>
```

### Button
```html
<button className="tw-px-4 tw-py-2 tw-bg-blue-500 tw-text-white tw-rounded hover:tw-bg-blue-600">
  Click Me
</button>
```

### Card
```html
<div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6">
  <h3 className="tw-text-xl tw-font-bold tw-mb-4">Card Title</h3>
  <p className="tw-text-gray-600">Card content goes here.</p>
</div>
```

### Grid Layout
```html
<div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

## Development Workflow

1. **Start Jekyll** (in one terminal):
   ```bash
   docker-compose up
   # or
   bundle exec jekyll serve
   ```

2. **Watch Tailwind CSS** (in another terminal):
   ```bash
   npm run dev
   ```

3. **Edit and rebuild MDX** as needed:
   ```bash
   npm run build:mdx
   ```

## Troubleshooting

### Styles not applying?
- Ensure you built Tailwind CSS: `npm run build:css`
- Check that `tailwind.output.css` exists in `assets/css/`
- Verify the CSS is loaded in your layout's `<head>`

### MDX files not showing?
- Run `npm run build:mdx` to generate HTML
- Check `_mdx-generated/` directory for output files
- Verify front matter is valid YAML

### Classes not working?
- Remember to use the `tw-` prefix: `tw-bg-blue-500`
- Use `className` instead of `class` in JSX
- Check Tailwind docs for correct class names

## Next Steps

- Read the [full MDX and Tailwind guide](./MDX_TAILWIND_GUIDE.md)
- Explore [example MDX pages](../pages/_docs/mdx-examples.mdx)
- Check [Tailwind CSS documentation](https://tailwindcss.com/docs)
- Learn more about [MDX](https://mdxjs.com/)

## Examples

### Demo Pages
- [MDX Demo](/mdx-demo/) - Simple demonstration
- [MDX Examples](/docs/mdx-examples/) - Comprehensive examples

### Files to Explore
- `mdx-demo.mdx` - Basic demo page
- `pages/_docs/mdx-examples.mdx` - Detailed examples
- `tailwind.config.js` - Tailwind configuration
- `scripts/build-mdx.js` - MDX build script
