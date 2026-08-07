---
title: Aperçu du thème
preview: "/images/previews/theme-preview.png"
layout: admin
icon: bi-easel
excerpt: Guide de style en direct — prévisualisez les thèmes, les modes de couleur
  et la couverture des composants en un seul endroit.
admin_section: Theme Preview
lastmod: 2026-05-24 00:00:00.000000000 Z
admin_actions:
- label: Theme Customizer
  url: "/about/settings/theme/"
  icon: bi-palette
  style: btn-outline-primary
lang: fr
permalink: "/fr/about/settings/theme-preview/"
translation_of: pages/_about/settings/theme-preview.md
translation_source_url: "/about/settings/theme-preview/"
machine_translated: true
translated_from_sha: e283d9e761c8
---

{% include components/theme-controls-bar.html show_status=true %}

<div class="row g-4">
  <div class="col-lg-9">
    {% include components/theme-preview-gallery.html %}
  </div>
  <div class="col-lg-3">
    <div class="position-sticky" style="top: 5rem;">
      <nav class="nav nav-pills flex-column small theme-preview-toc mb-3" aria-label="Preview sections">
        <a class="nav-link" href="#preview-typography">Typographie</a>
        <a class="nav-link" href="#preview-buttons">Boutons</a>
        <a class="nav-link" href="#preview-alerts">Alertes</a>
        <a class="nav-link" href="#preview-cards">Cartes</a>
        <a class="nav-link" href="#preview-forms">Formulaires</a>
        <a class="nav-link" href="#preview-tabs">Onglets de navigation</a>
        <a class="nav-link" href="#preview-badges">Badges</a>
        <a class="nav-link" href="#preview-code">Blocs de code</a>
        <a class="nav-link" href="#preview-links">Liens</a>
        <a class="nav-link" href="#preview-navbar">Barre de navigation</a>
        <a class="nav-link" href="#preview-footer">Pied de page</a>
        <a class="nav-link" href="#preview-table">Tableau</a>
        <a class="nav-link" href="#preview-list-group">Groupe de liste</a>
        <a class="nav-link" href="#preview-backgrounds">Arrière-plans</a>
        <a class="nav-link" href="#preview-callouts">Encadrés</a>
        <a class="nav-link" href="#preview-accordion">Accordéon</a>
        <a class="nav-link" href="#preview-progress">Barres de progression &amp; Spinners</a>
        <a class="nav-link" href="#preview-breadcrumb">Fil d'Ariane &amp; Pagination</a>
        <a class="nav-link" href="#preview-tooltips">Infobulles &amp; Popovers</a>
        <a class="nav-link" href="#preview-icons">Icônes</a>
      </nav>

      <div class="card border">
        <div class="card-header py-2 small fw-semibold">
          <i class="bi bi-sliders me-1"></i> Démo de personnalisation
        </div>
        <div class="card-body small">
          <p class="text-body-secondary mb-2">
            Mêmes contrôles que le panneau Paramètres → Apparence. Remplace
            <code>--zer0-color-primary</code> par-dessus le thème actif.
          </p>
          <div data-appearance-panel-host></div>
        </div>
      </div>

      <div class="alert alert-info small mt-3 mb-0">
        <i class="bi bi-info-circle me-1"></i>
        L'aperçu du thème s'applique au niveau de la page. Exportez les modifications permanentes depuis
        <a href="⟦49⟧">Personnalisateur de thème</a>.
      </div>
    </div>
  </div>
</div>

<script src="{{ '/assets/js/theme-customizer.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/theme-preview.js' | relative_url }}" defer></script>
<script>
// Initialise Bootstrap tooltips and popovers in the preview section document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(function (el) {
      bootstrap.Tooltip.getOrCreateInstance(el);
    });
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach(function (el) {
      bootstrap.Popover.getOrCreateInstance(el);
    });
  });
</script>
