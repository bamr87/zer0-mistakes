/*
 * obsidian-graph.js
 *
 * Renders an Obsidian-style interactive knowledge graph from
 * /assets/data/wiki-index.json into the element with id `obsidian-graph`.
 *
 * Loaded only on the graph page (pages/_docs/obsidian/graph.md), which
 * also pulls in cytoscape.js from a CDN. No runtime dependencies are
 * added to the rest of the site.
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
  var INDEX_URL = (window.OBSIDIAN_WIKI_INDEX_URL ||
    ((document.querySelector('base') || {}).href || '/') + 'assets/data/wiki-index.json');

  function normalize(value) {
    return String(value || '').toLowerCase().trim().replace(/\s+/g, ' ');
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

  // Detect Bootstrap's color-mode at init time so cytoscape gets concrete
  // hex values (it rejects `var(--bs-…)`). We re-read on toggle so the
  // graph stays legible when users flip light/dark.
  function readTheme() {
    var attr = (document.documentElement.getAttribute('data-bs-theme') ||
      document.body.getAttribute('data-bs-theme') || '').toLowerCase();
    var dark = attr === 'dark' || (!attr &&
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    return dark ? {
      label:        '#e9ecef',
      labelOutline: '#1b1f23',
      edge:         'rgba(173,181,189,0.45)',
      edgeArrow:    'rgba(173,181,189,0.65)',
      canvasBg:     '#1b1f23',
      nodeBorder:   'rgba(255,255,255,0.22)'
    } : {
      label:        '#1b1f23',
      labelOutline: '#f8f9fa',
      edge:         'rgba(73,80,87,0.40)',
      edgeArrow:    'rgba(73,80,87,0.60)',
      canvasBg:     '#f8f9fa',
      nodeBorder:   'rgba(0,0,0,0.20)'
    };
  }

  function collectionColor(name) {
    // Stable, distinguishable palette per collection. Falls back for pages.
    var palette = {
      posts:        '#0d6efd', // primary blue
      docs:         '#198754', // success green
      notes:        '#6f42c1', // purple
      notebooks:    '#d63384', // pink
      quickstart:   '#fd7e14', // orange
      about:        '#20c997', // teal
      hobbies:      '#ffc107', // amber
      news:         '#6610f2', // indigo
      services:     '#0dcaf0'  // cyan
    };
    return palette[name] || '#6c757d'; // gray for standalone pages
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
                color: '#dc3545',
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
            'label': 'data(label)',
            'font-size': '11px',
            'font-weight': 500,
            'color': theme.label,
            // Halo-only labels (outline matches canvas) — no white pill,
            // no obstruction. Mirrors how Obsidian draws labels.
            'text-outline-color': theme.labelOutline,
            'text-outline-width': 2.5,
            'text-outline-opacity': 0.95,
            'text-background-opacity': 0,
            'text-border-opacity': 0,
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'text-wrap': 'ellipsis',
            'text-max-width': '140px',
            // Labels appear when zoomed-in or hovered — keeps the
            // overview clean instead of being a wall of text.
            'min-zoomed-font-size': 9,
            'text-opacity': 0,
            'width': 'mapData(degree, 0, 20, 12, 50)',
            'height': 'mapData(degree, 0, 20, 12, 50)',
            'border-width': 1.5,
            'border-color': theme.nodeBorder,
            'transition-property': 'background-color, border-color, width, height, text-opacity',
            'transition-duration': '160ms'
          }
        },
        {
          // Always show labels for hub nodes (degree >= 6) so the user
          // has anchor landmarks even when zoomed all the way out.
          selector: 'node[degree >= 6]',
          style: {
            'text-opacity': 1,
            'font-size': '12px',
            'font-weight': 600,
            'min-zoomed-font-size': 0
          }
        },
        {
          selector: 'node[?broken]',
          style: {
            'border-style': 'dashed',
            'border-color': '#dc3545',
            'border-width': 2
          }
        },
        {
          selector: 'edge',
          style: {
            'curve-style': 'bezier',
            'width': 1.5,
            'line-color': theme.edge,
            'target-arrow-color': theme.edgeArrow,
            'target-arrow-shape': 'triangle',
            'arrow-scale': 0.9,
            'transition-property': 'line-color, width',
            'transition-duration': '150ms'
          }
        },
        {
          selector: 'edge[?broken]',
          style: {
            'line-color': 'rgba(220,53,69,0.45)',
            'target-arrow-color': 'rgba(220,53,69,0.55)',
            'line-style': 'dashed'
          }
        },
        {
          selector: '.faded',
          style: {
            'opacity': 0.15,
            'text-opacity': 0.15
          }
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-color': '#fd7e14',
            'border-width': 3,
            'opacity': 1,
            'text-opacity': 1,
            'font-size': '12px',
            'font-weight': 700,
            'min-zoomed-font-size': 0,
            'z-index': 9999
          }
        },
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#fd7e14',
            'target-arrow-color': '#fd7e14',
            'width': 2.5,
            'opacity': 1,
            'z-index': 9999
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        randomize: true,
        // Looser packing so clusters have breathing room and labels
        // don't pile on top of each other.
        nodeRepulsion: function () { return 18000; },
        idealEdgeLength: function () { return 130; },
        edgeElasticity: function () { return 80; },
        nodeOverlap: 24,
        gravity: 0.18,
        nestingFactor: 1.2,
        numIter: 2500,
        padding: 40,
        componentSpacing: 80
      }
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
    });

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
        cy.fit(undefined, 70);
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
      cy.fit(matches, 100);
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
      cy.fit(undefined, 70);
    });
  }

  function applyOrphansVisibility(cy, show) {
    if (!cy) return;
    var orphans = cy.nodes().filter(function (n) { return n.degree(false) === 0; });
    if (show) {
      orphans.style('display', 'element');
    } else {
      orphans.style('display', 'none');
    }
    // Re-run a quick layout pass on visible elements so the connected
    // cluster expands into the freed space.
    cy.layout({
      name: 'cose',
      animate: false,
      randomize: false,
      nodeRepulsion: function () { return 18000; },
      idealEdgeLength: function () { return 130; },
      edgeElasticity: function () { return 80; },
      nodeOverlap: 24,
      gravity: 0.18,
      numIter: 1200,
      padding: 40,
      componentSpacing: 80,
      eles: cy.elements(':visible')
    }).run();
    cy.fit(cy.elements(':visible'), 70);
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
        container.innerHTML = '';
        setStats(entries, elements);
        var cy = renderGraph(container, elements);
        wireSearch(cy, byKey);
        wireFitButton(cy);
        wireOrphansToggle(cy);
        window.ObsidianGraph = { cy: cy, byKey: byKey, entries: entries };
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
