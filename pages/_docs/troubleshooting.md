---
title: Troubleshooting
description: Common setup and build issues when running Zer0-Mistakes.
layout: default
categories:
    - docs
    - troubleshooting
tags:
    - troubleshooting
    - jekyll
    - docker
permalink: /docs/troubleshooting/
difficulty: beginner
estimated_time: 10 minutes
prerequisites: []
updated: 2025-12-20
lastmod: 2025-12-20T22:15:46.061Z
---

# Troubleshooting

## Configuration problems

- Try a clean rebuild: `docker-compose down -v && docker-compose up --build`
- Check logs: `docker-compose logs -f jekyll`
