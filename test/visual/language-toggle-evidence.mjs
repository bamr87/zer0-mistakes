// Feature: ZER0-078
/**
 * Evidence spec — language toggle + machine-generated French page (ZER0-078).
 * ============================================================================
 * Generates the visual-evidence set for the multilingual translation feature
 * via the shared kit (evidence-kit.mjs). This is a NEW feature, so the
 * evidence is after-only (no `unfixCss` revert): the point is to show the
 * toggle in the navbar at every width, its open dropdown states, and a
 * generated /fr/ page rendering with French chrome + the disclosure banner.
 *
 * Reproduce (the French fixture comes from the offline stub provider —
 * no API key needed; see docs/systems/multilingual-translation.md):
 *
 *   ruby scripts/translate.rb --provider stub --only vendor-assets
 *   bundle exec jekyll build --config _config.yml,_config_dev.yml
 *   # serve _site on :4000 (docker compose up, or any static server)
 *   BASE_URL=http://localhost:4000 node test/visual/language-toggle-evidence.mjs
 *   ruby -e 'require "fileutils"; FileUtils.rm_rf(%w[fr _data/i18n/fr.yml _data/i18n/manifest.yml])'
 */
import { generateEvidence } from './evidence-kit.mjs';

const base = process.env.BASE_URL || 'http://localhost:4000';
const EN_ROUTE = '/docs/development/vendor-assets/';
const FR_ROUTE = '/fr/docs/development/vendor-assets/';

// Open the toggle's dropdown without relying on Bootstrap timing.
const OPEN_TOGGLE = () => {
  const toggle = document.querySelector('#zer0-lang-toggle');
  if (!toggle) return;
  toggle.querySelector('.dropdown-menu').classList.add('show');
  toggle.querySelector('#langToggleButton').setAttribute('aria-expanded', 'true');
};

// 1. English page: toggle in the navbar across widths; dropdown open state.
await generateEvidence({
  slug: 'language-toggle',
  base,
  route: EN_ROUTE,
  title: 'Language toggle in the navbar (English page with a French translation available)',
  widths: [320, 390, 768, 992, 1280, 1440],
  configWidth: 1280,
  configs: [
    { key: 'closed', label: 'Toggle closed — EN badge next to search', apply: () => {} },
    { key: 'open', label: 'Dropdown open — English active, Français links to /fr/…', apply: OPEN_TOGGLE },
  ],
});

// 2. Generated French page: French chrome, disclosure banner, toggle active on FR.
await generateEvidence({
  slug: 'language-toggle-fr',
  base,
  route: FR_ROUTE,
  title: 'Machine-generated French page (stub provider) — notice banner + French chrome',
  widths: [320, 390, 768, 1280],
  // Include the banner region in the crop: navbar + the top of main.
  chromeCrop: 'body',
  configWidth: 1280,
  configs: [
    { key: 'fr-open', label: 'FR page — dropdown open, Français active, English links back', apply: OPEN_TOGGLE },
  ],
});

console.log('language-toggle evidence complete.');
