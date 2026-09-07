---
title: "Site Builder (Claude-Guided Setup Wizard)"
description: "The Site Builder reference covers its nine steps, the files it generates, the Claude tools, the dev-proxy routes behind them, and the safety boundaries."
date: 2026-09-05T00:00:00.000Z
lastmod: 2026-09-05T00:00:00.000Z
layout: default
categories: [docs, features]
tags: [ai, claude, setup, onboarding, docker, proxy]
author: bamr87
permalink: /docs/features/site-builder/
keywords:
  - jekyll site builder wizard
  - jekyll setup wizard ai
  - site builder
  - setup wizard
  - claude code oauth
  - jekyll scaffold
  - docker compose
difficulty: intermediate
estimated_reading_time: 12 minutes
prerequisites:
  - A local checkout of the theme
  - Node.js 20.6+ and the Claude Code CLI for the AI layer
sidebar:
  nav: docs
---

# Site Builder

The Site Builder is the theme's onboarding wizard. The form half runs anywhere the theme renders, GitHub Pages included. The Claude half connects through the local dev proxy and turns the wizard into an assisted build: Claude sees every answer, proposes and applies values, checks the machine, reads the theme's source, writes the project, and runs Docker.

## What you'll do

Use this reference to understand how the wizard is structured, configure or extend a step, and see exactly what actions the Claude session is permitted to take.

## Prerequisites

- The theme served locally (`docker compose up`) so `/setup/` renders. In production the page shows a notice unless `show_setup_wizard: true` is set.
- For the AI layer: Node.js 20.6+, a Claude Code OAuth token in `.env`, and the dev proxy running.

## Where it renders

| Surface | Condition |
| --- | --- |
| `/setup/` (`pages/setup.html`) | `jekyll.environment == "development"` or `site.show_setup_wizard` |
| `welcome` layout | Any site that still needs setup (`site_needs_setup` from `components/setup-check.html`) |

## The nine steps

| Step | What it collects | Claude's role |
| --- | --- | --- |
| Connect | Nothing; detects the dev proxy | Greets once connected |
| Prerequisites | Docker, Git, gh, VS Code, Node, Claude CLI | Runs the live checks, explains failures per OS |
| Identity | Brief, title, subtitle, tagline, description, owner, email | Drafts identity from the brief |
| URLs | GitHub user and repo, theme source, url, baseurl, permalink, port | Derives url and baseurl |
| Structure | Kind of site, collections, main navigation | Recommends collections and a menu |
| Appearance | Skin, color mode, lock, background layers, navbar icon | Picks a skin for the tone |
| Voice | Tone, audience, welcome post, about page | Writes both drafts in that voice |
| Integrations | Page feedback, Obsidian, Giscus, PostHog, AI chat, GA4, socials | Advises what fits |
| Build | Target folder, overwrite switch | Reviews files, writes the project, runs compose, checks the site |

Steps, prerequisites, catalogs and the framework brief all come from one data file, `_data/site_builder.yml`, so the form, the generators, and the AI prompt cannot drift apart.

## Generated files

The preview panel shows every file live and regenerates on each keystroke. Any file can be overridden by hand or by Claude; overridden files carry a dot on their tab.

| File | Notes |
| --- | --- |
| `_config.yml` | Identity, URLs, collections with matching defaults, appearance, integrations with keys left empty, exclude list |
| `_config_dev.yml` | Localhost URL, livereload, analytics off, full exclude list (Jekyll replaces rather than merges it) |
| `Gemfile` | Jekyll 4 plus `jekyll-remote-theme`, or the `jekyll-theme-zer0` gem |
| `docker-compose.yml` | `ruby:3.3` image, bundle cache volume, chosen port |
| `index.md` | Home page on the `home` layout with a latest-posts list |
| `_data/navigation/main.yml` | The navigation rows from the Structure step |
| `pages/_about/index.md`, `pages/_posts/<date>-welcome.md` | Voice-step drafts with front matter added |
| `pages/<collection>.md` | One index page per enabled collection on the `collection` layout (`cookbook` layout for `recipes`) |
| `pages/_docs/getting-started.md`, `pages/_quickstart/first-steps.md`, `pages/_notes/welcome-note.md`, `pages/_recipes/starter-recipe.md` | One valid starter document per enabled collection, showing the front matter that collection needs |
| `assets/images/logo.svg` | A monogram in the skin's colors, so the navbar never shows a broken logo (the published gem ships no theme images) |
| `.gitignore`, `.env.example`, `README.md` | Hygiene and a run/publish guide |
| `zer0.install.yml` | Your answers, replayable by `scripts/bin/install` |

