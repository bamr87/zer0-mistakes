---
lastmod: 2026-06-16T00:00:00.000Z
title: Testing
description: Overview of the test suite for the Zer0-Mistakes theme. See the contributor reference in docs/ for the full testing guide.
preview: /images/previews/testing.png
layout: default
categories:
    - docs
    - development
tags:
    - testing
    - ci-cd
    - quality
permalink: /docs/development/testing/
difficulty: intermediate
estimated_reading_time: 5 minutes
sidebar:
    nav: docs
---

# Testing

The Zer0-Mistakes theme includes a comprehensive test suite covering preflight validation, core functionality, deployment readiness, quality checks, and Playwright visual regression tests.

Tests run automatically via GitHub Actions on every push and pull request. The suite uses shell scripts (no RSpec dependency) so contributors can run tests locally with Docker or a native Ruby environment.

## Quick start

```bash
# Run all tests (from repo root)
./test/test_runner.sh

# Run smoke tests only
./test/test_runner.sh --scope smoke

# Run with retry on failure
./test/test_runner.sh --retry-failed
```

## Full Reference

The complete testing guide — test structure, writing new tests, coverage expectations, CI/CD integration, and Playwright setup — lives in the contributor docs:

**[Testing Guide → docs/development/testing.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/development/testing.md)**
