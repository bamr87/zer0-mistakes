# Obsidian vault config

This directory is the **shared, version-controlled** Obsidian vault configuration for the `zer0-mistakes` repository. Open the repo root in [Obsidian](https://obsidian.md) and these settings apply automatically.

## What is committed

- `app.json` — vault behaviour (link format, attachment folder, properties visibility, tab settings)
- `appearance.json` — typography defaults aligned with the rendered theme
- `core-plugins.json` — enabled core plugins (file-explorer, search, backlinks, graph, outline, page-preview, templates, daily-notes, properties, …)
- `community-plugins.json` — **recommended** community plugins with install instructions (not auto-installed)
- `hotkeys.json` — placeholder for shared hotkey overrides

## What is **not** committed (see `.gitignore`)

- `workspace*` / `cache` — per-user UI state
- `plugins/*/data.json` — per-user plugin state
- `themes/` and any `.obsidian/snippets/` you add locally

## Vault root vs. note location

The vault root is the **repository root**. New notes default to `pages/_notes/` (`newFileFolderPath` in `app.json`) so they integrate with the Jekyll `notes` collection. Attachments default to `assets/images/notes/`.

See [`pages/_docs/obsidian/`](../pages/_docs/obsidian/) for the full vault → GitHub Pages workflow.
