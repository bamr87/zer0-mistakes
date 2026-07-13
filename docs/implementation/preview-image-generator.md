---
title: AI Preview Image Generator
layout: default
description: Generate AI-powered preview images for Jekyll posts with Claude (Code OAuth, default), OpenAI, xAI, Stability, Gemini, or a local template engine.
permalink: /docs/features/preview-image-generator/
feature_id: ZER0-004
version: "1.27.0"
date: 2026-04-01T00:00:00.000Z
lastmod: 2026-07-12T00:00:00.000Z
categories: [docs]
tags: [implementation, ai, images]
author: bamr87
---

# AI Preview Image Generator

## Overview

The AI Preview Image Generator automatically creates eye-catching banner images for your posts and articles. One consolidated Python engine (`scripts/lib/preview_generator.py`) drives every entry point and dispatches to a pluggable provider framework.

**Default engine: Claude via Claude Code OAuth.** The Anthropic API doesn't render raster pixels, so the `claude` provider works as an *SVG artist*: Claude authors a complete retro-pixel SVG banner, which the engine sanitizes and rasterizes to PNG locally (rsvg-convert → inkscape → magick → Playwright). If you already use Claude Code, it works with zero extra API keys.

### Key Features

- 🤖 **Claude as the default engine** - Claude Code OAuth token, Anthropic API key, or a logged-in `claude` CLI; no vendor image API needed
- 🎨 **Provider framework** - `claude`, `openai` (gpt-image-2 / DALL-E), `xai` (grok-2-image), `stability`, `gemini`, and a no-network `local` template engine
- ✍️ **Claude prompt director** - optional `--prompt-engine claude` writes richer art prompts for any raster vendor
- 🔧 **Highly Configurable** - Customize provider, style, size, quality via `_config.yml`
- 🎮 **Retro Pixel Art Defaults** - Beautiful 8-bit aesthetic out of the box
- 👤 **Per-author art styles** - `_data/authors.yml` `preview:` blocks override style/model per persona
- 📦 **Easy Installation** - One-command setup for any Jekyll site
- 📊 **Missing Image Detection** - Automatically identifies posts without previews

## Quick Start

### Remote Installation (Recommended)

For Jekyll sites using the zer0-mistakes theme, run:

```bash
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/scripts/install-preview-generator.sh | bash
```

### Manual Installation

1. **Download the required files:**

```bash
# Download the wrapper script
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/scripts/features/generate-preview-images -o scripts/generate-preview-images.sh
chmod +x scripts/generate-preview-images.sh

# Download the engine (all logic lives here)
mkdir -p scripts/lib
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/scripts/lib/preview_generator.py -o scripts/lib/preview_generator.py

# Download the Playwright SVG rasterizer helper (optional — used by the
# claude/local providers when no native rasterizer is installed)
mkdir -p scripts/dev
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/scripts/dev/rasterize-svg.js -o scripts/dev/rasterize-svg.js
```

1. **Add configuration to `_config.yml`:**

```yaml
preview_images:
  enabled: true
  provider: claude          # claude, openai, xai, stability, gemini, local
  model: ""                 # empty = provider default (claude-opus-4-8, gpt-image-2, ...)
  size: "1536x1024"
  quality: auto
  style: "retro pixel art, 8-bit video game aesthetic, vibrant colors"
  output_dir: assets/images/previews
```

1. **Set up a credential (default `claude` provider — any ONE):**

```bash
# Recommended: mint a long-lived Claude Code OAuth token (Claude Pro/Max)
claude setup-token          # then add CLAUDE_CODE_OAUTH_TOKEN=... to .env

# Alternative: an Anthropic API key
echo "ANTHROPIC_API_KEY=sk-ant-your-key" >> .env

# Or nothing at all — a logged-in `claude` CLI is used automatically.
echo ".env" >> .gitignore
```

## Configuration

### Full Configuration Options

Add these options to your `_config.yml`:

