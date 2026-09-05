// Feature: ZER0-013
/*
 * ===================================================================
 * mermaid-diagrams.js — Mermaid diagram figures (render + chrome)
 * ===================================================================
 *
 * File:    assets/js/mermaid-diagrams.js
 * Purpose: Turn every ```mermaid fence (and legacy <div class="mermaid">)
 *          into an accessible <figure> with a rendered SVG, a toolbar
 *          (zoom, fullscreen, copy source, download SVG), a caption taken
 *          from the diagram's accTitle / title, and a graceful error state
 *          that keeps the diagram source on the page instead of losing it.
 *
 * Loaded by _includes/components/mermaid.html — only on pages that opt in
 * with `mermaid: true` — after the vendored mermaid.min.js. Both scripts
 * are `defer`, so this runs once the DOM is parsed but BEFORE
 * DOMContentLoaded: fences are converted before code-copy.js decorates
 * <pre> blocks, so a diagram never gets a copy button and a line gutter.
 *
 * Reads one JSON block injected by the include:
 *   #mermaidConfig — securityLevel, toolbar/fullscreen/download flags, labels
 *
 * Theming
 *   No colour is hard-coded. The palette is derived from the live design
 *   tokens (--zer0-color-*, --bs-*) every time a diagram is rendered, so
 *   diagrams follow the active colour mode (light / dark / wizard), the
 *   selected skin, and any `theme_color` or Appearance-panel override — and
 *   re-render when any of those change. "Dark mode" is decided by the page
 *   background's luminance, not by the name of an attribute value, so a
 *   dark skin on a light mode still gets legible ink.
 *
 * Re-rendering
 *   Mermaid marks a node `data-processed` and replaces its text with the
 *   SVG, so the source is gone after the first render. Every source is kept
 *   here (WeakMap keyed by figure) and each render goes through
 *   mermaid.render(), so a theme switch re-renders from the original text.
 *
 * Public API (also what the Playwright spec drives):
 *   window.zer0Mermaid.renderAll(root?)  -> Promise<figure[]>  convert + render fences under root
 *   window.zer0Mermaid.render(el, src?)  -> Promise<figure>    render one element (or replace it with src)
 *   window.zer0Mermaid.refresh()         -> Promise<figure[]>  re-derive the palette, re-render every figure
 *   window.zer0Mermaid.getSource(figure) -> string | null
 *   window.zer0Mermaid.palette()         -> { dark, vars }     the derived Mermaid themeVariables
 *   window.zer0Mermaid.figures()         -> figure[]
 * Events
 *   `zer0:diagram-rendered` on each figure (bubbles): { ok, type, error }
 *   `zer0:diagrams-ready`   on document after a renderAll/refresh: { count, failed }
 * ===================================================================
 */
