---
title: 📚 Published Documentation Library
author: Amr Abdel Eissa
layout: collection
permalink: /docs/
description: Public documentation library for technology guides, tutorials, and general reference materials
preview: /images/previews/published-documentation-library.png
categories:
  - docs
  - public-documentation
  - library
sidebar:
  nav: docs
toc_sticky: true
date: 2021-09-24T19:32:44.876Z
lastmod: 2025-11-17T03:43:52.499Z
---

# 📚 Zer0-Mistakes Documentation Library

Welcome to the **published documentation library** for Zer0-Mistakes! This section contains user-facing documentation, tutorials, and general technology guides that are rendered and served online for public consumption.

## 🎯 Purpose & Scope

The `/pages/_docs/` collection serves as the **public documentation hub** containing:

- **Technology Guides**: General documentation for Jekyll, Bootstrap, Ruby, and other stack technologies
- **User Tutorials**: Step-by-step guides for using and customizing the Zer0-Mistakes theme
- **Imported Documentation**: Cleaned and processed docs from external sources (Jekyll docs, Bootstrap guides)
- **Reference Materials**: API references, configuration guides, and troubleshooting resources
- **Rendered Content**: Markdown files converted from MDX sources for Jekyll processing

This documentation targets **end-users, theme adopters, and general developers** who want to use or learn about the technologies in our stack.

> **🛠️ For Technical Documentation**: See [`/docs/`](../../docs/) for repository-specific technical documentation targeting contributors and maintainers.

## 📖 Content Organization

### 🌟 Current Documentation Collections

**🔧 Jekyll Documentation**

- Comprehensive Jekyll guides sourced from official documentation
- Theme-specific customization instructions
- Performance optimization and security best practices
- Plugin integration and advanced configuration

**🎨 Bootstrap & Frontend**

- Component usage guides and examples
- Responsive design patterns and utilities
- Custom CSS integration and theme customization
- Accessibility and cross-browser compatibility

**⚙️ General Technology Stack**

- Ruby and gem management
- Liquid templating language reference
- Docker and containerization guides
- Git workflows and version control

### 📝 Content Sources & Processing

This documentation library aggregates content from multiple sources:

1. **Converted MDX Files**: Technical documentation from [`/docs/`](../../docs/) converted to Markdown for public consumption
2. **Imported External Docs**: Official documentation from Jekyll, Bootstrap, and other technologies
3. **Original Tutorials**: Theme-specific guides and tutorials written specifically for users
4. **Community Contributions**: User-submitted guides and best practices

## 🔄 Documentation Workflow

### 📥 Content Import Process

```bash
# Import official Jekyll documentation
git submodule add https://github.com/jekyll/jekyll.git jekyll-docs

# Configure sparse checkout for relevant documentation
cd jekyll-docs/docs/_docs
git sparse-checkout init --cone
git sparse-checkout set docs/_docs
```

### 🔄 MDX to Markdown Conversion

The documentation processing pipeline:

1. **Source**: MDX files in `/docs/` with technical implementation details
2. **Processing**: Automated conversion removing repository-specific technical details
3. **Cleanup**: Sanitization for public consumption and user-focused content
4. **Publication**: Processed Markdown files placed in `pages/_docs/` for Jekyll rendering

### 📋 Content Standards

**📄 File Format**: Standard Markdown (`.md`) for Jekyll compatibility
**🏷️ Front Matter**: Complete metadata for proper categorization and navigation
**🔗 Cross-References**: Links to related guides and external resources
**💡 User-Focused**: Content written for end-users rather than developers

## 🚀 Getting Started

### 📚 Available Documentation

Currently available technology documentation:

- **[Jekyll](jekyll/)** - Static site generator guides and advanced configuration
- **[Ruby](ruby/)** - Ruby language and gem management
- **[Liquid](liquid/)** - Templating language reference and examples
- **[Bootstrap](bootstrap/)** - Component library and responsive design patterns
- **[Docker](docker/)** - Containerization and development environment setup

### 📖 Contributing to Documentation

To add new documentation to this library:

1. **Check Source**: Determine if content should be in `/docs/` (technical) or `pages/_docs/` (public)
2. **Follow Standards**: Use proper front matter and Markdown formatting
3. **Test Locally**: Verify Jekyll rendering and navigation
4. **Submit PR**: Include description of documentation purpose and target audience

### 🔧 Adding External Documentation

To import external documentation (e.g., official project docs):

```bash
# Add as git submodule for version tracking
git submodule add https://github.com/jekyll/jekyll.git jekyll-docs

# Configure sparse checkout for relevant sections
cd jekyll-docs
git sparse-checkout init --cone
git sparse-checkout set docs/_docs

# Process and clean content for integration
# (Custom scripts in /scripts/ handle this workflow)
```

## 🌐 Documentation Ecosystem

This documentation library is part of a larger documentation ecosystem:

| Location                                                | Purpose                                | Audience                       | Format   |
| ------------------------------------------------------- | -------------------------------------- | ------------------------------ | -------- |
| `pages/_docs/` _(This Library)_                         | **Public documentation & tutorials**   | End Users & General Developers | Markdown |
| [`/docs/`](../../docs/)                                 | **Technical repository documentation** | Contributors & Maintainers     | MDX      |
| [`/.github/instructions/`](../../.github/instructions/) | **AI-assisted development guidance**   | GitHub Copilot & Contributors  | Markdown |
| `/README.md`                                            | **Project overview & quick start**     | All Users                      | Markdown |

---

**🎯 Quick Navigation**

- [📚 Browse Jekyll Documentation](jekyll/) - Learn Jekyll fundamentals and advanced techniques
- [🎨 Explore Bootstrap Components](bootstrap/) - Master responsive design and UI components
- [⚙️ Technical Implementation](../../docs/) - Repository architecture and development guides
- [🏠 Return to Homepage](../../) - Main Zer0-Mistakes theme showcase

**Last Updated**: November 16, 2025  
**Maintained By**: Zer0-Mistakes Community
