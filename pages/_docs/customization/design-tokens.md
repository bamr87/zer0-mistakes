---
title: Design Tokens
description: Centralized design token system for colors, typography, spacing, and component properties.
layout: default
categories:
    - docs
    - customization
tags:
    - design-tokens
    - theming
    - scss
    - css-variables
permalink: /docs/customization/design-tokens/
difficulty: intermediate
estimated_time: 10 minutes
prerequisites:
    - Basic CSS/SCSS knowledge
sidebar:
    nav: docs
---

# Design Tokens

Design tokens are the single source of truth for visual design values across the Zer0-Mistakes theme. They define colors, typography, spacing, and component properties in YAML, which are compiled into SCSS variables and CSS custom properties.

## How It Works

```
_data/tokens/*.yml  →  scripts/generate-tokens.rb  →  _sass/generated/_tokens.scss
     (source)              (generator script)              (consumed by SCSS)
```

1. **Define** tokens in `_data/tokens/` YAML files
2. **Generate** SCSS with `ruby scripts/generate-tokens.rb`
3. **Use** `$zer0-*` SCSS variables or `--zer0-*` CSS custom properties in your styles

## Token Files

| File | Contents |
|------|----------|
| `colors.yml` | Gray scale, brand colors, semantic colors, surfaces, links, syntax highlighting |
| `typography.yml` | Font families, sizes, weights, line heights |
| `spacing.yml` | Breakpoints, grid dimensions, navigation sizes |
| `components.yml` | Borders, shadows, transitions, component-specific values |
| `_schema.yml` | Token structure definition for validation |

## Color Tokens

{% assign color_data = site.data.tokens.colors %}
{% if color_data %}

### Gray Scale
<div class="row g-2 mb-4">
{% for token in color_data.tokens %}
{% if token.category == "gray-scale" %}
<div class="col-6 col-md-3">
  <div class="p-3 rounded border" style="background-color: {{ token.value }}; {% if token.name == 'black' or token.name == 'gray-800' or token.name == 'gray-900' %}color: white;{% endif %}">
    <code class="small">{{ token.name }}</code><br>
    <small>{{ token.value }}</small>
  </div>
</div>
{% endif %}
{% endfor %}
</div>

### Brand Colors
<div class="row g-2 mb-4">
{% for token in color_data.tokens %}
{% if token.category == "brand" %}
<div class="col-6 col-md-3">
  <div class="p-3 rounded" style="background-color: {{ token.value }}; color: white;">
    <code class="small">{{ token.name }}</code><br>
    <small>{{ token.value }}</small>
  </div>
</div>
{% endif %}
{% endfor %}
</div>

### Semantic Colors
<div class="row g-2 mb-4">
{% for token in color_data.tokens %}
{% if token.category == "semantic" %}
<div class="col-6 col-md-3">
  <div class="p-3 rounded" style="background-color: {{ token.value }}; color: white;">
    <strong>{{ token.name }}</strong><br>
    <small>{{ token.value }}</small>
  </div>
</div>
{% endif %}
{% endfor %}
</div>

### Syntax Highlighting
<div class="row g-2 mb-4">
{% for token in color_data.tokens %}
{% if token.category == "syntax" %}
<div class="col-4 col-md-2">
  <div class="p-2 rounded text-center" style="background-color: {{ token.value }}; color: {% if token.name == 'syntax-bg' or token.name == 'syntax-selection' or token.name == 'syntax-comment' %}white{% else %}#263238{% endif %};">
    <small>{{ token.name | remove: 'syntax-' }}</small>
  </div>
</div>
{% endif %}
{% endfor %}
</div>

{% endif %}

## Typography Tokens

{% assign typo_data = site.data.tokens.typography %}
{% if typo_data %}

### Font Families

| Token | Value |
|-------|-------|
{% for token in typo_data.tokens %}{% if token.category == "family" %}| `{{ token.name }}` | {{ token.value | truncate: 60 }} |
{% endif %}{% endfor %}

### Type Scale

| Token | Size | Description |
|-------|------|-------------|
{% for token in typo_data.tokens %}{% if token.category == "type-scale" %}| `{{ token.name }}` | {{ token.value }} | {{ token.description }} |
{% endif %}{% endfor %}

### Font Weights

| Token | Value |
|-------|-------|
{% for token in typo_data.tokens %}{% if token.category == "weight" %}| `{{ token.name }}` | {{ token.value }} |
{% endif %}{% endfor %}

{% endif %}

## Spacing Tokens

{% assign spacing_data = site.data.tokens.spacing %}
{% if spacing_data %}

### Breakpoints

| Token | Value | Description |
|-------|-------|-------------|
{% for token in spacing_data.tokens %}{% if token.category == "breakpoints" %}| `{{ token.name }}` | {{ token.value }} | {{ token.description }} |
{% endif %}{% endfor %}

### Grid

| Token | Value | Usage |
|-------|-------|-------|
{% for token in spacing_data.tokens %}{% if token.category == "grid" %}| `{{ token.name }}` | {{ token.value }} | {{ token.usage | join: ", " }} |
{% endif %}{% endfor %}

{% endif %}

## Using Tokens in SCSS

### SCSS Variables

All tokens are available as `$zer0-*` SCSS variables with `!default` so they can be overridden:

```scss
// Use a token variable
.my-component {
  color: $zer0-primary;
  font-family: $zer0-font-sans-serif;
  border-radius: $zer0-border-radius;
}

// Override a token in your theme
$zer0-primary: #custom-color;
```

### CSS Custom Properties

Tokens with literal values are also available as CSS custom properties:

```css
.my-component {
  color: var(--zer0-primary);
  background: var(--zer0-body-bg);
}
```

Dark mode tokens automatically switch when `data-bs-theme="dark"` is active.

## Overriding Tokens

To customize the theme, override token SCSS variables before importing the tokens:

```scss
// In your custom stylesheet
$zer0-primary: #your-brand-color;
$zer0-font-body: "Your Font", sans-serif;

// Then import the theme
@import "generated/tokens";
@import "core/variables";
```

## Regenerating Tokens

After modifying any `_data/tokens/*.yml` file:

```bash
ruby scripts/generate-tokens.rb          # Generate SCSS
ruby scripts/generate-tokens.rb --check  # Verify tokens are current (CI)
rake tokens:generate                     # Via Rake
```

## Adding New Tokens

1. Add the token definition to the appropriate file in `_data/tokens/`
2. Run `ruby scripts/generate-tokens.rb`
3. Commit both the YAML and generated SCSS files

```yaml
# Example: _data/tokens/colors.yml
- name: my-custom-color
  value: "#ff6b35"
  dark: "#ff8c5c"
  category: brand
  usage: [custom-highlights]
```

## Related

- [Styles Customization](/docs/customization/styles/)
- [Bootstrap Integration](/docs/bootstrap/)
