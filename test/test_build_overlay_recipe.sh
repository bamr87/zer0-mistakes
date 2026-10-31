#!/usr/bin/env bash
# test/test_build_overlay_recipe.sh — regression guard for issue #565.
#
# pages/_docs/deployment/build-overlay.md promises its recipe builds "what a
# real Pages consumer would serve". It used to clone the WHOLE theme repo into
# the build dir, so the theme's _data/, root pages (/AGENTS/), features/ and
# fr/ leaked into consumer builds; and its reusable lh_overlay() wrote the
# site into its temp dir (-d "$PWD/$out" expanded after the cd) instead of the
# caller's _site.
#
# This runs the two bash blocks EXACTLY as the page prints them against a
# minimal remote_theme consumer, with the theme served from a local git repo
# built from `git archive HEAD` (THEME_URL / THEME_REF; no network), and
# asserts the output matches what Pages would deliver.
#
# Usage: ./test/test_build_overlay_recipe.sh   (needs git, rsync, bundle + jekyll)
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOC="$REPO_ROOT/pages/_docs/deployment/build-overlay.md"

BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

PASS=0; FAIL=0
assert() {                              # assert "<message>" <command…>
  local msg="$1"; shift
  if "$@" >/dev/null 2>&1; then log_info "  ✓ $msg"; ((PASS+=1)); else log_error "  ✗ $msg"; ((FAIL+=1)); fi
}
refute() {                              # refute "<message>" <command…>  (must FAIL)
  local msg="$1"; shift
  if "$@" >/dev/null 2>&1; then log_error "  ✗ $msg"; ((FAIL+=1)); else log_info "  ✓ $msg"; ((PASS+=1)); fi
}

for tool in git rsync bundle; do
  command -v "$tool" >/dev/null || { log_info "SKIP: $tool not available"; exit 0; }
done

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
export TMPDIR="$tmp/scratch"; mkdir -p "$TMPDIR"
export BUNDLE_GEMFILE="${BUNDLE_GEMFILE:-$REPO_ROOT/Gemfile}"

# The Nth ```bash block of the page, verbatim.
bash_block() {
  awk -v want="$1" '/^```bash$/ { n++; if (n == want) { on = 1; next } } /^```$/ { on = 0 } on' "$DOC"
}

# --- Theme: this checkout's committed tree as a git repo with a tag ---------
theme_src="$tmp/theme-src"
mkdir -p "$theme_src"
git -C "$REPO_ROOT" archive HEAD | tar -x -C "$theme_src"
git -C "$theme_src" init -q
git -C "$theme_src" add -A
git -C "$theme_src" -c user.name=t -c user.email=t@t commit -q -m theme
git -C "$theme_src" tag overlay-test
export THEME_URL="file://$theme_src" THEME_REF="overlay-test"

# Precondition: the theme repo really carries the paths that must not leak.
assert "theme repo has AGENTS.md (leak candidate)" test -f "$theme_src/AGENTS.md"
assert "theme repo has _data/navigation/docs.yml (leak candidate)" test -f "$theme_src/_data/navigation/docs.yml"

# --- Consumer fixture: what a Pages remote_theme site checks in --------------
make_consumer() {
  mkdir -p "$1"
  cat >"$1/_config.yml" <<'YAML'
title: Overlay Probe
remote_theme: bamr87/zer0-mistakes
plugins:
  - jekyll-seo-tag
  - jekyll-include-cache
YAML
  printf -- '---\nlayout: default\ntitle: Home\n---\nOverlay probe.\n' >"$1/index.md"
}

check_output() {                        # check_output <label> <build_dir> <site_dir>
  local label="$1" build="$2" site="$3"
  assert "$label: index.html built" test -f "$site/index.html"
  assert "$label: theme _layouts delivered" test -f "$build/_layouts/default.html"
  refute "$label: no /AGENTS/ route" test -e "$site/AGENTS"
  refute "$label: no /features/ route" test -e "$site/features"
  refute "$label: no /fr/ route" test -e "$site/fr"
  refute "$label: no theme _data/navigation/docs.yml" test -e "$build/_data/navigation/docs.yml"
}

# --- 1. The four-step recipe --------------------------------------------------
log_info "Test: the documented recipe (block 1)"
recipe="$tmp/recipe.sh"
bash_block 1 >"$recipe"
# shellcheck disable=SC2016  # appended verbatim; expands inside the recipe
echo 'printf "%s" "$BUILD_DIR" > "$RECIPE_BUILD_DIR_FILE"' >>"$recipe"
# Join `\` continuations first: the old clone command spanned two lines.
refute "recipe does not clone the theme into \$BUILD_DIR" \
  grep -qE 'clone .*"\$BUILD_DIR"' <(sed -e ':a' -e '/\\$/N; s/\\\n//; ta' "$recipe")
make_consumer "$tmp/consumer-a"
if (cd "$tmp/consumer-a" && RECIPE_BUILD_DIR_FILE="$tmp/build_dir" bash "$recipe") >"$tmp/recipe.log" 2>&1; then
  build_dir="$(cat "$tmp/build_dir")"
  check_output "recipe" "$build_dir" "$build_dir/_site"
else
  log_error "  ✗ recipe failed to run:"; grep -m3 -iE 'error|exception' "$tmp/recipe.log" >&2 || tail -5 "$tmp/recipe.log" >&2; ((FAIL+=1))
fi

# --- 2. The reusable lh_overlay() ---------------------------------------------
log_info "Test: lh_overlay() (block 2) writes to the CALLER's _site"
bash_block 2 >"$tmp/overlay.sh"
make_consumer "$tmp/consumer-b"
scratch_b="$tmp/scratch-b"; mkdir -p "$scratch_b"
# shellcheck disable=SC1091  # generated from the page above
if (cd "$tmp/consumer-b" && export TMPDIR="$scratch_b" && source "$tmp/overlay.sh" && lh_overlay "$THEME_REF" "_site") >"$tmp/overlay.log" 2>&1; then
  # lh_overlay makes two temp dirs: the theme clone (a git repo) and the build dir.
  work=""
  for d in "$scratch_b"/*/; do [ -d "$d.git" ] || work="${d%/}"; done
  if [ -n "$work" ]; then
    check_output "lh_overlay" "$work" "$tmp/consumer-b/_site"
  else
    log_error "  ✗ lh_overlay: no separate build dir (theme cloned into the build dir)"; ((FAIL+=1))
    assert "lh_overlay: index.html built in the caller's _site" test -f "$tmp/consumer-b/_site/index.html"
  fi
else
  log_error "  ✗ lh_overlay failed to run:"; grep -m3 -iE 'error|exception' "$tmp/overlay.log" >&2 || tail -5 "$tmp/overlay.log" >&2; ((FAIL+=1))
fi

echo
log_info "build-overlay recipe: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
