/*
 * ===================================================================
 * page-feedback.js — "Improve this page" capture widget
 * ===================================================================
 *
 * File:    assets/js/page-feedback.js
 * Path:    assets/js/page-feedback.js
 * Purpose: Assemble a well-formed GitHub issue at RUNTIME from a request
 *          type + a description + live page context + captured console
 *          logs, then either open a pre-filled github.com form (base layer,
 *          no token) or file it through the chat proxy (proxy mode), with
 *          an optional AI clarify/vet/prioritize step in between.
 *
 * Reads three JSON blocks injected by _includes/components/page-feedback.html:
 *   #pageFeedbackConfig  — mode, endpoints, repo, labels, assignee, ai flags
 *   #pageFeedbackTypes   — the request-type taxonomy (_data/feedback_types.yml)
 *   #pageFeedbackContext — build-time page/front-matter context
 *
 * Console/error logs come from _includes/core/console-capture.html
 * (window.__zer0Feedback), captured since page load.
 *
 * Robustness notes:
 *   - Every value is injected as JSON (not URL-encoded into an href), so the
 *     old three-encoder escaping bugs are gone.
 *   - GitHub silently drops labels that don't exist, so the taxonomy maps to
 *     labels that do (see _data/feedback_types.yml).
 *   - Pre-filled issue URLs have a practical length ceiling; buildPrefillUrl()
 *     trims low-priority sections and falls back to the clipboard so nothing
 *     is silently lost.
 * ===================================================================
 */