**Download file** saves the active file. **Download bundle** saves `zer0-site-bundle.sh`, a self-extracting bash script that recreates the whole tree in a folder you name.

## The site plan (schema-driven output)

Beyond the form fields, the agent produces a **site plan**: a structured description of the landing page, the navigation shape, theme overrides and example pages. The plan is validated against `plan_schema` in `_data/site_builder.yml` (a JSON-Schema subset: `type`, `properties`, `required`, `additionalProperties`, `enum`, `enumFrom` a catalog, `items`, `maxItems`, `maxLength`, `pattern`) before anything changes, and the generators turn it into files. Every option the agent can pick comes from a catalog in the same data file, so adding a palette, a font pairing, a landing template or a section type is a data change.

| Plan key | Options | Becomes |
| --- | --- | --- |
| `landing.template` | `minimal`, `hero`, `showcase`, `docs-hub`, `editorial` | `index.md` on the `home` layout running a small Liquid landing engine, plus `_data/landing.yml` holding the copy |
| `landing.hero` | eyebrow, headline, subheadline, align, variant, up to three CTAs | The hero block of `_data/landing.yml` |
| `landing.sections[]` | `features`, `cards`, `steps`, `stats`, `faq`, `cta`, `latest_posts`, `quote`, `text` | Sections rendered through the theme's `section` include with Bootstrap cards, accordions and CTA buttons |
| `navigation.style` | `flat`, `grouped` | `_data/navigation/main.yml`; grouped turns collections into dropdowns of their planned pages |
| `navigation.sidebar` | `none`, `auto`, `docs` | `sidebar: {nav: auto}` in `_config.yml`, or a curated `_data/navigation/docs.yml` wired to the docs collection |
| `theme.palette` | nine presets or `custom` with three hex colors | `assets/css/user-overrides.css`, layered over the skin (primary, links, accent, buttons) |
| `theme.fonts` | seven pairings (system + six Google Fonts pairs) | `user-overrides.css` font variables plus `_includes/custom/head.html`, the theme's end-of-head hook |
| `theme.radius` | `sharp`, `soft`, `round` | `user-overrides.css` radius tokens |
| `pages[]` | collection, slug, title, description, date, categories, tags, Markdown body | One file per page under `pages/_<collection>/` |

Template defaults fill in whatever the plan leaves out, so a plan with only `landing.template: showcase` still yields a complete landing page whose copy is derived from the brief and collections. The Structure step exposes the same choices as controls (navigation style, sidebar, landing template, a page planner) and the Appearance step exposes palette cards, a font pairing with live preview, and corner radius; **Preview on this page** applies the generated overrides to the wizard itself. Claude submits plans with `set_site_plan`; the browser shows a confirmation card listing what changes and rejects anything the schema does not allow, returning the errors to the model.

## Configuration

```yaml
site_builder:
  enabled: true
  endpoint: '/api/wizard'      # dev proxy base; _config_dev.yml sets http://localhost:8787/api/wizard
  chat_endpoint: ''            # '' reuses ai_chat.endpoint
  model: 'claude-opus-4-8'     # default; the proxy's CHAT_MODEL overrides it server-side
  max_tokens: 4096
  default_port: 4000
```

## The Claude session

Every turn sends a system prompt built from four parts: the framework brief from the data file, the field schema the wizard exposes, the current step's guidance, and a summary of every answer, check result and generated file. Because the form is the single source of truth and the script only talks to it through `window.Zer0SetupWizard`, anything you type and anything Claude applies is visible to both immediately.

Tools available to the model:

| Tool | Effect | Confirmation |
| --- | --- | --- |
| `get_wizard_state`, `get_generated_file` | Read state or a file | No |
| `set_wizard_fields` | Patch fields, collections, navigation | Yes |
| `get_site_plan`, `set_site_plan` | Read or apply the schema-validated site plan (landing, navigation, theme overrides, pages) | `set_site_plan`: yes |
| `set_file_override` | Replace one generated file | Yes |
| `go_to_step` | Navigate | No |
| `run_prerequisite_check` | Allow-listed check via the proxy | No |
| `read_theme_file`, `list_theme_dir` | Read theme source via the proxy | No |
| `search_theme_docs` | Query the site's `search.json` | No |
| `resolve_target` | Inspect the project folder | No |
| `write_site_files` | Scaffold the project | Yes |
| `run_compose` | `up`, `ps`, `logs`, `down`, `config` | `up` and `down` |
| `check_site_live` | Probe the dev port | No |

