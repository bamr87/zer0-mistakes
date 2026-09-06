// Feature: ZER0-085
// =============================================================================
// site-builder-scenarios.mjs — randomised site-build scenarios for the wizard
// =============================================================================
// The Site Builder is driven by an AI agent, so a fixed transcript proves very
// little: the point of the end-to-end run is that ANY reasonable brief, in ANY
// of the site shapes the wizard offers, ends in a running site. This module is
// the catalogue those runs sample from, plus a seeded RNG so a failing run can
// be replayed exactly (`SEED=<n>`).
//
// Each scenario names the site TYPE the wizard should end up in and the
// structural facts a build of that type must satisfy — collections, generated
// files, routes the new site must answer — while everything a user would type
// (brief, author, handle, tone, audience, skin, colour mode, integrations,
// extra menu items) is picked at random from realistic alternatives.
//
// Used by test/visual/site-builder-walkthrough.mjs.
// =============================================================================

export const SCENARIOS = {
  blog: {
    label: 'Personal blog',
    siteType: 'blog',
    collections: ['posts', 'about'],
    briefs: [
      'A field-notes blog about running PostgreSQL in production — backups, replication, upgrades, and the incidents that teach you — for backend engineers who suddenly own the database.',
      'A weekly blog about learning woodworking in a one-car garage: tool reviews, project write-ups, and the mistakes that cost me a Saturday.',
      'A blog by a nurse practitioner about the realities of rural primary care, written for clinicians thinking about leaving the city.',
      'Essays on running a four-person software consultancy: pricing, contracts, and saying no, for other tiny firms.',
    ],
    expectFiles: ['pages/posts.md', /^pages\/_posts\/\d{4}-\d{2}-\d{2}-welcome\.md$/],
    expectRoutes: ['/', '/posts/', '/about/', '/feed.xml'],
  },
  docs: {
    label: 'Documentation site',
    siteType: 'docs',
    collections: ['docs', 'about', 'quickstart'],
    briefs: [
      'Documentation for "ledgerctl", an open-source CLI that reconciles bank exports against a plain-text ledger — install, configure, commands, and troubleshooting for finance-minded developers.',
      'The handbook for a 40-person remote engineering team: how we deploy, review, and respond to incidents. Written for new hires in their first month.',
      'Docs for a small Python library that parses GPX and FIT files from sports watches — quickstart, API reference, and recipes for data scientists.',
      'Setup and operations guide for a self-hosted home lab: Proxmox, Tailscale, backups, and monitoring, aimed at hobbyists who want it to keep working.',
    ],
    expectFiles: ['pages/docs.md', 'pages/quickstart.md', 'pages/_docs/getting-started.md', 'pages/_quickstart/first-steps.md'],
    expectRoutes: ['/', '/docs/', '/docs/getting-started/', '/quickstart/', '/quickstart/first-steps/', '/about/'],
  },
  cookbook: {
    label: 'Cookbook',
    siteType: 'cookbook',
    collections: ['recipes', 'posts', 'about'],
    briefs: [
      'A family cookbook of Lebanese home cooking — the recipes my grandmother never wrote down, tested and measured so my cousins can finally make them.',
      'Weeknight vegetarian cooking for two people with one good pan: 30-minute recipes, batch-cooking notes, and what to buy on Sunday.',
      'A baking journal focused on sourdough and enriched doughs, with baker\'s percentages, timing charts, and photos of the failures too.',
      'Campfire and camp-stove recipes for backpackers: light, cheap, and cooked in one pot at altitude.',
    ],
    expectFiles: ['pages/recipes.md', 'pages/_recipes/starter-recipe.md'],
    expectRoutes: ['/', '/recipes/', '/posts/', '/about/', '/recipes/starter-recipe/'],
  },
  portfolio: {
    label: 'Portfolio',
    siteType: 'portfolio',
    collections: ['posts', 'about'],
    briefs: [
      'A portfolio for a freelance brand designer: selected identity projects, process notes, and how to hire me — aimed at founders and marketing leads.',
      'Portfolio of an embedded systems engineer: hardware and firmware projects with teardown-style write-ups, for hiring managers and fellow tinkerers.',
      'A data-visualisation portfolio with one interactive chart per case study and a short note on what the data changed, for editors and newsroom leads.',
    ],
    expectFiles: ['pages/posts.md'],
    expectRoutes: ['/', '/posts/', '/about/'],
  },
  garden: {
    label: 'Digital garden',
    siteType: 'notes',
    collections: ['notes', 'posts', 'about'],
    briefs: [
      'A digital garden of interlinked notes on distributed-systems papers — one note per paper, one per concept — for graduate students and curious engineers.',
      'Evergreen notes on gardening in a cold climate: zone-6 varieties, frost dates, and what actually overwintered, cross-linked by plant and by month.',
      'A personal knowledge base about learning Japanese as an adult: grammar notes, mnemonics, and reading logs, heavily cross-linked.',
    ],
    expectFiles: ['pages/notes.md', 'pages/_notes/welcome-note.md'],
    expectRoutes: ['/', '/notes/', '/notes/welcome-note/', '/about/'],
  },
  mixed: {
    label: 'Blog + docs',
    siteType: 'mixed',
    collections: ['posts', 'docs', 'about'],
    briefs: [
      'The website for a small open-source static-site plugin: release notes as posts, reference docs, and an about page for the two maintainers.',
      'A community site for a local cycling club: news posts, ride guides as docs, and how to join — for members and curious locals.',
      'A teaching site for an intro statistics course: lecture notes as docs and weekly announcements as posts, for undergraduates.',
    ],
    expectFiles: ['pages/posts.md', 'pages/docs.md', 'pages/_docs/getting-started.md'],
    expectRoutes: ['/', '/posts/', '/docs/', '/docs/getting-started/', '/about/'],
  },
};

