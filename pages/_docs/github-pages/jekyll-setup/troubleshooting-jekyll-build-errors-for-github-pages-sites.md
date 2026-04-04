---
title: "Troubleshooting Jekyll build errors for GitHub Pages sites"
description: "You can use Jekyll build error messages to troubleshoot problems with your GitHub Pages site."
layout: default
categories:
    - docs
    - github-pages
    - jekyll-setup
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/jekyll-setup/troubleshooting-jekyll-build-errors-for-github-pages-sites/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/setting-up-a-github-pages-site-with-jekyll/troubleshooting-jekyll-build-errors-for-github-pages-sites.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---

## Troubleshooting build errors

If Jekyll encounters an error building your GitHub Pages site locally or on GitHub, you can use error messages to troubleshoot. For more information about error messages and how to view them, see [Jekyll Setup: about-jekyll-build-errors-for-github-pages-sites](/docs/github-pages/jekyll-setup/about-jekyll-build-errors-for-github-pages-sites/).

If you received a generic error message, check for common issues.
* You're using unsupported plugins. For more information, see [Jekyll Setup: about-github-pages-and-jekyll#plugins](/docs/github-pages/jekyll-setup/about-github-pages-and-jekyll#plugins/).* Your repository has exceeded our repository size limits. For more information, see [repositories/working-with-files/managing-large-files/about-large-files-on-github](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)* You changed the `source` setting in your `_config.yml` file. If you publish your site from a branch, GitHub Pages overrides this setting during the build process.
* A filename in your published files contains a colon (`:`) which is not supported.

If you received a specific error message, review the troubleshooting information for the error message below.

After you've fixed any errors, trigger another build by pushing the changes to your site's source branch (if you are publishing from a branch) or by triggering your custom GitHub Actions workflow (if you are publishing with GitHub Actions).

## Config file error

This error means that your site failed to build because the `_config.yml` file contains syntax errors.

To troubleshoot, make sure that your `_config.yml` file follows these rules:

<!-- See official GitHub docs for full instructions -->

<!-- See official GitHub docs for full instructions -->

<!-- See official GitHub docs for full instructions -->

## Date is not a valid datetime

This error means that one of the pages on your site includes an invalid datetime.

To troubleshoot, search the file in the error message and the file's layouts for calls to any date-related Liquid filters. Make sure that any variables passed into date-related Liquid filters have values in all cases and never pass `nil` or `""`. For more information, see [Filters](https://shopify.dev/docs/api/liquid/filters) in the Liquid documentation.

## File does not exist in includes directory

This error means that your code references a file that doesn't exist in your `_includes` directory.

<!-- See official GitHub docs for full instructions --> If any of the files you've referenced aren't in the `_includes` directory, copy or move the files into the `_includes` directory.

## File is not properly UTF-8 encoded

This error means that you used non-Latin characters, like `日本語`, without telling the computer to expect these symbols.

To troubleshoot, force UTF-8 encoding by adding the following line to your `_config.yml` file:

```yaml
encoding: UTF-8
```

## Invalid highlighter language

