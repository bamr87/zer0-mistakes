// Evidence for the navbar search shortcut affordance (ZER0-032 enhancement):
// the "/" kbd chip on the search button + shortcut hover titles, from the
// design-system navbar pattern (_design-system/ui_kits/website/Navbar.jsx).
// BEFORE reproduces the shipped state by hiding the chip.
// Run: BASE_URL=http://localhost:4000 node test/visual/search-shortcut-evidence.mjs
import { generateEvidence } from './evidence-kit.mjs';

await generateEvidence({
  slug: 'search-shortcut-hint',
  base: process.env.BASE_URL || 'http://localhost:4000',
  route: '/',
  unfixCss: `#navbar .nav-search-kbd { display: none !important; }`,
  widths: [320, 390, 768, 992, 1280, 1440],
  bandWidths: [1280, 1440],
  title: 'Navbar search shortcut affordance — "/" chip + hover hint',
});
