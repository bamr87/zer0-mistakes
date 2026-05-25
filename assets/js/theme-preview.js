/**
 * theme-preview.js
 * Status indicators and section TOC for the Theme Preview style guide.
 */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var skinEl = document.getElementById('theme-preview-active-skin');
  var modeEl = document.getElementById('theme-preview-active-mode');

  function currentMode() {
    try {
      return localStorage.getItem('theme') || 'auto';
    } catch (e) {
      return 'auto';
    }
  }

  function resolvedMode() {
    return document.documentElement.getAttribute('data-bs-theme') || 'light';
  }

  function updateStatus() {
    if (skinEl) {
      skinEl.textContent = typeof zer0Bg !== 'undefined'
        ? zer0Bg.currentSkin()
        : (document.documentElement.getAttribute('data-theme-skin') || 'dark');
    }
    if (modeEl) {
      var stored = currentMode();
      modeEl.textContent = stored === 'auto'
        ? 'auto (' + resolvedMode() + ')'
        : stored;
    }
  }

  document.addEventListener('zer0:skin-change', updateStatus);

  document.querySelectorAll('[data-bs-theme-value]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setTimeout(updateStatus, 0);
    });
  });

  var appearanceHost = document.querySelector('[data-appearance-panel-host]');
  if (appearanceHost) {
    var observer = new MutationObserver(updateStatus);
    observer.observe(appearanceHost, { childList: true, subtree: true });
  }

  updateStatus();
});
