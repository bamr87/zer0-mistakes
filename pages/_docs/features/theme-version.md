---
lastmod: 2026-06-16T00:00:00.000Z
title: Theme Version Display Plugin
description: Automatic theme version extraction from the installed gem specification, surfaced through the Settings panel opened from the header gear or footer Info button.
preview: /images/previews/theme-version-display-plugin.png
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
estimated_reading_time: 5 minutes
sidebar:
    nav: docs
---

# Theme Version Display Plugin

The Zer0-Mistakes theme includes a Jekyll plugin (`_plugins/theme_version.rb`) that automatically extracts the theme version from the installed gem specification during the build, then exposes it to Liquid so the UI can show it.

## Overview

The plugin provides:

- **Automatic Extraction**: Reads the version from the installed gem's `Gem::Specification` (no hardcoding)
- **Global Variable**: `site.theme_specs` — an array of theme specs — available in Liquid
- **Settings Panel**: Theme and build info shown in the Settings offcanvas (`info-section.html`)
- **Header & Footer Access**: Open the panel from the header gear icon or the footer Info button

> [!NOTE]
> The single source of truth for the version number is
> `lib/jekyll-theme-zer0.gemspec` → `s.version`, which reads
> `JekyllThemeZer0::VERSION` from `lib/jekyll-theme-zer0/version.rb`. Bump it only
> via `./scripts/bin/release`, never by hand.

## How It Works

### Plugin Location

```text
_plugins/
└── theme_version.rb
```

### Version Extraction

The plugin is a Jekyll `Generator` (`ThemeVersionGenerator`, `priority :high`) that runs during the build. For a local gem theme it loads the gem's `Gem::Specification`; for a `remote_theme` it records `"latest"` (GitHub Pages serves the latest commit, so there is no pinned version):

```ruby
# _plugins/theme_version.rb (abridged)
module Jekyll
  class ThemeVersionGenerator < Generator
    safe true
    priority :high

    def generate(site)
      theme_specs = []

      if site.config['remote_theme']
        remote_theme = site.config['remote_theme']
        theme_specs << {
          'name'       => remote_theme.split('/').last,
          'type'       => 'remote',
          'repository' => remote_theme,
          'version'    => 'latest'
        }
      elsif site.config['theme']
        spec = Gem::Specification.find_by_name(site.config['theme'])
        theme_specs << {
          'name'    => spec.name,
          'version' => spec.version.to_s,
          'type'    => 'gem',
          'homepage' => spec.homepage,
          'summary'  => spec.summary,
          'authors'  => spec.authors
        }
      end

      # Make theme specs available to templates
      site.config['theme_specs'] = theme_specs
    end
  end
end
```

## Usage

### In Templates

The plugin exposes `site.theme_specs` (an array), not a single `site.theme_version` string. Pull the version for a named theme like this:

```liquid
{% raw %}<!-- Display the version for this theme -->
<span>v{{ site.theme_specs | where: "name", "jekyll-theme-zer0" | map: "version" | first }}</span>

<!-- Conditional display -->
{% assign zer0 = site.theme_specs | where: "name", "jekyll-theme-zer0" | first %}
{% if zer0 %}
  Version: {{ zer0.version }} ({{ zer0.type }})
{% endif %}{% endraw %}
```

When the site runs in development mode (`theme: "jekyll-theme-zer0"`), `version` is the installed gem version. For a `remote_theme` site it is `"latest"`.

### Where it appears in the UI

The version and build details are surfaced through the **Settings** offcanvas (`_includes/components/info-section.html`), which embeds `_includes/components/theme-info.html`. Open it from:

- The **gear icon** in the header (`_includes/core/header.html`,
  `data-bs-target="#info-section"`).
- The **Info** button in the footer (`_includes/core/footer.html`).

In the panel, the **Site** tab's *Theme & Build* section shows the theme, Jekyll version, last build time, and repository. The `theme-info.html` include renders the theme name from `site.remote_theme` / `site.theme` and the build metadata from `jekyll.version`, `jekyll.environment`, and `site.time`.

## Configuration

### Version Source

The plugin resolves the version from the active theme configuration — no dedicated config key is required:

1. `remote_theme: "bamr87/zer0-mistakes"` → the spec's `version` is `"latest"`.
2. `theme: "jekyll-theme-zer0"` (development) → the version comes from the
installed gem's `Gem::Specification`, which in turn reads `JekyllThemeZer0::VERSION` in `lib/jekyll-theme-zer0/version.rb`.

### Display your own version

There is no `theme_version` or `show_theme_version` config key — render the value yourself from `site.theme_specs`:

```liquid
{% raw %}{% assign zer0 = site.theme_specs | where: "name", "jekyll-theme-zer0" | first %}
{% if zer0 %}v{{ zer0.version }}{% endif %}{% endraw %}
```

## Customization

### Version Badge

```html
{% raw %}{% assign zer0 = site.theme_specs | where: "name", "jekyll-theme-zer0" | first %}
<span class="badge bg-primary">v{{ zer0.version }}</span>{% endraw %}
```

### With Link to the Changelog

`CHANGELOG.md` is not served as a Jekyll page, so link to the GitHub copy rather than a local `/CHANGELOG/` URL:

```html
{% raw %}{% assign zer0 = site.theme_specs | where: "name", "jekyll-theme-zer0" | first %}
<a href="https://github.com/bamr87/zer0-mistakes/blob/main/CHANGELOG.md" class="version-link">
  v{{ zer0.version }}
</a>{% endraw %}
```

## Development vs Production

### Development Mode

`_config_dev.yml` sets `remote_theme: false` and `theme: "jekyll-theme-zer0"`, so the plugin extracts the version from the locally installed gem.

### Production Mode

`_config.yml` sets `remote_theme: "bamr87/zer0-mistakes"`, so the spec reports `version: "latest"` (GitHub Pages serves the latest commit).

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

## Technical Reference

For implementation details (Jekyll plugin architecture, version extraction, modal integration):

- [Theme Version Feature → docs/features/theme-version.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/features/theme-version.md)

## See also

- [[Features]]
- [[Development]]
