---
title: "Copilot Agent Prompt Button"
description: "Implementation guide for the Copilot Agent dropdown button in the intro section"
date: 2026-04-01
version: "1.0.0"
features:
  - Prompt-driven GitHub issue creation
  - Per-page context injection
  - Environment metadata capture
  - Data-driven prompt registry
---

# Copilot Agent Prompt Button

**Files Changed**:
- `_includes/content/intro.html` — action button group
- `_data/prompts.yml` — prompt registry

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Files Reference](#files-reference)
4. [Configuration](#configuration)
5. [Prompt Registry — `_data/prompts.yml`](#prompt-registry)
6. [Adding a New Prompt](#adding-a-new-prompt)
7. [Issue Body Structure](#issue-body-structure)
8. [Customization](#customization)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Overview

The **Copilot Agent** button appears in the intro section of every page and lets users instantly open a pre-filled GitHub issue assigned to `@copilot`. A dropdown lists available prompt templates (e.g., *Debugging*, *Documentation*, *Article Review*). When a template is selected, the issue body is automatically populated with:

- The full prompt instruction text
- A **Page Context** table (title, URL, file path, branch, layout, tags, etc.)
- An **Environment** table (repository, site URL, Jekyll environment, theme, baseurl)

This gives a Copilot agent immediately actionable context without the user having to fill anything in manually.

**Flow:**

```
User clicks "Copilot Agent" dropdown
  → selects a prompt template
    → browser opens GitHub new-issue URL
      → issue pre-filled with prompt + page/environment metadata
        → @copilot is assigned automatically
```

---

## Architecture

```
_data/
└── prompts.yml              ← source of truth for all prompt templates

_includes/
└── content/
    └── intro.html           ← renders the action button group
        ├── Share dropdown
        ├── Copilot Agent dropdown  ← iterates site.data.prompts
        └── Edit on GitHub button
```

The button group is injected into every page that includes `content/intro.html`, which is called from `_layouts/default.html`:

```liquid
{% include content/intro.html %}
```

---

## Files Reference

### `_includes/content/intro.html`

Liquid variables set before the button group:

| Variable | Source | Description |
|---|---|---|
| `repo_branch` | `site.branch \| default: "main"` | Current repo branch |
| `file_path` | `page_dir + "/" + page.path` | Relative file path from repo root |
| `repo_owner` | `site.repository` split on `/` | GitHub username/org |

The dropdown iterates `site.data.prompts` and for each entry builds two Liquid `{% capture %}` blocks:

| Capture | Content |
|---|---|
| `issue_title` | `[prompt.label] page.title` |
| `issue_body` | `prompt.body` + Page Context table + Environment table |

Both are `url_encode`d and passed as query parameters to `https://github.com/{repository}/issues/new`.

### `_data/prompts.yml`

A YAML array. Each entry:

```yaml
- id: string            # unique slug, matches .github/prompts/{id}.prompt.md
  label: string         # display label in dropdown
  icon: string          # Bootstrap Icons class (e.g. "bi-bug")
  group: string         # optional section header in the dropdown
                        # (e.g. "Page Improvements", "Site Improvements")
  description: string   # short subtitle shown under the label
  body: |               # multi-line prompt instruction text (YAML block scalar)
    ...
```

When `group` is present, `intro.html` renders a Bootstrap `dropdown-header`
the first time a new group value is seen, and an `dropdown-divider` between
groups. Entries without a `group` render as plain items.

---

## Configuration

No changes to `_config.yml` are required. The feature depends on:

| Config Key | Required | Used For |
|---|---|---|
| `site.repository` | Yes | Constructs the GitHub issue URL (`owner/repo`) |
| `site.url` | Yes | Included in issue body page context |
| `site.branch` | Optional | Defaults to `"main"` if absent |
| `site.baseurl` | Optional | Included in environment table |
| `site.theme` / `site.remote_theme` | Optional | Included in environment table |
| `site.author.name` | Optional | Fallback for `page.author` |

Ensure `repository` is set in `_config.yml`:

```yaml
repository: "bamr87/zer0-mistakes"
```

---

## Prompt Registry

`_data/prompts.yml` ships with 10 built-in templates, focused on
frontend / CMS work and grouped into two scopes that surface as dropdown
section headers:

### Page Improvements (act on the current page)

| ID | Label | Icon | Description |
|---|---|---|---|
| `improve-page` | Improve Page | `bi-stars` | Polish content, structure, and presentation of this page |
| `expand-page` | Expand Page | `bi-arrows-angle-expand` | Add depth, examples, and missing sections to this page |
| `update-page` | Update Page | `bi-arrow-clockwise` | Refresh outdated content, versions, links, and screenshots |
| `fix-page` | Fix Page Issue | `bi-bug` | Report a typo, broken link, layout glitch, or content bug |
| `seo-optimize` | SEO Optimize | `bi-graph-up-arrow` | Improve discoverability, metadata, and structured data |
| `accessibility-audit` | Accessibility Audit | `bi-universal-access` | Audit this page for WCAG 2.1 AA compliance |

### Site Improvements (theme-wide UI/UX, components, features)

| ID | Label | Icon | Description |
|---|---|---|---|
| `ui-ux-improvement` | UI/UX Improvement | `bi-palette` | Propose a design or UX refinement for the theme |
| `new-feature` | New Feature | `bi-lightbulb` | Propose a new site-wide feature or capability |
| `component-enhancement` | Component Enhancement | `bi-puzzle` | Improve a Jekyll layout, include, or shared component |
| `performance-optimization` | Performance Optimization | `bi-speedometer2` | Improve load time, Core Web Vitals, and asset delivery |

Every prompt body explicitly references the **Page Context** table that
`intro.html` injects below it, so the agent always knows which page the
request came from.

---

## Adding a New Prompt

1. Add an entry to `_data/prompts.yml`:

   ```yaml
   - id: security-review
     label: "Security Review"
     icon: "bi-shield-lock"
     description: "Audit code for security vulnerabilities"
     body: |
       Act as a Security Engineer and OWASP specialist.

       Audit the code or configuration in this file for security vulnerabilities.

       **Focus Areas:**
       - Input validation and sanitization
       - Authentication and authorization flaws
       - Secrets or credentials in code
       - Dependency vulnerabilities
       - OWASP Top 10 compliance

       **Deliverables:**
       - List of findings with severity (Critical / High / Medium / Low)
       - Remediation steps for each finding
       - Recommended security improvements
   ```

2. Optionally create a matching prompt file at `.github/prompts/security-review.prompt.md` for use directly in VS Code Copilot.

3. The new item appears automatically in the dropdown on next Jekyll build — no changes to any template files required.

---

## Issue Body Structure

When a user selects a prompt, the generated GitHub issue body follows this structure:

```
{prompt.body}
---

## 📄 Page Context

| Field | Value |
|---|---|
| Title    | {page.title} |
| URL      | {site.url}{page.url} |
| File     | `{file_path}` |
| Branch   | `{repo_branch}` |
| Layout   | `{page.layout}` |
| Collection | `{page.collection}` |
| Author   | {page.author} |
| Date     | {page.date} |
| Last Modified | {page.lastmod} |
| Tags     | {page.tags} |
| Categories | {page.categories} |

## 🔧 Environment

| Field | Value |
|---|---|
| Repository | `{site.repository}` |
| Site URL   | {site.url} |
| Jekyll Env | `{jekyll.environment}` |
| Theme      | `{site.theme or site.remote_theme}` |
| Base URL   | `{site.baseurl}` |
```

The issue is also pre-configured with:
- **Assignee**: `copilot`
- **Label**: `ai-agent`
- **Title**: `[{Prompt Label}] {Page Title}`

---

## Customization

### Change the issue label

Edit the `labels=` parameter in `intro.html`:

```liquid
href="https://github.com/{{ site.repository }}/issues/new?assignees=copilot&labels=ai-agent&title=..."
```

Replace `ai-agent` with any label name that exists in your repository. Multiple labels are comma-separated and URL-encoded.

### Add more context fields to the issue body

In `intro.html`, extend the Page Context table inside the `{% capture issue_body %}` block:

```liquid
| **Permalink** | `{{ page.permalink }}` |
| **Excerpt** | {{ page.excerpt | strip_html | truncate: 100 }} |
```

### Show/hide the description subtitle

The `description` field under each dropdown label is optional. Remove the `{% if prompt.description %}` block in `intro.html` to hide it, or simply omit `description` from entries in `prompts.yml`.

### Restrict the button to specific layouts or collections

Wrap the dropdown `<div>` in a Liquid condition:

```liquid
{% if page.collection == "posts" or page.layout == "journals" %}
  <!-- Copilot Agent Prompt Dropdown -->
  ...
{% endif %}
```

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Dropdown is empty | `_data/prompts.yml` missing or invalid YAML | Validate YAML with `ruby -ryaml -e "YAML.load_file('_data/prompts.yml')"` |
| Issue URL is too long / truncated | GitHub's URL limit (~8000 chars) exceeded | Shorten `body` fields in `prompts.yml` |
| `[object Object]` in issue title | `page.title` is not a string | Ensure page has a `title:` string in front matter |
| Labels not applied | Label `ai-agent` doesn't exist in the repo | Create the label in GitHub → Issues → Labels |
| `repo_owner` is blank | `site.repository` not set in `_config.yml` | Add `repository: "owner/repo"` to `_config.yml` |
| Branch shows `master` | `site.branch` not set | Add `branch: "main"` to `_config.yml` or rely on the `default: "main"` fallback |

---

## FAQ

**Q: Does this send any data to GitHub automatically?**
No. The button opens a browser URL. The user sees the pre-filled issue form and must click "Submit new issue" themselves.

**Q: Can I assign the issue to someone other than `@copilot`?**
Yes. Change `assignees=copilot` in the `href` to any GitHub username, or leave it blank to let the user assign manually.

**Q: Will this work on GitHub Pages?**
Yes. All rendering happens in Jekyll at build time via Liquid. There is no JavaScript involved in building the URL.

**Q: What if a prompt body is very long?**
GitHub's `body` query parameter has a practical limit (~8000 characters). Keep individual `body` values in `prompts.yml` under ~5000 characters to leave room for the context tables.

**Q: Can I use this in the `it-journey` site?**
Yes. Copy `_data/prompts.yml` to the target repo and merge the Copilot Agent dropdown block from `_includes/content/intro.html`. Since `it-journey` uses `zer0-mistakes` as a remote theme, creating a local override at `_includes/content/intro.html` (as demonstrated in PR #198) is the recommended approach.
