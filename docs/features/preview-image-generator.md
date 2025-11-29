---
title: AI Preview Image Generator
layout: default
description: Automatically generate AI-powered preview images for Jekyll posts using OpenAI DALL-E, Stability AI, or local placeholders.
permalink: /docs/features/preview-image-generator/
feature_id: ZER0-003
version: "0.8.0"
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
  model: dall-e-3                    # dall-e-2 or dall-e-3
  quality: standard                  # standard or hd (dall-e-3 only)
  
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

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message |
| `-d, --dry-run` | Preview without making changes |
| `-v, --verbose` | Enable verbose output |
| `-f, --file FILE` | Process specific file only |
| `-c, --collection NAME` | Process specific collection |
| `-p, --provider PROVIDER` | AI provider (openai, stability, local) |
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
  quality: standard  # or hd
  size: "1792x1024"  # or 1024x1024, 1024x1792
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

## Troubleshooting

### Common Issues

**"API key not set"**
```bash
# Check if .env is loaded
cat .env | grep OPENAI

# Verify environment variable
echo $OPENAI_API_KEY
```

**"Rate limit exceeded"**
- OpenAI has rate limits; wait a few minutes
- Consider using `--dry-run` first to plan

**"Image generation failed"**
- Check your API key is valid and has credits
- Verify network connectivity
- Check API status at status.openai.com

**"Front matter not updated"**
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

### Version 0.8.0 (Current)
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

*Built with ❤️ for the Jekyll community*