(function () {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") return;

  // ---------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------
  function readJSON(id, fallback) {
    var el = document.getElementById(id);
    if (!el) return fallback;
    try {
      return JSON.parse(el.textContent);
    } catch (err) {
      return fallback;
    }
  }

  var CONFIG = readJSON("mermaidConfig", null) || {};
  var LABELS = Object.assign(
    {
      diagram: "Diagram",
      tools: "Diagram tools",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      zoomReset: "Reset zoom",
      fullscreen: "View fullscreen",
      close: "Close fullscreen view",
      copy: "Copy diagram source",
      copied: "Copied",
      copyFailed: "Copy failed",
      download: "Download as SVG",
      errorTitle: "This diagram could not be rendered",
      errorHint: "Check the syntax in the Mermaid Live Editor. The source is shown below so nothing is lost.",
      showSource: "Diagram source",
      loading: "Loading diagram",
    },
    CONFIG.labels || {}
  );

  var SHOW_TOOLBAR = CONFIG.toolbar !== false;
  var ALLOW_FULLSCREEN = CONFIG.fullscreen !== false;
  var ALLOW_DOWNLOAD = CONFIG.download !== false;
  var SECURITY_LEVEL = CONFIG.securityLevel || "strict";
  var SUPPORTS_DIALOG = typeof HTMLDialogElement !== "undefined" &&
    typeof HTMLDialogElement.prototype.showModal === "function";

  var ZOOM_MIN = 0.5;
  var ZOOM_MAX = 4;
  var ZOOM_STEP = 1.25;
  var EPSILON = 0.001;

  // ---------------------------------------------------------------------
  // Diagram-type detection (for accessible names + the figure's data attr)
  // ---------------------------------------------------------------------
  var TYPES = [
    [/^(graph|flowchart)\b/i, "flowchart", "Flowchart"],
    [/^sequenceDiagram\b/i, "sequence", "Sequence diagram"],
    [/^classDiagram\b/i, "class", "Class diagram"],
    [/^stateDiagram\b/i, "state", "State diagram"],
    [/^erDiagram\b/i, "er", "Entity relationship diagram"],
    [/^gantt\b/i, "gantt", "Gantt chart"],
    [/^pie\b/i, "pie", "Pie chart"],
    [/^gitGraph\b/i, "git", "Git graph"],
    [/^journey\b/i, "journey", "User journey"],
    [/^mindmap\b/i, "mindmap", "Mind map"],
    [/^timeline\b/i, "timeline", "Timeline"],
    [/^quadrantChart\b/i, "quadrant", "Quadrant chart"],
    [/^requirementDiagram\b/i, "requirement", "Requirement diagram"],
    [/^C4(Context|Container|Component|Dynamic|Deployment)\b/i, "c4", "C4 diagram"],
    [/^sankey(-beta)?\b/i, "sankey", "Sankey diagram"],
    [/^xychart(-beta)?\b/i, "xychart", "XY chart"],
    [/^block(-beta)?\b/i, "block", "Block diagram"],
    [/^zenuml\b/i, "zenuml", "ZenUML sequence diagram"],
  ];

  function parseMeta(source) {
    var text = String(source || "").replace(/\r\n?/g, "\n").trim();
    var title = null;
    var description = null;

    // Optional YAML front matter (mermaid ≥ 10): `---\ntitle: X\n---`
    var fm = text.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
    if (fm) {
      var t = fm[1].match(/^\s*title\s*:\s*(.+?)\s*$/m);
      if (t) title = t[1].replace(/^["']|["']$/g, "");
    }
    // Accessibility directives win over the front-matter title.
    var acc = text.match(/^\s*accTitle\s*:\s*(.+?)\s*$/m);
    if (acc) title = acc[1];
    var accDescr = text.match(/^\s*accDescr\s*:\s*(.+?)\s*$/m);
    if (accDescr) description = accDescr[1];

    var body = fm ? text.slice(fm[0].length) : text;
    var lines = body.split("\n");
    var first = "";
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line && line.indexOf("%%") !== 0) { first = line; break; }
    }
    var type = "unknown";
    var typeLabel = LABELS.diagram;
    for (var j = 0; j < TYPES.length; j++) {
      if (TYPES[j][0].test(first)) { type = TYPES[j][1]; typeLabel = TYPES[j][2]; break; }
    }
    return { source: text, title: title, description: description, type: type, typeLabel: typeLabel };
  }

  // ---------------------------------------------------------------------
  // Colour helpers — tokens → concrete hex the way the browser resolves them
  // ---------------------------------------------------------------------
  var probeEl = null;
  var canvasCtx = null;

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  function hexToRgb(hex) {
    var m = String(hex).trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!m) return null;
    var h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }

  function rgbToHex(c) {
    var to = function (v) { return ("0" + Math.round(Math.max(0, Math.min(255, v))).toString(16)).slice(-2); };
    return "#" + to(c.r) + to(c.g) + to(c.b);
  }

  // Parse `rgb()` / `rgba()` with either comma or space syntax.
  function parseRgbString(str) {
    var m = String(str).match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)/i);
    if (!m) return null;
    var a = 1;
    if (m[4] !== undefined) a = m[4].slice(-1) === "%" ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: +m[1], g: +m[2], b: +m[3], a: isNaN(a) ? 1 : a };
  }

  // Normalise any CSS colour string (hex, rgb, hsl, color-mix() output,
  // color(srgb …)) to {r,g,b,a}. A 2D canvas is the one API every browser
  // ships that turns any parsable colour into a canonical serialisation.
  function toRgba(color) {
    var direct = parseRgbString(color);
    if (direct) return direct;
    var hex = hexToRgb(color);
    if (hex) { hex.a = 1; return hex; }
    try {
      if (!canvasCtx) canvasCtx = document.createElement("canvas").getContext("2d");
      if (canvasCtx) {
        canvasCtx.fillStyle = "#000000";
        canvasCtx.fillStyle = color;
        var out = canvasCtx.fillStyle;
        var h2 = hexToRgb(out);
        if (h2) { h2.a = 1; return h2; }
        var p2 = parseRgbString(out);
        if (p2) return p2;
      }
    } catch (err) { /* fall through */ }
    return null;
  }

  // Composite a translucent colour over an opaque background.
  function over(c, bg) {
    if (!c) return null;
    var a = c.a === undefined ? 1 : c.a;
    if (a >= 1 || !bg) return { r: c.r, g: c.g, b: c.b };
    return { r: c.r * a + bg.r * (1 - a), g: c.g * a + bg.g * (1 - a), b: c.b * a + bg.b * (1 - a) };
  }

  // Resolve `var(--token, fallback)` exactly as the cascade sees it right now.
  function tokenColor(token, fallback, bgRgb) {
    if (!probeEl) {
      probeEl = document.createElement("span");
      probeEl.setAttribute("aria-hidden", "true");
      probeEl.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;visibility:hidden";
      (document.body || document.documentElement).appendChild(probeEl);
    }
    probeEl.style.color = "";
    probeEl.style.color = "var(" + token + ", " + fallback + ")";
    var resolved = null;
    try { resolved = toRgba(getComputedStyle(probeEl).color); } catch (err) { /* ignore */ }
    if (!resolved) resolved = toRgba(fallback);
    return rgbToHex(over(resolved, bgRgb));
  }

  function mix(hexA, hexB, weightA) {
    var a = hexToRgb(hexA), b = hexToRgb(hexB);
    if (!a || !b) return hexA;
    var w = clamp01(weightA);
    return rgbToHex({ r: a.r * w + b.r * (1 - w), g: a.g * w + b.g * (1 - w), b: a.b * w + b.b * (1 - w) });
  }

  function luminance(hex) {
    var c = hexToRgb(hex);
    if (!c) return 1;
    var lin = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  }

  function rgbToHsl(c) {
    var r = c.r / 255, g = c.g / 255, b = c.b / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: h, s: s, l: l };
  }

  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = l - c / 2;
    var r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return rgbToHex({ r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 });
  }

  // Text colour that reads on a given fill: dark ink above the luminance
  // where black and white contrast equally (~0.18), white below it. A light
  // brand such as the "air" skin's #6fa8dc (L≈0.37) needs dark text — white
  // on it is only 2.5:1.
  function inkOn(fillHex, ink) {
    return luminance(fillHex) > 0.18 ? (luminance(ink) < 0.4 ? ink : "#1b1f22") : "#ffffff";
  }

  function contrastRatio(a, b) {
    var la = luminance(a), lb = luminance(b);
    var hi = Math.max(la, lb), lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  // Nudge `hex` toward `towards` until it reaches `min` contrast against `bg`.
  // Guards palettes where the brand colour is (nearly) the page background —
  // wizard mode paints the body in the brand blue, so blue nodes on a blue
  // page would vanish.
  function ensureContrast(hex, bg, min, towards) {
    var out = hex;
    for (var i = 0; i < 12 && contrastRatio(out, bg) < min; i++) out = mix(towards, out, 0.15);
    return out;
  }

  // A 12-colour categorical series that starts from the brand hue and fans
  // out around the wheel at a saturation/lightness that stays legible on the
  // current background (pie slices, git branches, mindmap branches, x-y plots).
  function buildSeries(primary, accent, dark) {
    var base = rgbToHsl(hexToRgb(primary));
    var acc = rgbToHsl(hexToRgb(accent));
    var L = dark ? 0.62 : 0.44;
    var S = Math.max(0.5, Math.min(0.8, base.s || 0.6));
    var offsets = [0, 150, 60, 210, 300, 30, 180, 270, 90, 240, 330, 120];
    var out = [];
    for (var i = 0; i < offsets.length; i++) out.push(hslToHex(base.h + offsets[i], S, L));
    // The accent hue is series #2 so brand pairs stay together.
    if (acc.s > 0.2) out[1] = hslToHex(acc.h, Math.max(S, Math.min(0.85, acc.s)), L);
    return out;
  }

  // ---------------------------------------------------------------------
  // Palette → Mermaid `base` theme variables
  // ---------------------------------------------------------------------
  function palette() {
    var bgHex = tokenColor("--bs-body-bg", "#ffffff", null);
    var bgRgb = hexToRgb(bgHex);
    var dark = luminance(bgHex) < 0.35;

    var ink = tokenColor("--bs-body-color", dark ? "#dee2e6" : "#212529", bgRgb);
    var inkMuted = tokenColor("--bs-secondary-color", dark ? "#adb5bd" : "#6c757d", bgRgb);
    // The skin mixin writes both --bs-primary and --zer0-color-primary, but a
    // site-level `theme_color.main` re-pins the latter at :root after main.css,
    // so only --bs-primary reliably follows the active skin — it is what the
    // buttons and links the reader sees are painted with.
    var primary = tokenColor("--bs-primary", "var(--zer0-color-primary, #007bff)", bgRgb);
    var accent = tokenColor("--zer0-color-accent", "#ffe484", bgRgb);
    // Keep the brand usable as a border/line colour on this background.
    primary = ensureContrast(primary, bgHex, 2.2, ink);
    accent = ensureContrast(accent, bgHex, 1.6, ink);
    var surface = tokenColor("--zer0-color-bg-elevated", dark ? "#2b3035" : "#f8f9fa", bgRgb);
    var surface2 = tokenColor("--zer0-color-bg-muted", dark ? "#343a40" : "#e9ecef", bgRgb);
    var border = tokenColor("--zer0-color-border", dark ? "#495057" : "#dee2e6", bgRgb);
    var success = tokenColor("--zer0-color-success", "#198754", bgRgb);
    var info = tokenColor("--zer0-color-info", "#0dcaf0", bgRgb);
    var warning = tokenColor("--zer0-color-warning", "#ffc107", bgRgb);
    var danger = tokenColor("--zer0-color-danger", "#dc3545", bgRgb);
    var link = tokenColor("--zer0-color-link", primary, bgRgb);

    var fontFamily = "";
    try { fontFamily = getComputedStyle(document.body).fontFamily; } catch (err) { /* ignore */ }
    if (!fontFamily) fontFamily = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

    // Tints: a colour laid over the page background. Dark mode needs less
    // colour because the ink is light. A pale brand (a light-blue skin) needs
    // MORE of itself before the tint reads as a surface, so the weight grows
    // until the fill separates from the page — that keeps the hue instead of
    // greying it. When the brand IS the page colour (wizard mode) no weight
    // helps, so fall back to nudging toward the ink.
    var tintTo = function (hex, minRatio) {
      var w = dark ? 0.3 : 0.14;
      var out = mix(hex, bgHex, w);
      while (contrastRatio(out, bgHex) < minRatio && w < 0.6) {
        w += 0.06;
        out = mix(hex, bgHex, w);
      }
      return ensureContrast(out, bgHex, minRatio, ink);
    };
    var tint = function (hex) { return tintTo(hex, 1.12); };
    var tintStrong = function (hex) { return ensureContrast(mix(hex, bgHex, dark ? 0.45 : 0.32), bgHex, 1.25, ink); };
    var deepen = function (hex) { return mix(hex, dark ? "#ffffff" : "#000000", dark ? 0.85 : 0.8); };

    var series = buildSeries(primary, accent, dark);
    var accentDeep = deepen(accent);
    var nodeFill = tintTo(primary, 1.15);
    var nodeFill2 = tintTo(accent, 1.15);
    var onPrimary = inkOn(primary, ink);
    var edgeLabelBg = mix(surface, bgHex, 0.6);

    var vars = {
      darkMode: dark,
      background: bgHex,
      fontFamily: fontFamily,
      fontSize: "14px",

      // Core trio (most diagram types derive from these)
      primaryColor: nodeFill,
      primaryTextColor: ink,
      primaryBorderColor: primary,
      secondaryColor: nodeFill2,
      secondaryTextColor: ink,
      secondaryBorderColor: accentDeep,
      tertiaryColor: surface,
      tertiaryTextColor: ink,
      tertiaryBorderColor: border,

      lineColor: inkMuted,
      textColor: ink,
      mainBkg: nodeFill,
      secondBkg: nodeFill2,
      mainContrastColor: ink,
      darkTextColor: ink,
      border1: primary,
      border2: border,
      arrowheadColor: inkMuted,
      labelBackground: edgeLabelBg,
      labelColor: ink,
      titleColor: ink,

      // Flowchart
      nodeBkg: nodeFill,
      nodeBorder: primary,
      nodeTextColor: ink,
      clusterBkg: mix(surface, bgHex, 0.7),
      clusterBorder: border,
      defaultLinkColor: inkMuted,
      edgeLabelBackground: edgeLabelBg,

      // Notes
      noteBkgColor: tintStrong(warning),
      noteTextColor: ink,
      noteBorderColor: deepen(warning),

      // Sequence
      actorBkg: nodeFill,
      actorBorder: primary,
      actorTextColor: ink,
      actorLineColor: inkMuted,
      signalColor: ink,
      signalTextColor: ink,
      labelBoxBkgColor: surface,
      labelBoxBorderColor: border,
      labelTextColor: ink,
      loopTextColor: ink,
      activationBkgColor: tintStrong(primary),
      activationBorderColor: primary,
      sequenceNumberColor: onPrimary,

      // Gantt
      sectionBkgColor: mix(primary, bgHex, dark ? 0.16 : 0.08),
      altSectionBkgColor: bgHex,
      sectionBkgColor2: mix(accent, bgHex, dark ? 0.16 : 0.12),
      excludeBkgColor: surface2,
      taskBorderColor: deepen(primary),
      taskBkgColor: primary,
      taskTextColor: onPrimary,
      taskTextLightColor: onPrimary,
      taskTextDarkColor: ink,
      taskTextOutsideColor: ink,
      taskTextClickableColor: link,
      activeTaskBorderColor: accentDeep,
      activeTaskBkgColor: tintStrong(accent),
      gridColor: border,
      doneTaskBkgColor: surface2,
      doneTaskBorderColor: border,
      critBorderColor: danger,
      critBkgColor: tintStrong(danger),
      todayLineColor: danger,

      // Class / state / ER
      classText: ink,
      transitionColor: inkMuted,
      transitionLabelColor: ink,
      stateLabelColor: ink,
      stateBkg: nodeFill,
      labelBackgroundColor: bgHex,
      compositeBackground: surface,
      altBackground: surface2,
      compositeTitleBackground: tintStrong(primary),
      compositeBorder: border,
      innerEndBackground: primary,
      specialStateColor: ink,
      attributeBackgroundColorOdd: bgHex,
      attributeBackgroundColorEven: surface,

      // Requirement / C4 / errors
      requirementBackground: nodeFill,
      requirementBorderColor: primary,
      requirementTextColor: ink,
      relationColor: inkMuted,
      relationLabelBackground: bgHex,
      relationLabelColor: ink,
      personBorder: primary,
      personBkg: nodeFill,
      errorBkgColor: tintStrong(danger),
      errorTextColor: ink,

      // Pie
      pieTitleTextColor: ink,
      pieSectionTextColor: "#ffffff",
      pieLegendTextColor: ink,
      pieStrokeColor: bgHex,
      pieOuterStrokeColor: border,
      pieOpacity: 0.9,

      // Git graph
      commitLabelColor: ink,
      commitLabelBackground: surface2,
      tagLabelColor: ink,
      tagLabelBackground: tintStrong(accent),
      tagLabelBorder: accentDeep,

      // Quadrant
      quadrant1Fill: tint(series[0]),
      quadrant2Fill: tint(series[1]),
      quadrant3Fill: tint(series[2]),
      quadrant4Fill: tint(series[3]),
      quadrant1TextFill: ink,
      quadrant2TextFill: ink,
      quadrant3TextFill: ink,
      quadrant4TextFill: ink,
      quadrantPointFill: primary,
      quadrantPointTextFill: ink,
      quadrantXAxisTextFill: ink,
      quadrantYAxisTextFill: ink,
      quadrantInternalBorderStrokeFill: border,
      quadrantExternalBorderStrokeFill: border,
      quadrantTitleFill: ink,

      // XY chart
      xyChart: {
        backgroundColor: bgHex,
        titleColor: ink,
        xAxisLabelColor: ink,
        xAxisTitleColor: ink,
        xAxisTickColor: inkMuted,
        xAxisLineColor: border,
        yAxisLabelColor: ink,
        yAxisTitleColor: ink,
        yAxisTickColor: inkMuted,
        yAxisLineColor: border,
        plotColorPalette: series.join(","),
      },
    };

    // Indexed series: pie slices, git branches, journey/mindmap/timeline scales.
    for (var i = 0; i < 12; i++) {
      vars["pie" + (i + 1)] = series[i];
      vars["cScale" + i] = tintStrong(series[i]);
      vars["cScalePeer" + i] = series[i];
      vars["cScaleLabel" + i] = ink;
      vars["cScaleInv" + i] = series[i];
      if (i < 8) {
        vars["git" + i] = series[i];
        vars["gitInv" + i] = inkOn(series[i], ink);
        vars["gitBranchLabel" + i] = inkOn(series[i], ink);
        vars["fillType" + i] = tintStrong(series[i]);
      }
    }

    return { dark: dark, vars: vars, fontFamily: fontFamily, background: bgHex };
  }

  function buildMermaidConfig(p) {
    return {
      startOnLoad: false,
      securityLevel: SECURITY_LEVEL,
      theme: "base",
      themeVariables: p.vars,
      fontFamily: p.fontFamily,
      // Parse/render failures are surfaced in the figure itself (see
      // showError); Mermaid's own console logging would only duplicate them.
      logLevel: "fatal",
      flowchart: {
        useMaxWidth: true,
        // SVG labels avoid foreignObject clipping/position bugs with theme CSS
        htmlLabels: false,
        curve: "basis",
        padding: 12,
        nodeSpacing: 40,
        rankSpacing: 48,
      },
      sequence: {
        useMaxWidth: true,
        mirrorActors: true,
        diagramMarginX: 24,
        diagramMarginY: 12,
        actorMargin: 48,
        messageMargin: 32,
        boxMargin: 10,
        noteMargin: 10,
      },
      gantt: {
        useMaxWidth: true,
        titleTopMargin: 24,
        barHeight: 22,
        barGap: 6,
        topPadding: 48,
        leftPadding: 96,
        gridLineStartPadding: 36,
        fontSize: 12,
        numberSectionStyles: 4,
        axisFormat: "%Y-%m-%d",
      },
      class: { useMaxWidth: true },
      state: { useMaxWidth: true },
      er: { useMaxWidth: true },
      pie: { useMaxWidth: true },
      journey: { useMaxWidth: true },
      gitGraph: { useMaxWidth: true },
      mindmap: { useMaxWidth: true },
      timeline: { useMaxWidth: true },
      requirement: { useMaxWidth: true },
      quadrantChart: { useMaxWidth: true },
      xyChart: { useMaxWidth: true },
    };
  }

  var lastPaletteKey = null;
  var lastPalette = null;

  function initMermaid(force) {
    var p = palette();
    var key = JSON.stringify(p.vars) + "|" + p.fontFamily;
    if (!force && key === lastPaletteKey) return false;
    lastPaletteKey = key;
    lastPalette = p;
    window.mermaid.initialize(buildMermaidConfig(p));
    return true;
  }

  // ---------------------------------------------------------------------
  // DOM helpers
  // ---------------------------------------------------------------------
  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function icon(name) {
    var i = el("i", "bi " + name, { "aria-hidden": "true" });
    return i;
  }

  function button(iconName, label, onClick) {
    var b = el("button", "zer0-diagram__btn", { type: "button", "aria-label": label, title: label });
    b.appendChild(icon(iconName));
    b.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      onClick(b, e);
    });
    return b;
  }

  function fire(target, name, detail) {
    try {
      target.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: detail || {} }));
    } catch (err) { /* ignore */ }
  }

  function slugify(text) {
    return String(text || "diagram").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "diagram";
  }

  // ---------------------------------------------------------------------
  // Registry
  // ---------------------------------------------------------------------
  var registry = new WeakMap(); // figure -> { meta, scope }
  var allFigures = [];
  var counter = 0;

  function nextId() {
    counter += 1;
    return "zer0-diagram-" + counter + "-" + Date.now().toString(36);
  }

  // ---------------------------------------------------------------------
  // Zoom — implemented by sizing the SVG itself (real layout, so the
  // scrollable viewport, centring and print all keep working; no transforms).
  // ---------------------------------------------------------------------
  function currentZoom(canvas) {
    var z = parseFloat(canvas.getAttribute("data-zoom"));
    return isNaN(z) ? 1 : z;
  }

  function fitWidth(svg) {
    // Width the SVG occupies at zoom 1 (mermaid's max-width or the viewport).
    var rect = svg.getBoundingClientRect();
    return rect.width || parseFloat(svg.style.maxWidth) || (svg.viewBox && svg.viewBox.baseVal.width) || 0;
  }

  function setZoom(scope, zoom) {
    var canvas = scope.canvas;
    var svg = canvas.querySelector("svg");
    zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
    var isOne = Math.abs(zoom - 1) < EPSILON;

    if (svg) {
      if (isOne) {
        svg.style.width = "";
        svg.style.height = "";
        if (svg.getAttribute("data-zer0-max-width")) svg.style.maxWidth = svg.getAttribute("data-zer0-max-width");
        canvas.removeAttribute("data-zoom");
        // Measure the fitted size only once we are back at 1:1.
        svg.setAttribute("data-zer0-fit-width", String(fitWidth(svg)));
        var h = svg.getBoundingClientRect().height;
        if (h) svg.setAttribute("data-zer0-fit-height", String(h));
      } else {
        var base = parseFloat(svg.getAttribute("data-zer0-fit-width"));
        if (!base) {
          // First zoom without a 1:1 measurement: reset, measure, continue.
          setZoom(scope, 1);
          base = parseFloat(svg.getAttribute("data-zer0-fit-width")) || fitWidth(svg);
        }
        var baseH = parseFloat(svg.getAttribute("data-zer0-fit-height"));
        svg.style.maxWidth = "none";
        svg.style.width = Math.round(base * zoom) + "px";
        if (svg.hasAttribute("height") && baseH) svg.style.height = Math.round(baseH * zoom) + "px";
        canvas.setAttribute("data-zoom", zoom.toFixed(3));
      }
    }

    scope.viewport.classList.toggle("is-zoomed", !isOne);
    if (scope.level) {
      scope.level.textContent = Math.round(zoom * 100) + "%";
      scope.level.hidden = isOne;
    }
    if (scope.buttons) {
      if (scope.buttons.zoomIn) scope.buttons.zoomIn.disabled = zoom >= ZOOM_MAX - EPSILON;
      if (scope.buttons.zoomOut) scope.buttons.zoomOut.disabled = zoom <= ZOOM_MIN + EPSILON;
      if (scope.buttons.reset) scope.buttons.reset.disabled = isOne;
    }
    return zoom;
  }

  function zoomBy(scope, factor) {
    return setZoom(scope, currentZoom(scope.canvas) * factor);
  }

  // Drag-to-pan for mouse users once the diagram overflows its viewport.
  function enablePan(viewport) {
    var drag = null;
    viewport.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if (e.target.closest("a, button")) return;
      var canScroll = viewport.scrollWidth > viewport.clientWidth + 1 || viewport.scrollHeight > viewport.clientHeight + 1;
      if (!canScroll) return;
      drag = { x: e.clientX, y: e.clientY, left: viewport.scrollLeft, top: viewport.scrollTop, moved: false };
      viewport.classList.add("is-panning");
      try { viewport.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    viewport.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
      viewport.scrollLeft = drag.left - dx;
      viewport.scrollTop = drag.top - dy;
    });
    var end = function (e) {
      if (!drag) return;
      drag = null;
      viewport.classList.remove("is-panning");
      try { viewport.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    };
    viewport.addEventListener("pointerup", end);
    viewport.addEventListener("pointercancel", end);
  }

  function enableWheelZoom(viewport, scope) {
    viewport.addEventListener("wheel", function (e) {
      if (!(e.ctrlKey || e.metaKey)) return; // plain wheel keeps scrolling the page
      e.preventDefault();
      zoomBy(scope, e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP);
    }, { passive: false });
  }

  function enableKeys(viewport, scope) {
    viewport.addEventListener("keydown", function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var handled = true;
      switch (e.key) {
        case "+": case "=": zoomBy(scope, ZOOM_STEP); break;
        case "-": case "_": zoomBy(scope, 1 / ZOOM_STEP); break;
        case "0": setZoom(scope, 1); break;
        case "f": case "F":
          if (scope.buttons && scope.buttons.fullscreen && !scope.buttons.fullscreen.disabled) scope.buttons.fullscreen.click();
          else handled = false;
          break;
        default: handled = false;
      }
      if (handled) e.preventDefault();
    });
  }

  // ---------------------------------------------------------------------
  // Toolbar actions
  // ---------------------------------------------------------------------
  function announce(scope, text) {
    if (!scope.status) return;
    scope.status.textContent = "";
    // Re-insert on the next tick so identical messages are announced again.
    setTimeout(function () { scope.status.textContent = text; }, 30);
  }

  function copySource(btn, scope) {
    var entry = registry.get(scope.figure);
    var text = entry ? entry.meta.source : "";
    var done = function (ok) {
      var i = btn.querySelector("i");
      if (i) i.className = "bi " + (ok ? "bi-check-lg" : "bi-x-lg");
      btn.classList.toggle("is-success", ok);
      btn.classList.toggle("is-failure", !ok);
      announce(scope, ok ? LABELS.copied : LABELS.copyFailed);
      setTimeout(function () {
        if (i) i.className = "bi bi-clipboard";
        btn.classList.remove("is-success", "is-failure");
      }, 2000);
    };
    if (!navigator.clipboard || !navigator.clipboard.writeText) { done(false); return; }
    navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
  }

  function downloadSvg(scope) {
    var svg = scope.canvas.querySelector("svg");
    var entry = registry.get(scope.figure);
    if (!svg || !entry) return;
    var clone = svg.cloneNode(true);
    var vb = svg.viewBox && svg.viewBox.baseVal;
    if (vb && vb.width && vb.height) {
      clone.setAttribute("width", String(Math.round(vb.width)));
      clone.setAttribute("height", String(Math.round(vb.height)));
    }
    clone.removeAttribute("style");
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    // Diagrams render on a transparent canvas; bake the page surface in so a
    // dark-mode export is not white-on-nothing when opened elsewhere.
    if (lastPalette) clone.style.backgroundColor = lastPalette.background;
    var xml = new XMLSerializer().serializeToString(clone);
    var blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + xml], { type: "image/svg+xml;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = el("a", null, { href: url, download: slugify(entry.meta.title || entry.meta.typeLabel) + ".svg" });
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 1000);
  }

  // Build a toolbar bound to a mutable scope ({ figure, canvas, viewport }).
  // The lightbox reuses one toolbar for whichever figure it is showing.
  function buildToolbar(scope, opts) {
    var bar = el("div", "zer0-diagram__toolbar", { role: "toolbar", "aria-label": LABELS.tools });
    var buttons = {};

    buttons.zoomOut = button("bi-zoom-out", LABELS.zoomOut, function () { zoomBy(scope, 1 / ZOOM_STEP); });
    var level = el("span", "zer0-diagram__zoom", { "aria-live": "polite", "aria-atomic": "true" });
    level.hidden = true;
    buttons.zoomIn = button("bi-zoom-in", LABELS.zoomIn, function () { zoomBy(scope, ZOOM_STEP); });
    buttons.reset = button("bi-arrow-counterclockwise", LABELS.zoomReset, function () { setZoom(scope, 1); });
    buttons.reset.disabled = true;

    bar.appendChild(buttons.zoomOut);
    bar.appendChild(level);
    bar.appendChild(buttons.zoomIn);
    bar.appendChild(buttons.reset);
    bar.appendChild(el("span", "zer0-diagram__sep", { "aria-hidden": "true" }));

    buttons.copy = button("bi-clipboard", LABELS.copy, function (b) { copySource(b, scope); });
    bar.appendChild(buttons.copy);

    if (ALLOW_DOWNLOAD) {
      buttons.download = button("bi-download", LABELS.download, function () { downloadSvg(scope); });
      bar.appendChild(buttons.download);
    }

    if (opts && opts.inLightbox) {
      buttons.close = button("bi-x-lg", LABELS.close, function () { closeLightbox(); });
      buttons.close.classList.add("zer0-diagram__btn--close");
      bar.appendChild(buttons.close);
    } else if (ALLOW_FULLSCREEN && SUPPORTS_DIALOG) {
      buttons.fullscreen = button("bi-arrows-fullscreen", LABELS.fullscreen, function () { openLightbox(scope.figure); });
      bar.appendChild(buttons.fullscreen);
    }

    var status = el("span", "visually-hidden", { "aria-live": "polite", "aria-atomic": "true" });
    bar.appendChild(status);

    scope.level = level;
    scope.buttons = buttons;
    scope.status = status;
    return bar;
  }

  // state: "loading" | "rendered" | "error". Only a rendered SVG can be
  // zoomed, exported or shown fullscreen; copying the source always works.
  function setToolbarState(scope, state) {
    var b = scope.buttons;
    if (!b) return;
    var rendered = state === "rendered";
    ["zoomIn", "zoomOut", "download", "fullscreen"].forEach(function (k) {
      if (b[k]) b[k].disabled = !rendered;
    });
    if (b.reset) b.reset.disabled = true;
  }

  // ---------------------------------------------------------------------
  // Figure construction
  // ---------------------------------------------------------------------
  function makeFigure(meta) {
    var figure = el("figure", "zer0-diagram is-loading", { "data-zer0-diagram": meta.type });
    figure.setAttribute("aria-busy", "true");

    var viewport = el("div", "zer0-diagram__viewport", { tabindex: "0", role: "region" });
    viewport.setAttribute("aria-label", meta.title || meta.typeLabel);
    var canvas = el("div", "zer0-diagram__canvas");
    var skeleton = el("div", "zer0-diagram__skeleton skeleton", { "aria-hidden": "true" });
    canvas.appendChild(skeleton);
    var loading = el("span", "visually-hidden");
    loading.textContent = LABELS.loading;
    canvas.appendChild(loading);
    viewport.appendChild(canvas);

    var scope = { figure: figure, canvas: canvas, viewport: viewport };
    if (SHOW_TOOLBAR) {
      figure.appendChild(buildToolbar(scope));
      enableWheelZoom(viewport, scope);
      enableKeys(viewport, scope);
    }
    enablePan(viewport);
    figure.appendChild(viewport);

    var caption = el("figcaption", "zer0-diagram__caption");
    if (meta.title) caption.textContent = meta.title; else caption.hidden = true;
    figure.appendChild(caption);

    registry.set(figure, { meta: meta, scope: scope });
    allFigures.push(figure);
    return figure;
  }

  // The element to swap out for a fence: the outermost wrapper Jekyll (or
  // code-copy.js, if it somehow ran first) put around the <pre>.
  function fenceWrapper(pre) {
    return pre.closest(".highlighter-rouge") || pre.closest(".code-block-body") || pre;
  }

  function collect(root) {
    root = root || document;
    var found = [];

    var codes = root.querySelectorAll("pre > code.language-mermaid");
    Array.prototype.forEach.call(codes, function (code) {
      var pre = code.parentNode;
      if (!pre || !pre.isConnected) return;
      var figure = makeFigure(parseMeta(code.textContent));
      fenceWrapper(pre).replaceWith(figure);
      found.push(figure);
    });

    var pres = root.querySelectorAll('pre[data-language="mermaid"]');
    Array.prototype.forEach.call(pres, function (pre) {
      if (!pre.isConnected) return;
      var figure = makeFigure(parseMeta(pre.textContent));
      fenceWrapper(pre).replaceWith(figure);
      found.push(figure);
    });

    var divs = root.querySelectorAll("div.mermaid:not([data-processed])");
    Array.prototype.forEach.call(divs, function (div) {
      if (!div.isConnected || div.closest(".zer0-diagram")) return;
      var figure = makeFigure(parseMeta(div.textContent));
      div.replaceWith(figure);
      found.push(figure);
    });

    return found;
  }

  // ---------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------
  function decorateSvg(svg, meta) {
    svg.classList.add("zer0-diagram__svg");
    if (!svg.hasAttribute("aria-labelledby") && !svg.hasAttribute("aria-label")) {
      svg.setAttribute("aria-label", meta.title || meta.typeLabel);
    }
    if (!svg.hasAttribute("role")) svg.setAttribute("role", "img");
    if (svg.style.maxWidth) svg.setAttribute("data-zer0-max-width", svg.style.maxWidth);
    svg.removeAttribute("data-zer0-fit-width");
    svg.removeAttribute("data-zer0-fit-height");
  }

  function showError(figure, entry, err) {
    var scope = entry.scope;
    var message = String((err && (err.message || err.str)) || err || "Unknown error").split("\n").slice(0, 4).join("\n");

    scope.canvas.innerHTML = "";
    var box = el("div", "zer0-diagram__error");
    box.appendChild(icon("bi-exclamation-triangle-fill"));
    var body = el("div", "zer0-diagram__error-body");
    var title = el("p", "zer0-diagram__error-title");
    title.textContent = LABELS.errorTitle;
    body.appendChild(title);
    // Plain <pre> (no <code> child) on purpose: code-copy.js decorates every
    // `pre code` on DOMContentLoaded with a copy button and a line gutter, and
    // an error card that renders before that pass would pick both up. The
    // toolbar's copy control already covers the source.
    var pre = el("pre", "zer0-diagram__error-message");
    pre.textContent = message;
    body.appendChild(pre);
    var hint = el("p", "zer0-diagram__error-hint");
    hint.textContent = LABELS.errorHint;
    body.appendChild(hint);
    box.appendChild(body);
    scope.canvas.appendChild(box);

    var details = el("details", "zer0-diagram__source");
    details.open = true;
    var summary = el("summary");
    summary.textContent = LABELS.showSource;
    details.appendChild(summary);
    var srcPre = el("pre", "zer0-diagram__source-text");
    srcPre.textContent = entry.meta.source;
    details.appendChild(srcPre);
    scope.canvas.appendChild(details);

    figure.classList.add("has-error");
    figure.classList.remove("is-rendered");
    setToolbarState(scope, "error");
  }

  function renderFigure(figure) {
    var entry = registry.get(figure);
    if (!entry || !window.mermaid) return Promise.resolve(figure);
    var scope = entry.scope;
    var meta = entry.meta;

    figure.classList.add("is-loading");
    figure.classList.remove("has-error");
    figure.setAttribute("aria-busy", "true");
    setToolbarState(scope, "loading");

    var id = nextId();
    return Promise.resolve()
      .then(function () { return window.mermaid.parse(meta.source); })
      .then(function () { return window.mermaid.render(id, meta.source, scope.canvas); })
      .then(function (result) {
        scope.canvas.innerHTML = result && result.svg ? result.svg : "";
        var svg = scope.canvas.querySelector("svg");
        if (!svg) throw new Error("Mermaid returned no SVG");
        decorateSvg(svg, meta);
        if (result.bindFunctions) {
          try { result.bindFunctions(scope.canvas); } catch (err) { /* interactive bindings are optional */ }
        }
        figure.classList.add("is-rendered");
        setToolbarState(scope, "rendered");
        setZoom(scope, 1);
        fire(figure, "zer0:diagram-rendered", { ok: true, type: meta.type });
        return figure;
      })
      .catch(function (err) {
        // Mermaid can leave its temporary render container behind on failure.
        ["d" + id, id].forEach(function (leftover) {
          var node = document.getElementById(leftover);
          if (node && !scope.canvas.contains(node)) node.remove();
        });
        showError(figure, entry, err);
        fire(figure, "zer0:diagram-rendered", { ok: false, type: meta.type, error: String((err && err.message) || err) });
        return figure;
      })
      .then(function () {
        figure.classList.remove("is-loading");
        figure.removeAttribute("aria-busy");
        return figure;
      });
  }

  function renderMany(figures) {
    var failed = 0;
    return Promise.all(figures.map(function (f) {
      return renderFigure(f).then(function (fig) {
        if (fig.classList.contains("has-error")) failed += 1;
        return fig;
      });
    })).then(function (done) {
      fire(document, "zer0:diagrams-ready", { count: done.length, failed: failed });
      return done;
    });
  }

  // ---------------------------------------------------------------------
  // Fullscreen lightbox (<dialog>) — the figure's canvas is MOVED into the
  // dialog and back, so ids, bound click handlers and zoom state stay unique.
  // ---------------------------------------------------------------------
  var lightbox = null;

  function ensureLightbox() {
    if (lightbox) return lightbox;
    var dlg = el("dialog", "zer0-diagram-lightbox");
    var inner = el("div", "zer0-diagram-lightbox__inner");
    var bar = el("div", "zer0-diagram-lightbox__bar");
    var title = el("p", "zer0-diagram-lightbox__title", { id: "zer0-diagram-lightbox-title" });
    bar.appendChild(title);
    var viewport = el("div", "zer0-diagram__viewport zer0-diagram-lightbox__viewport", { tabindex: "0", role: "region" });
    var scope = { figure: null, canvas: null, viewport: viewport };
    var toolbar = buildToolbar(scope, { inLightbox: true });
    toolbar.classList.add("zer0-diagram__toolbar--static");
    bar.appendChild(toolbar);
    inner.appendChild(bar);
    inner.appendChild(viewport);
    dlg.appendChild(inner);
    dlg.setAttribute("aria-labelledby", "zer0-diagram-lightbox-title");

    enablePan(viewport);
    enableWheelZoom(viewport, scope);
    enableKeys(viewport, scope);

    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) dlg.close(); // backdrop click
    });
    dlg.addEventListener("close", restoreFromLightbox);
    document.body.appendChild(dlg);

    lightbox = { dialog: dlg, title: title, viewport: viewport, scope: scope, current: null };
    return lightbox;
  }

  function openLightbox(figure) {
    if (!SUPPORTS_DIALOG) return;
    var entry = registry.get(figure);
    if (!entry || !figure.classList.contains("is-rendered")) return;
    var lb = ensureLightbox();
    if (lb.current) restoreFromLightbox();

    var canvas = entry.scope.canvas;
    var placeholder = document.createComment("zer0-diagram canvas (shown fullscreen)");
    // Keep the figure's height so the page does not jump while the canvas is away.
    entry.scope.viewport.style.minHeight = entry.scope.viewport.getBoundingClientRect().height + "px";
    canvas.parentNode.insertBefore(placeholder, canvas);

    lb.current = { figure: figure, canvas: canvas, placeholder: placeholder, opener: document.activeElement, zoom: currentZoom(canvas) };
    lb.scope.figure = figure;
    lb.scope.canvas = canvas;
    lb.title.textContent = entry.meta.title || entry.meta.typeLabel;
    lb.viewport.setAttribute("aria-label", entry.meta.title || entry.meta.typeLabel);
    lb.viewport.appendChild(canvas);

    figure.classList.add("is-in-lightbox");
    document.documentElement.classList.add("zer0-diagram-lightbox-open");
    lb.dialog.showModal();
    setToolbarState(lb.scope, "rendered");
    setZoom(lb.scope, 1);
    fire(figure, "zer0:diagram-fullscreen", { open: true });
  }

  function restoreFromLightbox() {
    var lb = lightbox;
    if (!lb || !lb.current) return;
    var cur = lb.current;
    lb.current = null;
    cur.placeholder.replaceWith(cur.canvas);
    cur.placeholder = null;
    var entry = registry.get(cur.figure);
    if (entry) {
      entry.scope.viewport.style.minHeight = "";
      setZoom(entry.scope, cur.zoom || 1);
    }
    cur.figure.classList.remove("is-in-lightbox");
    document.documentElement.classList.remove("zer0-diagram-lightbox-open");
    lb.scope.figure = null;
    lb.scope.canvas = null;
    if (cur.opener && typeof cur.opener.focus === "function" && cur.opener.isConnected) {
      try { cur.opener.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
    }
    fire(cur.figure, "zer0:diagram-fullscreen", { open: false });
  }

  function closeLightbox() {
    if (lightbox && lightbox.dialog.open) lightbox.dialog.close();
  }

  // ---------------------------------------------------------------------
  // Theme / skin / token changes → re-render from source
  // ---------------------------------------------------------------------
  var refreshTimer = null;

  function refresh(force) {
    if (!window.mermaid) return Promise.resolve([]);
    var changed = initMermaid(force);
    if (!changed && !force) return Promise.resolve(allFigures.slice());
    // A re-render replaces the canvas contents; leave the lightbox first so
    // its zoom/toolbar state cannot go stale.
    if (lightbox && lightbox.current) closeLightbox();
    return renderMany(allFigures.filter(function (f) { return f.isConnected; }));
  }

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { refresh(false); }, 80);
  }

  function watchTheme() {
    if (typeof MutationObserver === "function") {
      var observer = new MutationObserver(scheduleRefresh);
      // `style` catches the Appearance panel writing token overrides onto
      // <html>. `class` is deliberately NOT watched: the lightbox toggles a
      // class there, and the palette comparison in refresh() is what decides
      // whether anything actually changed.
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-bs-theme", "data-theme-skin", "style"] });
      if (document.body) observer.observe(document.body, { attributes: true, attributeFilter: ["data-bs-theme"] });
    }
    document.addEventListener("zer0:skin-change", scheduleRefresh);
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", scheduleRefresh);
      else if (mq.addListener) mq.addListener(scheduleRefresh);
    }
  }

  // ---------------------------------------------------------------------
  // Public API + boot
  // ---------------------------------------------------------------------
  function renderAll(root) {
    if (!window.mermaid) return Promise.resolve([]);
    initMermaid(false);
    var figures = collect(root || document);
    return renderMany(figures);
  }

  function render(target, source) {
    if (!window.mermaid) return Promise.resolve(null);
    initMermaid(false);
    var figure;
    if (target && registry.has(target)) {
      figure = target;
      if (typeof source === "string") {
        var entry = registry.get(figure);
        entry.meta = parseMeta(source);
        var caption = figure.querySelector(".zer0-diagram__caption");
        if (caption) { caption.textContent = entry.meta.title || ""; caption.hidden = !entry.meta.title; }
        figure.setAttribute("data-zer0-diagram", entry.meta.type);
        entry.scope.viewport.setAttribute("aria-label", entry.meta.title || entry.meta.typeLabel);
      }
    } else if (target && target.nodeType === 1) {
      figure = makeFigure(parseMeta(typeof source === "string" ? source : target.textContent));
      target.replaceWith(figure);
    } else {
      return Promise.resolve(null);
    }
    return renderFigure(figure);
  }

  window.zer0Mermaid = {
    version: "3.0.0",
    config: CONFIG,
    labels: LABELS,
    renderAll: renderAll,
    render: render,
    refresh: function () { return refresh(true); },
    getSource: function (figure) { var e = registry.get(figure); return e ? e.meta.source : null; },
    palette: function () { return palette(); },
    figures: function () { return allFigures.filter(function (f) { return f.isConnected; }); },
    setZoom: function (figure, zoom) { var e = registry.get(figure); return e ? setZoom(e.scope, zoom) : null; },
    openFullscreen: openLightbox,
    closeFullscreen: closeLightbox,
  };

  function boot() {
    if (!window.mermaid || typeof window.mermaid.render !== "function") {
      // Vendor bundle missing: leave the fences as readable code blocks.
      document.documentElement.classList.add("zer0-diagram-unavailable");
      if (window.console && console.warn) console.warn("[zer0-mermaid] mermaid.min.js did not load; diagrams left as source.");
      return;
    }
    renderAll(document);
    watchTheme();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
