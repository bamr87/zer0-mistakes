---
applyTo: "scripts/**"
description: "Shell script development guidelines for automation and tooling scripts"
date: 2026-05-18T12:00:00.000Z
lastmod: 2026-05-18T12:00:00.000Z
---

# Shell Script Guidelines

## Layout

```
scripts/
├── bin/                      # Canonical entry points (executable)
│   ├── build, release, test, install
├── lib/                      # Shared modules (sourced, never executed)
│   ├── common.sh             # logging, error helpers
│   ├── git.sh, gem.sh, version.sh
│   └── install/              # installer sub-modules
├── build, release, test      # Back-compat thin wrappers → bin/*
├── analyze-commits.sh        # standalone utilities
└── vendor-install.sh
```

Rule: callers invoke `scripts/bin/<name>`; logic lives in `scripts/lib/`.

## Required Skeleton

```bash
#!/usr/bin/env bash
# scripts/bin/<name> — one-line purpose
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# shellcheck source=../lib/common.sh
source "$REPO_ROOT/scripts/lib/common.sh"

VERSION="1.0.0"
DRY_RUN=false
VERBOSE=false

usage() {
  cat <<EOF
Usage: ${0##*/} [OPTIONS] [ARGS]
  -h, --help        show this help
  -v, --version     print version
  -n, --dry-run     show actions without executing
  -V, --verbose     extra logging
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -h|--help) usage; exit 0 ;;
      -v|--version) echo "$VERSION"; exit 0 ;;
      -n|--dry-run) DRY_RUN=true; shift ;;
      -V|--verbose) VERBOSE=true; shift ;;
      --) shift; break ;;
      -*) log_error "Unknown flag: $1"; usage; exit 2 ;;
      *) break ;;
    esac
  done
}

main() {
  parse_args "$@"
  require_cmd docker
  # …work…
}

main "$@"
```

## Mandatory Flags

Every `bin/` script supports `-h/--help`, `-v/--version`, `-n/--dry-run`, `-V/--verbose`.

## Logging (`scripts/lib/common.sh`)

```bash
log_info()  { printf '\033[0;34m[INFO]\033[0m  %s\n' "$*"; }
log_warn()  { printf '\033[0;33m[WARN]\033[0m  %s\n' "$*" >&2; }
log_error() { printf '\033[0;31m[ERROR]\033[0m %s\n' "$*" >&2; }
log_debug() { [[ "${VERBOSE:-false}" == true ]] && printf '[DEBUG] %s\n' "$*"; }
require_cmd() { command -v "$1" >/dev/null || { log_error "Missing: $1"; exit 127; }; }
run() {
  if [[ "${DRY_RUN:-false}" == true ]]; then log_info "DRY: $*"; else "$@"; fi
}
```

## Defensive Programming

- `set -euo pipefail` + `IFS=$'\n\t'` at the top of every script.
- Quote all variables: `"$var"`, never `$var` (except integer math).
- Validate required args/env before doing anything destructive.
- Use `mktemp -d` for temp dirs; `trap 'rm -rf "$tmp"' EXIT`.
- Idempotent: re-running must not corrupt state.
- Dry-run path must reach all decision points without side effects.

## Docker Integration

```bash
docker-compose exec -T jekyll bundle exec jekyll build \
  --config '_config.yml,_config_dev.yml'
```

Use `-T` to disable TTY in CI; quote multi-flag args.

## Git Operations (via `scripts/lib/git.sh`)

- Check clean working tree before mutating: `git diff --quiet || die "Working tree dirty"`.
- Always rebase, never merge in release scripts.
- Tag annotated: `git tag -a vX.Y.Z -m "…"`.

## Security

- Never `eval` user input.
- Never write secrets to disk or logs.
- Read secrets from env vars only: `: "${RUBYGEMS_API_KEY:?required}"`.
- Use `printf %q` when constructing commands from untrusted strings.
- Validate paths before `rm -rf`: confirm under `$REPO_ROOT`.

## Help Output Standard

```text
Usage: release [OPTIONS] <patch|minor|major>

Run the full release pipeline.

Options:
  -h, --help        show this help
  -n, --dry-run     show actions without executing
  -V, --verbose     extra logging

Examples:
  release patch --dry-run
  release minor
```

## Testing

```bash
bash -n scripts/bin/release           # syntax
shellcheck scripts/bin/* scripts/lib/*.sh
./scripts/bin/release patch --dry-run # no side effects
./scripts/bin/test                    # full suite
```

## Naming

- Files: `kebab-case.sh` (e.g., `analyze-commits.sh`).
- Entry points in `bin/`: no extension (`build`, `release`, `test`).
- Functions: `snake_case`. Constants: `UPPER_SNAKE`.
- Private functions in libs: prefix with `_`.

## Hard Rules

- Never call `rm -rf` without an explicit guard on the target path.
- Never depend on a tool not checked via `require_cmd`.
- Never duplicate logic — extract to `scripts/lib/`.
- Never commit a script without `bash -n` + `shellcheck` clean.

---

**Related:** [`testing.instructions.md`](testing.instructions.md) · [`install.instructions.md`](install.instructions.md) · [`version-control.instructions.md`](version-control.instructions.md)
