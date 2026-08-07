---
title: Personnalisateur de thème
preview: "/images/previews/theme-customizer.png"
layout: admin
icon: bi-palette
excerpt: Prévisualisez les skins du thème, générez des palettes, personnalisez les
  variables CSS et exportez la configuration YAML.
lastmod: 2026-04-05 00:00:00.000000000 Z
lang: fr
permalink: "/fr/about/settings/theme/"
translation_of: pages/_about/settings/theme.md
translation_source_url: "/about/settings/theme/"
machine_translated: true
translated_from_sha: 227959a1fb26
---

<!-- chroma.js — color manipulation library (BSD-3, 36 KB min) -->
<script src="https://cdn.jsdelivr.net/npm/chroma-js@2.4.2/chroma.min.js"></script>

{% include components/theme-controls-bar.html %}

<p class="small mb-4">
  <i class="bi bi-easel me-1"></i>
Ouvrez le <a href="⟦5⟧">guide de style Theme Preview</a> pour voir tous les composants se mettre à jour en direct lors des changements de skin et de mode.
</p>

<ul class="nav nav-tabs" id="themeTabs" role="tablist">
  <li class="nav-item" role="presentation">
    <button class="nav-link active" id="tab-skins" data-bs-toggle="tab" data-bs-target="#pane-skins" type="button" role="tab" aria-controls="pane-skins" aria-selected="true">
      <i class="bi bi-brush me-1"></i>Skins
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab-skin-editor" data-bs-toggle="tab" data-bs-target="#pane-skin-editor" type="button" role="tab" aria-controls="pane-skin-editor" aria-selected="false">
      <i class="bi bi-pencil-square me-1"></i>Éditeur de skin
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab-palette" data-bs-toggle="tab" data-bs-target="#pane-palette" type="button" role="tab" aria-controls="pane-palette" aria-selected="false">
      <i class="bi bi-rainbow me-1"></i>Générateur de palette
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab-live" data-bs-toggle="tab" data-bs-target="#pane-live" type="button" role="tab" aria-controls="pane-live" aria-selected="false">
      <i class="bi bi-sliders me-1"></i>Aperçu en direct
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab-colors" data-bs-toggle="tab" data-bs-target="#pane-colors" type="button" role="tab" aria-controls="pane-colors" aria-selected="false">
      <i class="bi bi-palette2 me-1"></i>Éditeur de couleurs
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab-export" data-bs-toggle="tab" data-bs-target="#pane-export" type="button" role="tab" aria-controls="pane-export" aria-selected="false">
      <i class="bi bi-download me-1"></i>Exporter
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <a class="nav-link" href="{{ '/about/settings/theme-preview/' | relative_url }}" role="tab">
      <i class="bi bi-easel me-1"></i>Galerie de composants
    </a>
  </li>
</ul>

