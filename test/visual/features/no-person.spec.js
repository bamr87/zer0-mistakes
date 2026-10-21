// =============================================================================
// no-person.spec.js — the shared includes and layouts ship no person
// (ported from zer0-CMS, ADR 0003 decision 2, 2026-10)
// =============================================================================
// _includes/components/author-eeat.html defaulted its author to a hard-coded
// key, _includes/content/jsonld-software.html emitted a Person node with the
// theme author's name, handle, X profile, job title and skills, and
// _layouts/root.html opened with a copyright line naming a person and another
// site. Every consumer rendered the theme author as its own author, in the
// visible E-E-A-T banner and in machine-readable JSON-LD.
//
// Now the author comes from the SITE: `author.key` in _config.yml (else the
// `default` entry of _data/authors.yml, else its first entry) for the banner,
// and `founder` / `author.name` / `title` plus `github_user` for the JSON-LD
// Person. The theme's own site sets all of these, so on this build the banner
// and the graph still name its author — but only because the configuration
// says so, which the first test pins at the source level.
// =============================================================================

const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('../fixtures');

const ROOT = path.resolve(__dirname, '..', '..', '..');

// The shared files the port changed, and the literals it removed from them.
const SHARED = [
  '_includes/components/author-eeat.html',
  '_includes/content/jsonld-software.html',
  '_layouts/root.html',
];
const PERSON_LITERALS = [
  'Amr Abdel-Motaleb',
  'default: "bamr87"',
  'https://x.com/bamr87',
  'it-journey.com',
  '| @bamr87',
  'Software Developer',
];

/** Flatten every application/ld+json payload on the page into its nodes. */
async function ldJsonNodes(page) {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raw.flatMap((text, i) => {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      throw new Error(`ld+json block #${i} is not valid JSON: ${err.message}`);
    }
    return Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
  });
}

test.describe('No person in the shared includes', () => {
  test('the shared includes and the root layout name nobody', () => {
    for (const rel of SHARED) {
      const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      for (const literal of PERSON_LITERALS) {
        expect(text.includes(literal), `${rel} still carries "${literal}"`).toBe(false);
      }
    }
  });

  test('the E-E-A-T banner and the JSON-LD author come from the site configuration @critical', async ({ page }) => {
    await waitForJekyll(page, '/');

    // _config.yml `author.key: bamr87` → _data/authors.yml bamr87.display_name.
    const banner = page.locator('[itemtype="https://schema.org/Person"]').filter({ hasText: 'Built by' });
    await expect(banner).toHaveCount(1);
    await expect(banner.locator('[itemprop="name"]')).toContainText('Amr Abdel (bamr87)');

    // The JSON-LD Person is built from `founder` and `github_user`, nothing else.
    const person = (await ldJsonNodes(page)).find(
      (n) => n['@type'] === 'Person' && String(n['@id']).endsWith('#author'),
    );
    expect(person).toBeTruthy();
    expect(person.name).toBe('Amr Abdel-Motaleb');
    expect(person.alternateName).toBe('bamr87');
    expect(person.url).toBe('https://github.com/bamr87');
    expect(person.sameAs).toEqual(['https://github.com/bamr87']);
    expect(person.jobTitle).toBeUndefined();
    expect(person.knowsAbout).toBeUndefined();
  });
});
