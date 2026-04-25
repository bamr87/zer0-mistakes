/*
 * obsidian-wiki-links.js
 *
 * Client-side fallback that resolves Obsidian-style wiki-links / embeds /
 * inline tags on the rendered page. Used when the Jekyll plugin
 * (_plugins/obsidian_links.rb) is NOT available — most importantly the
 * default GitHub Pages remote_theme build, which only allows whitelisted
 * Jekyll plugins.
 *
 * The plugin (when it runs) emits ready HTML and this script becomes a
 * no-op for already-rewritten content. When the plugin is absent, the raw
 * `[[Page]]` / `![[image.png]]` syntax survives kramdown and we rewrite it
 * here in the DOM using assets/data/wiki-index.json.
 *
 * Lookup keys are normalized identically to the Ruby plugin:
 *   value.toLowerCase().trim().replace(/\s+/g, ' ')
 *
 * Loaded from _includes/components/js-cdn.html (deferred). Skips when
 * `window.__OBSIDIAN_DISABLE_CLIENT__` is true (set this in dev to debug
 * the server-side plugin output).
 */
(function () {
  'use strict';

  if (window.__OBSIDIAN_DISABLE_CLIENT__) {
    return;
  }

  var RESOLVER_SCRIPT_PATH = 'assets/js/obsidian-wiki-links.js';
  var OBSIDIAN_CONFIG = window.OBSIDIAN_CONFIG || {};

  function trimTrailingSlash(value) {
    return (value === null || value === undefined ? '' : String(value)).replace(/\/$/, '');
  }

  function assetPath(path) {
    var script = document.currentScript || document.querySelector('script[src*="obsidian-wiki-links.js"]');
    var src = script && script.getAttribute('src');
    var escapedScriptPath = RESOLVER_SCRIPT_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var match = src && src.match(new RegExp('^(.*?)' + escapedScriptPath + '(?:[?#].*)?$'));
    if (match) return trimTrailingSlash(match[1]) + path;

    var baseHref = (document.querySelector('base') || {}).href;
    return trimTrailingSlash(baseHref) + path;
  }

  var CONFIG = {
    indexUrl: OBSIDIAN_CONFIG.wikiIndexUrl || window.OBSIDIAN_WIKI_INDEX_URL || assetPath('/assets/data/wiki-index.json'),
    attachmentsPath: OBSIDIAN_CONFIG.attachmentsPath || window.OBSIDIAN_ATTACHMENTS_PATH || assetPath('/assets/images/notes'),
    tagBase: OBSIDIAN_CONFIG.tagBase || window.OBSIDIAN_TAG_BASE || assetPath('/tags/'),
    wikiLinkClass: 'wiki-link',
    brokenLinkClass: 'wiki-link wiki-link-broken'
  };

  var IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.bmp'];

  // Patterns kept conservative: we only mutate text nodes inside the main
  // content container so navigation chrome / code samples stay untouched.
  var EMBED_RE = /!\[\[([^\]\n|]+?)(?:\|([^\]\n]+))?\]\]/g;
  var LINK_RE = /\[\[([^\]\n|]+?)(?:\|([^\]\n]+))?\]\]/g;
  var TAG_RE = /(^|[^\w/#&])#([A-Za-z][\w/-]{0,63})/g;

  function normalize(value) {
    return String(value || '').toLowerCase().trim().replace(/\s+/g, ' ');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function splitAnchor(target) {
    var blockMatch = target.match(/^(.+?)\^([\w-]+)$/);
    if (blockMatch) return { page: blockMatch[1].trim(), anchor: blockMatch[2].trim() };
    var headingMatch = target.match(/^(.+?)#(.+)$/);
    if (headingMatch) return { page: headingMatch[1].trim(), anchor: headingMatch[2].trim() };
    return { page: target.trim(), anchor: null };
  }

  function buildIndex(payload) {
    var byKey = Object.create(null);
    if (!payload || !Array.isArray(payload.entries)) return byKey;

    payload.entries.forEach(function (entry) {
      if (!entry || !entry.url) return;
      var keys = [];
      if (entry.title) keys.push(entry.title);
      if (entry.basename) keys.push(entry.basename);
      (entry.aliases || []).forEach(function (a) { if (a) keys.push(a); });
      keys.forEach(function (k) {
        var nk = normalize(k);
        if (!nk || byKey[nk]) return; // first wins, mirrors plugin behaviour
        byKey[nk] = entry;
      });
    });
    return byKey;
  }

  function renderImageEmbed(target, modifier) {
    var widthAttr = '';
    var alt = target;
    if (modifier) {
      if (/^\d+$/.test(modifier)) widthAttr = ' width="' + modifier + '"';
      else alt = modifier;
    }
    var src = target.charAt(0) === '/' ? target : (CONFIG.attachmentsPath.replace(/\/$/, '') + '/' + target);
    return '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) +
      '" loading="lazy" class="obsidian-embed obsidian-embed-image"' + widthAttr + ' />';
  }

  function renderNoteEmbed(target, byKey) {
    var parts = splitAnchor(target);
    var info = byKey[normalize(parts.page)];
    if (!info) {
      return '<div class="obsidian-embed obsidian-embed-broken alert alert-warning" role="alert">' +
        'Embed not found: <code>' + escapeHtml(target) + '</code></div>';
    }
    var url = info.url + (parts.anchor ? '#' + parts.anchor.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : '');
    return '<div class="obsidian-embed obsidian-embed-note">' +
      '<div class="obsidian-embed-header"><a href="' + escapeHtml(url) + '">' +
      escapeHtml(info.title || parts.page) + '</a></div>' +
      '<div class="obsidian-embed-excerpt">' + escapeHtml(info.excerpt || '') + '</div>' +
      '</div>';
  }

  function renderWikiLink(target, aliasText, byKey, currentUrl) {
    var parts = splitAnchor(target);
    var display = aliasText || (parts.anchor ? parts.page + ' \u203A ' + parts.anchor : parts.page);
    var info = byKey[normalize(parts.page)];
    if (!info) {
      return '<a href="#" class="' + CONFIG.brokenLinkClass +
        '" data-wiki-target="' + escapeHtml(parts.page) +
        '" title="Unresolved wiki-link: ' + escapeHtml(parts.page) + '">' +
        escapeHtml(display) + '</a>';
    }
    var url = info.url + (parts.anchor ? '#' + parts.anchor.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : '');
    var currentAttr = currentUrl && info.url === currentUrl ? ' aria-current="page"' : '';
    return '<a href="' + escapeHtml(url) + '" class="' + CONFIG.wikiLinkClass +
      '" data-wiki-target="' + escapeHtml(parts.page) + '"' + currentAttr + '>' +
      escapeHtml(display) + '</a>';
  }

  function rewriteHtml(html, byKey, currentUrl) {
    // Embeds first (longer match `![[ … ]]` would otherwise be eaten by [[ … ]]).
    html = html.replace(EMBED_RE, function (_match, target, modifier) {
      target = target.trim();
      modifier = (modifier || '').trim();
      var ext = (target.match(/\.[A-Za-z0-9]+$/) || [''])[0].toLowerCase();
      if (IMAGE_EXTENSIONS.indexOf(ext) !== -1) return renderImageEmbed(target, modifier);
      return renderNoteEmbed(target, byKey);
    });
    html = html.replace(LINK_RE, function (_match, target, alias) {
      return renderWikiLink(target.trim(), (alias || '').trim(), byKey, currentUrl);
    });
    html = html.replace(TAG_RE, function (_match, lead, tag) {
      var url = (CONFIG.tagBase.replace(/\/$/, '') + '/#' + tag.toLowerCase().replace(/\//g, '-'));
      return lead + '<a href="' + escapeHtml(url) + '" class="obsidian-tag">#' + escapeHtml(tag) + '</a>';
    });
    return html;
  }

  function eligibleNode(node) {
    // Only walk text nodes whose parent isn't code / pre / a / script / style
    // and that contain at least one of our markers.
    if (node.nodeType !== Node.TEXT_NODE) return false;
    var parent = node.parentNode;
    while (parent && parent !== document.body) {
      var tag = parent.nodeName;
      if (tag === 'CODE' || tag === 'PRE' || tag === 'A' || tag === 'SCRIPT' || tag === 'STYLE') return false;
      if (parent.classList && (parent.classList.contains('mermaid') || parent.classList.contains('obsidian-embed'))) return false;
      parent = parent.parentNode;
    }
    var text = node.nodeValue;
    return text && (text.indexOf('[[') !== -1 || text.indexOf('![[') !== -1 || /(^|[^\w/#&])#[A-Za-z]/.test(text));
  }

  function rewriteContainer(container, byKey, currentUrl) {
    if (!container) return 0;
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    var batch = [];
    var node;
    while ((node = walker.nextNode())) {
      if (eligibleNode(node)) batch.push(node);
    }
    var rewrites = 0;
    batch.forEach(function (textNode) {
      var original = textNode.nodeValue;
      var rewritten = rewriteHtml(original, byKey, currentUrl);
      if (rewritten === original) return;

      // The rewriter only inserts HTML for matched markers; everything else
      // is the raw text-node content. Wrap the bits between matches in
      // escaped fragments so injected `<` / `&` from the source stays inert.
      var safe = '';
      var lastIndex = 0;
      var combined = /(!\[\[[^\]\n|]+(?:\|[^\]\n]+)?\]\])|(\[\[[^\]\n|]+(?:\|[^\]\n]+)?\]\])|((?:^|[^\w/#&])#[A-Za-z][\w/-]{0,63})/g;
      var match;
      while ((match = combined.exec(original)) !== null) {
        safe += escapeHtml(original.slice(lastIndex, match.index));
        safe += rewriteHtml(match[0], byKey, currentUrl);
        lastIndex = combined.lastIndex;
      }
      safe += escapeHtml(original.slice(lastIndex));

      var template = document.createElement('template');
      template.innerHTML = safe;
      textNode.parentNode.replaceChild(template.content, textNode);
      rewrites += 1;
    });
    return rewrites;
  }

  function getCurrentUrl() {
    return window.location.pathname;
  }

  // ---- Callouts (DOM-level, post-kramdown) -----------------------------
  // Kramdown turns `> [!type] Title\n> body` into:
  //   <blockquote><p>[!type] Title\nbody</p></blockquote>
  // We detect that pattern and rewrite the blockquote into a Bootstrap alert.
  var CALLOUT_TYPES = {
    note:      { alert: 'primary',   icon: 'bi-pencil-square'        },
    abstract:  { alert: 'secondary', icon: 'bi-card-text'            },
    summary:   { alert: 'secondary', icon: 'bi-card-text'            },
    tldr:      { alert: 'secondary', icon: 'bi-card-text'            },
    info:      { alert: 'info',      icon: 'bi-info-circle'          },
    todo:      { alert: 'info',      icon: 'bi-check2-square'        },
    tip:       { alert: 'success',   icon: 'bi-lightbulb'            },
    hint:      { alert: 'success',   icon: 'bi-lightbulb'            },
    important: { alert: 'warning',   icon: 'bi-exclamation-circle'   },
    success:   { alert: 'success',   icon: 'bi-check-circle'         },
    check:     { alert: 'success',   icon: 'bi-check-circle'         },
    done:      { alert: 'success',   icon: 'bi-check-circle'         },
    question:  { alert: 'info',      icon: 'bi-question-circle'      },
    help:      { alert: 'info',      icon: 'bi-question-circle'      },
    faq:       { alert: 'info',      icon: 'bi-question-circle'      },
    warning:   { alert: 'warning',   icon: 'bi-exclamation-triangle' },
    caution:   { alert: 'warning',   icon: 'bi-exclamation-triangle' },
    attention: { alert: 'warning',   icon: 'bi-exclamation-triangle' },
    failure:   { alert: 'danger',    icon: 'bi-x-octagon'            },
    fail:      { alert: 'danger',    icon: 'bi-x-octagon'            },
    missing:   { alert: 'danger',    icon: 'bi-x-octagon'            },
    danger:    { alert: 'danger',    icon: 'bi-shield-exclamation'   },
    error:     { alert: 'danger',    icon: 'bi-shield-exclamation'   },
    bug:       { alert: 'danger',    icon: 'bi-bug'                  },
    example:   { alert: 'secondary', icon: 'bi-code-slash'           },
    quote:     { alert: 'secondary', icon: 'bi-chat-quote'           },
    cite:      { alert: 'secondary', icon: 'bi-chat-quote'           }
  };

  // Match the first line of the first <p> inside a blockquote, e.g.
  // `[!warning]+ Foldable warning`.
  var CALLOUT_HEAD_RE = /^\s*\[!([A-Za-z]+)\]([+-]?)\s*([^\n]*)/;

  function rewriteCallouts(container) {
    if (!container) return 0;
    var quotes = container.querySelectorAll('blockquote');
    var count = 0;
    quotes.forEach(function (bq) {
      if (bq.dataset.obsidianCallout) return; // already processed
      var firstChild = bq.firstElementChild;
      // Walk past whitespace text nodes
      while (firstChild && firstChild.nodeName !== 'P' && firstChild.nodeType !== 1) {
        firstChild = firstChild.nextElementSibling;
      }
      if (!firstChild || firstChild.nodeName !== 'P') return;

      var rawText = firstChild.textContent || '';
      var m = rawText.match(CALLOUT_HEAD_RE);
      if (!m) return;

      var type = m[1].toLowerCase();
      var spec = CALLOUT_TYPES[type] || CALLOUT_TYPES.note;
      var fold = m[2];
      var titleText = (m[3] || '').trim() || (type.charAt(0).toUpperCase() + type.slice(1));

      // Strip the "[!type]…" head from the first paragraph (keep any trailing text)
      var headLength = m[0].length;
      var trailing = rawText.slice(headLength).replace(/^\s*\n?/, '');
      if (trailing) {
        firstChild.textContent = trailing;
      } else {
        firstChild.remove();
      }

      var wrapper = document.createElement('div');
      wrapper.className = 'alert alert-' + spec.alert + ' obsidian-callout obsidian-callout-' + type;
      wrapper.setAttribute('role', 'alert');
      wrapper.dataset.obsidianCallout = type;
      if (fold === '-') wrapper.dataset.collapsed = 'true';

      var titleEl = document.createElement('div');
      titleEl.className = 'obsidian-callout-title';
      titleEl.innerHTML = '<i class="bi ' + spec.icon + ' me-2" aria-hidden="true"></i>' + escapeHtml(titleText);
      wrapper.appendChild(titleEl);

      var bodyEl = document.createElement('div');
      bodyEl.className = 'obsidian-callout-body';
      // Move blockquote children into the body, preserving inner HTML
      while (bq.firstChild) {
        bodyEl.appendChild(bq.firstChild);
      }
      wrapper.appendChild(bodyEl);

      bq.parentNode.replaceChild(wrapper, bq);
      count += 1;
    });
    return count;
  }

  function init() {
    var container = document.querySelector('#main-content, .bd-content, main, article') || document.body;
    if (!container) return;

    fetch(CONFIG.indexUrl, { credentials: 'same-origin', cache: 'force-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (payload) {
        if (!payload) return;
        var byKey = buildIndex(payload);
        window.__OBSIDIAN_INDEX__ = byKey;
        var rewrites = rewriteContainer(container, byKey, getCurrentUrl());
        var calloutCount = rewriteCallouts(container);
        if ((rewrites > 0 || calloutCount > 0) && window.console && console.debug) {
          console.debug('[obsidian] rewrote', rewrites, 'text nodes,', calloutCount, 'callouts');
        }
        document.dispatchEvent(new CustomEvent('obsidian:ready', { detail: { count: payload.count || 0, calloutCount: calloutCount } }));
      })
      .catch(function (err) {
        // Even if the index fails, we can still convert callouts (no index needed).
        try {
          var calloutCount = rewriteCallouts(container);
          if (calloutCount > 0 && window.console && console.debug) {
            console.debug('[obsidian] rewrote', calloutCount, 'callouts (index unavailable)');
          }
        } catch (e) { /* swallow */ }
        if (window.console && console.warn) console.warn('[obsidian] wiki-index fetch failed:', err);
      });
  }

  // Expose for testing / programmatic use
  window.ObsidianResolver = {
    rewriteHtml: rewriteHtml,
    rewriteCallouts: rewriteCallouts,
    rewriteContainer: rewriteContainer,
    buildIndex: buildIndex,
    normalize: normalize
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
