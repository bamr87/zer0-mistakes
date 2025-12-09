# Features Documentation

This directory contains the comprehensive features registry for the Zer0-Mistakes Jekyll theme.

## 📄 Files

- **features.yml** - Complete feature registry with 40 documented features

## 📊 Features Overview

The features.yml file documents all implemented features of the Zer0-Mistakes theme, organized into 15 categories:

1. **Core Theme** (3 features) - Bootstrap 5 integration, layouts, remote theme support
2. **Development** (6 features) - Docker, AI installation, testing, shortcuts
3. **Automation** (4 features) - Version management, changelog, gem publishing, CI/CD
4. **Analytics** (2 features) - PostHog, Google Analytics
5. **Privacy** (1 feature) - Cookie consent management
6. **Navigation** (6 features) - Sidebar, responsive nav, breadcrumbs, auto-hide navbar
7. **Content** (5 features) - AI image generator, Mermaid, Jupyter conversion, statistics
8. **SEO** (1 feature) - Enhanced sitemap
9. **UI Components** (6 features) - Cards, theme info, color modes, code copy
10. **Security** (1 feature) - CodeQL scanning
11. **Accessibility** (1 feature) - Skip to content link
12. **Customization** (1 feature) - SASS styling
13. **Configuration** (1 feature) - Environment variables
14. **Documentation** (2 features) - Comprehensive docs, Copilot instructions

## 🎯 Feature Structure

Each feature includes:

```yaml
- id: ZER0-XXX                    # Unique identifier
  title: "Feature Name"           # Display name
  description: "Detailed description of the feature"
  implemented: true               # Implementation status
  link: "/path/to/source"        # Source code location
  documentation: "/docs/path/"   # Documentation reference
  tags: [tag1, tag2, tag3]       # Searchable tags
  date: 2025-01-27               # Implementation date
  version: "0.1.0"               # Version introduced
  category: "Category Name"      # Feature category
```

Optional fields may include:
- `components` - List of related files
- `commands` - Common commands for the feature
- `workflows` - Related GitHub Actions workflows
- `config` - Configuration examples
- `dependencies` - Required dependencies
- `providers` - Service providers (for integrations)
- `installation` - Installation instructions

## 🔧 Usage

### In Jekyll Templates

The features data is available in Jekyll templates via `site.data.features.features`:

```liquid
{% assign all_features = site.data.features.features %}
{% for feature in all_features %}
  <h3>{{ feature.title }}</h3>
  <p>{{ feature.description }}</p>
{% endfor %}
```

### Display Components

Use the included components to display features:

```liquid
{% comment %} Display all features as cards {% endcomment %}
{% include components/features-list.html style="cards" %}

{% comment %} Display features by category {% endcomment %}
{% include components/features-list.html category="Development" %}

{% comment %} Display features by tag {% endcomment %}
{% include components/features-list.html tag="automation" %}

{% comment %} Display as table {% endcomment %}
{% include components/features-list.html style="table" %}

{% comment %} Display as list {% endcomment %}
{% include components/features-list.html style="list" %}
```

### Filter Options

Available parameters for `features-list.html`:

- `category` - Filter by specific category
- `tag` - Filter by specific tag
- `show_all` - Show all features (default: true)
- `limit` - Limit number of features displayed
- `style` - Display style: "cards", "list", "table" (default: "cards")

## 📖 Documentation Pages

### Main Features Page
- **Location**: `/pages/_about/features/index.md`
- **URL**: `/about/features/`
- **Content**: High-level features overview with learning paths

### Complete Features Reference
- **Location**: `/pages/_about/features/all-features.md`
- **URL**: `/about/features/all/`
- **Content**: Comprehensive list of all features dynamically rendered from features.yml

## 🔄 Maintenance

### Adding a New Feature

1. Open `features/features.yml`
2. Add a new entry following the structure above
3. Assign the next sequential ID (ZER0-XXX)
4. Include all required fields
5. Add optional fields as appropriate
6. Update the category count in this README
7. Copy to `_data/features.yml` for Jekyll access

### Updating a Feature

1. Locate the feature by ID in `features/features.yml`
2. Update the relevant fields
3. Update the `lastmod` or `version` field if significant changes
4. Copy to `_data/features.yml` to sync changes

### Validating YAML

```bash
# Python validation
python3 -c "import yaml; yaml.safe_load(open('features/features.yml'))"

# Ruby validation (if available)
ruby -ryaml -e "YAML.load_file('features/features.yml')"
```

## 🎨 Customization

### Custom Display Styles

You can create custom display styles by modifying `_includes/components/features-list.html` or creating new includes that use the features data.

### Feature Badges

Generate dynamic badges showing feature counts:

```liquid
{% assign dev_features = site.data.features.features | where: "category", "Development" %}
<span class="badge bg-primary">{{ dev_features.size }} Dev Features</span>
```

## 📊 Statistics

Generate statistics about features:

```liquid
{% assign all_features = site.data.features.features %}
{% assign implemented = all_features | where: "implemented", true %}
{% assign categories = all_features | group_by: "category" %}

Total Features: {{ all_features.size }}
Implemented: {{ implemented.size }}
Categories: {{ categories.size }}
```

## 🤝 Contributing

When contributing new features:

1. Document the feature in features.yml
2. Create or update relevant documentation in `/docs/`
3. Add usage examples if applicable
4. Update this README if adding a new category
5. Test the YAML syntax
6. Submit a pull request

## 📦 Related Files

- `_includes/components/features-list.html` - Feature display component
- `_data/features.yml` - Jekyll-accessible copy of features data
- `pages/_about/features/` - Features documentation pages
- `.github/copilot-instructions.md` - AI development guidance

---

**Last Updated**: 2025-12-09  
**Total Features**: 40  
**Categories**: 15
