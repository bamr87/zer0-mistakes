---
title: "Troubleshooting custom domains and GitHub Pages"
description: "You can check for common errors to resolve issues with custom domains or HTTPS for your GitHub Pages site."
layout: default
categories:
    - docs
    - github-pages
    - custom-domains
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/custom-domains/troubleshooting-custom-domains-and-github-pages/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---

## CNAME errors

If you are publishing from a custom GitHub Actions workflow, any CNAME file is ignored and is not required.

If you are publishing from a branch, custom domains are stored in a CNAME file in the root of your publishing source. You can add or update this file through your repository settings or manually. For more information, see [Custom Domains: managing-a-custom-domain-for-your-github-pages-site](/docs/github-pages/custom-domains/managing-a-custom-domain-for-your-github-pages-site/).

For your site to render at the correct domain, make sure your CNAME file still exists in the repository. For example, many static site generators force push to your repository, which can overwrite the CNAME file that was added to your repository when you configured your custom domain. If you build your site locally and push generated files to GitHub, make sure to pull the commit that added the CNAME file to your local repository first, so the file will be included in the build.

Then, make sure the CNAME file is formatted correctly.

* The CNAME filename must be all uppercase.
* The CNAME file can contain only one domain. To point multiple domains to your site, you must set up a redirect through your DNS provider.
* The CNAME file must contain the domain name only. For example, `www.example.com`, `blog.example.com`, or `example.com`.
* The domain name must be unique across all GitHub Pages sites. For example, if another repository's CNAME file contains `example.com`, you cannot use `example.com` in the CNAME file for your repository.

## DNS misconfiguration

If you have trouble pointing the default domain for your site to your custom domain, contact your DNS provider.

You can also use one of the following methods to test whether your custom domain's DNS records are configured correctly:

* A CLI tool such as `dig`. For more information, see [Custom Domains: managing-a-custom-domain-for-your-github-pages-site](/docs/github-pages/custom-domains/managing-a-custom-domain-for-your-github-pages-site/).
* An online DNS lookup tool.

## Custom domain names that are unsupported

If your custom domain is unsupported, you may need to change your domain to a supported domain. You can also contact your DNS provider to see if they offer forwarding services for domain names.

Make sure your site does not:
* Use more than one apex domain. For example, both `example.com` and `anotherexample.com`.
* Use more than one `www` subdomain. For example, both `www.example.com` and `www.anotherexample.com`.
* Use both an apex domain and custom subdomain. For example, both `example.com` and `docs.example.com`.

  The one exception is the `www` subdomain. If configured correctly, the `www` subdomain is automatically redirected to the apex domain. For more information, see [Custom Domains: managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain](/docs/github-pages/custom-domains/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain/).

<!-- See official GitHub docs for full instructions -->

For a list of supported custom domains, see [Custom Domains: about-custom-domains-and-github-pages#supported-custom-domains](/docs/github-pages/custom-domains/about-custom-domains-and-github-pages#supported-custom-domains/).

## HTTPS errors

GitHub Pages sites using custom domains that are correctly configured with `CNAME`, `ALIAS`, `ANAME`, or `A` DNS records can be accessed over HTTPS. For more information, see [Getting Started: securing-your-github-pages-site-with-https](/docs/github-pages/getting-started/securing-your-github-pages-site-with-https/).

It can take up to an hour for your site to become available over HTTPS after you configure your custom domain. After you update existing DNS settings, you may need to remove and re-add your custom domain to your site's repository to trigger the process of enabling HTTPS. For more information, see [Custom Domains: managing-a-custom-domain-for-your-github-pages-site](/docs/github-pages/custom-domains/managing-a-custom-domain-for-your-github-pages-site/).

If you're using Certification Authority Authorization (CAA) records, at least one CAA record must exist with the value `letsencrypt.org` for your site to be accessible over HTTPS. For more information, see [Certificate Authority Authorization (CAA)](https://letsencrypt.org/docs/caa/) in the Let's Encrypt documentation.

## URL formatting on Linux

If the URL for your site contains a username or organization name that begins or ends with a dash, or contains consecutive dashes, people browsing with Linux will receive a server error when they attempt to visit your site. To fix this, change your GitHub username to remove non-alphanumeric characters. For more information, see [account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-personal-account-settings/changing-your-github-username](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-personal-account-settings/changing-your-github-username).

## Browser cache

If you've recently changed or removed your custom domain and can't access the new URL in your browser, you may need to clear your browser's cache to reach the new URL. For more information on clearing your cache, see your browser's documentation.

## Domain name taken

If you're trying to use a custom domain and it says the domain is already in use, you can make the domain available for your own use by verifying it first. For more information, see [Custom Domains: verifying-your-custom-domain-for-github-pages](/docs/github-pages/custom-domains/verifying-your-custom-domain-for-github-pages/).

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

