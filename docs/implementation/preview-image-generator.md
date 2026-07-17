---
title: AI Preview Image Generator
layout: default
description: Generate AI-powered preview images for Jekyll posts — Claude analyzes the article and reviews the result; OpenAI, xAI, Stability, Gemini, or a local template renders it.
permalink: /docs/features/preview-image-generator/
feature_id: ZER0-004
version: "1.27.0"
date: 2026-04-01T00:00:00.000Z
lastmod: 2026-07-13T00:00:00.000Z
categories: [docs]
tags: [implementation, ai, images]
author: bamr87
---

# AI Preview Image Generator

## Overview

The AI Preview Image Generator automatically creates eye-catching banner images for your posts and articles. One consolidated Python engine (`scripts/lib/preview_generator.py`) drives every entry point.

**Claude orchestrates; an image model renders.** For each post, Claude reads the article and writes a content-specific art-direction brief (*analyze*), a raster image model — OpenAI's gpt-image-2 by default — renders it (*produce*), and Claude then inspects the result with vision, requesting one refined regeneration if the image misrepresents the article (*review*). Claude never renders pixels itself; without a Claude credential the pipeline degrades gracefully to a template prompt with no review.

### Key Features

- 🧠 **Claude as art director & editor** - analyzes each article into a vivid, subject-specific image brief, then vision-reviews the render against the article (Claude Code OAuth token, Anthropic API key, or a logged-in `claude` CLI)
- 🎨 **Renderer framework** - `openai` (gpt-image-2 / DALL-E, default), `xai` (grok-2-image), `stability`, `gemini`, and a no-network `local` template engine
- 🔧 **Highly Configurable** - Customize renderer, style, size, quality via `_config.yml`
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
# local template provider when no native rasterizer is installed)
mkdir -p scripts/dev
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/scripts/dev/rasterize-svg.js -o scripts/dev/rasterize-svg.js
```

1. **Add configuration to `_config.yml`:**

```yaml
preview_images:
  enabled: true
  provider: openai          # renderer: openai, xai, stability, gemini, local
  model: gpt-image-2
  size: "1536x1024"
  quality: auto
  style: "retro pixel art, 8-bit video game aesthetic, vibrant colors"
  output_dir: assets/images/previews
  prompt_engine: claude     # Claude analyzes the article into the art brief
  review_engine: claude     # Claude reviews the render and may refine once
```

1. **Set up credentials:**

```bash
# Renderer (default: openai)
echo "OPENAI_API_KEY=sk-your-key" >> .env

# Claude orchestration — any ONE (optional; degrades to template prompts):
claude setup-token          # then add CLAUDE_CODE_OAUTH_TOKEN=... to .env
echo "ANTHROPIC_API_KEY=sk-ant-your-key" >> .env
# ...or nothing at all — a logged-in `claude` CLI is used automatically.

echo ".env" >> .gitignore
```

## Configuration

### Full Configuration Options

Add these options to your `_config.yml`:

```yaml
preview_images:
  # Enable/disable the feature
  enabled: true

  # Renderer: openai (default), xai, stability, gemini, local
  provider: openai

  # Renderer model — empty uses the provider default (gpt-image-2,
  # grok-2-image, gemini-2.5-flash-image, ...). A model from another vendor
  # family is ignored with a warning rather than sent to the wrong API.
  model: gpt-image-2
  quality: auto                      # auto for GPT Image; standard/hd for DALL-E 3

  # Image dimensions (landscape banner format; raster vendors adapt per model)
  size: "1536x1024"

  # Default style for generated images
  style: "retro pixel art, 8-bit video game aesthetic, vibrant colors, nostalgic, clean pixel graphics"

  # Additional style modifiers appended to prompts
  style_modifiers: "pixelated, retro gaming style, CRT screen glow effect, limited color palette"

  # Output directory for generated images (relative to site root)
  output_dir: assets/images/previews

  # Claude orchestration:
  #   prompt_engine: claude — Claude analyzes the article and writes the art
  #     brief the renderer receives (template = built-in prompt)
  #   review_engine: claude — Claude inspects the rendered image with vision
  #     and may request ONE refined regeneration (none = skip)
  #   claude_model — optional override for the orchestration model
  prompt_engine: claude
  review_engine: claude
  # claude_model: claude-opus-4-8

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
# Renderer (default openai; others for the matching --provider choice)
OPENAI_API_KEY=sk-your-openai-api-key      # also powers --enhance
XAI_API_KEY=xai-your-xai-key
STABILITY_API_KEY=sk-your-stability-api-key
GEMINI_API_KEY=your-gemini-key