```yaml
preview_images:
  # Enable/disable the feature
  enabled: true

  # AI Provider: claude (default), openai, xai, stability, gemini, local
  provider: claude

  # Model — empty uses the provider default (claude-opus-4-8, gpt-image-2,
  # grok-2-image, gemini-2.5-flash-image, ...). A model from another vendor
  # family is ignored with a warning rather than sent to the wrong API.
  model: ""
  quality: auto                      # auto for GPT Image; standard/hd for DALL-E 3

  # Image dimensions (landscape banner format; raster vendors adapt per model)
  size: "1536x1024"

  # Default style for generated images
  style: "retro pixel art, 8-bit video game aesthetic, vibrant colors, nostalgic, clean pixel graphics"

  # Additional style modifiers appended to prompts
  style_modifiers: "pixelated, retro gaming style, CRT screen glow effect, limited color palette"

  # Output directory for generated images (relative to site root)
  output_dir: assets/images/previews

  # Prompt builder for raster vendors: template (built-in) or claude
  # (Claude writes the art prompt via the same credential chain)
  prompt_engine: template

  # Path normalization for front-matter preview values
  assets_prefix: /assets
  auto_prefix: true

  # Collections to scan for missing preview images
  collections:
    - posts
    - docs
    - quickstart
```

### Environment Variables

Create a `.env` file in your project root:

```bash
# Default claude provider — any ONE of:
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...   # from `claude setup-token`
ANTHROPIC_AUTH_TOKEN=...                   # short-lived Bearer token
ANTHROPIC_API_KEY=sk-ant-...               # console.anthropic.com
# (or a logged-in `claude` CLI — no variable needed)

# Raster vendors (for the matching --provider choice)
OPENAI_API_KEY=sk-your-openai-api-key      # also powers --enhance
XAI_API_KEY=xai-your-xai-key
STABILITY_API_KEY=sk-your-stability-api-key
GEMINI_API_KEY=your-gemini-key

# Override config settings
IMAGE_STYLE="cyberpunk, neon lights, futuristic"
IMAGE_SIZE="1024x1024"
```

## Usage

### Command-Line Interface

The main script provides a comprehensive CLI:

```bash
# List all files missing preview images
./scripts/generate-preview-images.sh --list-missing

# Preview what would be generated (no API calls)
./scripts/generate-preview-images.sh --dry-run --verbose

# Generate images for posts collection
./scripts/generate-preview-images.sh --collection posts

# Generate image for a specific file
./scripts/generate-preview-images.sh --file pages/_posts/my-article.md

# Force regenerate all images (even if preview exists)
./scripts/generate-preview-images.sh --force

# Use a specific AI provider
./scripts/generate-preview-images.sh --provider openai

# Let Claude write the art prompt, render with OpenAI
./scripts/generate-preview-images.sh --provider openai --prompt-engine claude

# Zero-credential deterministic banner (CI-safe)
./scripts/generate-preview-images.sh --provider local -f pages/_posts/my-article.md
```

### CLI Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message |
| `-d, --dry-run` | Preview without making changes |
| `-v, --verbose` | Enable verbose output |
| `-f, --file FILE` | Process specific file only |
| `-c, --collection NAME` | Process specific collection (or `all`) |
| `-p, --provider PROVIDER` | AI provider (claude, openai, xai, stability, gemini, local) |
| `--model MODEL` | Override the provider's model |
| `--prompt-engine ENGINE` | `template` (default) or `claude` |
| `--rasterizer TOOL` | SVG→PNG tool: auto, rsvg, inkscape, magick, playwright, none |
| `-j, --parallel N` | Concurrent workers (default 4) |
| `-e, --enhance` | Improve existing previews (OpenAI images/edits) |
| `--output-dir DIR` | Custom output directory |
| `--force` | Regenerate existing images |
| `--list-missing` | Only list files missing previews |

### VS Code Integration

The installer adds VS Code tasks for easy access:

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type "Tasks: Run Task"
3. Select from available tasks:
   - 🖼️ Preview Images: List Missing
   - 🖼️ Preview Images: Dry Run
   - 🖼️ Preview Images: Generate for Posts
   - 🖼️ Preview Images: Generate All

