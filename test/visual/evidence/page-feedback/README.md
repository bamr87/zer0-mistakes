# Evidence — page-feedback capture widget

Proof for the new runtime **"Improve this page"** widget (`_includes/components/page-feedback.html` + `assets/js/page-feedback.js`, with the early log buffer in `_includes/core/console-capture.html`). It replaces the build-time **"Copilot Agent"** dropdown that used to live in `content/intro.html`.

## Before → after

**BEFORE** (build-time): a Liquid dropdown baked the *entire* issue body — a page-context table plus a ~1–2 KB agent prompt from `_data/prompts.yml` — into every `<a href>` at Jekyll build time, ×10 templates. Consequences:

- It could **not** capture any runtime state — no console logs, no browser/OS,
no viewport, no real URL/hash. (There is no runtime state to screenshot for it, which is why BEFORE is described rather than pictured.)
- Its `labels=ai-agent` **doesn't exist in the repo**, so GitHub silently
  dropped it and the issues landed unlabeled.
- Pre-baked mega-URLs risked the browser/GitHub URL-length ceiling.

**AFTER** (runtime): a focused dialog captures the request type + description + live page context + a buffered console/error log, builds a compact issue with **labels that exist**, guards the URL length (clipboard fallback), and opens the GitHub prefill — with an optional AI clarify/prioritize step in between.

| Image | What it shows |
| --- | --- |
| `01-fab.png` | The global feedback FAB (bottom-left), coexisting with the AI-chat FAB (bottom-right) on a normal page. |
| `02-modal-open.png` | The dialog: request types grouped into **This page** / **The site** (9 types from `_data/feedback_types.yml`), "Report a problem" selected, description filled. |
| `03-context-and-logs.png` | **The headline capability.** "What gets attached" expanded: page/URL/source, and the **real console output captured since page load** ("Include 9 captured console/error line(s)"), with the privacy note and the opt-out checkbox. The **Analyze with AI** panel sits below. |
| `04-ai-panel.png` | The optional AI-review panel — wired to the chat proxy via Claude Code OAuth (`/api/feedback`); it clarifies, prioritizes, and suggests labels before filing. Degrades silently to the base prefill when no proxy is deployed. |
| `05-mobile-sheet.png` | 375 px phone: the dialog becomes a bottom sheet; the type grid collapses to one column. |

## Metrics (`metrics.json`)

The AFTER numbers behind the pictures, asserted by the regression spec [`test/visual/features/page-feedback.spec.js`](../../features/page-feedback.spec.js) (5 tests, green on Chromium):

- `repository`: `bamr87/zer0-mistakes` — resolved from `site.repository`, never hardcoded.
- `requestTypes`: 9.
- `exampleLabels` (fix-page): `["page-feedback", "bug"]` — **both exist in the repo**
  (contrast the old `ai-agent`, which did not). `page-feedback` was created for this channel.
- `issueUrlLength`: ~2.3 KB for a real report *with logs* — comfortably under the 7 KB guard.
- `bodyIncludesPageContext` / `bodyIncludesLogs`: `true`.

`example-issue-url.txt` is the exact pre-filled `github.com/.../issues/new` URL the widget produced for the screenshotted report (title + body + `labels` + `assignees=copilot`).

## Regenerate

```bash
# with the dev server up (see the run-zer0-mistakes skill):
BASE_URL=http://localhost:4000 node test/visual/page-feedback-evidence.mjs
```
