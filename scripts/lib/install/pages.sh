#!/usr/bin/env bash
# scripts/lib/install/pages.sh
#
# Starter-page generator for jekyll-theme-zer0 installations.
# Replaces 8 near-identical create_*_page heredoc functions with a single
# manifest-driven renderer.
#
# Required env (from install.conf via config.sh):
#   TARGET_DIR, THEME_NAME, THEME_DISPLAY_NAME, DEFAULT_URL, GITHUB_URL
#
# Required functions (from template.sh):
#   create_from_template <template_relpath> <dest_abspath> <fallback_content>
#
# Public API:
#   render_starter_pages          - generate all default pages + admin
#   render_admin_settings_pages   - generate just the _about/settings/* pages

# ---------- Manifest --------------------------------------------------------
# Format (pipe-separated, no spaces around |):
#   <template_relpath>|<dest_relpath>|<mkdir_relpath>|<fallback_func>
# Empty <mkdir_relpath> = no mkdir; empty <fallback_func> = no fallback.
_starter_pages_manifest() {
    cat <<'MANIFEST'
pages/quickstart.md.template|pages/quickstart/index.md|pages/quickstart|_fallback_quickstart
pages/docs-index.md.template|pages/_docs/index.md|pages/_docs|_fallback_docs_index
pages/configuration.md.template|pages/_docs/configuration/index.md|pages/_docs/configuration|
pages/troubleshooting.md.template|pages/_docs/troubleshooting.md|pages/_docs|
pages/about.md.template|pages/_about/index.md|pages/_about|_fallback_about
pages/blog.md.template|pages/blog.md||_fallback_blog
MANIFEST
}

_admin_settings_pages() {
    echo "theme config navigation collections analytics environment"
}

# ---------- Fallback content (only used when template missing) --------------
_fallback_quickstart() {
    cat <<EOF
---
layout: default
title: Quick Start
permalink: /quickstart/
---

# Quick Start Guide

Get your site up and running in just a few minutes!

## Prerequisites

Before you begin, make sure you have:

- **Docker Desktop** installed ([download](https://www.docker.com/products/docker-desktop))
- **Git** installed ([download](https://git-scm.com/))

## 1. Start Development Server

### Using Docker (Recommended)

\`\`\`bash
docker-compose up
\`\`\`

Your site will be available at **${DEFAULT_URL}**

### Using Local Ruby

\`\`\`bash
bundle install
bundle exec jekyll serve
\`\`\`

## 2. Customize Your Site

Edit \`_config.yml\` to personalize your site:

\`\`\`yaml
title: Your Site Title
description: Your site description
author: Your Name
\`\`\`

## 3. Add Content

- Create posts in \`pages/_posts/\`
- Create documentation in \`pages/_docs/\`
- Add static pages in \`pages/\`

## Next Steps

- [Read the Documentation](/docs/) - Learn about all features
- [Explore Configuration](/docs/configuration/) - Customize your site
- [Learn about Layouts](/docs/layouts/) - Understand page layouts

---

Need help? Check the [troubleshooting guide](/docs/troubleshooting/) or [open an issue](${GITHUB_URL}/issues).
EOF
}

_fallback_docs_index() {
    cat <<EOF
---
layout: default
title: Documentation
permalink: /docs/
---

# Documentation

Welcome to the ${THEME_NAME} theme documentation. Here you'll find everything you need to build and customize your Jekyll site.

## Getting Started

<div class="row">
<div class="col-md-6 mb-3">

### Installation

The theme supports multiple installation methods:

- **Docker** (Recommended) - Zero dependencies
- **Remote Theme** - For GitHub Pages
- **Gem** - Traditional Ruby installation

[View Installation Guide →](/quickstart/)

</div>
<div class="col-md-6 mb-3">

### Configuration

Customize your site with \`_config.yml\`:

- Site title and description
- Navigation menus
- Social links
- Analytics integration

[View Configuration Guide →](/docs/configuration/)

</div>
</div>

## Need Help?

- [Troubleshooting Guide](/docs/troubleshooting/)
- [GitHub Issues](${GITHUB_URL}/issues)
- [GitHub Discussions](${GITHUB_URL}/discussions)
EOF
}

_fallback_about() {
    cat <<EOF
---
layout: default
title: About
permalink: /about/
---

# About This Site

This site is built with the **${THEME_DISPLAY_NAME}** - a professional Jekyll theme designed for GitHub Pages with Bootstrap 5.3.

## Theme Features

- ✅ Bootstrap 5.3 integration
- ✅ Dark/Light mode toggle
- ✅ Docker support
- ✅ GitHub Pages compatible
- ✅ SEO optimized

## Learn More

- [Theme Documentation](/docs/)
- [GitHub Repository](${GITHUB_URL})
- [Report an Issue](${GITHUB_URL}/issues)

## Customizing This Page

Edit \`pages/_about/index.md\` to customize this page with your own content.
EOF
}

_fallback_blog() {
    cat <<'EOF'
---
layout: default
title: Blog
permalink: /blog/
---

# Blog

Welcome to the blog. Create your first post to get started!

## Creating Posts

Create markdown files in `pages/_posts/` with the format:

```
YYYY-MM-DD-your-post-title.md
```

## Recent Posts

{% for post in site.posts limit:5 %}
- [{{ post.title }}]({{ post.url }}) - {{ post.date | date: "%B %d, %Y" }}
{% endfor %}

{% if site.posts.size == 0 %}
*No posts yet. Create your first post to see it here!*
{% endif %}
EOF
}

# ---------- Public renderers ------------------------------------------------
render_admin_settings_pages() {
    local admin_dir="$TARGET_DIR/pages/_about/settings"
    mkdir -p "$admin_dir"

    log_info "Creating admin settings pages..."
    local page
    for page in $(_admin_settings_pages); do
        create_from_template "pages/admin/${page}.md.template" "$admin_dir/${page}.md" ""
    done
}

render_starter_pages() {
    log_info "Creating essential starter pages..."
    mkdir -p "$TARGET_DIR/pages"

    local tmpl dest mkdir_rel fb_func fallback
    while IFS='|' read -r tmpl dest mkdir_rel fb_func; do
        [ -z "$tmpl" ] && continue
        [ -n "$mkdir_rel" ] && mkdir -p "$TARGET_DIR/$mkdir_rel"
        if [ -n "$fb_func" ] && declare -f "$fb_func" >/dev/null 2>&1; then
            fallback="$("$fb_func")"
        else
            fallback=""
        fi
        create_from_template "$tmpl" "$TARGET_DIR/$dest" "$fallback"
    done <<MANIFEST_EOF
$(_starter_pages_manifest)
MANIFEST_EOF

    render_admin_settings_pages

    log_success "Starter pages created"
}

# Backward-compatible aliases (legacy install.sh call sites)
create_starter_pages() { render_starter_pages "$@"; }
create_admin_pages()   { render_admin_settings_pages "$@"; }
