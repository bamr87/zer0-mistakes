---
title: "Creating a GitHub Pages site"
description: "You can create a GitHub Pages site in a new or existing repository."
layout: default
categories:
    - docs
    - github-pages
    - getting-started
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/getting-started/creating-a-github-pages-site/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/creating-a-github-pages-site.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---



## Creating a repository for your site

<!-- See official GitHub docs for full instructions -->

<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full details -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->

## Creating your site

<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
1. Decide which publishing source you want to use. See [Getting Started: configuring-a-publishing-source-for-your-github-pages-site](/docs/github-pages/getting-started/configuring-a-publishing-source-for-your-github-pages-site/).
1. Create the entry file for your site. GitHub Pages will look for an `index.html`, `index.md`, or `README.md` file as the entry file for your site.

   If your publishing source is a branch and folder, the entry file must be at the top level of the source folder on the source branch. For example, if your publishing source is the `/docs` folder on the `main` branch, your entry file must be located in the `/docs` folder on a branch called `main`.

   If your publishing source is a GitHub Actions workflow, the artifact that you deploy must include the entry file at the top level of the artifact. Instead of adding the entry file to your repository, you may choose to have your GitHub Actions workflow generate your entry file when the workflow runs.
1. Configure your publishing source. See [Getting Started: configuring-a-publishing-source-for-your-github-pages-site](/docs/github-pages/getting-started/configuring-a-publishing-source-for-your-github-pages-site/).
<!-- See official GitHub docs for full instructions -->

## Viewing your published site

<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
1. Optionally, if you're publishing a project site from a private or internal repository, choose the visibility for your site. Under "GitHub Pages," select the visibility dropdown menu, then select public or private.
   <!-- Image: Screenshot of Pages settings for a repository. The visibility dropdown, currently set to "Private," is outlined in dark orange. -->
   <!-- See official GitHub docs for full details -->
1. To see your published site, under "GitHub Pages," click **● Visit site**.

<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->

## Static site generators

GitHub Pages publishes any static files that you push to your repository. You can create your own static files or use a static site generator to build your site for you. You can also customize your own build process locally or on another server.

If you use a custom build process or a static site generator other than Jekyll, you can write a GitHub Actions workflow to build and publish your site. GitHub provides workflow templates for several static site generators. For more information, see [Getting Started: configuring-a-publishing-source-for-your-github-pages-site](/docs/github-pages/getting-started/configuring-a-publishing-source-for-your-github-pages-site/).

If you publish your site from a source branch, GitHub Pages will use Jekyll to build your site by default. If you want to use a static site generator other than Jekyll, we recommend that you write a GitHub Actions to build and publish your site instead. Otherwise, disable the Jekyll build process by creating an empty file called `.nojekyll` in the root of your publishing source, then follow your static site generator's instructions to build your site locally.

>[!NOTE] GitHub Pages does not support server-side languages such as PHP, Ruby, or Python.

## MIME types on GitHub Pages

A MIME type is a header that a server sends to a browser, providing information about the nature and format of the files the browser requested. GitHub Pages supports more than 750 MIME types across thousands of file extensions. The list of supported MIME types is generated from the [mime-db project](https://github.com/jshttp/mime-db).

While you can't specify custom MIME types on a per-file or per-repository basis, you can add or modify MIME types for use on GitHub Pages. For more information, see [the mime-db contributing guidelines](https://github.com/jshttp/mime-db#adding-custom-media-types).

## Next steps

You can add more pages to your site by creating more new files. Each file will be available on your site in the same directory structure as your publishing source. For example, if the publishing source for your project site is the `gh-pages` branch, and you create a new file called `/about/contact-us.md` on the `gh-pages` branch, the file will be available at `https://<user>.github.io/<repository>/`http(s)://<hostname>/pages/<username>/<repository>/about/contact-us.html`.

You can also add a theme to customize your site’s look and feel. For more information, see [Jekyll Setup: adding-a-theme-to-your-github-pages-site-using-jekyll](/docs/github-pages/jekyll-setup/adding-a-theme-to-your-github-pages-site-using-jekyll/).

## Further reading

* [Jekyll Setup: about-github-pages-and-jekyll](/docs/github-pages/jekyll-setup/about-github-pages-and-jekyll/).
* [Jekyll Setup: troubleshooting-jekyll-build-errors-for-github-pages-sites](/docs/github-pages/jekyll-setup/troubleshooting-jekyll-build-errors-for-github-pages-sites/)
* [pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-and-deleting-branches-within-your-repository](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-and-deleting-branches-within-your-repository)
* [repositories/working-with-files/managing-files/creating-new-files](https://docs.github.com/en/repositories/working-with-files/managing-files/creating-new-files)
* [Getting Started: troubleshooting-404-errors-for-github-pages-sites](/docs/github-pages/getting-started/troubleshooting-404-errors-for-github-pages-sites/)

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/creating-a-github-pages-site.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

