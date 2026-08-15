# Evidence — cookie settings modal dark-mode contrast (issue #280)

The "Your Privacy Rights" list in `#cookieSettingsModal` used Bootstrap's fixed
`.text-dark` utility inside a `.bg-body` panel. `--bs-dark-rgb` is declared once
in `:root` and never remapped by `[data-bs-theme=dark]`, so in dark mode the
text colour (`rgb(33, 37, 41)`) is byte-for-byte the panel background — a
measured **1.00:1** contrast ratio against WCAG 1.4.3 (AA)'s 4.5:1 minimum. The
fix (`text-body`) measures **11.85:1** in dark mode and leaves light mode
unchanged (15.43:1). `.cookie-category`'s hardcoded `#dee2e6` border became
`var(--bs-border-color)` in the same change.

The BEFORE state is reproduced faithfully on the live fixed build by reverting
exactly the two declarations the fix changed (`text-body` → `text-dark` class
swap + the original hardcoded border) — see
[`test/visual/cookie-consent-contrast-evidence.mjs`](../../cookie-consent-contrast-evidence.mjs).
Ratios are measured in-page with the same WCAG 2.1 relative-luminance math as
the regression test (`test/visual/core/accessibility.spec.js`), because axe
reports every contrast check in this dialog as `incomplete` (the skin system's
`body::after` background image defeats its background resolution) and would
pass vacuously.

- `01-dark-before-after.png` — the privacy-rights panel in dark mode: invisible
  (1.00:1) before, readable (11.85:1) after.
- `02-light-before-after.png` — the same panel in light mode: the fix is a
  no-op there (15.43:1 both sides).
- `03-dark-full-modal.png` — the whole dialog in dark mode; also shows the
  `.cookie-category` borders switching from the hardcoded light-mode `#dee2e6`
  to `var(--bs-border-color)`.
- `metrics.json` — the measured fg/bg colours and ratios per mode.
