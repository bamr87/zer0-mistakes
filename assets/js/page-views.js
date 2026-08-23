/*
 * ===================================================================
 * page-views.js — page-view counter (tracking + display)
 * ===================================================================
 *
 * File:    assets/js/page-views.js
 * Purpose: Record a view for the current page and render the count into
 *          every `[data-page-views]` badge on the page.
 *
 * Reads one JSON block injected by _includes/components/page-views-init.html:
 *   #pageViewsConfig — provider, endpoint, privacy gates, labels
 *
 * Providers
 *   local   (default) counts live in this visitor's localStorage. Zero
 *           config, zero network, GitHub-Pages safe — the count is "how
 *           often YOU opened this page", so it is honest without a server.
 *   remote  counts come from an HTTP counter endpoint (the chat-proxy
 *           worker, a self-hosted function, CounterAPI, …). The endpoint
 *           owns the truth; this script only asks for it.
 *
 * Privacy
 *   Do Not Track, Global Privacy Control, and (optionally) the theme's
 *   cookie-consent "analytics" category all suppress RECORDING. Display of
 *   an already-known count is never suppressed — nothing is collected to
 *   show it. When consent is required and later granted, the pending view
 *   is recorded on the `cookieConsentChanged` event.
 *
 * Public API (also what the Playwright spec drives):
 *   window.zer0PageViews.get(path)   -> number | null
 *   window.zer0PageViews.all()       -> { path: count }
 *   window.zer0PageViews.refresh()   -> re-render every badge
 *   window.zer0PageViews.reset()     -> clear the local store
 * Event: `zer0:page-views` on document, detail { path, count, provider }.
 * ===================================================================
 */
