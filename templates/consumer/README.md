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
| `zer0-doctor.yml` | `.github/workflows/zer0-doctor.yml` | Weekly, report-only `zer0-cms doctor` run: is this site aligned with the zer0 stack? (see [The zer0 stack](#the-zer0-stack)) |
| `zer0.json.template` | `zer0.json` | The zer0-CMS project file: content folders and content types whose required fields match this theme's front-matter contract |

## Install

```bash
THEME=/path/to/zer0-mistakes
mkdir -p scripts .github/workflows
cp "$THEME/templates/consumer/bump-theme-pins.sh"   scripts/
cp "$THEME/templates/consumer/theme-bump.yml"       .github/workflows/
cp "$THEME/templates/consumer/.theme-overrides.yml" .
cp "$THEME/templates/consumer/zer0-doctor.yml"      .github/workflows/
cp "$THEME/templates/consumer/zer0.json.template"  zer0.json
chmod +x scripts/bump-theme-pins.sh
```

Then add the repo to `_data/consumers.yml` in the theme so releases dispatch to it.

A floating `remote_theme` (no tag) is a legitimate posture some sites choose on purpose; skip `theme-bump.yml` there, since it has nothing to bump. The stack files below apply either way.

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

## The zer0 stack

A site built on this theme is aligned when it uses the three pillars the same way every other site does, with no private copies of any of them:

| Pillar | Repo | A consumer carries |
|---|---|---|
| Theme | [bamr87/zer0-mistakes](https://github.com/bamr87/zer0-mistakes) (this repo) | `remote_theme: bamr87/zer0-mistakes` (or `theme: jekyll-theme-zer0`) and a `.theme-overrides.yml` |
| Image engine | [bamr87/zer0-image-generator](https://github.com/bamr87/zer0-image-generator) | the `zer0-image-generator` gem and one `preview_images:` block — no vendored `_plugins/preview_*` fork, no copied Python or bash generator |
| CMS | [bamr87/zer0-CMS](https://github.com/bamr87/zer0-CMS) | a valid `zer0.json` and the report-only `zer0-doctor.yml` caller |

### 1. The image generator gem

Add the gem to the Jekyll plugins group and install it:

```ruby
# Gemfile
gem "zer0-image-generator", "~> 0.6", group: :jekyll_plugins
```

```bash
bundle install
bundle exec jekyll preview-images --list-missing   # what has no banner yet
bundle exec jekyll preview-images --dry-run        # what would be generated
```

Then keep exactly one `preview_images:` block in `_config.yml`, using only the keys the gem documents (its README, § Configuration). For a zer0-mistakes site the recipe is:

```yaml
preview_images:
  enabled: true
  provider: openai                 # openai | xai | stability | gemini | local | auto
  model: gpt-image-2
  size: 1536x1024
  style: "retro pixel art, 8-bit video game aesthetic, vibrant colors"
  output_dir: assets/images/previews
  collections: [posts, quickstart, docs]
  assets_prefix: /assets           # preview: values omit it; it is re-added on disk
  auto_prefix: true
  # collections_dir comes from the theme's own `collections_dir: pages`
```

Generation is script-driven and never runs inside `jekyll build`, so GitHub Pages safe mode and build times are unaffected. If the site still has a copy of the old engine — `_plugins/preview_image_generator.rb`, `_plugins/preview_generator.rb`, `scripts/lib/preview_generator.py`, `scripts/generate-preview-images.sh` (this theme's `scripts/features/install-preview-generator` used to copy them in) — retire it once nothing in the site's workflows, Makefile, scripts or docs calls it. A generator a site documents as deliberately its own is not a copy; leave it.

### 2. `zer0.json`

`zer0.json` is the zer0-CMS project file. Start from `zer0.json.template`, then:

- point each `contentFolders[].path` at a directory that exists (the doctor reports a missing one as an error) and add a folder per collection the site actually has;
- keep each content type's `required: true` fields equal to that collection's `required:` list plus `global.required_fields` in this theme's [`.github/config/frontmatter_schema.yml`](../../.github/config/frontmatter_schema.yml), which is what `scripts/lint-pages` enforces;
- keep the `$schema` line so editors validate it.

An existing `frontmatter.json` (Front Matter CMS) can stay until `zer0.json` covers every field it defines. Make sure `.gitignore` does not ignore `zer0.json`, and add it to `exclude:` in `_config.yml` so it is not published.

### 3. The doctor

`zer0-doctor.yml` calls the reusable workflow in zer0-CMS every week and on demand. It is report-only (`fail-on-error: false`), never runs on `pull_request` or `push`, calls no model and reads no secret, so it needs no `*_ENABLED` switch and no `fleet.manifest.yml` lane. Run the same check locally from a zer0-CMS checkout:

```bash
ruby -I rails/lib rails/bin/zer0-cms doctor /path/to/site                     # grouped report
ruby -I rails/lib rails/bin/zer0-cms doctor /path/to/site --format findings   # JSON lines
```

| Check | Error when | Warning when |
|---|---|---|
| theme | `_config.yml` unreadable, or it names neither `remote_theme: bamr87/zer0-mistakes` nor `theme: jekyll-theme-zer0` | no `.theme-overrides.yml` |
| image engine | a vendored preview-generator fork exists | no `preview_images:` block; a Gemfile without the gem |
| cms | `zer0.json` is not valid JSON(C), or a content folder does not exist | no `zer0.json`; no `$schema` |
| fleet | `fleet.manifest.yml` is present but not strict YAML | — |
| content | a page whose front matter does not parse | a required key from `frontmatter_schema.yml` is missing (report-only) |

The caller stays inert until zer0-CMS ships the reusable workflow; a manual run before then fails to resolve it, and nothing else is affected.

### Tracking alignment

Each consumer entry in [`_data/consumers.yml`](../../_data/consumers.yml) may carry a `stack:` block — `image_gem`, `preview_images`, `vendored_generator`, `zer0_json`, `doctor`, and the `checked` date. It is a dated snapshot of the consumer's default branch, refreshed from the doctor's output; `scripts/propagate.rb` ignores it.

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