# Claude orchestration (analysis + review) — any ONE of:
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...   # from `claude setup-token`
ANTHROPIC_AUTH_TOKEN=...                   # short-lived Bearer token
ANTHROPIC_API_KEY=sk-ant-...               # console.anthropic.com
# (or a logged-in `claude` CLI — no variable needed)

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

# Use a specific renderer
./scripts/generate-preview-images.sh --provider gemini

# Skip Claude orchestration (template prompt, no review)
./scripts/generate-preview-images.sh --prompt-engine template --review none

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
| `-p, --provider PROVIDER` | Renderer (openai, xai, stability, gemini, local) |
| `--model MODEL` | Override the renderer's model |
| `--prompt-engine ENGINE` | `claude` analyzes the article (default) or `template` |
| `--review ENGINE` | `claude` reviews the render, may refine once (default) or `none` |
| `--rasterizer TOOL` | SVG→PNG tool for `local`: auto, rsvg, inkscape, magick, playwright, none |
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

Rendering is pure Liquid — no custom plugin required, so it works under the `github-pages` gem (safe mode) too. Use the theme's `_includes/components/preview-image.html` include, which handles the assets prefix, external URLs, and the `site.teaser` fallback:

{% raw %}

```liquid
{% include components/preview-image.html src=page.preview alt=page.title %}
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

## Claude Orchestration

Claude wraps every raster renderer with two stages (both default-on, both degrade gracefully without a Claude credential):

- **Analyze** (`prompt_engine: claude`) — Claude reads the article's title,
description, tags and an excerpt, then writes a subject-specific art-direction brief (concrete scene, banner composition, your configured style woven in, strict no-text rule). This replaces the generic template prompt that produced unrepresentative images.
- **Review** (`review_engine: claude`) — Claude inspects the rendered PNG with
vision against the article and style. If the image misrepresents the subject, breaks the style, or contains text artifacts, Claude writes a corrected prompt and the engine regenerates ONCE; otherwise the image is approved as-is.

Credential chain, first match wins:

1. `CLAUDE_CODE_OAUTH_TOKEN` — from `claude setup-token` (Claude Pro/Max)
2. `ANTHROPIC_AUTH_TOKEN` — short-lived Bearer token
3. `ANTHROPIC_API_KEY` — console.anthropic.com
4. a logged-in `claude` CLI (headless `claude -p`) — zero setup

## Renderers

### OpenAI (GPT Image / DALL-E) — default

- **Best raster quality** for detailed, artistic images; the default renderer
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
- Generates a deterministic retro-landscape SVG (seeded from the post slug)
and rasterizes it to PNG via `rsvg-convert` → `inkscape` → `magick` → Playwright (`scripts/dev/rasterize-svg.js`); with no rasterizer the sanitized `.svg` is kept
- Fast, free, and reproducible: the same post always gets the same banner
- Skips Claude analysis/review (its output is deterministic by design)

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
  (`scripts/lib/preview_generator.py`) with a renderer framework
- **Claude orchestrates every generation** — analyzes the article into a
subject-specific art brief (`prompt_engine: claude`) and vision-reviews the rendered image, regenerating once with a corrected prompt when it misrepresents the article (`review_engine: claude`)
- Renderers: OpenAI gpt-image-2 (default), xAI unified into the main engine,
  Google Gemini added, Stability retained
- `local` provider now produces a real deterministic SVG/PNG banner
  (sanitized; rasterized via a local tool chain)
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
