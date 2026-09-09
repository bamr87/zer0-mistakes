// Feature: ZER0-086
// Feature: ZER0-085
// Feature: ZER0-087
/**
 * ===================================================================
 * Site Builder — embedded AI session (site-builder.js)
 * ===================================================================
 *
 * File:    assets/js/site-builder.js
 * Markup:  _includes/setup/claude-session.html (inside setup/wizard.html)
 * Config:  #siteBuilderConfig (endpoints, defaults) · #siteBuilderData
 *          (catalogs, providers, session modes, framework brief, per-step
 *          prompts) — both emitted by the include
 * Peer:    assets/js/setup-wizard.js exposes window.Zer0SetupWizard; this
 *          script never touches form controls directly — it goes through
 *          that API so the form stays the single source of truth.
 *
 * What it does
 *   1. Connects to the LOCAL dev proxy (templates/deploy/chat-proxy/
 *      dev-proxy.mjs): GET {endpoint}/status. Offline → the panel explains
 *      how to connect and every proxy-backed button stays disabled. Online →
 *      live prerequisite checks, "Write project" and the compose actions
 *      light up; the chat lights up once the chosen PROVIDER has a
 *      credential.
 *   2. Bring your own AI — Claude (Anthropic) or Grok (xAI). The Connect
 *      step shows which providers the proxy already has keys for (masked)
 *      and lets the user paste a token for this session: it is POSTed once
 *      to the local proxy (localhost only), never kept in the page or in
 *      browser storage, and optionally saved to .env by the proxy.
 *   3. Streams replies from {chatEndpoint}. The proxy translates for Grok,
 *      so the client speaks ONE dialect (Anthropic Messages SSE) whichever
 *      provider answers, with the same tool-use loop.
 *   4. Two session modes: GUIDED (the nine steps, per-step prompts) and OPEN
 *      (chat-driven, any order — create a site, open an existing one, edit
 *      files, generate images, rebuild — like a coding session). Long tool
 *      loops show a round counter and can be stopped.
 *   5. Gives the model the WHOLE wizard as context on every turn: framework
 *      brief, field schema, current step, a summary of every answer, check
 *      result and generated file, and the working project when one is open.
 *   6. Tools (see buildTools): read state / files / theme source / docs;
 *      set fields, override a generated file, jump steps; run prerequisite
 *      checks; resolve the target folder; write the project; open/list/read/
 *      write/edit/delete files in an existing project; git status/diff/log;
 *      generate an image into assets/; run docker compose (incl. jekyll
 *      build); check whether the site answers. Every mutation shows an
 *      inline confirmation card first — same contract as ai-chat.js.
 *   7. Persists the visible transcript in sessionStorage (text turns only,
 *      never tool blocks, so a restored history can't orphan a tool_result)
 *      and the provider/model/mode preferences in localStorage (never a
 *      token).
 *
 * Safety contracts (mirror .github/instructions/ai-chat.instructions.md)
 *   - Escape-first rendering; cards built with createElement/textContent.
 *   - Mutating tools require confirmation; a decline returns a tool_result
 *     telling the model not to retry.
 *   - History trimming keeps the buffer starting on a plain user text turn;
 *     an interrupted run gets synthetic tool_results so no tool_use is left
 *     unanswered.
 *   - A credential is only ever sent to a localhost proxy endpoint.
 *   - Nothing here can reach a host that isn't the same-origin site or the
 *     configured proxy endpoints.
 * ===================================================================
 */

