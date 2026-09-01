/**
 * Footer button semantics (#320) — evidence generator.
 * ----------------------------------------------------------------------------
 * The fix swaps three footer controls from `<a href="#" data-bs-toggle>` to
 * `<button type="button">` (WCAG 4.1.2). The *point* of the change is that it
 * is visually inert: the footer must look exactly as it did while announcing
 * the right role.
 *
 * That makes the interesting comparison different from the navbar fix's. A
 * markup swap cannot be reverted with CSS, so `unfixCss` cannot reproduce the
 * anchor rendering on this server. What CSS *can* revert is the other half of
 * the fix — the `<button>` reset in `_sass/components/_footer.scss`. So the
 * config montage contrasts:
 *
 *   shipped  — the reset active. Buttons render exactly like the anchors did.
 *   naive    — the reset stripped. What a markup-only swap would have shipped:
 *              UA button chrome (grey `buttonface` fill, 2px outset border,
 *              `buttontext` colour, 13px Arial, 1px 6px padding).
 *
 * The viewport matrix crops the whole footer at mobile / tablet / desktop so a
 * reviewer can compare it against `main` side by side.
 *
 * Usage:
 *   docker compose up                                     # serves :4000
 *   BASE_URL=http://localhost:4000 node test/visual/footer-button-semantics-evidence.mjs
 *
 * Outputs (test/visual/evidence/footer-button-semantics/):
 *   01-viewport-matrix.png   footer at 375 / 768 / 1280 (shipped)
 *   02-configs.png           shipped vs naive (reset stripped) at 1280
 *   metrics.json             footer overflow per width (expected: 0)
 *   CHANGELOG-snippet.txt
 */
import { generateEvidence } from './evidence-kit.mjs';

await generateEvidence({
  slug: 'footer-button-semantics',
  title: 'Footer in-page toggles are <button>, not <a href="#"> (#320)',
  base: process.env.BASE_URL || 'http://localhost:4000',
  route: '/',
  // The change is footer-local; measuring the whole page would drown it in
  // unrelated content overflow.
  scope: 'footer.bd-footer',
  chromeCrop: 'footer.bd-footer',
  widths: [375, 768, 1280],
  // A markup swap is not CSS-revertible, so there is no meaningful band
  // montage here — the shipped/naive contrast below carries the comparison.
  bandWidths: [],
  configWidth: 1280,
  // The consent banner is position:fixed at the bottom of the viewport and
  // would be baked into every footer crop. Pre-seed the choice the way a
  // returning visitor has it (mirrors dismissCookieConsent in fixtures.js).
  initScript: () => {
    localStorage.setItem('zer0-cookie-consent', JSON.stringify({
      essential: true, analytics: false, marketing: false,
      timestamp: Date.now(), version: '1.0',
    }));
  },
  configs: [
    {
      key: 'shipped',
      label: '✅ SHIPPED — <button> + the _footer.scss reset. Identical to the pre-fix anchors',
      apply: () => {},
    },
    {
      key: 'naive',
      label: '❌ NAIVE — markup swapped, reset stripped. UA button chrome the reset removes',
      // The kit runs this with page.evaluate(cfg.apply) and no argument, so the
      // CSS has to be a literal inside the function body — it cannot close over
      // a module-scope constant.
      apply: () => {
        const style = document.createElement('style');
        style.textContent = `
          .bd-footer .powered-by-link,
          .bd-footer .footer-inline-button {
            -webkit-appearance: revert !important;
            appearance: revert !important;
            background: revert !important;
            border: revert !important;
            color: revert !important;
            padding: revert !important;
            font: revert !important;
          }
        `;
        document.head.appendChild(style);
      },
    },
  ],
});
