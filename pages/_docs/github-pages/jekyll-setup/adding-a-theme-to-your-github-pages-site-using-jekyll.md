---
title: "Adding a theme to your GitHub Pages site using Jekyll"
description: "You can personalize your Jekyll site by adding and customizing a theme."
layout: default
categories:
    - docs
    - github-pages
    - jekyll-setup
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/jekyll-setup/adding-a-theme-to-your-github-pages-site-using-jekyll/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/setting-up-a-github-pages-site-with-jekyll/adding-a-theme-to-your-github-pages-site-using-jekyll.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---

<!-- See official GitHub docs for full instructions -->

People with write permissions for a repository can add a theme to a GitHub Pages site using Jekyll.

<!-- See official GitHub docs for full instructions -->

## Supported themes

Out of the box, the following themes are supported:

* [Architect](https://github.com/pages-themes/architect)
* [Cayman](https://github.com/pages-themes/cayman)
* [Dinky](https://github.com/pages-themes/dinky)
* [Hacker](https://github.com/pages-themes/hacker)
* [Leap day](https://github.com/pages-themes/leap-day)
* [Merlot](https://github.com/pages-themes/merlot)
* [Midnight](https://github.com/pages-themes/midnight)
* [Minima](https://github.com/jekyll/minima)
* [Minimal](https://github.com/pages-themes/minimal)
* [Modernist](https://github.com/pages-themes/modernist)
* [Slate](https://github.com/pages-themes/slate)
* [Tactile](https://github.com/pages-themes/tactile)
* [Time machine](https://github.com/pages-themes/time-machine)

The [`jekyll-remote-theme`](https://github.com/benbalter/jekyll-remote-theme) Jekyll plugin is also available and lets you load other themes.

## Adding a theme

<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
1. Navigate to `_config.yml`.
<!-- See official GitHub docs for full instructions -->
1. Add a new line to the file for the theme name.
   * To use a supported theme, type `theme: THEME-NAME`, replacing THEME-NAME with the name of the theme as shown in the `_config.yml` of the theme's repository (most themes follow a `jekyll-theme-NAME` naming convention). For a list of supported themes, see [Supported themes](/pages/setting-up-a-github-pages-site-with-jekyll/adding-a-theme-to-your-github-pages-site-using-jekyll#supported-themes) on the GitHub Pages site. For example, to select the Minimal theme, type `theme: jekyll-theme-minimal`.
   * To use any other Jekyll theme hosted on GitHub, type `remote_theme: THEME-NAME`, replacing THEME-NAME with the name of the theme as shown in the README of the theme's repository.
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->

## Customizing your theme's CSS

<!-- See official GitHub docs for full instructions -->

<!-- See official GitHub docs for full instructions -->

<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
1. Create a new file called `/assets/css/style.scss`.
1. Add the following content to the top of the file:

   ```scss
   ---
   ---

   @import "{% raw %}{{ site.theme }}{% endraw %}";
   ```

1. Add any custom CSS or Sass (including imports) you'd like immediately after the `@import` line.

## Customizing your theme's HTML layout

<!-- See official GitHub docs for full instructions -->

<!-- See official GitHub docs for full instructions -->

1. On GitHub, navigate to your theme's source repository. For example, the source repository for Minimal is `https://github.com/pages-themes/minimal`.
1. In the `_layouts` folder, navigate to your theme's `_default.html` file.
1. Copy the contents of the file.
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
1. Create a file called `_layouts/default.html`.
1. Paste the default layout content you copied earlier.
1. Customize the layout as you'd like.

## Further reading

* [repositories/working-with-files/managing-files/creating-new-files](https://docs.github.com/en/repositories/working-with-files/managing-files/creating-new-files)

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/setting-up-a-github-pages-site-with-jekyll/adding-a-theme-to-your-github-pages-site-using-jekyll.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

