// =============================================================================
// extension-points-demo.js — a live consumer of the theme's extension points
// =============================================================================
//
// Loaded ONLY by /docs/customization/extension-points/, through that page's
// `scripts:` frontmatter — which makes this file a demonstration of two
// contracts at once: the per-page script hook that loads it, and the
// `zer0:code-block-ready` event it subscribes to.
//
// It is deliberately the whole pattern in a dozen lines. The point of #412 is
// that a consumer adding an action to a code block should not need a
// MutationObserver, a timeout fallback, or a guess at how deeply the theme
// nests its wrappers — all three of which it-journey#634 had to carry, and the
// wrapper guess is what silently produced two buttons per block.
//
// Copy this shape. `zer0OnCodeBlock` replays the blocks that were decorated
// before this script ran, then subscribes for any that follow, so it does not
// matter whether you load early or late.
// =============================================================================
(function () {
  'use strict';

  if (typeof window.zer0OnCodeBlock !== 'function') return;

  window.zer0OnCodeBlock(function (detail) {
    // A standalone <pre> outside a Rouge wrapper has no header row to hang an
    // action on. `header` is null there, and that is the documented signal.
    if (!detail.header) return;
    if (detail.header.querySelector('.zer0-demo-action')) return;

    var lines = (detail.code.textContent || '').replace(/\n$/, '').split('\n').length;

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'zer0-demo-action';
    button.textContent = lines + (lines === 1 ? ' line' : ' lines');
    button.setAttribute(
      'aria-label',
      'This ' + (detail.lang || 'code') + ' block has ' + lines + ' lines'
    );
    button.addEventListener('click', function () {
      detail.pre.focus();
    });

    // Before the copy button, so Copy keeps its place at the end of the row.
    detail.header.insertBefore(button, detail.header.querySelector('.copy'));
  });
})();
