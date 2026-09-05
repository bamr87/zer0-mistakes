// Feature: ZER0-067, ZER0-085
/**
 * ===================================================================
 * Site Builder — form, generators, drafts (setup-wizard.js)
 * ===================================================================
 *
 * File:    assets/js/setup-wizard.js
 * Markup:  _includes/setup/wizard.html (+ setup/prereq-checklist.html)
 * Styles:  _sass/components/_setup-wizard.scss
 * Data:    #siteBuilderData — _data/site_builder.yml serialised as JSON
 *
 * This half of the Site Builder is pure client-side and works everywhere the
 * theme renders, GitHub Pages included. It owns:
 *
 *   1. The stepper (done / active / locked), Back / Next, URL hash → step.
 *   2. Every form control, inline validation (email / URL on blur) and the
 *      Review warnings for recommended-but-empty fields.
 *   3. The navigation editor and the "kind of site" quick-pick.
 *   4. The generated project — _config.yml, _config_dev.yml, Gemfile,
 *      docker-compose.yml, index.md, navigation, about page, welcome post,
 *      collection index pages, .gitignore, zer0.install.yml, .env.example,
 *      README — regenerated on every input and shown in the file preview.
 *   5. Per-file copy / download and a self-extracting bash bundle.
 *   6. Draft persistence: every value mirrored to localStorage under
 *      `zer0-setup-draft` (debounced 300ms, flushed on pagehide), restored
 *      on load, cleared by "Start over" or a successful project write.
 *   7. A small public API on window.Zer0SetupWizard that the Claude session
 *      (assets/js/site-builder.js) drives: read state, patch fields, override
 *      a generated file, jump steps, record prerequisite check results,
 *      subscribe to changes. Context therefore flows one way — the form is
 *      the single source of truth and everything else observes it.
 *
 * Stable-height contract (T-040 / #408): `.wizard-panes` is a CSS grid with
 * every pane in one cell, so no JS measurement is needed here — see the SCSS.
 *
 * Everything degrades: localStorage failures are swallowed, a missing element
 * short-circuits, and the wizard never throws on a partial DOM.
 * ===================================================================
 */

