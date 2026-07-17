---
name: change-workflow
description: "**WORKFLOW SKILL** — The standard branch → commit → PR flow for ANY change to Zer0-Mistakes. USE FOR: starting any code/content/docs/config change, deciding how to split mixed work, naming branches/commits, keeping generated & lock files out of feature PRs, opening a PR correctly so release tooling computes the right version bump. INVOKES: git (switch/worktree/add/commit/push), gh pr create, and the validate-build skill. DO NOT USE FOR: cutting an actual release (use the commit-publish prompt) or pure read-only investigation."
---

# Change Workflow

The required path for landing **any** change in this repo. It exists to prevent the most common failure mode here: unrelated edits accumulating uncommitted on `main`, then being untangled into branches after the fact. Branch *first*, keep one concern per PR, and let CI + release tooling do their job.

Canonical rules live in [`version-control.instructions.md`](../../instructions/version-control.instructions.md). This skill is the operational checklist.

## When to use

- At the **start** of any change — before you edit a single file.
- When a working tree already holds several unrelated changes and you need to
  split them into clean, reviewable PRs.
- When you're unsure how to name a branch/commit, or which files belong together.

## Golden rules (memorize these)

1. **Branch before you edit.** Never change files on `main`.
2. **One concern per branch/PR.** A fix, a feature, or a chore — pick one.
3. **Stage by path, never `git add -A`.** Keep stray/generated files out.
4. **Generated & lock files travel alone.** `_data/content_statistics.yml` and
   `Gemfile.lock` never ride inside a feature PR.
5. **Validate before you push.** Use the `validate-build` skill.
6. **Ship a feature → register it.** If your change adds or materially alters a
user-visible feature (new layout, include, plugin, script, or workflow), add its `ZER0-NNN` entry to `_data/features.yml` (with `provenance` + `tests`) and run `ruby scripts/tag-features --write` in the **same** PR — the `features` CI suite hard-fails otherwise. See [`features.instructions.md`](../../instructions/features.instructions.md).

## The flow

### 0. Start from a fresh, branched workspace

```bash
git switch main && git pull --ff-only
git switch -c <type>/<scope>-<slug>      # e.g. fix/layouts-breaking-hero
```

Branch name = `<type>/<scope>-<slug>`, where `<type>` is one of
`feature|fix|bugfix|hotfix|docs|chore|refactor` (mirror the Conventional Commit
type). `main` is protected — you **cannot** commit to it directly, by design.

If `main` already has uncommitted work that belongs elsewhere, see [Splitting a messy working tree](#splitting-a-messy-working-tree) below.

### 1. Scope it to ONE concern

Before editing, name the single change this branch makes. If mid-change you find an unrelated fix is needed, **stop and branch again** for it rather than piling it on. Mixed PRs produce the wrong automatic version bump (release tooling reads the squash-merge commit type) and a noisy changelog.

### 2. Make the change

Follow the file-scoped instruction matching the path you touch (layouts, includes, sass, scripts, obsidian, …). Match existing style; minimal, surgical diffs.

### 3. Keep the diff clean

```bash
git status --short        # review EVERY modified path
```

- Stage only the files for this concern, **by path**: `git add <path> <path>`.
- If `_data/content_statistics.yml` shows up and stats aren't your concern,
leave it unstaged (it's plugin-generated — it rides its own `chore` commit or CI).
- If `Gemfile.lock` changed and this isn't a release/deps PR, leave it unstaged.
  The lock's `jekyll-theme-zer0 (X.Y.Z)` line must always match `version.rb`.

### 4. Validate

Run the **`validate-build`** skill (Jekyll build with layered configs, doctor, relevant tests). For any `_layouts/`, `_includes/`, `_sass/`, `_plugins/`, or `assets/` change this is mandatory:

```bash
docker-compose exec -T jekyll bundle exec jekyll build \
  --config '_config.yml,_config_dev.yml'
```

### 5. Commit (Conventional Commits)

```text
<type>(<scope>): <subject ≤ 50 chars>

<body explaining WHY, wrapped at 72>

Closes #123
```

Types: `feat fix docs style refactor perf test chore ci build revert security`. Scopes: `layouts includes sass scripts ci config search navigation analytics deps`. Imperative, lower-case subject, no trailing period.

### 6. Push & open the PR

```bash
git push -u origin <branch>
gh pr create --repo bamr87/zer0-mistakes --base main \
  --title "<type>(<scope>): <subject>" \
  --body  "<summary + validation notes>"
```

Open early. Let CI run. The PR **title** becomes the squash-merge commit, so it must be a clean Conventional Commit — that's what drives the version bump and changelog.

### 7. Merge

**Squash-merge** into `main`; the branch auto-deletes. Low-risk PRs may carry the `auto-merge` label to land on green. PRs touching **protected paths** (anything in `.github/CODEOWNERS`: `version.rb`, gemspec, `Gemfile*`, `package*.json`, `CHANGELOG.md`, release config, `.github/workflows/`, `_plugins/`, `scripts/bin`) require **@bamr87 code-owner review** — agents cannot self-merge these.

**You never bump the version or cut a release from a feature branch.** Every merge to `main` feeds release-please's open `chore(main): release X.Y.Z` PR (the version accumulator). A release is cut by **merging that release PR** when its set is coherent — see [`version-control.instructions.md`](../../instructions/version-control.instructions.md) (Branching — Hardened Trunk) and [`commit-publish.prompt.md`](../../prompts/commit-publish.prompt.md).

## Splitting a messy working tree

When `main` already has several unrelated uncommitted changes (the situation this skill prevents), recover by making one branch + PR per concern:

```bash
# For each concern, from main (uncommitted changes carry across switches):
git switch -c <type>/<scope>-<slug>
git add <only the files for THIS concern>     # by path
git commit -m "<conventional message>"
git push -u origin <branch> && gh pr create ...
git switch main          # remaining changes stay in the working tree
# …repeat for the next concern…
```

Group by intent, not by file type: a layout fix is one PR; an editor-config refresh is another; regenerated stats / lockfile sync is a third (chore).

## Parallel work → worktrees

To work on two branches at once without stashing (the Docker dev server can keep running in one):

```bash
git worktree add ../zer0-<topic> <type>/<scope>-<slug>
# …work in ../zer0-<topic>…
git worktree remove ../zer0-<topic>
```

## Pre-PR checklist

- [ ] Branch created off fresh `main`; not committing to `main`.
- [ ] Exactly one concern in this branch.
- [ ] `git status --short` reviewed; only intended paths staged.
- [ ] No stray `_data/content_statistics.yml` / `Gemfile.lock` in the diff.
- [ ] `version.rb` and `Gemfile.lock` agree (if either is touched).
- [ ] `validate-build` green (build + relevant tests).
- [ ] CHANGELOG updated if the change is user-visible.
- [ ] PR title is a clean Conventional Commit.

## Reporting back to the user

After running this flow, summarize the branches/PRs as a table:

| PR | Branch | Concern | Files |
| --- | --- | --- | --- |
| #NNN | `<type>/<scope>-<slug>` | one-line intent | key paths |

Flag anything you deliberately left out of the PRs (e.g. an unrelated generated file) and why.