<div class="tab-content pt-4" id="themeTabContent">

  <!-- ═══════ Skin Preview Tab ═══════ -->
  <div class="tab-pane fade show active" id="pane-skins" role="tabpanel">
    {% include components/theme-customizer.html %}
  </div>

  <!-- ═══════ Skin Editor Tab ═══════ -->
  <div class="tab-pane fade" id="pane-skin-editor" role="tabpanel">

    <p class="text-body-secondary mb-3">
      Modifiez n'importe quel skin intégré ou créez le vôtre. Ajustez les couleurs du dégradé, prévisualisez les palettes, réglez le filtre SVG, puis appliquez en direct.
    </p>

    <!-- Toolbar -->
    <div class="d-flex flex-wrap gap-2 mb-4 align-items-end">
      <div>
        <label class="form-label small fw-semibold mb-1" for="skin-editor-select">Skin</label>
        <select class="form-select form-select-sm" id="skin-editor-select" style="min-width:160px"></select>
      </div>
      <button class="btn btn-sm btn-outline-secondary" id="skin-editor-random" title="Generate random colors">
        <i class="bi bi-shuffle me-1"></i>Aléatoire
      </button>
      <button class="btn btn-sm btn-outline-success" id="skin-editor-save" title="Save as custom skin">
        <i class="bi bi-save me-1"></i>Enregistrer personnalisé
      </button>
      <button class="btn btn-sm btn-outline-danger" id="skin-editor-delete" title="Delete custom skin">
        <i class="bi bi-trash me-1"></i>Supprimer
      </button>
      <button class="btn btn-sm btn-outline-secondary" id="skin-editor-reset" title="Reset to built-in values">
        <i class="bi bi-arrow-counterclockwise me-1"></i>Réinitialiser
      </button>
    </div>

    <!-- Gradient stop color pickers -->
    <h6 class="fw-semibold"><i class="bi bi-palette me-1"></i>Couleurs du dégradé</h6>
    <div class="row g-3 mb-4" id="skin-editor-stops"></div>

    <!-- Live gradient preview -->
    <h6 class="fw-semibold"><i class="bi bi-image me-1"></i>Aperçu du dégradé</h6>
    <div id="skin-editor-preview" class="rounded-3 overflow-hidden mb-4" style="height:120px;border:1px solid rgba(128,128,128,.15)"></div>

    <!-- Auto-generated palettes (colorffy-style) -->
    <div id="skin-editor-palettes" class="mb-4"></div>

    <!-- Advanced SVG filter controls -->
    <details class="mb-4">
      <summary class="fw-semibold"><i class="bi bi-sliders2 me-1"></i>Avancé : contrôles du filtre SVG</summary>
      <div id="skin-editor-filters" class="mt-3"></div>
    </details>

    <!-- Action buttons -->
    <div class="d-flex flex-wrap gap-2">
      <button class="btn btn-primary" id="skin-editor-apply">
        <i class="bi bi-play-circle me-1"></i>Appliquer en direct
      </button>
      <button class="btn btn-outline-primary" id="skin-editor-export-svg" title="Download gradient and pattern SVG files">
        <i class="bi bi-download me-1"></i>Exporter les SVG
      </button>
      <button class="btn btn-outline-secondary" id="skin-editor-export-css" title="Copy CSS custom properties">
        <i class="bi bi-clipboard me-1"></i>Copier le CSS
      </button>
    </div>

    <div class="alert alert-info mt-4 small">
      <i class="bi bi-info-circle me-1"></i>
      <strong>Astuce :</strong> Cliquez sur n'importe quel échantillon pour copier son code hexadécimal. Utilisez <strong>Enregistrer personnalisé</strong> pour conserver votre skin dans localStorage.
      Utilisez <strong>Appliquer en direct</strong> pour voir vos modifications instantanément sur cette page.
    </div>

  </div>

  <!-- ═══════ Palette Generator Tab ═══════ -->
  <div class="tab-pane fade" id="pane-palette" role="tabpanel">

    <p class="text-body-secondary mb-3">Générez des palettes de couleurs harmonieuses à partir d'une couleur de base grâce aux algorithmes de la théorie des couleurs.</p>

    <div class="row g-3 mb-4 align-items-end">
      <div class="col-auto">
        <label class="form-label small fw-semibold" for="palette-base-color">Couleur de base</label>
        <div class="input-group input-group-sm">
          <input type="color" class="form-control form-control-color" id="palette-base-color" value="#0d6efd">
          <input type="text" class="form-control font-monospace" id="palette-base-text" value="#0d6efd" style="max-width:8rem">
        </div>
      </div>
      <div class="col-auto">
        <label class="form-label small fw-semibold" for="palette-harmony">Harmonie</label>
        <select class="form-select form-select-sm" id="palette-harmony">
          <option value="complementary" selected>Complémentaire</option>
          <option value="analogous">Analogue</option>
          <option value="triadic">Triadique</option>
          <option value="split-complementary">Complémentaire divisée</option>
          <option value="tetradic">Tétradique (carré)</option>
          <option value="monochromatic">Monochromatique</option>
        </select>
      </div>
      <div class="col-auto">
        <button class="btn btn-sm btn-outline-secondary" id="palette-random" title="Random base color">
          <i class="bi bi-shuffle me-1"></i>Aléatoire
        </button>
        <button class="btn btn-sm btn-primary" id="palette-apply" title="Apply palette to live preview">
          <i class="bi bi-arrow-right-circle me-1"></i>Appliquer à l'aperçu en direct
        </button>
      </div>
    </div>

    <div id="palette-swatches"></div>

  </div>

  <!-- ═══════ Live Preview Tab ═══════ -->
  <div class="tab-pane fade" id="pane-live" role="tabpanel">

    <div class="d-flex justify-content-between align-items-center mb-3">
      <p class="text-body-secondary mb-0">Modifiez les variables CSS de Bootstrap ci-dessous. Les changements s'affichent instantanément sur cette page.</p>
      <button class="btn btn-sm btn-outline-danger" id="live-reset">
        <i class="bi bi-arrow-counterclockwise me-1"></i>Réinitialiser
      </button>
    </div>

    <div id="live-editor-fields"></div>

    <div class="alert alert-info mt-4 small">
      <i class="bi bi-info-circle me-1"></i>
      Les modifications sont en direct sur cette page uniquement. Utilisez l'onglet <strong>Exporter</strong> pour copier votre configuration et l'utiliser de façon permanente.
    </div>

  </div>

  <!-- ═══════ Color Editor Tab ═══════ -->
  <div class="tab-pane fade" id="pane-colors" role="tabpanel">

    <p class="text-body-secondary mb-3">Modifiez les valeurs de couleur du thème ci-dessous. Les changements sont reflétés dans l'onglet Exporter.</p>

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
      <h5 class="mb-0"><i class="bi bi-filetype-yml me-1"></i> YAML de configuration du thème</h5>
      <div>
        <button class="btn btn-sm btn-outline-primary" id="theme-copy-yaml" title="Copy YAML">
          <i class="bi bi-clipboard me-1"></i> Copier
        </button>
        <button class="btn btn-sm btn-outline-secondary ms-1" id="theme-download-yaml" title="Download YAML">
          <i class="bi bi-download me-1"></i> Télécharger
        </button>
      </div>
    </div>
    <pre class="bg-dark text-light p-3 rounded" style="max-height:500px;overflow:auto;font-size:.85rem"><code id="theme-yaml-output">Chargement...</code></pre>
  </div>

</div>

<script src="{{ '/assets/js/theme-customizer.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/palette-generator.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/skin-editor.js' | relative_url }}" defer></script>
