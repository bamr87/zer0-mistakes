# Evidence: cookie-consent gate (#566)

**The bug.** `_layouts/root.html` included `components/cookie-consent.html` unconditionally, and `core/footer.html` always rendered the "Cookie Preferences" button. A site with no tracker therefore showed every first-time visitor "We use cookies to analyze traffic…" with Manage / Reject All / Accept All buttons. The choice controlled nothing, and the fixed bar covered the bottom of the first screen and lifted both FAB stacks.

**The fix.** `components/cookie-consent-needed.html` decides whether anything needs consent: `google_analytics`, `google_tag_manager` or `posthog.enabled`, overridable with `cookie_consent.enabled`. The banner, the modal and the footer button render only when it says so.

**How this was generated.** The theme's own dev site inherits a GTM container, so it keeps the banner and a base-vs-head run of it shows no change. Both sides here are therefore static builds of the same no-tracker overlay (`google_analytics: ""`, `google_tag_manager: ""`, `posthog.enabled: false`) on top of `_config.yml,_config_dev.yml`. BEFORE is `main` @ `0af600e` and AFTER is this branch. The captures are by [`test/visual/cookie-consent-gate-evidence.mjs`](../../cookie-consent-gate-evidence.mjs) in `mcr.microsoft.com/playwright:v1.58.2-jammy`, as a first-time visitor (no stored consent).

- `01-before-after-home.png`: `/` at 390px and 1280px. BEFORE shows the banner (94px / 48px) with the FABs lifted above it. AFTER has no banner, the FABs sit at their normal offset, and there are no page errors.
- `02-footer-before-after.png`: the footer policy links at 1280px. "Cookie Preferences" is gone with the modal it opened.
- `metrics.json`: the per-width DOM probe (banner/modal presence, footer button count, the `zer0-cookie-banner-open` class and body padding).

Whole-site build counts with the same overlay: 384 of 407 HTML files carried `id="cookieConsent"` before, and 0 after. The theme's own dev config is unchanged at 384 files, because its GTM id keeps the banner on.
