---
title: "What is GitHub Pages?"
description: "You can use GitHub Pages to host a website about yourself, your organization, or your project directly from a repository on GitHub."
layout: default
categories:
    - docs
    - github-pages
    - getting-started
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/getting-started/what-is-github-pages/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/what-is-github-pages.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---

## About GitHub Pages

GitHub Pages is a static site hosting service that takes HTML, CSS, and JavaScript files straight from a repository on GitHub, optionally runs the files through a build process, and publishes a website. You can see examples of GitHub Pages sites in the [GitHub Pages examples collection](https://github.com/collections/github-pages-examples).

## Types of GitHub Pages sites

There are two types of GitHub Pages sites. Sites associated with a user or organization account, and sites for a specific project.

<table>
<thead>
<tr>
<th>Property</th>
<th>User and organization sites</th>
<th>Project sites</th>
</tr>
</thead>
<tbody>
<tr>
<th>Source files</th>
<td>Must be stored in a repository named <code>&lt;owner&gt;.github.io</code>, where <code>&lt;owner&gt;</code> is the personal or organization account name</td>
<td>Stored in a folder within the repository that contains the project&#39;s code</td>
</tr>
<tr>
<th>Limits</th>
<td>Maximum of one pages site per account</td>
<td>Maximum of one pages site per repository</td>
</tr>
<tr>
<th>Default site location</th>
<td><code>http(s)://&lt;owner&gt;.github.io</code></td>
<td><code>http(s)://&lt;owner&gt;.github.io/&lt;repositoryname&gt;</code></td>
</tr>
<tr>
<th>Default site location with subdomain isolation enabled</th>
<td><code>http(s)://pages.&lt;hostname&gt;/&lt;owner&gt;</code></td>
<td><code>http(s)://pages.&lt;hostname&gt;/&lt;owner&gt;/&lt;repository&gt;/</code></td>
</tr>
<tr>
<th>Default site location with subdomain isolation disabled</th>
<td><code>http(s)://&lt;hostname&gt;/pages/&lt;username&gt;</code></td>
<td><code>http(s)://&lt;hostname&gt;/pages/&lt;owner&gt;/&lt;repository&gt;/</code></td>
</tr>
</tbody>
</table>

If you publish your site privately, the URL for your site will be different. For more information, see [Getting Started: changing-the-visibility-of-your-github-pages-site](/docs/github-pages/getting-started/changing-the-visibility-of-your-github-pages-site/).

{% ifversion ghes %}
For more information, see [admin/configuration/configuring-network-settings/enabling-subdomain-isolation](https://docs.github.com/en/admin/configuration/configuring-network-settings/enabling-subdomain-isolation) or contact your site administrator.


### Hosting on your own custom domain

You can host your site on GitHub's `github.io` domain or your own custom domain. See [configuring-a-custom-domain-for-your-github-pages-site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).



## Data collection

When a GitHub Pages site is visited, the visitor's IP address is logged and stored for security purposes, regardless of whether the visitor has signed into GitHub or not. For more information about GitHub's security practices, see [GitHub Privacy Statement](/site-policy/privacy-policies/github-privacy-statement).

## Further reading

* [GitHub Pages](https://github.com/skills/github-pages) on GitHub Skills
* [rest/repos#pages](https://docs.github.com/en/rest/repos#pages)
* [Getting Started: configuring-a-publishing-source-for-your-github-pages-site](/docs/github-pages/getting-started/configuring-a-publishing-source-for-your-github-pages-site/)
 * [Custom Domains: about-custom-domains-and-github-pages#using-a-custom-domain-across-multiple-repositories](/docs/github-pages/custom-domains/about-custom-domains-and-github-pages#using-a-custom-domain-across-multiple-repositories/) 

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/what-is-github-pages.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

