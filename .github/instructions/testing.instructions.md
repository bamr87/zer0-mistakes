---
applyTo: "test/**"
description: "Testing guidelines and test development standards for the Jekyll theme"
date: 2026-05-18T12:00:00.000Z
lastmod: 2026-05-18T12:00:00.000Z
---

# Testing Guidelines

## Suite Layout

```
test/
├── test_runner.sh         # Orchestrator — runs all suites
├── test_core.sh           # Theme/Jekyll fundamentals
├── test_deployment.sh     # Build artifacts, gem packaging
├── test_quality.sh        # Lint, link check, frontmatter
├── test_installation.sh   # install.sh end-to-end
├── test_obsidian.sh       # Obsidian plugin (Ruby + JS resolver)
├── test_playwright.sh     # Frontend (CSS, layout, behavior, snapshots)
├── update-snapshots.sh    # Refresh Linux snapshot baselines via Docker
├── playwright.config.js   # Single Playwright config; tiers = projects
├── visual/                # Specs + committed snapshot baselines
└── README.md
```

## Run

```bash
./scripts/bin/test                 # canonical entry; runs everything
./test/test_runner.sh              # equivalent
./test/test_runner.sh --verbose
./test/test_core.sh                # one suite

# Frontend (Playwright tiers)
./test/test_runner.sh --suites playwright              # smoke
./test/test_runner.sh --suites playwright_snapshots    # pixel regression

# Inside Docker
docker-compose exec -T jekyll ./test/test_runner.sh
```

## Playwright Tiers

`test/test_playwright.sh` selects a Playwright **project** via the
`PLAYWRIGHT_PROJECT` env var. All tiers share `test/playwright.config.js`.

| Tier | When CI runs it | What it checks |
|------|-----------------|----------------|
| `smoke` (default) | Every code-change PR | CSS load, Bootstrap tokens, layout chrome, admin DOM, behavioral skin tests, a11y component checks |
| `snapshots` | Path-filtered: `_sass/`, `assets/`, `_layouts/`, `_includes/`, `test/visual/`, `test/playwright.config.js` | Pixel screenshots of the homepage in each of the 9 theme skins |
| `regression-{chromium,firefox,webkit}` | Manual `workflow_dispatch` only | All specs across all browsers |

Snapshot baselines live in `test/visual/snapshots/` and are committed to
the repo. They are platform-specific (`*-snapshots-linux.png`); refresh
them via `./test/update-snapshots.sh` (uses a Linux Playwright Docker
image) when intentional visual changes land.

When adding a new Playwright spec:

- Use helpers in `test/visual/fixtures.js` (`waitForJekyll`, `setSkin`,
  `gotoBeforeScrollSpy`) instead of raw `page.goto(..., 'networkidle')`.
- Avoid `page.waitForTimeout()` — wait on a deterministic condition
  (attribute change, event, `expect.poll`).
- If the spec relies on visible UI in a Bootstrap tab, **activate the
  tab and wait for `.tab-pane.active` to be visible** before interacting.
- Mark known product bugs with `test.fixme(...)` and a `// TODO:` comment
  linking to the tracking issue. Never delete a failing test to make CI
  green.

## Test Script Template

```bash
#!/usr/bin/env bash
# test/test_<area>.sh — short description
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$REPO_ROOT/scripts/lib/common.sh"   # log_info, log_error, etc.

PASS=0; FAIL=0

assert() {                              # assert "<message>" <command…>
  local msg="$1"; shift
  if "$@" >/dev/null 2>&1; then
    log_info "  ✓ $msg"; ((PASS++))
  else
    log_error "  ✗ $msg"; ((FAIL++))
  fi
}

test_<scenario>() {
  log_info "Test: <scenario>"
  assert "version file exists" test -f lib/jekyll-theme-zer0/version.rb
  assert "version matches gemspec" bash -c '
    v=$(grep -o "VERSION = \"[^\"]*\"" lib/jekyll-theme-zer0/version.rb | cut -d\" -f2)
    grep -q "version.*$v" jekyll-theme-zer0.gemspec'
}

main() {
  test_<scenario>
  echo
  log_info "Passed: $PASS  Failed: $FAIL"
  [[ $FAIL -eq 0 ]]
}
main "$@"
```

## Required Coverage

| Area | What must be tested |
|---|---|
| **Core** | `version.rb` present, gemspec valid, `_config.yml` parseable |
| **Build** | `jekyll build` produces `_site/` with `index.html` |
| **Includes** | Every file in `_includes/` referenced at least once |
| **Layouts** | All layouts render without Liquid errors |
| **Install** | `install.sh` succeeds in a clean directory |
| **Quality** | yamllint, markdownlint, link-check pass |
| **Security** | No secrets in source (`gitleaks` / regex scan) |

## Assertion Conventions

- One assert = one observable behavior.
- Test names describe behavior in present tense: `"renders cookie consent when enabled"`.
- Compare values explicitly: `[[ "$actual" == "$expected" ]]`.
- Fail fast — use `set -euo pipefail`, no silent `|| true`.

## Isolation

- Each test creates its own tempdir: `tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT`.
- Never write to `_site/`, `pkg/`, or other build outputs during tests.
- Never depend on test order — tests must pass in any order.

## CI Integration

```yaml
# .github/workflows/ci.yml (excerpt)
- name: Run test suite
  run: ./scripts/bin/test
```

Exit codes: `0` = all pass, non-zero = failure (which the workflow surfaces).

## Performance Budget

| Suite | Target |
|---|---|
| `test_core.sh` | < 5s |
| `test_quality.sh` | < 30s |
| `test_playwright.sh` (smoke) | < 3 min |
| `test_playwright.sh` (snapshots) | < 1 min |
| `test_runner.sh` (full) | < 2 min |

If a suite exceeds budget: parallelize or split.

## Security Tests

```bash
# Detect committed secrets
grep -RInE '(ghp_|gho_|ghu_|ghs_|sk-|AKIA|xoxb-)[A-Za-z0-9]{20,}' \
  --include='*.{rb,md,yml,sh}' . && exit 1 || true

# Validate Gemfile.lock is present (do not gitignore)
test -f Gemfile.lock
```

## Pre-Merge Checklist

- [ ] `./scripts/bin/test` exits 0 locally
- [ ] New code path has at least one test
- [ ] Test runs in < its suite budget
- [ ] No new dependencies on host tools (or documented in README.md)

## Hard Rules

- Never commit a `.skip` or `pending` test without an issue link.
- Never disable a failing test to make CI green.
- Never test against `_site/` from a previous build — always rebuild.

---

**Related:** [`scripts.instructions.md`](scripts.instructions.md) · [`version-control.instructions.md`](version-control.instructions.md)
