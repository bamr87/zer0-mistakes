---
title: "Testing your GitHub Pages site locally with Jekyll"
description: "You can build your GitHub Pages site locally to preview and test changes to your site."
layout: default
categories:
    - docs
    - github-pages
    - jekyll-setup
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/jekyll-setup/testing-your-github-pages-site-locally-with-jekyll/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/setting-up-a-github-pages-site-with-jekyll/testing-your-github-pages-site-locally-with-jekyll.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---

Anyone with read permissions for a repository can test a GitHub Pages site locally.

## Prerequisites

Before you can use Jekyll to test a site, you must:
* Install [Jekyll](https://jekyllrb.com/docs/installation/).
* Create a Jekyll site. For more information, see [Jekyll Setup: creating-a-github-pages-site-with-jekyll](/docs/github-pages/jekyll-setup/creating-a-github-pages-site-with-jekyll/).

<!-- See official GitHub docs for full instructions -->

<!-- See official GitHub docs for full instructions -->

## Building your site locally

<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
1. Run `bundle install`.
1. Run your Jekyll site locally.

   ```shell
   $ bundle exec jekyll serve
   > Configuration file: /Users/octocat/my-site/_config.yml
   >            Source: /Users/octocat/my-site
   >       Destination: /Users/octocat/my-site/_site
   > Incremental build: disabled. Enable with --incremental
   >      Generating...
   >                    done in 0.309 seconds.
   > Auto-regeneration: enabled for '/Users/octocat/my-site'
   > Configuration file: /Users/octocat/my-site/_config.yml
   >    Server address: http://127.0.0.1:4000/
   >  Server running... press ctrl-c to stop.
   ```

   > [!NOTE]
   > * If you've installed Ruby 3.0 or later (which you may have if you installed the default version via Homebrew), you might get an error at this step. That's because these versions of Ruby no longer come with `webrick` installed.
   >
   >   To fix the error, try running `bundle add webrick`, then re-running `bundle exec jekyll serve`.
   >
   > * If your `_config.yml` file's `baseurl` field contains your GitHub repository's link, you can use the following command when building locally to ignore that value and serve the site on `localhost:4000/`:
   >
   >   ```shell
   >   bundle exec jekyll serve --baseurl=""
   >   ```

1. To preview your site, in your web browser, navigate to `http://localhost:4000`.

## Updating the GitHub Pages gem

<!-- See official GitHub docs for full instructions -->

Jekyll is an active open source project that is updated frequently. If the `github-pages` gem on your computer is out of date with the `github-pages` gem on the GitHub Pages server, your site may look different when built locally than when published on GitHub. To avoid this, regularly update the `github-pages` gem on your computer.

<!-- See official GitHub docs for full instructions -->
1. Update the `github-pages` gem.
    * If you installed Bundler, run `bundle update github-pages`.
    * If you don't have Bundler installed, run `gem update github-pages`.

## Further reading

* [GitHub Pages](https://jekyllrb.com/docs/github-pages/) in the Jekyll documentation

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/setting-up-a-github-pages-site-with-jekyll/testing-your-github-pages-site-locally-with-jekyll.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