The visible transcript is kept in `sessionStorage` as plain text turns only, so a restored conversation can never orphan a tool result.

## Dev-proxy routes

The routes live only in `templates/deploy/chat-proxy/dev-proxy.mjs` and are bounded by `wizard-store.mjs`. The Cloudflare Worker never has them.

| Route | Boundary |
| --- | --- |
| `GET /api/wizard/status` | Auth mode, model, check ids, scaffold root |
| `POST /api/wizard/check` | Fixed command table keyed by id; emails redacted from output |
| `GET /api/wizard/file`, `GET /api/wizard/ls` | Inside the theme checkout; secrets, VCS, vendored and build directories denied; text extensions only |
| `POST /api/wizard/target`, `POST /api/wizard/scaffold` | Strict sub-directory of `WIZARD_TARGET_ROOT` (default: the theme's parent), never inside the theme, allow-listed names, size caps, no overwrite unless requested |
| `POST /api/wizard/compose` | Only `up -d --build`, `ps`, `logs`, `down`, `config`, in a folder that already holds `docker-compose.yml` |

Environment: `WIZARD_TARGET_ROOT` and `WIZARD_DISABLE_COMPOSE=1`.

## Validate a build end to end

Because the agent's answers are not deterministic, the wizard ships a scenario runner rather than a fixed transcript. It samples a realistic brief, author, tone, skin, color mode and integrations for a site type, drives the whole wizard in a real browser with video recording on, accepts Claude's confirmation cards, writes the project, starts it with Docker, and asserts structural facts about the result: the expected files exist, the site answers on every route for that type, and it carries the chosen title and skin.

```bash
# theme on :4000, dev proxy on :8787
node test/visual/site-builder-walkthrough.mjs                       # one random scenario
SCENARIO=cookbook SEED=42 node test/visual/site-builder-walkthrough.mjs
SCENARIO=all COUNT=6 SITE_PORT=4100 node test/visual/site-builder-walkthrough.mjs
```

Scenarios live in `test/visual/site-builder-scenarios.mjs` (`blog`, `docs`, `cookbook`, `portfolio`, `garden`, `mixed`). Each run prints its seed and writes `report.md`, `report.json`, screenshots and `video-desktop.webm` under `test/visual-results/site-builder-walkthrough/<timestamp>/`. When the assistant is unavailable the runner records those checks as failed, fills deterministic stand-ins, and still exercises the build. Generated sites use `SITE_PORT + 10·i` with LiveReload on the next port, so they run beside the theme's own dev server.

## Verify

1. Start the theme and the proxy, open `/setup/`, and confirm the badge reads **connected**.
2. Press **Run checks** on the Prerequisites step and confirm each row changes state.
3. Type a brief, press **Draft with Claude**, and confirm a card asks before fields change.
4. On Build, press **Check**, **Write project**, then **docker compose up**; the terminal streams the build and **Open site** loads the new site.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Panel never connects | The proxy exits without a credential; check `.env` and the proxy's console for `listening on`. |
| Target rejected | Folder names use letters, digits, dot, dash and underscore only and must sit under the target root. |
| Files skipped on write | They already exist; enable **Allow replacing files** or pick a new folder. |
| Compose disabled | `WIZARD_DISABLE_COMPOSE=1` was set when the proxy started. |
| `all predefined address pools have been fully subnetted` on `docker compose up` | Every generated site creates a Docker network; after many builds run `docker network prune` (removes only unused networks) or `docker compose down` in old project folders. |
| `Bind for 0.0.0.0:<port> failed` | Another generated site still holds that port; stop it (`docker compose down` in its folder) or pick a different **Dev port** on the URLs step. |

## Related

- [Site Builder quickstart](/quickstart/site-builder/) is the walkthrough for first-time users.
- [AI Chat Assistant](/docs/features/ai-chat-assistant/) documents the shared proxy and its auth modes.
- [Machine Setup](/quickstart/machine-setup/) is the manual reference for the Prerequisites step.
