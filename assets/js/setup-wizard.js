// Feature: ZER0-067
/**
 * ===================================================================
 * Setup Wizard — _config.yml Generator
 * ===================================================================
 *
 * Reads form inputs from the wizard include, builds a YAML string,
 * and offers Download / Copy actions.  Pure vanilla JS, no deps
 * beyond Bootstrap 5 (already on the page).
 *
 * The step container's stable height is NOT handled here. `.wizard-panes` is a
 * CSS grid with every pane in one cell, so the browser sizes it to the tallest
 * pane on every reflow. An earlier measurePanes() did this in JS — un-hiding
 * each pane, reading offsetHeight, restoring it — and came back ~16px short,
 * which put the shortest step's Back/Next 16px above everyone else's.
 *
 * T-040 / #408 added, in the order the pieces depend on each other:
 *   1. updatePreview()  — now fires on every input anywhere in the wizard,
 *                         not just on entering step 5, because the preview is
 *                         a persistent panel rather than a step-5 element.
 *   2. validateField()  — email/URL checked on blur, `is-invalid` + a message;
 *                         cleared as soon as the user types again.
 *   3. saveDraft()      — every value mirrored to localStorage under
 *                         `zer0-setup-draft`, debounced 300ms, restored on
 *                         load, acknowledged by the "Draft saved" chip, and
 *                         cleared when the file is downloaded.
 *   4. refreshStepper() — the vertical stepper's done/active/locked state. A
 *                         step is locked until every EARLIER step validates;
 *                         going back is always allowed.
 *
 * Everything degrades: localStorage failures (private mode, quota) are
 * swallowed, and a missing element short-circuits rather than throwing.
 *
 * ===================================================================
 */

