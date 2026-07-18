# Evidence — machine-generated French page (ZER0-078)

Companion to [`../language-toggle/`](../language-toggle/README.md): the same docs page served from its GENERATED French twin at `/fr/docs/development/vendor-assets/`, produced by `scripts/translate.rb` with the offline stub provider (deterministic `[fr]` markers instead of real French — same pipeline, no API credential).

- `01-viewport-matrix.png` — the full page at 320→1280px, overflow 0px everywhere.
- `02-configs.png` — the full French page at 1280px with the toggle open: **Français** is the active entry and **English** links back to the original. Note, top to bottom: `<html lang="fr">` chrome (search/settings labels resolved from the generated `_data/i18n/fr.yml`), the machine-translation disclosure banner linking to the English original, translated title/description/headings/TOC, and — the safety property that matters — every fenced code block (`npm install`, file paths, commands) byte-identical to the source while every prose segment carries the translation marker.

Regeneration steps are documented in `test/visual/language-toggle-evidence.mjs`.
