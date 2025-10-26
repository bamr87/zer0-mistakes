# URL Configuration Guide

This guide explains how to configure URLs for the Zer0-Mistakes Jekyll theme in different hosting scenarios.

## Overview

The URL configuration has been simplified to automatically handle different hosting environments:

- **GitHub Pages hosting**: `https://username.github.io/repository-name/`
- **Custom domain hosting**: `https://your-custom-domain.com/`
- **Local development**: `http://localhost:4000/repository-name/`

## Configuration Files

### `_config.yml` (Production)

Main configuration file used for production builds and GitHub Pages deployment.

### `_config_dev.yml` (Development)

Development overrides that are merged with the main config when running locally.

## Hosting Scenarios

### 1. GitHub Pages Hosting (Default)

For standard GitHub Pages hosting at `username.github.io/repository-name/`:

**_config.yml**:

```yaml
custom_domain: ""  # Leave empty for GitHub Pages
url: "https://bamr87.github.io"
baseurl: "/zer0-mistakes"
```

**Development URLs**:

- Local: `http://localhost:4000/zer0-mistakes/`
- Production: `https://bamr87.github.io/zer0-mistakes/`

### 2. Custom Domain Hosting

For hosting with a custom domain like `zer0-mistakes.com`:

**_config.yml**:

```yaml
custom_domain: "zer0-mistakes.com"  # Your custom domain
url: "https://zer0-mistakes.com"
baseurl: ""  # Empty for root domain hosting
```

**Development URLs**:

- Local: `http://localhost:4000/`
- Production: `https://zer0-mistakes.com/`

### 3. GitHub Pages with Custom Domain

For GitHub Pages with a custom domain (CNAME file):

**_config.yml**:

```yaml
custom_domain: "zer0-mistakes.com"  # Your custom domain
url: "https://zer0-mistakes.com"
baseurl: ""  # Empty when using custom domain
```

## Development Commands

### Start Development Server

```bash
# Using Docker (Recommended)
docker-compose up

# Or using local Jekyll
bundle exec jekyll serve --config _config.yml,_config_dev.yml
```

### Build for Production

```bash
# Using Docker
docker-compose run --rm jekyll jekyll build --config _config.yml

# Or using local Jekyll
bundle exec jekyll build --config _config.yml
```

## Migration from Old Configuration

If migrating from the previous complex URL configuration:

1. **Remove old variables**: The following variables are no longer needed:
   - `domain` and `domain_ext`
   - `url_test`
   - `portfolio`
   - `dg_port`

2. **Update custom variables**: If you have custom Liquid templates that reference the old URL
   structure, update them to use:
   - `{{ site.url }}{{ site.baseurl }}` for full site URL
   - `{{ site.baseurl }}` for relative paths

3. **Test thoroughly**: After migration, test both local development and production builds to
   ensure all links work correctly.

## Troubleshooting

### Links not working in development

- Ensure you're accessing `http://localhost:4000/zer0-mistakes/` (with trailing slash)
- Check that `baseurl` matches your repository name

### Custom domain not working

- Verify your DNS settings point to GitHub Pages
- Ensure CNAME file exists in your repository root
- Update `url` and `baseurl` settings as described above

### Assets not loading

- Check that asset paths use `{{ site.baseurl }}` prefix
- Verify `public_folder` setting in config

## Best Practices

1. **Always test locally** before deploying to production
2. **Use relative URLs** with `{{ site.baseurl }}` for internal links
3. **Keep development and production configs in sync** for URL structure
4. **Document any custom URL requirements** in your project README

---

For more information, see the [Jekyll documentation on configuration](https://jekyllrb.com/docs/configuration/).
