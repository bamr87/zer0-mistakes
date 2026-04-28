/*
 * obsidian-local-graph.js
 *
 * Renders a focused "local graph" (current page + immediate neighbors) into
 * the element with id `obsidian-local-graph`. Mirrors Obsidian's local
 * graph view: a focused, page-scoped subgraph instead of the full site map.
 *
 * Loaded by _includes/navigation/local-graph.html inside a dedicated
 * collapsible side panel. Cytoscape.js is loaded lazily (and only once) from
 * the same CDN as the full graph page.
 *
 * Subgraph:
 *   - center  = current page (matched against entry.url, falling back to
 *               normalized title/basename/aliases for permalink quirks)
 *   - depth   = configurable via data-depth attribute (default 1)
 *   - direction = both incoming and outgoing wiki-links
 *
 * If the current page is in the wiki-index but has no local links, the panel
 * stays available and renders a single-node graph for the current page.
 * Pages outside the wiki-index still hide the panel.
 */
(function () {
  'use strict';

  var CONTAINER_ID = 'obsidian-local-graph';
  var PANEL_SELECTOR = '[data-obsidian-local-graph-panel]';
  var TOGGLE_SELECTOR = '[data-obsidian-local-graph-toggle]';
  var STATUS_SELECTOR = '[data-obsidian-local-graph-status]';
  var CYTOSCAPE_URL = 'https://cdn.jsdelivr.net/npm/cytoscape@3.30.0/dist/cytoscape.min.js';
  var CYTOSCAPE_SRI = 'sha384-kpMsYllYzyaWU69Piok08rPNktpnjqAoDMdB00fjqUkEk3lkuUbSuwJ+oXrjvN6B';

  function companionElements(container) {
    return {
      panel: container.closest(PANEL_SELECTOR),
      toggle: document.querySelector(TOGGLE_SELECTOR),
      status: document.querySelector(STATUS_SELECTOR)
    };
  }

  function setStatus(container, message, isError) {
    var status = companionElements(container).status;
    if (!status) return;
    status.textContent = message || '';
    status.hidden = !message;
    status.classList.toggle('text-danger', !!isError);
    status.classList.toggle('text-secondary', !isError);
  }

  function setPanelAvailable(container, available) {
    var companions = companionElements(container);
    [companions.panel, companions.toggle].forEach(function (element) {
      if (!element) return;
      element.hidden = !available;
    });
  }

  function resizeGraph(container) {
    var cy = container.__obsidianLocalGraph;
    if (!cy) return;
    cy.resize();
    cy.fit(cy.elements(), 24);
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim().replace(/\s+/g, ' ');
  }

  // Strip trailing slash and any leading site baseurl so we can match
  // entry.url (which is always relative, with trailing slash).
  function normalizePath(p) {
    if (!p) return '';
    try { p = decodeURIComponent(p); } catch (_) {}
    p = p.split('#')[0].split('?')[0];
    if (p.length > 1 && p.charAt(p.length - 1) !== '/') p += '/';
    return p;
  }

  function buildLookup(entries) {
    var byKey = Object.create(null);
    var byUrl = Object.create(null);
    entries.forEach(function (entry) {
      if (!entry || !entry.url) return;
      byUrl[normalizePath(entry.url)] = entry;
      var keys = [];
      if (entry.title) keys.push(entry.title);
      if (entry.basename) keys.push(entry.basename);
      (entry.aliases || []).forEach(function (a) { if (a) keys.push(a); });
      keys.forEach(function (k) {
        var nk = normalize(k);
        if (!nk || byKey[nk]) return;
        byKey[nk] = entry;
      });
    });
    return { byKey: byKey, byUrl: byUrl };
  }

  function findCurrentEntry(lookup) {
    var path = normalizePath(window.location.pathname);
    if (lookup.byUrl[path]) return lookup.byUrl[path];
    // Fallback: match by last path segment (handles baseurl mismatches).
    var parts = path.split('/').filter(Boolean);
    var last = parts[parts.length - 1];
    if (last && lookup.byKey[normalize(last)]) {
      return lookup.byKey[normalize(last)];
    }
    return null;
  }

  function collectionColor(name) {
    var palette = {
      posts: '#0d6efd', docs: '#198754', notes: '#6f42c1',
      notebooks: '#d63384', quickstart: '#fd7e14', about: '#20c997',
      hobbies: '#ffc107', news: '#6610f2', services: '#0dcaf0'
    };
    return palette[name] || '#6c757d';
  }

  // BFS from the current entry up to `depth` hops, following both
  // outgoing edges and incoming edges (any other entry whose `outgoing`
  // includes one of our keys).
  function buildSubgraph(entries, lookup, current, depth) {
    var visited = Object.create(null);
    var queue = [{ entry: current, dist: 0 }];
    var nodes = [];
    var edges = [];
    var seenEdge = Object.create(null);

    // Pre-compute reverse adjacency so we can find incoming neighbors
    // without scanning all entries each hop.
    var reverse = Object.create(null);
    entries.forEach(function (entry) {
      (entry.outgoing || []).forEach(function (target) {
        var nk = normalize(target);
        if (!reverse[nk]) reverse[nk] = [];
        reverse[nk].push(entry);
      });
    });

    function keysFor(entry) {
      var keys = [];
      if (entry.title) keys.push(normalize(entry.title));
      if (entry.basename) keys.push(normalize(entry.basename));
      (entry.aliases || []).forEach(function (a) {
        if (a) keys.push(normalize(a));
      });
      return keys;
    }

    function addEdge(srcId, tgtId, broken) {
      var k = srcId + '|' + tgtId;
      if (seenEdge[k]) return;
      seenEdge[k] = true;
      edges.push({
        group: 'edges',
        data: { id: 'le:' + k, source: srcId, target: tgtId, broken: !!broken }
      });
    }

    while (queue.length) {
      var item = queue.shift();
      var entry = item.entry;
      var nid = entry.url;
      if (visited[nid]) continue;
      visited[nid] = true;

      nodes.push({
        group: 'nodes',
        data: {
          id: nid,
          label: entry.title || entry.basename || nid,
          url: entry.url,
          collection: entry.collection || 'page',
          color: collectionColor(entry.collection),
          isCurrent: entry.url === current.url
        }
      });

      if (item.dist >= depth) continue;

      // Outgoing edges
      (entry.outgoing || []).forEach(function (target) {
        var nk = normalize(target);
        var resolved = lookup.byKey[nk];
        if (resolved) {
          if (resolved.url === entry.url) return;
          addEdge(entry.url, resolved.url, false);
          if (!visited[resolved.url]) {
            queue.push({ entry: resolved, dist: item.dist + 1 });
          }
        } else {
          var brokenId = '__broken__:' + nk;
          if (!visited[brokenId]) {
            visited[brokenId] = true;
            nodes.push({
              group: 'nodes',
              data: {
                id: brokenId,
                label: target,
                url: null,
                collection: 'broken',
                color: '#dc3545',
                broken: true
              }
            });
          }
          addEdge(entry.url, brokenId, true);
        }
      });

      // Incoming edges (anyone whose outgoing matches one of our keys)
      keysFor(entry).forEach(function (k) {
        (reverse[k] || []).forEach(function (src) {
          if (src.url === entry.url) return;
          addEdge(src.url, entry.url, false);
          if (!visited[src.url]) {
            queue.push({ entry: src, dist: item.dist + 1 });
          }
        });
      });
    }

    return nodes.concat(edges);
  }

  function readTheme() {
    var attr = (document.documentElement.getAttribute('data-bs-theme') ||
      document.body.getAttribute('data-bs-theme') || '').toLowerCase();
    var dark = attr === 'dark' || (!attr && window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
    return dark ? {
      label: '#e9ecef', labelOutline: '#1b1f23',
      edge: 'rgba(173,181,189,0.45)', edgeArrow: 'rgba(173,181,189,0.65)',
      canvasBg: '#1b1f23', nodeBorder: 'rgba(255,255,255,0.22)'
    } : {
      label: '#1b1f23', labelOutline: '#f8f9fa',
      edge: 'rgba(73,80,87,0.40)', edgeArrow: 'rgba(73,80,87,0.60)',
      canvasBg: '#f8f9fa', nodeBorder: 'rgba(0,0,0,0.20)'
    };
  }

  function loadCytoscape(cb) {
    if (typeof window.cytoscape === 'function') return cb();
    // Re-use any in-flight load (e.g. when the full graph page also loads it).
    if (window.__obsidianCytoscapeLoading) {
      window.__obsidianCytoscapeLoading.push(cb);
      return;
    }
    window.__obsidianCytoscapeLoading = [cb];
    var existing = document.querySelector('script[src*="cytoscape"]');
    if (existing) {
      existing.addEventListener('load', function () {
        window.__obsidianCytoscapeLoading.forEach(function (fn) { fn(); });
        window.__obsidianCytoscapeLoading = null;
      });
      return;
    }
    var s = document.createElement('script');
    s.src = CYTOSCAPE_URL;
    s.integrity = CYTOSCAPE_SRI;
    s.crossOrigin = 'anonymous';
    s.defer = true;
    s.onload = function () {
      window.__obsidianCytoscapeLoading.forEach(function (fn) { fn(); });
      window.__obsidianCytoscapeLoading = null;
    };
    s.onerror = function () {
      console.warn('[obsidian-local-graph] failed to load cytoscape');
      window.__obsidianCytoscapeLoading = null;
    };
    document.head.appendChild(s);
  }

  function render(container, elements, currentUrl) {
    var theme = readTheme();
    container.style.backgroundColor = theme.canvasBg;

    var cy = window.cytoscape({
      container: container,
      elements: elements,
      minZoom: 0.3,
      maxZoom: 3,
      autoungrabify: false,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(label)',
            'font-size': '11px',
            'font-weight': 500,
            'color': theme.label,
            'text-outline-color': theme.labelOutline,
            'text-outline-width': 2,
            'text-outline-opacity': 0.95,
            'text-background-opacity': 0,
            'text-valign': 'bottom',
            'text-margin-y': 4,
            'text-wrap': 'ellipsis',
            'text-max-width': '140px',
            'width': 16, 'height': 16,
            'border-width': 1.5,
            'border-color': theme.nodeBorder,
            'transition-property': 'background-color, border-color, width, height',
            'transition-duration': '160ms'
          }
        },
        {
          // Highlight the current page so users always know "you are here".
          selector: 'node[?isCurrent]',
          style: {
            'width': 22, 'height': 22,
            'border-width': 3,
            'border-color': '#fd7e14',
            'font-size': '11px',
            'font-weight': 700
          }
        },
        {
          selector: 'node[broken]',
          style: {
            'background-color': '#dc3545',
            'border-style': 'dashed',
            'border-color': '#dc3545'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': theme.edge,
            'target-arrow-color': theme.edgeArrow,
            'target-arrow-shape': 'triangle',
            'arrow-scale': 0.7,
            'curve-style': 'bezier'
          }
        },
        {
          selector: 'edge[broken]',
          style: { 'line-style': 'dashed', 'line-color': '#dc3545' }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        padding: 14,
        nodeRepulsion: function () { return 6000; },
        idealEdgeLength: function () { return 60; },
        edgeElasticity: function () { return 60; },
        nodeOverlap: 12,
        gravity: 0.3,
        numIter: 1200,
        fit: true
      }
    });

    container.__obsidianLocalGraph = cy;

    cy.on('tap', 'node', function (evt) {
      var d = evt.target.data();
      if (!d.url || d.broken) return;
      if (d.url === currentUrl) return;
      // ⌘/Ctrl-click opens in a new tab, mirroring the full graph page.
      var oe = evt.originalEvent;
      if (oe && (oe.metaKey || oe.ctrlKey)) {
        window.open(d.url, '_blank', 'noopener');
      } else {
        window.location.href = d.url;
      }
    });

    cy.on('mouseover', 'node', function (evt) {
      evt.target.style('z-index', 99);
    });

    requestAnimationFrame(function () {
      resizeGraph(container);
    });

    return cy;
  }

  function init() {
    var container = document.getElementById(CONTAINER_ID);
    if (!container) return;
    setPanelAvailable(container, true);
    setStatus(container, 'Loading graph...', false);

    var panel = container.closest(PANEL_SELECTOR);
    if (panel) {
      panel.addEventListener('shown.bs.offcanvas', function () {
        resizeGraph(container);
      });
    }

    window.addEventListener('resize', function () {
      resizeGraph(container);
    });

    var depth = parseInt(container.getAttribute('data-depth') || '1', 10);
    if (!isFinite(depth) || depth < 1) depth = 1;
    var indexUrl = container.getAttribute('data-index-url') ||
      ((document.querySelector('base') || {}).href || '/') +
      'assets/data/wiki-index.json';

    fetch(indexUrl, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (data) {
        var entries = Array.isArray(data && data.entries) ? data.entries : [];
        if (!entries.length) { setPanelAvailable(container, false); return; }
        var lookup = buildLookup(entries);
        var current = findCurrentEntry(lookup);
        if (!current) { setPanelAvailable(container, false); return; }
        var elements = buildSubgraph(entries, lookup, current, depth);
        loadCytoscape(function () {
          render(container, elements, current.url);
          var nodeCount = elements.filter(function (element) { return element.group === 'nodes'; }).length;
          var edgeCount = elements.filter(function (element) { return element.group === 'edges'; }).length;
          setStatus(container, nodeCount + ' pages · ' + edgeCount + ' links', false);
        });
      })
      .catch(function (err) {
        // Sidebar panel failing is non-fatal — hide and stay quiet.
        console.warn('[obsidian-local-graph] init failed:', err);
        setPanelAvailable(container, false);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
