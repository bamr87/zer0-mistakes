---
title: Navigation Editor
layout: admin
icon: bi-signpost-2
permalink: /about/settings/navigation/
excerpt: View and export navigation menu structures.
lastmod: 2026-04-04T00:00:00.000Z
draft: draft
---

<ul class="nav nav-tabs" id="navTabs" role="tablist">
  <li class="nav-item" role="presentation">
    <button class="nav-link active" id="tab-overview" data-bs-toggle="tab" data-bs-target="#pane-overview" type="button" role="tab" aria-controls="pane-overview" aria-selected="true">
      <i class="bi bi-diagram-3 me-1"></i>Overview
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab-editor" data-bs-toggle="tab" data-bs-target="#pane-editor" type="button" role="tab" aria-controls="pane-editor" aria-selected="false">
      <i class="bi bi-pencil-square me-1"></i>Edit Menus
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab-export" data-bs-toggle="tab" data-bs-target="#pane-export" type="button" role="tab" aria-controls="pane-export" aria-selected="false">
      <i class="bi bi-download me-1"></i>Export YAML
    </button>
  </li>
</ul>

<div class="tab-content pt-4" id="navTabContent">

  <!-- ═══════ Overview Tab ═══════ -->
  <div class="tab-pane fade show active" id="pane-overview" role="tabpanel">
    {% include components/nav-editor.html %}
  </div>

  <!-- ═══════ Editor Tab ═══════ -->
  <div class="tab-pane fade" id="pane-editor" role="tabpanel">

    <p class="text-body-secondary mb-3">Select a navigation file to edit. Changes are reflected in the Export YAML tab.</p>

    <div class="mb-3">
      <label class="form-label fw-semibold" for="nav-file-select">Navigation File</label>
      <select class="form-select" id="nav-file-select">
        <option value="main" selected>main.yml</option>
        <option value="home">home.yml</option>
        <option value="about">about.yml</option>
        <option value="docs">docs.yml</option>
        <option value="posts">posts.yml</option>
        <option value="quickstart">quickstart.yml</option>
        <option value="admin">admin.yml</option>
      </select>
    </div>

    <div id="nav-edit-form">
      <div class="alert alert-secondary small">
        <i class="bi bi-info-circle me-1"></i>
        Select a file above and use the tree view in the Overview tab to identify items, then export the full YAML from the Export tab.
      </div>
    </div>

  </div>

  <!-- ═══════ Export YAML Tab ═══════ -->
  <div class="tab-pane fade" id="pane-export" role="tabpanel">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0"><i class="bi bi-filetype-yml me-1"></i> Navigation YAML</h5>
      <button class="btn btn-sm btn-outline-primary" id="nav-copy-yaml" title="Copy YAML">
        <i class="bi bi-clipboard me-1"></i> Copy
      </button>
    </div>
    <pre class="bg-dark text-light p-3 rounded" style="max-height:500px;overflow:auto;font-size:.85rem"><code id="nav-yaml-output">Select a navigation file to view its YAML.</code></pre>
  </div>

</div>

<script src="{{ '/assets/js/nav-editor.js' | relative_url }}" defer></script>
