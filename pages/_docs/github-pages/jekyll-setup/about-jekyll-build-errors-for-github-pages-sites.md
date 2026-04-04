---
title: "About Jekyll build errors for GitHub Pages sites"
description: "If Jekyll encounters an error building your GitHub Pages site locally or on GitHub, you''ll receive an error message with more information."
layout: default
categories:
    - docs
    - github-pages
    - jekyll-setup
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/jekyll-setup/about-jekyll-build-errors-for-github-pages-sites/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/setting-up-a-github-pages-site-with-jekyll/about-jekyll-build-errors-for-github-pages-sites.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---

<!-- See official GitHub docs for full instructions -->

## About Jekyll build errors

If you are publishing from a branch, sometimes GitHub Pages will not attempt to build your site after you push changes to your site's publishing source.* The person who pushed the changes hasn't verified their email address. For more information, see [account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/verifying-your-email-address](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/verifying-your-email-address).* You're pushing with a deploy key. If you want to automate pushes to your site's repository, you can set up a machine user instead. For more information, see [authentication/connecting-to-github-with-ssh/managing-deploy-keys#machine-users](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys#machine-users).
* You're using a CI service that isn't configured to build your publishing source. For example, Travis CI won't build the `gh-pages` branch unless you add the branch to a safe list. For more information, see [Customizing the build](https://docs.travis-ci.com/user/customizing-the-build/#safelisting-or-blocklisting-branches) on Travis CI, or your CI service's documentation.

> [!NOTE]
> It can take up to 10 minutes for changes to your site to publish after you push the changes to GitHub.

{% ifversion build-pages-with-actions %}
If Jekyll does attempt to build your site and encounters an error, you will receive a build error message.
If Jekyll does attempt to build your site and encounters an error, you will receive a build error message. There are two main types of Jekyll build error messages.
* A "Page build warning" message means your build completed successfully, but you may need to make changes to prevent future problems.
* A "Page build failed" message means your build failed to complete. If Jekyll is able to detect a reason for the failure, you'll see a descriptive error message.

For more information about troubleshooting build errors, see [Jekyll Setup: troubleshooting-jekyll-build-errors-for-github-pages-sites](/docs/github-pages/jekyll-setup/troubleshooting-jekyll-build-errors-for-github-pages-sites/).

{% ifversion build-pages-with-actions %}

## Viewing Jekyll build error messages with GitHub Actions

By default, your GitHub Pages site is built and deployed with a GitHub Actions workflow run unless you've configured your GitHub Pages site to use a different CI tool. To find potential build errors, you can check the workflow run for your GitHub Pages site by reviewing your repository's workflow runs. For more information, see [actions/monitoring-and-troubleshooting-workflows/viewing-workflow-run-history](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/viewing-workflow-run-history). For more information about how to re-run the workflow in case of an error, see [actions/managing-workflow-runs/re-running-workflows-and-jobs](https://docs.github.com/en/actions/managing-workflow-runs/re-running-workflows-and-jobs).

{% ifversion build-pages-with-actions %}
## Viewing your repository's build failures on GitHub

You can see build failures (but not build warnings) for your site in the **Settings** tab of your site's repository.

## Viewing Jekyll build error messages locally

We recommend testing your site locally, which allows you to see build error messages on the command line, and addressing any build failures before pushing changes to GitHub. For more information, see [Jekyll Setup: testing-your-github-pages-site-locally-with-jekyll](/docs/github-pages/jekyll-setup/testing-your-github-pages-site-locally-with-jekyll/).

## Viewing Jekyll build error messages in your pull request

If you are publishing from a branch, when you create a pull request to update your publishing source on GitHub, you can see build error messages on the **Checks** tab of the pull request. For more information, see [pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks).

If you are publishing with a custom GitHub Actions workflow, in order to see build error messages in your pull request, you must configure your workflow to run on the `pull_request` trigger. When you do this, we recommend that you skip any deploy steps if the workflow was triggered by the `pull_request` event. This will allow you to see any build errors without deploying the changes from your pull request to your site. For more information, see [actions/using-workflows/events-that-trigger-workflows#pull_request](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request) and [actions/learn-github-actions/expressions](https://docs.github.com/en/actions/learn-github-actions/expressions).

## Viewing Jekyll build errors by email

If you are publishing from a branch, when you push changes to your publishing source on GitHub, GitHub Pages will attempt to build your site. If the build fails, you'll receive an email at your primary email address. <!-- See official GitHub docs for full instructions -->

If you are publishing with a custom GitHub Actions workflow, in order to receive emails about build errors in your pull request, you must configure your workflow to run on the `pull_request` trigger. When you do this, we recommend that you skip any deploy steps if the workflow was triggered by the `pull_request` event. This will allow you to see any build errors without deploying the changes from your pull request to your site. For more information, see [actions/using-workflows/events-that-trigger-workflows#pull_request](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request) and [actions/learn-github-actions/expressions](https://docs.github.com/en/actions/learn-github-actions/expressions).

## Viewing Jekyll build error messages in your pull request with a third-party CI service

You can configure a third-party service, such as [Travis CI](https://travis-ci.com/), to display error messages after each commit.

1. If you haven't already, add a file called _Gemfile_ in the root of your publishing source, with the following content:

   ```ruby
   source `https://rubygems.org`
   gem `github-pages`
   ```

1. Configure your site's repository for the testing service of your choice. For example, to use [Travis CI](https://travis-ci.com/), add a file named _.travis.yml_ in the root of your publishing source, with the following content:

   ```yaml
   language: ruby
   rvm:
     - 2.3
   script: "bundle exec jekyll build"
   ```

1. You may need to activate your repository with the third-party testing service. For more information, see your testing service's documentation.

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/setting-up-a-github-pages-site-with-jekyll/about-jekyll-build-errors-for-github-pages-sites.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

