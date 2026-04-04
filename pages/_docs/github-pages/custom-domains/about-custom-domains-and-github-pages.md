---
title: "About custom domains and GitHub Pages"
description: "GitHub Pages supports using custom domains, or changing the root of your site''s URL from the default, like `octocat.github.io`, to any domain you own."
layout: default
categories:
    - docs
    - github-pages
    - custom-domains
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/custom-domains/about-custom-domains-and-github-pages/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---

## Supported custom domains

<!-- See official GitHub docs for full instructions -->

GitHub Pages works with two types of domains: subdomains and apex domains. For a list of unsupported custom domains, see [Custom Domains: troubleshooting-custom-domains-and-github-pages#custom-domain-names-that-are-unsupported](/docs/github-pages/custom-domains/troubleshooting-custom-domains-and-github-pages#custom-domain-names-that-are-unsupported/).

| Supported custom domain type | Example |
|---|---|
| `www` subdomain | `www.example.com` |
| Custom subdomain | `blog.example.com` |
| Apex domain        | `example.com` |

You can set up either or both of apex and `www` subdomain configurations for your site. For more information on apex domains, see [Using an apex domain for your GitHub Pages site](#using-an-apex-domain-for-your-github-pages-site).

We recommend always using a `www` subdomain, even if you also use an apex domain. When you create a new site with an apex domain, we automatically attempt to secure the `www` subdomain for use when serving your site's content, but you need to make the DNS changes to use the `www` subdomain. If you configure a `www` subdomain, we automatically attempt to secure the associated apex domain. For more information, see [Custom Domains: managing-a-custom-domain-for-your-github-pages-site](/docs/github-pages/custom-domains/managing-a-custom-domain-for-your-github-pages-site/).

## Using a custom domain across multiple repositories

If you set a custom domain for a user or organization site, by default, the same custom domain will be used for all project sites owned by the same account. For more information about site types, see [Getting Started: what-is-github-pages#types-of-github-pages-sites](/docs/github-pages/getting-started/what-is-github-pages#types-of-github-pages-sites/).

For example, if the custom domain for your user site is `www.octocat.com`, and you have a project site with no custom domain configured that is published from a repository called `octo-project`, the GitHub Pages site for that repository will be available at `www.octocat.com/octo-project`.

You can override the default custom domain by adding a custom domain to the individual repository.

> [!NOTE]
> The URLs for project sites that are privately published are not affected by the custom domain for your user or organization site. For more information about privately published sites, see [enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site) in the GitHub Enterprise Cloud documentation..
To remove the default custom domain, you must remove the custom domain from your user or organization site.

## Using a subdomain for your GitHub Pages site

A subdomain is the part of a URL before the root domain. You can configure your subdomain as `www` or as a distinct section of your site, like `blog.example.com`.

Subdomains are configured with a `CNAME` record through your DNS provider. For more information, see [Custom Domains: managing-a-custom-domain-for-your-github-pages-site#configuring-a-subdomain](/docs/github-pages/custom-domains/managing-a-custom-domain-for-your-github-pages-site#configuring-a-subdomain/).

### `www` subdomains

A `www` subdomain is the most commonly used type of subdomain. For example, `www.example.com` includes a `www` subdomain.

`www` subdomains are the most stable type of custom domain because `www` subdomains are not affected by changes to the IP addresses of GitHub's servers.

### Custom subdomains

A custom subdomain is a type of subdomain that doesn't use the standard `www` variant. Custom subdomains are mostly used when you want two distinct sections of your site. For example, you can create a site called `blog.example.com` and customize that section independently from `www.example.com`.

## Using an apex domain for your GitHub Pages site

An apex domain is a custom domain that does not contain a subdomain, such as `example.com`. Apex domains are also known as base, bare, naked, root apex, or zone apex domains.

An apex domain is configured with an `A`, `ALIAS`, or `ANAME` record through your DNS provider. For more information, see [Custom Domains: managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain](/docs/github-pages/custom-domains/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain/).

<!-- See official GitHub docs for full instructions --> For more information, see [Custom Domains: managing-a-custom-domain-for-your-github-pages-site#configuring-a-subdomain](/docs/github-pages/custom-domains/managing-a-custom-domain-for-your-github-pages-site#configuring-a-subdomain/).

## Securing the custom domain for your GitHub Pages site

<!-- See official GitHub docs for full instructions --> For more information, see [Custom Domains: verifying-your-custom-domain-for-github-pages](/docs/github-pages/custom-domains/verifying-your-custom-domain-for-github-pages/) and [Custom Domains: managing-a-custom-domain-for-your-github-pages-site](/docs/github-pages/custom-domains/managing-a-custom-domain-for-your-github-pages-site/).

There are a couple of reasons your site might be automatically disabled.

* If you downgrade from GitHub Pro to GitHub Free, any GitHub Pages sites that are currently published from private repositories in your account will be unpublished. For more information, see [billing/managing-the-plan-for-your-github-account/downgrading-your-accounts-plan](https://docs.github.com/en/billing/managing-the-plan-for-your-github-account/downgrading-your-accounts-plan).
* If you transfer a private repository to a personal account that is using GitHub Free, the repository will lose access to the GitHub Pages feature, and the currently published GitHub Pages site will be unpublished. For more information, see [repositories/creating-and-managing-repositories/transferring-a-repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository).

## Further reading

* [Custom Domains: troubleshooting-custom-domains-and-github-pages](/docs/github-pages/custom-domains/troubleshooting-custom-domains-and-github-pages/)

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

