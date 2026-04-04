---
title: "Using submodules with GitHub Pages"
description: "You can use submodules with GitHub Pages to include other projects in your site's code."
layout: default
categories:
    - docs
    - github-pages
    - getting-started
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/getting-started/using-submodules-with-github-pages/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/using-submodules-with-github-pages.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---

If the repository for your GitHub Pages site contains submodules, their contents will automatically be pulled in when your site is built.

You can only use submodules that point to public repositories, because the GitHub Pages server cannot access private repositories.

Use the `https://` read-only URL for your submodules, including nested submodules. You can make this change in your `.gitmodules` file.

## Further reading

* [Git Tools - Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules) from the _Pro Git_ book
* [Jekyll Setup: troubleshooting-jekyll-build-errors-for-github-pages-sites](/docs/github-pages/jekyll-setup/troubleshooting-jekyll-build-errors-for-github-pages-sites/)

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/using-submodules-with-github-pages.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

