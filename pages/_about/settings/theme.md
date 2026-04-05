---
title: Theme Customizer
layout: admin
icon: bi-palette
permalink: /about/settings/theme/
excerpt: Preview theme skins, customize colors, and generate YAML configuration.
lastmod: 2026-04-04T00:00:00.000Z
---

<ul class="nav nav-tabs" id="themeTabs" role="tablist">
  <li class="nav-item" role="presentation">
    <button class="nav-link active" id="tab-skins" data-bs-toggle="tab" data-bs-target="#pane-skins" type="button" role="tab" aria-controls="pane-skins" aria-selected="true">
      <i class="bi bi-brush me-1"></i>Skin Preview
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab-colors" data-bs-toggle="tab" data-bs-target="#pane-colors" type="button" role="tab" aria-controls="pane-colors" aria-selected="false">
      <i class="bi bi-palette2 me-1"></i>Color Editor
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab-export" data-bs-toggle="tab" data-bs-target="#pane-export" type="button" role="tab" aria-controls="pane-export" aria-selected="false">
      <i class="bi bi-download me-1"></i>Export YAML
    </button>
  </li>
</ul>

<div class="tab-content pt-4" id="themeTabContent">

  <!-- ═══════ Skin Preview Tab ═══════ -->
  <div class="tab-pane fade show active" id="pane-skins" role="tabpanel">
    {% include components/theme-customizer.html %}
  </div>

  <!-- ═══════ Color Editor Tab ═══════ -->
  <div class="tab-pane fade" id="pane-colors" role="tabpanel">

    <p class="text-body-secondary mb-3">Edit theme color values below. Changes are reflected in the YAML export tab.</p>

    <div class="row g-3" id="color-editor-fields">
      {% for color in site.theme_color %}
        <div class="col-6 col-md-4 col-lg-3">
          <label class="form-label small fw-semibold" for="color-{{ color[0] }}">{{ color[0] | replace: '_', ' ' | capitalize }}</label>
          <div class="input-group input-group-sm">
            <input type="color" class="form-control form-control-color" id="color-{{ color[0] }}" value="{{ color[1] }}" data-color-key="{{ color[0] }}">
            <input type="text" class="form-control form-control-sm font-monospace" value="{{ color[1] }}" data-color-text="{{ color[0] }}" readonly>
          </div>
        </div>
      {% endfor %}
    </div>

  </div>

  <!-- ═══════ Export YAML Tab ═══════ -->
  <div class="tab-pane fade" id="pane-export" role="tabpanel">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0"><i class="bi bi-filetype-yml me-1"></i> Theme Configuration YAML</h5>
      <div>
        <button class="btn btn-sm btn-outline-primary" id="theme-copy-yaml" title="Copy YAML">
          <i class="bi bi-clipboard me-1"></i> Copy
        </button>
        <button class="btn btn-sm btn-outline-secondary ms-1" id="theme-download-yaml" title="Download YAML">
          <i class="bi bi-download me-1"></i> Download
        </button>
      </div>
    </div>
    <pre class="bg-dark text-light p-3 rounded" style="max-height:500px;overflow:auto;font-size:.85rem"><code id="theme-yaml-output">Loading...</code></pre>
  </div>

</div>

<script src="{{ '/assets/js/theme-customizer.js' | relative_url }}" defer></script>
