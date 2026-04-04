---
title: "Quickstart for GitHub Pages"
description: "You can use GitHub Pages to showcase some open source projects, host a blog, or even share your résumé. This guide will help get you started on creating your ne"
layout: default
categories:
    - docs
    - github-pages
    - overview
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/quickstart/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/quickstart.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---

## Introduction

In this guide, you'll create a user site at `<username>.github.io`.

## Creating your website

<!-- See official GitHub docs for full instructions -->
1. Enter `username.github.io` as the repository name. Replace `username` with your GitHub username. For example, if your username is `octocat`, the repository name should be `octocat.github.io`.
   <!-- Image: Screenshot of GitHub Pages settings in a repository. The repository name field contains the text "octocat.github.io" and is outlined in dark orange. -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
1. Under "Build and deployment", under "Source", select **Deploy from a branch**.
1. Under "Build and deployment", under "Branch", use the branch dropdown menu and select a publishing source.
   <!-- Image: Screenshot of Pages settings in a GitHub repository. A menu to select a branch for a publishing source, labeled "None," is outlined in dark orange. -->
1. Optionally, open the `README.md` file of your repository. The `README.md` file is where you will write the content for your site. You can edit the file or keep the default content for now.
1. Visit `username.github.io` to view your new website. Note that it can take up to 10 minutes for changes to your site to publish after you push the changes to GitHub.

## Changing the title and description

By default, the title of your site is `username.github.io`. You can change the title by editing the `_config.yml` file in your repository. You can also add a description for your site.

1. Click the **Code** tab of your repository.
1. In the file list, click `_config.yml` to open the file.
1. Click ✏️ to edit the file.
1. The `_config.yml` file already contains a line that specifies the theme for your site. Add a new line with `title:` followed by the title you want. Add a new line with `description:` followed by the description you want. For example:

   ```yaml
   theme: jekyll-theme-minimal
   title: Octocat's homepage
   description: Bookmark this to keep an eye on my project updates!
   ```

1. When you are finished editing the file, click **Commit changes**.

## Next Steps

You've successfully created, personalized, and published your first GitHub Pages website but there's so much more to explore! Here are some helpful resources for taking your next steps with GitHub Pages:

* [Jekyll Setup: adding-content-to-your-github-pages-site-using-jekyll#about-content-in-jekyll-sites](/docs/github-pages/jekyll-setup/adding-content-to-your-github-pages-site-using-jekyll#about-content-in-jekyll-sites/): This guide explains how to add additional pages to your site.
* [configuring-a-custom-domain-for-your-github-pages-site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site): You can host your site on GitHub's `github.io` domain or your own custom domain.

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/quickstart.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

