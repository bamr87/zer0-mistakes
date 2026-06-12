---
lastmod: 2026-05-05T00:00:00.000Z
title: Admin Layout & Configuration Dashboards
description: Admin-style layout and dashboard partials for surfacing site configuration, build info, and feature flags in a single place.
preview: /images/previews/admin-layout-configuration-dashboards.png
layout: default
categories:
  - docs
  - features
tags:
  - admin
  - dashboard
  - ui
  - configuration
permalink: /docs/features/admin-dashboard/
difficulty: intermediate
estimated_reading_time: 8 minutes
sidebar:
  nav: docs
---

# Admin Layout & Configuration Dashboards

The zer0-mistakes theme ships an `admin` layout and a set of dashboard partials for surfacing site configuration, build metadata, and feature flags — all in one place, without requiring a CMS or backend.

## Admin Layout

Any page can use the admin layout by setting `layout: admin` in its frontmatter:

```yaml
---
layout: admin
title: Site Configuration
icon: bi-gear
---
```

### Supported Frontmatter

| Field | Type | Description |
|---|---|---|
| `icon` | string | Bootstrap Icons class shown in the page header (e.g. `bi-gear`) |
| `admin_nav` | boolean | Show the admin sidebar (default: `true`) |
| `admin_section` | string | Active section key for sidebar highlighting |
| `admin_actions` | array | Header action buttons (`label`, `url`, `icon`, `style`) |

### Layout Structure

```text
Admin page
├── Admin header  (breadcrumbs + icon + title + action buttons)
├── Admin sidebar (collapsible; collapses to offcanvas on mobile)
└── Main content  (page body, tab panels, data tables, …)
```

## Admin Navigation

A dedicated sidebar navigation partial is included automatically with the admin layout:

```text
_includes/navigation/admin-nav.html
```

It renders a vertical nav with links to all admin/settings pages.

## Tabbed Admin Pages

Use the `admin-tabs` component to split a single admin page into tabs:

```liquid
{% raw %}{% include components/admin-tabs.html
   id="config"
   tabs="view:View Config:bi-eye:true|edit:Edit & Export:bi-pencil-square:false|raw:Raw YAML:bi-file-earmark-code:false"
%}
<div class="tab-content pt-4" id="configTabContent">
  <div class="tab-pane fade show active" id="pane-view" role="tabpanel">
    <!-- your content -->
  </div>
</div>{% endraw %}
```

Each tab definition is `id:label:icon:active`, pipe-separated.

## Built-In Admin Pages

The theme ships several admin pages under `pages/_about/settings/`:

| Page | Permalink | Purpose |
|---|---|---|
| `config.md` | `/about/settings/config/` | View and export `_config.yml` |
| `theme.md` | `/about/settings/theme/` | Theme colours and Bootstrap overrides |
| `navigation.md` | `/about/settings/navigation/` | Edit navigation data |
| `analytics.md` | `/about/settings/analytics/` | Analytics provider settings |
| `collections.md` | `/about/settings/collections/` | Collection configuration |
| `environment.md` | `/about/settings/environment/` | Build environment info |

## Creating a Custom Admin Page

```markdown
---
layout: admin
title: My Dashboard
description: Custom dashboard for my site
preview: /images/previews/admin-layout-configuration-dashboards.png
icon: bi-speedometer2
permalink: /admin/my-dashboard/
sidebar:
  nav: docs
---

# My Dashboard

Add your content here. Use Bootstrap 5 components freely.
```

## Related

- [Dynamic Navigation](/docs/features/dynamic-navigation/)
- [Theme Configuration](/docs/customization/)

## See also

- [[Features]]
- [[Customization]]