(function () {
  'use strict';

  var DRAFT_KEY = 'zer0-setup-draft';
  var DRAFT_DEBOUNCE_MS = 300;
  var DRAFT_VERSION = 2;

  var wizard = document.getElementById('setup-wizard');
  if (!wizard) return;

  function readJSON(id, fallback) {
    var el = document.getElementById(id);
    if (!el) return fallback;
    try { return JSON.parse(el.textContent); } catch (e) { return fallback; }
  }

  var DATA = readJSON('siteBuilderData', {}) || {};
  var DEFAULT_PORT = Number(wizard.getAttribute('data-default-port')) || 4000;

  // Step order is the source of truth for "earlier" / "later" in the stepper.
  var STEP_IDS = (DATA.steps || []).map(function (s) { return 'tab-' + s.id; });
  if (!STEP_IDS.length) {
    STEP_IDS = ['tab-connect', 'tab-prereqs', 'tab-identity', 'tab-urls', 'tab-structure',
      'tab-appearance', 'tab-voice', 'tab-integrations', 'tab-build'];
  }

  var draftTimer = null;
  var chipTimer = null;
  var restoring = false;      // suppresses draft writes while we replay a draft
  var listeners = {};         // event name → [callbacks]
  var overrides = {};         // generated path → content set by the user / Claude
  var checks = {};            // prerequisite id → {ok, output, version, manual}
  var activeFile = '_config.yml';
  var skinPreviewOriginal = null;

  // ── tiny event bus ────────────────────────────────────────────────

  function on(event, cb) {
    (listeners[event] = listeners[event] || []).push(cb);
    return function () {
      listeners[event] = (listeners[event] || []).filter(function (fn) { return fn !== cb; });
    };
  }

  function emit(event, payload) {
    (listeners[event] || []).forEach(function (cb) {
      try { cb(payload); } catch (e) { console.warn('Site Builder listener failed', e); }
    });
    try { wizard.dispatchEvent(new CustomEvent('zer0:wizard:' + event, { detail: payload })); } catch (e) { /* old browsers */ }
  }

  // ── YAML / text helpers ──────────────────────────────────────────

  /**
   * Quote a YAML scalar. Multi-line input is collapsed to one line — every
   * scalar the generators write is single-line by design (bodies go to
   * Markdown files, not to YAML values).
   */
  function y(val) {
    if (val === '' || val === null || val === undefined) return '""';
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'number') return String(val);
    var s = String(val).replace(/\r\n|\r|\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
    if (s === '') return '""';
    return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }

  function pad(key, width) {
    width = width || 25;
    return (key + ' '.repeat(width)).slice(0, Math.max(width, key.length + 1));
  }

  function slugify(text) {
    return String(text || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
  }

  function todayISO() {
    try { return new Date().toISOString().slice(0, 10); } catch (e) { return '2026-01-01'; }
  }

  function titleCase(id) {
    return String(id || '').replace(/[-_]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  // ── reading the form ─────────────────────────────────────────────

  function fieldEls() { return wizard.querySelectorAll('.cfg-field[data-key]'); }

  function readFields() {
    var fields = {};
    fieldEls().forEach(function (el) {
      var key = el.getAttribute('data-key');
      if (!key) return;
      var val = el.type === 'number' ? el.value.trim() : el.value.trim();
      if (val !== '') fields[key] = val;
    });
    wizard.querySelectorAll('.cfg-radio:checked').forEach(function (el) {
      var key = el.getAttribute('data-key');
      if (key) fields[key] = el.value;
    });
    wizard.querySelectorAll('.cfg-switch[data-key]').forEach(function (el) {
      fields[el.getAttribute('data-key')] = !!el.checked;
    });
    return fields;
  }

  function readCollections() {
    var out = [];
    wizard.querySelectorAll('.cfg-collection').forEach(function (el) {
      if (el.checked) {
        out.push({
          id: el.getAttribute('data-col'),
          layout: el.getAttribute('data-layout') || 'default',
          permalink: el.getAttribute('data-permalink') || ('/' + el.getAttribute('data-col') + '/:path/')
        });
      }
    });
    return out;
  }

  function readNavigation() {
    var rows = [];
    wizard.querySelectorAll('#nav-editor .nav-row').forEach(function (row) {
      var title = (row.querySelector('.nav-title') || {}).value || '';
      var url = (row.querySelector('.nav-url') || {}).value || '';
      var icon = (row.querySelector('.nav-icon') || {}).value || '';
      if (title.trim() || url.trim()) rows.push({ title: title.trim(), url: url.trim(), icon: icon.trim() });
    });
    return rows;
  }

  function catalog(name) { return Array.isArray(DATA[name]) ? DATA[name] : []; }

  function labelFor(list, id) {
    var hit = list.filter(function (x) { return x.id === id; })[0];
    return hit ? hit.label : titleCase(id);
  }

  function activeStepId() {
    var active = wizard.querySelector('#wizardTabs .wizard-step.is-active');
    return active ? active.id : STEP_IDS[0];
  }

  /** The full, serialisable wizard state — what Claude reads every turn. */
  function getState() {
    var f = readFields();
    var collections = readCollections();
    var slug = slugify(f.target || f.repository_name || f.title) || 'my-site';
    return {
      step: activeStepId().replace(/^tab-/, ''),
      fields: f,
      collections: collections.map(function (c) { return c.id; }),
      navigation: readNavigation(),
      checks: JSON.parse(JSON.stringify(checks)),
      target: f.target || slug,
      port: Number(f.port) || DEFAULT_PORT,
      overrides: Object.keys(overrides),
      recommendedMissing: unfilledRecommended()
    };
  }

  /** Compact prose summary for the Claude system prompt. */
  function getSummary() {
    var s = getState();
    var f = s.fields;
    var lines = [];
    lines.push('Current step: ' + s.step);
    lines.push('Title: ' + (f.title || '(empty)') + ' | Subtitle: ' + (f.subtitle || '(empty)') + ' | Tagline: ' + (f.tagline || '(empty)'));
    lines.push('Description: ' + (f.description || '(empty)'));
    lines.push('Brief: ' + (f.brief || '(empty)'));
    lines.push('Owner: ' + (f.founder || '(empty)') + ' <' + (f.email || 'no email') + '>');
    lines.push('GitHub: ' + (f.github_user || '(user?)') + '/' + (f.repository_name || '(repo?)') + ' | url: ' + (f.url || '(empty)') + ' | baseurl: ' + (f.baseurl || '""') + ' | theme via: ' + (f.deploy_target || 'github-pages') + ' | port: ' + s.port);
    lines.push('Site type: ' + (f.site_type || '(unset)') + ' | Collections: ' + (s.collections.join(', ') || 'none'));
    lines.push('Navigation: ' + (s.navigation.map(function (n) { return n.title + ' → ' + n.url; }).join('; ') || '(empty)'));
    lines.push('Appearance: skin=' + (f.theme_skin || 'air') + ' colour_mode=' + (f.color_mode_default || 'auto') + ' lock=' + !!f.color_mode_lock + ' backgrounds=' + (f.theme_background !== false) + ' icon=' + (f.title_icon || 'robot'));
    lines.push('Voice: tone=' + (f.tone || 'friendly') + ' audience=' + (f.audience || 'developers') + ' | welcome title: ' + (f.welcome_title || '(empty)') + ' | welcome body: ' + (f.welcome_body ? f.welcome_body.length + ' chars' : 'empty') + ' | about body: ' + (f.about_body ? f.about_body.length + ' chars' : 'empty'));
    var ints = catalog('integrations').map(function (i) { return i.id + '=' + (f['integration.' + i.id] ? 'on' : 'off'); });
    lines.push('Integrations: ' + ints.join(', ') + ' | GA: ' + (f.google_analytics || 'none') + ' | giscus ids: ' + (f['giscus.repo_id'] ? 'set' : 'unset'));
    var checkLines = Object.keys(s.checks).map(function (id) {
      var c = s.checks[id];
      return id + ':' + (c.manual ? 'done(manual)' : c.ok === true ? 'ok' + (c.version ? ' v' + c.version : '') : c.ok === false ? 'FAIL' : '?');
    });
    lines.push('Prerequisites: ' + (checkLines.join(', ') || 'not checked'));
    lines.push('Target folder: ' + s.target + ' | overwrite: ' + !!f.overwrite + ' | file overrides: ' + (s.overrides.join(', ') || 'none'));
    if (s.recommendedMissing.length) lines.push('Recommended fields still empty: ' + s.recommendedMissing.join(', '));
    return lines.join('\n');
  }

  /** What Claude may set: every data-key with its type, label and options. */
  function schema() {
    var out = [];
    var seen = {};
    function labelOf(el) {
      var lab = el.id ? wizard.querySelector('label[for="' + el.id + '"]') : null;
      if (lab) return lab.textContent.replace(/\s+/g, ' ').trim();
      var fs = el.closest('fieldset');
      var legend = fs ? fs.querySelector('legend') : null;
      return legend ? legend.textContent.replace(/\s+/g, ' ').trim() : el.getAttribute('data-key');
    }
    fieldEls().forEach(function (el) {
      var key = el.getAttribute('data-key');
      if (seen[key]) return;
      seen[key] = true;
      var entry = { key: key, label: labelOf(el), type: el.tagName === 'TEXTAREA' ? 'text (multi-line Markdown allowed)' : el.tagName === 'SELECT' ? 'choice' : (el.type || 'text') };
      if (el.tagName === 'SELECT') entry.options = Array.prototype.map.call(el.options, function (o) { return o.value; });
      out.push(entry);
    });
    var radioGroups = {};
    wizard.querySelectorAll('.cfg-radio[data-key]').forEach(function (el) {
      var key = el.getAttribute('data-key');
      if (!radioGroups[key]) {
        radioGroups[key] = { key: key, label: labelOf(el), type: 'choice', options: [] };
        out.push(radioGroups[key]);
      }
      radioGroups[key].options.push(el.value);
    });
    wizard.querySelectorAll('.cfg-switch[data-key]').forEach(function (el) {
      var key = el.getAttribute('data-key');
      if (seen[key]) return;
      seen[key] = true;
      out.push({ key: key, label: labelOf(el), type: 'boolean' });
    });
    out.push({ key: 'collections', label: 'Enabled collections', type: 'array of ids', options: catalog('collections').map(function (c) { return c.id; }) });
    out.push({ key: 'navigation', label: 'Main navigation', type: 'array of {title, url, icon?} (icon = Bootstrap icon class like bi-book)' });
    return out;
  }

  // ── writing the form (Claude → wizard) ───────────────────────────

  function setRadio(key, value) {
    var radios = wizard.querySelectorAll('.cfg-radio[data-key="' + key + '"]');
    var hit = false;
    radios.forEach(function (r) {
      var match = String(r.value) === String(value);
      r.checked = match;
      if (match) hit = true;
    });
    if (hit && key === 'site_type') applySiteType(value);
    return hit;
  }

  function setCollections(ids) {
    if (!Array.isArray(ids)) return false;
    var wanted = ids.map(String);
    wizard.querySelectorAll('.cfg-collection').forEach(function (el) {
      el.checked = wanted.indexOf(el.getAttribute('data-col')) !== -1;
    });
    return true;
  }

  function applyFields(patch, opts) {
    opts = opts || {};
    var applied = [];
    var ignored = [];
    if (!patch || typeof patch !== 'object') return { applied: applied, ignored: ['(no fields)'] };

    Object.keys(patch).forEach(function (key) {
      var value = patch[key];
      if (key === 'collections') {
        if (setCollections(value)) applied.push(key); else ignored.push(key);
        return;
      }
      if (key === 'navigation') {
        if (Array.isArray(value)) { renderNavEditor(value); applied.push(key); } else ignored.push(key);
        return;
      }
      var sw = wizard.querySelector('.cfg-switch[data-key="' + key + '"]');
      if (sw) { sw.checked = value === true || value === 'true' || value === 'on' || value === 1; applied.push(key); return; }
      if (wizard.querySelector('.cfg-radio[data-key="' + key + '"]')) {
        if (setRadio(key, value)) applied.push(key); else ignored.push(key + ' (unknown option ' + value + ')');
        return;
      }
      var el = wizard.querySelector('.cfg-field[data-key="' + key + '"]');
      if (!el) { ignored.push(key); return; }
      if (el.tagName === 'SELECT') {
        var ok = Array.prototype.some.call(el.options, function (o) { return o.value === String(value); });
        if (!ok) { ignored.push(key + ' (unknown option ' + value + ')'); return; }
      }
      el.value = value === null || value === undefined ? '' : String(value);
      el.classList.remove('is-invalid');
      applied.push(key);
    });

    refreshAll();
    if (!opts.silent) saveDraft();
    emit('change', { source: opts.source || 'api', keys: applied });
    return { applied: applied, ignored: ignored };
  }

  function setOverride(path, content) {
    if (!path) return false;
    if (content === null || content === undefined) delete overrides[path];
    else overrides[path] = String(content);
    refreshAll();
    saveDraft();
    emit('change', { source: 'override', keys: [path] });
    return true;
  }

  function setCheckResult(id, result) {
    if (!id) return;
    checks[id] = Object.assign({}, checks[id] || {}, result || {});
    renderPrereqs();
    saveDraft();
    emit('checks', { id: id, result: checks[id] });
  }

  // ── site type → collections ──────────────────────────────────────

  function applySiteType(id) {
    var radio = wizard.querySelector('.cfg-radio[data-key="site_type"][value="' + id + '"]');
    var list = radio ? (radio.getAttribute('data-collections') || '').split(',').filter(Boolean) : null;
    if (list && list.length) {
      setCollections(list);
      renderNavEditor(defaultNavigation());
    }
  }

  // ── navigation editor ────────────────────────────────────────────

  var COLLECTION_NAV = {
    posts: { title: 'Posts', url: '/posts/', icon: 'bi-journal-text' },
    docs: { title: 'Docs', url: '/docs/', icon: 'bi-book' },
    about: { title: 'About', url: '/about/', icon: 'bi-info-circle' },
    notes: { title: 'Notes', url: '/notes/', icon: 'bi-sticky' },
    quickstart: { title: 'Quickstart', url: '/quickstart/', icon: 'bi-flag' },
    notebooks: { title: 'Notebooks', url: '/notebooks/', icon: 'bi-journal-code' },
    quests: { title: 'Quests', url: '/quests/', icon: 'bi-controller' },
    recipes: { title: 'Recipes', url: '/recipes/', icon: 'bi-egg-fried' }
  };

  function defaultNavigation() {
    var nav = [{ title: 'Home', url: '/', icon: 'bi-house' }];
    readCollections().forEach(function (c) {
      var item = COLLECTION_NAV[c.id];
      if (item && c.id !== 'about') nav.push(Object.assign({}, item));
    });
    if (readCollections().some(function (c) { return c.id === 'about'; })) nav.push(Object.assign({}, COLLECTION_NAV.about));
    return nav;
  }

  function navRow(item) {
    var row = document.createElement('div');
    row.className = 'nav-row input-group input-group-sm mb-2';
    var handle = document.createElement('span');
    handle.className = 'input-group-text';
    handle.innerHTML = '<i class="bi bi-grip-vertical" aria-hidden="true"></i>';
    var title = document.createElement('input');
    title.type = 'text';
    title.className = 'form-control nav-title';
    title.placeholder = 'Label';
    title.setAttribute('aria-label', 'Menu label');
    title.value = item.title || '';
    var url = document.createElement('input');
    url.type = 'text';
    url.className = 'form-control nav-url';
    url.placeholder = '/path/';
    url.setAttribute('aria-label', 'Menu URL');
    url.value = item.url || '';
    var icon = document.createElement('input');
    icon.type = 'text';
    icon.className = 'form-control nav-icon';
    icon.placeholder = 'bi-icon';
    icon.setAttribute('aria-label', 'Bootstrap icon class (optional)');
    icon.value = item.icon || '';
    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn btn-outline-danger';
    remove.setAttribute('aria-label', 'Remove menu item');
    remove.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
    remove.addEventListener('click', function () {
      row.remove();
      refreshAll();
      saveDraft();
      emit('change', { source: 'nav', keys: ['navigation'] });
    });
    row.appendChild(handle);
    row.appendChild(title);
    row.appendChild(url);
    row.appendChild(icon);
    row.appendChild(remove);
    return row;
  }

  function renderNavEditor(items) {
    var host = document.getElementById('nav-editor');
    if (!host) return;
    host.innerHTML = '';
    (items || []).forEach(function (item) { host.appendChild(navRow(item)); });
    if (!host.children.length) {
      var empty = document.createElement('p');
      empty.className = 'small text-body-secondary mb-0';
      empty.textContent = 'No menu items yet — add one or rebuild from the collections.';
      host.appendChild(empty);
    }
  }

  // ── generators ───────────────────────────────────────────────────

  function ctx() {
    var s = getState();
    var f = s.fields;
    var ghUser = f.github_user || 'your-username';
    var repo = f.repository_name || s.target || 'my-site';
    var isUserSite = /\.github\.io$/i.test(repo);
    var remote = f.deploy_target !== 'gem';
    return {
      s: s, f: f, ghUser: ghUser, repo: repo, remote: remote,
      title: f.title || 'My Site',
      url: f.url || ('https://' + ghUser + '.github.io'),
      baseurl: f.baseurl !== undefined ? f.baseurl : (isUserSite ? '' : '/' + repo),
      port: s.port,
      date: todayISO(),
      slug: s.target || slugify(repo) || 'my-site',
      collections: readCollections(),
      nav: s.navigation.length ? s.navigation : defaultNavigation(),
      on: function (id) { return !!f['integration.' + id]; }
    };
  }

  function genConfig(c) {
    var f = c.f;
    var L = [];
    L.push('# =============================================================================');
    L.push('# ' + c.title + ' — Jekyll configuration');
    L.push('# Generated by the zer0-mistakes Site Builder on ' + c.date);
    L.push('# Theme: https://github.com/bamr87/zer0-mistakes · Docs: https://jekyllrb.com/docs/configuration/');
    L.push('# =============================================================================');
    L.push('');
    L.push('# ── Setup flag ─────────────────────────────────────────────────────');
    L.push('# true hides the welcome / setup screens the theme shows to fresh sites.');
    L.push(pad('site_configured') + ': true');
    L.push('');
    L.push('# ── Site identity ──────────────────────────────────────────────────');
    L.push(pad('title') + ': ' + y(c.title));
    L.push(pad('subtitle') + ': ' + y(f.subtitle || ''));
    if (f.tagline) L.push(pad('tagline') + ': ' + y(f.tagline));
    L.push(pad('description') + ': ' + y(f.description || ''));
    L.push(pad('founder') + ': ' + y(f.founder || ''));
    L.push(pad('email') + ': ' + y(f.email || ''));
    L.push(pad('title_icon') + ': ' + y(f.title_icon || 'robot'));
    L.push(pad('locale') + ': "en-US"');
    L.push('# Generated monogram — replace with your own image under assets/images/.');
    L.push(pad('logo') + ': /assets/images/logo.svg');
    L.push('');
    L.push('# ── GitHub ─────────────────────────────────────────────────────────');
    L.push(pad('github_user') + ': &github_user ' + y(c.ghUser));
    L.push(pad('repository_name') + ': &github_repository ' + y(c.repo));
    L.push(pad('repository') + ': [*github_user, "/", *github_repository]');
    L.push('');
    L.push('# ── URLs & deployment ──────────────────────────────────────────────');
    L.push('#   user/org site  → url: https://<user>.github.io   baseurl: ""');
    L.push('#   project site   → url: https://<user>.github.io   baseurl: "/repo"');
    L.push(pad('url') + ': ' + y(c.url));
    L.push(pad('baseurl') + ': ' + y(c.baseurl));
    if (c.remote) {
      L.push(pad('remote_theme') + ': ' + y(f.remote_theme || 'bamr87/zer0-mistakes'));
    } else {
      L.push(pad('theme') + ': "jekyll-theme-zer0"');
    }
    L.push(pad('permalink') + ': ' + (f.permalink || '/:categories/:title/'));
    L.push(pad('port') + ': ' + c.port);
    L.push('');
    L.push('# ── Build ──────────────────────────────────────────────────────────');
    L.push(pad('markdown') + ': kramdown');
    L.push(pad('highlighter') + ': rouge');
    L.push(pad('public_folder') + ': assets');
    L.push('# Collections live under pages/_<name>/ — collections_dir is the key Jekyll');
    L.push('# reads; pages_dir is the theme\'s own alias for the same folder.');
    L.push(pad('collections_dir') + ': pages');
    L.push(pad('pages_dir') + ': pages');
    L.push('kramdown:');
    L.push('  input: GFM');
    L.push('  syntax_highlighter: rouge');
    L.push('');
    L.push('# ── Collections (pages/_<name>/) ───────────────────────────────────');
    L.push('collections:');
    c.collections.forEach(function (col) {
      L.push('  ' + col.id + ':');
      L.push('    output: true');
      L.push('    permalink: ' + col.permalink);
    });
    L.push('');
    L.push('# ── Default front matter ───────────────────────────────────────────');
    L.push('defaults:');
    c.collections.forEach(function (col) {
      L.push('  - scope:');
      L.push('      path: ""');
      L.push('      type: "' + col.id + '"');
      L.push('    values:');
      L.push('      layout: "' + col.layout + '"');
      if (col.id === 'posts') L.push('      author: "default"');
    });
    L.push('  - scope:');
    L.push('      path: ""');
    L.push('      type: "pages"');
    L.push('    values:');
    L.push('      layout: "default"');
    L.push('');
    L.push('# ── Plugins (all GitHub Pages–safe) ────────────────────────────────');
    L.push('plugins:');
    L.push('  - jekyll-feed');
    L.push('  - jekyll-sitemap');
    L.push('  - jekyll-seo-tag');
    L.push('  - jekyll-include-cache');
    L.push('  - jekyll-paginate');
    if (c.remote) L.push('  - jekyll-remote-theme');
    L.push('');
    L.push('# ── Appearance ─────────────────────────────────────────────────────');
    L.push(pad('theme_skin') + ': ' + y(f.theme_skin || 'air') + '   # air | aqua | dirt | neon | mint | plum | sunrise');
    L.push(pad('color_mode_default') + ': ' + (f.color_mode_default || 'auto') + '     # auto | light | dark');
    L.push(pad('color_mode_lock') + ': ' + (f.color_mode_lock ? 'true' : 'false'));
    L.push('theme_background:');
    if (c.remote) {
      L.push('  enabled: ' + (f.theme_background === false ? 'false' : 'true'));
    } else {
      L.push('  # The published gem ships no assets/backgrounds/ (kept small); the SVG');
      L.push('  # layers are only available with remote_theme. Off to avoid 404s.');
      L.push('  enabled: false');
    }
    L.push('');
    L.push('# ── Author (used by article layouts) ───────────────────────────────');
    L.push('author:');
    L.push('  name: ' + y(f.founder || c.title));
    L.push('  email: ' + y(f.email || ''));
    L.push('  bio: ' + y(f.tagline || ''));
    if (f.twitter_username) L.push('  twitter: ' + y(f.twitter_username));
    if (f.linkedin_username) L.push('  linkedin: ' + y(f.linkedin_username));
    L.push('');
    L.push('# ── Integrations ───────────────────────────────────────────────────');
    L.push('# Keys never live here. Analytics run only in production after consent.');
    L.push(pad('google_analytics') + ': ' + y(f.google_analytics || ''));
    L.push('posthog:');
    L.push('  enabled: ' + (c.on('posthog') && f['posthog.api_key'] ? 'true' : 'false'));
    L.push('  api_key: ' + y(f['posthog.api_key'] || ''));
    L.push('cookie_consent:');
    L.push('  enabled: true');
    L.push('  expiry_days: 365');
    L.push('giscus:');
    L.push('  enabled: ' + (c.on('giscus') && f['giscus.repo_id'] && f['giscus.category_id'] ? 'true' : 'false'));
    L.push('  data-repo-id: ' + y(f['giscus.repo_id'] || ''));
    L.push('  data-category-id: ' + y(f['giscus.category_id'] || ''));
    L.push('obsidian:');
    L.push('  enabled: ' + (c.on('obsidian') ? 'true' : 'false'));
    L.push('page_feedback:');
    L.push('  enabled: ' + (c.on('page_feedback') ? 'true' : 'false'));
    L.push('  mode: url                 # pre-filled github.com issue forms; no token needed');
    L.push('  default_labels: ["page-feedback"]');
    L.push('ai_chat:');
    L.push('  enabled: ' + (c.on('ai_chat') ? 'true' : 'false'));
    L.push('  auth_mode: proxy');
    L.push('  proxy_ready: false        # set true once templates/deploy/chat-proxy is deployed');
    L.push('  endpoint: "/api/chat"');
    L.push('');
    if (f.twitter_username || f.linkedin_username) {
      L.push('# ── Social ─────────────────────────────────────────────────────────');
      if (f.twitter_username) L.push(pad('twitter_username') + ': ' + y(f.twitter_username));
      if (f.linkedin_username) L.push(pad('linkedin_username') + ': ' + y(f.linkedin_username));
      L.push('');
    }
    L.push('# ── Exclude from build ─────────────────────────────────────────────');
    L.push('exclude:');
    ['.sass-cache/', '.jekyll-cache/', '.jekyll-metadata', 'node_modules/', 'vendor/', 'Gemfile.lock',
      'docker-compose.yml', 'zer0.install.yml', '.env', '.env.example', 'README.md', '"*.log"'].forEach(function (e) {
      L.push('  - ' + e);
    });
    return L.join('\n') + '\n';
  }

  function genDevConfig(c) {
    var L = [];
    L.push('# Development overrides — layered on top of _config.yml by docker-compose.yml:');
    L.push('#   jekyll serve --config _config.yml,_config_dev.yml');
    L.push('');
    if (c.remote) {
      L.push('# Keep the remote theme in dev too (no theme gem needed locally).');
      L.push('remote_theme: ' + y(c.f.remote_theme || 'bamr87/zer0-mistakes'));
    } else {
      L.push('remote_theme: false');
      L.push('theme: "jekyll-theme-zer0"');
    }
    L.push('');
    L.push('url: "http://localhost:' + c.port + '"');
    L.push('baseurl: ""');
    L.push('host: "0.0.0.0"');
    L.push('port: ' + c.port);
    L.push('livereload: true');
    L.push('incremental: true');
    L.push('show_drafts: true');
    L.push('future: true');
    L.push('');
    L.push('# Never send analytics from a dev build.');
    L.push('google_analytics: null');
    L.push('posthog:');
    L.push('  enabled: false');
    L.push('');
    L.push('# Jekyll REPLACES (does not merge) `exclude` and `plugins` when layering configs,');
    L.push('# so this list must include everything from _config.yml.');
    L.push('exclude:');
    ['.sass-cache/', '.jekyll-cache/', '.jekyll-metadata', 'node_modules/', 'vendor/', 'Gemfile.lock',
      'docker-compose.yml', 'zer0.install.yml', '.env', '.env.example', 'README.md', '"*.log"'].forEach(function (e) {
      L.push('  - ' + e);
    });
    return L.join('\n') + '\n';
  }

  function genGemfile(c) {
    var L = ['source "https://rubygems.org"', ''];
    if (c.remote) {
      L.push('# Current Jekyll + the remote-theme plugin (loads ' + (c.f.remote_theme || 'bamr87/zer0-mistakes') + ' from GitHub).');
      L.push('gem "jekyll", "~> 4.3"');
      L.push('gem "jekyll-remote-theme"');
    } else {
      L.push('# Jekyll and the theme gem, pinned to the installed major.');
      L.push('gem "jekyll", "~> 4.3"');
      L.push('gem "jekyll-theme-zer0"');
    }
    L.push('');
    L.push('group :jekyll_plugins do');
    L.push('  gem "jekyll-feed"');
    L.push('  gem "jekyll-sitemap"');
    L.push('  gem "jekyll-seo-tag"');
    L.push('  gem "jekyll-include-cache"');
    L.push('  gem "jekyll-paginate"');
    L.push('end');
    L.push('');
    L.push('# Ruby 3+ no longer bundles webrick (needed by `jekyll serve`).');
    L.push('gem "webrick", "~> 1.8"');
    L.push('');
    L.push('platforms :windows, :jruby do');
    L.push('  gem "tzinfo"');
    L.push('  gem "tzinfo-data"');
    L.push('end');
    return L.join('\n') + '\n';
  }

  function genCompose(c) {
    var L = [];
    L.push('# ' + c.title + ' — development server');
    L.push('# Generated by the zer0-mistakes Site Builder. Start with: docker compose up');
    L.push('services:');
    L.push('  jekyll:');
    L.push('    image: ruby:3.3');
    L.push('    working_dir: /site');
    var lr = c.port + 1;
    // A folded block (>-) joins these lines with spaces ONLY while every
    // continuation line keeps the same indentation as the first. Indenting
    // them further makes YAML preserve the line breaks, and `sh -c` then runs
    // the trailing options as a separate command — Jekyll starts without the
    // dev config and binds to 127.0.0.1, unreachable from the host.
    L.push('    command: >-');
    L.push('      sh -c "bundle config set --local path vendor/bundle');
    L.push('      && (bundle check || bundle install --jobs 4 --retry 3)');
    L.push('      && bundle exec jekyll serve --watch --livereload --livereload-port ' + lr + ' --force_polling');
    L.push('      --config _config.yml,_config_dev.yml --host 0.0.0.0 --port ' + c.port + '"');
    L.push('    ports:');
    L.push('      - "' + c.port + ':' + c.port + '"');
    L.push('      - "' + lr + ':' + lr + '"   # LiveReload on port+1, so two Jekyll sites can run side by side');
    L.push('    volumes:');
    L.push('      - .:/site');
    L.push('      - bundle_cache:/site/vendor/bundle');
    L.push('    environment:');
    L.push('      JEKYLL_ENV: development');
    L.push('      PAGES_REPO_NWO: ' + c.ghUser + '/' + c.repo);
    L.push('    stdin_open: true');
    L.push('    tty: true');
    L.push('');
    L.push('volumes:');
    L.push('  bundle_cache:');
    L.push('    # Shared across every site generated by the Site Builder, so the second');
    L.push('    # site does not reinstall the same gems. Drop the name for a private cache.');
    L.push('    name: zer0-sites-bundle-cache');
    return L.join('\n') + '\n';
  }

  function genIndex(c) {
    // The home layout already renders page.title and page.description, so the
    // body starts with the tagline (if any) and the content itself.
    var L = ['---', 'layout: home', 'title: ' + y(c.title), 'description: ' + y(c.f.description || ''), 'permalink: /', '---', ''];
    if (c.f.tagline) { L.push('## ' + c.f.tagline); L.push(''); }
    L.push(c.f.brief ? c.f.brief.trim() : 'Welcome. This home page is `index.md` — edit it to say hello your way.');
    L.push('');
    var hasPosts = c.collections.some(function (x) { return x.id === 'posts'; });
    if (hasPosts) {
      L.push('## Latest');
      L.push('');
      L.push('{% for post in site.posts limit: 5 %}');
      L.push('- [{{ post.title }}]({{ post.url | relative_url }}) — {{ post.date | date: "%B %-d, %Y" }}');
      L.push('{% endfor %}');
      L.push('');
    }
    return L.join('\n');
  }

  function genNav(c) {
    var L = ['# Main navigation — rendered by the theme navbar.', '# title, url and an optional Bootstrap icon class; nest `children:` for dropdowns.', ''];
    c.nav.forEach(function (item) {
      L.push('- title: ' + y(item.title || item.url));
      L.push('  url: ' + y(item.url || '/'));
      if (item.icon) L.push('  icon: ' + item.icon);
      L.push('');
    });
    return L.join('\n');
  }

  function genAbout(c) {
    var body = (c.f.about_body || '').trim() || (
      'Hi, I am ' + (c.f.founder || 'the author of this site') + '.\n\n' +
      (c.f.brief ? c.f.brief.trim() + '\n\n' : '') +
      'This site is built with [zer0-mistakes](https://github.com/bamr87/zer0-mistakes), a Docker-first Jekyll theme. ' +
      'Edit `pages/_about/index.md` to tell your own story.'
    );
    var L = ['---', 'title: About', 'description: ' + y('About ' + c.title + (c.f.founder ? ' and ' + c.f.founder : '')), 'permalink: /about/', 'lastmod: ' + c.date, '---', '', '# About', '', body, ''];
    if (c.f.email) L.push('\nContact: <' + c.f.email + '>\n');
    return L.join('\n');
  }

  function genWelcome(c) {
    var title = c.f.welcome_title || ('Welcome to ' + c.title);
    var body = (c.f.welcome_body || '').trim() || (
      'This is the first post on **' + c.title + '**.' +
      (c.f.brief ? '\n\n' + c.f.brief.trim() : '') +
      '\n\nPosts live in `pages/_posts/` and are named `YYYY-MM-DD-title.md`. Delete this one whenever you like.'
    );
    return ['---', 'title: ' + y(title), 'description: ' + y(c.f.description || ('The first post on ' + c.title)),
      'date: ' + c.date + 'T09:00:00.000Z', 'lastmod: ' + c.date + 'T09:00:00.000Z', 'categories: [general]', 'tags: [welcome]',
      'author: ' + y(c.f.founder || 'default'), 'preview: /assets/images/previews/welcome.png', '---', '', body, ''].join('\n');
  }

  function genCollectionIndex(c, col) {
    var label = labelFor(catalog('collections'), col.id);
    if (col.id === 'recipes') {
      // The theme's cookbook layout lists site.recipes grouped by course.
      var cbTitle = /cookbook|recipes|kitchen/i.test(c.title) ? c.title : c.title + ' Cookbook';
      return ['---', 'layout: cookbook', 'cookbook: ' + c.slug, 'title: ' + y(cbTitle),
        'subtitle: ' + y(c.f.tagline || 'Recipes, scaled to your table'), 'author: ' + y(c.f.founder || ''),
        'description: ' + y('Every recipe on ' + c.title + ', with serving scaling and US/metric conversion.'),
        'permalink: /recipes/', 'lastmod: ' + c.date, '---', '',
        'Recipes live in `pages/_recipes/`. Give each one `layout: recipe`, `cookbook: ' + c.slug + '` and the structured front matter shown in the starter recipe.', ''].join('\n');
    }
    return ['---', 'layout: collection', 'collection: ' + col.id, 'title: ' + y(label),
      'description: ' + y(label + ' on ' + c.title), 'permalink: /' + col.id + '/', 'sort_order: reverse', '---', '',
      '# ' + label, '', 'Everything in `pages/_' + col.id + '/`, newest first.', ''].join('\n');
  }

  // ── sample content, one starter document per enabled collection ─────
  // Each is a real, valid document for its layout so the very first build has
  // something on every route and shows the front matter that collection needs.

  function genSampleDoc(c) {
    return ['---', 'title: "Getting Started"', 'description: ' + y('How to run, edit and publish ' + c.title + '.'),
      'lastmod: ' + c.date, 'categories: [docs]', 'tags: [getting-started]', '---', '',
      '# Getting started', '', 'This is the first document in `pages/_docs/`. Docs render on the `default` layout with the reading sidebar.', '',
      '## Run the site', '', '```bash', 'docker compose up', '```', '',
      'Open <http://localhost:' + c.port + '/>. Edit any file under `pages/` and the page reloads.', '',
      '## Add a doc', '', 'Create `pages/_docs/<slug>.md` with `title`, `description` and `lastmod` front matter. It appears at `/docs/<slug>/` and in the docs index.', ''].join('\n');
  }

  function genSampleQuickstart(c) {
    return ['---', 'title: "First Steps"', 'description: ' + y('The first quickstart step for ' + c.title + '.'),
      'lastmod: ' + c.date, 'quickstart:', '  step: 1', '  next: null', '  prev: /quickstart/', '---', '',
      '# First steps', '', 'Quickstart pages are ordered walkthroughs. Set `quickstart.step`, `quickstart.next` and `quickstart.prev` in the front matter to chain them.', '',
      '1. Run `docker compose up`.', '2. Edit `_config.yml` and restart the server.', '3. Publish with `gh repo create ' + c.repo + ' --public --source=. --push`.', ''].join('\n');
  }

  function genSampleNote(c) {
    return ['---', 'title: "Welcome Note"', 'description: ' + y('The first note in the ' + c.title + ' garden.'),
      'date: ' + c.date + 'T09:00:00.000Z', 'lastmod: ' + c.date + 'T09:00:00.000Z', 'tags: [meta, welcome]', '---', '',
      'Notes are short, evergreen and interlinked. Link to another note with a wiki-link, like [[Getting Started]], and the theme resolves it and shows backlinks on both pages.', '',
      '> [!tip] Obsidian users', '> Open `pages/_notes/` as a vault; callouts, embeds and `[[links]]` render the same on the site.', ''].join('\n');
  }

  function genSampleRecipe(c) {
    return ['---', 'title: "Starter Recipe: Weeknight Tomato Pasta"', 'layout: recipe', 'cookbook: ' + c.slug,
      'course: mains', 'cuisine: Italian', 'difficulty: easy',
      'description: ' + y('A twenty-minute pantry pasta that shows every field a recipe on ' + c.title + ' can carry.'),
      'lastmod: ' + c.date, 'tags: [pasta, quick, vegetarian]', '',
      'yield:', '  amount: 2', '  unit: servings', '  singular: serving', '',
      'times:', '  prep: 5', '  cook: 15', '',
      'equipment:', '  - Large pot', '  - Wide skillet', '',
      'ingredients:', '  - group: Pasta', '    items:', '      - item: dried spaghetti', '        qty: 200', '        unit: g',
      '      - item: salt', '        qty: 1', '        unit: tbsp', '        note: For the pasta water.',
      '  - group: Sauce', '    items:', '      - item: olive oil', '        qty: 2', '        unit: tbsp',
      '      - item: garlic cloves', '        singular: garlic clove', '        qty: 2', '        prep: thinly sliced',
      '      - item: canned whole tomatoes', '        qty: 400', '        unit: g', '        prep: crushed by hand',
      '      - item: fresh basil', '        qty: 0.25', '        unit: cup', '        prep: torn', '',
      'steps:', '  - title: Boil', '    text: >-', '      Bring a large pot of water to the boil, salt it well, and cook the spaghetti one minute short of the packet time.', '    time: 10',
      '  - title: Sauce', '    text: >-', '      Warm the oil in a wide skillet, soften the garlic without colouring it, add the tomatoes and simmer until glossy.', '    time: 8',
      '  - title: Finish', '    text: >-', '      Drag the pasta into the sauce with a splash of its water, toss over high heat for a minute, and finish with basil.', '    time: 2', '',
      'notes:', '  - Swap the basil for parsley in winter; add chilli flakes with the garlic for heat.', '---', '',
      'This starter recipe exists so the cookbook has something to render on day one. Replace it, or copy its front matter for your own recipes — `yield`, `times`, `ingredients` groups and `steps` drive the scaler, the unit switch and the timings bar.', ''].join('\n');
  }

  /** A one-letter monogram in the skin's colours, so the navbar logo is never a broken image. */
  function genLogoSvg(c) {
    var skin = catalog('skins').filter(function (s) { return s.id === (c.f.theme_skin || 'air'); })[0] || { primary: '#e8f4f8', accent: '#6fa8dc' };
    var letter = (String(c.title).trim().charAt(0) || 'Z').toUpperCase().replace(/[^A-Z0-9]/, 'Z');
    var dark = /^#([0-9a-f]{2})/i.test(skin.primary) && parseInt(skin.primary.slice(1, 3), 16) < 0x80;
    return ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="' + escapeXml(c.title) + ' logo">',
      '  <rect width="64" height="64" rx="14" fill="' + skin.accent + '"/>',
      '  <text x="32" y="43" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="34" font-weight="700" fill="' + (dark ? '#f8f9fa' : '#1b1f24') + '">' + letter + '</text>',
      '</svg>', ''].join('\n');
  }

  function escapeXml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function genGitignore() {
    return ['_site/', '.sass-cache/', '.jekyll-cache/', '.jekyll-metadata', 'vendor/', 'Gemfile.lock', 'node_modules/', '.env', '.env.*', '!.env.example', '*.log', '.DS_Store', ''].join('\n');
  }

  function genInstallYml(c) {
    var f = c.f;
    var L = ['# zer0.install.yml — your Site Builder answers, replayable by scripts/bin/install.', '# Keys are never read from this file; they live in your environment / .env.', ''];
    L.push('profile: ' + (c.remote ? 'github-pages' : 'default'));
    L.push('site:');
    L.push('  title: ' + y(c.title));
    L.push('  description: ' + y(f.description || ''));
    L.push('  author: ' + y(f.founder || ''));
    L.push('  email: ' + y(f.email || ''));
    L.push('  url: ' + y(c.url));
    L.push('github:');
    L.push('  user: ' + y(c.ghUser));
    L.push('  repo: ' + y(c.repo));
    L.push('theme:');
    L.push('  source: ' + (c.remote ? 'remote' : 'gem'));
    L.push('  skin: ' + (f.theme_skin || 'air'));
    L.push('  color_mode: ' + (f.color_mode_default || 'auto'));
    L.push('deploy:');
    L.push('  - github-pages');
    L.push('collections: [' + c.collections.map(function (x) { return x.id; }).join(', ') + ']');
    L.push('voice:');
    L.push('  tone: ' + (f.tone || 'friendly'));
    L.push('  audience: ' + (f.audience || 'developers'));
    L.push('agents: [copilot, claude]');
    L.push('ai:');
    L.push('  provider: auto');
    return L.join('\n') + '\n';
  }

  function genEnvExample(c) {
    return ['# Copy to .env (git-ignored). Credentials live here, never in _config.yml.', '',
      '# jekyll-github-metadata', 'PAGES_REPO_NWO=' + c.ghUser + '/' + c.repo, '',
      '# AI chat assistant / Site Builder — Claude Code OAuth token from `claude setup-token`',
      '# CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...', '# ANTHROPIC_API_KEY=sk-ant-...', '',
      '# PostHog (only if enabled in _config.yml)', '# POSTHOG_API_KEY=phc_...', ''].join('\n');
  }

  function genReadme(c) {
    var L = ['# ' + c.title, ''];
    if (c.f.description) { L.push(c.f.description); L.push(''); }
    L.push('Built with [zer0-mistakes](https://github.com/bamr87/zer0-mistakes) (' + (c.remote ? 'remote theme' : 'jekyll-theme-zer0 gem') + '). Generated by the Site Builder on ' + c.date + '.');
    L.push('');
    L.push('## Run locally');
    L.push('');
    L.push('```bash');
    L.push('docker compose up          # http://localhost:' + c.port + '/');
    L.push('```');
    L.push('');
    L.push('Edit anything under `pages/` and the browser reloads. Site-wide settings live in `_config.yml` (restart the server after changing it).');
    L.push('');
    L.push('## Publish to GitHub Pages');
    L.push('');
    L.push('```bash');
    L.push('git init && git add -A && git commit -m "feat: initial site"');
    L.push('gh repo create ' + c.repo + ' --public --source=. --push');
    L.push('```');
    L.push('');
    L.push('Then in the repository: **Settings → Pages → Source: GitHub Actions** (or the `main` branch). The site appears at `' + c.url + (c.baseurl || '') + '/`.');
    L.push('');
    L.push('## Layout');
    L.push('');
    L.push('| Path | Purpose |');
    L.push('| --- | --- |');
    L.push('| `_config.yml` | production settings |');
    L.push('| `_config_dev.yml` | local overrides |');
    L.push('| `_data/navigation/main.yml` | navbar |');
    c.collections.forEach(function (col) { L.push('| `pages/_' + col.id + '/` | ' + labelFor(catalog('collections'), col.id) + ' |'); });
    L.push('| `zer0.install.yml` | your Site Builder answers |');
    L.push('');
    return L.join('\n');
  }

  /** Every generated file, in preview order, with overrides applied. */
  function getFiles() {
    var c = ctx();
    var manifest = catalog('generated_files');
    var files = [];
    function add(path, content, meta) {
      var m = meta || {};
      files.push({
        path: path,
        label: m.label || path,
        description: m.description || '',
        required: m.required !== false,
        content: overrides[path] !== undefined ? overrides[path] : content,
        overridden: overrides[path] !== undefined
      });
    }
    function meta(p) { return manifest.filter(function (m) { return m.path === p; })[0] || { label: p }; }

    add('_config.yml', genConfig(c), meta('_config.yml'));
    add('_config_dev.yml', genDevConfig(c), meta('_config_dev.yml'));
    add('Gemfile', genGemfile(c), meta('Gemfile'));
    add('docker-compose.yml', genCompose(c), meta('docker-compose.yml'));
    add('index.md', genIndex(c), meta('index.md'));
    add('_data/navigation/main.yml', genNav(c), meta('_data/navigation/main.yml'));
    var hasAbout = c.collections.some(function (x) { return x.id === 'about'; });
    var hasPosts = c.collections.some(function (x) { return x.id === 'posts'; });
    if (hasAbout) add('pages/_about/index.md', genAbout(c), meta('pages/_about/index.md'));
    if (hasPosts) add('pages/_posts/' + c.date + '-welcome.md', genWelcome(c), Object.assign({}, meta('pages/_posts/{date}-welcome.md'), { label: 'posts/welcome.md' }));
    c.collections.forEach(function (col) {
      if (col.id === 'about') return;
      add('pages/' + col.id + '.md', genCollectionIndex(c, col), { label: col.id + '.md', description: 'Index page listing the ' + col.id + ' collection.', required: true });
      if (col.id === 'docs') add('pages/_docs/getting-started.md', genSampleDoc(c), { label: 'docs/getting-started.md', description: 'Starter document for the docs collection.', required: false });
      if (col.id === 'quickstart') add('pages/_quickstart/first-steps.md', genSampleQuickstart(c), { label: 'quickstart/first-steps.md', description: 'Starter quickstart step.', required: false });
      if (col.id === 'notes') add('pages/_notes/welcome-note.md', genSampleNote(c), { label: 'notes/welcome-note.md', description: 'Starter note with a wiki-link and a callout.', required: false });
      if (col.id === 'recipes') add('pages/_recipes/starter-recipe.md', genSampleRecipe(c), { label: 'recipes/starter-recipe.md', description: 'Starter recipe with the structured front matter the recipe layout needs.', required: false });
    });
    add('assets/images/logo.svg', genLogoSvg(c), { label: 'logo.svg', description: 'Monogram logo in the skin colours; replace with your own.', required: false });
    add('.gitignore', genGitignore(), meta('.gitignore'));
    add('zer0.install.yml', genInstallYml(c), meta('zer0.install.yml'));
    add('.env.example', genEnvExample(c), meta('.env.example'));
    add('README.md', genReadme(c), meta('README.md'));
    return files;
  }

  function getFile(path) {
    return getFiles().filter(function (f) { return f.path === path; })[0] || null;
  }

  /** Self-extracting bash bundle: recreates every file under $1 (default slug). */
  function buildBundle() {
    var c = ctx();
    var L = ['#!/usr/bin/env bash', '# ' + c.title + ' — site bundle generated by the zer0-mistakes Site Builder (' + c.date + ')',
      '# Usage: bash zer0-site-bundle.sh [folder]   → creates the folder and every file, then prints next steps.',
      'set -euo pipefail', 'TARGET="${1:-' + c.slug + '}"', 'mkdir -p "$TARGET" && cd "$TARGET"', ''];
    getFiles().forEach(function (f) {
      var dir = f.path.indexOf('/') !== -1 ? f.path.slice(0, f.path.lastIndexOf('/')) : '';
      if (dir) L.push('mkdir -p ' + shellQuote(dir));
      L.push('cat > ' + shellQuote(f.path) + " <<'ZER0_EOF'");
      L.push(f.content.replace(/\n$/, ''));
      L.push('ZER0_EOF');
      L.push('');
    });
    L.push('echo "Created $(ls -1A | wc -l | tr -d \' \') entries in $TARGET"');
    L.push('echo "Next: cd $TARGET && docker compose up   → http://localhost:' + c.port + '/"');
    return L.join('\n') + '\n';
  }

  function shellQuote(s) { return "'" + String(s).replace(/'/g, "'\\''") + "'"; }

  // ── inline validation ────────────────────────────────────────────

  var VALIDATION_MESSAGES = {
    email: 'Enter a valid email address, e.g. you@example.com.',
    url: 'Enter a full URL including https://, e.g. https://example.com.'
  };

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

  function unfilledRecommended() {
    var missing = [];
    wizard.querySelectorAll('[data-recommended]').forEach(function (el) {
      if (el.value.trim() === '') missing.push(el.getAttribute('data-recommended'));
    });
    return missing;
  }

  function renderReviewWarnings() {
    var host = document.getElementById('wizard-review-warnings');
    if (!host) return;
    var missing = unfilledRecommended();
    host.innerHTML = '';
    var alert = document.createElement('div');
    alert.setAttribute('role', 'alert');
    if (!missing.length) {
      alert.className = 'alert alert-success mb-0';
      alert.innerHTML = '<i class="bi bi-check2-circle" aria-hidden="true"></i> Every recommended field is filled in. The project below is ready to write.';
      host.appendChild(alert);
      return;
    }
    alert.className = 'alert alert-warning mb-0';
    alert.innerHTML = '<i class="bi bi-exclamation-triangle" aria-hidden="true"></i> <strong>Recommended fields still empty.</strong> The files are valid without them, but filling them in improves SEO and the site chrome:';
    var ul = document.createElement('ul');
    ul.className = 'mb-0 mt-2';
    missing.forEach(function (name) {
      var li = document.createElement('li');
      li.textContent = name;
      ul.appendChild(li);
    });
    alert.appendChild(ul);
    host.appendChild(alert);
  }

  // ── stepper state ────────────────────────────────────────────────

  function refreshStepper() {
    var buttons = STEP_IDS.map(function (id) { return document.getElementById(id); });
    var activeIndex = buttons.findIndex(function (b) { return b && b.classList.contains('is-active'); });
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

    wizard.querySelectorAll('.btn-next').forEach(function (btn) {
      var target = document.getElementById(btn.getAttribute('data-next'));
      btn.disabled = !!(target && target.disabled);
    });

    var bar = document.getElementById('wizard-progress-bar');
    var text = document.getElementById('wizard-progress-text');
    var pct = Math.round(((activeIndex + 1) / STEP_IDS.length) * 100);
    if (bar) bar.style.width = pct + '%';
    if (text) text.textContent = 'Step ' + (activeIndex + 1) + ' of ' + STEP_IDS.length;
  }

  function showStep(btn, opts) {
    if (typeof btn === 'string') btn = document.getElementById(/^tab-/.test(btn) ? btn : 'tab-' + btn);
    if (!btn || btn.disabled) return false;
    wizard.querySelectorAll('#wizardTabs .wizard-step').forEach(function (b) { b.classList.remove('is-active'); });
    btn.classList.add('is-active');
    if (window.bootstrap && window.bootstrap.Tab) new bootstrap.Tab(btn).show();
    else {
      wizard.querySelectorAll('.wizard-panes .tab-pane').forEach(function (p) { p.classList.remove('show', 'active'); });
      var pane = document.querySelector(btn.getAttribute('data-bs-target'));
      if (pane) pane.classList.add('show', 'active');
    }
    refreshStepper();
    if (btn.id === 'tab-build') renderReviewWarnings();
    if (!(opts && opts.silent)) {
      try { history.replaceState(null, '', '#' + btn.getAttribute('data-bs-target').slice(1)); } catch (e) { /* ignore */ }
    }
    emit('step', { step: btn.id.replace(/^tab-/, '') });
    saveDraft();
    return true;
  }

  // ── prerequisites UI ─────────────────────────────────────────────

  function detectOS() {
    var p = (navigator.platform || '') + ' ' + (navigator.userAgent || '');
    if (/Mac|iPhone|iPad/i.test(p)) return 'macos';
    if (/Win/i.test(p)) return 'windows';
    return 'linux';
  }

  function applyOS(os) {
    wizard.querySelectorAll('.prereq-install .wizard-cmd[data-os]').forEach(function (el) {
      el.hidden = el.getAttribute('data-os') !== os;
    });
    var radio = document.getElementById('prereq-os-' + os);
    if (radio) radio.checked = true;
  }

  function renderPrereqs() {
    var items = wizard.querySelectorAll('.prereq-item');
    var requiredTotal = 0;
    var requiredReady = 0;
    items.forEach(function (li) {
      var id = li.getAttribute('data-prereq');
      var c = checks[id] || {};
      var manual = document.getElementById('prereq-' + id);
      var isManual = !!(c.manual || (manual && manual.checked));
      var state = isManual ? 'manual' : c.ok === true ? 'ok' : c.ok === false ? 'fail' : 'unknown';
      li.setAttribute('data-state', state);
      var badge = li.querySelector('.prereq-state-badge');
      if (badge) {
        badge.className = 'badge rounded-pill prereq-state-badge ' + (
          state === 'ok' ? 'text-bg-success' : state === 'fail' ? 'text-bg-danger' : state === 'manual' ? 'text-bg-info' : 'text-bg-light border');
        badge.textContent = state === 'ok' ? ('ready' + (c.version ? ' · v' + c.version : ''))
          : state === 'fail' ? (c.installed === false ? 'not installed' : 'not ready')
            : state === 'manual' ? 'done (manual)' : 'not checked';
      }
      var out = li.querySelector('.prereq-output');
      if (out) {
        var text = c.output ? String(c.output).split('\n').slice(0, 3).join(' · ') : '';
        out.textContent = text;
        out.hidden = !text;
      }
      if (li.getAttribute('data-required') === 'true') {
        requiredTotal += 1;
        if (state === 'ok' || state === 'manual') requiredReady += 1;
      }
    });
    var summary = document.getElementById('prereq-summary');
    if (summary) summary.textContent = requiredReady + ' of ' + requiredTotal + ' required ready';
  }

  // ── file preview ─────────────────────────────────────────────────

  /**
   * Keep the file tabs in sync with the generated set.
   *
   * Updates the existing buttons IN PLACE whenever the list of paths is
   * unchanged. Detaching and re-appending them (the obvious rebuild) breaks a
   * real click: pressing a tab blurs a text field, the field's `change` event
   * regenerates the preview, and if that rebuild removes the button under the
   * pointer between mousedown and mouseup the browser never fires `click`.
   */
  function renderFileTabs(files) {
    var host = document.getElementById('wizard-file-tabs');
    if (!host) return;
    var current = Array.prototype.map.call(host.querySelectorAll('.wizard-file-tab'), function (b) { return b.getAttribute('data-file'); });
    var wanted = files.map(function (f) { return f.path; });
    var samePaths = current.length === wanted.length && current.every(function (p, i) { return p === wanted[i]; });

    function decorate(b, f) {
      b.type = 'button';
      b.className = 'nav-link wizard-file-tab' + (f.path === activeFile ? ' active' : '') + (f.overridden ? ' is-overridden' : '');
      b.setAttribute('role', 'tab');
      b.setAttribute('data-file', f.path);
      b.setAttribute('title', f.description || f.path);
      b.setAttribute('aria-selected', f.path === activeFile ? 'true' : 'false');
      if (b.textContent !== f.label) b.textContent = f.label;
    }

    if (samePaths) {
      var buttons = host.querySelectorAll('.wizard-file-tab');
      files.forEach(function (f, i) { decorate(buttons[i], f); });
      return;
    }

    var existing = {};
    host.querySelectorAll('.wizard-file-tab').forEach(function (b) { existing[b.getAttribute('data-file')] = b; });
    host.innerHTML = '';
    files.forEach(function (f) {
      var b = existing[f.path] || document.createElement('button');
      decorate(b, f);
      host.appendChild(b);
    });
  }

  function updatePreview() {
    var files = getFiles();
    if (!files.some(function (f) { return f.path === activeFile; })) activeFile = files[0].path;
    renderFileTabs(files);
    var file = files.filter(function (f) { return f.path === activeFile; })[0];
    var preview = document.getElementById('yaml-preview');
    if (preview && file) {
      preview.textContent = file.content;
      preview.parentElement.setAttribute('data-file', file.path);
    }
    var desc = document.getElementById('wizard-file-description');
    if (desc && file) desc.textContent = (file.overridden ? 'Edited by hand or by Claude. ' : '') + (file.description || '');
    emit('files', { active: activeFile, count: files.length });
  }

  function refreshAll() {
    syncSubfields();
    syncCommands();
    updatePreview();
    refreshStepper();
    renderPrereqs();
    if (activeStepId() === 'tab-build') renderReviewWarnings();
  }

  function syncSubfields() {
    wizard.querySelectorAll('.wizard-subfields[data-for]').forEach(function (block) {
      var sw = document.getElementById(block.getAttribute('data-for'));
      block.hidden = !(sw && sw.checked);
    });
    var iconInput = document.getElementById('cfg-title-icon');
    var iconPreview = document.getElementById('cfg-title-icon-preview');
    if (iconInput && iconPreview) {
      var name = (iconInput.value || 'robot').replace(/^bi-/, '').replace(/[^a-z0-9-]/gi, '');
      iconPreview.className = 'bi bi-' + (name || 'robot');
    }
  }

  function syncCommands() {
    var c = ctx();
    var set = function (id, text) { var el = document.getElementById(id); if (el) el.textContent = text; };
    set('cmd-bundle', 'bash zer0-site-bundle.sh ' + c.slug);
    set('cmd-up', 'cd ' + c.slug + ' && docker compose up');
    set('cmd-publish', 'gh repo create ' + c.repo + ' --public --source=. --push');
    var local = 'http://localhost:' + c.port + '/';
    ['link-local', 'btn-open-site'].forEach(function (id) {
      var a = document.getElementById(id);
      if (a) { a.href = local; if (id === 'link-local') a.textContent = local; }
    });
    var target = document.getElementById('cfg-target');
    if (target && !target.value && !restoring) target.placeholder = c.slug;
  }

  // ── draft persistence ────────────────────────────────────────────

  function collectDraft() {
    var data = { v: DRAFT_VERSION, fields: {}, checks: {}, radios: {}, step: null, navigation: readNavigation(), overrides: overrides, prereqs: checks, activeFile: activeFile };
    wizard.querySelectorAll('.cfg-field').forEach(function (el) { if (el.id) data.fields[el.id] = el.value; });
    wizard.querySelectorAll('input[type="checkbox"]').forEach(function (el) { if (el.id) data.checks[el.id] = el.checked; });
    wizard.querySelectorAll('.cfg-radio:checked').forEach(function (el) { data.radios[el.name] = el.value; });
    data.step = activeStepId();
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

  function writeDraft() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraft())); return true; } catch (e) { /* private mode / quota */ }
    return false;
  }

  function saveDraft() {
    if (restoring) return;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(function () {
      draftTimer = null;
      if (writeDraft()) showDraftChip();
    }, DRAFT_DEBOUNCE_MS);
  }

  function flushDraft() {
    if (draftTimer === null || restoring) return;
    clearTimeout(draftTimer);
    draftTimer = null;
    writeDraft();
  }

  function clearDraft() {
    clearTimeout(draftTimer);
    draftTimer = null;
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
    Object.keys(data.radios || {}).forEach(function (name) {
      var el = wizard.querySelector('.cfg-radio[name="' + name + '"][value="' + String(data.radios[name]).replace(/"/g, '') + '"]');
      if (el) el.checked = true;
    });
    if (Array.isArray(data.navigation) && data.navigation.length) renderNavEditor(data.navigation);
    if (data.overrides && typeof data.overrides === 'object') overrides = data.overrides;
    if (data.prereqs && typeof data.prereqs === 'object') checks = data.prereqs;
    if (typeof data.activeFile === 'string') activeFile = data.activeFile;

    var target = data.step && STEP_IDS.indexOf(data.step) !== -1 ? document.getElementById(data.step) : null;
    if (target && !target.disabled) showStep(target, { silent: true });
    restoring = false;
  }

  function resetAll() {
    overrides = {};
    checks = {};
    wizard.querySelectorAll('.cfg-field').forEach(function (el) {
      if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else if (el.id === 'cfg-port') el.value = String(DEFAULT_PORT);
      else if (el.id === 'cfg-remote-theme') el.value = 'bamr87/zer0-mistakes';
      else if (el.id === 'cfg-title-icon') el.value = 'robot';
      else el.value = '';
      el.classList.remove('is-invalid');
    });
    wizard.querySelectorAll('.cfg-collection').forEach(function (el) { el.checked = ['posts', 'docs', 'about'].indexOf(el.getAttribute('data-col')) !== -1; });
    wizard.querySelectorAll('.cfg-switch').forEach(function (el) { el.checked = el.hasAttribute('checked'); });
    wizard.querySelectorAll('.prereq-manual').forEach(function (el) { el.checked = false; });
    wizard.querySelectorAll('.cfg-radio').forEach(function (el) { el.checked = el.hasAttribute('checked'); });
    renderNavEditor(defaultNavigation());
    activeFile = '_config.yml';
    showStep(STEP_IDS[0]);
    refreshAll();
    // Last, so the step change above cannot queue a fresh draft write.
    clearDraft();
    emit('reset', {});
  }

  // ── actions ──────────────────────────────────────────────────────

  function toast(message) {
    var el = document.getElementById('wizard-toast');
    var body = document.getElementById('wizard-toast-body');
    if (body) body.textContent = message;
    if (el && window.bootstrap && window.bootstrap.Toast) bootstrap.Toast.getOrCreateInstance(el, { delay: 1800 }).show();
  }

  function downloadText(name, text, mime) {
    var blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadActive() {
    var file = getFile(activeFile);
    if (!file) return;
    downloadText(file.path.split('/').pop(), file.content, /\.ya?ml$/.test(file.path) ? 'text/yaml' : 'text/plain');
    toast('Downloaded ' + file.path);
  }

  function downloadBundle() {
    downloadText('zer0-site-bundle.sh', buildBundle(), 'text/x-shellscript');
    toast('Bundle downloaded — run it with bash');
  }

  function copyText(text, label) {
    if (!navigator.clipboard) return Promise.reject(new Error('clipboard unavailable'));
    return navigator.clipboard.writeText(text).then(function () { toast(label || 'Copied'); });
  }

  function copyActive() {
    var file = getFile(activeFile);
    if (!file) return;
    copyText(file.content, 'Copied ' + file.path).then(function () {
      var btn = document.getElementById('btn-copy-full');
      if (btn) {
        var orig = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check-lg" aria-hidden="true"></i> Copied!';
        setTimeout(function () { btn.innerHTML = orig; }, 2000);
      }
    }).catch(function () { /* no clipboard */ });
  }

  function suggestUrls() {
    var f = readFields();
    var user = f.github_user || '';
    var repo = f.repository_name || '';
    if (!user) return;
    var patch = { url: 'https://' + user + '.github.io' };
    patch.baseurl = repo && !/\.github\.io$/i.test(repo) ? '/' + repo : '';
    applyFields(patch, { source: 'suggest' });
    toast('URL and base path filled from GitHub fields');
  }

  function toggleSkinPreview(btn) {
    var html = document.documentElement;
    var skin = readFields().theme_skin || 'air';
    var active = btn.getAttribute('aria-pressed') === 'true';
    if (!active) {
      if (skinPreviewOriginal === null) skinPreviewOriginal = html.getAttribute('data-theme-skin') || 'air';
      html.setAttribute('data-theme-skin', skin);
      btn.setAttribute('aria-pressed', 'true');
      btn.innerHTML = '<i class="bi bi-eye-slash" aria-hidden="true"></i> Stop preview';
    } else {
      if (skinPreviewOriginal !== null) html.setAttribute('data-theme-skin', skinPreviewOriginal);
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = '<i class="bi bi-eye" aria-hidden="true"></i> Preview on this page';
    }
  }

  // ── wiring ───────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    wizard.querySelectorAll('.btn-next').forEach(function (btn) {
      btn.addEventListener('click', function () { showStep(document.getElementById(btn.getAttribute('data-next'))); });
    });
    wizard.querySelectorAll('.btn-prev').forEach(function (btn) {
      btn.addEventListener('click', function () { showStep(document.getElementById(btn.getAttribute('data-prev'))); });
    });
    wizard.querySelectorAll('#wizardTabs .wizard-step').forEach(function (btn) {
      btn.addEventListener('click', function () { showStep(btn); });
    });

    wizard.addEventListener('input', function (event) {
      var el = event.target;
      if (el.classList && el.classList.contains('is-invalid')) validateField(el);
      refreshAll();
      saveDraft();
      emit('change', { source: 'user', keys: [el.getAttribute('data-key') || el.id] });
    });

    wizard.addEventListener('change', function (event) {
      var el = event.target;
      if (el.classList && el.classList.contains('cfg-radio') && el.getAttribute('data-key') === 'site_type' && el.checked) {
        applySiteType(el.value);
      }
      if (el.name === 'prereq-os') applyOS(el.value);
      if (el.classList && el.classList.contains('prereq-manual')) {
        var id = el.getAttribute('data-prereq');
        checks[id] = Object.assign({}, checks[id] || {}, { manual: el.checked });
      }
      refreshAll();
      saveDraft();
      emit('change', { source: 'user', keys: [el.getAttribute('data-key') || el.getAttribute('data-col') || el.id] });
    });

    wizard.addEventListener('blur', function (event) {
      if (!event.target.classList || !event.target.classList.contains('cfg-field')) return;
      validateField(event.target);
      refreshStepper();
    }, true);

    // Copy buttons: data-copy="text" or data-copy-target="#id".
    wizard.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-copy], [data-copy-target]');
      if (!btn) return;
      var text = btn.getAttribute('data-copy');
      if (!text) {
        var target = document.querySelector(btn.getAttribute('data-copy-target') || '');
        text = target ? target.textContent : '';
      }
      if (text) copyText(text).catch(function () { /* ignore */ });
    });

    // File tabs.
    var tabs = document.getElementById('wizard-file-tabs');
    if (tabs) {
      tabs.addEventListener('click', function (event) {
        var b = event.target.closest('.wizard-file-tab');
        if (!b) return;
        activeFile = b.getAttribute('data-file');
        updatePreview();
        saveDraft();
      });
    }

    var descField = document.getElementById('cfg-description');
    var descCount = document.getElementById('desc-count');
    var syncCount = function () { if (descField && descCount) descCount.textContent = descField.value.length; };
    if (descField) descField.addEventListener('input', syncCount);

    var bind = function (id, fn) { var el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    bind('btn-download', downloadActive);
    bind('btn-download-all', downloadBundle);
    bind('btn-copy', copyActive);
    bind('btn-copy-full', copyActive);
    bind('btn-suggest-urls', suggestUrls);
    bind('btn-nav-add', function () {
      var host = document.getElementById('nav-editor');
      if (!host) return;
      var empty = host.querySelector('p');
      if (empty) empty.remove();
      host.appendChild(navRow({ title: '', url: '/', icon: '' }));
      host.lastElementChild.querySelector('.nav-title').focus();
    });
    bind('btn-nav-regenerate', function () { renderNavEditor(defaultNavigation()); refreshAll(); saveDraft(); });
    bind('btn-skin-preview', function (e) { toggleSkinPreview(e.currentTarget); });
    bind('btn-reset', function () {
      if (window.confirm('Clear every answer and start the Site Builder again?')) resetAll();
    });

    window.addEventListener('pagehide', flushDraft);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushDraft(); });

    // Order matters: restore first so the initial preview and stepper reflect
    // the real content; hash wins over the draft's remembered step.
    applyOS(detectOS());
    renderNavEditor(defaultNavigation());
    restoreDraft();
    if (!readNavigation().length) renderNavEditor(defaultNavigation());
    var hashStep = (location.hash || '').replace(/^#step-/, '');
    if (hashStep && STEP_IDS.indexOf('tab-' + hashStep) !== -1) showStep('tab-' + hashStep, { silent: true });
    syncCount();
    refreshAll();

    emit('ready', {});
  });

  // ── public API (consumed by assets/js/site-builder.js) ───────────

  window.Zer0SetupWizard = {
    version: 2,
    data: DATA,
    steps: STEP_IDS.map(function (id) { return id.replace(/^tab-/, ''); }),
    getState: getState,
    getSummary: getSummary,
    schema: schema,
    applyFields: applyFields,
    getFiles: getFiles,
    getFile: getFile,
    setOverride: setOverride,
    getStep: function () { return activeStepId().replace(/^tab-/, ''); },
    setStep: function (id) { return showStep(id); },
    setCheckResult: setCheckResult,
    getChecks: function () { return JSON.parse(JSON.stringify(checks)); },
    setActiveFile: function (path) { activeFile = path; updatePreview(); },
    buildBundle: buildBundle,
    clearDraft: clearDraft,
    toast: toast,
    on: on
  };
})();
