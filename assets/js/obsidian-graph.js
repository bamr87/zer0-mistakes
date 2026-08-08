// Features: ZER0-044, ZER0-045
/*
 * obsidian-graph.js
 *
 * Renders an Obsidian-style interactive knowledge graph from
 * /assets/data/wiki-index.json into the element with id `obsidian-graph`.
 *
 * Loaded only on the graph page (pages/_docs/obsidian/graph.md), which
 * also pulls in the vendored cytoscape.js (assets/vendor/cytoscape/). No
 * runtime CDN dependencies are added to the rest of the site.
 *
 * Nodes:   one per indexed entry (collection doc or standalone page)
 * Edges:   directed, source -> target, derived from `entry.outgoing`
 *          (normalized [[wiki-link]] targets emitted by
 *          assets/data/wiki-index.json — see the Liquid template there).
 *
 * Targets are matched against the same lookup table the client-side
 * resolver uses (title / basename / aliases, all normalized). Unresolved
 * targets become floating "broken" nodes drawn in red so the graph also
 * surfaces dangling links.
 *
 * Mirrors the Obsidian desktop graph controls: Filters (search with tag:/
 * path: operators, per-collection toggles, orphans, unresolved), Display
 * (arrows, node size, link thickness, label fade threshold) and Forces
 * (repulsion, link distance, animated re-layout). Settings persist to
 * localStorage. The stylesheet re-derives itself when the Bootstrap
 * color mode (data-bs-theme) changes — no reload needed.
 *
 * Public hooks (read-only, used by test/visual/features/obsidian-graph.spec.js):
 *   window.ObsidianGraph.cy        — cytoscape instance once initialized
 *   window.ObsidianGraph.byKey     — normalized lookup table
 *   window.ObsidianGraph.entries   — raw entries array
 *   window.ObsidianGraph.settings  — live settings object
 */
