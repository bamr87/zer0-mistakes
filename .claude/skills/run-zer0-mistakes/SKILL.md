---
name: run-zer0-mistakes
description: >-
  Build, launch, serve, and screenshot the zer0-mistakes Jekyll theme site
  locally. Use when asked to run/start/serve/preview the site or theme, take a
  screenshot of a page, smoke-test routes, or confirm a layout/include/sass
  change renders in the real running site (not just tests). Drives the live
  Jekyll server at localhost:4000 with a headless Chromium driver.
---

# Run zer0-mistakes

`zer0-mistakes` is a Docker-first Jekyll theme. The "app" is the rendered static site: Docker Compose runs `jekyll serve` and serves it at **http://localhost:4000** with live reload. You drive that running site with a headless-Chromium driver — [`driver.mjs`](.claude/skills/run-zer0-mistakes/driver.mjs) — which navigates a route, optionally applies a theme skin, screenshots it, and prints a JSON smoke summary (HTTP status, `<title>`, `<h1>`, navbar present, console errors).

**All paths below are relative to the repo root** (the worktree root). The driver lives at `.claude/skills/run-zer0-mistakes/driver.mjs`.

## Prerequisites

- **Docker Desktop running** (`docker ps` must work). Serving is Docker-only —
  see Gotchas for why you should not use the host's `bundle exec jekyll serve`.
- **Node.js** (tested with v25) and the project's Playwright install. In a fresh
  clone, install it once:
  ```bash
  npm install                       # installs @playwright/test
  npx playwright install chromium   # downloads the Chromium browser
  ```
The driver imports `@playwright/test`; Node resolves it from the repo's `node_modules` (works from the worktree via upward resolution).

## Launch the server

**First, check whether it's already running** — this is the common case and the fastest path:

```bash
docker ps --format '{{.Names}}\t{{.Status}}' | grep jekyll   # any *-jekyll-1 up?
curl -sf -o /dev/null -w '%{http_code}\n' http://localhost:4000/   # 200 = ready
```

If a `*-jekyll-1` container is up and `:4000` returns `200`, the site is live — skip to the driver.

Otherwise launch it:

```bash
docker compose up --build           # build image + serve at :4000
```

First build pulls `ruby:3.3-slim` and installs the heavy `dev-test` toolchain (ImageMagick, libvips, Mermaid CLI, Jupyter) — budget **5–10 minutes** (base gem install alone is ~2.5 min). On Apple Silicon the image runs emulated (`platform: linux/amd64`), slower but fine. Jekyll also rebuilds the site on every container start, so allow ~30–60 s after the container is up before `:4000` answers. Wait for it (run in another shell, or background the `up`):

```bash
until curl -sf -o /dev/null http://localhost:4000/; do sleep 3; done; echo up
```

**First-run caveat (verified the hard way):** the compose project is named after the current directory, so a **git worktree gets its own compose project** with its own *empty* `bundle_cache` named volume. That empty volume shadows the gems baked into the image at `/usr/local/bundle`, so the entrypoint's
`bundle check || bundle install` falls through to `bundle install` — which needs
**network access** the first time. With no network it dies with `Could not reach host index.rubygems.org` and exits 17. Run the first `up` with network, or reuse the main checkout's already-warmed container (see Gotchas).

## Run (agent path) — the driver

Point the driver at the running server. Screenshots default to `/tmp/zer0-*.png`.

```bash
# Screenshot the homepage -> /tmp/zer0-home.png, prints JSON summary
node .claude/skills/run-zer0-mistakes/driver.mjs --out /tmp/zer0-home.png

# Any route
node .claude/skills/run-zer0-mistakes/driver.mjs --path /about/config/ --out /tmp/config.png

# Apply one of the 9 theme skins before the shot (signature feature)
node .claude/skills/run-zer0-mistakes/driver.mjs --skin neon --out /tmp/neon.png
#   skins: air aqua contrast dark dirt neon mint plum sunrise

# Multi-route smoke: visits / /about/config/ /about/stats/ /quickstart/ /faq/,
# screenshots each, exits non-zero if any 4xx/5xx or console error
node .claude/skills/run-zer0-mistakes/driver.mjs --smoke

# Drive an isolated test server instead (see Gotchas — :4011 avoids the :4000 dev server)
node .claude/skills/run-zer0-mistakes/driver.mjs --url http://127.0.0.1:4011 --path /faq/
```

Other flags: `--viewport 375x667` (mobile), `--full-page`, `--wait 500` (extra settle ms), `--help`. Exit code is `0` only when every visited route returned 2xx/3xx with no console errors — usable as a CI/smoke gate.

**Always open the screenshot and look at it.** A 200 status with a blank or half-rendered page still means something is wrong.

