---
title: Éditeur de navigation
preview: "/images/previews/navigation-editor.png"
layout: admin
icon: bi-signpost-2
excerpt: Afficher et exporter les structures des menus de navigation.
lastmod: 2026-04-04 00:00:00.000000000 Z
lang: fr
permalink: "/fr/about/settings/navigation/"
translation_of: pages/_about/settings/navigation.md
translation_source_url: "/about/settings/navigation/"
machine_translated: true
translated_from_sha: b10d3f9a2491
---

<ul class="nav nav-tabs" id="navTabs" role="tablist">
  <li class="nav-item" role="presentation">
    <button class="nav-link active" id="tab-overview" data-bs-toggle="tab" data-bs-target="#pane-overview" type="button" role="tab" aria-controls="pane-overview" aria-selected="true">
      <i class="bi bi-diagram-3 me-1"></i>Aperçu
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab-editor" data-bs-toggle="tab" data-bs-target="#pane-editor" type="button" role="tab" aria-controls="pane-editor" aria-selected="false">
      <i class="bi bi-pencil-square me-1"></i>Modifier les menus
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab-export" data-bs-toggle="tab" data-bs-target="#pane-export" type="button" role="tab" aria-controls="pane-export" aria-selected="false">
      <i class="bi bi-download me-1"></i>Exporter le YAML
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

    <p class="text-body-secondary mb-3">Sélectionnez un fichier de navigation à modifier. Les changements sont répercutés dans l'onglet Exporter le YAML.</p>

    <div class="mb-3">
      <label class="form-label fw-semibold" for="nav-file-select">Fichier de navigation</label>
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
        Sélectionnez un fichier ci-dessus et utilisez la vue arborescente dans l'onglet Aperçu pour identifier les éléments, puis exportez le YAML complet depuis l'onglet Exporter.
      </div>
    </div>

  </div>

  <!-- ═══════ Export YAML Tab ═══════ -->
  <div class="tab-pane fade" id="pane-export" role="tabpanel">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0"><i class="bi bi-filetype-yml me-1"></i> YAML de navigation</h5>
      <button class="btn btn-sm btn-outline-primary" id="nav-copy-yaml" title="Copy YAML">
        <i class="bi bi-clipboard me-1"></i> Copier
      </button>
    </div>
    <pre class="bg-dark text-light p-3 rounded" style="max-height:500px;overflow:auto;font-size:.85rem"><code id="nav-yaml-output">Sélectionnez un fichier de navigation pour afficher son YAML.</code></pre>
  </div>

</div>

<script src="{{ '/assets/js/nav-editor.js' | relative_url }}" defer></script>
