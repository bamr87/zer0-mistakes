/**
 * Evidence generator for the navbar work in #405.
 *
 * The load-bearing bug this proves is the labelled menu toggle below `lg`:
 * `#navbar .navbar-toggler { width: 2.5rem }` (specificity 1,1,0) outranked
 * `.navbar-toggler-labeled { width: auto }` (0,2,0), so the button was pinned
 * to a 40px square that cannot hold glyph + gap + "Menu". The label escaped its
 * box and pushed the document 14px past the viewport at EVERY width below lg —
 * a sideways scroll, which is precisely what makes a `position: fixed` bar read
 * as "cut off".
 *
 * `unfixCss` below re-applies that clamp, so the kit reproduces the BEFORE
 * state on the same server that renders the AFTER — the numbers are measured,
 * not remembered.
 *
 * Usage:
 *   docker compose up                                   # serves :4000
 *   BASE_URL=http://localhost:4000 node test/visual/navbar-tiers-evidence.mjs
 *
 * Writes test/visual/evidence/navbar-tiers-405/ (montages + metrics.json).
 */
import { generateEvidence } from './evidence-kit.mjs';

await generateEvidence({
  slug: 'navbar-tiers-405',
  base: process.env.BASE_URL || 'http://localhost:4000',
  route: '/',
  title: 'Navbar label tiers, merged chevron, labelled menu toggle (#405)',

  // Revert ONLY the toggle fix: restore the square that the ID selector used to
  // win with. Everything else on the page stays as shipped, so the before/after
  // band isolates this one regression.
  unfixCss: `
    @media (max-width: 991.98px) {
      #navbar .navbar-toggler.navbar-toggler-labeled {
        width: 2.5rem;
        min-width: 0;
      }
    }
  `,

  // The sweep spans the lg boundary on purpose: 320-991 carry the labelled
  // toggle (and so the bug), 992+ never render it and must be unchanged.
  widths: [320, 360, 390, 414, 600, 768, 820, 991, 992, 1280, 1440],
  bandWidths: [320, 390, 768, 991],
});
