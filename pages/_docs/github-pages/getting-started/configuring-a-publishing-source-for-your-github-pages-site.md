---
title: "Configuring a publishing source for your GitHub Pages site"
description: "You can configure your GitHub Pages site to publish when changes are pushed to a specific branch, or you can write a GitHub Actions workflow to publish your sit"
layout: default
categories:
    - docs
    - github-pages
    - getting-started
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/getting-started/configuring-a-publishing-source-for-your-github-pages-site/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---

## About publishing sources

<!-- See official GitHub docs for full instructions -->

<!-- See official GitHub docs for full instructions -->

## Publishing from a branch

1. Make sure the branch you want to use as your publishing source already exists in your repository.
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
1. Under "Build and deployment", under "Source", select **Deploy from a branch**.
1. Under "Build and deployment", use the branch dropdown menu and select a publishing source.
   <!-- Image: Screenshot of Pages settings in a GitHub repository. A menu to select a branch for a publishing source, labeled "None," is outlined in dark orange. -->
1. Optionally, use the folder dropdown menu to select a folder for your publishing source.
   <!-- Image: Screenshot of Pages settings in a GitHub repository. A menu to select a folder for a publishing source, labeled "/(root)," is outlined in dark orange. -->
1. Click **Save**.

### Troubleshooting publishing from a branch

<!-- See official GitHub docs for full instructions -->

<!-- See official GitHub docs for full instructions -->

If you choose the `docs` folder on any branch as your publishing source, then later remove the `/docs` folder from that branch in your repository, your site won't build and you'll get a page build error message for a missing `/docs` folder. For more information, see [Jekyll Setup: troubleshooting-jekyll-build-errors-for-github-pages-sites#missing-docs-folder](/docs/github-pages/jekyll-setup/troubleshooting-jekyll-build-errors-for-github-pages-sites#missing-docs-folder/).

{% ifversion build-pages-with-actions %}

Your GitHub Pages site will always be deployed with a GitHub Actions workflow run, even if you've configured your GitHub Pages site to be built using a different CI tool. Most external CI workflows "deploy" to GitHub Pages by committing the build output to the `gh-pages` branch of the repository, and typically include a `.nojekyll` file. When this happens, the GitHub Actions workflow will detect the state that the branch does not need a build step, and will execute only the steps necessary to deploy the site to GitHub Pages servers.

To find potential errors with either the build or deployment, you can check the workflow run for your GitHub Pages site by reviewing your repository's workflow runs. For more information, see [actions/monitoring-and-troubleshooting-workflows/viewing-workflow-run-history](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/viewing-workflow-run-history). For more information about how to re-run the workflow in case of an error, see [actions/managing-workflow-runs/re-running-workflows-and-jobs](https://docs.github.com/en/actions/managing-workflow-runs/re-running-workflows-and-jobs).


## Publishing with a custom GitHub Actions workflow

To configure your site to publish with GitHub Actions:

<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
1. Under "Build and deployment", under "Source", select **GitHub Actions**.
1. GitHub will suggest several workflow templates. If you already have a workflow to publish your site, you can skip this step. Otherwise, choose one of the options to create a GitHub Actions workflow. For more information about creating your custom workflow, see [Creating a custom GitHub Actions workflow to publish your site](#creating-a-custom-github-actions-workflow-to-publish-your-site).

   GitHub Pages does not associate a specific workflow to the GitHub Pages settings. However, the GitHub Pages settings will link to the workflow run that most recently deployed your site.

### Creating a custom GitHub Actions workflow to publish your site

For more information about GitHub Actions, see [actions](https://docs.github.com/en/actions).

When you configure your site to publish with GitHub Actions, GitHub will suggest workflow templates for common publishing scenarios. The general flow of a workflow is to:

1. Trigger whenever there is a push to the default branch of the repository or whenever the workflow is run manually from the Actions tab.
1. Use the [`actions/checkout`](https://github.com/actions/checkout) action to check out the repository contents.
1. If required by your site, build any static site files.
1. Use the [`actions/upload-pages-artifact`](https://github.com/actions/upload-pages-artifact) action to upload the static files as an artifact.
1. If the workflow was triggered by a push to the default branch, use the [`actions/deploy-pages`](https://github.com/actions/deploy-pages) action to deploy the artifact. This step is skipped if the workflow was triggered by a pull request.

The workflow templates use a deployment environment called `github-pages`. If your repository does not already include an environment called `github-pages`, the environment will be created automatically. We recommend that you add a deployment protection rule so that only the default branch can deploy to this environment. For more information, see [actions/deployment/targeting-different-environments/using-environments-for-deployment](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment).


> [!NOTE]
> A `CNAME` file in your repository file does not automatically add or remove a custom domain. Instead, you must configure the custom domain through your repository settings or through the API. For more information, see [Custom Domains: managing-a-custom-domain-for-your-github-pages-site#configuring-a-subdomain](/docs/github-pages/custom-domains/managing-a-custom-domain-for-your-github-pages-site#configuring-a-subdomain/) and [rest/pages#update-information-about-a-github-pages-site](https://docs.github.com/en/rest/pages#update-information-about-a-github-pages-site).


### Troubleshooting publishing with a custom GitHub Actions workflow

For information about how to troubleshoot your GitHub Actions workflow, see [actions/monitoring-and-troubleshooting-workflows/about-monitoring-and-troubleshooting](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/about-monitoring-and-troubleshooting).

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