export const SCENARIO_IDS = Object.keys(SCENARIOS);

const AUTHORS = ['Sam Rivera', 'Priya Natarajan', 'Jonas Ekberg', 'Maya Okafor', 'Tomás Herrera', 'Leila Haddad', 'Ren Takahashi', 'Ada Kowalski'];
const TONES = ['friendly', 'technical', 'editorial', 'playful', 'formal'];
const AUDIENCES = ['developers', 'general', 'students', 'clients', 'community'];
const SKINS = ['air', 'aqua', 'dirt', 'neon', 'mint', 'plum', 'sunrise'];
const COLOR_MODES = ['auto', 'light', 'dark'];
const EXTRA_NAV = [
  { title: 'Now', url: '/now/', icon: 'bi-clock' },
  { title: 'Uses', url: '/uses/', icon: 'bi-tools' },
  { title: 'Newsletter', url: '/newsletter/', icon: 'bi-envelope' },
  { title: 'Talks', url: '/talks/', icon: 'bi-mic' },
];
const PERMALINKS = ['/:categories/:title/', '/:title/', '/:year/:month/:title/'];

// Site-plan variation: which landing templates suit which type, plus the
// theme overrides every type may draw from. Ids must exist in
// _data/site_builder.yml catalogs (the wizard validates the plan against them).
const LANDING_BY_TYPE = {
  blog: ['hero', 'editorial', 'minimal'],
  docs: ['docs-hub', 'hero'],
  cookbook: ['showcase', 'hero'],
  portfolio: ['showcase', 'editorial'],
  garden: ['minimal', 'editorial'],
  mixed: ['hero', 'docs-hub'],
};
const NAV_STYLES = ['flat', 'grouped'];
const PALETTES = ['skin', 'skin', 'ocean', 'forest', 'sunset', 'graphite', 'berry', 'sand', 'midnight', 'citrus', 'custom'];
const FONTS = ['system', 'system', 'inter', 'playfair-lato', 'space-plex', 'merriweather-source', 'nunito', 'fraunces-work'];
const RADII = ['sharp', 'soft', 'round'];
const PAGE_IDEAS = {
  posts: ['Why I started this', 'What I got wrong last year', 'A field guide to getting unstuck', 'Notes from the first month', 'Tools I actually use'],
  docs: ['Installation', 'Configuration reference', 'Troubleshooting', 'Frequently asked questions', 'Architecture overview'],
  notes: ['Reading list', 'Open questions', 'Glossary', 'Ideas to revisit'],
  quickstart: ['Install in five minutes', 'Your first change', 'Publishing'],
  recipes: ['Weeknight lentil soup', 'Overnight oats three ways', 'Roasted vegetable traybake'],
  quests: ['Level one: the basics'],
  notebooks: ['Exploring the data'],
};

