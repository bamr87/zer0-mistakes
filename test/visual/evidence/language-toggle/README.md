# Evidence — language toggle in the navbar (ZER0-078)

New-feature evidence (after-only — there is no "before" to revert): the multilingual language toggle added by `_includes/components/language-toggle.html`, captured on an English docs page that has a generated French translation. The French fixture was produced by the pipeline's offline stub provider (`ruby scripts/translate.rb --provider stub --only vendor-assets`), so no API credential is involved; visible `[fr]` markers are the stub's deterministic pseudo-translation, exercising exactly the code paths real Claude output flows through.

- `01-viewport-matrix.png` — the navbar band at 320→1440px: the toggle (translate icon + `EN` code from `xl` up) sits in the utility cluster next to search/settings and never clips or overflows the page (`metrics.json`: overflow 0px at every width).
- `02-configs.png` — toggle closed vs dropdown open at 1280px (the fixed-navbar crop truncates the open menu; see the close-up below).
- `03-dropdown-open.png` — close-up of the open menu: **English** is the active entry (`aria-current="true"`), **Français** is a real link to `/fr/docs/development/vendor-assets/` because the translation exists. On pages without a translation the entry renders disabled with a "Not yet translated" title instead — that state is pinned by `test/visual/features/language-toggle.spec.js`.

Regeneration steps are documented in `test/visual/language-toggle-evidence.mjs`.
