/**
 * Evidence for the mobile-nav containing-block fix.
 *
 * BEFORE: examples/swerve-of-shore set `backdrop-filter` on `.navbar` for its
 * frosted sticky header. That made `.navbar` the containing block for its
 * `position: fixed` descendants, and the theme's main-nav panel (#bdNavbar, an
 * `.offcanvas-lg`) is one — so the panel sized itself against the ~60px navbar
 * instead of the viewport and opened as a clipped sliver with every link cut
 * off.
 *
 * AFTER: the same effect moved to a `.navbar::before` pseudo-element, which is
 * not an ancestor of #bdNavbar. Identical appearance, panel fills the screen.
 *
 * `unfixCss` below restores the pre-fix declarations so the kit can reproduce
 * the BEFORE state against the same server.
 *
 * Run against a server with the example built into it (see .github/workflows/
 * pages.yml for the stitched-tree build):
 *   BASE_URL=http://127.0.0.1:4021 node test/visual/mobile-nav-containing-block-evidence.mjs
 */
import { generateEvidence } from './evidence-kit.mjs';

await generateEvidence({
  slug: 'mobile-nav-containing-block',
  base: process.env.BASE_URL || 'http://localhost:4000',
  route: '/examples/swerve-of-shore/',
  title: 'Mobile nav panel collapses when .navbar creates a fixed containing block',
  // Put the filter back on .navbar itself and neutralise the pseudo-element.
  unfixCss: `
    .navbar { background-color: rgba(251, 248, 242, 0.94) !important;
              backdrop-filter: saturate(140%) blur(8px); }
    .navbar::before { backdrop-filter: none; background: none; }
  `,
  widths: [320, 390, 414, 768],
  bandWidths: [390, 768],
  configs: [
    {
      key: 'menu-open',
      label: 'Main navigation open (the state the bug destroys)',
      apply: () => {
        const t = document.querySelector('.navbar-toggler[data-bs-target="#bdNavbar"]');
        if (t) t.click();
      },
    },
  ],
});
