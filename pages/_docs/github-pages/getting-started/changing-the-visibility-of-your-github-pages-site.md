---
title: "Changing the visibility of your GitHub Pages site"
description: "You can manage access control for your project site by publishing the site publicly or privately."
layout: default
categories:
    - docs
    - github-pages
    - getting-started
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/getting-started/changing-the-visibility-of-your-github-pages-site/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---

## About access control for GitHub Pages sites

With access control for GitHub Pages, you can restrict access to your project site by publishing the site privately. A privately published site can only be accessed by people with read access to the repository the site is published from. You can use privately published sites to share your internal documentation or knowledge base with members of your enterprise.

<!-- See official GitHub docs for full instructions -->

If your enterprise uses Enterprise Managed Users, GitHub Pages sites can only be published as private, and all GitHub Pages sites are only accessible to other enterprise members. For more information about Enterprise Managed Users, see [Getting Started: github-pages-limits#limits-for-enterprise-managed-users](/docs/github-pages/getting-started/github-pages-limits#limits-for-enterprise-managed-users/).

If your organization uses GitHub Enterprise Cloud without Enterprise Managed Users, you can choose to publish your project sites privately or publicly to anyone on the internet.

Access control is available for project sites that are published from a private or internal repository that are owned by the organization. You cannot manage access control for an organization site. For more information about the types of GitHub Pages sites, see [Getting Started: what-is-github-pages#types-of-github-pages-sites](/docs/github-pages/getting-started/what-is-github-pages#types-of-github-pages-sites/).

## About subdomains for privately published sites

Privately published sites are available at a different subdomain than publicly published sites. This ensures that your GitHub Pages site is secure from the moment it's published:

* We automatically secure every subdomain of `*.pages.github.io` with a TLS certificate, and enforce HSTS to ensure that browsers always serve the page over HTTPS.
* We use a unique subdomain for the privately published site to ensure that other repositories in your organization cannot publish content on the same origin as the site. This protects your site from [cookie tossing](https://github.blog/2013-04-09-yummy-cookies-across-domains/). This is also why we don't host GitHub Pages sites on the `github.com` domain.

You can see your site's unique subdomain in the "Pages" tab of your repository settings. If you're using a static site generator configured to build the site with the repository name as a path, you may need to update the settings for the static site generator when changing the site to private. For more information, see [Custom Domains: managing-a-custom-domain-for-your-github-pages-site#configuring-a-subdomain](/docs/github-pages/custom-domains/managing-a-custom-domain-for-your-github-pages-site#configuring-a-subdomain/) or the documentation for your static site generator.

To use a shorter and more memorable domain for your privately published site, you can configure a custom domain. For more information, see [configuring-a-custom-domain-for-your-github-pages-site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Changing the visibility of your GitHub Pages site

<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
1. Under "GitHub Pages", select the **GitHub Pages visibility** dropdown menu, then select a visibility.
1. To see your published site, under "GitHub Pages", click **● Visit site**.

   <!-- Image: Screenshot of a confirmation message for GitHub Pages listing the site's URL. On the right, the "Visit site" button is outlined in orange. -->

  <!-- See official GitHub docs for full instructions -->

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