(function () {
  'use strict';

  var CONTAINER_ID = 'obsidian-graph';
  var STORAGE_KEY = 'zer0.obsidianGraph.v1';
  // Index URL resolution mirrors obsidian-wiki-links.js: the baseurl-aware
  // value js-cdn.html emits (OBSIDIAN_CONFIG.wikiIndexUrl), then the legacy
  // per-page override global, then a <base>-relative fallback.
  var INDEX_URL = ((window.OBSIDIAN_CONFIG || {}).wikiIndexUrl ||
    window.OBSIDIAN_WIKI_INDEX_URL ||
    ((document.querySelector('base') || {}).href || '/') + 'assets/data/wiki-index.json');

  var HUB_DEGREE_THRESHOLD = 12;

  // User-tunable view state. Multipliers are relative to the base style so
  // "1" always means the stock look. Persisted per-browser via localStorage.
  var DEFAULTS = {
    collections: {},      // name -> false when hidden; missing = visible
    showOrphans: false,   // matches Obsidian's "Show orphans" off state
    showBroken: true,     // unresolved [[targets]] as dashed red nodes
    showArrows: true,
    nodeScale: 1,         // 0.5 – 2
    linkScale: 1,         // 0.5 – 3
    labelZoom: 1.25,      // zoom level past which labels appear (0.4 – 2.5)
    repulsion: 1,         // 0.3 – 3 × base node repulsion
    linkDistance: 1,      // 0.4 – 2.5 × base ideal edge length
    animateLayout: true   // ignored when prefers-reduced-motion
  };

  function clamp(value, min, max, fallback) {
    var n = parseFloat(value);
    if (!isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function loadSettings() {
    var merged = JSON.parse(JSON.stringify(DEFAULTS));
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return merged;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return merged;
      if (saved.collections && typeof saved.collections === 'object') {
        merged.collections = saved.collections;
      }
      ['showOrphans', 'showBroken', 'showArrows', 'animateLayout'].forEach(function (k) {
        if (typeof saved[k] === 'boolean') merged[k] = saved[k];
      });
      merged.nodeScale = clamp(saved.nodeScale, 0.5, 2, merged.nodeScale);
      merged.linkScale = clamp(saved.linkScale, 0.5, 3, merged.linkScale);
      merged.labelZoom = clamp(saved.labelZoom, 0.4, 2.5, merged.labelZoom);
      merged.repulsion = clamp(saved.repulsion, 0.3, 3, merged.repulsion);
      merged.linkDistance = clamp(saved.linkDistance, 0.4, 2.5, merged.linkDistance);
    } catch (e) { /* private mode / corrupt payload — fall back to defaults */ }
    return merged;
  }

  var saveTimer = null;
  function saveSettings(settings) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (e) { /* storage unavailable — view state is session-only */ }
    }, 150);
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim().replace(/\s+/g, ' ');
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Cytoscape is vendored under assets/vendor/ (no runtime CDN). Path comes from
  // window.OBSIDIAN_CONFIG.cytoscapeUrl (set by Liquid), with a base fallback.
  function cytoscapeSrc() {
    var cfg = window.OBSIDIAN_CONFIG || {};
    if (cfg.cytoscapeUrl) return cfg.cytoscapeUrl;
    var base = (document.querySelector('base') || {}).href || '/';
    return base.replace(/\/$/, '') + '/assets/vendor/cytoscape/cytoscape.min.js';
  }

  // Load cytoscape, coordinating with obsidian-local-graph.js via the shared
  // window.__obsidianCytoscapeLoading queue. cb(true) on success, cb(false) on
  // failure so the caller can show a recovery message.
  function loadCytoscape(cb) {
    if (typeof window.cytoscape === 'function') return cb(true);
    if (window.__obsidianCytoscapeLoading) {
      window.__obsidianCytoscapeLoading.push(cb);
      return;
    }
    var queue = window.__obsidianCytoscapeLoading = [cb];
    function flush(ok) {
      window.__obsidianCytoscapeLoading = null;
      queue.forEach(function (fn) { try { fn(ok); } catch (e) { /* ignore */ } });
    }
    var existing = document.querySelector('script[src*="cytoscape"]');
    if (existing) {
      if (typeof window.cytoscape === 'function') return flush(true);
      existing.addEventListener('load', function () { flush(true); });
      existing.addEventListener('error', function () { flush(false); });
      return;
    }
    var s = document.createElement('script');
    s.src = cytoscapeSrc();
    s.defer = true;
    s.onload = function () { flush(true); };
    s.onerror = function () { flush(false); };
    document.head.appendChild(s);
  }

  function buildLookup(entries) {
    var byKey = Object.create(null);
    entries.forEach(function (entry) {
      if (!entry || !entry.url) return;
      var keys = [];
      if (entry.title) keys.push(entry.title);
      if (entry.basename) keys.push(entry.basename);
      (entry.aliases || []).forEach(function (a) { if (a) keys.push(a); });
      keys.forEach(function (k) {
        var nk = normalize(k);
        if (!nk || byKey[nk]) return; // first wins, mirrors plugin/resolver
        byKey[nk] = entry;
      });
    });
    return byKey;
  }

  // Cytoscape needs concrete color values (not CSS vars). readTheme()
  // resolves light/dark from the live Bootstrap color mode.
  function readTheme() {
    var attr = (document.documentElement.getAttribute('data-bs-theme') ||
      document.body.getAttribute('data-bs-theme') || '').toLowerCase();
    var dark = attr === 'dark' || (!attr &&
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    return dark ? {
      label:        'rgba(233,236,239,0.94)',
      labelOutline: 'rgba(13,17,23,0.88)',
      edge:         'rgba(173,181,189,0.28)',
      edgeArrow:    'rgba(173,181,189,0.42)',
      nodeBorder:   'rgba(255,255,255,0.18)'
    } : {
      label:        'rgba(27,31,35,0.92)',
      labelOutline: 'rgba(248,249,250,0.90)',
      edge:         'rgba(73,80,87,0.22)',
      edgeArrow:    'rgba(73,80,87,0.38)',
      nodeBorder:   'rgba(0,0,0,0.14)'
    };
  }

  var COLLECTION_PALETTE = {
    posts:        [13, 110, 253],
    docs:         [25, 135, 84],
    notes:        [111, 66, 193],
    notebooks:    [214, 51, 132],
    quickstart:   [253, 126, 20],
    about:        [32, 201, 151],
    hobbies:      [255, 193, 7],
    news:         [102, 16, 242],
    services:     [13, 202, 240],
    books:        [220, 53, 133]
  };

  function collectionColor(name, alpha) {
    alpha = alpha == null ? 0.72 : alpha;
    var rgb = COLLECTION_PALETTE[name] || [108, 117, 125];
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha + ')';
  }

  function baseNodeSize(degree) {
    // Same mapping the old mapData(degree, 0, 25, 8, 34) produced, computed in
    // data so the Display "node size" multiplier can rescale it live.
    var d = Math.min(Math.max(degree || 0, 0), 25);
    return 8 + (d / 25) * 26;
  }

  function buildElements(entries, byKey) {
    var elements = [];
    var brokenIds = Object.create(null);

    entries.forEach(function (entry) {
      elements.push({
        group: 'nodes',
        data: {
          id: entry.url,
          label: entry.title || entry.basename || entry.url,
          url: entry.url,
          collection: entry.collection || 'page',
          color: collectionColor(entry.collection),
          excerpt: entry.excerpt || '',
          // Search-operator fodder (tag:/path: + alias matches). Client-side
          // only — the wiki-index.json contract is unchanged.
          tags: (entry.tags || []).map(normalize),
          aliasText: (entry.aliases || []).map(normalize).join(' | '),
          broken: false
        }
      });
    });

    entries.forEach(function (entry) {
      (entry.outgoing || []).forEach(function (target) {
        var nk = normalize(target);
        var resolved = byKey[nk];
        var targetId;
        if (resolved) {
          targetId = resolved.url;
          if (targetId === entry.url) return; // skip self-loops, no insight
        } else {
          targetId = '__broken__:' + nk;
          if (!brokenIds[targetId]) {
            brokenIds[targetId] = true;
            elements.push({
              group: 'nodes',
              data: {
                id: targetId,
                label: target,
                url: null,
                collection: 'broken',
                color: 'rgba(220,53,69,0.78)',
                excerpt: 'Unresolved wiki-link',
                tags: [],
                aliasText: '',
                broken: true
              }
            });
          }
        }
        elements.push({
          group: 'edges',
          data: {
            id: 'e:' + entry.url + '->' + targetId,
            source: entry.url,
            target: targetId,
            broken: !resolved
          }
        });
      });
    });

    return elements;
  }

  function computeNodeDegree(elements) {
    var degree = Object.create(null);
    elements.forEach(function (el) {
      if (el.group !== 'edges') return;
      degree[el.data.source] = (degree[el.data.source] || 0) + 1;
      degree[el.data.target] = (degree[el.data.target] || 0) + 1;
    });
    elements.forEach(function (el) {
      if (el.group !== 'nodes') return;
      el.data.degree = degree[el.data.id] || 0;
      el.data.size = baseNodeSize(el.data.degree);
    });
  }

  // ---------------------------------------------------------------------------
  // Graph application — wraps one cytoscape instance plus the settings-driven
  // style/filter/layout plumbing shared by every control.
  // ---------------------------------------------------------------------------
  function GraphApp(container, entries, byKey) {
    this.container = container;
    this.entries = entries;
    this.byKey = byKey;
    this.settings = loadSettings();
    this.cy = null;
    this.searchQuery = '';
  }

  GraphApp.prototype.buildStyle = function () {
    var theme = readTheme();
    var s = this.settings;
    var motion = prefersReducedMotion() ? '0ms' : '160ms';
    return [
      {
        selector: 'node',
        style: {
          'background-color': 'data(color)',
          'background-opacity': 0.82,
          'label': 'data(label)',
          'font-size': '10px',
          'font-weight': 500,
          'color': theme.label,
          'text-outline-color': theme.labelOutline,
          'text-outline-width': 3,
          'text-outline-opacity': 1,
          'text-background-opacity': 0,
          'text-border-opacity': 0,
          'text-valign': 'bottom',
          'text-margin-y': 6,
          'text-wrap': 'ellipsis',
          'text-max-width': '120px',
          // Hidden until zoomed-in, hovered, or a high-degree hub.
          'min-zoomed-font-size': 11,
          'text-opacity': 0,
          'width': 'data(size)',
          'height': 'data(size)',
          'border-width': 1,
          'border-color': theme.nodeBorder,
          'opacity': 0.88,
          'transition-property': 'background-color, border-color, width, height, text-opacity, opacity',
          'transition-duration': motion
        }
      },
      {
        // Hub landmarks stay labeled when zoomed out.
        selector: 'node[degree >= ' + HUB_DEGREE_THRESHOLD + ']',
        style: {
          'text-opacity': 0.88,
          'font-size': '11px',
          'font-weight': 600,
          'min-zoomed-font-size': 0
        }
      },
      {
        selector: 'node[?broken]',
        style: {
          'border-style': 'dashed',
          'border-color': 'rgba(220,53,69,0.75)',
          'border-width': 1.5,
          'background-opacity': 0.55,
          'opacity': 0.78
        }
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'width': s.linkScale,
          'line-color': theme.edge,
          'target-arrow-color': theme.edgeArrow,
          'target-arrow-shape': s.showArrows ? 'triangle' : 'none',
          'arrow-scale': 0.75,
          'opacity': 0.55,
          'transition-property': 'line-color, width, opacity',
          'transition-duration': motion
        }
      },
      {
        selector: 'edge[?broken]',
        style: {
          'line-color': 'rgba(220,53,69,0.32)',
          'target-arrow-color': 'rgba(220,53,69,0.42)',
          'line-style': 'dashed',
          'opacity': 0.45
        }
      },
      {
        selector: '.faded',
        style: {
          'opacity': 0.08,
          'text-opacity': 0
        }
      },
      {
        selector: 'node.highlighted',
        style: {
          'border-color': 'rgba(253,126,20,0.95)',
          'border-width': 2.5,
          'opacity': 1,
          'background-opacity': 0.95,
          'text-opacity': 1,
          'font-size': '11px',
          'font-weight': 700,
          'min-zoomed-font-size': 0,
          'z-index': 9999
        }
      },
      {
        selector: 'edge.highlighted',
        style: {
          'line-color': 'rgba(253,126,20,0.85)',
          'target-arrow-color': 'rgba(253,126,20,0.85)',
          'width': Math.max(2, 2 * this.settings.linkScale),
          'opacity': 0.95,
          'z-index': 9999
        }
      },
      {
        // Filtered out by the Filters panel. display:none also hides the
        // connected edges, so the visible subgraph stays consistent.
        selector: '.obsidian-hidden',
        style: { 'display': 'none' }
      }
    ];
  };

  GraphApp.prototype.render = function () {
    var app = this;
    this.cy = window.cytoscape({
      container: this.container,
      elements: this.elements,
      minZoom: 0.1,
      maxZoom: 4,
      wheelSensitivity: 0.3,
      style: this.buildStyle(),
      layout: { name: 'preset' } // real layout runs below, honouring settings
    });

    this.cy.on('tap', 'node', function (evt) {
      var url = evt.target.data('url');
      if (!url) return;
      var native = evt.originalEvent;
      if (native && (native.metaKey || native.ctrlKey)) {
        window.open(url, '_blank', 'noopener');
      } else {
        window.location.href = url;
      }
    });

    // Hover: highlight neighborhood, fade everything else, show the preview.
    this.cy.on('mouseover', 'node', function (evt) {
      var node = evt.target;
      var nhood = node.closedNeighborhood();
      app.cy.elements().not(nhood).addClass('faded');
      nhood.addClass('highlighted');
      app.showPreview(node);
    });
    this.cy.on('mouseout', 'node', function () {
      app.cy.elements().removeClass('faded highlighted');
      app.hidePreview();
      app.updateLabelVisibility();
      app.applySearch(); // restore an active search highlight after hover
    });
    this.cy.on('zoom pan', function () {
      app.hidePreview();
      app.updateLabelVisibility();
    });
    this.cy.on('grab', 'node', function () { app.hidePreview(); });

    this.applyFilters(false);
    this.runLayout(true);
    this.updateLabelVisibility();
  };

  GraphApp.prototype.visibleElements = function () {
    return this.cy.elements().not('.obsidian-hidden');
  };

  GraphApp.prototype.runLayout = function (randomize) {
    if (!this.cy) return;
    var s = this.settings;
    if (this.activeLayout) { try { this.activeLayout.stop(); } catch (e) { /* ignore */ } }
    this.activeLayout = this.cy.layout({
      name: 'cose',
      animate: s.animateLayout && !prefersReducedMotion(),
      randomize: !!randomize,
      nodeRepulsion: function () { return 32000 * s.repulsion; },
      idealEdgeLength: function () { return 190 * s.linkDistance; },
      edgeElasticity: function () { return 60; },
      nodeOverlap: 40,
      gravity: 0.1,
      nestingFactor: 1.5,
      numIter: 3000,
      padding: 80,
      componentSpacing: 140,
      fit: true
    });
    this.activeLayout.run();
  };

  GraphApp.prototype.applyDisplay = function () {
    if (!this.cy) return;
    var s = this.settings;
    this.cy.style().fromJson(this.buildStyle()).update();
    var app = this;
    this.cy.batch(function () {
      app.cy.nodes().forEach(function (node) {
        node.data('size', baseNodeSize(node.data('degree')) * s.nodeScale);
      });
    });
    this.updateLabelVisibility();
    saveSettings(s);
  };

  GraphApp.prototype.applyFilters = function (refit) {
    if (!this.cy) return;
    var s = this.settings;
    var app = this;
    this.cy.batch(function () {
      app.cy.nodes().forEach(function (node) {
        var d = node.data();
        var hide = false;
        if (d.broken) {
          hide = !s.showBroken;
        } else if (s.collections[d.collection || 'page'] === false) {
          hide = true;
        }
        if (!hide && !s.showOrphans && (d.degree || 0) === 0) hide = true;
        node.toggleClass('obsidian-hidden', hide);
      });
    });
    this.updateStats();
    if (refit !== false) this.cy.fit(this.visibleElements(), 80);
    saveSettings(s);
  };

  GraphApp.prototype.updateLabelVisibility = function () {
    if (!this.cy) return;
    var show = this.cy.zoom() >= this.settings.labelZoom;
    this.cy.nodes().forEach(function (node) {
      if (node.hasClass('highlighted')) return;
      if ((node.data('degree') || 0) >= HUB_DEGREE_THRESHOLD) return;
      node.style('text-opacity', show ? 0.9 : 0);
    });
  };

  // Search supports Obsidian-flavoured operators alongside plain text:
  //   tag:foo    entries tagged foo        path:docs   URL contains "docs"
  // Plain terms match title/basename/aliases; all terms must match (AND).
  GraphApp.prototype.matchesQuery = function (node, terms) {
    var d = node.data();
    var label = normalize(d.label);
    var aliases = d.aliasText || '';
    for (var i = 0; i < terms.length; i++) {
      var term = terms[i];
      if (term.slice(0, 4) === 'tag:') {
        var tag = term.slice(4).replace(/^#/, '');
        if (!tag) continue;
        if ((d.tags || []).indexOf(tag) === -1) return false;
      } else if (term.slice(0, 5) === 'path:') {
        var path = term.slice(5);
        if (!path) continue;
        if (String(d.url || '').toLowerCase().indexOf(path) === -1) return false;
      } else if (label.indexOf(term) === -1 && aliases.indexOf(term) === -1) {
        return false;
      }
    }
    return true;
  };

  GraphApp.prototype.applySearch = function () {
    if (!this.cy) return;
    var status = document.getElementById('obsidian-graph-status');
    var q = normalize(this.searchQuery);
    this.cy.elements().removeClass('faded highlighted');
    if (!q) {
      if (status) status.textContent = '';
      return;
    }
    var terms = q.split(/\s+/).filter(Boolean);
    var app = this;
    var matches = this.visibleElements().nodes().filter(function (n) {
      return app.matchesQuery(n, terms);
    });
    if (matches.length === 0) {
      if (status) status.textContent = 'No nodes match “' + this.searchQuery + '”.';
      return;
    }
    var nhood = matches.closedNeighborhood().not('.obsidian-hidden');
    this.cy.elements().not(nhood).addClass('faded');
    matches.addClass('highlighted');
    if (status) {
      status.textContent = matches.length + ' node' +
        (matches.length === 1 ? '' : 's') + ' matched.';
    }
    this.cy.fit(matches, 110);
  };

  GraphApp.prototype.updateStats = function () {
    var el = document.getElementById('obsidian-graph-stats');
    if (!el || !this.cy) return;
    var total = this.cy.nodes('[!broken]').length;
    var visible = this.cy.nodes('[!broken]').not('.obsidian-hidden').length;
    var edges = this.visibleElements().edges().length;
    var broken = this.cy.nodes('[?broken]').length;
    var pages = (visible === total) ?
      total + ' pages' : visible + ' of ' + total + ' pages';
    el.innerHTML =
      '<span class="badge text-bg-secondary me-2">' + pages + '</span>' +
      '<span class="badge text-bg-info me-2">' + edges + ' links</span>' +
      (broken > 0 ?
        '<span class="badge text-bg-danger">' + broken + ' broken</span>' :
        '<span class="badge text-bg-success">0 broken</span>');
  };

  // --- Hover preview card ----------------------------------------------------
  GraphApp.prototype.showPreview = function (node) {
    var card = document.getElementById('obsidian-graph-preview');
    if (!card || node.data('broken')) { this.hidePreview(); return; }
    var d = node.data();
    var links = d.degree === 1 ? '1 link' : (d.degree || 0) + ' links';
    card.innerHTML =
      '<div class="card-body p-2">' +
      '<div class="d-flex align-items-center gap-2 mb-1">' +
      '<span class="obsidian-graph-preview-swatch" aria-hidden="true"></span>' +
      '<strong class="small text-truncate">' + escapeHtml(d.label) + '</strong>' +
      '</div>' +
      '<div class="d-flex gap-2 align-items-center small text-secondary mb-1">' +
      '<span class="badge text-bg-light border">' + escapeHtml(d.collection) + '</span>' +
      '<span>' + links + '</span>' +
      '</div>' +
      (d.excerpt ?
        '<p class="small mb-0 obsidian-graph-preview-excerpt">' + escapeHtml(d.excerpt) + '</p>' : '') +
      '</div>';
    var swatch = card.querySelector('.obsidian-graph-preview-swatch');
    if (swatch) swatch.style.backgroundColor = d.color;
    card.hidden = false;
    // Position near the node, clamped inside the shell.
    var pos = node.renderedPosition();
    var shell = card.parentNode;
    var maxX = shell.clientWidth - card.offsetWidth - 8;
    var maxY = shell.clientHeight - card.offsetHeight - 8;
    card.style.left = Math.max(8, Math.min(pos.x + 16, maxX)) + 'px';
    card.style.top = Math.max(8, Math.min(pos.y + 16, maxY)) + 'px';
  };

  GraphApp.prototype.hidePreview = function () {
    var card = document.getElementById('obsidian-graph-preview');
    if (card) card.hidden = true;
  };

  // --- Theme reactivity ------------------------------------------------------
  GraphApp.prototype.watchTheme = function () {
    var app = this;
    var restyle = debounce(function () { app.applyDisplay(); }, 50);
    var observer = new MutationObserver(restyle);
    [document.documentElement, document.body].forEach(function (el) {
      observer.observe(el, { attributes: true, attributeFilter: ['data-bs-theme'] });
    });
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', restyle);
    }
  };

  // ---------------------------------------------------------------------------
  // Control panel wiring
  // ---------------------------------------------------------------------------
  function bindCheckbox(id, value, onChange) {
    var input = document.getElementById(id);
    if (!input) return;
    input.checked = !!value;
    input.addEventListener('change', function () { onChange(input.checked); });
  }

  function bindRange(id, value, onInput) {
    var input = document.getElementById(id);
    if (!input) return;
    input.value = value;
    input.addEventListener('input', function () {
      var n = parseFloat(input.value);
      if (isFinite(n)) onInput(n);
    });
  }

  function wireCollectionFilters(app) {
    var host = document.getElementById('obsidian-graph-collections');
    if (!host) return;
    var counts = Object.create(null);
    app.entries.forEach(function (entry) {
      var name = entry.collection || 'page';
      counts[name] = (counts[name] || 0) + 1;
    });
    var names = Object.keys(counts).sort(function (a, b) {
      return counts[b] - counts[a] || a.localeCompare(b);
    });
    host.innerHTML = '';
    names.forEach(function (name) {
      var id = 'obsidian-graph-col-' + name.replace(/[^a-z0-9-]/gi, '-');
      var item = document.createElement('div');
      item.className = 'form-check form-switch obsidian-graph-collection-filter';
      item.innerHTML =
        '<input class="form-check-input" type="checkbox" role="switch" id="' + id + '">' +
        '<label class="form-check-label d-flex align-items-center gap-2" for="' + id + '">' +
        '<span class="swatch" aria-hidden="true"></span>' +
        '<span class="flex-grow-1 text-capitalize">' + escapeHtml(name) + '</span>' +
        '<span class="badge text-bg-secondary">' + counts[name] + '</span>' +
        '</label>';
      var input = item.querySelector('input');
      input.checked = app.settings.collections[name] !== false;
      input.addEventListener('change', function () {
        app.settings.collections[name] = input.checked;
        app.applyFilters();
        app.applySearch();
      });
      item.querySelector('.swatch').style.backgroundColor = collectionColor(name, 0.92);
      host.appendChild(item);
    });
  }

  function wireControls(app) {
    var s = app.settings;

    var search = document.getElementById('obsidian-graph-search');
    if (search) {
      search.addEventListener('input', debounce(function () {
        app.searchQuery = search.value;
        app.applySearch();
      }, 150));
    }

    wireCollectionFilters(app);

    bindCheckbox('obsidian-graph-orphans', s.showOrphans, function (checked) {
      s.showOrphans = checked;
      app.applyFilters();
    });
    bindCheckbox('obsidian-graph-broken', s.showBroken, function (checked) {
      s.showBroken = checked;
      app.applyFilters();
    });
    bindCheckbox('obsidian-graph-arrows', s.showArrows, function (checked) {
      s.showArrows = checked;
      app.applyDisplay();
    });
    bindCheckbox('obsidian-graph-animate', s.animateLayout, function (checked) {
      s.animateLayout = checked;
      saveSettings(s);
    });

    bindRange('obsidian-graph-node-size', s.nodeScale, debounce(function (n) {
      s.nodeScale = clamp(n, 0.5, 2, 1);
      app.applyDisplay();
    }, 80));
    bindRange('obsidian-graph-link-width', s.linkScale, debounce(function (n) {
      s.linkScale = clamp(n, 0.5, 3, 1);
      app.applyDisplay();
    }, 80));
    bindRange('obsidian-graph-label-zoom', s.labelZoom, debounce(function (n) {
      s.labelZoom = clamp(n, 0.4, 2.5, 1.25);
      app.applyDisplay();
    }, 80));

    var relayout = debounce(function () { app.runLayout(false); }, 350);
    bindRange('obsidian-graph-repulsion', s.repulsion, function (n) {
      s.repulsion = clamp(n, 0.3, 3, 1);
      saveSettings(s);
      relayout();
    });
    bindRange('obsidian-graph-link-distance', s.linkDistance, function (n) {
      s.linkDistance = clamp(n, 0.4, 2.5, 1);
      saveSettings(s);
      relayout();
    });

    var rerun = document.getElementById('obsidian-graph-relayout');
    if (rerun) {
      rerun.addEventListener('click', function () { app.runLayout(true); });
    }

    var reset = document.getElementById('obsidian-graph-reset');
    if (reset) {
      reset.addEventListener('click', function () {
        app.settings = JSON.parse(JSON.stringify(DEFAULTS));
        s = app.settings;
        try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
        // Reflect defaults back into every control, then re-apply the view.
        syncControls(app);
        wireCollectionFilters(app);
        app.applyDisplay();
        app.applyFilters();
        window.ObsidianGraph.settings = app.settings;
      });
    }

    var fit = document.getElementById('obsidian-graph-fit');
    if (fit) {
      fit.addEventListener('click', function () {
        app.cy.elements().removeClass('faded highlighted');
        if (search) search.value = '';
        app.searchQuery = '';
        var status = document.getElementById('obsidian-graph-status');
        if (status) status.textContent = '';
        app.cy.fit(app.visibleElements(), 80);
      });
    }

    function zoomBy(factor) {
      if (!app.cy) return;
      app.cy.animate({
        zoom: {
          level: app.cy.zoom() * factor,
          renderedPosition: { x: app.container.clientWidth / 2, y: app.container.clientHeight / 2 }
        },
        duration: prefersReducedMotion() ? 0 : 120
      });
    }
    var zoomIn = document.getElementById('obsidian-graph-zoom-in');
    if (zoomIn) zoomIn.addEventListener('click', function () { zoomBy(1.35); });
    var zoomOut = document.getElementById('obsidian-graph-zoom-out');
    if (zoomOut) zoomOut.addEventListener('click', function () { zoomBy(1 / 1.35); });

    wireFullscreen(app);
  }

  // Reflect app.settings into the checkbox/range inputs (used by Reset).
  function syncControls(app) {
    var s = app.settings;
    var map = {
      'obsidian-graph-orphans': s.showOrphans,
      'obsidian-graph-broken': s.showBroken,
      'obsidian-graph-arrows': s.showArrows,
      'obsidian-graph-animate': s.animateLayout
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.checked = !!map[id];
    });
    var ranges = {
      'obsidian-graph-node-size': s.nodeScale,
      'obsidian-graph-link-width': s.linkScale,
      'obsidian-graph-label-zoom': s.labelZoom,
      'obsidian-graph-repulsion': s.repulsion,
      'obsidian-graph-link-distance': s.linkDistance
    };
    Object.keys(ranges).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = ranges[id];
    });
  }

  function wireFullscreen(app) {
    var btn = document.getElementById('obsidian-graph-fullscreen');
    var shell = document.getElementById('obsidian-graph-shell');
    if (!btn || !shell) return;

    function isFullscreen() {
      return document.fullscreenElement === shell ||
        shell.classList.contains('obsidian-graph-shell-expanded');
    }

    function refresh() {
      var active = isFullscreen();
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      var icon = btn.querySelector('.bi');
      if (icon) {
        icon.className = active ?
          'bi bi-fullscreen-exit' : 'bi bi-arrows-fullscreen';
      }
      if (app.cy) {
        app.cy.resize();
        app.cy.fit(app.visibleElements(), 80);
      }
    }

    btn.addEventListener('click', function () {
      if (isFullscreen()) {
        if (document.fullscreenElement === shell && document.exitFullscreen) {
          document.exitFullscreen();
        }
        shell.classList.remove('obsidian-graph-shell-expanded');
        refresh();
        return;
      }
      if (shell.requestFullscreen) {
        shell.requestFullscreen().catch(function () {
          // Fullscreen API blocked (iframe / permission) — CSS overlay fallback.
          shell.classList.add('obsidian-graph-shell-expanded');
          refresh();
        });
      } else {
        shell.classList.add('obsidian-graph-shell-expanded');
        refresh();
      }
    });
    document.addEventListener('fullscreenchange', refresh);
    document.addEventListener('keydown', function (evt) {
      if (evt.key === 'Escape' && shell.classList.contains('obsidian-graph-shell-expanded')) {
        shell.classList.remove('obsidian-graph-shell-expanded');
        refresh();
      }
    });
  }

  // ---------------------------------------------------------------------------
  function init() {
    var container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    container.innerHTML =
      '<div class="d-flex align-items-center justify-content-center h-100 text-muted">' +
      '<div class="spinner-border me-2" role="status" aria-hidden="true"></div>' +
      'Loading graph data…</div>';

    fetch(INDEX_URL, { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (payload) {
        var entries = (payload && payload.entries) || [];
        var byKey = buildLookup(entries);
        loadCytoscape(function (ok) {
          if (!ok) {
            container.innerHTML =
              '<div class="alert alert-danger" role="alert">' +
              'Graph view failed to load: the <code>cytoscape</code> library could ' +
              'not be fetched. Check your network connection or content security policy.' +
              '</div>';
            return;
          }
          container.innerHTML = '';
          var app = new GraphApp(container, entries, byKey);
          app.elements = buildElements(entries, byKey);
          computeNodeDegree(app.elements);
          // Apply the persisted node-size multiplier before first paint.
          app.elements.forEach(function (el) {
            if (el.group === 'nodes') el.data.size *= app.settings.nodeScale;
          });
          app.render();
          app.updateStats();
          wireControls(app);
          app.watchTheme();
          window.ObsidianGraph = {
            cy: app.cy,
            byKey: byKey,
            entries: entries,
            settings: app.settings,
            app: app
          };
        });
      })
      .catch(function (err) {
        container.innerHTML =
          '<div class="alert alert-danger" role="alert">' +
          'Failed to load graph data: ' + (err && err.message ? err.message : err) +
          '</div>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
