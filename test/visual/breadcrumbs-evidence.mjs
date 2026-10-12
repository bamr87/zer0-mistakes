/**
 * Before/after evidence for #512 — breadcrumb BreadcrumbList validity.
 *
 * The fix is a markup change (an unlinked crumb leaves the structured list),
 * so there is no `unfixCss` to reproduce the BEFORE state. This drives the
 * generic base-vs-head generator over the two pages whose trail has an
 * unlinked crumb, instead of its default `/` (which has no breadcrumb):
 *
 *   /about/settings/theme/   generic branch — "Settings" has no index page
 *   a /posts/… article       known-section branch — no /posts/ index here
 *
 * What it should show: the VISIBLE trail is identical before and after. The
 * structural change is asserted by test/visual/features/breadcrumbs.spec.js.
 *
 * Usage (BEFORE = base branch served by scripts/ci/visual_evidence_autogen.py):
 *   node test/visual/breadcrumbs-evidence.mjs
 */
const env = process.env;
env.SLUG = 'breadcrumbs';
env.BASE_URL ||= 'http://localhost:4000';
env.BEFORE_URL ||= 'http://localhost:4001';
env.ROUTES ||= '/about/settings/theme/,/posts/2025/01/22/git-workflow-best-practices/';
env.TITLE ||= '#512 breadcrumb — visible trail before vs after';
env.BEFORE_LABEL ||= 'BEFORE — base branch';
env.AFTER_LABEL ||= 'AFTER — #512 fix';

// slug: 'breadcrumbs' — read by scripts/ci/visual_evidence_autogen.py (detect_slug).
await import('./pr-evidence.mjs');
