/**
 * background-customizer.js
 * Runtime switching of theme skin and fffuel-style SVG backgrounds.
 *
 * API:
 *   zer0Bg.setSkin('aqua')        — change skin (persists to localStorage)
 *   zer0Bg.toggle()               — enable / disable backgrounds
 *   zer0Bg.setOpacity('gradient', 0.5) — adjust a layer opacity at runtime
 *   zer0Bg.currentSkin()          — returns current skin name
 */
(() => {
  "use strict";

  const STORAGE_KEY_SKIN = "zer0-theme-skin";
  const STORAGE_KEY_BG   = "zer0-bg-enabled";

  const html = document.documentElement;

  /** Read stored skin or fall back to the server-rendered attribute. */
  function getStoredSkin() {
    return localStorage.getItem(STORAGE_KEY_SKIN) || html.getAttribute("data-theme-skin") || "dark";
  }

  /** Read stored background on/off preference. */
  function isBgEnabled() {
    const stored = localStorage.getItem(STORAGE_KEY_BG);
    if (stored !== null) return stored === "true";
    return html.getAttribute("data-zer0-bg") !== "false";
  }

  /** Apply skin to <html> and persist. */
  function setSkin(name) {
    html.setAttribute("data-theme-skin", name);
    localStorage.setItem(STORAGE_KEY_SKIN, name);
    document.dispatchEvent(new CustomEvent("zer0:skin-change", { detail: { skin: name } }));
  }

  /** Toggle backgrounds on/off. */
  function toggle(force) {
    const enabled = typeof force === "boolean" ? force : !isBgEnabled();
    html.setAttribute("data-zer0-bg", enabled ? "on" : "off");
    localStorage.setItem(STORAGE_KEY_BG, String(enabled));
    document.dispatchEvent(new CustomEvent("zer0:bg-toggle", { detail: { enabled } }));
  }

  /** Adjust a specific layer opacity at runtime via CSS custom property. */
  function setOpacity(layer, value) {
    const map = {
      gradient: "--zer0-bg-gradient-opacity",
      texture:  "--zer0-bg-texture-opacity",
      pattern:  "--zer0-bg-pattern-opacity"
    };
    const prop = map[layer];
    if (prop) html.style.setProperty(prop, value);
  }

  /** Return current skin name. */
  function currentSkin() {
    return html.getAttribute("data-theme-skin") || "dark";
  }

  // Restore on page load
  const storedSkin = getStoredSkin();
  if (storedSkin !== html.getAttribute("data-theme-skin")) {
    html.setAttribute("data-theme-skin", storedSkin);
  }
  if (!isBgEnabled()) {
    html.setAttribute("data-zer0-bg", "off");
  }

  // Public API
  window.zer0Bg = { setSkin, toggle, setOpacity, currentSkin };
})();
