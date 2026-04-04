---
title: "Creating a GitHub Pages site with Jekyll"
description: "You can use Jekyll to create a GitHub Pages site in a new or existing repository."
layout: default
categories:
    - docs
    - github-pages
    - jekyll-setup
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/jekyll-setup/creating-a-github-pages-site-with-jekyll/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/setting-up-a-github-pages-site-with-jekyll/creating-a-github-pages-site-with-jekyll.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---



<!-- See official GitHub docs for full instructions -->

## Prerequisites

Before you can use Jekyll to create a GitHub Pages site, you must install Jekyll and Git. For more information, see [Installation](https://jekyllrb.com/docs/installation/) in the Jekyll documentation and [get-started/git-basics/set-up-git](https://docs.github.com/en/get-started/git-basics/set-up-git).

<!-- See official GitHub docs for full instructions -->

<!-- See official GitHub docs for full instructions -->

## Creating a repository for your site

<!-- See official GitHub docs for full instructions -->

<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
{% indented_data_reference reusables.pages.emu-org-only spaces=3 %}
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->

## Creating your site

<!-- See official GitHub docs for full instructions -->

<!-- See official GitHub docs for full instructions -->

<!-- See official GitHub docs for full instructions -->
1. If you don't already have a local copy of your repository, navigate to the location where you want to store your site's source files, replacing PARENT-FOLDER with the folder you want to contain the folder for your repository.

   ```shell
   cd PARENT-FOLDER
   ```

1. If you haven't already, initialize a local Git repository, replacing REPOSITORY-NAME with the name of your repository.

   ```shell
   git init REPOSITORY-NAME
   > Initialized empty Git repository in /REPOSITORY-NAME/.git/
   # Creates a new folder on your computer, initialized as a Git repository
   ```

1. Change directories to the repository.

   ```shell
   cd REPOSITORY-NAME
   # Changes the working directory
   ```

<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
  For example, if you chose to publish your site from the `docs` folder on the default branch, create and change directories to the `docs` folder.

    ```shell
    mkdir docs
    # Creates a new folder called docs
    cd docs
    ```

    If you chose to publish your site from the `gh-pages` branch, create and checkout the `gh-pages` branch.

    ```shell
    git checkout --orphan gh-pages
    # Creates a new branch, with no history or contents, called gh-pages, and switches to the gh-pages branch
    git rm -rf .
    # Removes the contents from your default branch from the working directory
    ```

1. To create a new Jekyll site, use the `jekyll new` command in your repository's root directory:

   ```shell
   jekyll new --skip-bundle .
   # Creates a Jekyll site in the current directory
   ```

1. Open the Gemfile that Jekyll created.
1. Add "#" to the beginning of the line that starts with `gem "jekyll"` to comment out this line.
1. Add the `github-pages` gem by editing the line starting with `# gem "github-pages"`. Change this line to:

   ```ruby
   gem "github-pages", "~> GITHUB-PAGES-VERSION", group: :jekyll_plugins
   ```

   Replace GITHUB-PAGES-VERSION with the latest supported version of the `github-pages` gem. You can find this version here: [Dependency versions](https://pages.github.com/versions.json).

   The correct version Jekyll will be installed as a dependency of the `github-pages` gem.
1. Save and close the Gemfile.
1. From the command line, run `bundle install`.
1. Open the `.gitignore` file that Jekyll created and ignore the gems lock file by adding this line:

   ```shell
   Gemfile.lock
   ```

1. Optionally, make any necessary edits to the `_config.yml` file. This is required for relative paths when the repository is hosted in a subdirectory. For more information, see [get-started/using-git/splitting-a-subfolder-out-into-a-new-repository](https://docs.github.com/en/get-started/using-git/splitting-a-subfolder-out-into-a-new-repository).

   ```yaml
   domain: my-site.github.io       # if you want to force HTTPS, specify the domain without the http at the start, e.g. example.com
   url: https://my-site.github.io  # the base hostname and protocol for your site, e.g. http://example.com
   baseurl: /REPOSITORY-NAME/      # place folder name if the site is served in a subfolder
   ```

1. Optionally, test your site locally. For more information, see [Testing your GitHub Pages site locally with Jekyll](/articles/testing-your-github-pages-site-locally-with-jekyll).
1. Add and commit your work.

   ```shell
   git add .
   git commit -m 'Initial GitHub pages site with Jekyll'
   ```

1. Add your repository on {% data variables.location.product_location %} as a remote, replacing {% ifversion ghes %}HOSTNAME with your enterprise's hostname, USER with the account that owns the repository{% ifversion ghes %}, and REPOSITORY with the name of the repository.

   ```shell
      git remote add origin https://github.com/USER/REPOSITORY.git
      git remote add origin https://HOSTNAME/USER/REPOSITORY.git
      ```

1. Push the repository to GitHub, replacing BRANCH with the name of the branch you're working on.

   ```shell
   git push -u origin BRANCH
   ```

<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->

<!-- See official GitHub docs for full instructions -->

## Next steps

To add a new page or post to your site, see [Jekyll Setup: adding-content-to-your-github-pages-site-using-jekyll](/docs/github-pages/jekyll-setup/adding-content-to-your-github-pages-site-using-jekyll/).

<!-- See official GitHub docs for full instructions --> For more information, see [Jekyll Setup: adding-a-theme-to-your-github-pages-site-using-jekyll](/docs/github-pages/jekyll-setup/adding-a-theme-to-your-github-pages-site-using-jekyll/).

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/setting-up-a-github-pages-site-with-jekyll/creating-a-github-pages-site-with-jekyll.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

