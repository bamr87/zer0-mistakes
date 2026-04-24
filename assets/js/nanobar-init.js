/**
 * Nanobar Initialization — config-driven page-load progress bar.
 *
 * Reads settings from `window.zer0Nanobar` (injected by the
 * _includes/components/nanobar.html Liquid template) and instantiates the
 * Nanobar library that was loaded via <script defer>.
 *
 * Placement modes (site.nanobar.position):
 *   "top"    – fixed bar at the top of the viewport (default)
 *   "bottom" – fixed bar at the bottom of the viewport
 *   "navbar" – inline strip mounted inside #top-progress-target under header
 *
 * @see _config.yml  → nanobar section
 * @see _includes/components/nanobar.html
 * @see _includes/core/header.html → #top-progress-target mount point
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof Nanobar !== 'function') { return; }

    var cfg = window.zer0Nanobar || {};
    var classname = cfg.classname || 'nanobar';

    // ----- Resolve mount target -----
    // Priority: explicit selector → position "navbar" → none (fixed to viewport)
    var targetEl = null;
    if (cfg.target) {
      targetEl = document.querySelector(cfg.target);
    } else if (cfg.position === 'navbar') {
      targetEl = document.getElementById('top-progress-target');
    }

    // ----- Position modifier class -----
    var positionMod = '';
    if (cfg.position === 'bottom') { positionMod = classname + '--bottom'; }
    if (cfg.position === 'navbar') { positionMod = classname + '--navbar'; }

    // ----- Create the Nanobar instance -----
    var nanobar = new Nanobar({
      classname: classname,
      id: cfg.id,
      target: targetEl || undefined
    });

    if (positionMod && nanobar.el && nanobar.el.classList) {
      nanobar.el.classList.add(positionMod);
    }

    // ----- Animate progress steps -----
    var steps = (cfg.steps && cfg.steps.length) ? cfg.steps : [30, 76, 100];
    var delay = cfg.stepDelay || 0;

    if (delay > 0) {
      steps.forEach(function (pct, i) {
        setTimeout(function () { nanobar.go(pct); }, i * delay);
      });
    } else {
      steps.forEach(function (pct) { nanobar.go(pct); });
    }
  });
})();
