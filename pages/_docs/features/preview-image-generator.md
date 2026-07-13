---
lastmod: 2026-07-12T00:00:00.000Z
title: AI Preview Image Generator for Jekyll Posts
description: Generate social preview images automatically for Jekyll posts with Claude (Code OAuth, default), OpenAI, xAI, Stability, Gemini, or a free local template engine.
keywords: [preview image, claude, dall-e, gemini, stability ai, open graph image, jekyll social images]
preview: /images/previews/ai-preview-image-generator.png
layout: default
categories:
    - docs
    - features
tags:
    - ai
    - preview
    - images
    - claude
    - dall-e
permalink: /docs/features/preview-image-generator/
difficulty: intermediate
estimated_reading_time: 15 minutes
prerequisites:
    - A Claude credential (Claude Code login or Anthropic API key) for the default provider
    - Or an OpenAI / xAI / Stability / Gemini API key for raster providers
sidebar:
    nav: docs
mermaid: true
---

# AI Preview Image Generator

Automatically generate preview images for your posts and pages using AI image generation services.

## Overview

The preview image generator provides:

- **Claude by default**: Claude (via your Claude Code OAuth token, Anthropic API key, or logged-in `claude` CLI) designs an SVG banner that is rasterized to PNG locally — no image-vendor API key required
- **Raster providers**: OpenAI (GPT Image or DALL-E 3), xAI (grok-2-image), Stability AI, and Google Gemini
- **Local template engine**: deterministic, free, network-less banners for development and CI
- **Prompt director**: optional `prompt_engine: claude` has Claude write the art prompt for raster providers
- **Configurable Style**: Default retro pixel art aesthetic, with per-author overrides
- **Batch Generation**: Process multiple posts at once (parallel workers)

## How It Works

```mermaid
graph LR
    A[Post without preview] --> B[Generate prompt from title/description]
    B --> C{Provider}
    C -->|claude| D[Claude authors SVG]
    D --> D2[Sanitize + rasterize to PNG]
    C -->|openai / xai / gemini| E[Vendor image API]
    C -->|stability| E
    C -->|local| F[Deterministic template SVG]
    F --> D2
    D2 --> G[Save image]
    E --> G
    G --> H[Update front matter]
```

## Configuration

### Basic Setup

```yaml
# _config.yml
preview_images:
  enabled: true
  provider: claude  # claude, openai, xai, stability, gemini, local
```

### Full Configuration

```yaml
preview_images:
  enabled: true
  provider: claude            # claude, openai, xai, stability, gemini, local
  model: claude-opus-4-8      # empty = provider default (gpt-image-2, grok-2-image, ...)
  size: 1536x1024             # raster vendors adapt per model (DALL-E 3: 1792x1024)
  quality: auto               # auto for GPT Image; standard/hd for DALL-E 3
  style: "retro pixel art, 8-bit video game aesthetic, vibrant colors"
  style_modifiers: "pixelated, retro gaming style, CRT screen glow effect"
  output_dir: assets/images/previews
  prompt_engine: template     # or claude — Claude writes prompts for raster vendors
  assets_prefix: /assets
  auto_prefix: true
  collections:                # engine default if omitted
    - posts
    - docs
    - quickstart
```

The values above match the shipped `_config.yml`. `collections` defaults to
`[posts, quickstart, docs]` in the engine (`scripts/lib/preview_generator.py`)
when omitted.

### Credentials

The default `claude` provider accepts any ONE of, in order:

```bash
# 1. Claude Code OAuth token (recommended — from `claude setup-token`)
export CLAUDE_CODE_OAUTH_TOKEN="sk-ant-oat01-..."

# 2. Short-lived Bearer token
export ANTHROPIC_AUTH_TOKEN="..."

# 3. Anthropic API key (console.anthropic.com)
export ANTHROPIC_API_KEY="sk-ant-..."

# 4. Nothing — a logged-in `claude` CLI is used automatically.
```

Raster providers need their own key:

```bash
export OPENAI_API_KEY="sk-..."       # openai (also powers --enhance)
export XAI_API_KEY="xai-..."         # xai
export STABILITY_API_KEY="sk-..."    # stability
export GEMINI_API_KEY="..."          # gemini
```

## Usage

### Manual Generation

Run the generation script:

```bash
# Generate for all posts without previews
./scripts/generate-preview-images.sh

# Generate for specific post
./scripts/generate-preview-images.sh --file pages/_posts/2025-01-25-my-post.md

# Dry run (preview what would be generated)
./scripts/generate-preview-images.sh --dry-run
```

### Liquid Tags

```liquid
{% raw %}<!-- Show count of missing previews -->
{% preview_image_status %}

<!-- Get preview image path -->
{{ page | preview_image_path }}

<!-- Check if page has preview -->
{% if page | has_preview_image %}
  <img src="{{ page.preview | relative_url }}" alt="Preview">
{% endif %}{% endraw %}
```

### In Front Matter

```yaml
---
title: "My Post Title"
preview: /images/previews/ai-preview-image-generator.png
---
```

## Providers

### Claude — SVG artist (default)

Claude designs a standalone retro-pixel SVG banner from your post's title,
description, and style settings; the engine sanitizes the SVG (scripts,
external references, and event handlers are stripped) and rasterizes it to PNG
with the first available tool — `rsvg-convert`, `inkscape`, `magick`, or the
theme's Playwright helper. If no rasterizer is installed the sanitized `.svg`
is kept (the site renders it, but social `og:image` scrapers prefer PNG):

```yaml
preview_images:
  provider: claude
  model: claude-opus-4-8   # any claude-* model
```