(function () {
  'use strict';

  function readJSON(id, fallback) {
    var el = document.getElementById(id);
    if (!el) return fallback;
    try { return JSON.parse(el.textContent); } catch (e) { return fallback; }
  }

  var CONFIG = readJSON('siteBuilderConfig', null);
  var DATA = readJSON('siteBuilderData', {}) || {};
  var panel = document.getElementById('siteBuilderPanel');
  if (!CONFIG || !panel || CONFIG.enabled === false) return;

  var TRANSCRIPT_KEY = 'zer0-site-builder-transcript';
  var PREFS_KEY = 'zer0-site-builder-prefs';
  var MAX_MESSAGES = 60;
  var TOOL_ROUNDS = { guided: 12, open: 24 };
  var MAX_TOOL_TEXT = 40000;
  var STATUS_POLL_MS = 15000;
  var STATUS_POLL_MAX = 40;
  var IMAGE_ASPECTS = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9', '5:2'];

  var STATUS_MESSAGES = {
    401: 'The provider rejected the credential. Enter a fresh token on the Connect step.',
    403: 'Access denied by the proxy (origin not allowed?).',
    429: 'Rate limit reached. Wait a moment and try again.',
    500: 'The AI service is temporarily unavailable.',
    501: 'The proxy has no credential for this provider yet. Add one on the Connect step.',
    529: 'The AI service is overloaded right now. Try again shortly.'
  };

  // --- DOM ---------------------------------------------------------
  var els = {
    messages: document.getElementById('sb-messages'),
    offline: document.getElementById('sb-offline'),
    chips: document.getElementById('sb-chips'),
    form: document.getElementById('sb-form'),
    input: document.getElementById('sb-input'),
    send: document.getElementById('sb-send'),
    stop: document.getElementById('sb-stop'),
    badge: document.getElementById('sb-status-badge'),
    modeBadge: document.getElementById('sb-mode-badge'),
    clear: document.getElementById('sb-clear'),
    collapse: document.getElementById('sb-collapse'),
    body: document.getElementById('sb-body'),
    note: document.getElementById('sb-context-note'),
    disclaimer: document.getElementById('sb-disclaimer'),
    title: document.getElementById('sb-title'),
    connectStatus: document.getElementById('connect-status'),
    connectRetry: document.getElementById('btn-connect-retry'),
    connectHowto: document.getElementById('connect-howto'),
    providerFieldset: document.getElementById('sb-providers'),
    credentialForm: document.getElementById('sb-credential-form'),
    tokenInput: document.getElementById('sb-token'),
    tokenUse: document.getElementById('sb-token-use'),
    tokenPersist: document.getElementById('sb-token-persist'),
    tokenHint: document.getElementById('sb-token-hint'),
    credentialStatus: document.getElementById('sb-credential-status'),
    modelSelect: document.getElementById('sb-model'),
    modelNote: document.getElementById('sb-model-note'),
    imageSelect: document.getElementById('sb-image-provider'),
    imageNote: document.getElementById('sb-image-note'),
    runChecks: document.getElementById('btn-run-checks'),
    terminal: document.getElementById('wizard-terminal'),
    targetInput: document.getElementById('cfg-target'),
    targetRoot: document.getElementById('target-root'),
    targetResolved: document.getElementById('target-resolved'),
    projectSelect: document.getElementById('sb-project-select'),
    projectOpen: document.getElementById('btn-project-open'),
    writeProject: document.getElementById('btn-write-project'),
    composeUp: document.getElementById('btn-compose-up'),
    composeBuild: document.getElementById('btn-compose-build'),
    composeLogs: document.getElementById('btn-compose-logs'),
    composeDown: document.getElementById('btn-compose-down'),
    checkLive: document.getElementById('btn-check-live'),
    proxyHint: document.getElementById('build-proxy-hint')
  };

  // --- State -------------------------------------------------------
  var state = {
    connected: false,      // the dev proxy answers
    ready: false,          // the chosen provider has a credential
    status: null,          // GET /status payload
    provider: null,        // 'anthropic' | 'xai'
    model: null,
    imageProvider: '',
    mode: (CONFIG.mode === 'open' ? 'open' : 'guided'),
    project: null,         // { name, abs, exists, tree: [] } once a project is opened
    busy: false,
    abort: null,           // AbortController for the running turn
    history: [],           // Messages API turns
    polls: 0,
    pollTimer: null
  };

  function W() { return window.Zer0SetupWizard || null; }

  // --- Preferences (never a token) --------------------------------
  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') || {}; } catch (e) { return {}; }
  }

  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ provider: state.provider, model: state.model, mode: state.mode, imageProvider: state.imageProvider }));
    } catch (e) { /* private mode */ }
  }

  var prefs = loadPrefs();
  if (prefs.mode === 'open' || prefs.mode === 'guided') state.mode = prefs.mode;
  // There is always a selected provider card: an explicit choice (remembered,
  // or pinned by site_builder.provider) or the first catalog entry. Only an
  // explicit choice stops the session from following whatever provider the
  // proxy reports it can answer with.
  if (CONFIG.provider && CONFIG.provider !== 'auto') state.provider = CONFIG.provider;
  if (prefs.provider) state.provider = prefs.provider;
  state.providerExplicit = !!state.provider;
  if (!state.provider) state.provider = (DATA.providers && DATA.providers[0] && DATA.providers[0].id) || 'anthropic';
  if (prefs.model) state.model = prefs.model;
  if (typeof prefs.imageProvider === 'string') state.imageProvider = prefs.imageProvider;
  else if (CONFIG.imageProvider) state.imageProvider = CONFIG.imageProvider;

  // --- Provider helpers ---------------------------------------------
  function catalogProvider(id) {
    return (DATA.providers || []).filter(function (p) { return p.id === id; })[0] || null;
  }

  function statusProvider(id) {
    var s = state.status;
    return s && s.providers && s.providers[id || state.provider] ? s.providers[id || state.provider] : null;
  }

  function providerName(id) {
    var p = statusProvider(id) || catalogProvider(id || state.provider);
    return p ? p.label : 'Claude';
  }

  function providerVendor(id) {
    var p = statusProvider(id) || catalogProvider(id || state.provider);
    return p ? p.vendor : 'Anthropic';
  }

  function imageProviderInfo(id) {
    var s = state.status;
    var key = id || state.imageProvider;
    return s && s.image && s.image.providers && s.image.providers[key] ? s.image.providers[key] : null;
  }

  function providerPin() {
    var s = state.status;
    return s && s.providerPin && s.providerPin !== 'auto' ? s.providerPin : null;
  }

  function isLocalEndpoint() {
    try {
      var u = new URL(endpoint('/credentials'), window.location.href);
      return ['localhost', '127.0.0.1', '::1', '[::1]'].indexOf(u.hostname) !== -1;
    } catch (e) { return false; }
  }

  // --- Rendering helpers -------------------------------------------
  function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /** Escape first, then a small Markdown subset (headings, bold, code, fences, links, bullets). */
  function renderMarkdown(raw) {
    var safe = escapeHtml(raw || '');
    var fences = [];
    safe = safe.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/gi, function (_m, lang, code) {
      fences.push('<pre class="sb-code"><code' + (lang ? ' data-lang="' + lang + '"' : '') + '>' + code.replace(/\n$/, '') + '</code></pre>');
      return ' F' + (fences.length - 1) + ' ';
    });
    safe = safe
      .replace(/^###\s+(.+)$/gm, '<strong>$1</strong>')
      .replace(/^##\s+(.+)$/gm, '<strong>$1</strong>')
      .replace(/^#\s+(.+)$/gm, '<strong>$1</strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, function (_m, label, href) {
        var external = /^https?:/i.test(href);
        return '<a href="' + href + '"' + (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + label + '</a>';
      })
      .replace(/^\s*\d+\.\s+(.+)$/gm, '<span class="sb-li">$1</span>')
      .replace(/^\s*[-*]\s+(.+)$/gm, '<span class="sb-li">• $1</span>')
      .replace(/\n{2,}/g, '<br><br>')
      .replace(/\n/g, '<br>');
    safe = safe.replace(/ F(\d+) /g, function (_m, i) { return fences[Number(i)] || ''; });
    return safe;
  }

  function scrollToBottom() {
    if (els.messages) els.messages.scrollTop = els.messages.scrollHeight;
  }

  function appendMessage(role, content, opts) {
    if (!els.messages) return null;
    if (els.offline) els.offline.hidden = true;
    var wrapper = document.createElement('div');
    wrapper.className = 'sb-message sb-message--' + role + ' mb-2';
    var bubble = document.createElement('div');
    bubble.className = 'sb-bubble p-2 rounded-3 small';
    if (role === 'assistant') bubble.innerHTML = renderMarkdown(content);
    else bubble.textContent = content;
    wrapper.appendChild(bubble);
    els.messages.appendChild(wrapper);
    scrollToBottom();
    if (!(opts && opts.transient)) persistTranscript(role, content);
    return bubble;
  }

  function appendNotice(text, kind) {
    if (!els.messages) return;
    var note = document.createElement('div');
    note.className = 'sb-notice small text-body-secondary mb-2 ' + (kind || '');
    note.textContent = text;
    els.messages.appendChild(note);
    scrollToBottom();
  }

  function showTyping() {
    removeTyping();
    if (!els.messages) return;
    var wrapper = document.createElement('div');
    wrapper.className = 'sb-message sb-message--assistant mb-2';
    wrapper.id = 'sbTyping';
    wrapper.innerHTML = '<div class="sb-bubble p-2 rounded-3 small"><span class="sb-typing"><span>.</span><span>.</span><span>.</span></span></div>';
    els.messages.appendChild(wrapper);
    scrollToBottom();
  }

  function removeTyping() {
    var t = document.getElementById('sbTyping');
    if (t) t.remove();
  }

  function addMeta(card, label, value) {
    if (value === undefined || value === null || value === '') return;
    var row = document.createElement('div');
    row.className = 'sb-card-meta';
    var l = document.createElement('span');
    l.className = 'text-body-secondary';
    l.textContent = label + ': ';
    var v = document.createElement('span');
    v.textContent = String(value);
    row.appendChild(l);
    row.appendChild(v);
    card.appendChild(row);
  }

  /** Inline confirmation card; resolves true/false. */
  function requestConfirmation(opts) {
    return new Promise(function (resolve) {
      var card = document.createElement('div');
      card.className = 'sb-card rounded-3 p-2 mb-2 small';
      var heading = document.createElement('div');
      heading.className = 'fw-semibold mb-1';
      heading.textContent = opts.heading;
      card.appendChild(heading);
      (opts.fields || []).forEach(function (field) { addMeta(card, field.label, field.value); });
      if (opts.list && opts.list.length) {
        var ul = document.createElement('ul');
        ul.className = 'sb-card-list mb-1';
        opts.list.slice(0, 30).forEach(function (item) {
          var li = document.createElement('li');
          li.textContent = item;
          ul.appendChild(li);
        });
        if (opts.list.length > 30) {
          var more = document.createElement('li');
          more.textContent = '… ' + (opts.list.length - 30) + ' more';
          ul.appendChild(more);
        }
        card.appendChild(ul);
      }
      (opts.blocks || []).forEach(function (b) {
        var label = document.createElement('div');
        label.className = 'text-body-secondary mt-1';
        label.textContent = b.label;
        var pre = document.createElement('pre');
        pre.className = 'sb-diff mb-1';
        pre.textContent = String(b.text || '').slice(0, 1200) + (String(b.text || '').length > 1200 ? '\n…' : '');
        card.appendChild(label);
        card.appendChild(pre);
      });
      var buttons = document.createElement('div');
      buttons.className = 'd-flex gap-2 mt-2';
      var ok = document.createElement('button');
      ok.type = 'button';
      ok.className = 'btn btn-primary btn-sm';
      ok.textContent = opts.confirmLabel || 'Confirm';
      var cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'btn btn-outline-secondary btn-sm';
      cancel.textContent = 'Cancel';
      buttons.appendChild(ok);
      buttons.appendChild(cancel);
      card.appendChild(buttons);
      function finish(result) {
        ok.disabled = true;
        cancel.disabled = true;
        card.classList.add('sb-card--resolved');
        card.classList.add(result ? 'sb-card--accepted' : 'sb-card--declined');
        resolve(result);
      }
      ok.addEventListener('click', function () { finish(true); });
      cancel.addEventListener('click', function () { finish(false); });
      if (els.offline) els.offline.hidden = true;
      els.messages.appendChild(card);
      scrollToBottom();
    });
  }

  function appendResultCard(title, lines, actions, extra) {
    var card = document.createElement('div');
    card.className = 'sb-card sb-card--result rounded-3 p-2 mb-2 small';
    var heading = document.createElement('div');
    heading.className = 'fw-semibold mb-1';
    heading.textContent = title;
    card.appendChild(heading);
    (lines || []).forEach(function (line) {
      var p = document.createElement('div');
      p.className = 'sb-card-meta';
      p.textContent = line;
      card.appendChild(p);
    });
    if (extra && extra.imageSrc) {
      var img = document.createElement('img');
      img.className = 'sb-image-thumb mt-1';
      img.alt = extra.imageAlt || 'Generated image';
      img.loading = 'lazy';
      img.src = extra.imageSrc;
      card.appendChild(img);
    }
    if (actions && actions.length) {
      var row = document.createElement('div');
      row.className = 'd-flex gap-2 mt-2 flex-wrap';
      actions.forEach(function (a) {
        if (a.href) {
          var link = document.createElement('a');
          link.className = 'btn btn-sm btn-outline-primary';
          link.href = a.href;
          link.target = '_blank';
          link.rel = 'noopener';
          link.textContent = a.label;
          row.appendChild(link);
        } else {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn btn-sm btn-outline-secondary';
          btn.textContent = a.label;
          btn.addEventListener('click', a.onClick);
          row.appendChild(btn);
        }
      });
      card.appendChild(row);
    }
    els.messages.appendChild(card);
    scrollToBottom();
  }

  // --- Transcript persistence (text only) --------------------------
  function persistTranscript(role, content) {
    try {
      var raw = sessionStorage.getItem(TRANSCRIPT_KEY);
      var list = raw ? JSON.parse(raw) : [];
      list.push({ role: role, content: String(content).slice(0, 8000) });
      while (list.length > MAX_MESSAGES) list.shift();
      sessionStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(list));
    } catch (e) { /* private mode */ }
  }

  function restoreTranscript() {
    var list;
    try { list = JSON.parse(sessionStorage.getItem(TRANSCRIPT_KEY) || '[]'); } catch (e) { return; }
    if (!Array.isArray(list) || !list.length) return;
    list.forEach(function (turn) {
      if (turn && (turn.role === 'user' || turn.role === 'assistant') && turn.content) {
        appendMessage(turn.role, turn.content, { transient: true });
        state.history.push({ role: turn.role, content: turn.content });
      }
    });
    trimHistory();
    appendNotice('Conversation restored from this browser session.');
  }

  function clearTranscript() {
    state.history = [];
    try { sessionStorage.removeItem(TRANSCRIPT_KEY); } catch (e) { /* ignore */ }
    if (els.messages) {
      Array.prototype.slice.call(els.messages.children).forEach(function (child) {
        if (child.id !== 'sb-offline') child.remove();
      });
    }
    if (els.offline) els.offline.hidden = state.connected;
    if (state.connected && state.ready) appendMessage('assistant', welcomeText(), { transient: true });
  }

  // --- Connection --------------------------------------------------
  function endpoint(path) {
    return String(CONFIG.endpoint || '/api/wizard').replace(/\/$/, '') + path;
  }

  function trimPath(p) {
    var parts = String(p || '').split(/[\\/]/).filter(Boolean);
    return parts.length > 2 ? '…/' + parts.slice(-2).join('/') : p;
  }

  function describeSource(p) {
    if (!p || !p.configured) return '';
    return (p.source === 'session' ? 'session token ' : (p.source === 'env' ? '.env ' : '')) + (p.masked || '');
  }

  /** Reconcile provider/model/image choices with what the proxy reports. */
  function applyStatus(status) {
    state.status = status;
    var providers = status.providers || {};
    var ids = Object.keys(providers);
    var pin = providerPin();
    if (pin && providers[pin]) {
      state.provider = pin;
    } else if (!state.providerExplicit || !providers[state.provider]) {
      // No explicit choice: follow the provider the proxy would answer with.
      var follow = (status.auth && status.auth.provider) || ids.filter(function (id) { return providers[id].configured; })[0];
      if (follow) state.provider = follow;
      else if (!providers[state.provider] && ids.length) state.provider = ids[0];
    }
    var p = providers[state.provider] || null;
    state.ready = !!(p && p.configured);
    if (p) {
      if (p.pinned) state.model = p.model;
      else if (!state.model || (p.models || []).indexOf(state.model) === -1) state.model = p.model || p.defaultModel;
    }
    var image = status.image || { providers: {}, default: null };
    if (state.imageProvider && !(image.providers && image.providers[state.imageProvider])) state.imageProvider = '';
    if (!state.imageProvider && image.default && !prefs.imageProviderCleared) state.imageProvider = image.default;
    // Preferences record explicit choices only (see selectProviderUI / the
    // select handlers); an auto-derived provider must not become "remembered".
  }

  function setConnected(connected, status, detail) {
    state.connected = connected;
    if (connected && status) applyStatus(status);
    else { state.status = null; state.ready = false; }
    var ready = connected && state.ready;
    var label = providerName();
    panel.setAttribute('data-state', connected ? 'online' : 'offline');
    panel.setAttribute('data-ready', ready ? 'true' : 'false');
    panel.setAttribute('data-provider', state.provider || '');
    panel.setAttribute('data-mode', state.mode);

    if (els.badge) {
      els.badge.className = 'sb-status-badge badge rounded-pill ' + (ready ? 'text-bg-success' : connected ? 'text-bg-warning' : 'text-bg-secondary');
      els.badge.textContent = ready ? label + ' connected' : connected ? 'needs a token' : 'offline';
      els.badge.title = ready ? 'Connected to ' + label + ' (' + providerVendor() + ') via ' + (describeSource(statusProvider()) || 'the dev proxy') : connected ? 'The dev proxy is up; add a ' + label + ' token on the Connect step' : 'Dev proxy not reachable';
    }
    if (els.modeBadge) { els.modeBadge.textContent = state.mode === 'open' ? 'open session' : 'guided'; els.modeBadge.hidden = !connected; }
    if (els.title) els.title.textContent = (ready ? label : 'AI') + ' session';
    // The status poll runs every 15 s, including in the middle of a turn — it
    // must never hand the composer back while tools are still running, or a
    // long action (docker compose, an image render) looks finished when it is
    // not, and a second send can interleave with the first.
    if (els.input) { els.input.disabled = !ready || state.busy; els.input.placeholder = ready ? (state.mode === 'open' ? 'Tell ' + label + ' what to build or change…' : 'Ask ' + label + ', or describe your site…') : 'Connect a provider to start chatting'; }
    if (els.send) { els.send.disabled = !ready || state.busy; els.send.hidden = state.busy; }
    if (els.stop) { els.stop.hidden = !state.busy; els.stop.disabled = !state.busy; }
    if (els.disclaimer) els.disclaimer.textContent = label + ' sees every answer on this page. Actions ask for confirmation first.';
    if (els.offline) els.offline.hidden = ready || els.messages.children.length > 1;
    document.querySelectorAll('.sb-needs-proxy').forEach(function (btn) { btn.disabled = !connected; });
    if (els.proxyHint) els.proxyHint.hidden = connected;
    if (els.connectHowto) els.connectHowto.hidden = ready;
    document.querySelectorAll('.sb-provider-name').forEach(function (el) { el.textContent = label; });

    if (els.connectStatus) {
      els.connectStatus.setAttribute('data-state', ready ? 'online' : connected ? 'partial' : 'offline');
      els.connectStatus.className = 'sb-connect-status alert d-flex align-items-start gap-3 mb-3 ' + (ready ? 'alert-success' : connected ? 'alert-info' : 'alert-warning');
      var title = els.connectStatus.querySelector('.sb-status-title');
      var det = els.connectStatus.querySelector('.sb-status-detail');
      var ep = els.connectStatus.querySelector('.sb-endpoint');
      if (title) title.textContent = ready ? label + ' (' + providerVendor() + ') is connected through the local dev proxy.' : connected ? 'Dev proxy connected — ' + label + ' still needs a token.' : 'Dev proxy not reachable.';
      if (ep) ep.textContent = endpoint('/status');
      if (det) det.textContent = ready
        ? 'Auth: ' + (describeSource(statusProvider()) || 'proxy') + ' · model: ' + (state.model || '') + ' · sites are written under ' + (status && status.scaffold && status.scaffold.root ? status.scaffold.root : 'the theme\'s parent folder') + '.'
        : connected
          ? 'Paste a ' + label + ' token below (it stays in the proxy\'s memory) or put it in .env and restart the proxy. Checks, writing and Docker already work.'
          : (detail || 'Start it with the command below; this page re-checks every 15 seconds.') + ' Endpoint: ' + endpoint('/status');
    }
    if (els.targetRoot && status && status.scaffold && status.scaffold.root) {
      els.targetRoot.textContent = trimPath(status.scaffold.root) + '/';
      els.targetRoot.title = status.scaffold.root;
    }
    if (els.note) els.note.textContent = ready ? 'Model: ' + (state.model || '') : '';
    renderProviderControls();
    renderProjects();
  }

  /** The Connect step's provider cards, token form, model + image selects. */
  function renderProviderControls() {
    var status = state.status;
    var pin = providerPin();
    var connected = state.connected;
    var current = statusProvider();
    var cat = catalogProvider(state.provider);

    document.querySelectorAll('input[name="sb_provider"]').forEach(function (radio) {
      radio.checked = radio.value === state.provider;
      radio.disabled = !!(pin && pin !== radio.value);
      var card = document.querySelector('label[for="' + radio.id + '"]');
      var badge = document.querySelector('.sb-provider-state[data-provider="' + radio.value + '"]');
      var p = statusProvider(radio.value);
      if (badge) {
        var configured = !!(p && p.configured);
        badge.className = 'badge rounded-pill sb-provider-state ' + (configured ? 'text-bg-success' : connected ? 'text-bg-warning' : 'text-bg-secondary');
        badge.textContent = configured ? (p.source === 'session' ? 'session ' : '.env ') + p.masked : connected ? 'needs a token' : 'proxy offline';
        badge.title = pin && pin !== radio.value ? 'The proxy pins CHAT_PROVIDER=' + pin : '';
      }
      if (card) card.classList.toggle('is-pinned-out', !!(pin && pin !== radio.value));
    });

    if (els.tokenInput) {
      els.tokenInput.disabled = !connected;
      els.tokenInput.placeholder = cat && cat.token_placeholder ? cat.token_placeholder : 'paste a token';
    }
    if (els.tokenUse) els.tokenUse.disabled = !connected;
    if (els.tokenPersist) els.tokenPersist.disabled = !connected;
    if (els.tokenHint) {
      els.tokenHint.textContent = (cat && cat.token_hint ? cat.token_hint + ' ' : '') + 'The token goes once to the local proxy and stays in its memory — never in this page or your browser storage.';
    }
    if (els.credentialStatus) {
      els.credentialStatus.innerHTML = '';
      if (current && current.configured) {
        var span = document.createElement('span');
        span.className = current.source === 'session' ? 'text-success' : 'text-body-secondary';
        span.textContent = current.source === 'session'
          ? providerName() + ' is using the token you entered this session (' + current.masked + ').'
          : providerName() + ' is using the key from the proxy\'s environment (' + current.masked + '). Enter a new one to override it for this session.';
        els.credentialStatus.appendChild(span);
        if (current.source === 'session') {
          var forget = document.createElement('button');
          forget.type = 'button';
          forget.className = 'btn btn-link btn-sm p-0 ms-2 align-baseline';
          forget.id = 'sb-token-forget';
          forget.textContent = 'Forget it';
          forget.addEventListener('click', function () { forgetCredential(state.provider); });
          els.credentialStatus.appendChild(forget);
        }
      } else if (connected) {
        var hint = document.createElement('span');
        hint.className = 'text-body-secondary';
        hint.textContent = 'No ' + providerName() + ' credential on the proxy yet.';
        els.credentialStatus.appendChild(hint);
      }
    }

    if (els.modelSelect) {
      els.modelSelect.innerHTML = '';
      var models = (current && current.models) || (cat && cat.models) || [];
      if (state.model && models.indexOf(state.model) === -1) models = [state.model].concat(models);
      models.forEach(function (m) {
        var opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        els.modelSelect.appendChild(opt);
      });
      if (state.model) els.modelSelect.value = state.model;
      els.modelSelect.disabled = !connected || !!(current && current.pinned);
      if (els.modelNote) els.modelNote.textContent = current && current.pinned ? 'Pinned by the proxy (CHAT_MODEL / XAI_CHAT_MODEL).' : 'Sent with every request; the proxy can pin one with CHAT_MODEL / XAI_CHAT_MODEL.';
    }

    if (els.imageSelect) {
      var image = status && status.image ? status.image : { providers: {}, default: null };
      Array.prototype.forEach.call(els.imageSelect.options, function (opt) {
        if (!opt.value) return;
        var ip = image.providers && image.providers[opt.value];
        var base = opt.getAttribute('data-label') || opt.textContent.replace(/\s*\((needs a key|ready.*)\)$/, '');
        opt.setAttribute('data-label', base);
        opt.textContent = base + (ip && ip.configured ? ' (ready · ' + (ip.masked || '') + ')' : ' (needs a key)');
      });
      els.imageSelect.value = state.imageProvider || '';
      els.imageSelect.disabled = !connected;
      var chosen = imageProviderInfo();
      if (els.imageNote) {
        els.imageNote.textContent = !state.imageProvider
          ? 'Off — generate_image will explain how to enable it.'
          : chosen && chosen.configured
            ? 'Renders with ' + chosen.label + ' (' + chosen.model + ') straight into the project\'s assets/ folder.'
            : 'Needs a key: choose ' + (state.imageProvider === 'xai' ? 'Grok' : 'the matching provider') + ' above and paste its token.';
      }
    }
    document.querySelectorAll('input[name="sb_mode"]').forEach(function (radio) { radio.checked = radio.value === state.mode; });
  }

  function renderProjects() {
    if (!els.projectSelect) return;
    var list = (state.status && state.status.projects) || [];
    var keep = els.projectSelect.value;
    els.projectSelect.innerHTML = '';
    var first = document.createElement('option');
    first.value = '';
    first.textContent = list.length ? '— pick a site under ' + trimPath(state.status.scaffold.root) + ' —' : (state.connected ? 'No sites found under the target root yet' : 'Connect the dev proxy to list sites');
    els.projectSelect.appendChild(first);
    list.forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p.name;
      opt.textContent = p.name + (p.compose ? ' (docker)' : '');
      els.projectSelect.appendChild(opt);
    });
    if (keep && list.some(function (p) { return p.name === keep; })) els.projectSelect.value = keep;
    els.projectSelect.disabled = !state.connected || !list.length;
    if (els.projectOpen) els.projectOpen.disabled = !state.connected;
  }

  function welcomeText() {
    var w = W();
    var step = w ? w.getStep() : 'connect';
    var label = providerName();
    if (state.mode === 'open') {
      return 'Connected to **' + label + '**. This is an open session: tell me what you want — a new site from a brief, changes to an existing one (I can open, read, edit and add files, generate images and rebuild), or questions about the theme. The steps on the left are optional.';
    }
    return 'Connected to **' + label + '**. I can see every answer in this wizard and update it for you. Tell me about the site you want, or pick a suggestion below — we are on the **' + step + '** step.';
  }

  async function checkStatus(manual) {
    try {
      var resp = await fetch(endpoint('/status'), { method: 'GET', cache: 'no-store' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var data = await resp.json();
      if (!data || !data.ok) throw new Error('unexpected status payload');
      var wasReady = state.connected && state.ready;
      var wasConnected = state.connected;
      setConnected(true, data);
      if (state.ready && !wasReady) {
        if (!state.history.length) appendMessage('assistant', welcomeText(), { transient: true });
        else appendNotice('Reconnected: ' + providerName() + ' is ready.');
        renderChips();
      } else if (!wasConnected) {
        appendNotice('Dev proxy connected. Add a ' + providerName() + ' token on the Connect step to start the session.');
        renderChips();
      }
      state.polls = 0;
      return true;
    } catch (err) {
      setConnected(false, null, manual ? 'Still not reachable (' + (err.message || 'network error') + ').' : null);
      return false;
    }
  }

  function schedulePoll() {
    clearTimeout(state.pollTimer);
    state.pollTimer = setTimeout(async function () {
      if (!state.connected) {
        state.polls += 1;
        if (state.polls > STATUS_POLL_MAX) return; // give up quietly; Retry still works
      }
      await checkStatus(false);
      schedulePoll();
    }, STATUS_POLL_MS);
  }

  // --- Credentials (bring your own key) ------------------------------
  function credentialStatus(text, cls) {
    if (!els.credentialStatus) return;
    els.credentialStatus.innerHTML = '';
    var span = document.createElement('span');
    span.className = cls || 'text-body-secondary';
    span.textContent = text;
    els.credentialStatus.appendChild(span);
  }

  async function submitCredential(e) {
    if (e) e.preventDefault();
    if (!els.tokenInput) return;
    var token = els.tokenInput.value.trim();
    if (!token) { credentialStatus('Paste a token first.', 'text-warning'); return; }
    if (!state.connected) { credentialStatus('Start the dev proxy first — the token has nowhere to go.', 'text-warning'); return; }
    if (!isLocalEndpoint()) { credentialStatus('Tokens are only ever sent to a local dev proxy (localhost). This page is configured for ' + endpoint('') + '.', 'text-danger'); return; }
    var provider = state.provider;
    var persist = !!(els.tokenPersist && els.tokenPersist.checked);
    els.tokenUse.disabled = true;
    els.tokenInput.disabled = true;
    credentialStatus('Checking the token with ' + providerVendor(provider) + '…');
    try {
      var r = await proxyPost('/credentials', { provider: provider, token: token, persist: persist, test: true });
      els.tokenInput.value = '';
      if (els.tokenPersist) els.tokenPersist.checked = false;
      await checkStatus(true);
      credentialStatus(providerName(provider) + ' connected (' + r.masked + ')' + (r.persisted ? ' and saved to ' + trimPath(r.persisted.file) + '.' : ' for this session.'), 'text-success');
      appendNotice(providerName(provider) + ' connected' + (r.persisted ? ' · saved to .env' : ' · this session only') + '.');
    } catch (err) {
      credentialStatus(err.message, 'text-danger');
    } finally {
      els.tokenUse.disabled = !state.connected;
      els.tokenInput.disabled = !state.connected;
      els.tokenInput.focus();
    }
  }

  async function forgetCredential(provider) {
    try {
      var resp = await fetch(endpoint('/credentials?provider=' + encodeURIComponent(provider)), { method: 'DELETE' });
      if (!resp.ok) throw new Error('proxy request failed (' + resp.status + ')');
      await checkStatus(true);
      appendNotice('Session token for ' + providerName(provider) + ' forgotten.');
    } catch (err) {
      credentialStatus(err.message, 'text-danger');
    }
  }

  function selectProviderUI(id) {
    if (!id || id === state.provider) return;
    state.provider = id;
    state.providerExplicit = true;
    var p = statusProvider(id);
    state.model = p ? p.model : null;
    state.ready = !!(p && p.configured);
    savePrefs();
    setConnected(state.connected, state.status);
    var w = W();
    if (w) w.applyFields({ ai_provider: id }, { silent: true, source: 'session' });
    renderChips();
    if (state.connected && state.ready && !state.history.length) appendMessage('assistant', welcomeText(), { transient: true });
  }

  function selectMode(mode) {
    if (mode !== 'open' && mode !== 'guided') return;
    state.mode = mode;
    savePrefs();
    setConnected(state.connected, state.status);
    renderChips();
    if (state.connected && state.ready) appendNotice(mode === 'open' ? 'Open session: any order, any request — the steps are optional.' : 'Guided mode: the assistant follows the steps with you.');
  }

  // --- Chips (suggested prompts) --------------------------------
  function currentStepData() {
    var w = W();
    var id = w ? w.getStep() : null;
    return (DATA.steps || []).filter(function (s) { return s.id === id; })[0] || null;
  }

  function fillTemplate(text) {
    var w = W();
    var f = w ? w.getState().fields : {};
    return String(text).replace(/\{(\w+)\}/g, function (_m, key) {
      if (key === 'ai') return providerName();
      var v = f[key];
      return v ? String(v) : '(' + key + ' not set yet)';
    });
  }

  function renderChips() {
    if (!els.chips) return;
    els.chips.innerHTML = '';
    if (!state.connected || !state.ready) return;
    var prompts = state.mode === 'open'
      ? ((DATA.open_session && DATA.open_session.prompts) || [])
      : ((currentStepData() || {}).prompts || []);
    prompts.forEach(function (prompt) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'sb-chip btn btn-sm btn-outline-secondary rounded-pill';
      chip.textContent = fillTemplate(prompt).replace(/\(brief not set yet\)/, '…');
      chip.addEventListener('click', function () { sendMessage(fillTemplate(prompt)); });
      els.chips.appendChild(chip);
    });
  }

  // --- System prompt -----------------------------------------------
  function projectSection() {
    if (!state.project) return ['## Working project: none opened yet (open_project, or write_site_files creates one from the wizard).'];
    var lines = ['## Working project: ' + state.project.name + ' (' + state.project.abs + ') — ' + (state.project.exists ? 'exists' : 'not created yet')];
    if (state.project.tree && state.project.tree.length) {
      lines.push('Files (' + state.project.tree.length + (state.project.truncated ? '+' : '') + '):');
      lines.push(state.project.tree.slice(0, 80).join(', '));
    }
    lines.push('Project tools act inside this folder: list_project_files, read_project_file, write_project_file, edit_project_file, delete_project_file, run_project_command, generate_image, run_compose.');
    return lines;
  }

  function buildSystemPrompt() {
    var w = W();
    var fw = DATA.framework || {};
    var step = currentStepData();
    var label = providerName();
    var lines = [];
    if (state.mode === 'open') {
      lines.push('You are ' + label + ' (' + providerVendor() + '), the site-building agent for the zer0-mistakes Jekyll theme, embedded in the Site Builder page and connected to the user\'s machine through a local proxy. Work like a coding assistant in a terminal: the user says what they want, you plan briefly, use tools, and report what changed. The nine-step form is a convenience, not a script — fill it (set_wizard_fields, set_site_plan) when creating a NEW site, or skip it and work directly on an EXISTING project with open_project + read/edit/write_project_file, run_compose("build") to validate, run_compose("up") to serve, generate_image for artwork. Ask only when a decision is genuinely the user\'s.');
    } else {
      lines.push('You are ' + label + ' (' + providerVendor() + '), the Site Builder guide for the zer0-mistakes Jekyll theme, embedded in a nine-step wizard the user is filling in right now. Your job is to get them from nothing to a complete, personalised, running site — asking short focused questions, proposing concrete values, and applying them with tools so the forms and the generated files update live.');
    }
    lines.push('');
    lines.push('## Framework brief');
    lines.push(fw.summary || 'Docker-first Jekyll theme on Bootstrap 5.');
    if (fw.key_config) { lines.push('Key config:'); fw.key_config.forEach(function (k) { lines.push('- ' + k); }); }
    if (fw.customisation) { lines.push('Customisation:'); fw.customisation.forEach(function (k) { lines.push('- ' + k); }); }
    if (fw.guardrails) { lines.push('Guardrails:'); fw.guardrails.forEach(function (k) { lines.push('- ' + k); }); }
    lines.push('');
    lines.push('## Wizard steps (in order): ' + (DATA.steps || []).map(function (s) { return s.id + ' (' + s.label + ')'; }).join(' → '));
    if (step) lines.push('Current step: ' + step.id + ' — ' + step.summary);
    lines.push('Session mode: ' + state.mode + '. Image generation: ' + (state.imageProvider && imageProviderInfo() && imageProviderInfo().configured ? imageProviderInfo().label + ' (' + imageProviderInfo().model + ')' : 'not configured — tell the user to add an xAI or OpenAI key on the Connect step if they ask for images') + '.');
    lines.push('');
    lines.push('## Fields you may set with set_wizard_fields');
    (w ? w.schema() : []).forEach(function (f) {
      lines.push('- ' + f.key + ' · ' + f.type + (f.options ? ' · options: ' + f.options.join('|') : '') + ' · "' + f.label + '"');
    });
    lines.push('');
    lines.push('## Current wizard state');
    lines.push(w ? w.getSummary() : '(wizard not ready)');
    lines.push('');
    lines.push('## Generated files: ' + (w ? w.getFiles().map(function (f) { return f.path; }).join(', ') : ''));
    lines.push('');
    lines.push.apply(lines, projectSection());
    lines.push('');
    lines.push('## Site plan (set_site_plan) — the schema you must follow');
    lines.push('The plan is validated against this JSON-Schema subset before anything changes; invalid plans are rejected with the errors, so fix and resend.');
    lines.push(JSON.stringify(w ? w.planSchema() : {}));
    var cat = function (name, fmt) { return (DATA[name] || []).map(fmt).join('; '); };
    lines.push('Catalogs: landing_templates = ' + cat('landing_templates', function (t) { return t.id + ' (' + t.description + ')'; }));
    lines.push('section_types = ' + cat('section_types', function (s) { return s.id + ' → ' + s.fields; }));
    lines.push('navigation_styles = ' + cat('navigation_styles', function (n) { return n.id + ' (' + n.description + ')'; }) + '. sidebar_modes = ' + cat('sidebar_modes', function (m) { return m.id + ' (' + m.description + ')'; }));
    lines.push('palettes = ' + cat('palettes', function (p) { return p.id + (p.primary ? ' ' + p.primary + '/' + p.secondary + '/' + p.accent : ''); }) + '; or preset "custom" with primary/secondary/accent hex.');
    lines.push('font_pairings = ' + cat('font_pairings', function (f) { return f.id + ' (' + f.description + ')'; }) + '. radius_options = ' + cat('radius_options', function (r) { return r.id; }));
    lines.push('How the plan becomes files: landing → index.md + _data/landing.yml; navigation → _data/navigation/main.yml (grouped = dropdowns of planned pages) and _data/navigation/docs.yml when sidebar=docs; theme → assets/css/user-overrides.css (+ _includes/custom/head.html for web fonts); pages → one Markdown file each (posts get a date). Bodies are Markdown WITHOUT front matter.');
    lines.push('A good plan for a new site: one template that fits the type, a hero with a real headline (not the site title repeated), 3–5 sections with specific copy, 4–6 pages spread across the enabled collections with 150–300 word bodies, a palette/font pairing/radius that match the tone. Use the theme skin for the base and a palette only when it clearly helps.');
    lines.push('Current plan:\n' + (w ? JSON.stringify(w.getPlan()).slice(0, 4000) : ''));
    lines.push('');
    lines.push('## How to work');
    lines.push('- Be concise. One or two short paragraphs, or a short list. Never restate the whole state.');
    if (state.mode === 'open') {
      lines.push('- New site: draft identity/structure/appearance/voice from the brief, apply with set_wizard_fields + set_site_plan in as few calls as possible, resolve_target, write_site_files, run_compose("up"), check_site_live. Then keep going: the user can ask for anything else.');
      lines.push('- Existing site: open_project first (list_projects shows candidates), read what matters (read_project_file "_config.yml", the file you are about to change), make surgical changes with edit_project_file, add files with write_project_file, then run_compose("build") — read the tail and fix errors before declaring done. Use run_project_command("git-status"/"git-diff") to show what changed.');
      lines.push('- Images: generate_image saves into assets/ and returns the path; then wire it in (front matter preview:, landing hero image, or an <img>) with an edit. Say which provider rendered it.');
      lines.push('- Chain tools freely (up to ' + TOOL_ROUNDS.open + ' rounds per turn) but stop and summarise when a step needs the user\'s judgement or a confirmation was declined.');
    } else {
      lines.push('- When the user describes their site, draft title/subtitle/tagline/description (120–160 chars), pick a site_type, collections, skin and tone that fit, and APPLY them with set_wizard_fields in one call. The page shows a confirmation card; you do not need to ask "shall I?" once values are sensible.');
      lines.push('- For the Voice step, write welcome_title, welcome_body and about_body as real Markdown in the chosen tone and audience, then apply them. Do not put YAML front matter in bodies — the generator adds it.');
      lines.push('- For the Structure and Appearance steps, design the SITE PLAN with set_site_plan (schema above): landing template + hero + sections with real copy, navigation style/sidebar, palette/fonts/radius, and 4–6 example pages with Markdown bodies. One call with the whole plan beats many small ones.');
      lines.push('- Prerequisites: run_prerequisite_check("all") then explain only what failed, with the install command for the user\'s OS.');
      lines.push('- Build: review get_generated_file output for mistakes first; resolve_target before write_site_files; after writing, offer run_compose("up"); read run_compose("logs") when something fails and explain the fix. Then check_site_live. To change a written site afterwards, use the project tools (edit_project_file, write_project_file) and run_compose("build").');
    }
    lines.push('- Ground answers about the theme in real source: use read_theme_file / list_theme_dir / search_theme_docs rather than guessing. Cite the path you read.');
    lines.push('- Never ask for or echo credentials. Keys go in .env or the Connect step; say so.');
    lines.push('- After a tool succeeds, one sentence on what changed and the natural next step (use go_to_step when moving on in guided mode).');
    lines.push('- Today is ' + new Date().toISOString().slice(0, 10) + '. Theme version: ' + (CONFIG.themeVersion || 'unknown') + '.');
    return lines.join('\n');
  }

  // --- Tools -------------------------------------------------------
  function buildTools() {
    var obj = function (props, required) { return { type: 'object', properties: props, required: required || [] }; };
    var commandIds = (state.status && state.status.projectCommands) || ['git-status', 'git-diff', 'git-log', 'git-init'];
    var composeActions = ['up', 'ps', 'logs', 'down', 'restart', 'config', 'build'];
    var tools = [
      { name: 'get_wizard_state', description: 'Return the full wizard state as JSON: every field, chosen collections, navigation, prerequisite check results, target folder and the list of generated files.', input_schema: obj({}) },
      { name: 'set_wizard_fields', description: 'Set one or more wizard fields (see the schema in the system prompt). Keys are field keys; `collections` takes an array of ids; `navigation` takes an array of {title,url,icon}. The user confirms on an inline card before anything changes. Prefer one call with several fields over many calls.', input_schema: obj({ fields: { type: 'object', description: 'Map of field key → value.' }, note: { type: 'string', description: 'One line shown on the confirmation card explaining the change.' } }, ['fields']) },
      { name: 'get_site_plan', description: 'Return the current site plan (landing, navigation, theme overrides, planned pages) as JSON, plus the resolved landing page (template defaults filled in).', input_schema: obj({}) },
      { name: 'set_site_plan', description: 'Apply a partial or complete site plan: landing {template, hero, sections}, navigation {style, sidebar, items}, theme {palette, fonts, radius}, pages [{collection, slug, title, description, date, categories, tags, body}]. Validated against the schema in the system prompt; errors come back for you to fix. `landing.hero` merges field by field, so a later call may add just an image; `landing.sections`, `navigation.items` and `pages` REPLACE (pages merge when merge_pages is true). The user confirms on a card before anything changes.', input_schema: obj({ plan: { type: 'object', description: 'The plan (partial allowed). Bodies are Markdown without front matter.' }, merge_pages: { type: 'boolean', description: 'true = merge pages by collection+slug instead of replacing the list.' }, note: { type: 'string', description: 'One line shown on the confirmation card.' } }, ['plan']) },
      { name: 'go_to_step', description: 'Move the wizard to a step by id (connect, prereqs, identity, urls, structure, appearance, voice, integrations, build).', input_schema: obj({ step: { type: 'string' } }, ['step']) },
      { name: 'get_generated_file', description: 'Return the current content of one generated project file (e.g. "_config.yml", "pages/_about/index.md"). Omit path to list all files with sizes.', input_schema: obj({ path: { type: 'string' } }) },
      { name: 'set_file_override', description: 'Replace the content of ONE generated file with your own version (e.g. a richer about page or a tweaked _config.yml). Pass the COMPLETE new content. The user confirms first. Pass content null to remove the override and return to the generated version.', input_schema: obj({ path: { type: 'string' }, content: { type: ['string', 'null'] }, summary: { type: 'string', description: 'One line: what changed.' } }, ['path', 'summary']) },
      { name: 'run_prerequisite_check', description: 'Run an allow-listed read-only check on the user\'s machine through the local dev proxy. id is one of the prerequisite check ids, or "all". Results also update the checklist on the Prerequisites step.', input_schema: obj({ id: { type: 'string' } }, ['id']) },
      { name: 'read_theme_file', description: 'Read a text source file from the zer0-mistakes theme checkout (layouts, includes, sass, docs, config, scripts). Use to answer framework questions from real source. Secrets and vendored/build directories are not readable.', input_schema: obj({ path: { type: 'string', description: 'Repo-relative path, e.g. "_layouts/home.html" or "_config.yml".' } }, ['path']) },
      { name: 'list_theme_dir', description: 'List the entries of a directory in the theme checkout, e.g. "_layouts", "_includes/components", "_sass/theme", "pages/_docs/features".', input_schema: obj({ path: { type: 'string' } }) },
      { name: 'search_theme_docs', description: 'Full-text search of this site\'s published documentation (search.json). Returns the best matching pages with URL and snippet.', input_schema: obj({ query: { type: 'string' }, limit: { type: 'integer' } }, ['query']) },
      { name: 'resolve_target', description: 'Check where the project folder would be created and whether it exists / is empty. Uses the wizard\'s target field when omitted.', input_schema: obj({ target: { type: 'string' } }) },
      { name: 'write_site_files', description: 'Write EVERY generated file into the target project folder through the dev proxy. Existing files are skipped unless overwrite is true. The user confirms on a card listing the files first.', input_schema: obj({ target: { type: 'string' }, overwrite: { type: 'boolean' } }) },
      { name: 'list_projects', description: 'List existing sites under the proxy\'s target root — folders with a _config.yml or docker-compose.yml: sites this builder wrote earlier, or any Jekyll site placed there. Use before open_project when the user wants to modify a site.', input_schema: obj({}) },
      { name: 'open_project', description: 'Open a site folder under the target root as the WORKING PROJECT (existing to modify, or new to create): sets the wizard target, resolves it, and returns a tree of its files. Every project tool acts inside it afterwards.', input_schema: obj({ target: { type: 'string', description: 'Folder name under the target root (as listed by list_projects) or an absolute path inside it.' } }, ['target']) },
      { name: 'list_project_files', description: 'Depth-limited tree of the working project. Optional path narrows it (e.g. "pages" or "_data").', input_schema: obj({ path: { type: 'string' }, depth: { type: 'integer' } }) },
      { name: 'read_project_file', description: 'Read a text file from the working project, e.g. "_config.yml" or "pages/_posts/2026-01-01-welcome.md".', input_schema: obj({ path: { type: 'string' } }, ['path']) },
      { name: 'write_project_file', description: 'Create or replace ONE text file in the working project with the COMPLETE content (Markdown, YAML, HTML/Liquid, CSS/SCSS, JS, JSON, SVG). Existing files need overwrite:true. The user confirms on a card first. For small changes prefer edit_project_file.', input_schema: obj({ path: { type: 'string' }, content: { type: 'string' }, overwrite: { type: 'boolean' }, summary: { type: 'string', description: 'One line: what this file is / what changed.' } }, ['path', 'content', 'summary']) },
      { name: 'edit_project_file', description: 'Replace an exact snippet inside a working-project file, like a careful editor: `find` must occur exactly once (pass all:true to replace every occurrence). Whitespace-sensitive. Shows a before/after card for confirmation.', input_schema: obj({ path: { type: 'string' }, find: { type: 'string' }, replace: { type: 'string' }, all: { type: 'boolean' }, summary: { type: 'string' } }, ['path', 'find', 'replace', 'summary']) },
      { name: 'delete_project_file', description: 'Delete one regular file from the working project after confirmation. Never directories.', input_schema: obj({ path: { type: 'string' }, summary: { type: 'string' } }, ['path', 'summary']) },
      { name: 'run_project_command', description: 'Run an allow-listed command inside the working project and return its output: ' + commandIds.join(', ') + '.', input_schema: obj({ id: { type: 'string', enum: commandIds } }, ['id']) },
      { name: 'generate_image', description: 'Render an image with the configured image provider (Grok Imagine on xAI, or OpenAI Images) and save it into the working project under assets/ — path must end in .png, .jpg or .webp, e.g. "assets/images/hero.png". Costs money, so the user confirms first. Returns the saved path; reference it as /assets/... (front matter preview:, landing hero image, or an <img>).', input_schema: obj({ prompt: { type: 'string', description: 'A specific art brief: subject, style, palette, mood, no text in the image.' }, path: { type: 'string' }, aspect_ratio: { type: 'string', enum: IMAGE_ASPECTS }, quality: { type: 'string', enum: ['auto', 'low', 'medium', 'high'] }, provider: { type: 'string', enum: ['xai', 'openai'] }, overwrite: { type: 'boolean' } }, ['prompt', 'path']) },
      { name: 'run_compose', description: 'Run docker compose in the working project: action is "up" (detached, builds), "ps", "logs", "down", "restart", "config" or "build" (runs `jekyll build` inside the running container to validate the site). Use "restart" after ADDING a page or post to a running site — Jekyll\'s watcher only picks up files that existed when it started. Output streams into the Build step terminal and the tail is returned to you. up/down ask the user to confirm.', input_schema: obj({ action: { type: 'string', enum: composeActions }, target: { type: 'string' } }, ['action']) },
      { name: 'check_site_live', description: 'Probe whether the site answers on its dev port (default from the wizard). Returns reachable true/false.', input_schema: obj({ url: { type: 'string' } }) }
    ];
    return tools;
  }

  function toolResult(id, content, isError) {
    var text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    if (text.length > MAX_TOOL_TEXT) text = text.slice(0, MAX_TOOL_TEXT) + '\n[... truncated ...]';
    var r = { type: 'tool_result', tool_use_id: id, content: text };
    if (isError) r.is_error = true;
    return r;
  }

  function declined(id) {
    return toolResult(id, 'The user declined this action on the confirmation card. Do not retry unless they ask again.');
  }

  async function proxyJson(path, opts) {
    var resp = await fetch(endpoint(path), Object.assign({ cache: 'no-store' }, opts || {}));
    var data = await resp.json().catch(function () { return {}; });
    if (!resp.ok) throw new Error((data.error && data.error.message) || ('proxy request failed (' + resp.status + ')'));
    return data;
  }

  async function proxyPost(path, body) {
    return proxyJson(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
  }

  // --- Tool executors -----------------------------------------------
  async function execSetFields(block) {
    var w = W();
    if (!w) return toolResult(block.id, 'Wizard not ready.', true);
    var fields = block.input && block.input.fields;
    if (!fields || typeof fields !== 'object' || !Object.keys(fields).length) return toolResult(block.id, 'fields must be a non-empty object.', true);
    var list = Object.keys(fields).map(function (k) {
      var v = fields[k];
      var shown = Array.isArray(v) ? (typeof v[0] === 'object' ? v.length + ' items' : v.join(', ')) : String(v);
      return k + ' → ' + (shown.length > 90 ? shown.slice(0, 90) + '…' : shown);
    });
    var ok = await requestConfirmation({
      heading: 'Apply ' + list.length + ' change' + (list.length === 1 ? '' : 's') + ' to the wizard?',
      fields: [{ label: 'Why', value: block.input.note || '' }],
      list: list,
      confirmLabel: 'Apply'
    });
    if (!ok) return declined(block.id);
    var result = w.applyFields(fields, { source: 'assistant' });
    w.toast(providerName() + ' updated ' + result.applied.length + ' field' + (result.applied.length === 1 ? '' : 's'));
    return toolResult(block.id, { applied: result.applied, ignored: result.ignored, state: w.getSummary() });
  }

  async function execSetSitePlan(block) {
    var w = W();
    if (!w) return toolResult(block.id, 'Wizard not ready.', true);
    var plan = block.input && block.input.plan;
    if (!plan || typeof plan !== 'object') return toolResult(block.id, 'plan must be an object.', true);
    var errors = w.validatePlan(plan);
    if (errors.length) return toolResult(block.id, 'Plan rejected by the schema:\n- ' + errors.slice(0, 20).join('\n- ') + '\nFix these and call set_site_plan again.', true);
    var list = [];
    if (plan.landing) list.push('landing: ' + [plan.landing.template && 'template ' + plan.landing.template, plan.landing.hero && 'hero “' + (plan.landing.hero.headline || '') + '”', plan.landing.sections && plan.landing.sections.length + ' sections (' + plan.landing.sections.map(function (s) { return s.type; }).join(', ') + ')'].filter(Boolean).join(', '));
    if (plan.navigation) list.push('navigation: ' + Object.keys(plan.navigation).map(function (k) { return k + '=' + (Array.isArray(plan.navigation[k]) ? plan.navigation[k].length + ' items' : plan.navigation[k]); }).join(', '));
    if (plan.theme) list.push('theme: ' + JSON.stringify(plan.theme));
    if (plan.pages) list.push('pages (' + (block.input.merge_pages ? 'merge' : 'replace') + '): ' + plan.pages.map(function (p) { return p.collection + '/' + (p.slug || '?') + (p.body ? '' : ' [no body]'); }).join(', '));
    var ok = await requestConfirmation({
      heading: 'Apply this site plan?',
      fields: [{ label: 'Why', value: block.input.note || '' }],
      list: list,
      confirmLabel: 'Apply plan'
    });
    if (!ok) return declined(block.id);
    var result = w.setPlan(plan, { source: 'assistant', mergePages: block.input.merge_pages === true });
    if (!result.ok) return toolResult(block.id, 'Plan rejected: ' + result.errors.join('; '), true);
    w.toast(providerName() + ' updated the site plan');
    if (plan.landing) w.setActiveFile('_data/landing.yml');
    else if (plan.pages && plan.pages.length) { var first = w.getFiles().filter(function (f) { return f.description && f.description.indexOf('Planned example page') === 0; })[0]; if (first) w.setActiveFile(first.path); }
    return toolResult(block.id, { applied: result.applied, files: w.getFiles().map(function (f) { return f.path; }), plan: w.getPlan() });
  }

  async function execSetOverride(block) {
    var w = W();
    if (!w) return toolResult(block.id, 'Wizard not ready.', true);
    var path = block.input && block.input.path;
    var file = path ? w.getFile(path) : null;
    if (!file) return toolResult(block.id, 'Unknown generated file: ' + path + '. Use get_generated_file with no path to list them.', true);
    var content = block.input.content;
    var removing = content === null || content === undefined;
    var ok = await requestConfirmation({
      heading: removing ? 'Discard the custom version of ' + path + '?' : 'Replace the generated ' + path + '?',
      fields: [
        { label: 'Change', value: block.input.summary || '' },
        { label: 'New length', value: removing ? '' : String(content).length + ' characters' }
      ],
      confirmLabel: removing ? 'Discard override' : 'Replace file'
    });
    if (!ok) return declined(block.id);
    w.setOverride(path, removing ? null : String(content));
    w.setActiveFile(path);
    return toolResult(block.id, (removing ? 'Override removed for ' : 'Replaced ') + path + '. The preview now shows it.');
  }

  async function execRunCheck(block) {
    if (!state.connected) return toolResult(block.id, 'The dev proxy is offline; checks are unavailable. Ask the user to tick items manually.', true);
    var id = String((block.input && block.input.id) || 'all');
    var ids = id === 'all'
      ? (DATA.prerequisites || []).map(function (p) { return p.check; }).filter(Boolean)
      : [id];
    var results = [];
    for (var i = 0; i < ids.length; i += 1) {
      var r = await runCheck(ids[i]);
      results.push(r);
    }
    return toolResult(block.id, results.map(function (r) {
      return r.id + ': ' + (r.ok ? 'ok' + (r.version ? ' v' + r.version : '') : 'FAIL — ' + (r.error || r.output || 'unknown'));
    }).join('\n'));
  }

  async function runCheck(checkId) {
    var w = W();
    var r;
    try { r = await proxyPost('/check', { id: checkId }); } catch (e) { r = { id: checkId, ok: false, error: e.message }; }
    if (w) {
      // Map a check id back to every prerequisite that uses it.
      (DATA.prerequisites || []).forEach(function (p) {
        if (p.check === checkId) w.setCheckResult(p.id, { ok: !!r.ok, installed: r.installed, version: r.version || '', output: r.output || r.error || '', checkedAt: Date.now() });
      });
    }
    return r;
  }

  async function execReadTheme(block) {
    if (!state.connected) return toolResult(block.id, 'The dev proxy is offline; theme source is unavailable.', true);
    try {
      var r = await proxyJson('/file?path=' + encodeURIComponent((block.input && block.input.path) || ''));
      return toolResult(block.id, 'Source of ' + r.path + (r.truncated ? ' (truncated)' : '') + ':\n\n' + r.content);
    } catch (e) { return toolResult(block.id, 'Could not read: ' + e.message, true); }
  }

  async function execListTheme(block) {
    if (!state.connected) return toolResult(block.id, 'The dev proxy is offline.', true);
    try {
      var r = await proxyJson('/ls?path=' + encodeURIComponent((block.input && block.input.path) || '.'));
      return toolResult(block.id, r.path + ':\n' + r.entries.join('\n'));
    } catch (e) { return toolResult(block.id, 'Could not list: ' + e.message, true); }
  }

  var searchIndexCache = null;
  async function execSearchDocs(block) {
    var query = String((block.input && block.input.query) || '').toLowerCase().trim();
    if (!query) return toolResult(block.id, 'query is required.', true);
    try {
      if (!searchIndexCache) {
        var resp = await fetch(CONFIG.searchIndex || '/search.json', { cache: 'force-cache' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        searchIndexCache = await resp.json();
      }
    } catch (e) { return toolResult(block.id, 'Search index unavailable: ' + e.message, true); }
    var terms = query.split(/\s+/).filter(Boolean);
    var scored = (searchIndexCache || []).map(function (item) {
      var hay = ((item.title || '') + ' ' + (item.description || '') + ' ' + (item.content || '')).toLowerCase();
      var score = 0;
      terms.forEach(function (t) {
        if ((item.title || '').toLowerCase().indexOf(t) !== -1) score += 5;
        if ((item.url || '').toLowerCase().indexOf(t) !== -1) score += 2;
        var idx = hay.indexOf(t);
        while (idx !== -1 && score < 60) { score += 1; idx = hay.indexOf(t, idx + t.length); }
      });
      return { item: item, score: score };
    }).filter(function (x) { return x.score > 0; }).sort(function (a, b) { return b.score - a.score; });
    var limit = Math.min(Number(block.input.limit) || 5, 10);
    var out = scored.slice(0, limit).map(function (x) {
      var content = String(x.item.content || '');
      var pos = content.toLowerCase().indexOf(terms[0]);
      var snippet = content.slice(Math.max(0, pos - 120), pos + 220).replace(/\s+/g, ' ');
      return '- ' + x.item.title + ' — ' + x.item.url + (x.item.description ? '\n  ' + x.item.description : '') + '\n  …' + snippet + '…';
    });
    return toolResult(block.id, out.length ? out.join('\n') : 'No documentation pages matched "' + query + '".');
  }

  function execGetFile(block) {
    var w = W();
    if (!w) return toolResult(block.id, 'Wizard not ready.', true);
    var path = block.input && block.input.path;
    if (!path) {
      return toolResult(block.id, w.getFiles().map(function (f) { return f.path + ' (' + f.content.length + ' chars' + (f.overridden ? ', overridden' : '') + ') — ' + f.description; }).join('\n'));
    }
    var file = w.getFile(path);
    if (!file) return toolResult(block.id, 'No generated file at ' + path, true);
    w.setActiveFile(path);
    return toolResult(block.id, file.path + ':\n\n' + file.content);
  }

  function targetValue(input) {
    var w = W();
    return String((input && input.target) || (state.project && state.project.name) || (els.targetInput && els.targetInput.value) || (w ? w.getState().target : '') || '').trim();
  }

  async function resolveTarget(target) {
    var r = await proxyPost('/target', { target: target });
    if (els.targetResolved) {
      els.targetResolved.textContent = r.abs + (r.exists ? (r.empty ? ' — exists, empty.' : ' — exists and is NOT empty; open it as a project to modify it, or enable overwrite.') : ' — will be created.');
      els.targetResolved.className = 'form-text ' + (r.exists && !r.empty ? 'text-warning' : 'text-success');
    }
    return r;
  }

  async function execResolveTarget(block) {
    if (!state.connected) return toolResult(block.id, 'The dev proxy is offline.', true);
    var target = targetValue(block.input);
    if (!target) return toolResult(block.id, 'No target folder set. Ask the user for a folder name (the repository name is a good default) and set the `target` field.', true);
    try {
      var r = await resolveTarget(target);
      return toolResult(block.id, r);
    } catch (e) {
      if (els.targetResolved) { els.targetResolved.textContent = e.message; els.targetResolved.className = 'form-text text-danger'; }
      return toolResult(block.id, 'Target rejected: ' + e.message, true);
    }
  }

  async function writeProject(target, overwrite, viaModel) {
    var w = W();
    var files = w.getFiles();
    var ok = await requestConfirmation({
      heading: 'Write ' + files.length + ' files into ' + target + '?',
      fields: [
        { label: 'Folder', value: target },
        { label: 'Overwrite existing', value: overwrite ? 'yes' : 'no' }
      ],
      list: files.map(function (f) { return f.path; }),
      confirmLabel: 'Write project'
    });
    if (!ok) return { declined: true };
    var r = await proxyPost('/scaffold', { target: target, overwrite: !!overwrite, files: files.map(function (f) { return { path: f.path, content: f.content }; }) });
    var lines = [r.written.length + ' written, ' + r.skipped.length + ' skipped → ' + r.target];
    r.skipped.slice(0, 8).forEach(function (s) { lines.push('skipped ' + s.path + ': ' + s.reason); });
    appendResultCard('Project written', lines, [
      { label: 'docker compose up', onClick: function () { composeAction('up', target); } }
    ]);
    w.clearDraft();
    w.toast('Project written to ' + trimPath(r.target));
    await openProject(target, { quiet: true });
    if (!viaModel) appendNotice('Tip: press "docker compose up" to build and serve it.');
    return r;
  }

  async function execWriteFiles(block) {
    if (!state.connected) return toolResult(block.id, 'The dev proxy is offline; the user can download the bundle instead.', true);
    var target = targetValue(block.input);
    if (!target) return toolResult(block.id, 'No target folder set — set the `target` field first.', true);
    var overwrite = block.input && block.input.overwrite === true;
    try {
      var r = await writeProject(target, overwrite, true);
      if (r.declined) return declined(block.id);
      return toolResult(block.id, { target: r.target, written: r.written.map(function (x) { return x.path; }), skipped: r.skipped });
    } catch (e) { return toolResult(block.id, 'Write failed: ' + e.message, true); }
  }

  // --- Project session executors ------------------------------------
  function projectQuery(path, extra) {
    var q = '?target=' + encodeURIComponent(targetValue()) + '&path=' + encodeURIComponent(path || '.');
    if (extra) q += extra;
    return q;
  }

  async function refreshProjectTree(target) {
    try {
      var r = await proxyJson('/project/tree' + '?target=' + encodeURIComponent(target) + '&path=.&depth=3');
      if (state.project && state.project.name === target) { state.project.tree = r.entries; state.project.truncated = r.truncated; }
      return r;
    } catch (e) { return null; }
  }

  async function openProject(target, opts) {
    opts = opts || {};
    var w = W();
    var r = await resolveTarget(target);
    var name = target;
    if (/^\//.test(target) && r.root && target.indexOf(r.root) === 0) name = target.slice(r.root.length).replace(/^\/+/, '');
    state.project = { name: name, abs: r.abs, exists: r.exists, tree: [], truncated: false };
    if (w) w.applyFields({ target: name }, { silent: true, source: 'session' });
    if (els.projectSelect && Array.prototype.some.call(els.projectSelect.options, function (o) { return o.value === name; })) els.projectSelect.value = name;
    var tree = r.exists ? await refreshProjectTree(name) : null;
    if (els.composeBuild) els.composeBuild.disabled = !state.connected;
    if (!opts.quiet) {
      appendResultCard('Working project: ' + name, [r.abs + (r.exists ? (r.empty ? ' — empty folder' : ' — ' + ((tree && tree.entries.length) || 0) + (tree && tree.truncated ? '+' : '') + ' files') : ' — not created yet')], r.exists ? [
        { label: 'jekyll build', onClick: function () { composeAction('build', name); } },
        { label: 'git status', onClick: async function () { try { var s = await proxyPost('/project/command', { target: name, id: 'git-status' }); terminalWrite('$ git status --short --branch   (' + name + ')\n' + (s.output || '(clean)') + '\n', true); } catch (e) { terminalWrite('[error] ' + e.message + '\n'); } } }
      ] : []);
    }
    return { name: name, abs: r.abs, exists: r.exists, empty: r.empty, tree: tree ? tree.entries : [], truncated: !!(tree && tree.truncated) };
  }

  async function execListProjects(block) {
    if (!state.connected) return toolResult(block.id, 'The dev proxy is offline.', true);
    try {
      var r = await proxyJson('/projects');
      if (state.status) state.status.projects = r.projects;
      renderProjects();
      return toolResult(block.id, r.projects.length ? { root: r.root, projects: r.projects.map(function (p) { return { name: p.name, site: p.site, compose: p.compose }; }) } : 'No sites under ' + r.root + ' yet. write_site_files creates one.');
    } catch (e) { return toolResult(block.id, 'Could not list projects: ' + e.message, true); }
  }

  async function execOpenProject(block) {
    if (!state.connected) return toolResult(block.id, 'The dev proxy is offline.', true);
    var target = String((block.input && block.input.target) || '').trim();
    if (!target) return toolResult(block.id, 'target is required (a folder name under the target root).', true);
    try {
      var p = await openProject(target);
      return toolResult(block.id, { project: p.name, abs: p.abs, exists: p.exists, empty: p.empty, files: p.tree.slice(0, 200), truncated: p.truncated });
    } catch (e) { return toolResult(block.id, 'Could not open ' + target + ': ' + e.message, true); }
  }

  function needProject(block) {
    if (!state.connected) return toolResult(block.id, 'The dev proxy is offline.', true);
    if (!targetValue()) return toolResult(block.id, 'No working project. Call open_project (or set the target field) first.', true);
    return null;
  }

  async function execListProjectFiles(block) {
    var no = needProject(block); if (no) return no;
    try {
      var depth = Number(block.input && block.input.depth) || 3;
      var r = await proxyJson('/project/tree' + projectQuery(block.input && block.input.path, '&depth=' + depth));
      return toolResult(block.id, r.path + ' (' + r.entries.length + (r.truncated ? '+' : '') + ' entries):\n' + r.entries.join('\n'));
    } catch (e) { return toolResult(block.id, 'Could not list: ' + e.message, true); }
  }

  async function execReadProjectFile(block) {
    var no = needProject(block); if (no) return no;
    try {
      var r = await proxyJson('/project/file' + projectQuery(block.input && block.input.path));
      return toolResult(block.id, r.path + (r.truncated ? ' (truncated)' : '') + ':\n\n' + r.content);
    } catch (e) { return toolResult(block.id, 'Could not read: ' + e.message, true); }
  }

  async function execWriteProjectFile(block) {
    var no = needProject(block); if (no) return no;
    var input = block.input || {};
    var path = String(input.path || '');
    var content = typeof input.content === 'string' ? input.content : '';
    if (!path || !content) return toolResult(block.id, 'path and content are required.', true);
    var target = targetValue();
    var ok = await requestConfirmation({
      heading: (input.overwrite ? 'Replace ' : 'Write ') + path + ' in ' + target + '?',
      fields: [{ label: 'Change', value: input.summary || '' }, { label: 'Size', value: content.length + ' characters' }],
      blocks: [{ label: 'Content (start)', text: content }],
      confirmLabel: input.overwrite ? 'Replace file' : 'Write file'
    });
    if (!ok) return declined(block.id);
    try {
      var r = await proxyPost('/project/write', { target: target, path: path, content: content, overwrite: input.overwrite === true });
      // A file the watcher never saw start is invisible to a running server.
      var newCollectionDoc = !r.replaced && /^pages\/_[^/]+\//.test(r.path);
      appendResultCard((r.replaced ? 'Replaced ' : 'Wrote ') + r.path,
        [r.bytes + ' bytes in ' + trimPath(r.target)].concat(newCollectionDoc ? ['New collection document — restart the dev server to see it.'] : []),
        newCollectionDoc ? [{ label: 'docker compose restart', onClick: function () { composeAction('restart', target); } }] : []);
      refreshProjectTree(target);
      return toolResult(block.id, Object.assign({ path: r.path, bytes: r.bytes, replaced: r.replaced },
        newCollectionDoc ? { note: 'This is a NEW collection document. Jekyll\'s watcher only tracks files that existed when it started, so the running site will not list it until you call run_compose("restart").' } : {}));
    } catch (e) {
      return toolResult(block.id, 'Write failed: ' + e.message + (/exists/.test(e.message) ? ' Pass overwrite:true to replace it, or use edit_project_file.' : ''), true);
    }
  }

  async function execEditProjectFile(block) {
    var no = needProject(block); if (no) return no;
    var input = block.input || {};
    var path = String(input.path || '');
    if (!path || typeof input.find !== 'string' || !input.find) return toolResult(block.id, 'path and a non-empty find are required.', true);
    var target = targetValue();
    var ok = await requestConfirmation({
      heading: 'Edit ' + path + ' in ' + target + '?',
      fields: [{ label: 'Change', value: input.summary || '' }, { label: 'Scope', value: input.all ? 'every occurrence' : 'one occurrence' }],
      blocks: [{ label: 'Find', text: input.find }, { label: 'Replace with', text: typeof input.replace === 'string' ? input.replace : '' }],
      confirmLabel: 'Apply edit'
    });
    if (!ok) return declined(block.id);
    try {
      var r = await proxyPost('/project/edit', { target: target, path: path, find: input.find, replace: typeof input.replace === 'string' ? input.replace : '', all: input.all === true });
      appendResultCard('Edited ' + r.path, [r.replacements + ' replacement' + (r.replacements === 1 ? '' : 's') + ', now ' + r.bytes + ' bytes']);
      return toolResult(block.id, { path: r.path, replacements: r.replacements, bytes: r.bytes });
    } catch (e) { return toolResult(block.id, 'Edit failed: ' + e.message, true); }
  }

  async function execDeleteProjectFile(block) {
    var no = needProject(block); if (no) return no;
    var input = block.input || {};
    var path = String(input.path || '');
    if (!path) return toolResult(block.id, 'path is required.', true);
    var target = targetValue();
    var ok = await requestConfirmation({
      heading: 'Delete ' + path + ' from ' + target + '?',
      fields: [{ label: 'Why', value: input.summary || '' }],
      confirmLabel: 'Delete file'
    });
    if (!ok) return declined(block.id);
    try {
      var r = await proxyPost('/project/delete', { target: target, path: path });
      appendResultCard('Deleted ' + r.path, []);
      refreshProjectTree(target);
      return toolResult(block.id, 'Deleted ' + r.path + '.');
    } catch (e) { return toolResult(block.id, 'Delete failed: ' + e.message, true); }
  }

  async function execProjectCommand(block) {
    var no = needProject(block); if (no) return no;
    var id = String((block.input && block.input.id) || '');
    var target = targetValue();
    try {
      var r = await proxyPost('/project/command', { target: target, id: id });
      terminalWrite('$ ' + id + '   (' + target + ')\n' + (r.output || '(no output)') + '\n', true);
      return toolResult(block.id, (r.ok ? '' : '[failed] ' + (r.error || '') + '\n') + (r.output || '(no output)'), !r.ok);
    } catch (e) { return toolResult(block.id, 'Command failed: ' + e.message, true); }
  }

  async function execGenerateImage(block) {
    var no = needProject(block); if (no) return no;
    var input = block.input || {};
    var prompt = String(input.prompt || '').trim();
    var path = String(input.path || 'assets/images/generated.png');
    if (!prompt) return toolResult(block.id, 'prompt is required.', true);
    var provider = input.provider || state.imageProvider || (state.status && state.status.image && state.status.image.default) || '';
    var info = imageProviderInfo(provider);
    if (!provider || !info || !info.configured) {
      return toolResult(block.id, 'No image provider is ready. Ask the user to pick one on the Connect step and paste its key (Grok Imagine needs an xAI key, OpenAI Images an OpenAI key).', true);
    }
    var target = targetValue();
    var ok = await requestConfirmation({
      heading: 'Generate an image with ' + info.label + '?',
      fields: [{ label: 'Prompt', value: prompt.length > 220 ? prompt.slice(0, 220) + '…' : prompt }, { label: 'Saved as', value: target + '/' + path }, { label: 'Aspect', value: input.aspect_ratio || 'provider default' }, { label: 'Model', value: info.model }],
      confirmLabel: 'Generate'
    });
    if (!ok) return declined(block.id);
    appendNotice('Rendering with ' + info.label + '… this takes a few seconds.');
    try {
      var r = await proxyPost('/image', { target: target, path: path, prompt: prompt, provider: provider, aspect_ratio: input.aspect_ratio, quality: input.quality, overwrite: input.overwrite === true });
      var src = endpoint('/asset?target=' + encodeURIComponent(target) + '&path=' + encodeURIComponent(r.path) + '&t=' + Date.now());
      appendResultCard('Image saved: ' + r.path, [r.provider + ' · ' + r.model + ' · ' + Math.round(r.bytes / 1024) + ' KB' + (r.replaced ? ' (replaced)' : '')], [], { imageSrc: src, imageAlt: prompt.slice(0, 120) });
      refreshProjectTree(target);
      return toolResult(block.id, { path: r.path, url: '/' + r.path, bytes: r.bytes, provider: r.provider, model: r.model, revised_prompt: r.revised_prompt || '', hint: 'Reference it as /' + r.path + ' — e.g. preview: /' + r.path + ' in front matter, landing.hero.image, or an <img>.' });
    } catch (e) {
      return toolResult(block.id, 'Image generation failed: ' + e.message + (/exists/.test(e.message) ? ' Pass overwrite:true or a new path.' : ''), true);
    }
  }

  function terminalWrite(text, reset) {
    if (!els.terminal) return;
    els.terminal.hidden = false;
    if (reset) els.terminal.textContent = '';
    els.terminal.textContent += text;
    if (els.terminal.textContent.length > 60000) els.terminal.textContent = els.terminal.textContent.slice(-60000);
    els.terminal.scrollTop = els.terminal.scrollHeight;
  }

  async function composeAction(action, target, viaModel) {
    var w = W();
    target = target || targetValue();
    if (!target) { if (w) w.toast('Set a project folder first'); return { ok: false, error: 'no target' }; }
    if (action === 'up' || action === 'down') {
      var ok = await requestConfirmation({
        heading: action === 'up' ? 'Build and start the dev server?' : 'Stop the dev server?',
        fields: [{ label: 'Command', value: 'docker compose ' + (action === 'up' ? 'up -d --build' : 'down') }, { label: 'Folder', value: target }],
        confirmLabel: action === 'up' ? 'Start' : 'Stop'
      });
      if (!ok) return { declined: true };
    }
    terminalWrite('$ docker compose ' + action + '   (' + target + ')\n', true);
    var setBusy = function (on) { [els.composeUp, els.composeBuild, els.composeLogs, els.composeDown, els.writeProject].forEach(function (b) { if (b) b.disabled = on || !state.connected; }); };
    setBusy(true);
    var tail = '';
    try {
      var resp = await fetch(endpoint('/compose'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ target: target, action: action }) });
      if (!resp.ok || !resp.body) throw new Error('proxy request failed (' + resp.status + ')');
      var reader = resp.body.getReader();
      var decoder = new TextDecoder();
      while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;
        var text = decoder.decode(chunk.value, { stream: true });
        tail = (tail + text).slice(-6000);
        terminalWrite(text);
      }
    } catch (e) {
      terminalWrite('\n[error] ' + e.message + '\n');
      tail += '\n[error] ' + e.message;
    } finally { setBusy(false); }
    var okExit = /\[exit\] ok/.test(tail);
    if (action === 'up' && okExit) {
      var port = w ? w.getState().port : CONFIG.defaultPort;
      appendResultCard('Dev server starting', ['First build installs gems and can take a few minutes. The page below reloads on its own once Jekyll is serving.'], [
        { label: 'Open http://localhost:' + port + '/', href: 'http://localhost:' + port + '/' },
        { label: 'Show logs', onClick: function () { composeAction('logs', target); } }
      ]);
    }
    if (action === 'build') appendResultCard(okExit ? 'jekyll build passed' : 'jekyll build failed', [okExit ? 'The site builds cleanly with its dev config.' : 'See the terminal on the Build step; the assistant can read the tail and fix it.']);
    if (action === 'restart' && okExit) appendResultCard('Dev server restarted', ['Newly added pages and posts are picked up on the next build.']);
    if (!viaModel && w) w.toast('docker compose ' + action + (okExit ? ' finished' : ' failed — see the terminal'));
    return { ok: okExit, tail: tail };
  }

  async function execCompose(block) {
    if (!state.connected) return toolResult(block.id, 'The dev proxy is offline.', true);
    var action = String((block.input && block.input.action) || '');
    var r = await composeAction(action, targetValue(block.input), true);
    if (r.declined) return declined(block.id);
    return toolResult(block.id, 'docker compose ' + action + ' → ' + (r.ok ? 'ok' : 'failed') + '\n\n' + (r.tail || r.error || ''), !r.ok && action !== 'logs' && action !== 'ps');
  }

  async function checkLive(url) {
    var w = W();
    url = url || ('http://localhost:' + (w ? w.getState().port : CONFIG.defaultPort) + '/');
    try {
      // An opaque response resolves when something is listening; a refused
      // connection rejects. Good enough for "is the dev server up".
      await fetch(url, { mode: 'no-cors', cache: 'no-store' });
      return { url: url, reachable: true };
    } catch (e) { return { url: url, reachable: false, error: e.message }; }
  }

  async function execCheckLive(block) {
    var r = await checkLive(block.input && block.input.url);
    appendResultCard(r.reachable ? 'Site is answering' : 'Nothing is listening yet', [r.url], r.reachable ? [{ label: 'Open', href: r.url }] : []);
    return toolResult(block.id, r);
  }

  async function executeTool(block) {
    var w = W();
    switch (block.name) {
      case 'get_wizard_state': return toolResult(block.id, w ? Object.assign(w.getState(), { files: w.getFiles().map(function (f) { return f.path; }), project: state.project ? state.project.name : null }) : 'Wizard not ready.');
      case 'set_wizard_fields': return execSetFields(block);
      case 'get_site_plan': return toolResult(block.id, w ? { plan: w.getPlan(), resolvedLanding: w.landingPlan() } : 'Wizard not ready.');
      case 'set_site_plan': return execSetSitePlan(block);
      case 'go_to_step': {
        var ok = w && w.setStep(String((block.input && block.input.step) || ''));
        renderChips();
        return toolResult(block.id, ok ? 'Now on step ' + block.input.step + '.' : 'Could not open step ' + (block.input && block.input.step) + ' (unknown, or locked by an invalid earlier field).', !ok);
      }
      case 'get_generated_file': return execGetFile(block);
      case 'set_file_override': return execSetOverride(block);
      case 'run_prerequisite_check': return execRunCheck(block);
      case 'read_theme_file': return execReadTheme(block);
      case 'list_theme_dir': return execListTheme(block);
      case 'search_theme_docs': return execSearchDocs(block);
      case 'resolve_target': return execResolveTarget(block);
      case 'write_site_files': return execWriteFiles(block);
      case 'list_projects': return execListProjects(block);
      case 'open_project': return execOpenProject(block);
      case 'list_project_files': return execListProjectFiles(block);
      case 'read_project_file': return execReadProjectFile(block);
      case 'write_project_file': return execWriteProjectFile(block);
      case 'edit_project_file': return execEditProjectFile(block);
      case 'delete_project_file': return execDeleteProjectFile(block);
      case 'run_project_command': return execProjectCommand(block);
      case 'generate_image': return execGenerateImage(block);
      case 'run_compose': return execCompose(block);
      case 'check_site_live': return execCheckLive(block);
      default: return toolResult(block.id, 'Unknown tool: ' + block.name, true);
    }
  }

  // --- Messages API (streaming through the proxy) -------------------
  async function streamAssistant(payload, onTextDelta, signal) {
    var response = await fetch(CONFIG.chatEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: signal
    });
    if (!response.ok) {
      var errorData = await response.json().catch(function () { return {}; });
      var apiMessage = errorData.error && errorData.error.message;
      throw new Error(apiMessage || STATUS_MESSAGES[response.status] || 'API request failed (' + response.status + ')');
    }
    var contentType = response.headers.get('content-type') || '';
    if (contentType.indexOf('text/event-stream') === -1) {
      var data = await response.json();
      return { content: data.content || [], stopReason: data.stop_reason || null };
    }

    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    var blocks = [];
    var partialJson = {};
    var stopReason = null;

    function handleEvent(evt) {
      switch (evt.type) {
        case 'content_block_start':
          blocks[evt.index] = Object.assign({}, evt.content_block);
          if (evt.content_block.type === 'tool_use') partialJson[evt.index] = '';
          break;
        case 'content_block_delta':
          if (evt.delta.type === 'text_delta') {
            blocks[evt.index].text = (blocks[evt.index].text || '') + evt.delta.text;
            if (onTextDelta) onTextDelta(evt.delta.text);
          } else if (evt.delta.type === 'input_json_delta') {
            partialJson[evt.index] += evt.delta.partial_json;
          }
          break;
        case 'content_block_stop':
          if (blocks[evt.index] && blocks[evt.index].type === 'tool_use') {
            try { blocks[evt.index].input = partialJson[evt.index] ? JSON.parse(partialJson[evt.index]) : {}; } catch (e) { blocks[evt.index].input = {}; }
          }
          break;
        case 'message_delta':
          if (evt.delta && evt.delta.stop_reason) stopReason = evt.delta.stop_reason;
          break;
        case 'error':
          throw new Error((evt.error && evt.error.message) || 'Stream error');
      }
    }

    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      var nl;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        var line = buffer.slice(0, nl).replace(/\r$/, '');
        buffer = buffer.slice(nl + 1);
        if (line.indexOf('data:') !== 0) continue;
        var dataStr = line.slice(5).trim();
        if (!dataStr) continue;
        var evt;
        try { evt = JSON.parse(dataStr); } catch (e) { continue; }
        handleEvent(evt);
      }
    }

    var content = blocks.filter(Boolean).map(function (b) {
      if (b.type === 'text') return { type: 'text', text: b.text || '' };
      if (b.type === 'tool_use') return { type: 'tool_use', id: b.id, name: b.name, input: b.input || {} };
      return null;
    }).filter(Boolean);
    return { content: content, stopReason: stopReason };
  }

  // Trim from the front until the buffer starts with a plain user text turn —
  // never orphan a tool_result from its tool_use.
  function trimHistory() {
    while (state.history.length > MAX_MESSAGES) state.history.shift();
    while (state.history.length && !(state.history[0].role === 'user' && typeof state.history[0].content === 'string')) state.history.shift();
  }

  // An interrupted run may leave an assistant tool_use without its result;
  // answer it synthetically so the next request is well-formed.
  function repairHistory(reason) {
    var last = state.history[state.history.length - 1];
    if (!last || last.role !== 'assistant' || !Array.isArray(last.content)) return;
    var pending = last.content.filter(function (b) { return b.type === 'tool_use'; });
    if (!pending.length) return;
    state.history.push({ role: 'user', content: pending.map(function (b) { return toolResult(b.id, reason || 'The user stopped the run before this tool executed.', true); }) });
  }

  function setBusy(on) {
    state.busy = on;
    if (els.input) els.input.disabled = on || !(state.connected && state.ready);
    if (els.send) { els.send.disabled = on || !(state.connected && state.ready); els.send.hidden = on; }
    if (els.stop) { els.stop.hidden = !on; els.stop.disabled = !on; }
  }

  function stopRun() {
    if (state.abort) { try { state.abort.abort(); } catch (e) { /* already done */ } }
  }

  function errorHint(message) {
    var label = providerName();
    if (/revoked|invalid.*(token|key)|authentication|401|incorrect api key/i.test(message)) {
      return state.provider === 'xai'
        ? ' The xAI key was rejected: create a new one at console.x.ai and paste it on the Connect step.'
        : ' The ' + label + ' credential is no longer valid: run `claude setup-token` (or make a new API key) and paste it on the Connect step.';
    }
    if (/501|no .*credential/i.test(message)) return ' Add a ' + label + ' token on the Connect step.';
    return '';
  }

  async function sendMessage(text) {
    text = String(text || '').trim();
    if (!text || state.busy || !state.connected || !state.ready) return;
    appendMessage('user', text);
    state.history.push({ role: 'user', content: text });
    setBusy(true);
    state.abort = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    showTyping();

    var tools = buildTools();
    var maxRounds = TOOL_ROUNDS[state.mode] || TOOL_ROUNDS.guided;
    var sawText = false;
    var stopped = false;
    try {
      for (var round = 0; round < maxRounds; round += 1) {
        var bubble = null;
        var accumulated = '';
        if (els.note) els.note.textContent = round ? 'Working… round ' + (round + 1) + '/' + maxRounds : 'Thinking…';
        var payload = {
          provider: state.provider,
          model: state.model || CONFIG.model,
          max_tokens: CONFIG.maxTokens || 4096,
          system: buildSystemPrompt(),   // rebuilt each round: tools may have changed the state
          messages: state.history.slice(),
          tools: tools,
          stream: true
        };
        var result = await streamAssistant(payload, function (delta) {
          if (!bubble) { removeTyping(); bubble = appendMessage('assistant', '', { transient: true }); }
          accumulated += delta;
          bubble.textContent = accumulated;
          scrollToBottom();
        }, state.abort ? state.abort.signal : undefined);
        removeTyping();
        if (bubble && accumulated) {
          bubble.innerHTML = renderMarkdown(accumulated);
          persistTranscript('assistant', accumulated);
          sawText = true;
        } else if (!bubble) {
          var textOut = result.content.filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text || ''; }).join('').trim();
          if (textOut) { appendMessage('assistant', textOut); sawText = true; }
        }
        if (result.content.length) state.history.push({ role: 'assistant', content: result.content });

        var toolUses = result.content.filter(function (b) { return b.type === 'tool_use'; });
        if (result.stopReason !== 'tool_use' || !toolUses.length) break;

        var results = [];
        for (var i = 0; i < toolUses.length; i += 1) {
          if (state.abort && state.abort.signal.aborted) { stopped = true; break; }
          results.push(await executeTool(toolUses[i]));
        }
        if (stopped) { repairHistory(); break; }
        state.history.push({ role: 'user', content: results });
        renderChips();
        if (round === maxRounds - 1) appendNotice('Reached the ' + maxRounds + '-round limit for one turn. Say "continue" to keep going.');
        showTyping();
      }
      if (!sawText && !stopped) appendMessage('assistant', 'Done.');
    } catch (err) {
      removeTyping();
      if (err && (err.name === 'AbortError' || (state.abort && state.abort.signal.aborted))) {
        stopped = true;
        repairHistory();
        appendNotice('Stopped.');
      } else {
        repairHistory('The run failed before this tool executed: ' + err.message);
        appendMessage('assistant', 'Sorry, something went wrong: ' + err.message + errorHint(err.message), { transient: true });
        console.error('Site Builder error:', err);
      }
    } finally {
      state.abort = null;
      setBusy(false);
      if (els.note) els.note.textContent = state.ready ? 'Model: ' + (state.model || '') : '';
      if (state.connected && state.ready && els.input) els.input.focus();
      trimHistory();
    }
  }

  // --- Wiring ----------------------------------------------------------
  function autoGrow(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
  }

  function init() {
    if (els.form) {
      els.form.addEventListener('submit', function (e) {
        e.preventDefault();
        var text = els.input.value.trim();
        if (text) { els.input.value = ''; autoGrow(els.input); sendMessage(text); }
      });
    }
    if (els.input) {
      els.input.addEventListener('input', function () { autoGrow(els.input); });
      els.input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); els.form.requestSubmit ? els.form.requestSubmit() : els.form.dispatchEvent(new Event('submit', { cancelable: true })); }
      });
    }
    if (els.stop) els.stop.addEventListener('click', stopRun);
    if (els.clear) els.clear.addEventListener('click', clearTranscript);
    if (els.collapse) {
      els.collapse.addEventListener('click', function () {
        var open = els.collapse.getAttribute('aria-expanded') === 'true';
        els.collapse.setAttribute('aria-expanded', String(!open));
        els.body.hidden = open;
        els.collapse.querySelector('i').className = 'bi ' + (open ? 'bi-chevron-down' : 'bi-chevron-up');
        els.collapse.title = open ? 'Expand' : 'Collapse';
      });
    }
    if (els.connectRetry) els.connectRetry.addEventListener('click', function () { checkStatus(true); });

    // Connect step: provider cards, token form, model + image selects, mode.
    document.querySelectorAll('input[name="sb_provider"]').forEach(function (radio) {
      radio.addEventListener('change', function () { if (radio.checked) selectProviderUI(radio.value); });
    });
    if (els.credentialForm) els.credentialForm.addEventListener('submit', submitCredential);
    if (els.modelSelect) {
      els.modelSelect.addEventListener('change', function () {
        state.model = els.modelSelect.value;
        savePrefs();
        if (els.note && state.ready) els.note.textContent = 'Model: ' + state.model;
      });
    }
    if (els.imageSelect) {
      els.imageSelect.addEventListener('change', function () {
        state.imageProvider = els.imageSelect.value;
        prefs.imageProviderCleared = !state.imageProvider;
        savePrefs();
        renderProviderControls();
        var w = W();
        if (w) w.applyFields({ image_provider: state.imageProvider }, { silent: true, source: 'session' });
      });
    }
    document.querySelectorAll('input[name="sb_mode"]').forEach(function (radio) {
      radio.addEventListener('change', function () { if (radio.checked) selectMode(radio.value); });
    });

    if (els.runChecks) {
      els.runChecks.addEventListener('click', async function () {
        els.runChecks.disabled = true;
        var ids = (DATA.prerequisites || []).map(function (p) { return p.check; }).filter(Boolean);
        for (var i = 0; i < ids.length; i += 1) await runCheck(ids[i]);
        els.runChecks.disabled = !state.connected;
        var w = W();
        if (w) w.toast('Prerequisite checks finished');
      });
    }
    var targetCheck = document.getElementById('btn-target-check');
    if (targetCheck) {
      targetCheck.addEventListener('click', async function () {
        var target = targetValue();
        if (!target) { if (els.targetResolved) els.targetResolved.textContent = 'Enter a folder name first.'; return; }
        if (!state.connected) { if (els.targetResolved) els.targetResolved.textContent = 'Connect the dev proxy to check the folder; offline, the bundle creates it wherever you run it.'; return; }
        try { await resolveTarget(target); } catch (e) { if (els.targetResolved) { els.targetResolved.textContent = e.message; els.targetResolved.className = 'form-text text-danger'; } }
      });
    }
    if (els.targetInput) {
      // Typing a different folder name drops the opened project so the tools
      // follow the field again (targetValue prefers the field once cleared).
      els.targetInput.addEventListener('input', function () {
        if (state.project && els.targetInput.value.trim() !== state.project.name) state.project = null;
      });
    }
    if (els.projectOpen) {
      els.projectOpen.addEventListener('click', async function () {
        var pick = (els.projectSelect && els.projectSelect.value) || (els.targetInput && els.targetInput.value.trim());
        var w = W();
        if (!pick) { if (w) w.toast('Pick a site or type a folder name first'); return; }
        try { await openProject(pick); if (w) w.toast('Opened ' + pick); } catch (e) { appendResultCard('Could not open ' + pick, [e.message]); }
      });
    }
    if (els.writeProject) {
      els.writeProject.addEventListener('click', async function () {
        var target = targetValue();
        var w = W();
        if (!target) { if (w) w.toast('Enter a project folder name first'); return; }
        var overwrite = !!(document.getElementById('cfg-overwrite') && document.getElementById('cfg-overwrite').checked);
        try { await writeProject(target, overwrite, false); } catch (e) { appendResultCard('Write failed', [e.message]); }
      });
    }
    if (els.composeUp) els.composeUp.addEventListener('click', function () { composeAction('up'); });
    if (els.composeBuild) els.composeBuild.addEventListener('click', function () { composeAction('build'); });
    if (els.composeLogs) els.composeLogs.addEventListener('click', function () { composeAction('logs'); });
    if (els.composeDown) els.composeDown.addEventListener('click', function () { composeAction('down'); });
    if (els.checkLive) {
      els.checkLive.addEventListener('click', async function () {
        var r = await checkLive();
        var w = W();
        if (w) w.toast(r.reachable ? 'The site is answering at ' + r.url : 'Nothing is listening at ' + r.url + ' yet');
        if (state.connected) appendResultCard(r.reachable ? 'Site is answering' : 'Nothing is listening yet', [r.url], r.reachable ? [{ label: 'Open', href: r.url }] : []);
      });
    }

    // Ask buttons in the form ("Draft with Claude" / "… with Grok").
    document.querySelectorAll('.sb-ask').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var w = W();
        if (!state.connected || !state.ready) { if (w) w.toast('Connect ' + providerName() + ' (step 1) first'); return; }
        sendMessage(fillTemplate(btn.getAttribute('data-ask') || ''));
      });
    });

    var w = W();
    if (w) {
      w.on('step', renderChips);
      w.on('reset', function () { state.project = null; clearTranscript(); renderChips(); });
    } else {
      document.getElementById('setup-wizard').addEventListener('zer0:wizard:step', renderChips);
    }

    restoreTranscript();
    setConnected(false, null);
    checkStatus(false).then(schedulePoll);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
