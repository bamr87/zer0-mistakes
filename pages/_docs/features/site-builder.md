---
title: "Site Builder (AI-Guided Setup Wizard — Claude or Grok)"
description: "The Site Builder reference covers its nine steps, the provider picker and bring-your-own token, guided and open sessions, the files it generates, the AI tools, the dev-proxy routes behind them, and the safety boundaries."
date: 2026-09-05T00:00:00.000Z
lastmod: 2026-09-07T00:00:00.000Z
layout: default
categories: [docs, features]
tags: [ai, claude, grok, xai, setup, onboarding, docker, proxy]
author: bamr87
permalink: /docs/features/site-builder/
keywords:
  - jekyll site builder wizard
  - jekyll setup wizard ai
  - site builder
  - setup wizard
  - claude code oauth
  - xai grok api key
  - bring your own ai key
  - jekyll scaffold
  - docker compose
difficulty: intermediate
estimated_reading_time: 15 minutes
prerequisites:
  - A local checkout of the theme
  - Node.js 20.6+ for the dev proxy, plus a Claude token (Claude Code CLI or an Anthropic API key) or an xAI key
sidebar:
  nav: docs
---

# Site Builder

The Site Builder is the theme's onboarding wizard. The form half runs anywhere the theme renders, GitHub Pages included. The AI half connects through the local dev proxy with **your own provider token — Claude (Anthropic) or Grok (xAI)** — and turns the wizard into an assisted build: the assistant sees every answer, proposes and applies values, checks the machine, reads the theme's source, writes the project, runs Docker, and, in an open session, modifies an existing site file by file and generates images for it.

## What you'll do

Use this reference to understand how the wizard is structured, connect a provider, choose between the guided steps and an open session, configure or extend a step, and see exactly what actions the AI session is permitted to take.

## Prerequisites

- The theme served locally (`docker compose up`) so `/setup/` renders. In production the page shows a notice unless `show_setup_wizard: true` is set.
- For the AI layer: Node.js 20.6+ and the dev proxy running. A token can be pasted on the Connect step or kept in `.env`: a Claude Code OAuth token (`claude setup-token`, Pro/Max), an Anthropic API key, or an xAI key from console.x.ai. An xAI key also unlocks image generation (Grok Imagine); an OpenAI key is an alternative image renderer.

## Where it renders

| Surface | Condition |
| --- | --- |
| `/setup/` (`pages/setup.html`) | `jekyll.environment == "development"` or `site.show_setup_wizard` |
| `welcome` layout | Any site that still needs setup (`site_needs_setup` from `components/setup-check.html`) |

## The nine steps

| Step | What it collects | The assistant's role |
| --- | --- | --- |
| Connect | Provider (Claude or Grok), a token for the session, model, image renderer, session mode | Greets once its provider has a credential |
| Prerequisites | Docker, Git, gh, VS Code, Node, Claude CLI | Runs the live checks, explains failures per OS |
| Identity | Brief, title, subtitle, tagline, description, owner, email | Drafts identity from the brief |
| URLs | GitHub user and repo, theme source, url, baseurl, permalink, port | Derives url and baseurl |
| Structure | Kind of site, collections, main navigation | Recommends collections and a menu |
| Appearance | Skin, color mode, lock, background layers, navbar icon | Picks a skin for the tone |
| Voice | Tone, audience, welcome post, about page | Writes both drafts in that voice |
| Integrations | Page feedback, Obsidian, Giscus, PostHog, AI chat, GA4, socials | Advises what fits |
| Build | Target folder, overwrite switch, or an existing site to open | Reviews files, writes the project, runs compose, checks the site; opens and modifies an existing site |

Steps, prerequisites, catalogs, providers, session modes and the framework brief all come from one data file, `_data/site_builder.yml`, so the form, the generators, and the AI prompt cannot drift apart.

## Choose your AI provider

The Connect step shows one card per provider from `_data/site_builder.yml` and asks the dev proxy which of them already have a key. The badge on each card reads the masked tail of that key and where it came from (`.env` or a token pasted this session).

| Control | What it does |
| --- | --- |
| Provider cards | Claude (Anthropic) or Grok (xAI). When the proxy pins `CHAT_PROVIDER`, the other card is locked. |
| Token field | Posts the token **once** to the localhost proxy, which keeps it in memory for the run, proves it with one cheap request, and reports it masked. The page never stores it and refuses to send it anywhere but `localhost`. **Forget it** drops it again. |
| Save to `.env` | Optional: the proxy writes the line into `.env` (mode 600) so it survives a restart. |
| Model | The provider's catalog (`claude-opus-4-8`, `claude-opus-5`, `claude-sonnet-5`, `claude-haiku-4-5`; `grok-4.6`, `grok-4.5`, `grok-4.3`). Read-only when the proxy pins `CHAT_MODEL` / `XAI_CHAT_MODEL`. |
| Image generation | Off, Grok Imagine (needs the xAI key) or OpenAI Images (needs `OPENAI_API_KEY`). |
| Session mode | Guided steps or an open session (below). |

