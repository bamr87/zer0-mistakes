---
title: "Getting Started with Jekyll: Your First Static Site"
description: "A beginner-friendly tutorial on creating your first Jekyll website from scratch with step-by-step instructions."
categories:
  - Tutorial
  - Development
tags:
  - jekyll
  - beginner
  - static-site
  - getting-started
date: 2025-01-01T08:00:00.000Z
layout: journals
preview: /images/favicon_gpt_computer_retro.png
author: "Zer0-Mistakes Team"
featured: false
estimated_reading_time: "15 minutes"
---

Welcome to Jekyll! This tutorial will guide you through creating your first static website using Jekyll, the popular static site generator.

## What is Jekyll?

Jekyll is a static site generator that transforms plain text into static websites:

- **Markdown support**: Write content in Markdown
- **Liquid templating**: Create dynamic layouts
- **GitHub Pages ready**: Free hosting on GitHub
- **Plugin ecosystem**: Extend functionality

## Prerequisites

Before starting, ensure you have:

- Ruby 2.5+ installed
- RubyGems package manager
- Basic command line knowledge
- A text editor

Or simply use Docker (recommended)!

## Creating Your First Site

### Step 1: Install Jekyll

```bash
gem install bundler jekyll
```

### Step 2: Create a New Site

```bash
jekyll new my-awesome-site
cd my-awesome-site
```

### Step 3: Serve Locally

```bash
bundle exec jekyll serve
```

Visit `http://localhost:4000` to see your site!

## Understanding the Structure

```text
my-awesome-site/
├── _config.yml      # Site configuration
├── _posts/          # Blog posts
├── _layouts/        # Page templates
├── _includes/       # Reusable components
└── index.md         # Homepage
```

## Creating Your First Post

Create a new file in `_posts/`:

```markdown
---
layout: post
title: "My First Post"
date: 2025-01-01
---

Hello, Jekyll world!
```

## Next Steps

- Explore Jekyll themes
- Learn Liquid templating
- Set up GitHub Pages deployment
- Add plugins for extra features

Happy building!
