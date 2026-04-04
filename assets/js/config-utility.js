/**
 * ===================================================================
 * Configuration Utility — Interactive Config Viewer & Editor
 * ===================================================================
 *
 * Powers the /about/config/ page with:
 *   - Search / filter across all config keys
 *   - Copy individual values or entire sections
 *   - Live YAML preview from the editor form
 *   - Import / export configuration
 *
 * Dependencies: Bootstrap 5 (already on page)
 * ===================================================================
 */

(function () {
  'use strict';

  /* ── helpers ──────────────────────────────────────────────────────── */

  /** Safe clipboard write with visual feedback on a button. */
  function copyToClipboard(text, btn) {
    if (!btn) return;
    var orig = btn.innerHTML;
    navigator.clipboard.writeText(text).then(function () {
      btn.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';
      btn.classList.replace('btn-outline-secondary', 'btn-success');
      setTimeout(function () {
        btn.innerHTML = orig;
        btn.classList.replace('btn-success', 'btn-outline-secondary');
      }, 1800);
    }).catch(function () {
      /* fallback */
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (_) { /* noop */ }
      document.body.removeChild(ta);
      btn.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';
      setTimeout(function () { btn.innerHTML = orig; }, 1800);
    });
  }

  /* ── search / filter ─────────────────────────────────────────────── */

  function initSearch() {
    var input = document.getElementById('cfg-search');
    if (!input) return;

    input.addEventListener('input', function () {
      var q = input.value.toLowerCase().trim();
      var rows = document.querySelectorAll('.cfg-row');
      var sections = document.querySelectorAll('.cfg-section');

      if (!q) {
        rows.forEach(function (r) { r.style.display = ''; });
        sections.forEach(function (s) { s.style.display = ''; });
        return;
      }

      rows.forEach(function (r) {
        var key = (r.getAttribute('data-key') || '').toLowerCase();
        var val = (r.getAttribute('data-value') || '').toLowerCase();
        r.style.display = (key.indexOf(q) !== -1 || val.indexOf(q) !== -1) ? '' : 'none';
      });

      /* hide sections that have zero visible rows */
      sections.forEach(function (s) {
        var visible = s.querySelectorAll('.cfg-row:not([style*="display: none"])');
        s.style.display = visible.length ? '' : 'none';
      });
    });

    /* clear button */
    var clearBtn = document.getElementById('cfg-search-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        input.value = '';
        input.dispatchEvent(new Event('input'));
        input.focus();
      });
    }
  }

  /* ── copy individual value buttons ───────────────────────────────── */

  function initCopyButtons() {
    document.querySelectorAll('.cfg-copy-val').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val = btn.getAttribute('data-value') || '';
        copyToClipboard(val, btn);
      });
    });
  }

  /* ── copy section YAML ───────────────────────────────────────────── */

  function initSectionCopy() {
    document.querySelectorAll('.cfg-copy-section').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sectionId = btn.getAttribute('data-section');
        var section = document.getElementById(sectionId);
        if (!section) return;
        var rows = section.querySelectorAll('.cfg-row');
        var lines = [];
        rows.forEach(function (r) {
          var key = r.getAttribute('data-key') || '';
          var val = r.getAttribute('data-value') || '';
          lines.push(key + ': ' + val);
        });
        copyToClipboard(lines.join('\n'), btn);
      });
    });
  }

  /* ── copy full config ────────────────────────────────────────────── */

  function initFullCopy() {
    var btn = document.getElementById('cfg-copy-full');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var pre = document.getElementById('cfg-full-yaml');
      if (pre) copyToClipboard(pre.textContent, btn);
    });
  }

  /* ── expand / collapse all ───────────────────────────────────────── */

  function initExpandCollapse() {
    var expandBtn = document.getElementById('cfg-expand-all');
    var collapseBtn = document.getElementById('cfg-collapse-all');

    if (expandBtn) {
      expandBtn.addEventListener('click', function () {
        document.querySelectorAll('#configAccordion .accordion-collapse').forEach(function (el) {
          el.classList.add('show');
        });
        document.querySelectorAll('#configAccordion .accordion-button').forEach(function (el) {
          el.classList.remove('collapsed');
          el.setAttribute('aria-expanded', 'true');
        });
      });
    }

    if (collapseBtn) {
      collapseBtn.addEventListener('click', function () {
        document.querySelectorAll('#configAccordion .accordion-collapse').forEach(function (el) {
          el.classList.remove('show');
        });
        document.querySelectorAll('#configAccordion .accordion-button').forEach(function (el) {
          el.classList.add('collapsed');
          el.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  /* ── editor: YAML builder ────────────────────────────────────────── */

  function yamlEscape(val) {
    if (val === '' || val === null || val === undefined) return '""';
    var s = String(val).replace(/\r\n|\r|\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
    if (s === '') return '""';
    if (s === 'true' || s === 'false') return s;
    if (/^-?[0-9]+(\.[0-9]+)?$/.test(s)) return s;
    if (/[:#{}[\],&*?|>!%@`'"]/.test(s)) {
      return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    }
    return '"' + s + '"';
  }

  function pad(k, w) { w = w || 26; return (k + ' '.repeat(w)).slice(0, w); }

  function buildEditorYAML() {
    var f = {};
    document.querySelectorAll('#configEditor .edit-field').forEach(function (el) {
      var key = el.getAttribute('data-key');
      if (!key) return;
      f[key] = el.type === 'checkbox' ? el.checked : el.value.trim();
    });

    var lines = [];
    lines.push('# ===========================================================================');
    lines.push('# _config.yml — generated by Configuration Utility');
    lines.push('# ===========================================================================');
    lines.push('');

    lines.push('# ── Site Identity ─────────────────────────────────────────────────');
    lines.push(pad('title') + ': ' + yamlEscape(f.title || ''));
    lines.push(pad('founder') + ': ' + yamlEscape(f.founder || ''));
    lines.push(pad('email') + ': ' + yamlEscape(f.email || ''));
    lines.push(pad('description') + ': ' + yamlEscape(f.description || ''));
    lines.push('');

    lines.push('# ── GitHub ────────────────────────────────────────────────────────');
    lines.push(pad('github_user') + ': ' + yamlEscape(f.github_user || ''));
    lines.push(pad('repository_name') + ': ' + yamlEscape(f.repository_name || ''));
    lines.push(pad('branch') + ': ' + yamlEscape(f.branch || 'main'));
    lines.push('');

    lines.push('# ── URLs & Deployment ─────────────────────────────────────────────');
    lines.push(pad('url') + ': ' + yamlEscape(f.url || ''));
    lines.push(pad('baseurl') + ': ' + yamlEscape(f.baseurl || ''));
    lines.push(pad('remote_theme') + ': ' + yamlEscape(f.remote_theme || 'bamr87/zer0-mistakes'));
    lines.push(pad('port') + ': ' + (f.port || '4000'));
    lines.push(pad('permalink') + ': ' + (f.permalink || 'pretty'));
    lines.push('');

    lines.push('# ── Personalization ───────────────────────────────────────────────');
    lines.push(pad('locale') + ': ' + yamlEscape(f.locale || 'en-US'));
    lines.push(pad('theme_skin') + ': ' + yamlEscape(f.theme_skin || 'dark'));
    if (f.logo) lines.push(pad('logo') + ': ' + yamlEscape(f.logo));
    lines.push('');

    lines.push('# ── Analytics ─────────────────────────────────────────────────────');
    if (f.google_analytics) {
      lines.push(pad('google_analytics') + ': ' + yamlEscape(f.google_analytics));
    }
    lines.push('posthog:');
    lines.push('  enabled: ' + (f['posthog.enabled'] ? 'true' : 'false'));
    if (f['posthog.api_key']) {
      lines.push('  api_key: ' + yamlEscape(f['posthog.api_key']));
    }
    lines.push('');

    lines.push('# ── Build ─────────────────────────────────────────────────────────');
    lines.push(pad('markdown') + ': kramdown');
    lines.push(pad('highlighter') + ': rouge');
    lines.push('');

    lines.push('# ── Plugins ───────────────────────────────────────────────────────');
    lines.push('plugins:');
    lines.push('  - github-pages');
    lines.push('  - jekyll-remote-theme');
    lines.push('  - jekyll-feed');
    lines.push('  - jekyll-sitemap');
    lines.push('  - jekyll-seo-tag');

    return lines.join('\n');
  }

  function initEditor() {
    var preview = document.getElementById('editor-yaml-preview');
    if (!preview) return;

    function update() { preview.textContent = buildEditorYAML(); }

    document.querySelectorAll('#configEditor .edit-field').forEach(function (el) {
      el.addEventListener('input', update);
      el.addEventListener('change', update);
    });

    /* download */
    var dlBtn = document.getElementById('editor-download');
    if (dlBtn) {
      dlBtn.addEventListener('click', function () {
        var yaml = buildEditorYAML();
        var blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = '_config.yml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    }

    /* copy */
    var cpBtn = document.getElementById('editor-copy');
    if (cpBtn) {
      cpBtn.addEventListener('click', function () {
        copyToClipboard(buildEditorYAML(), cpBtn);
      });
    }

    /* initial render */
    update();
  }

  /* ── description char counter ────────────────────────────────────── */

  function initCharCounters() {
    document.querySelectorAll('[data-char-counter]').forEach(function (el) {
      var counter = document.getElementById(el.getAttribute('data-char-counter'));
      if (!counter) return;
      function upd() { counter.textContent = el.value.length; }
      el.addEventListener('input', upd);
      upd();
    });
  }

  /* ── wiring ──────────────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    initSearch();
    initCopyButtons();
    initSectionCopy();
    initFullCopy();
    initExpandCollapse();
    initEditor();
    initCharCounters();
  });
})();