### Liquid Integration

> **Note:** these filters come from `_plugins/preview_image_generator.rb`,
> which only loads in unrestricted Jekyll builds. Under the `github-pages` gem
> (safe mode) custom plugins never load — the theme's own rendering uses the
> pure-Liquid `_includes/components/preview-image.html` instead.

The Jekyll plugin provides Liquid filters and tags:

{% raw %}

```liquid
{% comment %} Check if page has preview image {% endcomment %}
{% if page | has_preview_image %}
  <img src="{{ page | preview_image_path | relative_url }}" alt="{{ page.title }}">
{% endif %}

{% comment %} Show missing preview count {% endcomment %}
{% preview_image_status %}

{% comment %} List all missing previews {% endcomment %}
{% preview_images_missing %}
```

{% endraw %}

### Rake Tasks

```bash
# List missing previews
bundle exec rake preview:missing

# Generate all missing previews
bundle exec rake preview:generate

# Dry run
bundle exec rake preview:dry_run
```

## Front Matter

### Setting Preview Image in Posts

Add a `preview` field to your post's front matter:

```yaml
---
title: "My Amazing Blog Post"
date: 2025-01-28
preview: my-post-preview.png  # Relative to output_dir
# OR
preview: /assets/images/custom/my-image.png  # Absolute path
# OR
preview: https://example.com/image.png  # External URL
---
```

### Generated Images

When the script generates an image, it automatically:

1. Creates a filename based on the post slug (e.g., `my-amazing-post-preview.png`)
2. Saves the image to the configured `output_dir`
3. Updates the post's front matter with the `preview` field

## AI Providers

### Claude — SVG artist (Default)

- **No image-API key needed** — reuses your Claude Code credential
- Claude authors a standalone retro-pixel SVG banner (no embedded text); the
  engine sanitizes it (scripts, external references, and event handlers are
  stripped) and rasterizes it to PNG
- Credential chain, first match wins:
  1. `CLAUDE_CODE_OAUTH_TOKEN` — from `claude setup-token` (Claude Pro/Max)
  2. `ANTHROPIC_AUTH_TOKEN` — short-lived Bearer token
  3. `ANTHROPIC_API_KEY` — console.anthropic.com
  4. a logged-in `claude` CLI (headless `claude -p`) — zero setup
- Rasterizer chain: `rsvg-convert` → `inkscape` → `magick` → Playwright
  (`scripts/dev/rasterize-svg.js`). With none installed, the sanitized `.svg`
  is kept — the site renders it fine, but social `og:image` scrapers prefer
  PNG, so install librsvg (`brew install librsvg`) or Playwright.

```yaml
preview_images:
  provider: claude
  model: claude-opus-4-8   # default; any claude-* model
```

### OpenAI (GPT Image / DALL-E)

- **Best raster quality** for detailed, artistic images
- gpt-image-2 default; DALL-E 3 supports `hd` quality
- Also powers `--enhance` mode (`/v1/images/edits`) for every provider

```yaml
preview_images:
  provider: openai
  model: gpt-image-2   # or dall-e-3 / dall-e-2
  quality: auto        # standard/hd for DALL-E 3
  size: "1536x1024"    # DALL-E 3 uses 1792x1024 automatically
```

### xAI (Grok)

- `grok-2-image` via the OpenAI-compatible xAI API
- Requires `XAI_API_KEY`

```yaml
preview_images:
  provider: xai
```

### Stability AI

- Stable Diffusion XL; good for photorealistic images
- Requires `STABILITY_API_KEY`

```yaml
preview_images:
  provider: stability
```

### Google Gemini

- `gemini-2.5-flash-image` image generation
- Requires `GEMINI_API_KEY` (aistudio.google.com)

```yaml
preview_images:
  provider: gemini
```

### Local Template (no network)

- **No API required** — perfect for development, CI, and testing
- Generates a deterministic retro-landscape SVG (seeded from the post slug,
  same palette scheme as the claude provider) and rasterizes it to PNG
- Fast, free, and reproducible: the same post always gets the same banner