(function () {
  "use strict";

  var STORE_KEY = "zer0-page-views";
  var SESSION_KEY = "zer0-page-views-session";
  var STORE_VERSION = 1;

  function readJSON(id, fallback) {
    var el = document.getElementById(id);
    if (!el) return fallback;
    try {
      return JSON.parse(el.textContent);
    } catch (err) {
      return fallback;
    }
  }

  var CONFIG = readJSON("pageViewsConfig", null);
  if (!CONFIG || !CONFIG.enabled) return;

  // --- storage helpers --------------------------------------------------
  // Private-mode Safari and "block all cookies" throw on access, not on use,
  // so every touch is wrapped: the widget degrades to "no count" rather than
  // taking the page down with it.
  function safeStorage(kind) {
    try {
      var s = window[kind];
      var probe = "__zer0_probe__";
      s.setItem(probe, "1");
      s.removeItem(probe);
      return s;
    } catch (err) {
      return null;
    }
  }

  var local = safeStorage("localStorage");
  var session = safeStorage("sessionStorage");

  function readStore() {
    if (!local) return { v: STORE_VERSION, paths: {} };
    try {
      var raw = JSON.parse(local.getItem(STORE_KEY));
      if (raw && raw.paths && typeof raw.paths === "object") return raw;
    } catch (err) {
      /* corrupt payload — start clean rather than throwing */
    }
    return { v: STORE_VERSION, paths: {} };
  }

  function writeStore(store) {
    if (!local) return;
    try {
      local.setItem(STORE_KEY, JSON.stringify(store));
    } catch (err) {
      /* quota exceeded — the count is a nicety, never a hard failure */
    }
  }

  // Keep the store bounded: evict the least-recently-viewed paths first.
  function prune(store) {
    var max = CONFIG.maxEntries > 0 ? CONFIG.maxEntries : 500;
    var keys = Object.keys(store.paths);
    if (keys.length <= max) return store;
    keys
      .sort(function (a, b) {
        return (store.paths[a].t || 0) - (store.paths[b].t || 0);
      })
      .slice(0, keys.length - max)
      .forEach(function (key) {
        delete store.paths[key];
      });
    return store;
  }

  // --- paths ------------------------------------------------------------
  // Badges carry site-relative, baseurl-free paths (page.url), so the
  // runtime location has to be normalized the same way or a project-pages
  // site would count "/repo/foo/" separately from "/foo/".
  function normalizePath(input) {
    var path = input;
    try {
      path = new URL(input, window.location.href).pathname;
    } catch (err) {
      /* already a bare path */
    }
    var base = CONFIG.baseurl || "";
    if (base && path.indexOf(base) === 0) path = path.slice(base.length);
    path = path.replace(/index\.html?$/, "");
    if (path.charAt(0) !== "/") path = "/" + path;
    if (path.charAt(path.length - 1) !== "/" && !/\.[a-z0-9]+$/i.test(path)) path += "/";
    return path;
  }

  var CURRENT = normalizePath(window.location.pathname);

  // --- privacy gates ----------------------------------------------------
  function dntEnabled() {
    if (!CONFIG.respectDnt) return false;
    var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    return dnt === "1" || dnt === "yes";
  }

  function gpcEnabled() {
    return !!CONFIG.respectGpc && navigator.globalPrivacyControl === true;
  }

  function analyticsConsented() {
    if (window.cookieConsent && typeof window.cookieConsent.analytics === "boolean") {
      return window.cookieConsent.analytics;
    }
    if (!local) return false;
    try {
      var stored = JSON.parse(local.getItem("zer0-cookie-consent"));
      return !!(stored && stored.analytics);
    } catch (err) {
      return false;
    }
  }

  function mayRecord() {
    if (!CONFIG.track) return false;
    if (dntEnabled() || gpcEnabled()) return false;
    if (CONFIG.requireConsent && !analyticsConsented()) return false;
    return true;
  }

  // One view per path per browser session, so a reload or a back-navigation
  // does not inflate the number. `dedupe: "never"` counts every load.
  function alreadyCountedThisSession(path) {
    if (CONFIG.dedupe !== "session" || !session) return false;
    try {
      var seen = JSON.parse(session.getItem(SESSION_KEY)) || [];
      return seen.indexOf(path) !== -1;
    } catch (err) {
      return false;
    }
  }

  function markCountedThisSession(path) {
    if (CONFIG.dedupe !== "session" || !session) return;
    try {
      var seen = JSON.parse(session.getItem(SESSION_KEY)) || [];
      if (seen.indexOf(path) === -1) seen.push(path);
      session.setItem(SESSION_KEY, JSON.stringify(seen));
    } catch (err) {
      /* non-fatal */
    }
  }

  // --- counts -----------------------------------------------------------
  var counts = {};

  function seedFromLocalStore() {
    var store = readStore();
    Object.keys(store.paths).forEach(function (path) {
      var entry = store.paths[path];
      if (entry && typeof entry.c === "number") counts[path] = entry.c;
    });
  }

  function recordLocal(path) {
    var store = readStore();
    var entry = store.paths[path] || { c: 0, t: 0 };
    entry.c += 1;
    entry.t = Date.now();
    store.paths[path] = entry;
    writeStore(prune(store));
    return entry.c;
  }

  // Pull a count out of an arbitrary JSON body, e.g. countKey "data.views".
  function pluck(payload, key) {
    var value = payload;
    var parts = String(key || "views").split(".");
    for (var i = 0; i < parts.length; i++) {
      if (value === null || typeof value !== "object") return null;
      value = value[parts[i]];
    }
    return typeof value === "number" && isFinite(value) ? value : null;
  }

  function remoteUrl(path) {
    var endpoint = CONFIG.endpoint || "";
    if (endpoint.indexOf("{path}") !== -1) {
      return endpoint.replace("{path}", encodeURIComponent(path));
    }
    return endpoint + (endpoint.indexOf("?") === -1 ? "?" : "&") + "path=" + encodeURIComponent(path);
  }

  function recordRemote(path, record) {
    var method = record ? CONFIG.method || "POST" : "GET";
    var init = { method: method, credentials: "omit", mode: "cors" };
    if (method !== "GET" && method !== "HEAD") {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify({ path: path });
    }
    return fetch(remoteUrl(path), init)
      .then(function (res) {
        if (!res.ok) throw new Error("page-views: endpoint returned " + res.status);
        return res.json();
      })
      .then(function (payload) {
        var count = pluck(payload, CONFIG.countKey);
        if (count === null) throw new Error("page-views: no count at '" + CONFIG.countKey + "'");
        return count;
      });
  }

  // --- rendering --------------------------------------------------------
  var formatter = null;
  try {
    formatter = new Intl.NumberFormat();
  } catch (err) {
    formatter = null;
  }

  function format(count) {
    return formatter ? formatter.format(count) : String(count);
  }

  function render() {
    var badges = document.querySelectorAll("[data-page-views]");
    Array.prototype.forEach.call(badges, function (badge) {
      var path = normalizePath(badge.getAttribute("data-page-views") || CURRENT);
      var count = counts[path];
      if (typeof count !== "number") return; // unknown → stays hidden, no "0 views" flash
      var countEl = badge.querySelector("[data-page-views-count]");
      var labelEl = badge.querySelector("[data-page-views-label]");
      if (countEl) countEl.textContent = format(count);
      if (labelEl) labelEl.textContent = count === 1 ? CONFIG.labelOne : CONFIG.labelOther;
      badge.removeAttribute("hidden");
    });
  }

  function publish(path, count) {
    counts[path] = count;
    render();
    document.dispatchEvent(
      new CustomEvent("zer0:page-views", {
        detail: { path: path, count: count, provider: CONFIG.provider }
      })
    );
  }

  // --- orchestration ----------------------------------------------------
  var recorded = false;

  function recordCurrentView() {
    if (recorded || !mayRecord()) return;
    if (alreadyCountedThisSession(CURRENT)) return;
    recorded = true;
    markCountedThisSession(CURRENT);

    if (CONFIG.provider === "remote") {
      recordRemote(CURRENT, true)
        .then(function (count) {
          publish(CURRENT, count);
        })
        .catch(function (err) {
          if (CONFIG.fallbackLocal) publish(CURRENT, recordLocal(CURRENT));
          if (window.console && console.debug) console.debug(String(err));
        });
      return;
    }
    publish(CURRENT, recordLocal(CURRENT));
  }

  function readOnlyRemote() {
    // Recording is blocked (DNT/GPC/consent) but a remote count is public
    // information — show it without contributing to it.
    recordRemote(CURRENT, false)
      .then(function (count) {
        publish(CURRENT, count);
      })
      .catch(function () {
        /* endpoint unavailable — badges stay hidden */
      });
  }

  function start() {
    if (CONFIG.provider !== "remote") seedFromLocalStore();
    render();

    if (mayRecord()) {
      recordCurrentView();
    } else if (CONFIG.provider === "remote") {
      readOnlyRemote();
    }

    // Consent can arrive after load — record the pending view when it does.
    if (CONFIG.requireConsent) {
      document.addEventListener("cookieConsentChanged", function () {
        recordCurrentView();
      });
    }
  }

  window.zer0PageViews = {
    get: function (path) {
      var count = counts[normalizePath(path || CURRENT)];
      return typeof count === "number" ? count : null;
    },
    all: function () {
      var copy = {};
      Object.keys(counts).forEach(function (path) {
        copy[path] = counts[path];
      });
      return copy;
    },
    refresh: render,
    reset: function () {
      counts = {};
      if (local) {
        try {
          local.removeItem(STORE_KEY);
        } catch (err) {
          /* non-fatal */
        }
      }
      if (session) {
        try {
          session.removeItem(SESSION_KEY);
        } catch (err) {
          /* non-fatal */
        }
      }
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