Because it reuses your Claude Code credential, this provider costs nothing
extra on a Claude Pro/Max subscription and needs no image-vendor account.

### OpenAI (GPT Image / DALL-E 3)

Best raster quality. The default model is GPT Image; DALL-E 3 is also
supported. OpenAI also powers the `--enhance` mode (`/v1/images/edits`):

```yaml
preview_images:
  provider: openai
  model: gpt-image-2    # default; or dall-e-3, dall-e-2
  size: 1536x1024       # GPT Image landscape; DALL-E 3 also takes 1792x1024
  quality: auto         # auto for GPT Image; standard/hd for DALL-E 3
```

### xAI (Grok)

Uses `grok-2-image` through xAI's OpenAI-compatible API. Set
`provider: xai` and supply `XAI_API_KEY`:

```yaml
preview_images:
  provider: xai
```

### Stability AI

Set `provider: stability` and supply `STABILITY_API_KEY`. The engine calls the
Stable Diffusion XL 1024 endpoint at 1024x1024 — there is no separate
`engine`/`size` key to set for this provider:

```yaml
preview_images:
  provider: stability
  # Uses STABILITY_API_KEY; generates 1024x1024 via Stable Diffusion XL
```

### Google Gemini

Uses `gemini-2.5-flash-image`. Set `provider: gemini` and supply
`GEMINI_API_KEY` (aistudio.google.com):

```yaml
preview_images:
  provider: gemini
```

### Local (template)

Free, no API and no network. The `local` provider renders a deterministic
retro-landscape SVG (seeded from the post slug, sharing the claude provider's
palette scheme) and rasterizes it to PNG — the same post always gets the same
banner, which makes it ideal for development and CI:

```yaml
preview_images:
  provider: local
```

## Style Customization

### Default Style

The default generates retro pixel art:

```yaml
style: "retro pixel art, 8-bit video game aesthetic, vibrant colors, nostalgic"
style_modifiers: "pixelated, retro gaming style, CRT screen glow effect"
```

### Professional Style

```yaml
style: "professional, modern, clean, minimalist design"
style_modifiers: "corporate, business, elegant, high quality"
```

### Artistic Style

```yaml
style: "watercolor painting, artistic, creative"
style_modifiers: "hand-painted, artistic texture, vibrant colors"
```

### Custom Per-Post

```yaml
---
title: "My Technical Post"
preview_style: "technical diagram, blueprint style, clean lines"
---
```

## Plugin Details

> **Note:** the Liquid filters and tags below come from an optional Jekyll
> plugin that only loads in unrestricted Jekyll builds. Under the
> `github-pages` gem (safe mode) custom plugins never load — the theme's own
> rendering uses the pure-Liquid `components/preview-image.html` include
> instead, so generated previews display either way.

### File Location

```text
_plugins/preview_image_generator.rb
```

### Available Methods

```ruby
# Check if document has preview
PreviewImageGenerator.has_preview?(doc)

# Get preview path
PreviewImageGenerator.preview_path(doc)

# Generate prompt from document
PreviewImageGenerator.generate_prompt(doc)
```

### Liquid Filters

| Filter | Description |
|--------|-------------|
| `preview_image_path` | Returns full preview image path |
| `has_preview_image` | Returns true if preview exists |

### Liquid Tags

| Tag | Description |
|-----|-------------|
| `{% raw %}{% preview_image_status %}{% endraw %}` | Shows missing preview count |

## Image Specifications

### Recommended Sizes

| Platform | Size | Aspect |
|----------|------|--------|
| Open Graph | 1200×630 | 1.91:1 |
| Twitter | 1200×600 | 2:1 |
| DALL-E 3 | 1792×1024 | 1.75:1 |

### Output Directory

Images saved to:

```text
assets/images/previews/
├── post-slug-preview.png
├── another-post-preview.png
└── ...
```

## Automatic Generation

### GitHub Actions

Add to a CI workflow (generation is script-driven, never part of the Jekyll
build):

```yaml
- name: Generate preview images
  env:
    CLAUDE_CODE_OAUTH_TOKEN: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    # or OPENAI_API_KEY for --provider openai
  run: ./scripts/generate-preview-images.sh
```

## Cost Considerations

### Claude (default)

- Covered by a Claude Pro/Max subscription when using a Claude Code OAuth
  token or the `claude` CLI; API-key usage bills normal Anthropic token rates

### OpenAI DALL-E 3

- Standard quality: ~$0.04 per image
- HD quality: ~$0.08 per image

### Budget Tips

1. Use the `local` provider during development (free, deterministic)
2. Generate only for published posts
3. Batch generate periodically
4. Cache generated images

## Troubleshooting

### API Key Not Found

```bash
# Verify key is set
echo $OPENAI_API_KEY

# Set in current session
export OPENAI_API_KEY="sk-..."
```

### Generation Failed

1. Check API key validity
2. Verify API quota
3. Check network connection
4. Review error logs

### Wrong Image Path

1. Check `assets_prefix` config
2. Verify `output_dir` exists
3. Check front matter path

### Images Not Showing

1. Verify file exists at path
2. Check Jekyll build includes assets
3. Clear browser cache
4. Check relative URL helper

## Related

- [SEO Meta Tags](/docs/seo/meta-tags/)
- [OpenAI API Documentation](https://platform.openai.com/docs/guides/images)

## Technical Reference

For implementation details (multi-provider architecture, xAI Grok integration, generation workflow):

- [Preview Image Generator → docs/implementation/preview-image-generator.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/implementation/preview-image-generator.md)

## See also

- [[Features]]
- [[SEO]]
