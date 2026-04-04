---
title: "Deleting a GitHub Pages site"
description: "You can delete a GitHub Pages site."
layout: default
categories:
    - docs
    - github-pages
    - getting-started
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/getting-started/deleting-a-github-pages-site/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/deleting-a-github-pages-site.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---

## Deleting your site

You can delete your site in two ways:
* Delete the repository. For more information, see [repositories/creating-and-managing-repositories/deleting-a-repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/deleting-a-repository).
* Change the source to the `None` branch. For more information, see [Deleting your site by changing the source](#deleting-your-site-by-changing-the-source) below.

If you want to remove the current deployment of your site but do not want to delete the site, you can unpublish your site. For more information, see [Getting Started: unpublishing-a-github-pages-site](/docs/github-pages/getting-started/unpublishing-a-github-pages-site/).

## Deleting your site by changing the source

<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
1. Under "Build and deployment", under "Source", select **Deploy from a branch** even if the site is currently using GitHub Actions.
1. Under "Build and deployment", use the branch dropdown menu and select `None` as the publishing source.
   <!-- Image: Screenshot of Pages settings in a GitHub repository. A menu to select a branch for a publishing source, labeled "None," is outlined in dark orange. -->
1. Click **Save**.

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/deleting-a-github-pages-site.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

