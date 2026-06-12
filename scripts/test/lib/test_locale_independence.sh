#!/bin/bash

# Locale-independence regression guard (T-015)
#
# PR #132 fixed `invalid byte sequence in US-ASCII` crashes in the Ruby
# tooling that only reproduced when no UTF-8 locale was set (minimal
# containers, some CI runners). These tests run the validators under
# LC_ALL=C LANG=C so the bug class cannot silently return: the repo files
# they read (README.md, _data/*.yml, package.json) contain multibyte
# characters, so any locale-dependent File.read regresses to a crash here.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

echo "Testing locale independence (LC_ALL=C LANG=C)..."

assert_true "(cd '$REPO_ROOT' && LC_ALL=C LANG=C ruby scripts/generate-roadmap.rb --check >/dev/null 2>&1)" \
    "generate-roadmap.rb --check survives a C locale"

assert_true "(cd '$REPO_ROOT' && LC_ALL=C LANG=C ruby scripts/generate-roadmap.rb --validate >/dev/null 2>&1)" \
    "generate-roadmap.rb --validate survives a C locale"

assert_true "(cd '$REPO_ROOT' && LC_ALL=C LANG=C ruby scripts/sync-backlog.rb --check >/dev/null 2>&1)" \
    "sync-backlog.rb --check survives a C locale"

assert_true "(cd '$REPO_ROOT' && LC_ALL=C LANG=C ./scripts/lint-pages --strict >/dev/null 2>&1)" \
    "lint-pages --strict survives a C locale"

# validate --quick covers the package.json read in scripts/bin/validate
assert_true "(cd '$REPO_ROOT' && LC_ALL=C LANG=C ./scripts/bin/validate --quick >/dev/null 2>&1)" \
    "validate --quick survives a C locale"

echo -e "\n${GREEN}locale-independence tests complete${NC}"