This error means that you specified any syntax highlighter other than [Rouge](https://github.com/jneen/rouge) or [Pygments](https://pygments.org/) in your configuration file.

To troubleshoot, update your `_config.yml` file to specify [Rouge](https://github.com/jneen/rouge) or [Pygments](https://pygments.org/). For more information, see [Jekyll Setup: about-github-pages-and-jekyll#syntax-highlighting](/docs/github-pages/jekyll-setup/about-github-pages-and-jekyll#syntax-highlighting/).

## Invalid post date

This error means that a post on your site contains an invalid date in the filename or YAML front matter.

To troubleshoot, make sure all dates are formatted as YYYY-MM-DD HH:MM:SS for UTC and are actual calendar dates. To specify a time zone with an offset from UTC, use the format YYYY-MM-DD HH:MM:SS +/-TTTT, like `2014-04-18 11:30:00 +0800`.

If you specify a date format in your `_config.yml` file, make sure the format is correct.

## Invalid Sass or SCSS

This error means your repository contains a Sass or SCSS file with invalid content.

To troubleshoot, review the line number included in the error message for invalid Sass or SCSS. To help prevent future errors, install a Sass or SCSS linter for your favorite text editor.

## Invalid submodule

This error means that your repository includes a submodule that hasn't been properly initialized.

<!-- See official GitHub docs for full instructions -->

If do you want to use the submodule, make sure you use `https://` when referencing the submodule (not `http://`) and that the submodule is in a public repository.

## Invalid YAML in data file

This error means that one of more files in the __data_ folder contains invalid YAML.

To troubleshoot, make sure the YAML files in your __data_ folder follow these rules:

<!-- See official GitHub docs for full instructions -->

<!-- See official GitHub docs for full instructions -->

For more information about Jekyll data files, see [Data Files](https://jekyllrb.com/docs/datafiles/) in the Jekyll documentation.

## Markdown errors

This error means that your repository contains Markdown errors.

To troubleshoot, make sure you are using a supported Markdown processor. For more information, see [Jekyll Setup: setting-a-markdown-processor-for-your-github-pages-site-using-jekyll](/docs/github-pages/jekyll-setup/setting-a-markdown-processor-for-your-github-pages-site-using-jekyll/).

Then, make sure the file in the error message uses valid Markdown syntax. For more information, see [Markdown: Syntax](https://daringfireball.net/projects/markdown/syntax) on Daring Fireball.

## Missing docs folder

This error means that you have chosen the `docs` folder on a branch as your publishing source, but there is no `docs` folder in the root of your repository on that branch.

To troubleshoot, if your `docs` folder was accidentally moved, try moving the `docs` folder back to the root of your repository on the branch you chose for your publishing source. If the `docs` folder was accidentally deleted, you can either:
* Use Git to revert or undo the deletion. For more information, see [git-revert](https://git-scm.com/docs/git-revert.html) in the Git documentation.
* Create a new `docs` folder in the root of your repository on the branch you chose for your publishing source and add your site's source files to the folder. For more information, see [repositories/working-with-files/managing-files/creating-new-files](https://docs.github.com/en/repositories/working-with-files/managing-files/creating-new-files).
* Change your publishing source. For more information, see [Getting Started: configuring-a-publishing-source-for-your-github-pages-site](/docs/github-pages/getting-started/configuring-a-publishing-source-for-your-github-pages-site/).

## Missing submodule

This error means that your repository includes a submodule that doesn't exist or hasn't been properly initialized.

<!-- See official GitHub docs for full instructions -->

If you do want to use a submodule, initialize the submodule. For more information, see [Git Tools - Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules) in the _Pro Git_ book.

## Relative permalinks configured

This error means that you have relative permalinks, which are not supported by GitHub Pages, in your `_config.yml` file.

Permalinks are permanent URLs that reference a particular page on your site. Absolute permalinks begin with the root of the site, while relative permalinks begin with the folder containing the referenced page. GitHub Pages and Jekyll no longer support relative permalinks. For more information about permalinks, see [Permalinks](https://jekyllrb.com/docs/permalinks/) in the Jekyll documentation.

To troubleshoot, remove the `relative_permalinks` line from your `_config.yml` file and reformat any relative permalinks in your site with absolute permalinks. For more information, see [repositories/working-with-files/managing-files/editing-files](https://docs.github.com/en/repositories/working-with-files/managing-files/editing-files).

## Syntax error in 'for' loop

This error means that your code includes invalid syntax in a Liquid `for` loop declaration.

To troubleshoot, make sure all `for` loops in the file in the error message have proper syntax. For more information about proper syntax for `for` loops, see [Tags](https://shopify.dev/docs/api/liquid/tags/for) in the Liquid documentation.

## Tag not properly closed

This error message means that your code includes a logic tag that is not properly closed. For example, {% raw %}`{% capture example_variable %}` must be closed by `{% endcapture %}`{% endraw %}.

To troubleshoot, make sure all logic tags in the file in the error message are properly closed. For more information, see [Tags](https://shopify.dev/docs/api/liquid/tags) in the Liquid documentation.

## Tag not properly terminated

This error means that your code includes an output tag that is not properly terminated. For example, {% raw %}`{{ page.title }` instead of `{{ page.title }}`{% endraw %}.

To troubleshoot, make sure all output tags in the file in the error message are terminated with `}}`. For more information, see [Objects](https://shopify.dev/docs/api/liquid/objects) in the Liquid documentation.

## Unknown tag error

This error means that your code contains an unrecognized Liquid tag.

To troubleshoot, make sure all Liquid tags in the file in the error message match Jekyll's default variables and there are no typos in the tag names. For a list of default variables, see [Variables](https://jekyllrb.com/docs/variables/) in the Jekyll documentation.

Unsupported plugins are a common source of unrecognized tags. If you use an unsupported plugin in your site by generating your site locally and pushing your static files to GitHub, make sure the plugin is not introducing tags that are not in Jekyll's default variables. For a list of supported plugins, see [Jekyll Setup: about-github-pages-and-jekyll#plugins](/docs/github-pages/jekyll-setup/about-github-pages-and-jekyll#plugins/).

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/setting-up-a-github-pages-site-with-jekyll/troubleshooting-jekyll-build-errors-for-github-pages-sites.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

