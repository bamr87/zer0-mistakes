/**
 * OS Tabs - Auto-detect OS-specific code blocks and render Bootstrap 5 tabs
 *
 * File: os-tabs.js
 * Path: assets/js/os-tabs.js
 *
 * Scans rendered HTML for consecutive OS-labelled code blocks and groups them
 * into Bootstrap 5 tabbed panels automatically. No Liquid tags required in
 * markdown — authors just write standard fenced code blocks preceded by a bold
 * OS header (e.g. **macOS:**, **Windows:**, **Linux:**).
 *
 * Detection rules:
 *  1. A <p><strong> element whose text matches an OS keyword (case-insensitive)
 *     followed immediately by a code block div (.highlighter-rouge).
 *  2. Consecutive OS-labelled code blocks are grouped into a single tab set.
 *
 * Dependencies:
 *  - Bootstrap 5.3 (nav-tabs, tab-content JS)
 *  - Bootstrap Icons (bi-apple, bi-windows, bi-ubuntu)
 */

(function () {
  'use strict';

  // Map of OS label patterns to their tab configuration
  var OS_MAP = {
    mac:     { pattern: /^(?:macos|mac|_mac_|mac\s*os)[:,]?\s*$/i, label: 'macOS',   icon: 'bi-apple' },
    win:     { pattern: /^(?:windows|win|_windows_)[:,]?\s*$/i,    label: 'Windows', icon: 'bi-windows' },
    linux:   { pattern: /^(?:linux|_linux_|ubuntu|debian)[:,]?\s*$/i, label: 'Linux',   icon: 'bi-ubuntu' }
  };

  /**
   * Try to identify which OS a bold-text paragraph refers to.
   * Returns the key from OS_MAP or null.
   */
  function detectOS(boldText) {
    var cleaned = boldText.replace(/[*_]/g, '').trim();
    for (var key in OS_MAP) {
      if (OS_MAP[key].pattern.test(cleaned)) {
        return key;
      }
    }
    return null;
  }

  /**
   * Test whether an element is a bold-text paragraph like <p><strong>macOS:</strong></p>
   * and return the OS key if so.
   */
  function getOSFromLabel(el) {
    if (!el || el.tagName !== 'P') return null;
    var strong = el.querySelector('strong');
    if (!strong) return null;
    // Only match if the <p> contains nothing but the <strong>
    if (el.textContent.trim() !== strong.textContent.trim()) return null;
    return detectOS(strong.textContent);
  }

  /**
   * Test whether an element is a code block produced by kramdown/rouge.
   */
  function isCodeBlock(el) {
    return el && el.classList && el.classList.contains('highlighter-rouge');
  }

  /**
   * Collect consecutive (label + code-block) pairs starting at the given label
   * element. Returns an array of { os, label: element, code: element } objects.
   */
  function collectGroup(startLabel) {
    var group = [];
    var el = startLabel;

    while (el) {
      var os = getOSFromLabel(el);
      if (!os) break;

      // Next meaningful sibling should be the code block
      var next = nextElementSibling(el);
      if (!isCodeBlock(next)) break;

      group.push({ os: os, label: el, code: next });

      // Move past the code block to see if another OS label follows
      el = nextElementSibling(next);
    }

    return group.length >= 2 ? group : null;
  }

  /**
   * Skip whitespace-only text nodes to find the next element sibling.
   */
  function nextElementSibling(el) {
    var sib = el.nextSibling;
    while (sib) {
      if (sib.nodeType === 1) return sib;             // Element node
      if (sib.nodeType === 3 && sib.textContent.trim() !== '') return null; // Non-empty text
      sib = sib.nextSibling;
    }
    return null;
  }

  /**
   * Build Bootstrap 5 tab markup for a group of OS code blocks.
   */
  function buildTabs(group, tabId) {
    var wrapper = document.createElement('div');
    wrapper.className = 'os-tabs mb-4';

    // Nav tabs
    var nav = document.createElement('ul');
    nav.className = 'nav nav-tabs';
    nav.id = 'os-tab-' + tabId;
    nav.setAttribute('role', 'tablist');

    // Tab content
    var content = document.createElement('div');
    content.className = 'tab-content';
    content.id = 'os-tabContent-' + tabId;

    group.forEach(function (item, idx) {
      var cfg = OS_MAP[item.os];
      var paneId = item.os + '-pane-' + tabId;
      var tabBtnId = item.os + '-tab-' + tabId;
      var isActive = idx === 0;

      // Tab button
      var li = document.createElement('li');
      li.className = 'nav-item';
      li.setAttribute('role', 'presentation');

      var btn = document.createElement('button');
      btn.className = 'nav-link' + (isActive ? ' active' : '');
      btn.id = tabBtnId;
      btn.setAttribute('data-bs-toggle', 'tab');
      btn.setAttribute('data-bs-target', '#' + paneId);
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-controls', paneId);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.innerHTML = '<i class="bi ' + cfg.icon + '" aria-hidden="true"></i> ' + cfg.label;

      li.appendChild(btn);
      nav.appendChild(li);

      // Tab pane — move the original code block into it
      var pane = document.createElement('div');
      pane.className = 'tab-pane fade' + (isActive ? ' show active' : '');
      pane.id = paneId;
      pane.setAttribute('role', 'tabpanel');
      pane.setAttribute('aria-labelledby', tabBtnId);
      pane.tabIndex = 0;

      pane.appendChild(item.code);
      content.appendChild(pane);
    });

    wrapper.appendChild(nav);
    wrapper.appendChild(content);
    return wrapper;
  }

  /**
   * Main entry: scan the page for OS-specific code block groups and convert.
   */
  function init() {
    // Operate inside the main content area only
    var container = document.querySelector('.bd-content') || document.body;
    var paragraphs = Array.prototype.slice.call(container.querySelectorAll('p'));
    var processed = [];
    var tabCounter = 0;

    paragraphs.forEach(function (p) {
      // Skip if already processed (part of a previous group)
      if (processed.indexOf(p) !== -1) return;

      var os = getOSFromLabel(p);
      if (!os) return;

      var group = collectGroup(p);
      if (!group) return;

      tabCounter++;
      var tabs = buildTabs(group, tabCounter);

      // Insert the tabs where the first label was, then remove the labels
      p.parentNode.insertBefore(tabs, p);
      group.forEach(function (item) {
        processed.push(item.label);
        if (item.label.parentNode) item.label.parentNode.removeChild(item.label);
      });
    });
  }

  // Run after the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
