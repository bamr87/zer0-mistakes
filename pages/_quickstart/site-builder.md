---
title: "Site Builder: Guided Setup with Claude"
author: "Zer0-Mistakes Development Team"
layout: default
description: "The Site Builder walks you through nine steps, from prerequisites to a running zer0-mistakes site, with Claude checking your machine and starting Docker."
permalink: /quickstart/site-builder/
categories: [Documentation, Quick Start]
tags: [setup, wizard, claude, docker, ai-powered]
keywords:
  - jekyll site builder
  - guided jekyll setup
  - claude code oauth
  - docker compose
  - zer0-mistakes wizard
date: 2026-09-05T00:00:00.000Z
lastmod: 2026-09-05T00:00:00.000Z
draft: false
sidebar:
  nav: quickstart
quickstart:
  next: /quickstart/machine-setup/
  prev: /quickstart/
mermaid: true
---

# Site Builder

The Site Builder is a nine-step wizard that takes you from an empty folder to a personalized, running zer0-mistakes site. It lives at `/setup/` on any local build of the theme and on the welcome screen of a fresh remote-theme site. An embedded Claude session sits beside every step: it can read your answers, fill in the forms, check your machine, read the theme's real source code, write the generated project to disk, and start Docker.

```mermaid
flowchart LR
    A([Connect]) --> B[Prerequisites]
    B --> C[Identity]
    C --> D[URLs]
    D --> E[Structure]
    E --> F[Appearance]
    F --> G[Voice]
    G --> H[Integrations]
    H --> I([Build & launch])
```

## What you'll do

Open the wizard, connect Claude through the local dev proxy, answer a handful of questions, and leave with a project folder that serves at `http://localhost:4000` and is ready to push to GitHub Pages.

## Prerequisites

- A local checkout of the theme with its dev server running (`docker compose up` in the theme repository), or any site that uses the `welcome` layout.
- Node.js 20.6 or newer, for the dev proxy that connects Claude.
- The Claude Code CLI signed in to a Claude Pro or Max account, so `claude setup-token` can mint a token. Without it the wizard still works; only the Claude panel and the one-click build actions stay off.
- Docker Desktop, Git, and the GitHub CLI for the site you are about to build. The Prerequisites step checks these for you and shows the install command for your operating system.

## Walk through the wizard

The wizard has nine steps; this walkthrough groups them into six passes.

### Connect

Open `http://localhost:4000/setup/`. The Connect step looks for the dev proxy and shows three commands when it is not running:

```bash
claude setup-token                                           # prints sk-ant-oat01-…
echo 'CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-…' >> .env        # git-ignored, theme root
node --env-file=.env templates/deploy/chat-proxy/dev-proxy.mjs
```

The page re-checks every fifteen seconds. Once the badge in the Claude panel turns green, the composer unlocks and the panel greets you. The token never reaches the browser: the proxy holds it and the page only talks to `http://localhost:8787`.

### Prerequisites

Press **Run checks**. The proxy runs a fixed list of read-only version commands (Docker, the Docker engine, Git and its identity, the GitHub CLI and its login, VS Code, Node, the Claude CLI) and the checklist turns green or red per tool. Pick your operating system to see the matching install command, or ask Claude to explain what is missing. Offline, tick each item as you install it.

### Identity, URLs and Structure

Describe your site in the brief box and press **Draft with Claude**. Claude proposes a title, subtitle, tagline and description and applies them after you confirm on the inline card. Fill in your GitHub username and repository, press **Suggest** to derive the site URL and base path, then pick a kind of site to preselect collections and a navigation menu you can edit row by row.

### Appearance and Voice

Choose one of the seven skins and preview it on the page you are looking at, set the color mode, and pick a tone and audience. **Draft both with Claude** writes the welcome post and about page in that voice; both are plain Markdown you can edit before they become files.

### Integrations

Switch on what you want: the improve-this-page widget, Obsidian wiki-links, Giscus comments, PostHog analytics, or the AI chat assistant. Nothing sends data until you add an ID or key, and keys never go in `_config.yml`.

### Build

Every generated file is in the preview panel the whole time. Enter a project folder name, press **Check** to see where it will be created, then **Write project**. Press **docker compose up** and watch the build in the terminal panel. When Jekyll reports it is serving, **Open site** takes you to the new site. Without the proxy, download the bundle and run it:

```bash
bash zer0-site-bundle.sh my-site
cd my-site && docker compose up
```

## Verify

- The Claude panel badge reads **connected** and the Build step buttons are enabled.
- `docker compose ps` in the new folder shows a running `jekyll` service.
- `http://localhost:4000/` (or the port you chose) renders your title, skin and welcome post.
- `zer0.install.yml` in the new folder records your answers so the installer can replay them.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Badge stays **offline** | Confirm the proxy printed `listening on http://localhost:8787`. It refuses to start without `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` in `.env`. |
| **Write project** says the target is not allowed | New sites go under the theme's parent folder by default. Set `WIZARD_TARGET_ROOT=/path` when starting the proxy to change that. |
| `docker compose up` fails on the first run | The first build installs gems and can take several minutes. Press **Logs**; Claude can read them and explain the error. |
| Chat says the credential was rejected | Re-run `claude setup-token`, update `.env`, and restart the proxy. |
| Port 4000 is already in use | Change **Dev port** on the URLs step before writing the project, or stop the other server. |

## Related

- [Machine Setup](/quickstart/machine-setup/) is the manual reference behind the Prerequisites step.
- [Site Builder feature reference](/docs/features/site-builder/) documents the tools, the proxy routes, and the safety model.
- [AI Chat Assistant](/docs/features/ai-chat-assistant/) explains the proxy the builder reuses.

---

<div class="d-flex justify-content-between mt-5">
  <a href="/quickstart/" class="btn btn-outline-secondary">
    <i class="bi bi-arrow-left"></i> Back: Quick Start Overview
  </a>
  <a href="/quickstart/machine-setup/" class="btn btn-primary">
    Next: Machine Setup <i class="bi bi-arrow-right"></i>
  </a>
</div>