function randomHex(rng) {
  const h = () => Math.floor(40 + rng() * 150).toString(16).padStart(2, '0');
  return `#${h()}${h()}${h()}`;
}

function slugOf(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

/** A deterministic plan the runner applies when the agent did not deliver one. */
function fallbackPlanFor(id, def, rng, inputs) {
  const template = pick(rng, LANDING_BY_TYPE[id] || ['hero']);
  const cols = def.collections.filter((c) => c !== 'about');
  const pages = [];
  cols.forEach((col) => {
    const ideas = (PAGE_IDEAS[col] || ['Overview']).slice();
    const n = Math.min(ideas.length, col === cols[0] ? 3 : 2);
    for (let i = 0; i < n; i += 1) {
      const idx = Math.floor(rng() * ideas.length);
      const title = ideas.splice(idx, 1)[0];
      pages.push({
        collection: col,
        slug: slugOf(title),
        title,
        description: `${title} — part of ${inputs.title}.`,
        tags: [col, 'starter'],
        body: `# ${title}\n\n${inputs.brief}\n\nThis page was planned by the Site Builder's end-to-end test as a stand-in for the assistant's draft. It exists so the **${col}** collection has real routes to check.\n\n## What belongs here\n\n- A clear opening that says who the page is for\n- One worked example\n- Links to the pages that come next`,
      });
    }
  });
  const palette = pick(rng, PALETTES);
  const plan = {
    landing: { template },
    navigation: { style: pick(rng, NAV_STYLES), sidebar: def.collections.includes('docs') ? pick(rng, ['auto', 'docs', 'none']) : pick(rng, ['none', 'auto']) },
    theme: {
      palette: palette === 'custom' ? { preset: 'custom', primary: randomHex(rng), secondary: randomHex(rng), accent: randomHex(rng) } : { preset: palette },
      fonts: pick(rng, FONTS),
      radius: pick(rng, RADII),
    },
    pages,
  };
  if (template !== 'minimal') {
    plan.landing.hero = { eyebrow: def.label, headline: inputs.tagline, subheadline: inputs.description.slice(0, 200), align: template === 'editorial' ? 'start' : 'center', variant: template === 'showcase' ? 'inverse' : 'default', ctas: [{ label: 'Start reading', url: `/${cols[0]}/`, variant: 'primary', icon: 'bi-arrow-right' }, { label: 'About', url: '/about/', variant: 'outline' }] };
  }
  return plan;
}

/** Mulberry32 — small, seedable, good enough for picking test inputs. */
export function makeRng(seed) {
  let a = (Number(seed) >>> 0) || 1;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const chance = (rng, p) => rng() < p;

function handleFor(author, rng) {
  const [first, last] = author.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').split(/\s+/);
  const forms = [`${first}${last}`, `${first[0]}${last}`, `${first}-${last}`, `${first}${Math.floor(rng() * 90 + 10)}`];
  return pick(rng, forms);
}

function slugFrom(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').split('-').slice(0, 3).join('-');
}

/**
 * Turn a scenario id into concrete, randomised user inputs. Everything a
 * person would type or click is sampled here; the scenario's structural
 * expectations ride along untouched so the runner can assert against them.
 */
export function buildScenario(id, rng, opts = {}) {
  const def = SCENARIOS[id];
  if (!def) throw new Error(`Unknown scenario "${id}". Known: ${SCENARIO_IDS.join(', ')}`);
  const brief = pick(rng, def.briefs);
  const author = pick(rng, AUTHORS);
  const handle = handleFor(author, rng);
  const repo = `${slugFrom(brief)}-${id}`.slice(0, 40).replace(/-+$/, '');
  const colorMode = pick(rng, COLOR_MODES);
  // Deterministic stand-ins the runner applies only when the agent did not
  // deliver (offline, revoked credential, no tool call) so the build half of
  // the scenario is still exercised. They are intentionally plain.
  const fallback = {
    title: `${author.split(/\s+/)[0]}'s ${def.label}`,
    subtitle: def.label,
    // First clause of the brief, cut at a word boundary so it never ends mid-word.
    tagline: (() => { const clause = brief.split(/[.—–:;]/)[0].trim(); return clause.length <= 90 ? clause : clause.slice(0, 90).replace(/\s+\S*$/, ''); })(),
    description: (brief.length > 155 ? brief.slice(0, 152).replace(/\s+\S*$/, '') + '…' : brief).padEnd(60, ' ').trim(),
  };
  const fallbackVoice = {
    welcome_title: `Welcome to ${fallback.title}`,
    welcome_body: `This is the first post on **${fallback.title}**.\n\n${brief}\n\nPosts live in \`pages/_posts/\`. This one was generated as a placeholder by the Site Builder's end-to-end test because the assistant was unavailable; replace it with your own words.\n\n## What to expect\n\n- Regular updates in the ${pick(rng, TONES)} register the site was configured for\n- Cross-links between related pieces\n- An about page that explains who is behind it`,
    about_body: `${author} runs this site.\n\n${brief}\n\nThis about page is a placeholder written by the Site Builder's end-to-end test; edit \`pages/_about/index.md\` to tell your own story.`,
  };
  const fallbackPlan = fallbackPlanFor(id, def, rng, { title: fallback.title, tagline: fallback.tagline, description: fallback.description, brief });
  return {
    fallback,
    fallbackVoice,
    fallbackPlan,
    id,
    label: def.label,
    siteType: def.siteType,
    collections: def.collections.slice(),
    expectFiles: def.expectFiles,
    expectRoutes: def.expectRoutes,
    sampleRoute: def.sampleRoute || null,
    brief,
    author,
    email: `${handle}@example.com`,
    handle,
    repo,
    target: opts.target || `${repo}-${Math.floor(rng() * 9000 + 1000)}`,
    port: opts.port || 4100,
    permalink: pick(rng, PERMALINKS),
    tone: pick(rng, TONES),
    audience: pick(rng, AUDIENCES),
    skin: pick(rng, SKINS),
    colorMode,
    colorLock: colorMode !== 'auto' && chance(rng, 0.4),
    backgrounds: chance(rng, 0.8),
    integrations: {
      page_feedback: chance(rng, 0.8),
      obsidian: id === 'garden' ? true : chance(rng, 0.5),
      giscus: chance(rng, 0.4),
      posthog: false,
      ai_chat: chance(rng, 0.3),
    },
    twitter: chance(rng, 0.5) ? handle : '',
    extraNav: chance(rng, 0.6) ? [pick(rng, EXTRA_NAV)] : [],
    deployTarget: chance(rng, 0.85) ? 'github-pages' : 'gem',
  };
}

/** Pick `count` distinct scenario ids (or the one requested). */
export function chooseScenarioIds(requested, count, rng) {
  if (requested && requested !== 'random' && requested !== 'all') {
    return requested.split(',').map((s) => s.trim()).filter(Boolean);
  }
  const pool = SCENARIO_IDS.slice();
  if (requested === 'all') return pool;
  const out = [];
  while (out.length < Math.min(count, pool.length)) {
    const i = Math.floor(rng() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}
