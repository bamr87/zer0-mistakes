/*
 * test_resolver.js — Node smoke test for assets/js/obsidian-wiki-links.js
 *
 * Loads the resolver in a JSDOM-free, minimal-shim environment and asserts
 * that wiki-links, image embeds, inline tags, and Obsidian callouts get
 * rewritten correctly. Run with:
 *
 *   node test/test_resolver.js
 *
 * Exit codes:
 *   0 — all assertions passed
 *   1 — one or more assertions failed
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const RESOLVER_SRC = fs.readFileSync(
  path.join(ROOT, 'assets/js/obsidian-wiki-links.js'),
  'utf8'
);

// --- Minimal DOM shim -----------------------------------------------------
// We deliberately do NOT depend on jsdom here. Reasons:
//   1. The repo has no other Node test dependencies — adding jsdom would
//      pull ~3MB of transitive deps and an `npm install` step into the
//      test runner, which currently has zero npm prerequisites.
//   2. The resolver only uses a tiny subset of DOM APIs (treeWalker over
//      text nodes, blockquote queries, basic element creation, dataset).
//      A ~150-line shim covers the surface and keeps the test self-
//      contained / deterministic.
//   3. Faithful HTML parsing isn't needed: we control the input strings.
//
// If the resolver ever starts touching real-world DOM features the shim
// doesn't model (e.g. CSS selectors beyond simple tag/class/id, MutationObserver,
// Range APIs, contenteditable behaviors), switch to jsdom — at that point
// the dependency cost is justified.
function makeShim() {
  const NODE_TYPES = { ELEMENT: 1, TEXT: 3 };

  class ClassList {
    constructor(node) { this.node = node; }
    contains(name) { return (this.node._classes || []).indexOf(name) !== -1; }
    add(name) {
      this.node._classes = this.node._classes || [];
      if (!this.contains(name)) this.node._classes.push(name);
      this.node._sync();
    }
  }

  class Node {
    constructor(type) {
      this.nodeType = type;
      this.parentNode = null;
      this.childNodes = [];
    }
    get firstChild() { return this.childNodes[0] || null; }
    get firstElementChild() {
      return this.childNodes.find(function (n) { return n.nodeType === NODE_TYPES.ELEMENT; }) || null;
    }
    appendChild(child) {
      if (child._isFragment) {
        child.childNodes.slice().forEach((c) => this.appendChild(c));
        return child;
      }
      if (child.parentNode) child.parentNode.removeChild(child);
      child.parentNode = this;
      this.childNodes.push(child);
      return child;
    }
    removeChild(child) {
      const idx = this.childNodes.indexOf(child);
      if (idx >= 0) this.childNodes.splice(idx, 1);
      child.parentNode = null;
      return child;
    }
    replaceChild(newChild, oldChild) {
      const idx = this.childNodes.indexOf(oldChild);
      if (idx < 0) return null;
      if (newChild._isFragment) {
        const kids = newChild.childNodes.slice();
        this.childNodes.splice(idx, 1, ...kids);
        kids.forEach((c) => { c.parentNode = this; });
        oldChild.parentNode = null;
        return oldChild;
      }
      if (newChild.parentNode) newChild.parentNode.removeChild(newChild);
      this.childNodes[idx] = newChild;
      newChild.parentNode = this;
      oldChild.parentNode = null;
      return oldChild;
    }
    remove() {
      if (this.parentNode) this.parentNode.removeChild(this);
    }
    get nextElementSibling() {
      if (!this.parentNode) return null;
      const sibs = this.parentNode.childNodes;
      const idx = sibs.indexOf(this);
      for (let i = idx + 1; i < sibs.length; i += 1) {
        if (sibs[i].nodeType === NODE_TYPES.ELEMENT) return sibs[i];
      }
      return null;
    }
  }

  class TextNode extends Node {
    constructor(text) { super(NODE_TYPES.TEXT); this.nodeValue = text; }
    get textContent() { return this.nodeValue; }
    set textContent(v) { this.nodeValue = v; }
  }

  class Element extends Node {
    constructor(tag) {
      super(NODE_TYPES.ELEMENT);
      this.nodeName = tag.toUpperCase();
      this._attrs = {};
      this._classes = [];
      this.dataset = {};
      this.classList = new ClassList(this);
    }
    setAttribute(k, v) {
      this._attrs[k] = String(v);
      if (k === 'class') this._classes = String(v).split(/\s+/).filter(Boolean);
    }
    getAttribute(k) {
      if (k === 'class') return this._classes.join(' ');
      return this._attrs[k];
    }
    set className(v) {
      this._classes = String(v).split(/\s+/).filter(Boolean);
      this._attrs['class'] = v;
    }
    get className() { return this._classes.join(' '); }
    _sync() { this._attrs['class'] = this._classes.join(' '); }
    get textContent() {
      let out = '';
      const walk = (n) => {
        if (n.nodeType === NODE_TYPES.TEXT) out += n.nodeValue;
        else (n.childNodes || []).forEach(walk);
      };
      this.childNodes.forEach(walk);
      return out;
    }
    set textContent(v) {
      this.childNodes = [];
      this.appendChild(new TextNode(v));
    }
    set innerHTML(html) {
      this.childNodes = [];
      // Very small parser sufficient for our generated output.
      // Splits on tag boundaries and creates simple Element/Text nodes.
      const tokens = html.split(/(<\/?[A-Za-z][^>]*>)/g).filter(Boolean);
      const stack = [this];
      tokens.forEach((tok) => {
        const top = stack[stack.length - 1];
        let m = tok.match(/^<([A-Za-z][A-Za-z0-9]*)([^>]*?)\/>$/);
        if (m) {
          const el = new Element(m[1]);
          parseAttrs(el, m[2]);
          top.appendChild(el);
          return;
        }
        m = tok.match(/^<([A-Za-z][A-Za-z0-9]*)([^>]*)>$/);
        if (m) {
          const el = new Element(m[1]);
          parseAttrs(el, m[2]);
          top.appendChild(el);
          stack.push(el);
          return;
        }
        m = tok.match(/^<\/([A-Za-z][A-Za-z0-9]*)>$/);
        if (m) {
          if (stack.length > 1) stack.pop();
          return;
        }
        // Text content — decode the entities we emit. Use a single-pass
        // replacement so we never double-unescape (e.g. `&amp;lt;` must stay
        // `&lt;`, not become `<`). CodeQL js/double-escaping safe.
        const ENTITY_MAP = {
          'amp': '&',
          'lt': '<',
          'gt': '>',
          'quot': '"',
          '#39': "'",
        };
        const text = tok.replace(/&(amp|lt|gt|quot|#39);/g, (_m, k) => ENTITY_MAP[k]);
        top.appendChild(new TextNode(text));
      });
    }
    get outerHTML() { return serialize(this); }
    querySelectorAll(sel) {
      // Only `blockquote` selector is needed for callout rewriting.
      if (sel === 'blockquote') return findAll(this, (n) => n.nodeName === 'BLOCKQUOTE');
      throw new Error('querySelectorAll: unsupported selector ' + sel);
    }
    querySelector(sel) {
      // For init() we accept compound selectors — return the first that matches.
      const tags = sel.split(',').map((s) => s.trim());
      for (const t of tags) {
        let match = null;
        if (t.startsWith('#')) {
          match = findAll(this, (n) => n._attrs.id === t.slice(1))[0];
        } else if (t.startsWith('.')) {
          match = findAll(this, (n) => (n._classes || []).indexOf(t.slice(1)) !== -1)[0];
        } else {
          match = findAll(this, (n) => n.nodeName === t.toUpperCase())[0];
        }
        if (match) return match;
      }
      return null;
    }
  }

  class DocumentFragment extends Node {
    constructor() { super(11); this._isFragment = true; }
  }

  // Top-level document.querySelector implementation (for CONFIG init).
  function docQuerySelector(sel) {
    return document.body.querySelector(sel);
  }

  function parseAttrs(el, attrStr) {
    const re = /([A-Za-z-]+)(?:="([^"]*)")?/g;
    let m;
    while ((m = re.exec(attrStr)) !== null) {
      el.setAttribute(m[1], m[2] == null ? '' : m[2]);
      if (m[1].startsWith('data-')) {
        const key = m[1].slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        el.dataset[key] = m[2] == null ? '' : m[2];
      }
    }
  }

  function findAll(root, pred) {
    const out = [];
    const walk = (n) => {
      if (n.nodeType === NODE_TYPES.ELEMENT && pred(n)) out.push(n);
      (n.childNodes || []).forEach(walk);
    };
    walk(root);
    return out;
  }

  function serialize(n) {
    if (!n) return '';
    if (n.nodeType === NODE_TYPES.TEXT) {
      return String(n.nodeValue || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
    if (n.nodeType === 11) {
      return n.childNodes.map(serialize).join('');
    }
    const tag = n.nodeName.toLowerCase();
    let attrs = '';
    Object.keys(n._attrs).forEach((k) => {
      if (k === 'class') return; // serialize from _classes for canonical order
      attrs += ' ' + k + '="' + String(n._attrs[k])
        .replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"';
    });
    if (n._classes && n._classes.length) {
      attrs += ' class="' + n._classes.join(' ') + '"';
    }
    const inner = (n.childNodes || []).map(serialize).join('');
    return '<' + tag + attrs + '>' + inner + '</' + tag + '>';
  }

  function makeTreeWalker(root, _filterMask) {
    const queue = [];
    (function walk(n) {
      if (n !== root && n.nodeType === NODE_TYPES.TEXT) queue.push(n);
      (n.childNodes || []).forEach(walk);
    })(root);
    let i = -1;
    return {
      nextNode() { i += 1; return i < queue.length ? queue[i] : null; }
    };
  }

  const document = {
    body: new Element('body'),
    querySelector: docQuerySelector,
    createElement(tag) {
      if (tag === 'template') {
        const t = new Element('template');
        Object.defineProperty(t, 'content', {
          get() { return t._frag || (t._frag = new DocumentFragment()); },
        });
        // Setting innerHTML on template should populate `content`.
        Object.defineProperty(t, 'innerHTML', {
          set(html) {
            t._frag = new DocumentFragment();
            const tmp = new Element('div');
            tmp.innerHTML = html;
            tmp.childNodes.slice().forEach((c) => t._frag.appendChild(c));
          },
        });
        return t;
      }
      return new Element(tag);
    },
    createTreeWalker: makeTreeWalker,
    addEventListener() {},
    dispatchEvent() {},
    readyState: 'complete',
  };

  return {
    document,
    NODE_TYPES,
    Element,
    TextNode,
    serialize,
    NodeFilter: { SHOW_TEXT: 4 },
    Node: { TEXT_NODE: 3, ELEMENT_NODE: 1 },
    CustomEvent: function () { return {}; },
    window: {},
    console,
    fetch: () => Promise.resolve({ ok: false }),
  };
}

// --- Run ------------------------------------------------------------------
function runResolver() {
  const shim = makeShim();
  const sandbox = {
    window: shim.window,
    document: shim.document,
    NodeFilter: shim.NodeFilter,
    Node: shim.Node,
    CustomEvent: shim.CustomEvent,
    fetch: shim.fetch,
    console: shim.console,
  };
  vm.createContext(sandbox);
  vm.runInContext(RESOLVER_SRC, sandbox);
  return { sandbox, shim, resolver: sandbox.window.ObsidianResolver };
}

const { sandbox, shim, resolver } = runResolver();
if (!resolver) {
  console.error('FAIL: ObsidianResolver did not attach to window');
  process.exit(1);
}

// ---- Build a fake wiki-index ---------------------------------------------
const indexPayload = {
  count: 2,
  entries: [
    {
      title: 'Markdown Formatting Tips',
      basename: 'markdown-tips',
      url: '/notes/markdown-tips/',
      collection: 'notes',
      tags: ['markdown'], aliases: ['Markdown Tips'], excerpt: 'Tips for formatting Markdown.',
    },
    {
      title: 'Docker Commands',
      basename: 'docker-commands',
      url: '/notes/docker-commands/',
      collection: 'notes',
      tags: ['docker'], aliases: [], excerpt: 'Common Docker commands.',
    },
  ],
};
const byKey = resolver.buildIndex(indexPayload);

// ---- Assertion helpers ---------------------------------------------------
const failures = [];
function assert(name, cond, detail) {
  if (cond) { console.log('  ✓ ' + name); }
  else { console.log('  ✗ ' + name + (detail ? ' — ' + detail : '')); failures.push(name); }
}

// ---- Wiki-link resolution ------------------------------------------------
console.log('Wiki-link resolution:');
let html = resolver.rewriteHtml('See [[Markdown Formatting Tips]] for details.', byKey, '/notes/x/');
assert('plain wiki-link → resolved <a class="wiki-link">', /class="wiki-link"/.test(html) && /href="\/notes\/markdown-tips\/"/.test(html), html);

html = resolver.rewriteHtml('See [[Markdown Formatting Tips|the cheatsheet]].', byKey, '/notes/x/');
assert('alias wiki-link uses alias text', />the cheatsheet</.test(html), html);

html = resolver.rewriteHtml('Jump to [[Markdown Formatting Tips#Basic Formatting]].', byKey, '/notes/x/');
assert('header anchor preserved', /#basic-formatting/.test(html), html);

html = resolver.rewriteHtml('Resolve via alias: [[Markdown Tips]]', byKey, '/notes/x/');
assert('alias key resolves', /href="\/notes\/markdown-tips\/"/.test(html), html);

html = resolver.rewriteHtml('Broken [[Definitely Not Real]] link.', byKey, '/notes/x/');
assert('unresolved → wiki-link-broken', /class="wiki-link wiki-link-broken"/.test(html), html);

// ---- Embeds --------------------------------------------------------------
console.log('Embeds:');
html = resolver.rewriteHtml('![[diagram.png|320]]', byKey, '/notes/x/');
assert('image embed → <img>', /<img /.test(html) && / width="320"/.test(html) && /class="obsidian-embed obsidian-embed-image"/.test(html), html);

html = resolver.rewriteHtml('![[Docker Commands]]', byKey, '/notes/x/');
assert('note embed → obsidian-embed-note block', /class="obsidian-embed obsidian-embed-note"/.test(html), html);

html = resolver.rewriteHtml('![[ghost-note]]', byKey, '/notes/x/');
assert('missing note embed → broken alert', /obsidian-embed-broken/.test(html), html);

// ---- Tags ----------------------------------------------------------------
console.log('Inline tags:');
html = resolver.rewriteHtml('Tagged with #obsidian and #fixture/example.', byKey, '/notes/x/');
assert('inline tag → <a class="obsidian-tag">', /class="obsidian-tag">#obsidian</.test(html) && /class="obsidian-tag">#fixture\/example</.test(html), html);

html = resolver.rewriteHtml('Heading marker # not a tag', byKey, '/notes/x/');
assert('hash followed by space is NOT a tag', !/class="obsidian-tag"/.test(html), html);

// ---- Callout DOM rewriting ----------------------------------------------
console.log('Callouts (DOM-level):');
const root = shim.document.createElement('main');
const bq = shim.document.createElement('blockquote');
const p = shim.document.createElement('p');
p.appendChild(new shim.TextNode('[!warning]+ Heads up\nthe building is on fire'));
bq.appendChild(p);
root.appendChild(bq);

const calloutCount = resolver.rewriteCallouts(root);
assert('rewriteCallouts returns 1 for one matching blockquote', calloutCount === 1, 'count=' + calloutCount);

const html2 = shim.serialize(root);
assert('callout wraps in alert-warning', /alert alert-warning obsidian-callout obsidian-callout-warning/.test(html2), html2);
assert('callout title text preserved', /Heads up/.test(html2), html2);
assert('callout body retains content', /the building is on fire/.test(html2), html2);
assert('callout has role="alert"', /role="alert"/.test(html2), html2);

// Non-matching blockquote stays a blockquote
const root2 = shim.document.createElement('main');
const bq2 = shim.document.createElement('blockquote');
const p2 = shim.document.createElement('p');
p2.appendChild(new shim.TextNode('Just a regular quotation, not a callout.'));
bq2.appendChild(p2);
root2.appendChild(bq2);
resolver.rewriteCallouts(root2);
assert('non-callout blockquote untouched', /<blockquote/.test(shim.serialize(root2)), shim.serialize(root2));

// ---- Result --------------------------------------------------------------
console.log('');
if (failures.length === 0) {
  console.log('All resolver assertions passed.');
  process.exit(0);
}
console.log(failures.length + ' assertion(s) failed:');
failures.forEach((f) => console.log('  - ' + f));
process.exit(1);
