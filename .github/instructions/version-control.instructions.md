---
applyTo: "CHANGELOG.md,CHANGES.md,**/version.*,VERSION,**/package.json,**/*.gemspec,**/Cargo.toml,**/go.mod"
description: "Version control, releases, and publication guidelines for Ruby Gems and GitHub repositories"
date: 2026-05-18T12:00:00.000Z
lastmod: 2026-06-21T12:00:00.000Z
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

## Working-Tree & Branch Discipline

The rules above only work if they are followed *before* you start editing. They
prevent the most common failure mode: unrelated changes piling up uncommitted on
`main` and then needing to be untangled into branches after the fact.

1. **Branch first, then edit.** Create the branch off an up-to-date `main`
   *before* touching any file. Never make changes directly on `main`.

   ```bash
   git switch main && git pull --ff-only
   git switch -c fix/<scope>-<slug>     # then start editing
   ```

2. **One concern per branch / PR.** A branch holds exactly one logical change
   (one fix, one feature, one chore). If you discover an unrelated change is
   needed, branch again for it. Mixed PRs muddy the changelog **and** the
   automatic version bump — release tooling reads the squash-merge commit
   title/type, so a PR mixing `feat:` and `fix:` produces the wrong bump.

3. **Parallel work → `git worktree`, not a shared working tree.** To work on two
   things at once, give each branch its own checkout. The Docker dev server can
   keep running in one worktree while you edit in another, with no stash churn:

   ```bash
   git worktree add ../zer0-<topic> <type>/<scope>-<slug>
   # …work…  then:  git worktree remove ../zer0-<topic>
   ```

   Use `git stash` only for a quick, same-tree context switch.

4. **Keep generated & lock files out of feature PRs.** A change to `_layouts/`,
   `_includes/`, `scripts/`, etc. must not also carry an unrelated regenerated
   artifact:
   - `_data/content_statistics.yml` is plugin-generated — let it ride in its own
     `chore` commit (or regenerate it in CI), never bundled into a feature diff.
   - `Gemfile.lock` changes belong to the release flow (see Semantic
     Versioning), not feature PRs.

   Stage files **by path**, not with `git add -A`, and review `git status
   --short` before committing so stray modifications don't leak in.

5. **`main` is protected.** Direct pushes to `main` are blocked; every change
   lands via PR with CI green. If you cannot push to `main`, that is by design —
   open a PR.

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

**Version ↔ lock invariant.** The `jekyll-theme-zer0 (X.Y.Z)` line in
`Gemfile.lock` must always equal `version.rb`. They drift when one release path
bumps the version without re-locking — so only **one** release mechanism owns a
release (the release tooling that updates `version.rb`, `CHANGELOG.md`, *and*
`Gemfile.lock` together). Never run two release flows for the same version. If
they ever disagree, re-resolve the lock to match `version.rb` (`bundle lock`),
in its own `chore` commit — this is **not** a version bump.

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

- Never edit directly on `main` — branch first, one concern per branch/PR.
- Never bundle a regenerated artifact (`_data/content_statistics.yml`) or a
  `Gemfile.lock` change into an unrelated feature PR.
- Never let `Gemfile.lock` and `version.rb` disagree.
- Never bump version outside a release commit.
- Never tag before commit + push.
- Never skip CHANGELOG update.
- Never publish a version that already exists on RubyGems (immutable).

---

**Related:** [`.github/skills/change-workflow/SKILL.md`](../skills/change-workflow/SKILL.md) · [`.github/prompts/commit-publish.prompt.md`](../prompts/commit-publish.prompt.md) · [`documentation.instructions.md`](documentation.instructions.md)
