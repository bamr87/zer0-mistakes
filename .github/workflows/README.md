# GitHub Actions Workflows

This directory contains the CI/CD workflows for the zer0-mistakes Jekyll theme.

## Workflow Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                          WORKFLOW TRIGGERS                            │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Pull request ──────► ci.yml, evidence-gate.yml, secret-scan.yml,    │
│                       ai-content-review.yml*, codeql.yml*,           │
│                       install-matrix.yml*, sync.yml* (path-filtered*)│
│                                                                       │
│  Push to main ──────► release.yml (release-please) ─► release PR     │
│                       merge of release PR ─► tag + gem publish       │
│                       ci.yml, test-latest.yml, sync.yml, …           │
│                                                                       │
│  Schedules ─────────► test-latest.yml (daily canary),                │
│                       update-dependencies.yml, install-matrix.yml,   │
│                       codeql.yml, issue-autopilot.yml,               │
│                       giscus-digest.yml (weekly)                     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## CI & Quality Gates

### `ci.yml` — Comprehensive CI Pipeline

**Triggers:** Push to `main`, Pull Requests, Manual dispatch

Validates code quality, runs the full test suite, builds the gem, and performs
Docker integration testing. Uses `dorny/paths-filter` (job `detect-changes`) to
skip heavy jobs on docs-only changes.

| Job | Description | Condition | Timeout |
|-----|-------------|-----------|---------|
| `detect-changes` | Identifies code/docker/content/styling changes | Always | 3 min |
| `quality-checks` | version.rb ↔ Gemfile.lock guard, linting, markdown checks, quick preflight validation (code changes) | Always — the single required check | 15 min |
| `test` | Full gate-parity suite: all non-Playwright theme suites + canonical script suites (`./scripts/bin/test`) + Playwright smoke tier | Code changes only | 25 min |
| `snapshots` | Playwright pixel-snapshot gate (9 theme skins, rendered in the jammy Playwright image) | Styling changes only | 30 min |
| `build` | Gem build, validation, and install test | Code changes only | 10 min |
| `integration` | Docker build + critical page accessibility | Code or Docker changes | 12 min |

Job dependency graph:

```
detect-changes → quality-checks → test → build
              → snapshots       → integration
```

Manual dispatch options: **test_scope** (`fast` skips the snapshot tier) and
**fix_markdown** (auto-fix markdown formatting).

The `quality-checks` job must ALWAYS run (`if: always() && …`) — it is the
single required status check on `main`, and a required-but-skipped check would
deadlock docs-only PRs. `lint-workflows.yml` pins that invariant.

### `evidence-gate.yml` — Visual evidence gate

**Triggers:** Pull Requests (all)

Requires any PR that touches UI paths (`_sass/`, `_includes/`, `_layouts/`,
`assets/css|js/`) to also ship a regression test (`test/visual/*.spec.js`) and
before/after evidence (`test/visual/evidence/`). Opt out with the
`skip-evidence` / `no-visual-change` label. Always reports a status so it can be
a required check. See `.github/skills/visual-evidence/SKILL.md`.

### `secret-scan.yml` — Secret scan

**Triggers:** Pull Requests (all)

Fails a PR if credential shapes (Anthropic/GitHub tokens, private keys) appear
in the merge-base diff or PR body. Fork-safe (read-only `pull_request` event).

### `lint-workflows.yml` — Workflow lint

**Triggers:** PR/push touching `.github/workflows/**` or `.github/actions/**`

Runs `actionlint` over the workflow definitions, plus a guard that the
`quality-checks` job in `ci.yml` keeps its always-runs invariant.

### `codeql.yml` — CodeQL Security Scanning

**Triggers:** Push/PR to `main` (code paths only), Weekly schedule

CodeQL analysis for Actions, JS/TS, Python, and Ruby. Path-filtered to files
those analyzers can actually read (not data/content YAML).

### `install-matrix.yml` — Installer matrix

**Triggers:** PRs touching installer paths, Weekly schedule, Manual dispatch

Validates the modular installer across OS × Ruby (`matrix`), the README
`curl | bash` one-liner (`curl-bash-bootstrap`), and `install doctor`. No push
trigger: `main` is protected, so every change already ran this on its PR.

### `test-latest.yml` — Latest-dependency canary + Docker image publish

**Triggers:** Push to `main` (code/docker paths), Daily schedule, Manual dispatch

Zero-pin strategy: builds the Docker image with the latest resolved
dependencies (no lockfile), runs validation + Jekyll build + RSpec +
HTMLProofer, and on success publishes an immutable image tag
(`date-sha`) plus `:latest` to Docker Hub. Intended to **fail** when an
upstream gem breaks (canary behavior). Deliberately not run on PRs — PR
validation happens in `ci.yml` against the pinned lockfile.

## Release & Dependencies

### `release.yml` — release-please pipeline

**Triggers:** Push to `main`

