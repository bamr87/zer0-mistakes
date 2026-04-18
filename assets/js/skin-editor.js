/**
 * skin-editor.js — Colorffy-inspired skin editor for zer0-mistakes theme
 *
 * Edit existing skins or create new ones by adjusting gradient colors,
 * SVG filter parameters, and viewing auto-generated palettes.
 * Changes can be applied live and saved as custom skins in localStorage.
 *
 * Requires: chroma-js (loaded globally)
 * Integrates with: background-customizer.js (zer0Bg API)
 */
(function () {
  'use strict';

  /* ===================================================================
   * Built-in skin definitions — exact hex values from SVG files
   * =================================================================== */
  const BUILTIN_SKINS = {
    air:      { stops: ['#e8f4f8', '#b8d4e3', '#6fa8dc'], filter: { freq: 0.006, oct: 4, seed: 2,  scale: 60, opacity: 0.5 }, patternSize: 50 },
    aqua:     { stops: ['#0077b6', '#00b4d8', '#90e0ef'], filter: { freq: 0.008, oct: 4, seed: 5,  scale: 70, opacity: 0.5 }, patternSize: 48 },
    contrast: { stops: ['#111111', '#333333', '#ffcc00'], filter: { freq: 0.005, oct: 3, seed: 8,  scale: 50, opacity: 0.4 }, patternSize: 40 },
    dark:     { stops: ['#1a1a2e', '#16213e', '#0f3460'], filter: { freq: 0.007, oct: 4, seed: 12, scale: 55, opacity: 0.5 }, patternSize: 60 },
    dirt:     { stops: ['#5c4033', '#8b6914', '#d4a574'], filter: { freq: 0.009, oct: 4, seed: 20, scale: 65, opacity: 0.5 }, patternSize: 50 },
    neon:     { stops: ['#ff006e', '#8338ec', '#3a86ff'], filter: { freq: 0.006, oct: 5, seed: 42, scale: 80, opacity: 0.6 }, patternSize: 48 },
    mint:     { stops: ['#2d6a4f', '#52b788', '#95d5b2'], filter: { freq: 0.007, oct: 4, seed: 30, scale: 60, opacity: 0.5 }, patternSize: 50 },
    plum:     { stops: ['#4a0e4e', '#812f85', '#c77dff'], filter: { freq: 0.006, oct: 4, seed: 15, scale: 65, opacity: 0.5 }, patternSize: 55 },
    sunrise:  { stops: ['#ff6b35', '#f7c59f', '#efefd0'], filter: { freq: 0.008, oct: 4, seed: 7,  scale: 60, opacity: 0.5 }, patternSize: 50 }
  };

  const STORAGE_KEY = 'zer0-custom-skins';
  const STOP_LABELS = ['Start (0%)', 'Middle (50%)', 'End (100%)'];

  /* ===================================================================
   * Editor state
   * =================================================================== */
  var state = {
    baseSkin: 'aqua',
    isCustom: false,
    stops: ['#0077b6', '#00b4d8', '#90e0ef'],
    filter: { freq: 0.008, oct: 4, seed: 5, scale: 70, opacity: 0.5 },
    patternSize: 48,
    customSkins: {}
  };

  /* ===================================================================
   * SVG generators
   * =================================================================== */
  function gradientSVG(stops, f) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">' +
      '<defs>' +
        '<linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="' + stops[0] + '"/>' +
          '<stop offset="50%" stop-color="' + stops[1] + '"/>' +
          '<stop offset="100%" stop-color="' + stops[2] + '"/>' +
        '</linearGradient>' +
        '<filter id="f1">' +
          '<feTurbulence type="fractalNoise" baseFrequency="' + f.freq + '" numOctaves="' + f.oct + '" seed="' + f.seed + '"/>' +
          '<feDisplacementMap in="SourceGraphic" scale="' + f.scale + '"/>' +
        '</filter>' +
      '</defs>' +
      '<rect width="100%" height="100%" fill="url(#g1)"/>' +
      '<rect width="100%" height="100%" fill="url(#g1)" filter="url(#f1)" opacity="' + f.opacity + '"/>' +
    '</svg>';
  }

  function patternSVG(stops, sz) {
    var s = sz || 60;
    var r1 = Math.round(s * 0.13);
    var r2 = Math.round(s * 0.08);
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + ' ' + s + '">' +
      '<circle cx="' + (s/2) + '" cy="' + (s/2) + '" r="' + r1 + '" fill="none" stroke="' + stops[1] + '" stroke-width="0.5" opacity="0.3"/>' +
      '<circle cx="0" cy="0" r="' + r2 + '" fill="none" stroke="' + stops[2] + '" stroke-width="0.5" opacity="0.2"/>' +
      '<circle cx="' + s + '" cy="' + s + '" r="' + r2 + '" fill="none" stroke="' + stops[2] + '" stroke-width="0.5" opacity="0.2"/>' +
      '<circle cx="' + s + '" cy="0" r="' + r2 + '" fill="none" stroke="' + stops[2] + '" stroke-width="0.5" opacity="0.2"/>' +
      '<circle cx="0" cy="' + s + '" r="' + r2 + '" fill="none" stroke="' + stops[2] + '" stroke-width="0.5" opacity="0.2"/>' +
    '</svg>';
  }

  function svgToUri(svg) {
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  /* ===================================================================
   * Palette generation (requires chroma.js)
   * =================================================================== */
  function hasChroma() { return typeof chroma !== 'undefined'; }

  function tints(hex, n) {
    if (!hasChroma()) return [];
    var out = [];
    for (var i = 0; i < n; i++) {
      out.push(chroma.mix(hex, '#ffffff', (i + 1) / (n + 1), 'lab').hex());
    }
    return out;
  }

  function surfaceColors(darkHex) {
    if (!hasChroma()) return [];
    var base = chroma(darkHex).luminance() < 0.15 ? darkHex : chroma(darkHex).darken(3).hex();
    return chroma.scale([base, chroma(base).brighten(3).hex()]).mode('lab').colors(6);
  }

  function tonalSurface(darkHex, accent) {
    if (!hasChroma()) return [];
    var base = chroma(darkHex).luminance() < 0.15 ? darkHex : chroma(darkHex).darken(3).hex();
    var tinted = chroma.mix(base, accent, 0.15, 'lab').hex();
    var tintedLight = chroma(chroma.mix(base, accent, 0.4, 'lab')).brighten(2).hex();
    return chroma.scale([tinted, tintedLight]).mode('lab').colors(6);
  }

  function semanticPalette(refHex) {
    if (!hasChroma()) return { success: [], warning: [], danger: [], info: [] };
    var h = chroma(refHex).get('hsl.h') || 0;
    return {
      success: [
        chroma.hsl((h + 150) % 360, 0.6, 0.35).hex(),
        chroma.hsl((h + 150) % 360, 0.65, 0.55).hex(),
        chroma.hsl((h + 150) % 360, 0.5, 0.75).hex()
      ],
      warning: [
        chroma.hsl(40, 0.6, 0.4).hex(),
        chroma.hsl(40, 0.65, 0.6).hex(),
        chroma.hsl(40, 0.5, 0.8).hex()
      ],
      danger: [
        chroma.hsl(0, 0.65, 0.36).hex(),
        chroma.hsl(0, 0.65, 0.56).hex(),
        chroma.hsl(0, 0.5, 0.77).hex()
      ],
      info: [
        chroma.hsl(215, 0.6, 0.33).hex(),
        chroma.hsl(215, 0.65, 0.53).hex(),
        chroma.hsl(215, 0.5, 0.73).hex()
      ]
    };
  }

  function wcagBadge(hex) {
    if (!hasChroma()) return { label: '', cls: 'secondary', ratio: '?' };
    var cW = chroma.contrast(hex, '#ffffff');
    var cB = chroma.contrast(hex, '#000000');
    var best = Math.max(cW, cB);
    var label = best >= 7 ? 'AAA' : best >= 4.5 ? 'AA' : '';
    var cls = best >= 7 ? 'success' : best >= 4.5 ? 'warning' : 'secondary';
    return { label: label, cls: cls, ratio: best.toFixed(1) };
  }

  /* ===================================================================
   * Custom skin persistence (localStorage)
   * =================================================================== */
  function loadCustom() {
    try { state.customSkins = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (e) { state.customSkins = {}; }
  }

  function saveCustom(name) {
    state.customSkins[name] = {
      stops: state.stops.slice(),
      filter: { freq: state.filter.freq, oct: state.filter.oct, seed: state.filter.seed, scale: state.filter.scale, opacity: state.filter.opacity },
      patternSize: state.patternSize
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.customSkins));
  }

  function deleteCustom(name) {
    delete state.customSkins[name];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.customSkins));
  }

  /* ===================================================================
   * Live application to page
   * =================================================================== */
  function applyLive() {
    var html = document.documentElement;
    var gSvg = gradientSVG(state.stops, state.filter);
    var pSvg = patternSVG(state.stops, state.patternSize);
    html.style.setProperty('--zer0-bg-gradient', 'url("' + svgToUri(gSvg) + '")');
    html.style.setProperty('--zer0-bg-pattern', 'url("' + svgToUri(pSvg) + '")');
    html.style.setProperty('--zer0-bg-pattern-size', state.patternSize + 'px ' + state.patternSize + 'px');
    toast('Skin applied live!');
  }

  function resetLive(skinName) {
    var html = document.documentElement;
    html.style.removeProperty('--zer0-bg-gradient');
    html.style.removeProperty('--zer0-bg-pattern');
    html.style.removeProperty('--zer0-bg-pattern-size');
    if (typeof zer0Bg !== 'undefined') zer0Bg.setSkin(skinName || state.baseSkin);
    toast('Reset to ' + (skinName || state.baseSkin));
  }

  /* ===================================================================
   * UI helpers
   * =================================================================== */
  function toast(msg) {
    var el = document.getElementById('skin-editor-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'skin-editor-toast';
      el.className = 'position-fixed bottom-0 end-0 m-3 p-2 px-3 rounded bg-success text-white small shadow';
      el.style.cssText = 'z-index:9999;transition:opacity .3s;opacity:0;pointer-events:none';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    setTimeout(function () { el.style.opacity = '0'; }, 2000);
  }

  function swatchHTML(hex, label) {
    var w = wcagBadge(hex);
    var badge = w.label ? '<span class="badge bg-' + w.cls + '" style="font-size:.55rem">' + w.label + ' ' + w.ratio + '</span>' : '';
    return '<div class="text-center" style="min-width:56px;cursor:pointer" title="Click to copy ' + hex + '" onclick="navigator.clipboard.writeText(\'' + hex + '\')">' +
      '<div style="width:52px;height:36px;background:' + hex + ';border-radius:6px;border:1px solid rgba(128,128,128,.2)"></div>' +
      '<div class="font-monospace mt-1" style="font-size:.65rem">' + hex + '</div>' +
      (label ? '<div class="text-body-secondary" style="font-size:.6rem">' + label + '</div>' : '') +
      badge +
    '</div>';
  }

  function swatchRow(colors, labels) {
    var html = '<div class="d-flex flex-wrap gap-2">';
    for (var i = 0; i < colors.length; i++) {
      html += swatchHTML(colors[i], labels ? labels[i] : null);
    }
    html += '</div>';
    return html;
  }

  /* ===================================================================
   * Render functions
   * =================================================================== */
  function populateSelect() {
    var sel = document.getElementById('skin-editor-select');
    if (!sel) return;
    sel.innerHTML = '';

    // Built-in group
    var optBuiltin = document.createElement('optgroup');
    optBuiltin.label = 'Built-in Skins';
    var names = Object.keys(BUILTIN_SKINS);
    for (var i = 0; i < names.length; i++) {
      var opt = document.createElement('option');
      opt.value = names[i];
      opt.textContent = names[i].charAt(0).toUpperCase() + names[i].slice(1);
      if (names[i] === state.baseSkin && !state.isCustom) opt.selected = true;
      optBuiltin.appendChild(opt);
    }
    sel.appendChild(optBuiltin);

    // Custom group
    var customNames = Object.keys(state.customSkins);
    if (customNames.length > 0) {
      var optCustom = document.createElement('optgroup');
      optCustom.label = 'Custom Skins';
      for (var j = 0; j < customNames.length; j++) {
        var opt2 = document.createElement('option');
        opt2.value = 'custom:' + customNames[j];
        opt2.textContent = '\u2B50 ' + customNames[j];
        if (customNames[j] === state.baseSkin && state.isCustom) opt2.selected = true;
        optCustom.appendChild(opt2);
      }
      sel.appendChild(optCustom);
    }
  }

  function renderStops() {
    var container = document.getElementById('skin-editor-stops');
    if (!container) return;
    container.innerHTML = '';

    for (var i = 0; i < 3; i++) {
      (function (idx) {
        var color = state.stops[idx];
        var col = document.createElement('div');
        col.className = 'col-12 col-md-4';
        col.innerHTML =
          '<div class="card border-0 shadow-sm h-100">' +
            '<div class="card-body p-3">' +
              '<div class="d-flex align-items-center justify-content-between mb-2">' +
                '<span class="fw-semibold small">' + STOP_LABELS[idx] + '</span>' +
                '<span class="font-monospace small text-body-secondary" id="stop-hex-' + idx + '">' + color + '</span>' +
              '</div>' +
              '<div style="height:56px;border-radius:8px;background:' + color + ';border:1px solid rgba(128,128,128,.15);margin-bottom:8px" id="stop-preview-' + idx + '"></div>' +
              '<div class="input-group input-group-sm">' +
                '<input type="color" class="form-control form-control-color" value="' + color + '" id="stop-color-' + idx + '" style="min-width:40px">' +
                '<input type="text" class="form-control font-monospace" value="' + color + '" id="stop-text-' + idx + '" maxlength="7">' +
              '</div>' +
            '</div>' +
          '</div>';
        container.appendChild(col);

        var colorInput = document.getElementById('stop-color-' + idx);
        var textInput = document.getElementById('stop-text-' + idx);

        colorInput.addEventListener('input', function () {
          state.stops[idx] = this.value;
          textInput.value = this.value;
          document.getElementById('stop-hex-' + idx).textContent = this.value;
          document.getElementById('stop-preview-' + idx).style.background = this.value;
          renderPreview();
          renderPalettes();
        });

        textInput.addEventListener('change', function () {
          var v = this.value.charAt(0) === '#' ? this.value : '#' + this.value;
          if (/^#[0-9a-fA-F]{6}$/.test(v)) {
            state.stops[idx] = v;
            colorInput.value = v;
            document.getElementById('stop-hex-' + idx).textContent = v;
            document.getElementById('stop-preview-' + idx).style.background = v;
            renderPreview();
            renderPalettes();
          }
        });
      })(i);
    }
  }

  function renderPreview() {
    var container = document.getElementById('skin-editor-preview');
    if (!container) return;
    var svg = gradientSVG(state.stops, state.filter);
    container.style.background = 'url("' + svgToUri(svg) + '") center/cover no-repeat';
  }

  function renderPalettes() {
    var container = document.getElementById('skin-editor-palettes');
    if (!container) return;
    if (!hasChroma()) {
      container.innerHTML = '<div class="alert alert-warning small"><i class="bi bi-exclamation-triangle me-1"></i>chroma.js not loaded — palette generation unavailable.</div>';
      return;
    }

    var html = '';

    // ─── Gradient scale ───
    var scaleColors = chroma.scale(state.stops).mode('lab').colors(11);
    html += '<h6 class="fw-semibold mt-2"><i class="bi bi-rainbow me-1"></i>Gradient Scale</h6>';
    html += '<div class="d-flex mb-3" style="height:32px;border-radius:8px;overflow:hidden;border:1px solid rgba(128,128,128,.15)">';
    for (var s = 0; s < scaleColors.length; s++) {
      html += '<div style="flex:1;background:' + scaleColors[s] + ';cursor:pointer" title="' + scaleColors[s] + '" onclick="navigator.clipboard.writeText(\'' + scaleColors[s] + '\')"></div>';
    }
    html += '</div>';

    // ─── Primary tints per stop ───
    html += '<h6 class="fw-semibold"><i class="bi bi-droplet-half me-1"></i>Primary Palette</h6>';
    html += '<p class="text-body-secondary small mb-2">Tints from each gradient stop — use for buttons, links, and badges.</p>';
    var aLabels = ['base', 'a10', 'a20', 'a30', 'a40', 'a50', 'a60'];
    for (var p = 0; p < 3; p++) {
      var stopTints = tints(state.stops[p], 6);
      html += '<div class="mb-3"><span class="small fw-semibold text-body-secondary">' + STOP_LABELS[p] + ' — <span class="font-monospace">' + state.stops[p] + '</span></span>';
      html += swatchRow([state.stops[p]].concat(stopTints), aLabels);
      html += '</div>';
    }

    // ─── Surface palette ───
    html += '<h6 class="fw-semibold mt-4"><i class="bi bi-layers me-1"></i>Surface Palette</h6>';
    html += '<p class="text-body-secondary small mb-2">Surface colors for cards, backgrounds, and panels.</p>';
    var darkest = state.stops.reduce(function (a, b) { return chroma(a).luminance() < chroma(b).luminance() ? a : b; });
    var surfaces = surfaceColors(darkest);
    html += swatchRow(surfaces, ['s10', 's20', 's30', 's40', 's50', 's60']);

    // ─── Tonal surface ───
    html += '<h6 class="fw-semibold mt-4"><i class="bi bi-vinyl me-1"></i>Tonal Surface</h6>';
    html += '<p class="text-body-secondary small mb-2">Surface tinted with the accent color.</p>';
    var tonal = tonalSurface(darkest, state.stops[1]);
    html += swatchRow(tonal, ['t10', 't20', 't30', 't40', 't50', 't60']);

    // ─── Semantic colors ───
    html += '<h6 class="fw-semibold mt-4"><i class="bi bi-check-circle me-1"></i>Semantic Colors</h6>';
    html += '<p class="text-body-secondary small mb-2">Auto-derived success, warning, danger, and info shades.</p>';
    var sem = semanticPalette(state.stops[0]);
    var semLabels = ['a10', 'a20', 'a30'];
    var semTypes = [
      { key: 'success', icon: 'check-circle-fill', color: '#198754' },
      { key: 'warning', icon: 'exclamation-triangle-fill', color: '#ffc107' },
      { key: 'danger',  icon: 'x-circle-fill', color: '#dc3545' },
      { key: 'info',    icon: 'info-circle-fill', color: '#0dcaf0' }
    ];
    html += '<div class="row g-3">';
    for (var t = 0; t < semTypes.length; t++) {
      var st = semTypes[t];
      html += '<div class="col-6">';
      html += '<div class="d-flex align-items-center gap-1 mb-1"><i class="bi bi-' + st.icon + '" style="color:' + st.color + '"></i><span class="small fw-semibold">' + st.key.charAt(0).toUpperCase() + st.key.slice(1) + '</span></div>';
      html += swatchRow(sem[st.key], semLabels);
      html += '</div>';
    }
    html += '</div>';

    container.innerHTML = html;
  }

  function renderFilters() {
    var container = document.getElementById('skin-editor-filters');
    if (!container) return;

    var filters = [
      { key: 'freq',    label: 'Base Frequency',     min: 0.001, max: 0.02,  step: 0.001, val: state.filter.freq },
      { key: 'oct',     label: 'Octaves',            min: 1,     max: 8,     step: 1,     val: state.filter.oct },
      { key: 'seed',    label: 'Noise Seed',         min: 0,     max: 100,   step: 1,     val: state.filter.seed },
      { key: 'scale',   label: 'Displacement Scale', min: 0,     max: 150,   step: 5,     val: state.filter.scale },
      { key: 'opacity', label: 'Overlay Opacity',    min: 0,     max: 1,     step: 0.05,  val: state.filter.opacity }
    ];

    var html = '<div class="row g-3">';
    for (var i = 0; i < filters.length; i++) {
      var f = filters[i];
      html += '<div class="col-12 col-md-6">' +
        '<label class="form-label small fw-semibold d-flex justify-content-between">' + f.label +
        ' <span class="text-body-secondary font-monospace" id="filter-val-' + f.key + '">' + f.val + '</span></label>' +
        '<input type="range" class="form-range" id="filter-' + f.key + '" min="' + f.min + '" max="' + f.max + '" step="' + f.step + '" value="' + f.val + '">' +
      '</div>';
    }
    // Pattern size
    html += '<div class="col-12 col-md-6">' +
      '<label class="form-label small fw-semibold d-flex justify-content-between">Pattern Tile Size' +
      ' <span class="text-body-secondary font-monospace" id="filter-val-patternSize">' + state.patternSize + 'px</span></label>' +
      '<input type="range" class="form-range" id="filter-patternSize" min="20" max="100" step="2" value="' + state.patternSize + '">' +
    '</div>';
    html += '</div>';

    container.innerHTML = html;

    // Bind filter slider events
    for (var j = 0; j < filters.length; j++) {
      (function (f) {
        var input = document.getElementById('filter-' + f.key);
        if (!input) return;
        input.addEventListener('input', function () {
          state.filter[f.key] = parseFloat(this.value);
          document.getElementById('filter-val-' + f.key).textContent = this.value;
          renderPreview();
        });
      })(filters[j]);
    }

    var pInput = document.getElementById('filter-patternSize');
    if (pInput) {
      pInput.addEventListener('input', function () {
        state.patternSize = parseInt(this.value, 10);
        document.getElementById('filter-val-patternSize').textContent = this.value + 'px';
      });
    }
  }

  /* ===================================================================
   * Load a skin into the editor
   * =================================================================== */
  function loadSkin(name, isCustom) {
    var def = isCustom ? state.customSkins[name] : BUILTIN_SKINS[name];
    if (!def) return;
    state.baseSkin = name;
    state.isCustom = !!isCustom;
    state.stops = def.stops.slice();
    state.filter = { freq: def.filter.freq, oct: def.filter.oct, seed: def.filter.seed, scale: def.filter.scale, opacity: def.filter.opacity };
    state.patternSize = def.patternSize;
    renderStops();
    renderPreview();
    renderPalettes();
    renderFilters();
  }

  /* ===================================================================
   * Export helpers
   * =================================================================== */
  function downloadFile(filename, content, type) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportSVGs() {
    var name = state.baseSkin || 'custom';
    downloadFile(name + '-gradient.svg', gradientSVG(state.stops, state.filter), 'image/svg+xml');
    setTimeout(function () {
      downloadFile(name + '-pattern.svg', patternSVG(state.stops, state.patternSize), 'image/svg+xml');
    }, 300);
    toast('SVG files downloaded');
  }

  function exportCSS() {
    var gUri = svgToUri(gradientSVG(state.stops, state.filter));
    var pUri = svgToUri(patternSVG(state.stops, state.patternSize));
    var css = '/* Custom skin: ' + state.baseSkin + ' */\n' +
      '[data-theme-skin="' + state.baseSkin + '"] {\n' +
      '  --zer0-bg-gradient: url("' + gUri + '");\n' +
      '  --zer0-bg-pattern: url("' + pUri + '");\n' +
      '  --zer0-bg-pattern-size: ' + state.patternSize + 'px ' + state.patternSize + 'px;\n' +
      '}\n';
    navigator.clipboard.writeText(css).then(function () { toast('CSS copied to clipboard'); });
  }

  /* ===================================================================
   * Event handlers
   * =================================================================== */
  function setupEvents() {
    // Select change → load skin
    var sel = document.getElementById('skin-editor-select');
    if (sel) sel.addEventListener('change', function () {
      var val = this.value;
      if (val.indexOf('custom:') === 0) {
        loadSkin(val.slice(7), true);
      } else {
        loadSkin(val, false);
      }
    });

    // Save
    var saveBtn = document.getElementById('skin-editor-save');
    if (saveBtn) saveBtn.addEventListener('click', function () {
      var name = prompt('Name this custom skin:', state.baseSkin + '-custom');
      if (name && name.trim()) {
        var clean = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        saveCustom(clean);
        populateSelect();
        // Select the newly saved one
        var newSel = document.getElementById('skin-editor-select');
        if (newSel) newSel.value = 'custom:' + clean;
        state.baseSkin = clean;
        state.isCustom = true;
        toast('Saved "' + clean + '"');
      }
    });

    // Delete
    var deleteBtn = document.getElementById('skin-editor-delete');
    if (deleteBtn) deleteBtn.addEventListener('click', function () {
      var selVal = document.getElementById('skin-editor-select');
      if (!selVal) return;
      var val = selVal.value;
      if (val.indexOf('custom:') === 0) {
        var cName = val.slice(7);
        if (confirm('Delete custom skin "' + cName + '"?')) {
          deleteCustom(cName);
          loadSkin('aqua', false);
          populateSelect();
          toast('Deleted "' + cName + '"');
        }
      } else {
        toast('Cannot delete built-in skins');
      }
    });

    // Random
    var randBtn = document.getElementById('skin-editor-random');
    if (randBtn) randBtn.addEventListener('click', function () {
      if (hasChroma()) {
        var baseHue = Math.random() * 360;
        state.stops = [
          chroma.hsl(baseHue, 0.65 + Math.random() * 0.2, 0.3 + Math.random() * 0.15).hex(),
          chroma.hsl((baseHue + 25 + Math.random() * 20) % 360, 0.55 + Math.random() * 0.2, 0.45 + Math.random() * 0.15).hex(),
          chroma.hsl((baseHue + 50 + Math.random() * 30) % 360, 0.4 + Math.random() * 0.2, 0.65 + Math.random() * 0.15).hex()
        ];
        state.filter.seed = Math.floor(Math.random() * 100);
      } else {
        state.stops = [
          '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
          '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
          '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
        ];
      }
      renderStops();
      renderPreview();
      renderPalettes();
      renderFilters();
    });

    // Reset to built-in
    var resetBtn = document.getElementById('skin-editor-reset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      var original = state.isCustom ? 'aqua' : state.baseSkin;
      loadSkin(original, false);
      resetLive(original);
      populateSelect();
    });

    // Apply live
    var applyBtn = document.getElementById('skin-editor-apply');
    if (applyBtn) applyBtn.addEventListener('click', applyLive);

    // Export SVGs
    var exportSvgBtn = document.getElementById('skin-editor-export-svg');
    if (exportSvgBtn) exportSvgBtn.addEventListener('click', exportSVGs);

    // Export CSS
    var exportCssBtn = document.getElementById('skin-editor-export-css');
    if (exportCssBtn) exportCssBtn.addEventListener('click', exportCSS);
  }

  /* ===================================================================
   * Initialization
   * =================================================================== */
  function init() {
    if (!document.getElementById('pane-skin-editor')) return;

    loadCustom();

    // Start with whatever skin is currently active
    var current = (typeof zer0Bg !== 'undefined') ? zer0Bg.currentSkin() : 'aqua';
    if (BUILTIN_SKINS[current]) {
      state.baseSkin = current;
      state.stops = BUILTIN_SKINS[current].stops.slice();
      state.filter = { freq: BUILTIN_SKINS[current].filter.freq, oct: BUILTIN_SKINS[current].filter.oct, seed: BUILTIN_SKINS[current].filter.seed, scale: BUILTIN_SKINS[current].filter.scale, opacity: BUILTIN_SKINS[current].filter.opacity };
      state.patternSize = BUILTIN_SKINS[current].patternSize;
    }

    populateSelect();
    renderStops();
    renderPreview();
    renderPalettes();
    renderFilters();
    setupEvents();

    console.log('[skin-editor] Initialized with skin:', state.baseSkin);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-sync when skin changes from outside (quick skin bar, etc.)
  document.addEventListener('zer0:skin-change', function (e) {
    var name = e.detail && e.detail.skin;
    if (name && BUILTIN_SKINS[name] && name !== state.baseSkin) {
      loadSkin(name, false);
      populateSelect();
    }
  });

  // Expose API for integration with other modules
  window.skinEditor = {
    applyLive: applyLive,
    resetLive: resetLive,
    getState: function () { return JSON.parse(JSON.stringify(state)); },
    BUILTIN_SKINS: BUILTIN_SKINS
  };

})();
