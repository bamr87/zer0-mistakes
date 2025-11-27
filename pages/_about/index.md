---
title: About
description: This page provides information about the site, its purpose, and the principles guiding its development.
excerpt: This page provides information about the site, its configuration, and the variables guiding its development.
layout: default
sidebar:
  nav: dynamic
categories:
  - about
tags:
  - about
  - site-info
draft: published
date: 2024-05-31T01:35:49.414Z
lastmod: 2025-11-16T14:41:40.537Z
permalink: /about/
slug: about
collection: about
order: 1
---

{{ site.description }}

## Quick Facts

This world was created by {{ site.founder }} and maintained by:

{:table .table .table-striped}
Name | Profile
---------|----------
{% for follower in site.maintainers -%}
{{ follower.name }} | {{ follower.profile }}
{% endfor %}

And, most importantly, Powered By:

{:table .table .table-striped}
Name | Link
---------|----------
{% for power in site.powered_by -%}
{{ power.name }} | {{ power.url }}
{% endfor %}

## Contact Information

If you have any questions, comments, or suggestions, please feel free to reach out to us at:

- Email: {{ site.email }}
