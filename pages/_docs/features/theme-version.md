---
title: Theme Version Display Plugin
description: Automatic theme version extraction from gem specification with modal display and footer integration.
layout: default
categories:
    - docs
    - features
tags:
    - version
    - plugin
    - footer
    - gem
permalink: /docs/features/theme-version/
difficulty: beginner
estimated_time: 5 minutes
sidebar:
    nav: docs
---

# Theme Version Display Plugin

The Zer0-Mistakes theme includes a Jekyll plugin that automatically extracts and displays the theme version from the gem specification.

## Overview

The plugin provides:

- **Automatic Extraction**: Reads version from `.gemspec`
- **Global Variable**: `site.theme_version` available in Liquid
- **Footer Display**: Shows version in site footer
- **Modal Integration**: Detailed version info in modal

## How It Works

### Plugin Location

```
_plugins/
└── theme_version.rb
```

### Version Extraction

The plugin reads from `jekyll-theme-zer0.gemspec`:

```ruby
# _plugins/theme_version.rb
module Jekyll
  class ThemeVersion < Generator
    safe true
    priority :highest

    def generate(site)
      gemspec = File.join(site.source, 'jekyll-theme-zer0.gemspec')
      if File.exist?(gemspec)
        content = File.read(gemspec)
        if content =~ /version\s*=\s*["']([^"']+)["']/
          site.config['theme_version'] = $1
        end
      end
    end
  end
end
```

## Usage

### In Templates

Access the version in any template:

```liquid
{% raw %}<!-- Display version -->
<span>v{{ site.theme_version }}</span>

<!-- Conditional display -->
{% if site.theme_version %}
  Version: {{ site.theme_version }}
{% endif %}{% endraw %}
```

### Footer Integration

The default footer includes version display:

```html
{% raw %}<footer class="site-footer">
  <div class="footer-info">
    <span class="theme-version">
      Zer0-Mistakes v{{ site.theme_version | default: "dev" }}
    </span>
  </div>
</footer>{% endraw %}
```

### Version Modal

Detailed version information in modal:

```html
{% raw %}<!-- Version info button -->
<button type="button" 
        class="btn btn-link btn-sm" 
        data-bs-toggle="modal" 
        data-bs-target="#themeInfoModal">
  v{{ site.theme_version }}
</button>

<!-- Modal content -->
<div class="modal fade" id="themeInfoModal">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5>Theme Information</h5>
      </div>
      <div class="modal-body">
        <dl>
          <dt>Theme</dt>
          <dd>Zer0-Mistakes</dd>
          <dt>Version</dt>
          <dd>{{ site.theme_version }}</dd>
          <dt>Jekyll</dt>
          <dd>{{ jekyll.version }}</dd>
        </dl>
      </div>
    </div>
  </div>
</div>{% endraw %}
```

## Configuration

### Version Source

The plugin looks for version in:

1. `jekyll-theme-zer0.gemspec` (primary)
2. `lib/jekyll-theme-zer0/version.rb` (fallback)

### Override Version

Set manually in `_config.yml`:

```yaml
theme_version: "1.0.0-custom"
```

### Hide Version

To hide version display:

```yaml
show_theme_version: false
```

Then in templates:

```liquid
{% raw %}{% if site.show_theme_version != false %}
  v{{ site.theme_version }}
{% endif %}{% endraw %}
```

## Customization

### Footer Styling

```css
.theme-version {
  font-size: 0.875rem;
  color: var(--bs-secondary);
}

.theme-version:hover {
  color: var(--bs-primary);
  cursor: pointer;
}
```

### Version Badge

```html
{% raw %}<span class="badge bg-primary">
  v{{ site.theme_version }}
</span>{% endraw %}
```

### With Link to Changelog

```html
{% raw %}<a href="/CHANGELOG/" class="version-link">
  v{{ site.theme_version }}
</a>{% endraw %}
```

## Development vs Production

### Development Mode

When running locally without gem:

```yaml
# _config_dev.yml
theme_version: "development"
```

### Production Mode

Plugin automatically extracts from gemspec.

## Troubleshooting

### Version Not Showing

1. Check plugin file exists in `_plugins/`
2. Verify gemspec file exists
3. Check for Ruby errors in build log

### Wrong Version

1. Clear Jekyll cache: `rm -rf .jekyll-cache`
2. Rebuild: `bundle exec jekyll build`
3. Verify gemspec version is correct

### Plugin Not Loading

1. Check safe mode isn't enabled
2. Verify Ruby syntax in plugin
3. Check file permissions

## Related

- [Release Management](/docs/development/release-management/)
- [Version Bump](/docs/development/version-bump/)
- [Gem Publishing](/docs/development/release-management/#rubygems-publishing)
