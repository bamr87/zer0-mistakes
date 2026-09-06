# Evidence — the Claude-guided Site Builder (ZER0-086, extends ZER0-067)

`/setup/` grew from a five-step `_config.yml` form into a nine-step Site Builder with an embedded Claude session that can fill in the form, check the machine, read the theme's source, write the generated project and start Docker. This bundle is the **after** state, captured against the live dev server with the dev proxy connected (Claude Code OAuth). The **before** — the five-step form with a single YAML preview — is documented in [`../setup-wizard-nav-alignment/`](../setup-wizard-nav-alignment/README.md) (PR #432); it had no Connect, Prerequisites, Appearance, Voice or Build step and no way to act on the machine, so there is no runtime state of it to screenshot here.

Regenerate with the site on `:4000` and the proxy on `:8787`:

```bash
BASE_URL=http://localhost:4000 node test/visual/site-builder-evidence.mjs
```

## What each image shows

| Image | What it proves |
| --- | --- |
| `01-connect-online.png` | Connect step with the proxy detected: green status, auth mode and scaffold root shown; the Claude panel greets and offers the step's prompts. Offline, the same block shows the three commands to connect. |
| `02-prerequisites.png` | Live checks through the fixed command table: every required row turned green (`5 of 5 required ready`), two recommended rows toggled by hand, per-OS install commands with copy buttons. |
| `03-identity.png` | Brief, title, subtitle, description (with the 160-char counter), owner and email; the preview's `_config.yml` reflects them as typed. |
| `04-urls.png` | GitHub user + repo, then **Suggest** derived `url: https://samrivera.github.io` and `baseurl: /postgres-in-production`. |
| `05-structure.png` | The "Blog + docs" quick-pick preselected `posts`, `docs`, `about` and rebuilt the navigation editor (4 rows). |
| `06-appearance-preview-aqua.png` | Skin cards with gradient swatches; **Preview on this page** set `data-theme-skin="aqua"` on `<html>` so the page itself re-skins. |
| `07-voice-welcome-post.png` | Tone/audience and the welcome-post draft, with the preview tab switched to `pages/_posts/<date>-welcome.md` showing the front matter the generator added. |
| `08-integrations.png` | Integration switches; enabling Giscus reveals its ID sub-fields. Keys are never emitted into `_config.yml`. |
| `09-build.png` | Build step: every recommended field filled, project folder resolved through the proxy (`… — will be created.`), and the proxy-gated actions enabled. |
| `10-write-confirmation-card.png` | The confirmation card listing all 14 files before anything is written. |
| `11-project-written.png` | Result card: `14 written, 0 skipped` into the target, with a one-click `docker compose up`. |
| `12-mobile-appearance.png` | 390px stack: stepper as a wrapped row, side column below the form, `mobileOverflow: 0`. |

## Metrics (`metrics.json`)

| Metric | Value |
| --- | --- |
| Steps | 9 |
| Generated files | 14 (`_config.yml`, `_config_dev.yml`, `Gemfile`, `docker-compose.yml`, `index.md`, `_data/navigation/main.yml`, about page, welcome post, `pages/posts.md`, `pages/docs.md`, `.gitignore`, `zer0.install.yml`, `.env.example`, `README.md`) |
| Required prerequisites reported ready by live checks | 5 of 5 |
| Files written through the proxy | 14 written, 0 skipped |
| Horizontal overflow at 390px | 0px |

## What the run also caught

The first pass failed before the Prerequisites screenshot: the Build step's unbreakable command lines widened the middle grid column past its track (a grid item's default `min-width: auto`), so the side column overlapped it and intercepted clicks. `.wizard-panes`, its panes and the step cards now carry `min-width: 0`, and the prerequisites list is capped at `30rem` so the shared grid row is not dominated by the tallest step. The setup page also opts out of the default layout's sidebars (`sidebar: false`) and duplicate intro banner (`hide_intro: true`), which is why the wizard has the full content width in these captures.

Regression coverage: `test/visual/features/setup-wizard.spec.js` (15 tests, `@critical`) and `test/test_wizard_store.mjs` (proxy sandbox rules).
