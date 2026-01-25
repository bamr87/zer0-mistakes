---
title: Security Scanning
description: Guide to CodeQL security scanning and security best practices for the Zer0-Mistakes theme.
layout: default
categories:
    - docs
    - development
tags:
    - security
    - codeql
    - vulnerability
    - scanning
permalink: /docs/development/security/
difficulty: intermediate
estimated_time: 10 minutes
prerequisites:
    - GitHub repository access
sidebar:
    nav: docs
---

# Security Scanning

The Zer0-Mistakes theme uses GitHub CodeQL for automated security vulnerability scanning across multiple languages.

## CodeQL Overview

[CodeQL](https://codeql.github.com/) is GitHub's semantic code analysis engine that finds security vulnerabilities in your codebase.

### Languages Scanned

| Language | Build Mode | Coverage |
|----------|------------|----------|
| Ruby | None (interpreted) | Gem code, plugins |
| JavaScript/TypeScript | None | Frontend assets |
| Python | None | Scripts, utilities |
| GitHub Actions | None | Workflow files |

## Workflow Configuration

### Triggers

CodeQL analysis runs:

- On every **push** to `main`
- On every **pull request** to `main`
- **Weekly** (Sunday at 1:37 AM UTC)

### Workflow File

```yaml
name: "CodeQL Advanced"

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
  schedule:
    - cron: '37 1 * * 0'

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      packages: read
      actions: read
      contents: read
    
    strategy:
      matrix:
        include:
        - language: javascript-typescript
        - language: ruby
        - language: python
        - language: actions
```

## Viewing Results

### GitHub Security Tab

1. Go to repository **Security** tab
2. Click **Code scanning alerts**
3. Review vulnerabilities by severity

### Alert Severity Levels

| Level | Action Required |
|-------|-----------------|
| **Critical** | Fix immediately |
| **High** | Fix before next release |
| **Medium** | Fix in upcoming sprint |
| **Low** | Track and fix when possible |

## Common Vulnerability Types

### Ruby

- SQL injection
- Command injection
- Path traversal
- Unsafe deserialization

### JavaScript

- Cross-site scripting (XSS)
- Prototype pollution
- Insecure randomness
- DOM manipulation issues

### GitHub Actions

- Script injection
- Credential exposure
- Unsafe checkout

## Fixing Vulnerabilities

### Example: SQL Injection

**Vulnerable code:**

```ruby
# BAD: User input directly in query
User.where("name = '#{params[:name]}'")
```

**Fixed code:**

```ruby
# GOOD: Parameterized query
User.where(name: params[:name])
```

### Example: XSS Prevention

**Vulnerable code:**

```javascript
// BAD: Direct HTML insertion
element.innerHTML = userInput;
```

**Fixed code:**

```javascript
// GOOD: Text content only
element.textContent = userInput;
```

## Security Best Practices

### Dependency Management

```bash
# Audit Ruby dependencies
bundle audit check --update

# Update dependencies
bundle update
```

### Secret Management

- Never commit secrets to the repository
- Use GitHub Secrets for sensitive values
- Rotate credentials regularly

### Input Validation

- Validate all user inputs
- Sanitize data before output
- Use allow-lists over deny-lists

## Custom Queries

You can add custom CodeQL queries for project-specific checks:

```yaml
- name: Initialize CodeQL
  uses: github/codeql-action/init@v4
  with:
    languages: ${{ matrix.language }}
    queries: security-extended,security-and-quality
```

## Dismissing Alerts

To dismiss a false positive:

1. Go to the alert in Security tab
2. Click **Dismiss alert**
3. Select reason:
   - Won't fix
   - False positive
   - Used in tests

## Troubleshooting

### Analysis Timeout

For large codebases:

1. Use larger runners
2. Exclude non-essential directories
3. Split analysis by language

### Build Failures

If manual build is required:

```yaml
- name: Run manual build steps
  if: matrix.build-mode == 'manual'
  run: |
    bundle install
    bundle exec jekyll build
```

## Security Response

### Reporting Vulnerabilities

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Email security concerns privately
3. Follow responsible disclosure

### Security Advisories

For critical issues:

1. Create a [Security Advisory](https://docs.github.com/en/code-security/security-advisories)
2. Request a CVE if needed
3. Publish fix and advisory together

## Related

- [Testing Guide](/docs/development/testing/)
- [CI/CD Pipeline](/docs/development/ci-cd/)
- [Dependency Updates](/docs/development/dependency-updates/)
