---
title: "GitHub Pages limits"
description: "Learn about the limits and limitations of GitHub Pages."
layout: default
categories:
    - docs
    - github-pages
    - getting-started
tags:
    - github-pages
    - documentation
    - reference
permalink: /docs/github-pages/getting-started/github-pages-limits/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/github-pages-limits.md"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---

## Usage limits

GitHub Pages is not intended for or allowed to be used as a free web-hosting service to run your online business, e-commerce site, or any other website that is primarily directed at either facilitating commercial transactions or providing commercial software as a service (SaaS). <!-- See official GitHub docs for full instructions -->

In addition, your use of GitHub Pages is subject to the [GitHub Terms of Service](/free-pro-team@latest/site-policy/github-terms/github-terms-of-service), including the restrictions on get-rich-quick schemes, sexually obscene content, and violent or threatening content or activity.

GitHub Pages sites are subject to the following usage limits:

* You can only create one user or organization site for each account on GitHub.
* GitHub Pages source repositories have a recommended limit of 1 GB. For more information, see [repositories/working-with-files/managing-large-files/about-large-files-on-github#file-and-repository-size-limitations](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github#file-and-repository-size-limitations).
* Published GitHub Pages sites may be no larger than 1 GB.
* GitHub Pages deployments will timeout if they take longer than 10 minutes.
* GitHub Pages sites have a _soft_ bandwidth limit of 100 GB per month.
* GitHub Pages sites have a _soft_ limit of 10 builds per hour. This limit does not apply if you build and publish your site with a custom GitHub Actions workflow.
* In order to provide consistent quality of service for all GitHub Pages sites, rate limits may apply. These rate limits are not intended to interfere with legitimate uses of GitHub Pages. If your request triggers rate limiting, you will receive an appropriate response with an HTTP status code of `429`, along with an informative HTML body.

If your site exceeds these usage quotas, we may not be able to serve your site, or you may receive a polite email from  suggesting strategies for reducing your site's impact on our servers, including putting a third-party content distribution network (CDN) in front of your site, making use of other GitHub features such as releases, or moving to a different hosting service that might better fit your needs.



## Limits for Enterprise Managed Users

If you're a , your use of GitHub Pages is limited.

* GitHub Pages sites can only be published from repositories owned by organizations.
* GitHub Pages sites are always privately published, and you cannot change this visibility. For more information, see [Getting Started: changing-the-visibility-of-your-github-pages-site](/docs/github-pages/getting-started/changing-the-visibility-of-your-github-pages-site/).
* You cannot create an organization site (a site published from a repository named `<organization>.github.io`)

For more information about Enterprise Managed Users, see [admin/identity-and-access-management/using-enterprise-managed-users-for-iam/about-enterprise-managed-users](https://docs.github.com/en/admin/identity-and-access-management/using-enterprise-managed-users-for-iam/about-enterprise-managed-users).


## Educational exercises

Using GitHub Pages to create a copy of an existing website as a learning exercise is not prohibited. However, in addition to complying with the [GitHub Terms of Service](/free-pro-team@latest/site-policy/github-terms/github-terms-of-service), you must write the code yourself, the site must not collect any user data, and you must include a prominent disclaimer on the site indicating that the project is not associated with the original and was only created for educational purposes.

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/github-pages-limits.md), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