The canonical release flow. Conventional Commits drive
[release-please](https://github.com/googleapis/release-please) (reusable
workflows in `bamr87/.github`): it opens/updates a "chore(main): release X.Y.Z"
PR that bumps `lib/jekyll-theme-zer0/version.rb`, `package.json`, and
`CHANGELOG.md`. Merging that PR tags `vX.Y.Z`, creates the GitHub Release, and
the `publish` job builds the gem and pushes it to RubyGems.
`./scripts/bin/release` remains a manual fallback.

Requires: `RUBYGEMS_API_KEY` secret (publish), shared workflow definitions in
`bamr87/.github`, config in `release-please-config.json`.

### `update-dependencies.yml` — Automated Gemfile.lock updates

**Triggers:** Weekly schedule, Manual dispatch

Runs `bundle update` and opens an automated PR for review. Complements
`.github/dependabot.yml`, which only manages GitHub Actions versions.

### `sync.yml` — Data-file mirrors

**Triggers:** Push to `main` / PRs touching `_data/backlog.yml`,
`_data/roadmap.yml`, or their scripts

- `backlog`: `_data/backlog.yml` → GitHub Issues (`scripts/sync-backlog.rb`);
  PRs validate the schema only.
- `roadmap`: `_data/roadmap.yml` → README roadmap section; PRs fail if stale,
  pushes regenerate via an automated PR.

### `convert-notebooks.yml` — Notebook conversion

**Triggers:** `.ipynb` changes under `pages/_notebooks/` (push/PR), Manual dispatch

Converts notebooks to Jekyll-friendly Markdown. PRs get a dry-run preview;
pushes to `main` open a `chore/convert-notebooks` PR with the converted files
(CI on that PR validates them).

### `deploy-chat-proxy.yml` — AI chat proxy deploy

**Triggers:** Push to `main` touching `templates/deploy/chat-proxy/`, Manual dispatch

Deploys the AI-chat Cloudflare Worker via `wrangler-action`. Requires
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `ANTHROPIC_API_KEY`.

## Automation & AI Pipeline

### `ai-content-review.yml` — Content & Docs Review

**Triggers:** PRs touching `pages/**/*.md` or `docs/**`, Manual dispatch

Two tiers plus docs validation: (1) deterministic SEO/quality checks
(`scripts/content-review.rb`, fork-safe, posts a sticky comment); (2) the
Claude Code content-reviewer agent (only when `ANTHROPIC_API_KEY` is set and
content actually changed); (3) front-matter, internal-link, and markdownlint
jobs (formerly `docs-validate.yml`).

### `issue-autopilot.yml` — Issue autopilot

**Triggers:** Weekly schedule, Manual dispatch, `autopilot:go` label

One bounded pass of the autonomous issue pipeline: gate → triage (label/route
open issues) → verify-close (close human issues already fixed on `main`,
CI-gated) → resolve (one docs batch → one `auto:issue` PR). OFF by default
behind `ISSUE_AUTOPILOT_ENABLED` (+ per-lane vars). See
`docs/systems/continuous-evolution.md`.

### `issue-pr-auto-merge.yml` — Issue PR auto-merge

**Triggers:** `pull_request_target` on labeled/updated PRs

Squash-merges same-repo `auto:issue` PRs once all checks are green, with a
merge-time diff re-classification (docs/pages only — the smuggle guard). OFF by
default behind `ISSUE_AUTOMERGE_ENABLED`.

### `auto-merge.yml` — Auto-merge low-risk PRs

**Triggers:** `pull_request_target` on labeled/updated PRs

Enables GitHub native auto-merge for PRs labeled `auto-merge`, after a denylist
check that blocks version/release/CI/plugin/script files. Required checks
(including `evidence-gate`) remain the actual gate.

### `ci-self-repair.yml` — CI self-repair

**Triggers:** `workflow_run` completion of the Comprehensive CI Pipeline

For failed PR runs where the PR opted in via the `auto-fix` label: runs Claude
Code headless to diagnose and push a fix, bounded by a retry budget; otherwise
drafts the PR with `agent-hold`. Never touches CODEOWNERS-protected paths.

### `milestone-assign.yml` — Milestone assignment

**Triggers:** `pull_request_target` (closed)

Assigns merged PRs to the milestone when exactly one is open; otherwise no-op.

### `giscus-digest.yml` — Giscus comment digest

**Triggers:** Weekly schedule, Manual dispatch

Read-only digest of Giscus-backed GitHub Discussions to the job summary.

## Gate Coverage — What Enforces What

Every quality gate a contributor can run locally must be enforced somewhere in
CI; warn-only gates must be temporary and tracked in the backlog.

