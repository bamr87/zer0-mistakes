---
title: AI Preview Image Generator
layout: default
description: Automatically generate AI-powered preview images for Jekyll posts using OpenAI DALL-E, Stability AI, or local placeholders.
permalink: /docs/features/preview-image-generator/
feature_id: ZER0-003
version: "0.8.1"
lastmod: 2025-05-31
---

# AI Preview Image Generator

## Overview

The AI Preview Image Generator is a powerful feature of the zer0-mistakes Jekyll theme that automatically creates eye-catching preview images for your blog posts and articles using AI image generation services.

### Key Features

- 🎨 **AI-Powered Generation** - Uses OpenAI DALL-E 3, Stability AI, or local placeholders
- 🔧 **Highly Configurable** - Customize style, size, quality via `_config.yml`
- 🎮 **Retro Pixel Art Defaults** - Beautiful 8-bit aesthetic out of the box
- 📦 **Easy Installation** - One-command setup for any Jekyll site
- 🔌 **Jekyll Integration** - Liquid filters, tags, and build hooks
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
# Download the main script
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/scripts/generate-preview-images.sh -o scripts/generate-preview-images.sh
chmod +x scripts/generate-preview-images.sh

# Download the Python alternative (optional)
mkdir -p scripts/lib
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/scripts/lib/preview_generator.py -o scripts/lib/preview_generator.py

# Download the Jekyll plugin
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/_plugins/preview_image_generator.rb -o _plugins/preview_image_generator.rb
```

2. **Add configuration to `_config.yml`:**

```yaml
preview_images:
  enabled: true
  provider: openai
  model: dall-e-3
  size: "1792x1024"
  quality: standard
  style: "retro pixel art, 8-bit video game aesthetic, vibrant colors"
  output_dir: assets/images/previews
```

3. **Set up your API key:**

```bash
# Create .env file (add to .gitignore!)
echo "OPENAI_API_KEY=your-key-here" >> .env
echo ".env" >> .gitignore
```

## Configuration

### Full Configuration Options

Add these options to your `_config.yml`:

```yaml
preview_images:
  # Enable/disable the feature
  enabled: true

  # AI Provider: openai, stability, or local
  provider: openai

  # OpenAI-specific settings
  model: dall-e-3 # dall-e-2 or dall-e-3
  quality: standard # standard or hd (dall-e-3 only)

  # Image dimensions (landscape banner format)
  size: "1792x1024"

  # Default style for generated images
  style: "retro pixel art, 8-bit video game aesthetic, vibrant colors, nostalgic, clean pixel graphics"

  # Additional style modifiers appended to prompts
  style_modifiers: "pixelated, retro gaming style, CRT screen glow effect, limited color palette"

  # Output directory for generated images (relative to site root)
  output_dir: assets/images/previews

  # Auto-generate during Jekyll build (slow, not recommended)
  auto_generate: false

  # Collections to scan for missing preview images
  collections:
    - posts
    - docs
    - quickstart
```

### Environment Variables

Create a `.env` file in your project root:

```bash
# OpenAI DALL-E (recommended)
OPENAI_API_KEY=sk-your-openai-api-key

# Stability AI (alternative)
STABILITY_API_KEY=sk-your-stability-api-key

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
./scripts/generate-preview-images.sh --provider stability
```

### CLI Options

| Option                    | Description                            |
| ------------------------- | -------------------------------------- |
| `-h, --help`              | Show help message                      |
| `-d, --dry-run`           | Preview without making changes         |
| `-v, --verbose`           | Enable verbose output                  |
| `-f, --file FILE`         | Process specific file only             |
| `-c, --collection NAME`   | Process specific collection            |
| `-p, --provider PROVIDER` | AI provider (openai, stability, local) |
| `--output-dir DIR`        | Custom output directory                |
| `--force`                 | Regenerate existing images             |
| `--list-missing`          | Only list files missing previews       |

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

### OpenAI DALL-E 3 (Recommended)

- **Best quality** for detailed, artistic images
- Supports `hd` quality for higher resolution
- Excellent prompt understanding
- Cost: ~$0.04 per image (standard) / ~$0.08 (hd)

```yaml
preview_images:
  provider: openai
  model: dall-e-3
  quality: standard # or hd
  size: "1792x1024" # or 1024x1024, 1024x1792
