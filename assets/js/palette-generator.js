/**
 * palette-generator.js
 * Color palette generator + live CSS variable editor for the Theme Customizer.
 *
 * Dependencies: chroma.js (loaded via CDN in head)
 *
 * Provides:
 *   - Palette generation from a base color (complementary, analogous, triadic, etc.)
 *   - Live preview of Bootstrap CSS custom properties on document root
 *   - WCAG contrast ratio display
 *   - Export generated palette to YAML
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  /* ── Guard: chroma.js must be loaded ───────────────────────── */
  if (typeof chroma === 'undefined') {
    console.warn('[palette-generator] chroma.js not loaded');
    return;
  }

  /* ── State ─────────────────────────────────────────────────── */
  var state = {
    baseColor: getComputedStyle(document.documentElement).getPropertyValue('--bs-primary').trim() || '#0d6efd',
    harmony: 'complementary',
    palette: [],
    liveOverrides: {}  // key → value map of active CSS overrides
  };

  /* ── Palette Harmony Algorithms ────────────────────────────── */
  var harmonies = {
    complementary: function (base) {
      var c = chroma(base);
      return [c, c.set('hsl.h', '+180')];
    },
    analogous: function (base) {
      var c = chroma(base);
      return [c.set('hsl.h', '-30'), c, c.set('hsl.h', '+30')];
    },
    triadic: function (base) {
      var c = chroma(base);
      return [c, c.set('hsl.h', '+120'), c.set('hsl.h', '+240')];
    },
    'split-complementary': function (base) {
      var c = chroma(base);
      return [c, c.set('hsl.h', '+150'), c.set('hsl.h', '+210')];
    },
    tetradic: function (base) {
      var c = chroma(base);
      return [c, c.set('hsl.h', '+90'), c.set('hsl.h', '+180'), c.set('hsl.h', '+270')];
    },
    monochromatic: function (base) {
      var c = chroma(base);
      return [
        c.brighten(1.5),
        c.brighten(0.75),
        c,
        c.darken(0.75),
        c.darken(1.5)
      ];
    }
  };

  function generatePalette(base, harmonyName) {
    var fn = harmonies[harmonyName] || harmonies.complementary;
    return fn(base).map(function (c) { return c.hex(); });
  }

  function contrastRatio(fg, bg) {
    return chroma.contrast(fg, bg).toFixed(2);
  }

  function contrastLabel(ratio) {
    if (ratio >= 7) return '<span class="badge bg-success">AAA</span>';
    if (ratio >= 4.5) return '<span class="badge bg-success">AA</span>';
    if (ratio >= 3) return '<span class="badge bg-warning text-dark">AA Large</span>';
    return '<span class="badge bg-danger">Fail</span>';
  }

  /* ── Scale Generator ───────────────────────────────────────── */
  function generateScale(hex, steps) {
    steps = steps || 9;
    return chroma.scale(['white', hex, 'black']).mode('lab').colors(steps + 2).slice(1, -1);
  }

  /* ── Render Palette Grid ───────────────────────────────────── */
  function renderPalette() {
    var container = document.getElementById('palette-swatches');
    if (!container) return;

    state.palette = generatePalette(state.baseColor, state.harmony);
    var isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    var textColor = isDark ? '#ffffff' : '#000000';

    var html = '<div class="row g-2 mb-3">';
    state.palette.forEach(function (hex, i) {
      var ratio = contrastRatio(textColor, hex);
      html += '<div class="col">' +
        '<div class="palette-swatch rounded-3 p-3 text-center position-relative" ' +
        'style="background:' + hex + '; min-height:100px; cursor:pointer" ' +
        'data-palette-color="' + hex + '" title="Click to copy">' +
        '<code class="d-block fw-bold" style="color:' +
        (chroma.contrast(hex, '#fff') > 3 ? '#fff' : '#000') + '">' + hex + '</code>' +
        '<small class="d-block mt-1" style="color:' +
        (chroma.contrast(hex, '#fff') > 3 ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)') + '">' +
        contrastLabel(ratio) + ' ' + ratio + ':1</small>' +
        '</div></div>';
    });
    html += '</div>';

    // Scale for base color
    html += '<h6 class="text-body-secondary small text-uppercase fw-semibold mt-4 mb-2">' +
      '<i class="bi bi-bar-chart-steps me-1"></i>Base Color Scale</h6>';
    var scale = generateScale(state.baseColor);
    html += '<div class="d-flex rounded-3 overflow-hidden" style="height:48px">';
    scale.forEach(function (hex, i) {
      var label = (i + 1) * 100;
      html += '<div class="flex-fill position-relative" style="background:' + hex + '" ' +
        'data-palette-color="' + hex + '" title="' + label + ': ' + hex + '">' +
        '<small class="position-absolute bottom-0 start-50 translate-middle-x" style="font-size:.6rem;color:' +
        (chroma.contrast(hex, '#fff') > 3 ? '#fff' : '#000') + '">' + label + '</small></div>';
    });
    html += '</div>';

    container.innerHTML = html;

    // Click-to-copy on swatches
    container.querySelectorAll('[data-palette-color]').forEach(function (el) {
      el.addEventListener('click', function () {
        navigator.clipboard.writeText(this.dataset.paletteColor).then(function () {
          showToast('Copied ' + el.dataset.paletteColor);
        });
      });
    });
  }

  /* ── Bind Palette Controls ─────────────────────────────────── */
  var basePicker = document.getElementById('palette-base-color');
  var baseText = document.getElementById('palette-base-text');
  var harmonySelect = document.getElementById('palette-harmony');

  if (basePicker) {
    basePicker.value = state.baseColor;
    basePicker.addEventListener('input', function () {
      state.baseColor = this.value;
      if (baseText) baseText.value = this.value;
      renderPalette();
    });
  }
  if (baseText) {
    baseText.value = state.baseColor;
    baseText.addEventListener('change', function () {
      if (chroma.valid(this.value)) {
        state.baseColor = chroma(this.value).hex();
        if (basePicker) basePicker.value = state.baseColor;
        renderPalette();
      }
    });
  }
  if (harmonySelect) {
    harmonySelect.addEventListener('change', function () {
      state.harmony = this.value;
      renderPalette();
    });
  }

  // Random palette button
  var randomBtn = document.getElementById('palette-random');
  if (randomBtn) {
    randomBtn.addEventListener('click', function () {
      state.baseColor = chroma.random().hex();
      if (basePicker) basePicker.value = state.baseColor;
      if (baseText) baseText.value = state.baseColor;
      renderPalette();
    });
  }

  /* ── Live Preview: CSS Variable Editor ─────────────────────── */
  var liveVars = {
    // Bootstrap semantic colors
    '--bs-primary': { label: 'Primary', type: 'color', default: '#0d6efd' },
    '--bs-secondary': { label: 'Secondary', type: 'color', default: '#6c757d' },
    '--bs-success': { label: 'Success', type: 'color', default: '#198754' },
    '--bs-info': { label: 'Info', type: 'color', default: '#0dcaf0' },
    '--bs-warning': { label: 'Warning', type: 'color', default: '#ffc107' },
    '--bs-danger': { label: 'Danger', type: 'color', default: '#dc3545' },
    // Body
    '--bs-body-bg': { label: 'Body Background', type: 'color', default: '#ffffff' },
    '--bs-body-color': { label: 'Body Text', type: 'color', default: '#212529' },
    '--bs-tertiary-bg': { label: 'Tertiary BG', type: 'color', default: '#f8f9fa' },
    // Borders/Links
    '--bs-border-color': { label: 'Border Color', type: 'color', default: '#dee2e6' },
    '--bs-link-color': { label: 'Link Color', type: 'color', default: '#0d6efd' },
    '--bs-link-hover-color': { label: 'Link Hover', type: 'color', default: '#0a58ca' },
    // Sizing
    '--bs-border-radius': { label: 'Border Radius', type: 'range', min: 0, max: 2, step: 0.05, unit: 'rem', default: '0.375rem' },
    '--bs-border-width': { label: 'Border Width', type: 'range', min: 0, max: 5, step: 0.5, unit: 'px', default: '1px' },
    // Font
    '--bs-body-font-size': { label: 'Font Size', type: 'range', min: 0.75, max: 1.5, step: 0.05, unit: 'rem', default: '1rem' },
    '--bs-body-font-weight': { label: 'Font Weight', type: 'range', min: 100, max: 900, step: 100, unit: '', default: '400' },
    '--bs-body-line-height': { label: 'Line Height', type: 'range', min: 1, max: 2.5, step: 0.05, unit: '', default: '1.5' }
  };

  function readCurrentCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function renderLiveEditor() {
    var container = document.getElementById('live-editor-fields');
    if (!container) return;

    var html = '';
    var categories = {
      'Theme Colors': ['--bs-primary', '--bs-secondary', '--bs-success', '--bs-info', '--bs-warning', '--bs-danger'],
      'Body & Layout': ['--bs-body-bg', '--bs-body-color', '--bs-tertiary-bg'],
      'Links & Borders': ['--bs-border-color', '--bs-link-color', '--bs-link-hover-color'],
      'Sizing & Typography': ['--bs-border-radius', '--bs-border-width', '--bs-body-font-size', '--bs-body-font-weight', '--bs-body-line-height']
    };

    Object.keys(categories).forEach(function (catName) {
      html += '<h6 class="text-body-secondary small text-uppercase fw-semibold mt-3 mb-2">' +
        '<i class="bi bi-sliders me-1"></i>' + catName + '</h6>';
      html += '<div class="row g-2">';

      categories[catName].forEach(function (varName) {
        var cfg = liveVars[varName];
        var current = readCurrentCSSVar(varName) || cfg.default;

        if (cfg.type === 'color') {
          // Normalize to hex
          var hex;
          try { hex = chroma(current).hex(); } catch (e) { hex = cfg.default; }
          html += '<div class="col-6 col-md-4 col-lg-3">' +
            '<label class="form-label small fw-semibold mb-1">' + cfg.label + '</label>' +
            '<div class="input-group input-group-sm">' +
            '<input type="color" class="form-control form-control-color" value="' + hex + '" data-live-var="' + varName + '">' +
            '<input type="text" class="form-control font-monospace" value="' + hex + '" data-live-text="' + varName + '">' +
            '</div></div>';
        } else if (cfg.type === 'range') {
          var numVal = parseFloat(current) || parseFloat(cfg.default);
          html += '<div class="col-6 col-md-4 col-lg-3">' +
            '<label class="form-label small fw-semibold mb-1">' + cfg.label + '</label>' +
            '<div class="d-flex align-items-center gap-2">' +
            '<input type="range" class="form-range flex-grow-1" min="' + cfg.min + '" max="' + cfg.max +
            '" step="' + cfg.step + '" value="' + numVal + '" data-live-var="' + varName + '" data-unit="' + cfg.unit + '">' +
            '<code class="text-nowrap" data-live-val="' + varName + '">' + numVal + cfg.unit + '</code>' +
            '</div></div>';
        }
      });
      html += '</div>';
    });

    container.innerHTML = html;
    bindLiveEditorEvents(container);
  }

  function bindLiveEditorEvents(container) {
    // Color pickers
    container.querySelectorAll('[data-live-var][type="color"]').forEach(function (picker) {
      picker.addEventListener('input', function () {
        var varName = this.dataset.liveVar;
        var cfg = liveVars[varName];
        applyLiveVar(varName, this.value);

        var textInput = container.querySelector('[data-live-text="' + varName + '"]');
        if (textInput) textInput.value = this.value;

        // Also set the rgb variant if it's a semantic color
        if (varName.match(/^--bs-(primary|secondary|success|info|warning|danger)$/)) {
          var rgb = chroma(this.value).rgb().join(', ');
          applyLiveVar(varName + '-rgb', rgb);
        }
      });
    });

    // Color text inputs
    container.querySelectorAll('[data-live-text]').forEach(function (input) {
      input.addEventListener('change', function () {
        var varName = this.dataset.liveText;
        if (chroma.valid(this.value)) {
          var hex = chroma(this.value).hex();
          this.value = hex;
          applyLiveVar(varName, hex);
          var picker = container.querySelector('[data-live-var="' + varName + '"][type="color"]');
          if (picker) picker.value = hex;

          if (varName.match(/^--bs-(primary|secondary|success|info|warning|danger)$/)) {
            var rgb = chroma(hex).rgb().join(', ');
            applyLiveVar(varName + '-rgb', rgb);
          }
        }
      });
    });

    // Range sliders
    container.querySelectorAll('[data-live-var][type="range"]').forEach(function (slider) {
      slider.addEventListener('input', function () {
        var varName = this.dataset.liveVar;
        var unit = this.dataset.unit || '';
        var val = this.value + unit;
        applyLiveVar(varName, val);
        var display = container.querySelector('[data-live-val="' + varName + '"]');
        if (display) display.textContent = val;
      });
    });
  }

  function applyLiveVar(name, value) {
    document.documentElement.style.setProperty(name, value);
    state.liveOverrides[name] = value;
    // Rebuild export YAML if the export function exists
    if (typeof rebuildFullYaml === 'function') rebuildFullYaml();
  }

  /* ── Apply Palette to Live Preview ─────────────────────────── */
  var applyPaletteBtn = document.getElementById('palette-apply');
  if (applyPaletteBtn) {
    applyPaletteBtn.addEventListener('click', function () {
      if (state.palette.length < 2) return;
      var mapping = ['--bs-primary', '--bs-secondary', '--bs-success', '--bs-info', '--bs-warning', '--bs-danger'];

      state.palette.forEach(function (hex, i) {
        if (i < mapping.length) {
          applyLiveVar(mapping[i], hex);
          var rgb = chroma(hex).rgb().join(', ');
          applyLiveVar(mapping[i] + '-rgb', rgb);

          // Update the live editor inputs if they exist
          var picker = document.querySelector('[data-live-var="' + mapping[i] + '"][type="color"]');
          var text = document.querySelector('[data-live-text="' + mapping[i] + '"]');
          if (picker) picker.value = hex;
          if (text) text.value = hex;
        }
      });
      showToast('Palette applied to live preview');
    });
  }

  /* ── Reset Live Preview ────────────────────────────────────── */
  var resetLiveBtn = document.getElementById('live-reset');
  if (resetLiveBtn) {
    resetLiveBtn.addEventListener('click', function () {
      Object.keys(state.liveOverrides).forEach(function (name) {
        document.documentElement.style.removeProperty(name);
      });
      state.liveOverrides = {};
      renderLiveEditor();
      showToast('Reset to defaults');
    });
  }

  /* ── Full YAML Export (combines skin + colors + overrides) ── */
  window.rebuildFullYaml = function () {
    var lines = [];
    var skinEl = document.querySelector('.skin-card.border-primary');
    var skin = skinEl ? skinEl.dataset.skin : 'dark';
    lines.push('theme_skin: "' + skin + '"');
    lines.push('');
    lines.push('theme_color:');

    // Colors from override state or the color editor
    var colorVars = ['--bs-primary', '--bs-secondary', '--bs-success', '--bs-info', '--bs-warning', '--bs-danger'];
    var colorNames = ['primary', 'secondary', 'success', 'info', 'warning', 'danger'];
    colorVars.forEach(function (v, i) {
      var val = state.liveOverrides[v] || readCurrentCSSVar(v);
      try { val = chroma(val).hex(); } catch (e) { /* keep raw */ }
      lines.push('  ' + colorNames[i] + ': "' + val + '"');
    });

    lines.push('');
    lines.push('# Layout overrides');
    ['--bs-border-radius', '--bs-border-width', '--bs-body-font-size', '--bs-body-font-weight', '--bs-body-line-height'].forEach(function (v) {
      if (state.liveOverrides[v]) {
        var key = v.replace('--bs-', '').replace(/-/g, '_');
        lines.push('# ' + key + ': ' + state.liveOverrides[v]);
      }
    });

    var output = document.getElementById('theme-yaml-output');
    if (output) output.textContent = lines.join('\n');
  };

  /* ── Toast Helper ──────────────────────────────────────────── */
  function showToast(message) {
    var existing = document.getElementById('palette-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'palette-toast';
    toast.className = 'position-fixed bottom-0 end-0 m-3 p-3 bg-dark text-white rounded-3 shadow-lg';
    toast.style.zIndex = '9999';
    toast.style.transition = 'opacity .3s';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 300);
    }, 2000);
  }

  /* ── Listen for theme mode changes → re-read computed styles ─ */
  new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      if (m.attributeName === 'data-bs-theme') {
        // After theme switch, refresh the live editor defaults
        setTimeout(renderLiveEditor, 100);
      }
    });
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });

  /* ── Init ──────────────────────────────────────────────────── */
  renderPalette();
  renderLiveEditor();
});
