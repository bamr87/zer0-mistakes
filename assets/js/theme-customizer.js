/**
 * theme-customizer.js
 * Powers the Theme Customizer admin page.
 * - Skin preview: clicking a card swaps data-bs-theme for page-level preview
 * - Color editor: syncs color picker ↔ text inputs
 * - YAML export: builds theme_skin + theme_color YAML from current selections
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  /* ── Skin Preview ─────────────────────────────────────────── */
  const skinGrid = document.getElementById('skin-grid');
  let selectedSkin = document.querySelector('.skin-card.border-primary');

  if (skinGrid) {
    skinGrid.addEventListener('click', function (e) {
      const card = e.target.closest('.skin-card');
      if (!card) return;

      // Visual: deselect previous, select new
      if (selectedSkin) {
        selectedSkin.classList.replace('border-primary', 'border-secondary');
        const prev = selectedSkin.querySelector('.badge');
        if (prev) prev.outerHTML = '<small class="text-body-tertiary">Click to preview</small>';
        const prevIcon = selectedSkin.querySelector('.bi-circle-fill');
        if (prevIcon) { prevIcon.classList.remove('text-primary'); prevIcon.classList.add('text-body-secondary'); }
      }

      card.classList.replace('border-secondary', 'border-primary');
      const label = card.querySelector('small');
      if (label) label.outerHTML = '<span class="badge bg-primary"><i class="bi bi-check-circle me-1"></i>Selected</span>';
      const icon = card.querySelector('.bi-circle-fill');
      if (icon) { icon.classList.remove('text-body-secondary'); icon.classList.add('text-primary'); }

      selectedSkin = card;
      rebuildYaml();
    });
  }

  /* ── Color Editor ─────────────────────────────────────────── */
  document.querySelectorAll('[data-color-key]').forEach(function (picker) {
    picker.addEventListener('input', function () {
      const key = this.dataset.colorKey;
      const textInput = document.querySelector('[data-color-text="' + key + '"]');
      if (textInput) textInput.value = this.value;
      rebuildYaml();
    });
  });

  /* ── YAML Export ──────────────────────────────────────────── */
  function rebuildYaml() {
    // If palette-generator.js provides a full YAML builder, use it
    if (typeof rebuildFullYaml === 'function') {
      rebuildFullYaml();
      return;
    }
    var lines = [];
    // Skin
    var skin = selectedSkin ? selectedSkin.dataset.skin : 'dark';
    lines.push('theme_skin: "' + skin + '"');
    lines.push('');
    // Colors
    lines.push('theme_color:');
    document.querySelectorAll('[data-color-key]').forEach(function (el) {
      var key = el.dataset.colorKey;
      var val = el.value;
      var escapedVal = String(val).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      lines.push('  ' + key + ': "' + escapedVal + '"');
    });
    var yaml = lines.join('\n');
    var output = document.getElementById('theme-yaml-output');
    if (output) output.textContent = yaml;
  }

  // Initial build
  rebuildYaml();

  /* ── Copy / Download Buttons ──────────────────────────────── */
  var copyBtn = document.getElementById('theme-copy-yaml');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = document.getElementById('theme-yaml-output').textContent;
      navigator.clipboard.writeText(text).then(function () {
        copyBtn.innerHTML = '<i class="bi bi-check me-1"></i> Copied';
        setTimeout(function () { copyBtn.innerHTML = '<i class="bi bi-clipboard me-1"></i> Copy'; }, 2000);
      });
    });
  }

  var dlBtn = document.getElementById('theme-download-yaml');
  if (dlBtn) {
    dlBtn.addEventListener('click', function () {
      var text = document.getElementById('theme-yaml-output').textContent;
      var blob = new Blob([text], { type: 'text/yaml' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'theme-config.yml';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }
});
