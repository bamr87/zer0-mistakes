---
title: "Unpublishing a GitHub Pages site"
description: "You can unpublish your GitHub Pages site so that your current deployment is removed and the site is no longer available."
layout: default
categories:
    - docs
    - github-pages
    - getting-started
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/getting-started/unpublishing-a-github-pages-site/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/unpublishing-a-github-pages-site.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---

When you unpublish your site, your current deployment is removed and the site will no longer be available. Any existing repository settings or content will not be affected.

Unpublishing a site does not permanently delete the site. For information on deleting a site, see [Getting Started: deleting-a-github-pages-site](/docs/github-pages/getting-started/deleting-a-github-pages-site/).

<!-- See official GitHub docs for full instructions -->
1. Under **GitHub Pages**, next to the **Your site is live at** message, click ●.
1. In the menu that appears, select **Unpublish site**.
   <!-- Image: Screenshot of GitHub Pages settings with the URL of a live site. On the right under a kebab icon, the "Unpublish site" option is outlined in orange. -->

## Re-enabling a site that has been unpublished

Unpublishing your GitHub Pages site removes your current deployment. To make your site available again, you can create a new deployment.

### Re-enable using GitHub Actions

A successful workflow run in the repository for your site will create a new deployment. Trigger a workflow run to redeploy your site.

### Re-enabling your site when publishing from a branch

1. Configure your publishing source to publish from a branch of your choosing. For more information, see [Getting Started: configuring-a-publishing-source-for-your-github-pages-site#publishing-from-a-branch](/docs/github-pages/getting-started/configuring-a-publishing-source-for-your-github-pages-site#publishing-from-a-branch/).
1. Commit to your publishing source to create a new deployment.

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/unpublishing-a-github-pages-site.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

