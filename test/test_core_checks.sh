#!/bin/bash

# Meta-tests for the checks inside test_core.sh (T-049 / issue #460).
#
# Two of those checks could never fail:
#
#   1. test_liquid_templates ran `grep -q "{{.*{{"`, which matches any two
#      SIBLING output tags on one line, and its `return 1` sat inside a
#      `find | while` pipeline -- a subshell. So it printed
#      "[ERROR] Nested Liquid output tags found in ..." on every clean run and
#      still reported the suite as passed.
#   2. test_gem_build ran `tar -tzf` on the built .gem. A gem is an
#      UNCOMPRESSED tar, so gzip printed "stdin: not in gzip format" and both
#      branches fell through to a warning without inspecting anything.
#
# A check that cannot fail is worse than no check, because it reads green. This
# file drives the fixed checks against fixtures that are known-good and
# known-bad, and fails if either verdict is wrong.
#
# Run directly (./test/test_core_checks.sh) or as the "Core Check Meta-Specs"
# unit test inside test_core.sh.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Sourcing defines the checks without running the suite -- test_core.sh guards
# its `main` call on BASH_SOURCE == $0 for exactly this.
# shellcheck source=./test_core.sh
source "$SCRIPT_DIR/test_core.sh"

SPECS_RUN=0
SPECS_FAILED=0

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; SPECS_FAILED=$((SPECS_FAILED + 1)); }

# expect_check <expected: pass|fail> <description> <command...>
expect_check() {
    local expected="$1" description="$2"
    shift 2
    SPECS_RUN=$((SPECS_RUN + 1))

    local status=0
    "$@" > /dev/null 2>&1 || status=$?

    if [[ "$expected" == "pass" && "$status" -eq 0 ]]; then
        pass "$description"
    elif [[ "$expected" == "fail" && "$status" -ne 0 ]]; then
        pass "$description"
    else
        fail "$description (expected $expected, got exit $status)"
    fi
}

WORK_DIR="$(mktemp -d -t core-checks-XXXXXX)"
trap 'rm -rf "$WORK_DIR"' EXIT

# --------------------------------------------------------------------------
# test_liquid_templates
#
# The checks cd to $PROJECT_ROOT, so each fixture site becomes PROJECT_ROOT for
# the duration of one assertion.
# --------------------------------------------------------------------------

# make_site <name> ; echoes its path with empty _layouts/ and _includes/
make_site() {
    local site="$WORK_DIR/$1"
    mkdir -p "$site/_layouts" "$site/_includes"
    printf '<html>{%% if page.title %%}{{ page.title }}{%% endif %%}</html>\n' \
        > "$site/_layouts/default.html"
    echo "$site"
}

liquid_check_in() {
    local site="$1"
    PROJECT_ROOT="$site" test_liquid_templates
}

echo "test_liquid_templates"

CLEAN_SITE="$(make_site clean)"
printf '<a href="/">{{ site.title }}</a>\n' > "$CLEAN_SITE/_includes/ok.html"
expect_check pass "a clean site passes" liquid_check_in "$CLEAN_SITE"

# The false positive that made the check shout on every run: two sibling output
# tags on one line, as in navigation/sidebar-pagetree.html's capture.
SIBLING_SITE="$(make_site siblings)"
printf '{%% capture _url %%}{{ _base }}{{ _section }}{%% endcapture %%}\n' \
    > "$SIBLING_SITE/_includes/siblings.html"
expect_check pass "two sibling output tags on one line are not 'nested'" \
    liquid_check_in "$SIBLING_SITE"

# The thing the check is actually for -- and the assertion that fails against
# the old implementation, where the `return 1` was swallowed by the subshell.
NESTED_SITE="$(make_site nested)"
printf '<p>{{ site.data[{{ page.key }}] }}</p>\n' > "$NESTED_SITE/_includes/nested.html"
expect_check fail "a genuinely nested output tag fails the check" \
    liquid_check_in "$NESTED_SITE"

