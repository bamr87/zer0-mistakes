// Feature: ZER0-065
/**
 * theme-customizer.js
 * Powers the Theme Customizer admin page.
 * - Skin preview: clicking a card or quick-select button applies data-theme-skin
 * - Color editor: syncs color picker ↔ text inputs
 * - YAML export: builds theme_skin + theme_color YAML from current selections
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var skinGrid = document.getElementById('skin-grid');
  var quickSkinBar = document.getElementById('quickSkinBar');
  var selectedSkin = document.querySelector('.skin-card.border-primary');

  /** Apply skin via zer0Bg API (falls back to attribute-only). */
  function applySkinPreview(skinName) {
    if (!skinName) return;
    if (typeof zer0Bg !== 'undefined') {
      zer0Bg.setSkin(skinName);
    } else {
      document.documentElement.setAttribute('data-theme-skin', skinName);
      document.dispatchEvent(new CustomEvent('zer0:skin-change', { detail: { skin: skinName } }));
    }
    updateSkinCardUI(skinName);
    updateQuickSkinBarUI(skinName);
    rebuildYaml();
  }

  /** Highlight the matching skin card. */
  function updateSkinCardUI(skinName) {
    if (!skinGrid) return;
    skinGrid.querySelectorAll('.skin-card').forEach(function (card) {
      var isActive = card.dataset.skin === skinName;
      card.classList.toggle('border-primary', isActive);
      card.classList.toggle('border-secondary', !isActive);

      var icon = card.querySelector('.bi-circle-fill');
      if (icon) {
        icon.classList.toggle('text-primary', isActive);
        icon.classList.toggle('text-body-secondary', !isActive);
      }

      var footer = card.querySelector('.card-body > .badge, .card-body > small');
      if (footer) {
        footer.outerHTML = isActive
          ? '<span class="badge bg-primary"><i class="bi bi-check-circle me-1"></i>Previewing</span>'
          : '<small class="text-body-tertiary">Click to preview</small>';
      }
    });
    selectedSkin = skinGrid.querySelector('.skin-card.border-primary');
  }

  /** Sync quick-select button active state. */
  function updateQuickSkinBarUI(skinName) {
    if (!quickSkinBar) return;
    quickSkinBar.querySelectorAll('[data-quick-skin]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.quickSkin === skinName);
    });
  }

  /* ── Skin Preview (card grid) ─────────────────────────────── */
  if (skinGrid) {
    skinGrid.addEventListener('click', function (e) {
      var card = e.target.closest('.skin-card');
      if (!card || !card.dataset.skin) return;
      applySkinPreview(card.dataset.skin);
    });

    skinGrid.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('.skin-card');
      if (!card || !card.dataset.skin) return;
      e.preventDefault();
      applySkinPreview(card.dataset.skin);
    });
  }

  /* ── Skin Preview (quick-select bar) ──────────────────────── */
  if (quickSkinBar) {
    quickSkinBar.querySelectorAll('[data-quick-skin]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applySkinPreview(this.dataset.quickSkin);
      });
    });
  }

  /* ── Keep UI in sync when skin changes elsewhere ──────────── */
  document.addEventListener('zer0:skin-change', function (e) {
    if (!e.detail || !e.detail.skin) return;
    updateSkinCardUI(e.detail.skin);
    updateQuickSkinBarUI(e.detail.skin);
    rebuildYaml();
  });

  /* ── Color Editor ─────────────────────────────────────────── */
  document.querySelectorAll('[data-color-key]').forEach(function (picker) {
    picker.addEventListener('input', function () {
      var key = this.dataset.colorKey;
      var textInput = document.querySelector('[data-color-text="' + key + '"]');
      if (textInput) textInput.value = this.value;
      rebuildYaml();
    });
  });

  /* ── YAML Export ──────────────────────────────────────────── */
  function getActiveSkin() {
    if (typeof zer0Bg !== 'undefined') return zer0Bg.currentSkin();
    if (selectedSkin && selectedSkin.dataset.skin) return selectedSkin.dataset.skin;
    return document.documentElement.getAttribute('data-theme-skin') || 'dark';
  }

  function rebuildYaml() {
    // If palette-generator.js provides a full YAML builder, use it
    if (typeof rebuildFullYaml === 'function') {
      rebuildFullYaml();
      return;
    }
    var lines = [];
    lines.push('theme_skin: "' + getActiveSkin() + '"');
    lines.push('');
    lines.push('theme_color:');
    document.querySelectorAll('[data-color-key]').forEach(function (el) {
      // Quote values: unquoted #RRGGBB is parsed as a YAML comment,
      // silently dropping the color (T-008).
      lines.push('  ' + el.dataset.colorKey + ': "' + el.value + '"');
    });
    var output = document.getElementById('theme-yaml-output');
    if (output) output.textContent = lines.join('\n');
  }

  // Sync UI to skin restored by background-customizer.js on load
  var initialSkin = getActiveSkin();
  updateSkinCardUI(initialSkin);
  updateQuickSkinBarUI(initialSkin);

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
