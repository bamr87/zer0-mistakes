---
title: "Securing your GitHub Pages site with HTTPS"
description: "HTTPS adds a layer of encryption that prevents others from snooping on or tampering with traffic to your site. You can enforce HTTPS for your GitHub Pages site "
layout: default
categories:
    - docs
    - github-pages
    - getting-started
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/getting-started/securing-your-github-pages-site-with-https/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---

People with admin permissions for a repository can enforce HTTPS for a GitHub Pages site.

## About HTTPS and GitHub Pages

All GitHub Pages sites, including sites that are correctly configured with a custom domain, support HTTPS and HTTPS enforcement. For more information about custom domains, see [Custom Domains: about-custom-domains-and-github-pages](/docs/github-pages/custom-domains/about-custom-domains-and-github-pages/) and [Custom Domains: troubleshooting-custom-domains-and-github-pages#https-errors](/docs/github-pages/custom-domains/troubleshooting-custom-domains-and-github-pages#https-errors/).

GitHub Pages sites created after June 15, 2016, and using `github.io` domains are served over HTTPS automatically.

<!-- See official GitHub docs for full instructions -->

<!-- See official GitHub docs for full instructions -->

> [!NOTE]
> RFC3280 states that the maximum length of the common name should be 64 characters. Therefore, the entire domain name of your GitHub Pages site must be less than 64 characters long for a certificate to be successfully created.

## Enforcing HTTPS for your GitHub Pages site

<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
<!-- See official GitHub docs for full instructions -->
1. Under "GitHub Pages," select **Enforce HTTPS**.

## Troubleshooting certificate provisioning ("Certificate not yet created" error)

When you set or change your custom domain in the Pages settings, an automatic DNS check begins. This check determines if your DNS settings are configured to allow GitHub to obtain a certificate automatically. If the check is successful, GitHub queues a job to request a TLS certificate from [Let's Encrypt](https://letsencrypt.org/). On receiving a valid certificate, GitHub automatically uploads it to the servers that handle TLS termination for Pages. When this process completes successfully, a check mark is displayed beside your custom domain name.

The process may take some time. If the process has not completed several minutes after you clicked **Save**, try clicking **Remove** next to your custom domain name. Retype the domain name and click **Save** again. This will cancel and restart the provisioning process.

## Resolving problems with mixed content

If you enable HTTPS for your GitHub Pages site but your site's HTML still references images, CSS, or JavaScript over HTTP, then your site is serving _mixed content_. Serving mixed content may make your site less secure and cause trouble loading assets.

To remove your site's mixed content, make sure all your assets are served over HTTPS by changing `http://` to `https://` in your site's HTML.

Assets are commonly found in the following locations:
* If your site uses Jekyll, your HTML files will probably be found in the `_layouts` folder.
* CSS is usually found in the `<head>` section of your HTML file.
* JavaScript is usually found in the `<head>` section or just before the closing `</body>` tag.
* Images are often found in the `<body>` section.

> [!TIP]
> If you can't find your assets in your site's source files, try searching your site's source files for `http://` in your text editor or on GitHub.

### Examples of assets referenced in an HTML file

| Asset type | HTTP                                      | HTTPS                             |
|:----------:|:-----------------------------------------:|:---------------------------------:|
| CSS        | `<link rel="stylesheet" href="http://example.com/css/main.css">` | `<link rel="stylesheet" href="https://example.com/css/main.css">`
| JavaScript   |  `<script type="text/javascript" src="http://example.com/js/main.js"></script>`  |   `<script type="text/javascript" src="https://example.com/js/main.js"></script>`
| Image        |  `<a href="http://www.somesite.com"><img src="http://www.example.com/logo.jpg" alt="Logo"></a>`  | `<a href="https://www.somesite.com"><img src="https://www.example.com/logo.jpg" alt="Logo"></a>`

## Verifying the DNS configuration

In some cases, a HTTPS certificate will not be able to be generated due to the DNS configuration of your custom domain. This can be caused by extra DNS records, or records not pointing to the IP addresses for GitHub Pages.

To ensure a HTTPS certificate generates correctly, we recommend the following configurations. Any additional `A`, `AAAA`, `ALIAS`, `ANAME` records with the `@` host, or `CNAME` records pointing to your `www` subdomain or other custom subdomain that you would like to use with GitHub Pages may prevent the HTTPS certificate from generating.

| Scenario | DNS record type | DNS record name | DNS record value(s) |
|---|---|---|---|
| Apex domain<br />(`example.com`) | `A` | `@` | `185.199.108.153`<br />`185.199.109.153`<br />`185.199.110.153`<br />`185.199.111.153` |
| Apex domain<br />(`example.com`) | `AAAA` | `@` | `2606:50c0:8000::153`<br />`2606:50c0:8001::153`<br />`2606:50c0:8002::153`<br />`2606:50c0:8003::153` |
| Apex domain<br />(`example.com`) | `ALIAS` or `ANAME` | `@` | `USERNAME.github.io` or<br /> `ORGANIZATION.github.io` |
| Subdomain<br />(`ww​w.example.com`,<br />`blog.example.com`) | `CNAME` | `SUBDOMAIN.example.com.` | `USERNAME.github.io` or<br /> `ORGANIZATION.github.io` |

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