Switching the provider also sets the generated site's `ai_chat.provider` on the Integrations step, and the image choice pre-configures `preview_images`, so the site you build is ready for the provider you used; `.env.example` lists the matching keys.

The proxy is authoritative: it decides which providers are configured, pins the provider and model when told to, and translates for xAI so the browser always speaks the Anthropic Messages dialect. The chat widget on every page gains the same choice (`ai_chat.provider`) — see [AI Chat Assistant](/docs/features/ai-chat-assistant/).

## Guided steps or an open session

**Guided** keeps the original flow: the assistant follows the nine steps, offers per-step prompts and fills each form in with a confirmation card.

**Open session** works like a coding session in a terminal. The steps stay available but optional: describe what you want, and the assistant chains tools — up to 24 rounds per turn — to build a new site from a brief, open a site that already exists under the target root, read and edit its files, add pages, generate images, run `jekyll build`, and report what changed. A **Stop** button interrupts a long run; any tool the run did not finish is answered for the model so the conversation stays well-formed. The mode and the provider, model and image choices are remembered in `localStorage`; a token never is.

## Modify an existing site

The Build step lists every site under the target root (folders holding a `_config.yml` or `docker-compose.yml`) — sites this builder wrote earlier, or any Jekyll site you copy there. **Open** (or the `open_project` tool) makes it the working project: the assistant gets its file tree in the system prompt and the project tools act inside it.

| Tool | Effect | Confirmation |
| --- | --- | --- |
| `list_projects`, `open_project` | Find and open a site | No |
| `list_project_files`, `read_project_file` | Depth-limited tree; read a text file | No |
| `write_project_file` | Create or replace one allow-listed text file (`overwrite: true` for existing) | Yes — shows the start of the content |
| `edit_project_file` | Replace an exact snippet that must be unique unless `all: true` | Yes — shows find and replace |
| `delete_project_file` | Remove one regular file | Yes |
| `run_project_command` | `git-status`, `git-diff`, `git-log`, `git-init` | No |
| `run_compose("build")` | `jekyll build` inside the running container, output in the Build terminal | No |

Every write is bounded by the same sandbox as the scaffold: relative paths only, allow-listed extensions, size caps, secrets and VCS paths denied, never inside the theme checkout.

## Image generation

`generate_image` renders with the selected image provider — Grok Imagine (`grok-imagine-image-2.0`) or OpenAI Images (`gpt-image-2`) — and saves the PNG/JPEG/WebP under the project's `assets/` folder (bytes are sniffed, 8 MB cap). The confirmation card shows the prompt, the target path and the model because it costs money; the result card shows a thumbnail served by the proxy. The tool returns the path so the assistant can wire it in: `preview:` front matter, `landing.hero.image` in the site plan, or an `<img>`. The Appearance step has a **Hero image with …** shortcut.

## Generated files

The preview panel shows every file live and regenerates on each keystroke. Any file can be overridden by hand or by Claude; overridden files carry a dot on their tab.

| File | Notes |
| --- | --- |
| `_config.yml` | Identity, URLs, collections with matching defaults, appearance, integrations with keys left empty (`ai_chat.provider` and, when chosen, `preview_images` set for your provider), exclude list |
| `_config_dev.yml` | Localhost URL, livereload, analytics off, full exclude list (Jekyll replaces rather than merges it) |
| `Gemfile` | Jekyll 4 plus `jekyll-remote-theme`, or the `jekyll-theme-zer0` gem |
| `docker-compose.yml` | `ruby:3.3` image, bundle cache volume, chosen port |
| `index.md` | Home page on the `home` layout with a latest-posts list |
| `_data/navigation/main.yml` | The navigation rows from the Structure step |
| `pages/_about/index.md`, `pages/_posts/<date>-welcome.md` | Voice-step drafts with front matter added |
| `pages/<collection>.md` | One index page per enabled collection on the `collection` layout (`cookbook` layout for `recipes`) |
| `pages/_docs/getting-started.md`, `pages/_quickstart/first-steps.md`, `pages/_notes/welcome-note.md`, `pages/_recipes/starter-recipe.md` | One valid starter document per enabled collection, showing the front matter that collection needs |
| `assets/images/logo.svg` | A monogram in the skin's colors, so the navbar never shows a broken logo (the published gem ships no theme images) |
| `.gitignore`, `.env.example`, `README.md` | Hygiene and a run/publish guide; `.env.example` lists the key for the chosen chat and image providers |
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
  provider: 'auto'             # auto | anthropic | xai — card preselected on Connect (the proxy decides what is configured)
  model: 'claude-opus-4-8'     # fallback when the proxy reports none; CHAT_MODEL / XAI_CHAT_MODEL win
  mode: 'guided'               # guided | open
  image_provider: ''           # '' | xai | openai — image renderer offered when its key exists
  max_tokens: 8192             # open sessions write whole files; the proxy's MAX_TOKENS_CAP still caps it
  default_port: 4000