(function () {
  'use strict';

  var DRAFT_KEY = 'zer0-setup-draft';
  var DRAFT_DEBOUNCE_MS = 300;

  // Step order is the source of truth for "earlier" / "later" in the stepper.
  var STEP_IDS = ['tab-identity', 'tab-urls', 'tab-collections', 'tab-analytics', 'tab-review'];

  var draftTimer = null;
  var chipTimer = null;
  var restoring = false; // suppresses draft writes while we replay a draft

  // ── helpers ────────────────────────────────────────────────────────

  /**
   * Escape a YAML scalar string value (wrap in quotes if needed).
   * Multi-line input (e.g., textarea newlines) is intentionally collapsed to
   * a single line with spaces so the generated _config.yml remains valid YAML.
   * All form fields in this wizard expect single-line values.
   */
  function yamlValue(val) {
    if (val === '' || val === null || val === undefined) return '""';

    // Normalize newlines and collapse whitespace to keep scalar values single-line
    var normalized = String(val)
      .replace(/\r\n|\r|\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (normalized === '') return '""';
    if (normalized === 'true' || normalized === 'false') return normalized;
    if (/^[0-9]+$/.test(normalized)) return normalized;
    // Wrap in quotes if it contains special chars
    if (/[:#{}[\],&*?|>!%@`]/.test(normalized) || normalized.includes("'") || normalized.includes('"')) {
      return '"' + normalized.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    }
    return '"' + normalized + '"';
  }

  /** Pad a YAML key to 25 chars for alignment. */
  function pad(key, width) {
    width = width || 25;
    return (key + ' '.repeat(width)).slice(0, width);
  }

  /** Return the permalink pattern for a given collection name. */
  function collectionPermalink(col) {
    switch (col) {
      case 'posts':  return '/posts/:title/';
      case 'docs':   return '/docs/:path/';
      case 'about':  return '/about/:path/';
      default:       return '/' + col + '/:path/';
    }
  }

  // ── YAML builder ──────────────────────────────────────────────────

  function buildYAML() {
    var fields = {};

    // Read simple fields
    document.querySelectorAll('.cfg-field').forEach(function (el) {
      var key = el.getAttribute('data-key');
      if (!key) return;
      var val = (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')
        ? el.value.trim()
        : el.value.trim();
      if (val) fields[key] = val;
    });

    // Read collection toggles
    var collections = [];
    document.querySelectorAll('.cfg-collection').forEach(function (el) {
      if (el.checked) {
        collections.push(el.getAttribute('data-col'));
      }
    });

    // Read PostHog toggle
    var posthogEnabled = document.getElementById('cfg-posthog-enabled');
    var posthogOn = posthogEnabled && posthogEnabled.checked;

    // Build YAML
    var lines = [];
    lines.push('# =============================================================================');
    lines.push('# Site Configuration — generated by Setup Wizard');
    lines.push('# Docs: https://jekyllrb.com/docs/configuration/');
    lines.push('# =============================================================================');
    lines.push('');

    // Site Identity
    lines.push('# ── Site Identity ──────────────────────────────────────────────────');
    lines.push(pad('title') + ': ' + yamlValue(fields.title || 'My Site'));
    if (fields.subtitle) {
      lines.push(pad('subtitle') + ': ' + yamlValue(fields.subtitle));
    }
    lines.push(pad('description') + ': ' + yamlValue(fields.description || ''));
    lines.push(pad('founder') + ': ' + yamlValue(fields.founder || ''));
    if (fields.email) {
      lines.push(pad('email') + ': ' + yamlValue(fields.email));
    }
    lines.push('');

    // GitHub
    lines.push('# ── GitHub ─────────────────────────────────────────────────────────');
    var ghUser = fields.github_user || 'your-username';
    var repoName = fields.repository_name || (ghUser !== 'your-username' ? ghUser + '-site' : 'my-site');
    lines.push(pad('github_user') + ': &github_user ' + yamlValue(ghUser));
    lines.push(pad('repository_name') + ': &github_repository ' + yamlValue(repoName));
    lines.push('');

    // URLs
    lines.push('# ── URLs & Deployment ──────────────────────────────────────────────');
    lines.push(pad('url') + ': ' + yamlValue(fields.url || 'https://' + ghUser + '.github.io'));
    lines.push(pad('baseurl') + ': ' + yamlValue(fields.baseurl || ''));
    lines.push(pad('remote_theme') + ': ' + yamlValue(fields.remote_theme || 'bamr87/zer0-mistakes'));
    lines.push(pad('permalink') + ': ' + (fields.permalink || '/:categories/:title/'));
    lines.push(pad('port') + ': 4000');
    lines.push('');

    // Collections
    lines.push('# ── Collections ────────────────────────────────────────────────────');
    lines.push('collections:');
    collections.forEach(function (col) {
      lines.push('  ' + col + ':');
      lines.push('    output: true');
      lines.push('    permalink: ' + collectionPermalink(col));
    });
    lines.push('');

    // Defaults
    lines.push('# ── Default Front Matter ───────────────────────────────────────────');
    lines.push('defaults:');
    if (collections.indexOf('posts') !== -1) {
      lines.push('  - scope:');
      lines.push('      path: ""');
      lines.push('      type: "posts"');
      lines.push('    values:');
      lines.push('      layout: "article"');
      lines.push('      author: "default"');
    }
    if (collections.indexOf('docs') !== -1) {
      lines.push('  - scope:');
      lines.push('      path: ""');
      lines.push('      type: "docs"');
      lines.push('    values:');
      lines.push('      layout: "default"');
    }
    if (collections.indexOf('about') !== -1) {
      lines.push('  - scope:');
      lines.push('      path: ""');
      lines.push('      type: "about"');
      lines.push('    values:');
      lines.push('      layout: "default"');
    }
    lines.push('  - scope:');
    lines.push('      path: ""');
    lines.push('      type: "pages"');
    lines.push('    values:');
    lines.push('      layout: "default"');
    lines.push('');

    // Build settings
    lines.push('# ── Build ──────────────────────────────────────────────────────────');
    lines.push(pad('markdown') + ': kramdown');
    lines.push(pad('highlighter') + ': rouge');
    lines.push(pad('public_folder') + ': assets');
    lines.push('');

    // Plugins
    lines.push('# ── Plugins ────────────────────────────────────────────────────────');
    lines.push('plugins:');
    lines.push('  - jekyll-feed');
    lines.push('  - jekyll-sitemap');
    lines.push('  - jekyll-seo-tag');
    lines.push('  - jekyll-remote-theme');
    lines.push('');

    // Analytics
    lines.push('# ── Analytics ──────────────────────────────────────────────────────');
    if (fields.google_analytics) {
      lines.push(pad('google_analytics') + ': ' + yamlValue(fields.google_analytics));
    } else {
      lines.push(pad('google_analytics') + ': ""');
    }
    lines.push('posthog:');
    lines.push('  enabled: ' + (posthogOn ? 'true' : 'false'));
    lines.push('  api_key: ' + yamlValue(fields['posthog.api_key'] || ''));
    lines.push('');

    // Social
    if (fields.twitter_username || fields.linkedin_username) {
      lines.push('# ── Social ─────────────────────────────────────────────────────────');
      if (fields.twitter_username) {
        lines.push(pad('twitter_username') + ': ' + yamlValue(fields.twitter_username));
      }
      if (fields.linkedin_username) {
        lines.push(pad('linkedin_username') + ': ' + yamlValue(fields.linkedin_username));
      }
      lines.push('');
    }

    // Exclude
    lines.push('# ── Exclude from build ─────────────────────────────────────────────');
    lines.push('exclude:');
    lines.push('  - .sass-cache/');
    lines.push('  - .jekyll-cache/');
    lines.push('  - node_modules/');
    lines.push('  - vendor/');
    lines.push('  - Gemfile.lock');
    lines.push('  - scripts/');
    lines.push('  - test/');
    lines.push('  - templates/');
    lines.push('  - "*.log"');

    return lines.join('\n');
  }

  // ── inline validation ──────────────────────────────────────────────

  var VALIDATION_MESSAGES = {
    email: 'Enter a valid email address, e.g. you@example.com.',
    url: 'Enter a full URL including https://, e.g. https://example.com.'
  };

  /**
   * Validate one field. Empty is always OK — nothing in this wizard is
   * required, and flagging an untouched field as an error would be wrong.
   * Returns true when the field is acceptable.
   */
  function validateField(el) {
    if (!el || !el.classList.contains('cfg-field')) return true;
    var type = (el.getAttribute('type') || '').toLowerCase();
    if (type !== 'email' && type !== 'url') return true;

    var ok = el.value.trim() === '' || el.checkValidity();
    el.classList.toggle('is-invalid', !ok);

    var feedback = document.getElementById(el.id + '-feedback');
    if (feedback) feedback.textContent = ok ? '' : VALIDATION_MESSAGES[type];
    return ok;
  }

  /** Is every field inside this pane currently acceptable? */
  function paneIsValid(pane) {
    if (!pane) return true;
    var fields = pane.querySelectorAll('.cfg-field');
    for (var i = 0; i < fields.length; i += 1) {
      var el = fields[i];
      var type = (el.getAttribute('type') || '').toLowerCase();
      if (type !== 'email' && type !== 'url') continue;
      if (el.value.trim() !== '' && !el.checkValidity()) return false;
    }
    return true;
  }

  /** The recommended-but-empty fields, by their human label. */
  function unfilledRecommended() {
    var missing = [];
    document.querySelectorAll('[data-recommended]').forEach(function (el) {
      if (el.value.trim() === '') missing.push(el.getAttribute('data-recommended'));
    });
    return missing;
  }

  /** Render the Review step's warning list. */
  function renderReviewWarnings() {
    var host = document.getElementById('wizard-review-warnings');
    if (!host) return;
    var missing = unfilledRecommended();

    if (!missing.length) {
      host.innerHTML = '<div class="alert alert-success mb-0" role="alert">' +
        '<i class="bi bi-check2-circle"></i> Every recommended field is filled in.</div>';
      return;
    }

    var items = missing.map(function (name) {
      // Labels come from our own markup, but build the DOM through
      // textContent-equivalent escaping anyway rather than interpolating.
      var li = document.createElement('li');
      li.textContent = name;
      return li.outerHTML;
    }).join('');

    host.innerHTML = '<div class="alert alert-warning mb-0" role="alert">' +
      '<i class="bi bi-exclamation-triangle"></i> ' +
      '<strong>Recommended fields still empty.</strong> The file is valid without them, ' +
      'but filling them in improves SEO and the site chrome:' +
      '<ul class="mb-0 mt-2">' + items + '</ul></div>';
  }

  // ── stepper state ──────────────────────────────────────────────────

  /**
   * Recompute done / active / locked across the vertical stepper.
   *
   * Rule: a step is reachable when every EARLIER step validates. That makes
   * "Back is always allowed" fall out for free (earlier steps are, by
   * definition, behind a prefix that already validated) while stopping the
   * user from carrying a malformed email or URL forward.
   */
  function refreshStepper() {
    var buttons = STEP_IDS.map(function (id) { return document.getElementById(id); });
    var activeIndex = buttons.findIndex(function (b) {
      return b && b.classList.contains('is-active');
    });
    if (activeIndex < 0) activeIndex = 0;

    var blocked = false;
    buttons.forEach(function (btn, i) {
      if (!btn) return;
      var pane = document.querySelector(btn.getAttribute('data-bs-target'));
      var valid = paneIsValid(pane);

      var locked = blocked && i > activeIndex;
      btn.classList.toggle('is-active', i === activeIndex);
      btn.classList.toggle('is-done', i < activeIndex && valid);
      btn.classList.toggle('is-locked', locked);
      btn.disabled = locked;
      btn.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');

      var state = btn.querySelector('.wizard-step-state');
      if (state) {
        state.textContent = i === activeIndex ? 'current step'
          : locked ? 'locked until earlier steps are valid'
            : i < activeIndex && valid ? 'completed' : '';
      }

      if (!valid) blocked = true;
    });

    // A Next button cannot skip past a step that has not validated.
    document.querySelectorAll('.btn-next').forEach(function (btn) {
      var target = document.getElementById(btn.getAttribute('data-next'));
      btn.disabled = !!(target && target.disabled);
    });
  }

  // ── draft persistence ──────────────────────────────────────────────

  function collectDraft() {
    var data = { fields: {}, checks: {}, step: null };
    document.querySelectorAll('#setup-wizard .cfg-field').forEach(function (el) {
      if (el.id) data.fields[el.id] = el.value;
    });
    document.querySelectorAll('#setup-wizard input[type="checkbox"]').forEach(function (el) {
      if (el.id) data.checks[el.id] = el.checked;
    });
    var active = document.querySelector('#wizardTabs .wizard-step.is-active');
    if (active) data.step = active.id;
    return data;
  }

  function showDraftChip() {
    var chip = document.getElementById('wizard-draft-chip');
    if (!chip) return;
    chip.hidden = false;
    chip.classList.add('is-visible');
    clearTimeout(chipTimer);
    chipTimer = setTimeout(function () { chip.classList.remove('is-visible'); }, 2000);
  }

  function saveDraft() {
    if (restoring) return;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(function () {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraft()));
        showDraftChip();
      } catch (e) { /* private mode or quota — the wizard still works */ }
    }, DRAFT_DEBOUNCE_MS);
  }

  function clearDraft() {
    clearTimeout(draftTimer);
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
    var chip = document.getElementById('wizard-draft-chip');
    if (chip) { chip.classList.remove('is-visible'); chip.hidden = true; }
  }

  function restoreDraft() {
    var raw;
    try { raw = localStorage.getItem(DRAFT_KEY); } catch (e) { return; }
    if (!raw) return;

    var data;
    try { data = JSON.parse(raw); } catch (e) { clearDraft(); return; }
    if (!data || typeof data !== 'object') return;

    restoring = true;
    Object.keys(data.fields || {}).forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.classList.contains('cfg-field')) el.value = data.fields[id];
    });
    Object.keys(data.checks || {}).forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.type === 'checkbox') el.checked = !!data.checks[id];
    });

    // Re-enter the step the user left off on, but only if the draft still
    // validates up to there — otherwise a saved bad value could strand them
    // on a step the stepper would refuse to unlock.
    var target = data.step && STEP_IDS.indexOf(data.step) !== -1
      ? document.getElementById(data.step) : null;
    if (target && !target.disabled) showStep(target);

    restoring = false;
  }

  // ── actions ────────────────────────────────────────────────────────

  function updatePreview() {
    var preview = document.getElementById('yaml-preview');
    if (preview) {
      preview.textContent = buildYAML();
    }
  }

  /** Activate a step button, updating stepper state alongside Bootstrap's. */
  function showStep(btn) {
    if (!btn || btn.disabled) return;
    document.querySelectorAll('#wizardTabs .wizard-step').forEach(function (b) {
      b.classList.remove('is-active');
    });
    btn.classList.add('is-active');
    if (window.bootstrap && window.bootstrap.Tab) new bootstrap.Tab(btn).show();
    refreshStepper();
    if (btn.id === 'tab-review') renderReviewWarnings();
  }

  function downloadYAML() {
    var yaml = buildYAML();
    var blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '_config.yml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    // The draft exists to survive a reload mid-wizard. Once the file is in the
    // user's hands the wizard is finished, so the draft is stale, not useful.
    clearDraft();
  }

  function copyYAML() {
    var yaml = buildYAML();
    navigator.clipboard.writeText(yaml).then(function () {
      var btn = document.getElementById('btn-copy-full') || document.getElementById('btn-copy');
      if (btn) {
        var orig = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';
        setTimeout(function () { btn.innerHTML = orig; }, 2000);
      }
    });
  }

  // ── wiring ─────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    var wizard = document.getElementById('setup-wizard');
    if (!wizard) return;

    // Next / Prev buttons. Back is never blocked; Next is disabled by
    // refreshStepper() when the step it points at has not unlocked.
    wizard.querySelectorAll('.btn-next').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showStep(document.getElementById(btn.getAttribute('data-next')));
      });
    });

    wizard.querySelectorAll('.btn-prev').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showStep(document.getElementById(btn.getAttribute('data-prev')));
      });
    });

    // Clicking a stepper entry directly.
    wizard.querySelectorAll('#wizardTabs .wizard-step').forEach(function (btn) {
      btn.addEventListener('click', function () { showStep(btn); });
    });

    // The preview is persistent now, so it regenerates on EVERY input rather
    // than on entering step 5. Delegated, so fields added later are covered.
    wizard.addEventListener('input', function (event) {
      var el = event.target;
      updatePreview();
      // Typing clears a previous error rather than nagging mid-entry; the
      // re-check happens on blur.
      if (el.classList && el.classList.contains('is-invalid')) validateField(el);
      saveDraft();
    });

    wizard.addEventListener('change', function () {
      updatePreview();
      refreshStepper();
      saveDraft();
    });

    // Validate email / URL on blur (capture: `blur` does not bubble).
    wizard.addEventListener('blur', function (event) {
      if (!event.target.classList || !event.target.classList.contains('cfg-field')) return;
      validateField(event.target);
      refreshStepper();
    }, true);

    // Description char count
    var descField = document.getElementById('cfg-description');
    var descCount = document.getElementById('desc-count');
    if (descField && descCount) {
      var syncCount = function () { descCount.textContent = descField.value.length; };
      descField.addEventListener('input', syncCount);
      descCount.textContent = descField.value.length;
    }

    // Download / Copy — always enabled, at every step.
    var dlBtn = document.getElementById('btn-download');
    if (dlBtn) dlBtn.addEventListener('click', downloadYAML);

    var copyBtn = document.getElementById('btn-copy');
    if (copyBtn) copyBtn.addEventListener('click', copyYAML);

    var copyFullBtn = document.getElementById('btn-copy-full');
    if (copyFullBtn) copyFullBtn.addEventListener('click', copyYAML);

    // Order matters: restore values first so the initial preview and stepper
    // state both reflect the real content.
    restoreDraft();
    if (descField && descCount) descCount.textContent = descField.value.length;
    updatePreview();
    refreshStepper();

    // No pane measurement and no resize listener: the grid in
    // _setup-wizard.scss keeps `#wizardTabContent` as tall as the tallest pane
    // at every width, without JS having to be told the width changed.
  });

})();
