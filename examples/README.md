# Examples

Self-contained demo sites built on `jekyll-theme-zer0`. Each one is a complete Jekyll site with its own `_config.yml`, `Gemfile`, content, and skin — they are **not** part of the theme's own site build (`examples/` is in the root `_config.yml` `exclude:` list) and they are not shipped in the gem.

They exist to answer "can the theme do *this* kind of site?" with a running answer rather than a paragraph.

| Example | What it demonstrates |
|---------|----------------------|
| [`swerve-of-shore/`](./swerve-of-shore/) | A serialized literary reading blog: a custom collection with a numbered episode series, a data-driven publication schedule, card feed, curated sidebar rail, and a light editorial skin applied entirely through `user_overrides`. |

## Running one

Each example builds against the theme sources in this repository, so changes to `_layouts/`, `_includes/`, and `_sass/` show up immediately:

```bash
cd examples/<name>
bundle install
bundle exec jekyll serve --config _config.yml,_config_dev.yml
```

If your environment's default locale is not UTF-8, Jekyll's SCSS converter will fail on the theme's stylesheets. Prefix the command with `LANG=C.UTF-8 LC_ALL=C.UTF-8` in that case.

`_config_dev.yml` sets `remote_theme: false` + `theme: jekyll-theme-zer0` to use the local sources. Dropping it builds against the published remote theme instead, which is what a real consumer site would do.

## Adding an example

1. Create `examples/<name>/` with its own `_config.yml`, `_config_dev.yml`,
   `Gemfile`, and `.gitignore` (ignore `_site/`, `Gemfile.lock`).
2. Point the `Gemfile` at the theme with `gem "jekyll-theme-zer0", path: "../.."`.
3. Put site-specific styling in `assets/css/user-overrides.css` and set
`user_overrides: true` — do not edit theme files to make an example look right. If an example cannot be built without changing the theme, that is a theme gap worth filing rather than patching locally.
4. Add a row to the table above and a `README.md` in the example directory.
