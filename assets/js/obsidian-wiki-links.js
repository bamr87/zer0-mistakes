// Feature: ZER0-044
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

  // Replicate kramdown's basic header-id algorithm so [[Page#Heading]] fragments
  // land on the heading kramdown generated. Kept byte-identical to
  // Jekyll::Obsidian::Converter#anchorize in _plugins/obsidian_links.rb.
  function anchorize(anchor) {
    return String(anchor == null ? '' : anchor).trim()
      .replace(/^[^a-zA-Z]+/, '')
      .replace(/[^a-zA-Z0-9 -]/g, '')
      .replace(/ /g, '-')
      .toLowerCase();
  }

  // Match Jekyll's default `slugify` filter (used by pages/tags.md anchor ids)
  // so inline #tags link to a real on-page anchor. Mirrors Converter#slugify.
  function tagSlug(tag) {
    return String(tag || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  // Skip hex-colour-shaped tokens in prose (e.g. `#ffffff`, `#fff`, `#1a2b3c`)
  // so they aren't linkified as tags. Suppress standard CSS hex lengths (3/6/8)
  // and any digit-containing hex; length 4/5/7 all-letter tokens stay tags so
  // the iconic hex-words (#cafe, #dead, #beef, #face) still link. Mirrors the
  // Ruby `color_like_tag?` helper byte-for-byte.
  function isColorLikeTag(tag) {
    var t = String(tag || '');
    if (!/^[0-9a-fA-F]+$/.test(t)) return false;
    if (t.length === 3 || t.length === 6 || t.length === 8) return true;
    return t.length >= 3 && t.length <= 8 && /\d/.test(t);
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
    var url = info.url + (parts.anchor ? '#' + anchorize(parts.anchor) : '');
    // Mirror the Liquid card in _includes/content/transclude.html so embeds
    // styled by .obsidian-embed-source / .obsidian-embed-body render identically
    // on the GitHub Pages (client) path. Excerpt is plain text (no client-side
    // markdownify) — escaped to stay XSS-safe.
    return '<aside class="obsidian-embed obsidian-embed-note card my-3" aria-label="Embedded note: ' +
      escapeHtml(info.title || parts.page) + '">' +
      '<div class="card-header"><span class="obsidian-embed-source">' +
      '<i class="bi bi-link-45deg me-1" aria-hidden="true"></i>Embedded: ' +
      '<a href="' + escapeHtml(url) + '">' + escapeHtml(info.title || parts.page) + '</a>' +
      '</span></div>' +
      '<div class="card-body obsidian-embed-body">' + escapeHtml(info.excerpt || '') + '</div>' +
      '</aside>';
  }

  function renderWikiLink(target, aliasText, byKey, currentUrl) {
    var parts = splitAnchor(target);
    var display = aliasText || (parts.anchor ? parts.page + ' \u203A ' + parts.anchor : parts.page);
    var info = byKey[normalize(parts.page)];
    if (!info) {
      // Non-navigating <span>: a broken link has no target, so a click must
      // not scroll the page to the top (the old href="#" behaviour).
      return '<span class="' + CONFIG.brokenLinkClass +
        '" data-wiki-target="' + escapeHtml(parts.page) +
        '" title="Unresolved wiki-link: ' + escapeHtml(parts.page) + '">' +
        escapeHtml(display) + '</span>';
    }
    var url = info.url + (parts.anchor ? '#' + anchorize(parts.anchor) : '');
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
      // Not a tag (hex colour): keep the literal text, but still escape the
      // raw lead char so the reconstruction loop can't inject markup.
      if (isColorLikeTag(tag)) return escapeHtml(lead) + '#' + tag;
      var url = (CONFIG.tagBase.replace(/\/$/, '') + '/#' + tagSlug(tag));
      // The lead char is raw source text (often `<`/`&`) — escape it so the
      // reconstruction loop in rewriteContainer can't inject markup.
      return escapeHtml(lead) + '<a href="' + escapeHtml(url) + '" class="obsidian-tag">#' + escapeHtml(tag) + '</a>';
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

  var calloutSeq = 0;

  function rewriteCallouts(container) {
    if (!container) return 0;
    var quotes = container.querySelectorAll('blockquote');
    var count = 0;
    quotes.forEach(function (bq) {
      if (bq.dataset.obsidianCallout) return; // already processed
      // Kramdown emits the callout head as the first <p> of the blockquote, so
      // the first element child is the only place the `[!type]` marker can be.
      var firstChild = bq.firstElementChild;
      if (!firstChild || firstChild.nodeName !== 'P') return;

      var rawText = firstChild.textContent || '';
      var m = rawText.match(CALLOUT_HEAD_RE);
      if (!m) return;

      var type = m[1].toLowerCase();
      var spec = CALLOUT_TYPES[type] || CALLOUT_TYPES.note;
      var fold = m[2];
      var foldable = fold === '+' || fold === '-';
      var collapsed = fold === '-';
      var typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
      var titleText = (m[3] || '').trim() || typeLabel;

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
      if (collapsed) wrapper.setAttribute('data-collapsed', 'true');

      var bodyId = 'obsidian-callout-body-' + (++calloutSeq);
      // Icon is decorative; voice the type for screen readers.
      var titleInner = '<i class="bi ' + spec.icon + ' me-2" aria-hidden="true"></i>' +
        '<span class="visually-hidden">' + escapeHtml(typeLabel) + ': </span>' +
        escapeHtml(titleText);

      var titleEl;
      if (foldable) {
        titleEl = document.createElement('button');
        titleEl.setAttribute('type', 'button');
        titleEl.className = 'obsidian-callout-title obsidian-callout-toggle';
        titleEl.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        titleEl.setAttribute('aria-controls', bodyId);
        titleEl.innerHTML = titleInner +
          '<i class="bi bi-chevron-down obsidian-callout-chevron ms-auto" aria-hidden="true"></i>';
      } else {
        titleEl = document.createElement('div');
        titleEl.className = 'obsidian-callout-title';
        titleEl.setAttribute('role', 'heading');
        titleEl.setAttribute('aria-level', '3');
        titleEl.innerHTML = titleInner;
      }
      wrapper.appendChild(titleEl);

      var bodyEl = document.createElement('div');
      bodyEl.className = 'obsidian-callout-body';
      bodyEl.setAttribute('id', bodyId);
      if (collapsed) bodyEl.setAttribute('hidden', '');
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

  // Delegated toggle for foldable callouts. Bound once on the content container
  // so it works for callouts rendered by EITHER path (server-side Ruby plugin or
  // client-side rewriteCallouts). Native <button> handles Enter/Space for free.
  function wireCalloutToggles(container) {
    if (!container || !container.addEventListener || container.__obsidianCalloutToggleBound) return;
    container.__obsidianCalloutToggleBound = true;
    container.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest && e.target.closest('.obsidian-callout-toggle');
      if (!btn || !container.contains(btn)) return;
      var callout = btn.closest('.obsidian-callout');
      var body = callout && callout.querySelector('.obsidian-callout-body');
      if (!body) return;
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      body.hidden = expanded;
      if (expanded) {
        callout.setAttribute('data-collapsed', 'true');
      } else {
        callout.removeAttribute('data-collapsed');
      }
    });
  }

  function init() {
    // Respect `obsidian: { enabled: false }` even if the script is loaded.
    if (OBSIDIAN_CONFIG.enabled === false) return;

    var container = document.querySelector('#main-content, .bd-content, main, article') || document.body;
    if (!container) return;

    // Bind the foldable-callout toggle first so it works even when the index
    // fetch fails or when callouts were rendered server-side by the plugin.
    wireCalloutToggles(container);

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
