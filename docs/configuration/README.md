# Configuration Documentation

This directory contains comprehensive configuration guides and setup documentation for the Zer0-Mistakes Jekyll theme.

## 🔧 Configuration Guides

### URL & Hosting Configuration

- [URL Configuration Guide](url-configuration-guide.md) - Complete guide for URL setup across different hosting scenarios

## 📁 Configuration Categories

### Environment Setup

- **Development Environment**: Local development setup and configuration
- **Production Environment**: Production deployment and hosting setup
- **Docker Configuration**: Container-based development and deployment
- **CI/CD Configuration**: Automated pipeline setup and configuration

### Hosting Configuration

- **GitHub Pages**: Standard GitHub Pages hosting setup
- **Custom Domain**: Custom domain configuration and setup
- **CDN Configuration**: Content delivery network setup and optimization
- **SSL/TLS Setup**: Security certificate configuration

### Theme Configuration

- **Basic Configuration**: Essential theme settings and options
- **Advanced Configuration**: Advanced customization and optimization
- **Feature Configuration**: Individual feature setup and customization
- **Performance Configuration**: Performance optimization settings

### Integration Configuration

- **Analytics Integration**: Google Analytics and other analytics setup
- **Social Media**: Social media integration and sharing configuration
- **Comments System**: Comment system setup and configuration
- **Search Integration**: Search functionality setup and configuration

## 🛠️ Setup Procedures

### Initial Setup

1. **Environment Preparation**

   ```bash
   # Install dependencies
   bundle install
   npm install

   # Setup development environment
   ./init_setup.sh
   ```

2. **Basic Configuration**

   ```yaml
   # _config.yml basic setup
   title: "Your Site Title"
   description: "Your site description"
   url: "https://your-site.com"
   baseurl: ""
   ```

3. **Advanced Configuration**
   ```yaml
   # Advanced theme settings
   theme_settings:
     navigation: true
     search: true
     analytics: true
     comments: true
   ```

### Development Environment

```bash
# Local development with Docker
docker-compose up -d

# Local development with Jekyll
bundle exec jekyll serve --config _config.yml,_config_dev.yml

# Development with live reload
bundle exec jekyll serve --livereload
```

### Production Deployment

```bash
# Build for production
bundle exec jekyll build --config _config.yml

# Deploy to GitHub Pages
git push origin main

# Deploy with custom deployment
./scripts/deploy.sh production
```

## 🌐 Hosting Scenarios

### GitHub Pages (Default)

```yaml
# Configuration for username.github.io/repository-name
url: "https://username.github.io"
baseurl: "/repository-name"
custom_domain: ""
```

### Custom Domain

```yaml
# Configuration for custom domain
url: "https://your-domain.com"
baseurl: ""
custom_domain: "your-domain.com"
```

### Subdirectory Hosting

```yaml
# Configuration for subdirectory hosting
url: "https://your-domain.com"
baseurl: "/subdirectory"
custom_domain: "your-domain.com"
```

## ⚙️ Feature Configuration

### Statistics Dashboard

```yaml
# Enable statistics dashboard
statistics:
  enabled: true
  cache_timeout: 3600
  show_analytics: true
  show_performance: true
```

### Mermaid Diagrams

```yaml
# Enable Mermaid diagrams
mermaid:
  enabled: true
  theme: "forest"
  cdn_version: "10.6.1"
```

### Search Functionality

```yaml
# Enable search
search:
  enabled: true
  provider: "lunr"
  placeholder: "Search content..."
```

### Analytics

```yaml
# Google Analytics configuration
google_analytics:
  tracking_id: "GA_TRACKING_ID"
  enabled: true
  anonymize_ip: true
```

## 🔧 Customization Options

### Theme Customization

```scss
// Custom CSS variables
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
  --background-color: #your-color;
  --text-color: #your-color;
}
```

### Layout Customization

```yaml
# Custom layout settings
layout_settings:
  sidebar: true
  sidebar_position: "left"
  navigation_style: "horizontal"
  footer_style: "minimal"
```

### Performance Optimization

```yaml
# Performance settings
performance:
  minify_html: true
  minify_css: true
  minify_js: true
  lazy_loading: true
  image_optimization: true
```

## 🚀 Advanced Configuration

### Multi-environment Setup

```yaml
# _config.yml (base configuration)
title: "Site Title"
description: "Site description"

# _config_dev.yml (development overrides)
url: "http://localhost:4000"
environment: "development"
show_drafts: true

# _config_prod.yml (production overrides)
url: "https://your-site.com"
environment: "production"
minify_html: true
```

### Plugin Configuration

```yaml
# Jekyll plugins
plugins:
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag
  - jekyll-paginate-v2

# Plugin-specific settings
feed:
  posts_limit: 20
  excerpt_only: true

paginate: 10
paginate_path: "/page:num/"
```

### Build Configuration

```yaml
# Build settings
markdown: kramdown
highlighter: rouge
permalink: /:categories/:title/

# Kramdown settings
kramdown:
  input: GFM
  syntax_highlighter: rouge
  syntax_highlighter_opts:
    line_numbers: true
```

## 🔍 Troubleshooting Configuration

### Common Issues

#### URL Configuration Problems

1. **Broken Links in Development**
   - Check `baseurl` setting in `_config_dev.yml`
   - Ensure proper URL construction in templates

2. **Assets Not Loading**
   - Verify `baseurl` and asset path configuration
   - Check CDN and external resource URLs

3. **Custom Domain Issues**
   - Verify DNS settings and CNAME configuration
   - Check `custom_domain` setting in configuration

#### Build Configuration Issues

1. **Plugin Errors**
   - Check plugin compatibility and versions
   - Verify plugin configuration syntax

2. **Performance Issues**
   - Review build time and optimization settings
   - Check for unnecessary plugins or processing

3. **Dependency Conflicts**
   - Update dependencies and check compatibility
   - Review Gemfile and package.json

### Diagnostic Commands

```bash
# Check configuration
bundle exec jekyll doctor

# Validate configuration syntax
ruby -c _config.yml

# Test build process
bundle exec jekyll build --verbose

# Debug development server
bundle exec jekyll serve --trace
```

## 📊 Configuration Best Practices

### Security

- **Sensitive Data**: Use environment variables for sensitive configuration
- **API Keys**: Store API keys securely and never commit to repository
- **Permissions**: Configure proper file and directory permissions
- **SSL/TLS**: Always use HTTPS in production environments

### Performance

- **Caching**: Configure appropriate caching headers and strategies
- **Compression**: Enable gzip compression for better performance
- **CDN**: Use CDN for static assets and improved loading times
- **Optimization**: Enable asset minification and optimization

### Maintenance

- **Documentation**: Document all configuration changes and decisions
- **Version Control**: Track configuration changes in version control
- **Testing**: Test configuration changes in development environment
- **Monitoring**: Monitor configuration effectiveness and performance

---

**Maintained By**: Zer0-Mistakes Configuration Team  
**Last Updated**: October 26, 2025  
**Next Review**: Quarterly configuration review