```yaml
preview_images:
  provider: local
```

## Customizing Styles

### Default Style (Retro Pixel Art)

The default configuration produces beautiful 8-bit style images:

```yaml
style: "retro pixel art, 8-bit video game aesthetic, vibrant colors, nostalgic, clean pixel graphics"
style_modifiers: "pixelated, retro gaming style, CRT screen glow effect, limited color palette"
```

### Alternative Styles

**Minimalist Tech:**

```yaml
style: "minimalist, clean lines, tech aesthetic, gradient backgrounds, modern"
style_modifiers: "simple shapes, professional, subtle shadows"
```

**Watercolor:**

```yaml
style: "watercolor painting, soft edges, artistic, flowing colors"
style_modifiers: "hand-painted feel, paper texture, artistic brush strokes"
```

**Cyberpunk:**

```yaml
style: "cyberpunk, neon lights, futuristic city, dark atmosphere"
style_modifiers: "glowing elements, rain reflections, high contrast"
```

**Flat Design:**

```yaml
style: "flat design, vector illustration, bold colors, simple shapes"
style_modifiers: "material design inspired, clean, modern icons"
```

## Prompt Generation

The script generates prompts from your post content:

1. **Title Analysis** - Extracts key concepts from the title
2. **Description** - Uses the post's description/excerpt
3. **Tags/Categories** - Incorporates relevant keywords
4. **Content Sampling** - Analyzes first paragraphs for context

### Example Generated Prompt

For a post titled "Getting Started with Git: A Beginner's Guide" with tags `[git, version-control, tutorial]`:

```text
Create an image representing: Getting Started with Git - A beginner's guide
Keywords: git, version-control, tutorial
Style: retro pixel art, 8-bit video game aesthetic, vibrant colors, nostalgic, clean pixel graphics
Modifiers: pixelated, retro gaming style, CRT screen glow effect, limited color palette
```

## Troubleshooting

### Common Issues

#### "API key not set"

```bash
# Check if .env is loaded
cat .env | grep OPENAI

# Verify environment variable
echo $OPENAI_API_KEY
```

#### "Rate limit exceeded"

- OpenAI has rate limits; wait a few minutes
- Consider using `--dry-run` first to plan

#### "Image generation failed"

- Check your API key is valid and has credits
- Verify network connectivity
- Check API status at status.openai.com

#### "Front matter not updated"

- Ensure the script has write permission to post files
- Check the preview path doesn't already exist

### Debug Mode

Run with verbose output for detailed diagnostics:

```bash
./scripts/generate-preview-images.sh --verbose --dry-run 2>&1 | tee debug.log
```

### Support

- [GitHub Issues](https://github.com/bamr87/zer0-mistakes/issues)
- [Documentation](https://bamr87.github.io/zer0-mistakes/docs/)
- [Discussions](https://github.com/bamr87/zer0-mistakes/discussions)

## Changelog

### Version 1.27.0 (Current)

- Consolidated Bash/Python duplicates into one Python engine
  (`scripts/lib/preview_generator.py`) with a provider framework
- **Claude (Code OAuth) is the default provider** — SVG artist pipeline with
  local rasterization and mandatory SVG sanitization
- New providers: xAI unified into the main engine, Google Gemini added
- `local` provider now produces a real deterministic SVG/PNG banner
- Optional `--prompt-engine claude` art-prompt director for raster vendors
- Front-matter updates are scoped to the front-matter block (body-corruption fix)
- `enabled`, `assets_prefix`, and `auto_prefix` config keys are now honored

### Version 0.8.0

- Initial release as installable module
- OpenAI DALL-E 3 support
- Stability AI support
- Local placeholder generation
- Jekyll plugin with Liquid filters
- VS Code task integration
- Configurable via `_config.yml`
- One-line remote installation

## License

Part of the zer0-mistakes Jekyll theme. MIT License.

---

### Built with ❤️ for the Jekyll community

---

> **User guide**: For setup and configuration examples, see [AI Preview Image Generator](/docs/features/preview-image-generator/) in the user documentation.