```

### Stability AI

- Alternative provider with different artistic styles
- Good for photorealistic images
- Various model options available

```yaml
preview_images:
  provider: stability
  # Uses environment variable STABILITY_API_KEY
```

### Local Placeholder

- **No API required** - perfect for development/testing
- Generates solid color placeholders with text overlay
- Fast and free

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

```
Create an image representing: Getting Started with Git - A beginner's guide
Keywords: git, version-control, tutorial
Style: retro pixel art, 8-bit video game aesthetic, vibrant colors, nostalgic, clean pixel graphics
Modifiers: pixelated, retro gaming style, CRT screen glow effect, limited color palette
```

## Installing in Other Repositories

The AI Preview Image Generator can be installed in any Jekyll site. Here's a complete walkthrough tested with the [it-journey](https://github.com/bamr87/it-journey) repository.

### Step 1: Run the Installer

```bash
# From your Jekyll project root
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/scripts/install-preview-generator.sh | bash

# Or if you have zer0-mistakes cloned locally:
cd /path/to/zer0-mistakes
./scripts/install-preview-generator.sh --target /path/to/your-jekyll-site

# Use --force to overwrite existing files
./scripts/install-preview-generator.sh --force
```

### Step 2: Configure Your API Key

```bash
# Create .env file in your project root
echo "OPENAI_API_KEY=sk-your-actual-key-here" >> .env
echo ".env" >> .gitignore
```

### Step 3: Configure Collections

Add to your `_config.yml`:

```yaml
preview_images:
  enabled: true
  provider: openai
  model: dall-e-3
  size: "1792x1024"
  quality: standard
  style: "retro pixel art, 8-bit video game aesthetic, vibrant colors, nostalgic, clean pixel graphics"
  output_dir: assets/images/previews
  collections:
    - posts # Standard Jekyll posts
    - quests # Custom collection (adjust for your site)
    - docs # Documentation pages
```

### Step 4: Generate Images

```bash
# List what needs images
./scripts/generate-preview-images.sh --list-missing

# Dry run to preview
./scripts/generate-preview-images.sh --collection posts --dry-run

# Generate for real
./scripts/generate-preview-images.sh --collection posts
```

### What Gets Installed

The installer copies these files to your project:

| File                                  | Purpose                  |
| ------------------------------------- | ------------------------ |
| `scripts/generate-preview-images.sh`  | Main CLI script          |
| `scripts/lib/preview_generator.py`    | Python alternative       |
| `_plugins/preview_image_generator.rb` | Jekyll Liquid filters    |
| `.env.example`                        | Template for API keys    |
| `.vscode/tasks.json`                  | VS Code task integration |

### Custom Collections

The script dynamically reads collections from your `_config.yml`. To add a new collection:

1. Add it to `preview_images.collections` in `_config.yml`
2. Ensure the collection path exists (e.g., `pages/_quests/`)
3. Run with `--collection your_collection_name`

## Troubleshooting

### Common Issues

**"API key not set"**

```bash
# Check if .env is loaded
cat .env | grep OPENAI

# Verify environment variable
echo $OPENAI_API_KEY

# Source .env manually if needed
source .env
```

**"Unknown collection"**

- Ensure collection is listed in `preview_images.collections` in `_config.yml`
- Check the collection directory exists
- Run `--list-missing` to see recognized collections

**"Rate limit exceeded"**

- OpenAI has rate limits; wait a few minutes
- Consider using `--dry-run` first to plan
- Process one collection at a time

**"Image generation failed"**

- Check your API key is valid and has credits
- Verify network connectivity
- Check API status at status.openai.com

**"Front matter not updated" or yq errors**

- The script uses `sed` for front matter updates (more reliable than yq)
- If you see "mapping values not allowed" or "unknown anchor" errors with yq, the sed fallback should handle it
- Ensure the script has write permission to post files

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

### Version 0.8.1 (Latest)

- **Fixed**: `print_header` function missing in fallback logging
- **Fixed**: Dynamic collection reading from `_config.yml` (no more hardcoded lists)
- **Fixed**: Front matter updates now use `sed` instead of `yq` for better compatibility with complex YAML (anchors, aliases)
- **Added**: macOS/Linux compatibility for `sed -i` flag differences
- **Added**: Comprehensive installation documentation with real-world testing

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

_Built with ❤️ for the Jekyll community_
