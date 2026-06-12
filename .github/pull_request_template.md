## Description

<!-- What does this PR change and why? Link the backlog task (T-NNN) or issue. -->

## Type

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `docs` — documentation only
- [ ] `refactor` / `perf` / `style`
- [ ] `test` — tests only
- [ ] `chore` / `ci`

## Checklist

- [ ] Conventional-commit title (`type(scope): subject`) — this drives the automated version bump
- [ ] `CHANGELOG.md` updated under `[Unreleased]` for user-visible changes
- [ ] `./scripts/bin/test` passes locally (10/10 suites)
- [ ] Theme/layout/include/sass change → Jekyll build validated (`docker-compose exec -T jekyll bundle exec jekyll build --config '_config.yml,_config_dev.yml'`)
- [ ] No version bump (`lib/jekyll-theme-zer0/version.rb` untouched — releases are automated)
- [ ] Backlog task status updated in `_data/backlog.yml` (if implementing a task)
