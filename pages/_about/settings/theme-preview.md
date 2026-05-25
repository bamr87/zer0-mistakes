---
title: Theme Preview
layout: admin
icon: bi-easel
permalink: /about/settings/theme-preview/
excerpt: Live style guide — preview skins, color modes, and component coverage in one place.
admin_section: Theme Preview
lastmod: 2026-05-24T00:00:00.000Z
admin_actions:
  - label: Theme Customizer
    url: /about/settings/theme/
    icon: bi-palette
    style: btn-outline-primary
---

{% include components/theme-controls-bar.html show_status=true %}

<div class="row g-4">
  <div class="col-lg-9">
    {% include components/theme-preview-gallery.html %}
  </div>
  <div class="col-lg-3">
    <div class="position-sticky" style="top: 5rem;">
      <nav class="nav nav-pills flex-column small theme-preview-toc mb-3" aria-label="Preview sections">
        <a class="nav-link" href="#preview-typography">Typography</a>
        <a class="nav-link" href="#preview-buttons">Buttons</a>
        <a class="nav-link" href="#preview-alerts">Alerts</a>
        <a class="nav-link" href="#preview-cards">Cards</a>
        <a class="nav-link" href="#preview-forms">Forms</a>
        <a class="nav-link" href="#preview-tabs">Nav tabs</a>
        <a class="nav-link" href="#preview-badges">Badges</a>
        <a class="nav-link" href="#preview-code">Code</a>
        <a class="nav-link" href="#preview-links">Links</a>
        <a class="nav-link" href="#preview-navbar">Navbar</a>
        <a class="nav-link" href="#preview-footer">Footer</a>
        <a class="nav-link" href="#preview-table">Table</a>
        <a class="nav-link" href="#preview-list-group">List group</a>
        <a class="nav-link" href="#preview-backgrounds">Backgrounds</a>
      </nav>

      <div class="card border">
        <div class="card-header py-2 small fw-semibold">
          <i class="bi bi-sliders me-1"></i> Override demo
        </div>
        <div class="card-body small">
          <p class="text-body-secondary mb-2">
            Same controls as the Settings → Appearance panel. Overrides
            <code>--zer0-color-primary</code> on top of the active skin.
          </p>
          <div data-appearance-panel-host></div>
        </div>
      </div>

      <div class="alert alert-info small mt-3 mb-0">
        <i class="bi bi-info-circle me-1"></i>
        Skin preview is page-level. Export permanent changes from
        <a href="{{ '/about/settings/theme/' | relative_url }}">Theme Customizer</a>.
      </div>
    </div>
  </div>
</div>

<script src="{{ '/assets/js/theme-customizer.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/theme-preview.js' | relative_url }}" defer></script>