(function () {
  "use strict";

  // Pre-filled github.com/issues/new URLs get unreliable past ~8k chars
  // (browser + GitHub limits). Stay comfortably under it and trim to fit.
  var MAX_URL_LENGTH = 7000;

  function readJSON(id, fallback) {
    var el = document.getElementById(id);
    if (!el) return fallback;
    try {
      return JSON.parse(el.textContent);
    } catch (err) {
      return fallback;
    }
  }

  var CONFIG = readJSON("pageFeedbackConfig", null);
  if (!CONFIG || !CONFIG.enabled) return;
  var TYPES = readJSON("pageFeedbackTypes", []) || [];
  var CONTEXT = readJSON("pageFeedbackContext", {}) || {};

  var modal = document.getElementById("pageFeedbackModal");
  if (!modal) return;

  // --- element refs -----------------------------------------------------
  var els = {
    dialog: modal.querySelector(".pf-dialog"),
    form: document.getElementById("pfForm"),
    close: document.getElementById("pfClose"),
    cancel: document.getElementById("pfCancel"),
    submit: document.getElementById("pfSubmit"),
    submitLabel: modal.querySelector(".pf-submit-label"),
    description: document.getElementById("pfDescription"),
    types: Array.prototype.slice.call(modal.querySelectorAll(".pf-type")),
    contextList: document.getElementById("pfContextList"),
    contextCount: document.getElementById("pfContextCount"),
    logsWrap: document.getElementById("pfLogsWrap"),
    includeLogs: document.getElementById("pfIncludeLogs"),
    logsCount: document.getElementById("pfLogsCount"),
    logsPreview: document.getElementById("pfLogsPreview"),
    copy: document.getElementById("pfCopy"),
    status: document.getElementById("pfStatus"),
    analyze: document.getElementById("pfAnalyze"),
    aiResult: document.getElementById("pfAiResult")
  };

  var state = {
    open: false,
    typeId: null,
    analysis: null,       // AI enrichment result, when applied
    logs: [],             // snapshot taken when the modal opens
    lastFocus: null
  };

  function typeById(id) {
    for (var i = 0; i < TYPES.length; i++) {
      if (TYPES[i].id === id) return TYPES[i];
    }
    return null;
  }

  // --- runtime context (captured fresh each open) -----------------------
  function runtimeContext() {
    var mm = window.matchMedia;
    return {
      href: location.href,
      referrer: document.referrer || "",
      userAgent: navigator.userAgent || "",
      language: navigator.language || "",
      viewport: window.innerWidth + "×" + window.innerHeight,
      dpr: window.devicePixelRatio || 1,
      colorScheme: mm && mm("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      reducedMotion: !!(mm && mm("(prefers-reduced-motion: reduce)").matches),
      time: new Date().toISOString()
    };
  }

  function snapshotLogs() {
    var store = window.__zer0Feedback;
    if (!store || typeof store.snapshot !== "function") return [];
    try { return store.snapshot(); } catch (err) { return []; }
  }

  function formatLogs(logs) {
    return logs.map(function (entry) {
      var level = String(entry.level || "log").toUpperCase();
      return "[" + entry.t + "ms] " + level + " " + entry.text;
    }).join("\n");
  }

  // --- rendering --------------------------------------------------------
  function renderContext() {
    var rt = runtimeContext();
    var rows = [
      ["Page", CONTEXT.title || document.title],
      ["URL", rt.href]
    ];
    if (CONTEXT.sourceUrl) {
      rows.push(["Source", CONTEXT.path || CONTEXT.sourceUrl]);
    }
    els.contextList.innerHTML = "";
    rows.forEach(function (row) {
      var li = document.createElement("li");
      var k = document.createElement("span");
      k.className = "pf-context-key";
      k.textContent = row[0];
      var v = document.createElement("span");
      v.className = "pf-context-val";
      v.textContent = row[1];
      li.appendChild(k);
      li.appendChild(v);
      els.contextList.appendChild(li);
    });

    // Logs
    state.logs = CONFIG.captureLogs ? snapshotLogs() : [];
    var count = state.logs.length;
    if (els.logsWrap) {
      if (count > 0) {
        els.logsWrap.hidden = false;
        if (els.logsCount) els.logsCount.textContent = String(count);
        if (els.logsPreview) els.logsPreview.textContent = formatLogs(state.logs);
      } else {
        els.logsWrap.hidden = true;
      }
    }

    var attached = rows.length + (count > 0 && els.includeLogs && els.includeLogs.checked ? 1 : 0);
    if (els.contextCount) els.contextCount.textContent = "(" + attached + ")";
  }

  function setType(id) {
    state.typeId = id;
    var type = typeById(id);
    els.types.forEach(function (btn) {
      var active = btn.getAttribute("data-pf-type-id") === id;
      btn.setAttribute("aria-checked", active ? "true" : "false");
      btn.tabIndex = active ? 0 : -1;
      btn.classList.toggle("pf-type--active", active);
    });
    if (type && type.placeholder && els.description) {
      els.description.placeholder = type.placeholder;
    }
    if (els.submitLabel) {
      var agently = type && type.agent && CONFIG.assignee;
      els.submitLabel.textContent = submitVerb();
      if (agently) {
        els.submit.title = "Files the issue and assigns @" + CONFIG.assignee;
      } else {
        els.submit.removeAttribute("title");
      }
    }
    updateValidity();
  }

  function submitVerb() {
    return CONFIG.mode === "proxy" ? "File issue" : "Open GitHub issue";
  }

  function updateValidity() {
    var ok = !!state.typeId && els.description && els.description.value.trim().length > 0;
    els.submit.disabled = !ok;
    return ok;
  }

  // --- issue assembly ---------------------------------------------------
  // Escape a value for a Markdown table cell. Backslashes MUST be escaped first,
  // otherwise escaping "|" -> "\|" would be re-processed and corrupted.
  function cell(value) {
    return String(value == null ? "" : value)
      .replace(/\\/g, "\\\\")   // backslash first
      .replace(/\|/g, "\\|")    // then the cell separator
      .replace(/\r?\n/g, " ");  // collapse newlines so the row stays intact
  }

  function dedupe(list) {
    var seen = {};
    var out = [];
    (list || []).forEach(function (item) {
      if (item && !seen[item]) { seen[item] = true; out.push(item); }
    });
    return out;
  }

  function issueLabels(type) {
    var labels = (CONFIG.defaultLabels || []).concat(type && type.labels ? type.labels : []);
    if (state.analysis && state.analysis.labels) labels = labels.concat(state.analysis.labels);
    if (state.analysis && state.analysis.priority) labels.push("priority:" + state.analysis.priority);
    return dedupe(labels);
  }

  // Build the issue body in named sections so the URL guard can drop the
  // low-priority ones (logs, then agent directive) without losing the core.
  function buildSections(type, opts) {
    var rt = runtimeContext();
    var includeLogs = opts.includeLogs && state.logs.length > 0;
    var sections = {};

    sections.description = els.description.value.trim();

    if (state.analysis) {
      var a = state.analysis;
      var ai = ["## 🤖 AI review", ""];
      if (a.summary) ai.push(a.summary, "");
      var meta = [];
      if (a.priority) meta.push("**Priority:** " + a.priority);
      if (a.severity) meta.push("**Severity:** " + a.severity);
      if (meta.length) ai.push(meta.join(" · "), "");
      if (a.recommendation) ai.push("**Recommended approach:** " + a.recommendation, "");
      sections.ai = ai.join("\n");
    }

    sections.context = [
      "## 📄 Page context", "",
      "| Field | Value |", "|---|---|",
      "| **Page** | " + cell(CONTEXT.title) + " |",
      "| **URL** | " + cell(rt.href) + " |",
      CONTEXT.sourceUrl ? "| **Source** | [`" + cell(CONTEXT.path) + "`](" + CONTEXT.sourceUrl + ") |" : "",
      CONTEXT.layout ? "| **Layout** | `" + cell(CONTEXT.layout) + "` |" : "",
      CONTEXT.collection ? "| **Collection** | `" + cell(CONTEXT.collection) + "` |" : ""
    ].filter(Boolean).join("\n");

    sections.environment = [
      "## 🔧 Environment", "",
      "| Field | Value |", "|---|---|",
      "| **Browser** | " + cell(rt.userAgent) + " |",
      "| **Viewport** | " + cell(rt.viewport) + " @ " + rt.dpr + "x |",
      "| **Color scheme** | " + cell(rt.colorScheme) + (rt.reducedMotion ? " · reduced-motion" : "") + " |",
      rt.referrer ? "| **Referrer** | " + cell(rt.referrer) + " |" : "",
      "| **Repository** | `" + cell(CONTEXT.repository) + "` |",
      "| **Branch** | `" + cell(CONTEXT.branch) + "` |",
      "| **Jekyll env** | `" + cell(CONTEXT.jekyllEnv) + "` |",
      "| **Captured** | " + cell(rt.time) + " |"
    ].filter(Boolean).join("\n");

    if (includeLogs) {
      sections.logs = [
        "<details>",
        "<summary>🧾 Console &amp; error logs (" + state.logs.length + ")</summary>",
        "", "```text", formatLogs(state.logs), "```", "",
        "</details>"
      ].join("\n");
    }

    if (type && type.agent && type.directive) {
      sections.directive = [
        "<details>",
        "<summary>🤖 AI agent instructions</summary>",
        "", type.directive, "",
        "</details>"
      ].join("\n");
    }

    sections.footer = "---\n_Filed from " + rt.href + " via the page-feedback widget._";
    return sections;
  }

  function assemble(sections, order) {
    return order
      .map(function (key) { return sections[key]; })
      .filter(function (part) { return part && part.length; })
      .join("\n\n");
  }

  function buildIssue(opts) {
    opts = opts || {};
    var type = typeById(state.typeId);
    var includeLogs = els.includeLogs ? els.includeLogs.checked : false;
    var sections = buildSections(type, { includeLogs: opts.includeLogs !== false && includeLogs });

    var titleBase = state.analysis && state.analysis.title
      ? state.analysis.title
      : (type ? "[" + type.label + "] " : "") + (CONTEXT.title || document.title);

    var fullOrder = ["description", "ai", "context", "environment", "logs", "directive", "footer"];
    var assignees = type && type.agent && CONFIG.assignee ? [CONFIG.assignee] : [];

    return {
      title: titleBase.slice(0, 240),
      body: assemble(sections, fullOrder),
      labels: issueLabels(type),
      assignees: assignees,
      sections: sections,
      order: fullOrder
    };
  }

  // Assemble a prefill URL under the length budget, trimming logs then the
  // agent directive then the environment table. Reports what was dropped so
  // the caller can offer the full body via the clipboard.
  function buildPrefillUrl(issue) {
    var base = "https://github.com/" + CONFIG.repository + "/issues/new";

    function compose(order) {
      var params = new URLSearchParams();
      params.set("title", issue.title);
      params.set("body", assemble(issue.sections, order));
      if (issue.labels.length) params.set("labels", issue.labels.join(","));
      if (issue.assignees.length) params.set("assignees", issue.assignees.join(","));
      return base + "?" + params.toString();
    }

    var trimSteps = [
      { order: ["description", "ai", "context", "environment", "logs", "directive", "footer"], dropped: [] },
      { order: ["description", "ai", "context", "environment", "directive", "footer"], dropped: ["logs"] },
      { order: ["description", "ai", "context", "environment", "footer"], dropped: ["logs", "directive"] },
      { order: ["description", "ai", "context", "footer"], dropped: ["logs", "directive", "environment"] }
    ];

    for (var i = 0; i < trimSteps.length; i++) {
      var url = compose(trimSteps[i].order);
      if (url.length <= MAX_URL_LENGTH || i === trimSteps.length - 1) {
        return { url: url, dropped: trimSteps[i].dropped, overLimit: url.length > MAX_URL_LENGTH };
      }
    }
  }

  // --- clipboard --------------------------------------------------------
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        resolve();
      } catch (err) { reject(err); }
    });
  }

  function setStatus(message, kind) {
    if (!els.status) return;
    els.status.textContent = message || "";
    els.status.className = "pf-status" + (kind ? " pf-status--" + kind : "");
  }

  // --- submit -----------------------------------------------------------
  function submitViaUrl(issue) {
    var built = buildPrefillUrl(issue);
    // Open WITHOUT the "noopener" feature so we get a real window reference to
    // detect pop-up blocking, then sever the opener link ourselves.
    var win = window.open(built.url, "_blank");
    if (win) { try { win.opener = null; } catch (err) { /* cross-origin */ } }

    if (!win) {
      copyText(issue.body).then(function () {
        setStatus("Your browser blocked the pop-up. The full report is on your clipboard — open a new issue and paste it in.", "warn");
      })["catch"](function () {
        setStatus("Your browser blocked the pop-up. Allow pop-ups for this site and try again.", "warn");
      });
      return;
    }
    if (built.dropped.length) {
      // Something was too long for the URL — hand the full body to the clipboard.
      copyText(issue.body).then(function () {
        setStatus("Opened GitHub. The " + built.dropped.join(" and ") +
          " section(s) were too long for the URL, so the full report is on your clipboard — paste it in.", "warn");
      })["catch"](function () {
        setStatus("Opened GitHub. Some sections were trimmed to fit the URL.", "warn");
      });
      return;
    }
    setStatus("Opened a pre-filled GitHub issue in a new tab. ✓", "ok");
    window.setTimeout(close, 1200);
  }

  function submitViaProxy(issue) {
    setStatus("Filing the issue…", "pending");
    els.submit.disabled = true;
    fetch(CONFIG.issueEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: issue.title, body: issue.body, labels: issue.labels })
    }).then(function (res) {
      return res.json().then(function (data) { return { ok: res.ok, data: data }; });
    }).then(function (r) {
      if (!r.ok) throw new Error((r.data && r.data.error && r.data.error.message) || "Proxy returned an error");
      var url = r.data && r.data.url;
      els.status.innerHTML = "";
      setStatus("", "ok");
      if (url) {
        els.status.innerHTML = 'Filed <a href="' + url + '" target="_blank" rel="noopener">issue #' +
          (r.data.number || "") + "</a> ✓";
      } else {
        setStatus("Issue filed. ✓", "ok");
      }
    })["catch"](function (err) {
      // Fall back to the always-works prefill path.
      setStatus("Couldn't file directly (" + err.message + ") — opening a pre-filled form instead…", "warn");
      submitViaUrl(issue);
    }).then(function () {
      els.submit.disabled = false;
    });
  }

  function onSubmit(event) {
    if (event) event.preventDefault();
    if (!updateValidity()) {
      setStatus("Pick a feedback type and add a short description first.", "warn");
      return;
    }
    var issue = buildIssue();
    if (CONFIG.mode === "proxy" && CONFIG.issueEndpoint) {
      submitViaProxy(issue);
    } else {
      submitViaUrl(issue);
    }
  }

  // --- AI enrichment ----------------------------------------------------
  function analyze() {
    if (!CONFIG.ai || !CONFIG.ai.available) return;
    if (!state.typeId || !els.description.value.trim()) {
      setStatus("Pick a type and describe the issue before analyzing.", "warn");
      return;
    }
    var type = typeById(state.typeId);
    var includeLogs = els.includeLogs ? els.includeLogs.checked : false;
    var payload = {
      type: { id: type.id, label: type.label, scope: type.scope, agent: !!type.agent, labels: type.labels || [] },
      description: els.description.value.trim(),
      page: {
        title: CONTEXT.title, url: location.href, path: CONTEXT.path,
        sourceUrl: CONTEXT.sourceUrl, layout: CONTEXT.layout,
        collection: CONTEXT.collection, repository: CONTEXT.repository, branch: CONTEXT.branch
      },
      environment: runtimeContext(),
      logs: includeLogs ? formatLogs(state.logs) : "",
      availableLabels: dedupe((CONFIG.defaultLabels || []).concat(collectAllLabels())),
      model: CONFIG.ai.model,
      maxTokens: CONFIG.ai.maxTokens
    };

    els.analyze.disabled = true;
    els.aiResult.hidden = false;
    els.aiResult.innerHTML = '<span class="pf-ai-spinner" aria-hidden="true"></span> Analyzing with Claude…';
    setStatus("", "");

    fetch(CONFIG.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().then(function (data) { return { ok: res.ok, data: data }; });
    }).then(function (r) {
      if (!r.ok) throw new Error((r.data && r.data.error && r.data.error.message) || "Analysis failed");
      renderAnalysis(r.data);
    })["catch"](function (err) {
      els.aiResult.innerHTML = '<span class="pf-ai-error">AI analysis unavailable (' +
        escapeHtml(err.message) + "). You can still file the issue below.</span>";
    }).then(function () {
      els.analyze.disabled = false;
    });
  }

  function collectAllLabels() {
    var all = [];
    TYPES.forEach(function (t) { if (t.labels) all = all.concat(t.labels); });
    ["priority:P0", "priority:P1", "priority:P2", "priority:P3"].forEach(function (p) { all.push(p); });
    return all;
  }

  function renderAnalysis(data) {
    state.analysis = {
      title: data.title || null,
      summary: data.summary || "",
      severity: data.severity || "",
      priority: data.priority || "",
      labels: Array.isArray(data.labels) ? data.labels : [],
      recommendation: data.recommendation || "",
      questions: Array.isArray(data.questions) ? data.questions : []
    };

    var html = ['<div class="pf-ai-card">'];
    if (state.analysis.priority || state.analysis.severity) {
      html.push('<p class="pf-ai-badges">');
      if (state.analysis.priority) html.push('<span class="badge bg-danger-subtle text-danger-emphasis">' + escapeHtml(state.analysis.priority) + "</span> ");
      if (state.analysis.severity) html.push('<span class="badge bg-secondary-subtle text-secondary-emphasis">' + escapeHtml(state.analysis.severity) + "</span>");
      html.push("</p>");
    }
    if (state.analysis.summary) html.push("<p>" + escapeHtml(state.analysis.summary) + "</p>");
    if (state.analysis.recommendation) {
      html.push('<p class="pf-ai-rec"><strong>Suggested approach:</strong> ' + escapeHtml(state.analysis.recommendation) + "</p>");
    }
    if (state.analysis.labels.length) {
      html.push('<p class="pf-ai-labels">Labels: ');
      state.analysis.labels.forEach(function (l) { html.push('<code>' + escapeHtml(l) + "</code> "); });
      html.push("</p>");
    }
    if (state.analysis.questions.length) {
      html.push('<p class="pf-ai-q-title">A couple of clarifying questions — answer them in your description:</p><ul class="pf-ai-questions">');
      state.analysis.questions.forEach(function (q) { html.push("<li>" + escapeHtml(q) + "</li>"); });
      html.push("</ul>");
    }
    html.push('<p class="pf-ai-note text-muted"><i class="bi bi-check2-circle me-1"></i>Applied to your issue — review and file below.</p>');
    html.push("</div>");
    els.aiResult.innerHTML = html.join("");
    setStatus("AI review applied. Review and file when ready.", "ok");
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = String(text == null ? "" : text);
    return div.innerHTML;
  }

  // --- open / close / focus trap ---------------------------------------
  function focusable() {
    return Array.prototype.slice.call(
      els.dialog.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) {
      // Exclude disabled, hidden, and roving-tabindex(-1) radios so the trap
      // boundaries land on real, reachable controls.
      return !el.disabled && el.offsetParent !== null && el.tabIndex !== -1;
    });
  }

  function onKeydown(event) {
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    if (event.key === "Tab") {
      var items = focusable();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  }

  function open(preselectType) {
    if (state.open) return;
    state.open = true;
    state.lastFocus = document.activeElement;
    modal.hidden = false;
    // reflow before adding the class so the transition runs
    void modal.offsetWidth;
    modal.classList.add("pf-overlay--open");
    document.body.classList.add("pf-no-scroll");
    setStatus("", "");
    if (els.aiResult) { els.aiResult.hidden = true; els.aiResult.innerHTML = ""; }
    state.analysis = null;
    renderContext();

    var type = preselectType || state.typeId;
    if (type && typeById(type)) {
      setType(type);
      if (els.description) els.description.focus();
    } else if (els.types.length) {
      els.types[0].focus();
    }
    document.addEventListener("keydown", onKeydown, true);

    if (CONFIG.ai && CONFIG.ai.available && CONFIG.ai.auto && state.typeId) analyze();
  }

  function close() {
    if (!state.open) return;
    state.open = false;
    modal.classList.remove("pf-overlay--open");
    document.body.classList.remove("pf-no-scroll");
    document.removeEventListener("keydown", onKeydown, true);
    window.setTimeout(function () { modal.hidden = true; }, 180);
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  }

  // --- type keyboard navigation (roving radiogroup) ---------------------
  function onTypeKeydown(event) {
    var idx = els.types.indexOf(event.currentTarget);
    if (idx < 0) return;
    var next = null;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = els.types[idx + 1] || els.types[0];
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = els.types[idx - 1] || els.types[els.types.length - 1];
    else if (event.key === " " || event.key === "Enter") { event.preventDefault(); setType(event.currentTarget.getAttribute("data-pf-type-id")); return; }
    if (next) { event.preventDefault(); next.focus(); setType(next.getAttribute("data-pf-type-id")); }
  }

  // --- wire up ----------------------------------------------------------
  els.types.forEach(function (btn) {
    btn.addEventListener("click", function () { setType(btn.getAttribute("data-pf-type-id")); });
    btn.addEventListener("keydown", onTypeKeydown);
  });
  if (els.description) els.description.addEventListener("input", function () { updateValidity(); renderContextCount(); });
  if (els.includeLogs) els.includeLogs.addEventListener("change", renderContextCount);
  if (els.form) els.form.addEventListener("submit", onSubmit);
  if (els.close) els.close.addEventListener("click", close);
  if (els.cancel) els.cancel.addEventListener("click", close);
  if (els.analyze) els.analyze.addEventListener("click", analyze);
  if (els.copy) els.copy.addEventListener("click", function () {
    if (!state.typeId) { setStatus("Pick a feedback type first.", "warn"); return; }
    copyText(buildIssue().body).then(function () { setStatus("Full report copied to your clipboard. ✓", "ok"); })
      ["catch"](function () { setStatus("Couldn't access the clipboard.", "warn"); });
  });
  // Close when the backdrop (outside the dialog) is clicked.
  modal.addEventListener("mousedown", function (event) {
    if (event.target === modal) close();
  });

  function renderContextCount() {
    var base = CONTEXT.sourceUrl ? 3 : 2;
    var withLogs = state.logs.length > 0 && els.includeLogs && els.includeLogs.checked ? 1 : 0;
    if (els.contextCount) els.contextCount.textContent = "(" + (base + withLogs) + ")";
  }

  // Any [data-pf-open] element opens the modal; data-pf-type preselects a type.
  document.addEventListener("click", function (event) {
    var trigger = event.target.closest ? event.target.closest("[data-pf-open]") : null;
    if (!trigger) return;
    event.preventDefault();
    open(trigger.getAttribute("data-pf-type") || null);
  });

  // Update the submit verb to match the configured mode.
  if (els.submitLabel) els.submitLabel.textContent = submitVerb();

  // Expose a tiny programmatic hook (used by tests / other scripts).
  window.zer0PageFeedback = { open: open, close: close };
})();