## Run (human path)

```bash
docker compose up        # then open http://localhost:4000 in a browser; Ctrl-C to stop
docker compose down -v   # clean up (removes bundle/jekyll cache volumes)
```

Useless headless — there's nothing to look at without a browser, which is why the driver exists.

## Test

The Playwright behavioral tier is the test that pairs with this driver. It has **no `webServer`** in its config — it expects a server already running at `BASE_URL` (default `http://127.0.0.1:4000`, matching the Docker dev server):

```bash
# Verified here: 224 passed, 8 skipped in ~4 min against the live :4000 server
BASE_URL=http://localhost:4000 npm run test:smoke
```

Without `BASE_URL`, `./test/test_playwright.sh` spawns its own short-lived `jekyll serve` on port 4000 by default (`STYLING_PORT`) — see Gotchas if the Docker dev server is already up. The broader suites — `./scripts/bin/test` (lib + theme + integration) and `./test/test_runner.sh --suites core` — are documented in [`CLAUDE.md`](CLAUDE.md); they were not exercised while authoring this skill.

## Gotchas

- **Do not serve with the host's Ruby.** System Ruby here is 2.6.10; the
Docker image is Ruby 3.3. `bundle exec jekyll serve` on the host will fail or need the macOS compatibility Gemfile the installer generates. Docker is the one true serving path.
- **Playwright's default port (4000) now matches the Docker dev server.** If
Docker is already up, either reuse it (`BASE_URL=http://localhost:4000`, no spawn) or pass `STYLING_PORT=4011` to `test/test_playwright.sh` to spawn an isolated server on a free port instead — spawning a second server on :4000 while Docker holds it will fail to bind.
- **`/about/stats/` logs a benign console error** —
`SyntaxError: Failed to execute 'querySelector' on 'Element': '#404' is not a valid selector.` (an ID starting with a digit). The `--smoke` run marks that route **FAIL** because of it, even though it returns 200 and renders. It is a pre-existing issue, not something your change broke.
- **Skins are applied via JS, not URL.** The driver calls
`window.zer0Bg.setSkin(name)` and waits for `html[data-theme-skin]` to flip — there's no `?skin=` query param. Valid names are the nine in `--skin`.
- **The driver tolerates an already-running site.** It only connects to a
  server; it never starts Jekyll. Start the server first (Docker), then drive.
- **`port is already allocated` across worktrees.** Each worktree/checkout is a
separate compose project (`<dir>-jekyll-1`), but they all try to bind host port `:4000`. If the main repo's `zer0-mistakes-jekyll-1` (or another worktree's container) holds `:4000`, `docker compose up` here fails with `Bind for 0.0.0.0:4000 failed: port is already allocated`. Either reuse that running container (the site is the same), or `docker stop <other>-jekyll-1` to free the port first.
- **Per-project `bundle_cache` volume.** Because the worktree is its own compose
project, its `bundle_cache` volume starts empty and forces a full first-run `bundle install`. The cheapest way to get a running site from a worktree is to reuse the main checkout's container (`docker start zer0-mistakes-jekyll-1`), which already has a warmed volume.
- **`fatal: not a git repository` in the container log is harmless.** A
worktree's `.git` is a *file* pointing at `…/.git/worktrees/<name>`, which isn't bind-mounted (`.:/site` mounts only the worktree). Jekyll falls back to `PAGES_REPO_NWO=bamr87/zer0-mistakes` (set in `docker-compose.yml`) and serves fine.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `curl http://localhost:4000` fails / connection refused | Server isn't up. `docker ps` to check; `docker compose up --build` to start; tail `docker compose logs -f jekyll`. |
| `Bind for 0.0.0.0:4000 failed: port is already allocated` | Another `*-jekyll-1` container holds :4000. Reuse it, or `docker stop <name>-jekyll-1`. |
| Container exits 17, log shows `Could not reach host index.rubygems.org` | First run of a fresh compose project needs network to `bundle install` into its empty `bundle_cache` volume. Run with network, or `docker start zer0-mistakes-jekyll-1` to reuse the warmed main-repo container. |
| Driver: `Cannot find package '@playwright/test'` | Run `npm install` at the repo root (resolves from `node_modules`). |
| Driver: Chromium executable not found / download | `npx playwright install chromium`. |
| `--smoke` fails only on `/about/stats/` with a `querySelector '#404'` error | Known pre-existing console error; not your change (see Gotchas). |
| Build extremely slow / stalls on `npm install -g mermaid-cli` or `pip install jupyter` | Normal for the first `dev-test` build (5–10 min). Let it finish; layers cache after. |
| Apple Silicon: "platform mismatch" warnings | Expected — the image is `linux/amd64`, emulated. It still runs. |
