# zer0 studio

The theme's workbench: a Rails app beside `jekyll-theme-zer0` that **designs** the theme (tokens, skins, the doctor, docs-site previews), **customizes** the sites built on it (a consumer's theme keys, the audit) and **updates** it (the version lockstep, release dry runs, the consumer pin matrix) — from a browser, against the files in this checkout, with the theme's own scripts doing the work.

Files are the truth. The studio reads them on every page, writes the handful it is allowed to through a digest-guarded atomic rename, and keeps a SQLite index of two things only: the consumer checkouts you registered and the jobs it ran. Nothing here is published, released or dispatched: a release dry run shows what `scripts/bin/release` would do, and merging release-please's pull request publishes the gem.

## Run it

```bash
# Docker, from the theme root (127.0.0.1 only) → http://localhost:3300
docker compose --profile studio up --build
SITES_DIR=$HOME/github docker compose --profile studio up --build   # with your consumer checkouts

# Natively, from studio/ (Ruby 3.3+, the theme checked out as the parent directory)
bundle install
bin/rails db:prepare
SOLID_QUEUE_IN_PUMA=1 bin/rails server -p 3300
```

The studio works on `THEME_DIR` (default: the parent of `studio/`) and offers the site directories under `SITES_DIR` (default: the theme's `examples/`) for registration. Previews need the theme's gems: in Docker the `bundle_cache` volume the `jekyll` service fills is shared and used when it satisfies the theme's lock; when it does not and it belongs to root (it usually does — the theme image runs as root), the entrypoint points `THEME_BUNDLE_PATH` at `storage/theme-bundle` instead and the first preview build installs them there (a minute or two, visible in the job log). Natively, `bundle install` in the theme root first.

Access is **this machine only** unless `STUDIO_PASSWORD` (and optionally `STUDIO_USER`, default `zer0`) is set, in which case HTTP basic auth applies to every page and the preview iframe carries a short-lived signed token instead. `STUDIO_HOSTS` adds host names to the two loopback ones; an unknown `Host` is refused.

## What is on the pages

| Page | What it does | Writes |
|---|---|---|
| **Design / Tokens** | Each `_sass/tokens/_X.scss` with its `_design-system/tokens/X.css` mirror; edit a value, see the diff live, save both — `scripts/design-system-check.rb` runs after and its verdict stays on screen | the pair |
| **Design / Skins** | A skin's palette (`@include zer0-skin-palette(…)` in `_skins.scss`), its `skins.css` mirror, its pattern size and background colours; the RGB triplet is derived from the brand; WCAG 2.1 contrast per rule, live | the four files |
| **Design / Doctor** | Read-only rules as a job: token parity, the skin registries, background assets the gem does not ship, link contrast, the settings page's byte copy of `_config.yml`, the `studio/` exclusion. Findings carry `findings.jsonl` fields and stable fingerprints | nothing |
| **Design / Previews** | The docs site built with `bundle exec jekyll build --config _config.yml,_config_dev.yml --baseurl /preview/<id>` into `studio/tmp/previews/`, shown in an iframe served from the *other* loopback name so the theme's colour-mode storage stays apart from the studio's; the newest five kept | `tmp/previews/` |
| **Sites** | Consumer checkouts under `SITES_DIR`, discovered or registered by path (realpath, inside the root, a `_config.yml` present), joined to `_data/consumers.yml` by repository name; **Audit** runs `scripts/bin/audit-consumer --format json` as a job and stores the report on the site | the `sites` table |
| **Sites / Theme config** | `theme_skin`, `color_mode_default`, `color_mode_lock`, `appearance_panel`, `user_overrides`, the `theme_background` block and the `theme_color` hex values of the site's `_config.yml`, rewritten one line at a time — comments, alignment and every other key stay | the site's `_config.yml` |
| **Update / Versions** | `version.rb`, `package.json`, `package-lock.json`, `.release-please-manifest.json`, `_data/theme-manifest.yml` and `CHANGELOG.md` against `lib/jekyll-theme-zer0/version.rb`; **Dry-run patch/minor/major** runs `scripts/bin/release <level> --dry-run` as a job | nothing |
| **Update / Consumers** | The pin matrix from `_data/consumers.yml`; **Report drift** runs `scripts/propagate.rb` (report mode, reads GitHub) as a job | nothing |
| **Jobs** | Every job with its parameters, result and live log (Turbo Streams over Solid Cable); Cancel sends TERM to the script's process group, then KILL | the `jobs` table |
| **Settings** | What the studio was started with — paths, access mode, where previews go; no secret is shown | nothing |

Every save needs the form's `base_digest` to equal the file's current digest (**409** otherwise), every value is validated (**422**), and every path goes through `ConfinedPath` (no `..`, no symlink at any component, realpath inside the root, and a write only to a path the allow-list names).

## Layout

```text
app/services/   ConfinedPath · AtomicWrite · BlockRewriter · ScssDeclarations · UnifiedDiff
                TokenEditor · SkinEditor · SiteThemeConfig · ContrastCheck · ThemeDoctor
                ScriptRunner · JobLog · JobInterrupt · PreviewBuilder · PreviewHost
                ThemeRoot · SitesRoot · ConsumerRegistry · VersionFiles · LocalNetwork
app/jobs/       ScriptJob (base) · ThemeDoctorJob · PreviewBuildJob · AuditConsumerJob
                ReleaseDryRunJob · PropagateReportJob · ValidateJob
app/models/     Site · Job
app/controllers design/{tokens,skins,doctors,previews} · sites · sites/theme_configs
                update/{versions,releases,consumers} · jobs · settings · previews (file server)
test/           services, models, integration (security, design, sites, previews, update/jobs,
                the gem boundary), jobs (cancel), fixtures/theme + fixtures/site (copied per test)
```

`ScriptRunner` is the only way a process starts: a named command from its table with allow-listed arguments, run in the theme directory in its own process group with an allow-listed environment (plus `BUNDLE_GEMFILE` pointing at the theme's Gemfile for the `bundle` commands), streamed line by line, interrupt-polled, timed out.

## Checks

```bash
bin/rails test && bin/rails zeitwerk:check   # the suite on a copy of test/fixtures; the real checkout is never touched
STUDIO_REAL_THEME=1 bin/rails test test/jobs/preview_build_job_test.rb   # the real docs-site build (needs the theme's gems)
docker build -t zer0-studio ./studio         # from the theme root
```

`.github/workflows/studio.yml` runs the suite, a production boot that answers `/up` and `/design/tokens`, and the image against the checkout. `studio/` is excluded by both Jekyll configs and `scripts/bin/validate`, never packaged by the gemspec (`test/integration/gem_boundary_test.rb` evaluates the real one), and never in the theme image.

## Next

- Design, live: a CSS-only re-render of `assets/css/main.css` into the last build for token and skin edits; a before/after compare across skins and modes; new-skin creation; the axe sweep as a job; the companion theme change that resolves what the doctor flags today (the background-only skins, the registry default, the unshipped `assets/backgrounds/`).
- Customize, full: user-overrides and `_includes/custom/*` writers, `.theme-overrides.yml` declarations from an audit row, `audit-consumer --fix` behind a mandatory dry run, consumer previews against a gem version, a tag or this checkout, the installer profiles, the Site Builder wizard from the docs-site preview.
- Release and propagation: `propagate.rb --dispatch` (dry run first) with a token from the environment, bump pull requests through the consumer kit, the open release-please pull request surfaced.