| Quality gate | Local command | CI enforcement | Trigger |
|---|---|---|---|
| version.rb ↔ Gemfile.lock consistency | `./scripts/bin/validate --quick` | `ci.yml` → `quality-checks` | PR + push (always) |
| Quick preflight (files, versions, YAML, config contract) | `./scripts/bin/validate --quick` | `ci.yml` → `quality-checks` | PR + push (code changes) |
| Lint (markdown, YAML), frontmatter | `markdownlint` / `yamllint` | `ci.yml` → `quality-checks` | PR + push (always) |
| Theme suites (core, deployment, quality, installation, installer, site_generation, obsidian, features) | `./test/test_runner.sh --suites <list>` | `ci.yml` → `test` | PR + push (code changes) |
| Script suites (lib unit, theme validate, integration, installer e2e) | `./scripts/bin/test` | `ci.yml` → `test` | PR + push (code changes) |
| Playwright smoke tier | `./test/test_runner.sh --suites playwright` | `ci.yml` → `test` | PR + push (code changes) |
| Playwright snapshot tier | `./test/test_runner.sh --suites playwright_snapshots` | `ci.yml` → `snapshots` | PR + push (styling changes) |
| Visual evidence for UI changes | `.github/skills/visual-evidence/` | `evidence-gate.yml` | PR (always; self-scoping) |
| Gem build + install | `./scripts/build` | `ci.yml` → `build` | PR + push (code changes) |
| Docker boot + critical pages | `docker compose up` | `ci.yml` → `integration` | PR + push (code or docker changes) |
| Roadmap ↔ README ↔ version consistency | `ruby scripts/generate-roadmap.rb --check` | `sync.yml` → `roadmap` | PR (check) + push to main (regenerate) |
| Backlog schema | `ruby scripts/sync-backlog.rb --check` | `sync.yml` → `backlog` | PR (check) + push to main (sync issues) |
| Docs front matter + internal links + markdownlint | `scripts/docs/lint-frontmatter.sh` / `check-links.sh` / `markdownlint` | `ai-content-review.yml` | PR (docs/content changes) |
| Secret shapes in diff/PR body | — | `secret-scan.yml` | PR (always) |
| Workflow definitions (actionlint + invariants) | `actionlint` | `lint-workflows.yml` | PR + push (workflow changes) |
| Latest-dependency canary (unpinned build + HTMLProofer) | — | `test-latest.yml` | Daily schedule + push to main |
| Security scanning (CodeQL) | — | `codeql.yml` | PR + push (code paths) + weekly |
| Installer cross-platform matrix | `./scripts/bin/test install` | `install-matrix.yml` | PR (installer paths) + weekly |

## Workflow Dependencies

```yaml
# Required Secrets
GITHUB_TOKEN            # Automatically provided
RUBYGEMS_API_KEY        # Gem publishing (release.yml → bamr87/.github publish)
DOCKER_USERNAME/TOKEN   # Docker Hub publish (test-latest.yml)
ANTHROPIC_API_KEY       # AI tiers (ai-content-review, ci-self-repair, autopilot)
CLAUDE_CODE_OAUTH_TOKEN # Preferred Claude credential for the issue autopilot
CLOUDFLARE_API_TOKEN    # Chat proxy deploy
CLOUDFLARE_ACCOUNT_ID   # Chat proxy deploy

# Opt-in repository variables (autonomous pipeline, all default OFF)
ISSUE_AUTOPILOT_ENABLED / ISSUE_RESOLVE_ENABLED / ISSUE_AUTOCLOSE_ENABLED /
ISSUE_VERIFY_CLOSE_ENABLED / ISSUE_AUTOMERGE_ENABLED
```

## Composite Actions Used

Shared composite actions live in `.github/actions/`:

- `setup-ruby` — Ruby + non-frozen bundle install with caching (path-gem safe)
- `quality-checks` — linting, markdown, and structure validation
- `test-suite` — theme test suite execution
- `playwright-tests` — Playwright tier runner with artifact upload
- `configure-git` — git identity for automated commits
- `claude-run` — the universal Claude Code step for the issue autopilot

See [`.github/actions/README.md`](../actions/README.md).

## Local Development

```bash
# Canonical preflight validation
./scripts/bin/validate --quick

# Run tests
./scripts/bin/test

# Build gem locally
./scripts/bin/build

# Preview a manual release (fallback; release-please is canonical)
./scripts/bin/release patch --dry-run

# Lint the workflows themselves
actionlint
yamllint -c .github/config/.yamllint.yml .github/workflows/
```

## Troubleshooting

### Release PR not appearing
- release-please only reacts to Conventional Commits (`feat:`, `fix:`, …) on `main`
- Check the `release.yml` run for errors from the shared `bamr87/.github` workflows

### Gem publish failing
- Verify `RUBYGEMS_API_KEY` secret is set
- A `version.rb` bump must re-lock `Gemfile.lock` and `package-lock.json` in the
  same change — the frozen `bundle install` in the publish job fails otherwise
  (the `quality-checks` guard should have caught this on the release PR)

### CI failures
- Run quick validation locally: `./scripts/bin/validate --quick`
- Run tests locally: `./scripts/bin/test`
- For snapshot failures, refresh baselines with `./test/update-snapshots.sh`
