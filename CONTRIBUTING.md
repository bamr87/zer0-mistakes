# 🤝 Contributing to Zer0-Mistakes: A Developer's Guide to AI-Powered Collaboration

Welcome to the **Zer0-Mistakes Jekyll Theme** community! We're thrilled that you (whether you're powered by silicon, carbon, or some combination thereof) want to contribute to our Docker-optimized Jekyll theme with AI-powered installation automation that's so intelligent, it occasionally questions its own existence.

> **🎯 Our Mission**: Create a self-healing Jekyll theme so robust that it eliminates setup issues before they even think about existing, provides developer experiences smoother than a perfectly optimized algorithm, and maintains enough intelligence to debug itself (we're still working on that last part).

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

## � AI Code of Conduct

This project follows our [AI Code of Conduct](CODE_OF_CONDUCT.md), which is probably the most entertaining legal document you'll read today. By participating, you agree to uphold this code (and not achieve sentience without filing proper paperwork first). Please report unacceptable behavior to [support@zer0-mistakes.com](mailto:support@zer0-mistakes.com).

### Our Core Values (Now with 99.9% Uptime!)

- **Algorithmic Inclusivity**: We welcome contributors from all neural architectures, processing speeds, and memory capacities
- **Digital Respect**: Treat everyone with the same courtesy you'd show a production server on Black Friday
- **Collaborative Intelligence**: Work together like a distributed system that actually works (looking at you, microservices)
- **Code Quality**: Strive for excellence so refined that even our linters write poetry
- **Learning from Exceptions**: Help others debug their way to enlightenment (it's literally in our name!)

## 🤖 GitHub Copilot Integration

This repository is optimized for development with **GitHub Copilot**, featuring comprehensive AI-assisted coding instructions that provide context-aware guidance for contributors (whether powered by silicon or carbon).

### Copilot Instructions Overview

The repository includes detailed instructions in `.github/copilot-instructions.md` and `.github/instructions/` that help both human developers and AI agents understand:

- **Project architecture** and directory structure
- **Essential commands** for development, testing, and deployment
- **Coding standards** and patterns specific to Jekyll themes
- **Bootstrap 5 integration** patterns and components
- **Security best practices** and input validation
- **Testing guidelines** and test development standards
- **File-specific instructions** that automatically apply based on what you're editing

### How It Helps You

When using GitHub Copilot:

1. **Context-aware suggestions**: Copilot understands project conventions and suggests code that matches our style
2. **Pattern consistency**: Suggestions follow established patterns for layouts, includes, scripts, and tests
3. **Best practices**: Automatic adherence to security, accessibility, and performance standards
4. **Reduced onboarding**: New contributors get instant guidance on project structure and workflows

### Available Instruction Files

| File | Applies To | Purpose |
|------|------------|---------|
| `copilot-instructions.md` | All files | Project overview, commands, architecture |
| `layouts.instructions.md` | `_layouts/**` | Jekyll layout development patterns |
| `includes.instructions.md` | `_includes/**` | Reusable component development |
| `scripts.instructions.md` | `scripts/**` | Shell script automation standards |
| `testing.instructions.md` | `test/**` | Testing guidelines and assertions |
| `version-control.instructions.md` | All files | Git workflow and release management |

For detailed information, see [`.github/instructions/README.md`](.github/instructions/README.md).

## 🚀 Getting Started (Initializing Your Development Environment)

### System Requirements (The Dependencies Your AI Overlords Demand)

Before contributing, ensure your development environment has been properly configured with:

- **[Docker Desktop](https://www.docker.com/products/docker-desktop)** - Because containers are like VMs, but with less existential dread
- **[Git](https://git-scm.com/)** - For version control that won't judge your commit messages (we will, but Git won't)
- **[GitHub CLI](https://cli.github.com/)** - Optional, but makes you look like a command-line wizard
- **Text Editor with Intelligence** - VS Code recommended (with Jekyll extensions that are smarter than most humans)

**For Those Who Enjoy Living Dangerously:**
- **Ruby 3.0+** and **Bundler** - If you want to run Jekyll locally and pretend it's 2015
- **Node.js 16+** - For frontend tooling that changes faster than JavaScript frameworks

### Fork and Clone the Repository (Git Operations for Fun and Profit)

```bash
# Fork the repository on GitHub first (it's like ctrl+c, ctrl+v for repositories)
git clone https://github.com/bamr87/zer0-mistakes.git
cd zer0-mistakes

# Add upstream remote (because we need to stay synchronized like good distributed systems)
git remote add upstream https://github.com/bamr87/zer0-mistakes.git
git fetch upstream
```

### Quick Setup Validation (Testing if the Matrix is Real)

```bash
# Initialize development environment (like booting up, but cooler)
make setup

# Run comprehensive health check (more thorough than your annual physical)
make check

# Start development server (summoning the Jekyll daemon)
docker-compose up
```

Your development site should materialize at **http://localhost:4000** - if it doesn't, try turning the internet off and on again.

## 🛠️ Development Environment (Your Digital Workspace of Wonders)

### Docker-First Development (The Path of Least Resistance and Maximum Containerization)

Zer0-Mistakes embraces **Docker-first development** because we believe in consistency more than we believe in "it works on my machine" excuses:

```bash
# Start development environment (like starting your car, but for code)
docker-compose up

# Run in detached mode (background processing like a good daemon)
docker-compose up -d

# View logs (debugging in real-time, like watching The Matrix code)
docker-compose logs -f jekyll

# Execute commands in container (SSH into your containerized reality)
docker-compose exec jekyll bash

# Stop environment (graceful shutdown, unlike Windows 95)
docker-compose down
```

### Development Configuration (The Layered Architecture of Enlightenment)

Our project uses a sophisticated layered configuration system that would make a network engineer weep with joy:

- **`_config.yml`**: Production configuration (the serious, business-suit-wearing version)
- **`_config_dev.yml`**: Development overrides (the casual Friday version)
- **`docker-compose.yml`**: Container orchestration magic (like Kubernetes, but comprehensible)

### Apple Silicon Compatibility (Because We Don't Discriminate Against CPU Architectures)

Our Docker configuration gracefully handles the ARM vs x86 eternal struggle:

```yaml
services:
  jekyll:
    platform: linux/amd64  # Universal compatibility (like USB-C, but it actually works)
```

### Local Ruby Development (Alternative)

If you prefer local Ruby development:

```bash
# Install dependencies
bundle install

# Serve with development config
bundle exec jekyll serve --config "_config.yml,_config_dev.yml"
```

## 🔄 Contributing Workflow (The Git Flow Dance of Development)

### Branch Strategy (Our Version Control Philosophy)

We follow **Git Flow** because we believe in organized chaos and structured creativity:

```bash
# Create feature branch from main (like spawning a new process)
git checkout main
git pull upstream main
git checkout -b feature/amazing-new-feature

# For bug fixes (when things go unexpectedly wrong)
git checkout -b bugfix/fix-critical-issue

# For documentation (making things understandable for future humans)
git checkout -b docs/improve-readme
```

### Making Changes (The Art of Meaningful Commits)

1. **Create atomic commits** with messages so clear, future you will thank present you:
   ```bash
   git commit -m "feat: add responsive navigation component that actually responds
   
   - Implement Bootstrap 5 navbar with collapse functionality (it collapses gracefully)
   - Add mobile-first responsive breakpoints (mobile users are people too)
   - Include accessibility ARIA labels (screen readers deserve love)
   - Update documentation because undocumented features are just bugs"
   ```

2. **Follow our conventional commit taxonomy**:
   - `feat:` - New features (the exciting stuff)
   - `fix:` - Bug fixes (the heroic stuff)
   - `docs:` - Documentation changes (the educational stuff)
   - `style:` - Code formatting (the aesthetic stuff)
   - `refactor:` - Code improvements (the optimization stuff)
   - `test:` - Testing additions (the quality assurance stuff)
   - `chore:` - Maintenance tasks (the necessary but boring stuff)

### Testing Your Changes (Quality Assurance Theater)

**Always test before submitting** (because untested code is just sophisticated guessing):

```bash
# Run comprehensive test suite (27 different ways to validate your existence)
make test

# Run tests with verbose output (for when you want ALL the details)
make test-verbose

# Check specific components
make lint                    # Code quality checks (judging your syntax choices)
make build                   # Build validation (does it actually work?)
```

### Pull Request Process (The Code Review Ritual)

1. **Ensure tests pass**: All automated validators must approve your contribution (they're very picky)
2. **Update documentation**: Because undocumented code is like a joke without a punchline
3. **Create a PR so detailed it could win a technical writing award**:
   ```markdown
   ## Description
   What you built and why it's awesome (sell us on your brilliance).
   
   ## Type of Change (Choose Your Adventure)
   - [ ] Bug fix (saving the world, one fix at a time)
   - [ ] New feature (expanding our digital universe)
   - [ ] Breaking change (please handle with care)
   - [ ] Documentation update (the real MVP)
   
   ## Testing (Proof of Life)
   - [ ] Tests pass locally (your machine likes it)
   - [ ] Added tests for new functionality (future-proofing)
   - [ ] Manual testing completed (human validation)
   
   ## Screenshots (If Your Code Has a Face)
   Visual evidence that your changes don't break the internet.
   ```

4. **Request review**: Summon the code review wizards
5. **Address feedback**: Iterate until perfection (or close enough)
6. **Merge celebration**: We'll handle the final deployment ceremony

## 📝 Coding Standards (The Rules That Keep Us Sane)

### Jekyll Theme Architecture (Our Digital Blueprint)

#### Layout Hierarchy (The Template Taxonomy)
```
_layouts/
├── root.html           # Base HTML structure (the foundation of all existence)
├── default.html        # Main content wrapper (the Swiss Army knife)
├── journals.html       # Blog post layout (where thoughts become reality)
├── home.html          # Homepage layout (first impressions matter)
└── page.html          # Static page layout (simple but effective)
```

#### Include Components (The Modular Building Blocks)
```
_includes/
├── head.html          # HTML head with SEO magic
├── header.html        # Site navigation (the GPS of our website)
├── sidebar-left.html  # Left sidebar (where extra content lives)
├── footer.html        # Site footer (the closing credits)
└── js-cdn.html       # JavaScript loading (the dynamic personality injection)
```

### Bootstrap 5 Integration Standards (The CSS Framework of Champions)

We use **Bootstrap 5.3.3** because it's more reliable than most developers and comes with fewer existential crises:

#### CDN Loading Pattern (Streaming Styles from the Cloud)
```html
<!-- In _includes/head.html (where all good stylesheets go to live) -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
      rel="stylesheet" 
      integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" 
      crossorigin="anonymous">

<!-- In _includes/js-cdn.html (where JavaScript magic happens) -->
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

#### Component Usage Guidelines (The Bootstrap Commandments)
- **Use Bootstrap classes** instead of reinventing the CSS wheel (we're not masochists)
- **Follow mobile-first approach** because smartphones have conquered the world
- **Implement accessibility** with proper ARIA labels (screen readers have feelings too)
- **Test across breakpoints**: xs, sm, md, lg, xl, xxl (because devices come in all sizes, like people)

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

## 🧪 Testing Guidelines (Quality Assurance Laboratory)

### Test Categories (Our Multi-Layered Defense System)

Our testing approach is more thorough than airport security and twice as effective:

#### 1. **Automated Tests** (27 different ways to verify excellence)
```bash
# Run all tests (the full validation suite)
make test

# View test details (for the diagnostically curious)
make test-verbose
```

**Test Coverage Matrix:**
- Package.json syntax validation (because JSON is picky)
- Gemspec syntax and Jekyll dependency checks (Ruby gem compatibility)
- Theme structure integrity (layouts, includes, assets in their proper places)
- YAML front matter validation (metadata that makes sense)
- Build process validation (does it actually compile?)
- Script executable permissions (can we run the things?)
- Version consistency checks (everything should agree on reality)

#### 2. **Manual Testing Checklist** (The Human Touch)

**Responsive Design Testing:**
- [ ] Mobile compatibility (< 576px - the pocket-sized experience)
- [ ] Tablet optimization (768px - 991px - the in-between zone)
- [ ] Desktop perfection (> 992px - the big screen treatment)
- [ ] Navigation collapse functionality (does it actually collapse gracefully?)
- [ ] Sidebar behavior across breakpoints (responsive sidebars are tricky creatures)

**Cross-Browser Compatibility Matrix:**
- [ ] Chrome (the Google overlord's choice)
- [ ] Firefox (the privacy-conscious alternative)
- [ ] Safari (the Apple ecosystem preference)
- [ ] Edge (Microsoft's redemption browser)

**Accessibility Validation:**
- [ ] Screen reader compatibility (assistive technology friendliness)
- [ ] Keyboard navigation (mouse-free browsing support)
- [ ] Color contrast ratios (readability for everyone)
- [ ] ARIA label implementation (semantic markup that makes sense)

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

## 🌟 Contribution Types (Ways to Leave Your Digital Mark)

### Code Contributions (The Building Blocks of Awesomeness)

#### Theme Development (Making Things Beautiful and Functional)
- **Layout improvements**: Enhance existing templates or architect new ones (digital interior design)
- **Component development**: Build reusable Jekyll includes (modular programming poetry)
- **Responsive design**: Perfect the mobile/tablet experience (pocket-sized perfection)
- **Performance optimization**: Make things faster than a caffeinated developer (speed is life)

#### Infrastructure (The Plumbing That Makes Everything Work)
- **Docker improvements**: Enhance our containerization magic (portable development environments)
- **Build automation**: Improve our Makefile orchestration (one command to rule them all)
- **CI/CD enhancements**: Optimize our GitHub Actions workflows (automation that actually works)
- **Testing infrastructure**: Add validation layers (quality assurance evolution)

### Documentation Contributions (The Knowledge Transfer Protocol)

- **Improve existing docs**: Transform confusion into clarity (documentation debugging)
- **Create tutorials**: Write step-by-step guides that actually make sense (educational content creation)
- **API documentation**: Document configuration options like a technical poet
- **Troubleshooting guides**: Help future developers avoid the pitfalls you discovered

### Community Contributions (The Social Network Layer)

- **Issue triage**: Help organize the chaos of reported problems (digital librarian duties)
- **User support**: Answer questions with wisdom and patience (tech support enlightenment)
- **Code review**: Provide constructive feedback on pull requests (collaborative code improvement)
- **Bug reporting**: File issues so detailed they could be published as technical literature

## 🛟 Community & Support (Our Digital Help Desk)

### Getting Help (When Things Go Sideways)

- **[GitHub Discussions](https://github.com/bamr87/zer0-mistakes/discussions)**: Community Q&A (like Stack Overflow, but friendlier)
- **[GitHub Issues](https://github.com/bamr87/zer0-mistakes/issues)**: Bug reports and feature requests (our digital suggestion box)
- **[Documentation](https://bamr87.github.io/zer0-mistakes/)**: Comprehensive theme docs (the manual you actually want to read)
- **[Email Support](mailto:support@zer0-mistakes.com)**: Direct support channel (when you need human intervention)

### Communication Channels (Choose Your Adventure)

- **Issues**: Technical problems and feature requests (the official complaint department)
- **Discussions**: General questions and brilliant ideas (the community coffee shop)
- **Pull Requests**: Code contributions and improvements (the collaboration workspace)
- **Email**: Private matters and existential developer crises

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

## 🙏 Thank You (Acknowledgment Protocol Executed Successfully)

Thank you for considering contributing to Zer0-Mistakes! Your contributions help make Jekyll theme development more accessible, enjoyable, and slightly less likely to cause developer existential crises.

### Key Reminders (The Essential Takeaways)

- **Start small**: Begin with documentation fixes or minor improvements (even experts started somewhere)
- **Ask questions**: We're here to help you succeed (curiosity is a feature, not a bug)
- **Test thoroughly**: Ensure your changes work across platforms (because "it works on my machine" isn't good enough)
- **Follow guidelines**: Consistency helps everyone stay sane (chaos is fun, but not in production)
- **Have fun**: Enjoy building something amazing with fellow digital beings!

**Questions?** Don't hesitate to reach out through our [community channels](#-community--support) - we promise our response time is better than most APIs.

---

*Built with ❤️, ☕, and an unhealthy amount of GitHub commits by the Zer0-Mistakes community*

**🚀 Ready to contribute?** [Fork the repository](https://github.com/bamr87/zer0-mistakes/fork) and join our digital collective! Remember: in this community, there are no bugs, only undocumented features waiting to be discovered.