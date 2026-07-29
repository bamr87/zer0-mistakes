# Consumer adoption kit

Everything a site built on zer0-mistakes needs to stay current with the theme without anyone remembering to do it by hand.

## Why

A release used to end at RubyGems. Nothing connected it to the sites built on it, so pins sat wherever someone last edited them: when v1.27.0 shipped, all three pinned consumers were still on v1.26.0 and the two unpinned ones had been silently tracking `main` the whole time. Bumping meant editing five repos — up to four files in one of them — from memory.

## What's here

| File | Goes to | Does |
|---|---|---|
| `bump-theme-pins.sh` | `scripts/bump-theme-pins.sh` | Rewrites every theme version pin in the repo, in one pass |
| `theme-bump.yml` | `.github/workflows/theme-bump.yml` | Runs the above on release dispatch, weekly, or manually; opens a PR |
| `.theme-overrides.yml` | repo root | Declares which theme files you intentionally fork, so drift audits produce signal instead of noise |

## Install

```bash
THEME=/path/to/zer0-mistakes
mkdir -p scripts .github/workflows
cp "$THEME/templates/consumer/bump-theme-pins.sh"   scripts/
cp "$THEME/templates/consumer/theme-bump.yml"       .github/workflows/
cp "$THEME/templates/consumer/.theme-overrides.yml" .
chmod +x scripts/bump-theme-pins.sh
```

Then add the repo to `_data/consumers.yml` in the theme so releases dispatch to it.

## Use it by hand

```bash
scripts/bump-theme-pins.sh --check --latest   # am I behind? (exit 1 if yes)
scripts/bump-theme-pins.sh --latest --dry-run # what would change
scripts/bump-theme-pins.sh --latest           # do it
scripts/bump-theme-pins.sh --latest --pin     # also pin a ref floating on main
```

It finds pins in `_config*.yml`, `_data/hub.yml`, and `Gemfile*` (never `Gemfile.lock` — bundler owns that), and handles all three pin shapes:

```yaml
remote_theme : "bamr87/zer0-mistakes@v1.27.0"   # _config.yml
theme_repo   : bamr87/zer0-mistakes@v1.27.0     # _data/hub.yml (org hubs)
```
```ruby
gem 'jekyll-theme-zer0', '~> 1.27.0'            # Gemfile / Gemfile.azure
```

Two behaviours worth knowing:

- **Commented-out lines are never rewritten.** Safer, but it means a comment like `# pinned to match v1.26.0` next to a bumped pin goes stale. The generated PR body says to check for this.
- **A floating ref stays floating** unless you pass `--pin`. Bumping is not the same decision as pinning, and the script will not make the second one for you.

## Pinned or floating?

Floating (`remote_theme: bamr87/zer0-mistakes`, no tag) means every push to the theme's `main` reaches production immediately, with no gate and no rollback. It is the fastest way to get fixes and the fastest way to get breakage; it also makes the bump PR meaningless, since there is nothing to bump.

Pinning is recommended for anything with readers. The bump PR plus this repo's CI then becomes the gate — that is the point of the whole kit.

## Auditing what you've forked

From a theme checkout:

```bash
./scripts/bin/audit-consumer --consumer-path /path/to/site            # report
./scripts/bin/audit-consumer --consumer-path /path/to/site --strict   # CI gate
./scripts/bin/audit-consumer --consumer-path /path/to/site --fix      # delete IDENTICAL copies
./scripts/bin/sync-plugins   --consumer-path /path/to/site            # vendor required plugins
```

`--fix` deletes only files byte-identical to the theme's, which is the cheapest cleanup available: those forks are doing nothing but going stale. Files you fork on purpose belong in `.theme-overrides.yml`, and an override whose `reason` has been fixed upstream is your cue to delete the fork and take the theme's copy back.

> `remote_theme` does not deliver `_plugins/` — GitHub Pages will not load plugins from a remote theme. `sync-plugins` is how those get vendored, and it is why they rot independently of the theme version.
