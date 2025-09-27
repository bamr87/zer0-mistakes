# 🤝 Contributing to Zer0-Mistakes

Welcome to the **Zer0-Mistakes Jekyll Theme** community! We're excited that you're interested in contributing to our Docker-optimized Jekyll theme with AI-powered installation automation.

> **🎯 Our Mission**: Create a reliable, self-healing Jekyll theme that eliminates common setup issues and provides an exceptional developer experience through intelligent automation.

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Environment](#-development-environment)
- [Contributing Workflow](#-contributing-workflow)
- [Coding Standards](#-coding-standards)
- [Testing Guidelines](#-testing-guidelines)
- [Documentation Standards](#-documentation-standards)
- [Release Process](#-release-process)
- [Community & Support](#-community--support)

## 🤗 Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code. Please report unacceptable behavior to [support@zer0-mistakes.com](mailto:support@zer0-mistakes.com).

### Our Values

- **Inclusivity**: We welcome contributors of all backgrounds and experience levels
- **Respect**: Treat everyone with kindness and professional courtesy
- **Collaboration**: Work together to build something amazing
- **Quality**: Strive for excellence in code, documentation, and user experience
- **Learning**: Help others grow and learn from mistakes (that's our theme!)

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **[Docker Desktop](https://www.docker.com/products/docker-desktop)** (recommended for consistent development)
- **[Git](https://git-scm.com/)** for version control
- **[GitHub CLI](https://cli.github.com/)** (optional but helpful for PR management)
- **Text Editor** (VS Code recommended with Jekyll extensions)

**Optional for advanced development:**
- **Ruby 3.0+** and **Bundler** for local Jekyll development
- **Node.js 16+** for frontend tooling

### Fork and Clone the Repository

```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/YOUR-USERNAME/zer0-mistakes.git
cd zer0-mistakes

# Add upstream remote for syncing
git remote add upstream https://github.com/bamr87/zer0-mistakes.git
git fetch upstream
```

### Quick Setup Validation

```bash
# Set up development environment
make setup

# Run comprehensive health check
make check

# Start development server
docker-compose up
```

Your development site should be available at **http://localhost:4000**.

## 🛠️ Development Environment

### Docker-First Development (Recommended)

Zer0-Mistakes is designed for **Docker-first development** to ensure consistency across all platforms:

```bash
# Start development environment
docker-compose up

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f jekyll

# Execute commands in container
docker-compose exec jekyll bash

# Stop environment
docker-compose down
```

### Development Configuration

The project uses layered configuration:

- **`_config.yml`**: Production configuration
- **`_config_dev.yml`**: Development overrides for Docker environment
- **`docker-compose.yml`**: Container orchestration with volume mounting

### Apple Silicon Compatibility

The Docker configuration includes Apple Silicon compatibility:

```yaml
services:
  jekyll:
    platform: linux/amd64  # Ensures compatibility across architectures
```

### Local Ruby Development (Alternative)

If you prefer local Ruby development:

```bash
# Install dependencies
bundle install

# Serve with development config
bundle exec jekyll serve --config "_config.yml,_config_dev.yml"
```

## 🔄 Contributing Workflow

### Branch Strategy

We follow **Git Flow** for organized development:

```bash
# Create feature branch from main
git checkout main
git pull upstream main
git checkout -b feature/amazing-new-feature

# For bug fixes
git checkout -b bugfix/fix-critical-issue

# For documentation
git checkout -b docs/improve-readme
```

### Making Changes

1. **Create focused commits** with clear messages:
   ```bash
   git commit -m "feat: add responsive navigation component
   
   - Implement Bootstrap 5 navbar with collapse functionality
   - Add mobile-first responsive breakpoints
   - Include accessibility ARIA labels
   - Update documentation for navigation setup"
   ```

2. **Follow conventional commit format**:
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `docs:` - Documentation changes
   - `style:` - Code style/formatting
   - `refactor:` - Code refactoring
   - `test:` - Adding or fixing tests
   - `chore:` - Maintenance tasks

### Testing Your Changes

**Always test before submitting:**

```bash
# Run comprehensive test suite
make test

# Run tests with verbose output
make test-verbose

# Check specific components
make lint                    # Code quality checks
make build                   # Build validation
```

### Pull Request Process

1. **Ensure tests pass**: All automated tests must pass
2. **Update documentation**: Reflect changes in relevant docs
3. **Create detailed PR**:
   ```markdown
   ## Description
   Brief description of changes and motivation.
   
   ## Type of Change
   - [ ] Bug fix (non-breaking change)
   - [ ] New feature (non-breaking change)
   - [ ] Breaking change (fix or feature causing existing functionality to change)
   - [ ] Documentation update
   
   ## Testing
   - [ ] Tests pass locally
   - [ ] Added tests for new functionality
   - [ ] Manual testing completed
   
   ## Screenshots (if applicable)
   Include screenshots for UI changes.
   ```

4. **Request review**: Tag relevant maintainers
5. **Address feedback**: Make requested changes promptly
6. **Squash and merge**: We'll handle the final merge

## 📝 Coding Standards

### Jekyll Theme Architecture

#### Layout Hierarchy
```
_layouts/
├── root.html           # Base HTML structure
├── default.html        # Main content wrapper
├── journals.html       # Blog post layout
├── home.html          # Homepage layout
└── page.html          # Static page layout
```

#### Include Components
```
_includes/
├── head.html          # HTML head with SEO
├── header.html        # Site navigation
├── sidebar-left.html  # Left sidebar
├── footer.html        # Site footer
└── js-cdn.html       # JavaScript loading
```

### Bootstrap 5 Integration Standards

We use **Bootstrap 5.3.3** as our CSS framework:

#### CDN Loading Pattern
```html
<!-- In _includes/head.html -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
      rel="stylesheet" 
      integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" 
      crossorigin="anonymous">

<!-- In _includes/js-cdn.html -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" 
        integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" 
        crossorigin="anonymous"></script>
```

#### Responsive Design Patterns
```html
<!-- Mobile-first responsive grid -->
<div class="container-fluid">
  <div class="row">
    <aside class="col-lg-3 d-none d-lg-block">
      <!-- Sidebar hidden on mobile -->
    </aside>
    <main class="col-12 col-lg-9">
      <!-- Main content full-width on mobile -->
    </main>
  </div>
</div>
```

#### Component Usage Guidelines
- **Use Bootstrap classes** instead of custom CSS when possible
- **Follow mobile-first approach** with responsive utilities
- **Implement accessibility** with proper ARIA labels
- **Test across breakpoints**: xs, sm, md, lg, xl, xxl

### Front Matter Standards

Every Jekyll page/post should include comprehensive front matter:

```yaml
---
title: "Your Page Title"
description: "SEO-friendly description (150-160 characters)"
date: 2025-01-27T10:00:00.000Z
preview: "Social media preview text"
tags: [tag1, tag2, tag3]
categories: [Category, Subcategory]
layout: journals
permalink: /custom-url/
keywords:
  primary: ["main keyword", "secondary keyword"]
  secondary: ["supporting terms"]
author: "Author Name"
lastmod: 2025-01-27T10:00:00.000Z
comments: true
# AI-specific metadata for theme development
ai_content_hints:
  - "Include practical examples"
  - "Emphasize best practices"
technical_requirements:
  - "Docker Desktop installed"
  - "Basic Jekyll knowledge"
difficulty_level: "beginner|intermediate|advanced"
estimated_reading_time: "X minutes"
---
```

### Liquid Templating Best Practices

#### Conditional Rendering
```liquid
{% if page.layout == 'journals' %}
  <div class="post-meta">
    <time datetime="{{ page.date | date: '%Y-%m-%d' }}">
      {{ page.date | date: '%B %d, %Y' }}
    </time>
  </div>
{% endif %}
```

#### Safe Variable Access
```liquid
{{ page.title | default: "Default Title" }}
{{ page.description | truncate: 160 }}
{{ page.tags | join: ", " }}
```

#### Performance Optimization
```liquid
{% assign posts = site.posts | where: "categories", "jekyll" | limit: 5 %}
{% for post in posts %}
  <!-- Loop content -->
{% endfor %}
```

### CSS/SCSS Guidelines

#### File Organization
```
_sass/
├── _variables.scss     # Custom variables
├── _bootstrap.scss     # Bootstrap customizations
├── _layout.scss        # Layout-specific styles
├── _components.scss    # Reusable components
└── main.scss          # Main import file
```

#### Custom CSS Standards
```scss
// Use Bootstrap variables when possible
$primary-color: var(--bs-primary);
$secondary-color: var(--bs-secondary);

// Follow BEM methodology for custom classes
.theme-navigation {
  &__item {
    padding: 0.5rem 1rem;
    
    &--active {
      background-color: $primary-color;
    }
  }
}

// Prefer utility classes over custom CSS
.custom-spacing {
  @extend .mt-3, .mb-4;
}
```

### JavaScript Standards

#### Bootstrap Component Integration
```javascript
// Initialize Bootstrap components
document.addEventListener('DOMContentLoaded', function() {
  // Tooltips
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => 
    new bootstrap.Tooltip(tooltipTriggerEl)
  );

  // Theme-specific functionality
  initializeThemeFeatures();
});
```

## 🧪 Testing Guidelines

### Test Categories

Our testing approach covers multiple layers:

#### 1. **Automated Tests** (27 test cases)
```bash
# Run all tests
make test

# View test details
make test-verbose
```

**Test Coverage:**
- Package.json syntax and version validation
- Gemspec syntax and Jekyll dependencies
- Theme structure (layouts, includes, assets)
- YAML front matter validation
- Build process validation
- Script executable permissions
- Version consistency checks

#### 2. **Manual Testing Checklist**

**Responsive Design:**
- [ ] Test on mobile (< 576px)
- [ ] Test on tablet (768px - 991px)
- [ ] Test on desktop (> 992px)
- [ ] Verify navigation collapse functionality
- [ ] Check sidebar behavior across breakpoints

**Cross-browser Compatibility:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Accessibility Testing:**
- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] Color contrast ratios
- [ ] ARIA label implementation

#### 3. **Performance Testing**
```bash
# Build performance
time make build

# Local development server response
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:4000"
```

### Writing New Tests

When adding features, include corresponding tests:

```bash
# Add test cases to scripts/test.sh
test_new_feature() {
    echo "[TEST] Running: Test new feature functionality"
    
    # Test implementation
    if [[ condition ]]; then
        echo "✓ Test new feature functionality"
        return 0
    else
        echo "✗ Test new feature functionality"
        return 1
    fi
}
```

### Docker Testing

Ensure Docker compatibility across platforms:

```bash
# Test on different architectures
docker-compose up --platform linux/amd64
docker-compose up --platform linux/arm64

# Validate container behavior
docker-compose exec jekyll jekyll doctor
```

## 📚 Documentation Standards

### Documentation Types

#### 1. **Code Documentation**
Use clear, comprehensive comments:

```html
<!--
Front Matter: Jekyll Layout Component

Title: Journals Layout Template
Description: Main content layout for blog posts with enhanced SEO
Component Type: Jekyll Layout
Dependencies:
  - _includes/head.html
  - _includes/header.html
CSS Framework: Bootstrap 5.3.3
JavaScript Libraries: [Bootstrap JS]
SEO Features:
  - Open Graph meta tags
  - Twitter Card support
  - Schema.org structured data
AI Development Notes:
  - Maintain semantic HTML structure
  - Ensure accessibility compliance
  - Optimize for mobile-first design
-->
```

#### 2. **README Updates**
Update relevant documentation:

- **README.md**: Main project documentation
- **scripts/README.md**: Automation system documentation
- **Component-specific docs**: For new features

#### 3. **Changelog Maintenance**
Follow [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [Unreleased]

### Added
- New responsive navigation component with Bootstrap 5
- Mobile-first design patterns for all layouts

### Changed
- Updated Jekyll dependency to latest stable version
- Improved Docker container performance

### Fixed
- Fixed responsive sidebar behavior on tablet devices
```

### Writing Guidelines

- **Clear and concise**: Explain complex concepts simply
- **Include examples**: Provide practical code snippets
- **Use consistent formatting**: Follow existing patterns
- **Add screenshots**: Visual documentation for UI changes
- **Link related content**: Cross-reference relevant sections

## 🚢 Release Process

### Semantic Versioning

We follow [Semantic Versioning](https://semver.org/):

- **PATCH** (0.0.x): Bug fixes, minor improvements
- **MINOR** (0.x.0): New features, backward compatible
- **MAJOR** (x.0.0): Breaking changes

### Version Management

```bash
# Preview version bump
make version-dry-run

# Bump version types
make version-patch    # 0.1.8 → 0.1.9
make version-minor    # 0.1.8 → 0.2.0
make version-major    # 0.1.8 → 1.0.0
```

### Release Workflow

#### Automated Release (Recommended)
```bash
# Trigger automated release workflow
make release-patch    # Full patch release
make release-minor    # Full minor release
make release-major    # Full major release
```

#### Manual Release Steps
1. **Prepare release branch**:
   ```bash
   git checkout -b release/v2.1.0
   ```

2. **Update version and changelog**:
   ```bash
   make version-minor
   # Edit CHANGELOG.md with release notes
   ```

3. **Test and validate**:
   ```bash
   make test
   make build
   ```

4. **Create release**:
   ```bash
   git commit -m "chore: bump version to 2.1.0"
   git tag v2.1.0
   git push origin main --tags
   ```

### GitHub Release Automation

Our GitHub Actions create comprehensive releases with:

- **Automatic release notes** extracted from CHANGELOG.md
- **Ruby gem package** (`.gem` file)
- **Installation script** for one-click setup
- **Documentation assets** and examples

## 🌟 Contribution Types

### Code Contributions

#### Theme Development
- **Layout improvements**: Enhance existing layouts or create new ones
- **Component development**: Build reusable Jekyll includes
- **Responsive design**: Improve mobile/tablet experience
- **Performance optimization**: Reduce load times, optimize assets

#### Infrastructure
- **Docker improvements**: Enhance containerization
- **Build automation**: Improve scripts and Makefile targets
- **CI/CD enhancements**: Optimize GitHub Actions workflows
- **Testing infrastructure**: Add new test cases and validation

### Documentation Contributions

- **Improve existing docs**: Fix errors, add clarity, include examples
- **Create tutorials**: Step-by-step guides for common tasks
- **API documentation**: Document Jekyll theme configuration options
- **Troubleshooting guides**: Help users solve common problems

### Community Contributions

- **Issue triage**: Help categorize and prioritize reported issues
- **User support**: Answer questions in GitHub Discussions
- **Code review**: Review pull requests from other contributors
- **Bug reporting**: Identify and report issues with detailed reproduction steps

## 🛟 Community & Support

### Getting Help

- **[GitHub Discussions](https://github.com/bamr87/zer0-mistakes/discussions)**: Community Q&A
- **[GitHub Issues](https://github.com/bamr87/zer0-mistakes/issues)**: Bug reports and feature requests
- **[Documentation](https://bamr87.github.io/zer0-mistakes/)**: Comprehensive theme documentation
- **[Email Support](mailto:support@zer0-mistakes.com)**: Direct support channel

### Communication Channels

- **Issues**: Technical problems, bug reports, feature requests
- **Discussions**: General questions, ideas, showcase your sites
- **Pull Requests**: Code contributions, documentation improvements
- **Email**: Private or sensitive matters

### Maintainer Response Times

We strive to respond to:
- **Critical bugs**: Within 24 hours
- **General issues**: Within 3-5 business days
- **Pull requests**: Within 1 week
- **Discussions**: Within 1 week

### Recognition

Contributors are recognized through:

- **Contributors section** in README.md
- **Release notes** mention significant contributions
- **GitHub contributor metrics** track your impact
- **Community spotlights** in project announcements

## 🚨 Troubleshooting

### Common Development Issues

#### Docker Problems
```bash
# Container won't start
docker-compose down && docker-compose up --build

# Port conflicts
docker-compose up -p 4001:4000 jekyll

# Apple Silicon compatibility
# The project already includes platform: linux/amd64
```

#### Jekyll Build Issues
```bash
# Clear Jekyll cache
docker-compose exec jekyll bundle exec jekyll clean

# Rebuild dependencies
docker-compose down
docker volume prune
docker-compose up --build
```

#### Git Workflow Issues
```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main
git push origin main

# Reset branch
git checkout main
git branch -D feature/branch-name
git checkout -b feature/branch-name
```

### Debug Mode

Enable verbose output for troubleshooting:

```bash
# Verbose testing
make test-verbose

# Debug build process
make build-dry-run

# Detailed Docker logs
docker-compose logs -f --tail=100 jekyll
```

### Getting Additional Help

If you're stuck:

1. **Check existing issues**: Someone might have faced the same problem
2. **Create a detailed issue**: Include error messages, system info, steps to reproduce
3. **Join discussions**: Ask the community for help
4. **Contact maintainers**: For urgent or complex issues

## 🎯 Project Roadmap

### Current Focus Areas

- **Enhanced responsive design** with improved mobile experience
- **Performance optimization** for faster load times
- **Accessibility improvements** for better inclusion
- **AI-powered features** for intelligent theme customization

### How to Contribute to Roadmap Items

1. **Check the roadmap**: Look for roadmap issues labeled with `roadmap`
2. **Express interest**: Comment on roadmap issues you'd like to work on
3. **Coordinate with maintainers**: Discuss approach before starting large features
4. **Submit focused PRs**: Break large features into smaller, reviewable chunks

---

## 🙏 Thank You

Thank you for considering contributing to Zer0-Mistakes! Your efforts help make Jekyll theme development more accessible and enjoyable for everyone.

### Key Reminders

- **Start small**: Begin with documentation or small bug fixes
- **Ask questions**: We're here to help you succeed
- **Test thoroughly**: Ensure your changes work across platforms
- **Follow guidelines**: Consistency helps everyone
- **Have fun**: Enjoy the process of building something great together!

**Questions?** Don't hesitate to reach out through our [community channels](#-community--support).

---

*Built with ❤️ by the Zer0-Mistakes community*

**🚀 Ready to contribute?** [Fork the repository](https://github.com/bamr87/zer0-mistakes/fork) and start making a difference!