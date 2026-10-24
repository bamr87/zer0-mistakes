# AGENTS.md — working rules for AI coding agents in `studio/`

The studio is a Rails 8.1 app (Ruby 3.3 in CI, 3.4 in the image) that edits the theme beside it and runs the theme's scripts as jobs. [`README.md`](README.md) says what each page does; this file says what must stay true. The theme's own rules in the root [`AGENTS.md`](../AGENTS.md) apply to everything the studio touches.

"Done" means `bin/rails test` and `bin/rails zeitwerk:check` pass, and — when `Dockerfile`, `bin/docker-entrypoint` or the `studio` service in the root `docker-compose.yml` changed — the image still builds, boots and answers `/up` and `/design/tokens`.

## Invariants

- **Files are the truth; the database is an index and an audit trail.** Two tables: `sites` (registered checkouts) and `jobs`. Never store a theme or site value in the database; read the file on every page.
- **Every write goes through `AtomicWrite` with the bytes the form was rendered from.** The form carries `base_digest`; a mismatch is a 409 and nothing is written. A multi-file save (`TokenEditor`, `SkinEditor`) writes in order and undoes the earlier writes when a later one refuses. A file the save would not change is not written, even if it moved on.
- **Every path goes through `ConfinedPath`.** No `..`, no absolute path, `lstat` on every component so a symlink is refused, realpath inside the root — and a write only to a path in the root's allow-list (`ThemeRoot::WRITABLE`, `Site::WRITABLE`). Adding a writable path is a reviewed change to one of those two lists.
- **Edits are line surgery or byte-range splices, never a re-serialisation.** `BlockRewriter` rewrites one YAML line keeping alignment and the trailing comment; `ScssDeclarations` splices a declaration's value by its byte range. A YAML dumper or a Sass compiler would strip the comments a person wrote.
- **The theme's scripts are invoked, never reimplemented.** Parity is `scripts/design-system-check.rb`, the audit is `scripts/bin/audit-consumer`, a release is `scripts/bin/release --dry-run`, propagation is `scripts/propagate.rb`, a preview is `bundle exec jekyll build`. `ScriptRunner::COMMANDS` is the whole list; a new command is a new entry with a fixed argv and allow-listed arguments, never a string handed to a shell.
- **No network at boot, and none the person did not ask for.** Only the propagate report reads GitHub, as an explicit job. Nothing is dispatched or released from here.
- **Loopback or a password.** `AccessGuard` reads `REMOTE_ADDR` and every `X-Forwarded-For` hop (`LocalNetwork`), never `remote_ip`. The preview file server has the same rule, with a signed token in password mode because a browser sends no Basic credentials into a cross-origin frame.
- **No inline script or style.** The CSP carries a per-request nonce and no `unsafe-inline`; per-element colours travel as CSS custom properties on `style=` is not allowed either — use `--c:` through the `.swatch` rule. The preview files get their own, looser policy because the theme's pages carry inline scripts.
- **`studio/` is never part of the theme.** Both Jekyll configs exclude it, `scripts/bin/validate` requires that, the gemspec never packages it (`test/integration/gem_boundary_test.rb` evaluates the real gemspec), `.dockerignore` keeps it out of the theme image. The docs site's byte copy of `_config.yml` (`pages/_about/settings/_config.yml`) must be refreshed with the validator's own command whenever `_config.yml` changes.
- **Tests run on copies of `test/fixtures/theme` and `test/fixtures/site`** through `fixture_theme!` / `fixture_site!` (`THEME_DIR`, `SITES_DIR`, `STUDIO_PREVIEWS_DIR`); a test never touches the real checkout. The stub scripts under `test/fixtures/theme/scripts/` stand in for the theme's; the real docs-site build is opt-in (`STUDIO_REAL_THEME=1`).
- **Jobs stream through `JobLog` and stop through `JobInterrupt`.** A job subclasses `ScriptJob`, returns its stats hash, raises `Failed` or `Cancelled`; the base class records the outcome and broadcasts the header. Cancel is a status write the running script's interrupt notices within a second; the process group gets TERM, then KILL.

## Conventions

- Conventional Commits with the `studio` scope: `feat(studio): …`, `fix(studio): …`.
- Every source file opens with a comment saying what it is and why it exists.
- Copied code keeps its provenance line (`Copied from zer0-CMS's …`, `Generalised from zer0-image-generator's …`); `app/assets/stylesheets/zer0-tokens.css` is a byte-identical copy of the `zer0-ui-tokens` kit and is never edited here.
- README-First, README-Last: read [`README.md`](README.md) before changing a page, update it after.
