# A site the Grok path actually built, from an empty folder

These are not mock-ups. They are `http://localhost:4300` — a Jekyll site that did not exist twenty minutes before the screenshots, created end to end through the xAI provider path on a machine with no `XAI_API_KEY`:

1. The dev proxy started with **no credential at all**.
2. The Connect step took an xAI key for the session, probed it upstream, and reported it masked.
3. One brief in an open session produced 22 wizard fields, a site plan (landing template, hero, three sections, grouped navigation, midnight palette on the aqua skin, five pages), and **24 files written** into a fresh folder.
4. `docker compose up -d --build` on an **empty gem cache** installed the bundle and served the site in **33 seconds**.
5. A second turn rendered a hero image into `assets/`, wired it into `_data/landing.yml` and `index.md`, added a post, restarted the container and ran `jekyll build` inside it — all behind confirmation cards.

Every model turn came from a local Grok-compatible stand-in (`scratchpad/grok-standin.mjs`) speaking the exact wire protocol the proxy's xAI path expects — streaming `chat.completion.chunk` tool calls, `/v1/models`, `/v1/images/generations`. The proxy's translation, the sandbox, the tool loop, Docker and Jekyll are all real; only the model's judgement is scripted, and the prose in the site was written by hand in that file. Nothing here is Grok's writing.

| File | What it shows |
| --- | --- |
| `01-home.png` | The landing page: planned hero copy, and the generated 1200×630 PNG the image tool wrote into `assets/images/hero.png` |
| `02-posts.png` | The posts index, including the post added *after* the site was already running |
| `03-doc.png` | A planned docs page with the docs sidebar |
| `04-home-mobile.png` | The same landing page at 390px |
| `report.json` | All 29 assertions, the route status map, and the timings |

## What this run found

`01-home.png` is the **before** state of a defect it surfaced: the second call to action ("Build a station") is nearly invisible. `components/cta-button.html` mapped `variant: outline` to `btn-outline-light` — white on white — and the wizard's own default CTAs use `outline` on a light hero, so *every* generated site shipped an unreadable button. `outline` is now an outlined primary button, `outline-light` is the explicit dark-surface variant, and the generated landing engine picks between them based on `hero.variant`. The theme change reaches an existing generated site only after release, because those sites pull `remote_theme` from `main`.

Four other defects came out of the same run and are fixed in this PR: a planned `landing.hero.image` was never rendered, a partial hero patch wiped the rest of the hero, the 15-second status poll handed the composer back mid-turn, and a newly added post was invisible because the generated dev config enabled incremental regeneration. Each has a regression test; see the changelog.
