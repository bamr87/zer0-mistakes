# Theme Version Display Feature

## Overview

The zer0-mistakes Jekyll theme now includes an automatic theme version display system that shows version information and system details accessible from any page on the site.

## Features

### 1. Automatic Version Detection

The theme automatically detects and displays:

- **Theme Version**: Extracted dynamically from gem specification (no hardcoding)
- **Jekyll Version**: Current Jekyll version used for build
- **Ruby Version**: Ruby version from environment
- **Build Environment**: Development/production status
- **Last Build Time**: Timestamp of last site generation

### 2. Comprehensive System Information

The info modal displays:

- Theme repository and links to documentation
- Active Jekyll plugins
- Technology stack with versions
- Site repository information
- Collection configuration details

### 3. Easy Access

Users can access the theme information via:

- **Gear Icon** in the header navigation (⚙️)
- **Info Button** in the footer ("Info")
- Keyboard shortcut (when modal is open, press ESC to close)

## How It Works

### 1. Plugin-Based Version Extraction

File: `_plugins/theme_version.rb`

This Jekyll plugin runs during build and:

- Scans for installed theme gems
- Extracts version from Gem specification
- Makes version data available as `site.theme_specs`
- Handles both local and remote themes gracefully

```ruby
# Automatically populates site.theme_specs with:
{
  'name' => 'jekyll-theme-zer0',
  'version' => '0.5.0',
  'type' => 'gem',
  'homepage' => 'https://github.com/bamr87/zer0-mistakes'
}
```

### 2. Dynamic Template Display

File: `_includes/components/theme-info.html`

The template:

- Reads version from `site.theme_specs`
- Falls back to "Latest" for remote themes
- Displays all system and build information
- Provides helpful links to documentation and support

### 3. Modal Integration

File: `_includes/components/info-section.html`

The existing settings modal was enhanced to include:

- Theme information card
- System details
- Technology stack table
- Help and support links

## Usage in Other Sites

To use this feature in your site using zer0-mistakes theme:

### 1. No Configuration Needed!

The feature works automatically when you use:

```yaml
remote_theme: "bamr87/zer0-mistakes"
```

### 2. Access the Information

Click the gear icon (⚙️) in the header or "Info" in the footer.

### 3. Customize (Optional)

You can override the theme-info display by creating:

```
your-site/_includes/components/theme-info.html
```

## For Theme Developers

### Adding Custom Information

To add custom fields to theme info, edit the plugin:

```ruby
# _plugins/theme_version.rb
theme_specs << {
  'name' => spec.name,
  'version' => spec.version.to_s,
  'custom_field' => 'your value'
}
```

Then display in template:

```liquid
{{ site.theme_specs | where: "name", "theme-name" | map: "custom_field" | first }}
```

### Version Update Process

1. Update `lib/jekyll-theme-zer0/version.rb`:

   ```ruby
   VERSION = "0.6.0"
   ```

2. Build and publish gem:

   ```bash
   gem build jekyll-theme-zer0.gemspec
   gem push jekyll-theme-zer0-0.6.0.gem
   ```

3. Version automatically appears in all sites using the theme!

## Benefits

✅ **No Hardcoding**: Version is extracted automatically during build  
✅ **Always Accurate**: Reflects actual installed/remote theme version  
✅ **User-Friendly**: Easy access from any page via header/footer  
✅ **Comprehensive**: Shows full system and environment details  
✅ **Helpful**: Links to docs, changelog, and support resources  
✅ **Maintainable**: Single source of truth (gemspec version)

## Troubleshooting

### Version Shows "Latest" Instead of Number

This is normal for remote themes. GitHub Pages pulls the latest commit, so there's no fixed version number. To see a specific version:

1. Use the theme as a gem: `gem "jekyll-theme-zer0"`
2. Or check the theme's CHANGELOG on GitHub

### Plugin Not Working

Ensure the plugin directory exists:

```
_plugins/
  theme_version.rb
```

For GitHub Pages, plugins run automatically. For local development, restart Jekyll after adding the plugin.

### Modal Not Opening

Check that Bootstrap JavaScript is loaded:

```html
<!-- In your layout -->
{% include components/js-cdn.html %}
```

## Related Files

- `_plugins/theme_version.rb` - Version extraction plugin
- `_includes/components/theme-info.html` - Display template
- `_includes/components/info-section.html` - Modal container
- `_includes/core/header.html` - Gear icon button
- `_includes/core/footer.html` - Info button
- `lib/jekyll-theme-zer0/version.rb` - Source of truth for version

## Future Enhancements

Potential improvements:

- [ ] Add version comparison (current vs latest available)
- [ ] Show update notification when new version available
- [ ] Display theme changelog directly in modal
- [ ] Add theme configuration preview
- [ ] Show deprecation warnings for old versions

## License

This feature is part of the zer0-mistakes theme and follows the same MIT license.