# Same subshell defect on the layout loop. The balance check is line-based
# (lines containing `{%` vs lines containing `%}`), so the fixture is a tag
# left open with no closing marker anywhere in the file.
UNBALANCED_SITE="$(make_site unbalanced)"
printf '<html>\n{%% if page.title\n</html>\n' \
    > "$UNBALANCED_SITE/_layouts/broken.html"
expect_check fail "an unbalanced Liquid tag in a layout fails the check" \
    liquid_check_in "$UNBALANCED_SITE"

# --------------------------------------------------------------------------
# check_gem_contents
#
# Fixture .gem files are built to the real RubyGems layout: an uncompressed tar
# holding metadata.gz, data.tar.gz and checksums.yaml.gz.
# --------------------------------------------------------------------------

echo "check_gem_contents"

if ! command -v python3 &> /dev/null; then
    echo "  - python3 not available; skipping the gem-content specs"
else
    # make_gem <output.gem> <path within data.tar.gz>...
    make_gem() {
        local out="$1"
        shift
        python3 - "$out" "$@" <<'PYEOF'
import gzip, io, os, sys, tarfile

out, members = sys.argv[1], sys.argv[2:]

payload = io.BytesIO()
with tarfile.open(fileobj=payload, mode="w") as data:
    for name in members:
        blob = b"x\n"
        info = tarfile.TarInfo(name)
        info.size = len(blob)
        data.addfile(info, io.BytesIO(blob))

def add(archive, name, blob):
    info = tarfile.TarInfo(name)
    info.size = len(blob)
    archive.addfile(info, io.BytesIO(blob))

# A .gem is an UNCOMPRESSED tar of gzipped members -- the whole point of #460.
with tarfile.open(out, "w") as gem:
    add(gem, "metadata.gz", gzip.compress(b"--- !ruby/object:Gem::Specification\n"))
    add(gem, "data.tar.gz", gzip.compress(payload.getvalue()))
    add(gem, "checksums.yaml.gz", gzip.compress(b"---\n"))
PYEOF
    }

    COMPLETE_GEM="$WORK_DIR/complete.gem"
    make_gem "$COMPLETE_GEM" _layouts/default.html assets/css/main.scss _includes/core/head.html
    expect_check pass "a gem carrying _layouts/ and assets/ passes" \
        check_gem_contents "$COMPLETE_GEM"

    # The regression the old `tar -tzf` could not see: both branches warned and
    # fell through, so this gem passed.
    NO_LAYOUTS_GEM="$WORK_DIR/no-layouts.gem"
    make_gem "$NO_LAYOUTS_GEM" assets/css/main.scss README.md
    expect_check fail "a gem missing _layouts/ fails" \
        check_gem_contents "$NO_LAYOUTS_GEM"

    NO_ASSETS_GEM="$WORK_DIR/no-assets.gem"
    make_gem "$NO_ASSETS_GEM" _layouts/default.html README.md
    expect_check fail "a gem missing assets/ fails" \
        check_gem_contents "$NO_ASSETS_GEM"

    # A name that merely CONTAINS "assets" or "layouts" is not the directory.
    # The old check grepped for the bare substrings, so this passed too.
    DECOY_GEM="$WORK_DIR/decoy.gem"
    make_gem "$DECOY_GEM" docs/layouts-guide.md docs/assets-guide.md
    expect_check fail "paths that merely mention layouts/assets do not count" \
        check_gem_contents "$DECOY_GEM"

    # Not a gem at all: the listing must fail rather than silently pass.
    NOT_A_GEM="$WORK_DIR/not-a.gem"
    printf 'this is not a tar archive\n' > "$NOT_A_GEM"
    expect_check fail "a file that is not a gem fails" \
        check_gem_contents "$NOT_A_GEM"
fi

echo ""
echo "specs: $SPECS_RUN run, $SPECS_FAILED failed"

if [[ "$SPECS_FAILED" -ne 0 ]]; then
    exit 1
fi
exit 0
