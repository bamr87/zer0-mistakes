---
applyTo: "CHANGELOG.md,CHANGES.md,**/version.*,VERSION,**/package.json,**/*.gemspec,**/Cargo.toml,**/go.mod"
description: "Version control, releases, and publication guidelines for Ruby Gems and GitHub repositories"
date: 2026-05-18T12:00:00.000Z
lastmod: 2026-05-18T12:00:00.000Z
---

# Version Control & Release Guidelines

For the full release pipeline see [`.github/prompts/commit-publish.prompt.md`](../prompts/commit-publish.prompt.md). This file defines the rules.

## Branching

GitHub Flow. `main` is always deployable.

```
feature/<scope>-<desc>     bugfix/<scope>-<desc>
hotfix/<scope>-<desc>      docs/<desc>
chore/<desc>               refactor/<scope>-<desc>
```

Branch off `main`, open PR early, squash-merge.

## Commits — Conventional Commits

```
<type>(<scope>): <subject ≤ 50 chars>

<body explaining WHY, wrapped at 72>

Closes #123
BREAKING CHANGE: <if applicable>
```

Types: `feat fix docs style refactor perf test chore ci build revert security`.
Scopes used here: `layouts includes sass scripts ci config search navigation analytics deps`.

Imperative voice. Subject lower-case, no trailing period.

## Semantic Versioning

Single source of truth: `lib/jekyll-theme-zer0/version.rb`.

| Change | Bump | Trigger commits |
|---|---|---|
| MAJOR | X.0.0 | Any `BREAKING CHANGE:` footer, removed/renamed public API |
| MINOR | 0.X.0 | Any `feat:` without breaking change |
| PATCH | 0.0.X | Only `fix: docs: chore: perf: refactor: test: ci:` |

Pre-release suffixes: `-alpha.N`, `-beta.N`, `-rc.N`.

## CHANGELOG.md — Keep a Changelog Format

Top-of-file template:

```markdown
## [Unreleased]
### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security

## [X.Y.Z] - YYYY-MM-DD
### Added
- **Component**: `path/file` - Short description
```

Rules:
- One entry per user-visible change.
- Group by category, never by author or PR number.
- Reference issues/PRs at end of line: `(#123)`.
- Move `[Unreleased]` items into the new version section on release.

## Release Process

```bash
./scripts/bin/release patch --dry-run    # preview
./scripts/bin/release [patch|minor|major]
```

The script runs: analyze commits → validate (Jekyll build, doctor, YAML) → bump version → update CHANGELOG → commit → tag → push → `gem build` → `gem push` → verify on RubyGems.

Manual fallback: see `commit-publish.prompt.md`.

## Pre-Release Checklist

- [ ] `main` clean, CI green
- [ ] All `[Unreleased]` entries belong in this release
- [ ] No `WIP`, `TODO`, or commented-out code in diff
- [ ] Bumped `version.rb` matches new tag
- [ ] Tested locally: `docker-compose exec -T jekyll bundle exec jekyll build`

## Gem Publication

`jekyll-theme-zer0.gemspec` essentials:

```ruby
s.required_ruby_version = ">= 2.7.0"
s.metadata["allowed_push_host"] = "https://rubygems.org"
s.add_runtime_dependency "jekyll"
```

First-time setup: `gem signin` (stores API key in `~/.gem/credentials`, perms `0600`).

CI publication via `.github/workflows/gem-release.yml` triggered on `v*` tag, using `RUBYGEMS_API_KEY` secret.

## Hotfix Process

```bash
git switch -c hotfix/<issue> main
# fix + test
git commit -m "fix(<scope>): <subject>

Closes #999"
# open PR → review → merge → release patch
./scripts/bin/release patch
```

## Yanking a Bad Release

```bash
gem yank jekyll-theme-zer0 -v X.Y.Z
```

Then bump to next patch with a fix — never re-publish the yanked version.

## Security

- Never commit secrets. `RUBYGEMS_API_KEY` lives in GitHub Secrets only.
- Run `bundle audit` before each release; address advisories or document acceptance.
- Pin all GitHub Actions to a major version: `actions/checkout@v4`.
- `Gemfile.lock` **must** be committed (required for reproducible CI builds).

## Hard Rules

- Never bump version outside a release commit.
- Never tag before commit + push.
- Never skip CHANGELOG update.
- Never publish a version that already exists on RubyGems (immutable).

---

**Related:** [`.github/prompts/commit-publish.prompt.md`](../prompts/commit-publish.prompt.md) · [`documentation.instructions.md`](documentation.instructions.md)