```

Proxy-side variables: `CHAT_PROVIDER`, `CHAT_MODEL`, `XAI_CHAT_MODEL`, `XAI_API_KEY`, `OPENAI_API_KEY`, `IMAGE_PROVIDER`, `XAI_IMAGE_MODEL`, `OPENAI_IMAGE_MODEL`, `MAX_TOKENS_CAP`, `CHAT_DEV_ENV_FILE`.

## The AI session

Every turn sends a system prompt built from five parts: the framework brief from the data file, the field schema the wizard exposes, the current step's guidance (or the open-session brief), a summary of every answer, check result and generated file, and the working project's tree when one is open. Because the form is the single source of truth and the script only talks to it through `window.Zer0SetupWizard`, anything you type and anything the assistant applies is visible to both immediately.

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
| `write_site_files` | Scaffold the project (and open it as the working project) | Yes |
| `list_projects`, `open_project`, `list_project_files`, `read_project_file` | Find, open and read an existing site | No |
| `write_project_file`, `edit_project_file`, `delete_project_file` | Change one file in the working project | Yes |
| `run_project_command` | `git-status`, `git-diff`, `git-log`, `git-init` | No |
| `generate_image` | Render with Grok Imagine or OpenAI Images into `assets/` | Yes |
| `run_compose` | `up`, `ps`, `logs`, `down`, `config`, `build` | `up` and `down` |
| `check_site_live` | Probe the dev port | No |

The visible transcript is kept in `sessionStorage` as plain text turns only, so a restored conversation can never orphan a tool result.

## Dev-proxy routes

The routes live only in `templates/deploy/chat-proxy/dev-proxy.mjs` and are bounded by `wizard-store.mjs`. The Cloudflare Worker never has them.

| Route | Boundary |
| --- | --- |
| `GET /api/wizard/status` | Active provider (masked), provider and image catalogs, model pins, check ids, scaffold root, existing sites |
| `POST /api/wizard/credentials`, `DELETE …?provider=` | Session token: shape-checked, probed once upstream, memory only, masked in every reply; `.env` only on `persist: true` (mode 600) |
| `POST /api/wizard/check` | Fixed command table keyed by id; emails redacted from output |
| `GET /api/wizard/file`, `GET /api/wizard/ls` | Inside the theme checkout; secrets, VCS, vendored and build directories denied; text extensions only |
| `POST /api/wizard/target`, `POST /api/wizard/scaffold` | Strict sub-directory of `WIZARD_TARGET_ROOT` (default: the theme's parent), never inside the theme, allow-listed names, size caps, no overwrite unless requested |
| `POST /api/wizard/compose` | Only `up -d --build`, `ps`, `logs`, `down`, `config`, `build`, in a folder that already holds `docker-compose.yml` |
| `GET /api/wizard/projects`, `GET /api/wizard/project/{ls,file,tree}` | Sites under the target root; reads inside one of them with the theme denylist and text-only rules |
| `POST /api/wizard/project/{write,edit,delete,command}` | One allow-listed text file per call, unique-snippet edits, files only, a fixed git table |
| `POST /api/wizard/image`, `GET /api/wizard/asset` | PNG/JPEG/WebP under `assets/` only, bytes sniffed, 8 MB cap |

Environment: `WIZARD_TARGET_ROOT`, `WIZARD_DISABLE_COMPOSE=1`, `CHAT_DEV_ENV_FILE`.

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

1. Start the theme and the proxy, open `/setup/`, pick a provider, paste a token (or rely on `.env`) and confirm the badge reads **Claude connected** or **Grok connected**.
2. Press **Run checks** on the Prerequisites step and confirm each row changes state.
3. Type a brief, press **Draft with Claude**, and confirm a card asks before fields change.
4. On Build, press **Check**, **Write project**, then **docker compose up**; the terminal streams the build and **Open site** loads the new site.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Panel stays **offline** | The proxy is not running or not on port 8787; check its console for `listening on`. It no longer needs a credential to start. |
| Badge reads **needs a token** | The proxy is up but the selected provider has no key: paste one on the Connect step, or switch to the provider that has one. |
| The token is rejected | The proxy probes it once before keeping it. For Claude re-run `claude setup-token`; for Grok create a fresh key at console.x.ai. |
| `generate_image` says no provider is ready | Choose an image renderer on Connect and paste the matching key (an xAI key covers Grok chat and Grok Imagine). |
| Target rejected | Folder names use letters, digits, dot, dash and underscore only and must sit under the target root. |
| Files skipped on write | They already exist; enable **Allow replacing files** or pick a new folder. |
| Compose disabled | `WIZARD_DISABLE_COMPOSE=1` was set when the proxy started. |
| `all predefined address pools have been fully subnetted` on `docker compose up` | Every generated site creates a Docker network; after many builds run `docker network prune` (removes only unused networks) or `docker compose down` in old project folders. |
| `Bind for 0.0.0.0:<port> failed` | Another generated site still holds that port; stop it (`docker compose down` in its folder) or pick a different **Dev port** on the URLs step. |

## Related

- [Site Builder quickstart](/quickstart/site-builder/) is the walkthrough for first-time users.
- [AI Chat Assistant](/docs/features/ai-chat-assistant/) documents the shared proxy and its auth modes.
- [Machine Setup](/quickstart/machine-setup/) is the manual reference for the Prerequisites step.
