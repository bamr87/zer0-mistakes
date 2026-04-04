---
title: "Setting a Markdown processor for your GitHub Pages site using Jekyll"
description: "You can choose a Markdown processor to determine how Markdown is rendered on your GitHub Pages site."
layout: default
categories:
    - docs
    - github-pages
    - jekyll-setup
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/jekyll-setup/setting-a-markdown-processor-for-your-github-pages-site-using-jekyll/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/setting-up-a-github-pages-site-with-jekyll/setting-a-markdown-processor-for-your-github-pages-site-using-jekyll.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---

<!-- See official GitHub docs for full instructions -->

People with write permissions for a repository can set the Markdown processor for a GitHub Pages site.

GitHub Pages supports two Markdown processors: [kramdown](http://kramdown.gettalong.org/) and GitHub's own Markdown processor, which is used to render [GitHub Flavored Markdown (GFM)](https://github.github.com/gfm/) throughout GitHub. For more information, see [get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/about-writing-and-formatting-on-github](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/about-writing-and-formatting-on-github).

You can use GitHub Flavored Markdown with either processor.

<!-- See official GitHub docs for full instructions -->
1. In your repository, browse to the __config.yml_ file.
<!-- See official GitHub docs for full instructions -->
1. Find the line that starts with `markdown:` and change the value to `kramdown` or `GFM`. The full line should read `markdown: kramdown` or `markdown: GFM`.
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->

## Further reading

* [kramdown Documentation](https://kramdown.gettalong.org/documentation.html)
* [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/setting-up-a-github-pages-site-with-jekyll/setting-a-markdown-processor-for-your-github-pages-site-using-jekyll.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

