# Dev Container

One-click Jekyll dev environment for **GitHub Codespaces** and **VS Code Dev Containers**. The site builds and serves automatically — no local Ruby, Bundler, or Node required.

## How it launches the site

`devcontainer.json` builds from the repo's own multi-stage [`docker/Dockerfile`](../docker/Dockerfile), targeting the **`dev-test`** stage. That stage runs `bundle install` at **image-build time**, so every gem is **preloaded into the image** — there is no slow `bundle install` on first boot, and the bundled gems always match the checked-out branch's `Gemfile.lock`.

On start, the container auto-serves at **port 4000** with live reload:

```bash
bundle exec jekyll serve --config '_config.yml,_config_dev.yml' \
  --host 0.0.0.0 --port 4000 --livereload --force_polling
```

`nohup` keeps the server alive after the start hook returns, and `--force_polling` makes file watching reliable over the Codespaces bind mount (logs in `/tmp/jekyll-serve.log`). Port 4000 auto-forwards and opens a preview; `35729` (LiveReload) is forwarded silently.

## Make Codespaces launch near-instant (prebuilds)

Building the image the first time still costs a couple of minutes. **Prebuilds** do that work ahead of time so new Codespaces restore from a ready image in seconds:

1. Repo **Settings → Codespaces → Set up prebuild**.
2. Target branch `main`, region(s) as needed.
3. Trigger: *On configuration change* (rebuilds when `.devcontainer/**`,
   `docker/Dockerfile`, or `Gemfile.lock` change).

After the first prebuild completes, **Code → Codespaces → Create codespace on main** launches with gems preloaded and Jekyll already serving.

## Local use (VS Code + Docker Desktop)

1. Install the **Dev Containers** extension.
2. Open the repo → *Reopen in Container* (first build ~2–3 min; cached after).
3. Visit <http://localhost:4000>.

## Design notes

| Choice | Why |
|---|---|
| Build from `docker/Dockerfile` `dev-test` | Gems preloaded at build time; stays in sync with `Gemfile.lock`. |
| No `workspaceMount` override | Codespaces always mounts the repo at `/workspaces/<repo>`; gems live at the global `/usr/local/bundle`, so `bundle exec` works from the default folder. Maximizes Codespaces + local compatibility. |
| Only the `github-cli` feature | Docker-in-Docker / Node aren't needed to render the site; dropping them keeps create + prebuild fast. |
| `postCreateCommand` is `bundle check \|\| bundle install` | A fast no-op when gems are already baked in; self-heals only on lock drift. |
| Runs as `root` | The `ruby:3.3-slim` base has no `vscode` user; matches `docker-compose`'s root container and avoids gem/bind-mount permission friction. |

## Relationship to `docker-compose.yml`

Both serve the same site from the same `dev-test` image. The devcontainer adds IDE integration (extensions, settings, port forwarding, auto-serve) for Codespaces/VS Code; `docker-compose up` is the terminal-driven equivalent for local/team use. See [`docker/README.md`](../docker/README.md).
