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
 * Public hooks (read-only):
 *   window.ObsidianGraph.cy        — cytoscape instance once initialized
 *   window.ObsidianGraph.byKey     — normalized lookup table
 *   window.ObsidianGraph.entries   — raw entries array
 */
(function () {
  'use strict';

  var CONTAINER_ID = 'obsidian-graph';
  // Index URL resolution mirrors obsidian-wiki-links.js: the baseurl-aware
  // value js-cdn.html emits (OBSIDIAN_CONFIG.wikiIndexUrl), then the legacy
  // per-page override global, then a <base>-relative fallback.
  var INDEX_URL = ((window.OBSIDIAN_CONFIG || {}).wikiIndexUrl ||
    window.OBSIDIAN_WIKI_INDEX_URL ||
    ((document.querySelector('base') || {}).href || '/') + 'assets/data/wiki-index.json');

  function normalize(value) {
    return String(value || '').toLowerCase().trim().replace(/\s+/g, ' ');
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
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
  // resolves light/dark at init time.
  // Shared cose layout — looser packing, more edge length, wider padding.
  var COSE_LAYOUT = {
    name: 'cose',
    animate: false,
    randomize: true,
    nodeRepulsion: function () { return 32000; },
    idealEdgeLength: function () { return 190; },
    edgeElasticity: function () { return 60; },
    nodeOverlap: 40,
    gravity: 0.1,
    nestingFactor: 1.5,
    numIter: 3000,
    padding: 80,
    componentSpacing: 140
  };

  // Labels appear when zoomed past this level or on hover/highlight.
  var LABEL_ZOOM_THRESHOLD = 1.25;
  var HUB_DEGREE_THRESHOLD = 12;

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
      canvasBg:     'transparent',
      nodeBorder:   'rgba(255,255,255,0.18)'
    } : {
      label:        'rgba(27,31,35,0.92)',
      labelOutline: 'rgba(248,249,250,0.90)',
      edge:         'rgba(73,80,87,0.22)',
      edgeArrow:    'rgba(73,80,87,0.38)',
      canvasBg:     'transparent',
      nodeBorder:   'rgba(0,0,0,0.14)'
    };
  }

  function collectionColor(name, alpha) {
    alpha = alpha == null ? 0.72 : alpha;
    // Stable, distinguishable palette per collection. Falls back for pages.
    var palette = {
      posts:        [13, 110, 253],
      docs:         [25, 135, 84],
      notes:        [111, 66, 193],
      notebooks:    [214, 51, 132],
      quickstart:   [253, 126, 20],
      about:        [32, 201, 151],
      hobbies:      [255, 193, 7],
      news:         [102, 16, 242],
      services:     [13, 202, 240]
    };
    var rgb = palette[name] || [108, 117, 125];
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha + ')';
  }

  function buildElements(entries, byKey) {
    var elements = [];
    var seenTargets = Object.create(null);
    var brokenIds = Object.create(null);

    entries.forEach(function (entry) {
      var nid = entry.url;
      elements.push({
        group: 'nodes',
        data: {
          id: nid,
          label: entry.title || entry.basename || nid,
          url: entry.url,
          collection: entry.collection || 'page',
          color: collectionColor(entry.collection),
          excerpt: entry.excerpt || '',
          broken: false
        }
      });
      seenTargets[nid] = true;
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
    });
  }

  function updateLabelVisibility(cy) {
    if (!cy) return;
    var show = cy.zoom() >= LABEL_ZOOM_THRESHOLD;
    cy.nodes().forEach(function (node) {
      if (node.hasClass('highlighted')) return;
      if ((node.data('degree') || 0) >= HUB_DEGREE_THRESHOLD) return;
      node.style('text-opacity', show ? 0.9 : 0);
    });
  }

  function renderGraph(container, elements) {
    if (typeof window.cytoscape !== 'function') {
      container.innerHTML =
        '<div class="alert alert-danger" role="alert">' +
        'Graph view failed to load: <code>cytoscape</code> library is not ' +
        'available. Check your network connection or content security policy.' +
        '</div>';
      return null;
    }

    var theme = readTheme();
    container.style.backgroundColor = theme.canvasBg;
    var nodeDur = prefersReducedMotion() ? '0ms' : '160ms';
    var edgeDur = prefersReducedMotion() ? '0ms' : '150ms';

    var cy = window.cytoscape({
      container: container,
      elements: elements,
      minZoom: 0.1,
      maxZoom: 4,
      style: [
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
            'width': 'mapData(degree, 0, 25, 8, 34)',
            'height': 'mapData(degree, 0, 25, 8, 34)',
            'border-width': 1,
            'border-color': theme.nodeBorder,
            'opacity': 0.88,
            'transition-property': 'background-color, border-color, width, height, text-opacity, opacity',
            'transition-duration': nodeDur
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
            'width': 1,
            'line-color': theme.edge,
            'target-arrow-color': theme.edgeArrow,
            'target-arrow-shape': 'triangle',
            'arrow-scale': 0.75,
            'opacity': 0.55,
            'transition-property': 'line-color, width, opacity',
            'transition-duration': edgeDur
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
            'width': 2,
            'opacity': 0.95,
            'z-index': 9999
          }
        }
      ],
      layout: COSE_LAYOUT
    });

    cy.on('tap', 'node', function (evt) {
      var node = evt.target;
      var url = node.data('url');
      if (url) {
        // Same-tab navigation; use Cmd/Ctrl-click for new tab via the
        // standard handler below.
        var native = evt.originalEvent;
        if (native && (native.metaKey || native.ctrlKey)) {
          window.open(url, '_blank', 'noopener');
        } else {
          window.location.href = url;
        }
      }
    });

    // Hover: highlight neighborhood, fade everything else.
    cy.on('mouseover', 'node', function (evt) {
      var node = evt.target;
      var nhood = node.closedNeighborhood();
      cy.elements().not(nhood).addClass('faded');
      nhood.addClass('highlighted');
    });
    cy.on('mouseout', 'node', function () {
      cy.elements().removeClass('faded highlighted');
      updateLabelVisibility(cy);
    });

    cy.on('zoom', function () {
      updateLabelVisibility(cy);
    });

    updateLabelVisibility(cy);

    return cy;
  }

  function wireSearch(cy, byKey) {
    var input = document.getElementById('obsidian-graph-search');
    var status = document.getElementById('obsidian-graph-status');
    if (!input || !cy) return;

    function run() {
      var q = normalize(input.value);
      cy.elements().removeClass('faded highlighted');
      if (!q) {
        if (status) status.textContent = '';
        cy.fit(undefined, 80);
        return;
      }
      var matches = cy.nodes().filter(function (n) {
        return normalize(n.data('label')).indexOf(q) !== -1;
      });
      if (matches.length === 0) {
        if (status) status.textContent = 'No nodes match “' + input.value + '”.';
        return;
      }
      var nhood = matches.closedNeighborhood();
      cy.elements().not(nhood).addClass('faded');
      matches.addClass('highlighted');
      if (status) status.textContent = matches.length + ' node' +
        (matches.length === 1 ? '' : 's') + ' matched.';
      cy.fit(matches, 110);
    }

    input.addEventListener('input', run);
  }

  function wireFitButton(cy) {
    var btn = document.getElementById('obsidian-graph-fit');
    if (!btn || !cy) return;
    btn.addEventListener('click', function () {
      cy.elements().removeClass('faded highlighted');
      var input = document.getElementById('obsidian-graph-search');
      if (input) input.value = '';
      var status = document.getElementById('obsidian-graph-status');
      if (status) status.textContent = '';
      cy.fit(undefined, 80);
    });
  }

  function applyOrphansVisibility(cy, show) {
    if (!cy) return;
    var orphans = cy.nodes().filter(function (n) { return n.degree(false) === 0; });
    orphans.style('display', show ? 'element' : 'none');
    // The initial COSE pass already positioned every node, so just refit the
    // visible set — avoids a jarring full relayout of the stable core on toggle.
    cy.fit(cy.elements(':visible'), 80);
  }

  function wireOrphansToggle(cy) {
    var toggle = document.getElementById('obsidian-graph-orphans');
    if (!toggle || !cy) return;
    // Hide orphans by default to match Obsidian's "Show orphans" off state.
    applyOrphansVisibility(cy, toggle.checked);
    toggle.addEventListener('change', function () {
      applyOrphansVisibility(cy, toggle.checked);
    });
  }

  function setStats(entries, elements) {
    var nodes = elements.filter(function (e) { return e.group === 'nodes'; });
    var edges = elements.filter(function (e) { return e.group === 'edges'; });
    var broken = nodes.filter(function (e) { return e.data.broken; }).length;
    var el = document.getElementById('obsidian-graph-stats');
    if (!el) return;
    el.innerHTML =
      '<span class="badge text-bg-secondary me-2">' + entries.length + ' pages</span>' +
      '<span class="badge text-bg-info me-2">' + edges.length + ' links</span>' +
      (broken > 0 ?
        '<span class="badge text-bg-danger">' + broken + ' broken</span>' :
        '<span class="badge text-bg-success">0 broken</span>');
  }

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
        var elements = buildElements(entries, byKey);
        computeNodeDegree(elements);
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
          setStats(entries, elements);
          var cy = renderGraph(container, elements);
          wireSearch(cy, byKey);
          wireFitButton(cy);
          wireOrphansToggle(cy);
          window.ObsidianGraph = { cy: cy, byKey: byKey, entries: entries };
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
