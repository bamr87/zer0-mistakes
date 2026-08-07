#!/usr/bin/env bash
# Feature: ZER0-078
# test/test_i18n.sh — multilingual translation pipeline (scripts/translate.rb)
#
# Exercises the translation utility end-to-end with the offline stub
# provider in a throwaway sandbox repo: generation, URL mapping, markdown
# safety (fences/Liquid/inline code preserved), incremental change
# detection, pruning, --check and --dry-run. Also asserts the theme-side
# i18n wiring (config keys, includes, generated-data namespace) exists.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colored log helpers (same pattern as test_core.sh — no common.sh dependency)
BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

PASS=0; FAIL=0
TRANSLATE="$REPO_ROOT/scripts/translate.rb"

assert() {                              # assert "<message>" <command…>
  local msg="$1"; shift
  if "$@" >/dev/null 2>&1; then
    log_info "  ✓ $msg"; ((PASS+=1))
  else
    log_error "  ✗ $msg"; ((FAIL+=1))
  fi
}

sandbox=$(mktemp -d)
trap 'rm -rf "$sandbox"' EXIT

# ---------------------------------------------------------------------------
# Sandbox fixture: a miniature site mirroring the real permalink patterns
# ---------------------------------------------------------------------------
build_sandbox() {
  mkdir -p "$sandbox/pages/_posts" "$sandbox/pages/_docs" "$sandbox/pages/_quickstart" "$sandbox/_data"

  cat > "$sandbox/_config.yml" <<'YAML'
collections_dir: pages
collections:
  posts:
    output: true
    permalink: /:collection/:year/:month/:day/:slug/
  docs:
    output: true
    permalink: /:collection/:categories/:name/
  quickstart:
    output: true
    permalink: /:collection/:name/
permalink: pretty
translation:
  enabled: true
  source_lang: en
  languages: [fr]
  provider: stub
  ui_text: true
  sources:
    - path: pages/_posts
      output: posts
    - path: pages/_docs
      output: docs
    - path: pages/_quickstart
      output: quickstart
  exclude:
    - "**/README.md"
YAML

  cat > "$sandbox/pages/_posts/2026-01-15-hello-world.md" <<'MD'
---
title: Hello World
description: A first post about the theme.
categories: [intro]
tags: [jekyll]
---

# Hello World

This is a paragraph with `inline code` and a [link](https://example.com/docs) plus {{ site.title }} output.

```bash
echo "do not translate me"
```

Another paragraph mentioning [[Wiki Page]] targets.
MD

  cat > "$sandbox/pages/_docs/setup-guide.md" <<'MD'
---
title: Setup Guide
description: How to set things up.
categories: [getting-started]
---

Follow the steps below.

{% include components/callout.html %}

Done.
MD

  cat > "$sandbox/pages/_quickstart/install.md" <<'MD'
---
title: Install
permalink: /quickstart/install/
---

Run the installer.
MD

  cat > "$sandbox/pages/_docs/README.md" <<'MD'
---
title: Excluded
---

Should never be translated.
MD

  # Source doc using a collection-only layout. Valid here (it IS a collection
  # document) but not once copied into the flat translated tree — see
  # test_collection_layout_dropped.
  cat > "$sandbox/pages/_docs/index.md" <<'MD'
---
title: Docs Index
layout: collection
---

Browse the docs.
MD

  # Same, with an ordinary layout that must survive translation untouched.
  cat > "$sandbox/pages/_docs/guide.md" <<'MD'
---
title: Guide
layout: default
---

A guide.
MD

  cat > "$sandbox/_data/ui-text.yml" <<'YAML'
en:
  search_label: "Search"
  back_to_top: "Back to top"
YAML
}

run_translate() { ruby "$TRANSLATE" --root "$sandbox" "$@"; }

# ---------------------------------------------------------------------------
# Generated prose must satisfy the repo's one-paragraph-per-line rule that
# .github/workflows/markdown-oneline.yml enforces.
#
# Uses the stub-wrap provider, which soft-wraps at 40 columns the way a real
# model does. Against the plain stub this would pass whether or not
# normalisation ran, which is why the wrapping variant exists.
test_prose_normalisation() {
  log_info "Test: generated prose is normalised to one paragraph per line"
  build_sandbox

  local unwrap="$REPO_ROOT/tools/unwrap-prose.py"
  if ! command -v python3 >/dev/null 2>&1 || [[ ! -f "$unwrap" ]]; then
    log_info "  (skipped: python3 or tools/unwrap-prose.py unavailable)"
    return 0
  fi

  run_translate --provider stub-wrap >/dev/null

  local post="$sandbox/fr/posts/2026-01-15-hello-world.md"
  assert "translation is generated with the wrapping provider" test -f "$post"

  # The whole-tree check: nothing the run wrote may still be wrapped.
  assert "generated pages pass the oneline check" python3 "$unwrap" --check "$sandbox/fr"

  # Proof the fixture is meaningful rather than vacuous. The provider wraps at
  # 40 columns, so a prose line longer than that can only exist if
  # normalisation rejoined it.
  assert "a wrapped paragraph was rejoined past the 40-col wrap point" \
    awk 'BEGIN{fm=0} /^---$/{fm++; next} fm>=2 && /\[fr\]$/ && length($0)>40 {found=1} END{exit !found}' "$post"

  # Normalisation must not have touched anything structural on its way through.
  assert "code fence content survives normalisation" \
    grep -q '^echo "do not translate me"' "$post"
  assert "liquid output tag survives normalisation" grep -qF '{{ site.title }}' "$post"
  assert "no placeholder tokens leak after normalisation" \
    bash -c "test -f '$post' && ! grep -q '⟦' '$post'"
}

# ---------------------------------------------------------------------------
test_generation() {
  log_info "Test: full generation with stub provider"
  build_sandbox
  run_translate >/dev/null

  local post="$sandbox/fr/posts/2026-01-15-hello-world.md"
  local doc="$sandbox/fr/docs/setup-guide.md"

  assert "post translation is generated" test -f "$post"
  assert "doc translation is generated" test -f "$doc"
  assert "quickstart translation is generated" test -f "$sandbox/fr/quickstart/install.md"
  assert "excluded README is not translated" bash -c "! test -e '$sandbox/fr/docs/README.md'"

  assert "post gets lang: fr" grep -q '^lang: fr$' "$post"
  assert "post permalink prefixes /fr on the dated URL" \
    grep -q '^permalink: "/fr/posts/2026/01/15/hello-world/"$' "$post"
  assert "doc permalink resolves :categories" \
    grep -q '^permalink: "/fr/docs/getting-started/setup-guide/"$' "$doc"
  assert "explicit front-matter permalink is honored" \
    grep -q '^permalink: "/fr/quickstart/install/"$' "$sandbox/fr/quickstart/install.md"
  assert "translation records its source path" \
    grep -q '^translation_of: pages/_posts/2026-01-15-hello-world.md$' "$post"
  assert "translation records the source URL" \
    grep -q '^translation_source_url: "/posts/2026/01/15/hello-world/"$' "$post"
  assert "translation is flagged machine_translated" grep -q '^machine_translated: true$' "$post"

  assert "title is translated (stub marker)" grep -q '^title: Hello World \[fr\]$' "$post"
  assert "prose lines are translated" grep -q 'This is a paragraph .* \[fr\]$' "$post"
  assert "code fence content is untouched" grep -q '^echo "do not translate me"$' "$post"
  # `test -f` first: a bare `! grep <missing-file>` passes vacuously (grep exits
  # 2, ! flips it to 0), which would mask a generation regression as a PASS.
  assert "no stub marker leaks into the code fence" bash -c "test -f '$post' && ! grep -q 'do not translate me.*\[fr\]' '$post'"
  assert "inline code span survives byte-identical" grep -qF '`inline code`' "$post"
  assert "link destination survives byte-identical" grep -qF '(https://example.com/docs)' "$post"
  assert "liquid output tag survives byte-identical" grep -qF '{{ site.title }}' "$post"
  assert "wiki-link survives byte-identical" grep -qF '[[Wiki Page]]' "$post"
  assert "liquid-only include line is untouched" \
    grep -qF '{% include components/callout.html %}' "$doc"
  assert "no placeholder tokens leak into output" bash -c "test -f '$post' && ! grep -q '⟦' '$post'"

  assert "manifest is generated" test -f "$sandbox/_data/i18n/manifest.yml"
  assert "manifest keys pages by English URL" \
    grep -q '"/posts/2026/01/15/hello-world/":' "$sandbox/_data/i18n/manifest.yml"
  assert "manifest records the fr URL" \
    grep -q 'url: "/fr/posts/2026/01/15/hello-world/"' "$sandbox/_data/i18n/manifest.yml"
  assert "UI strings file is generated" test -f "$sandbox/_data/i18n/fr.yml"
  assert "UI strings are translated (stub marker)" \
    grep -q '^search_label: Search \[fr\]$' "$sandbox/_data/i18n/fr.yml"
  assert "generated files carry a do-not-edit header" \
    grep -q 'GENERATED FILE' "$sandbox/_data/i18n/fr.yml"
}

# ---------------------------------------------------------------------------
# Collection-only layouts must not survive into the translated tree.
#
# fr/** are plain pages, not collection documents, so Jekyll never sets
# `page.collection` there. _layouts/collection.html sorts site[page.collection];
# for a plain page that is nil, and a nil sort aborts the ENTIRE Jekyll build.
# That is exactly how fr/docs/index.md froze the production deploy for two days,
# so this asserts the layout key is dropped (letting the `path: fr` front-matter
# default apply) while ordinary layouts pass through untouched.
test_collection_layout_dropped() {
  log_info "Test: collection-only layouts are dropped from translations"
  build_sandbox
  run_translate >/dev/null

  local idx="$sandbox/fr/docs/index.md"
  local guide="$sandbox/fr/docs/guide.md"

  assert "collection-layout page is still translated" test -f "$idx"
  # test -f first: a bare `! grep <missing-file>` passes vacuously.
  assert "layout: collection is dropped from the translation" \
    bash -c "test -f '$idx' && ! grep -q '^layout: collection\$' '$idx'"
  assert "no layout key is left behind at all" \
    bash -c "test -f '$idx' && ! grep -q '^layout:' '$idx'"
  assert "ordinary layout survives translation" grep -q '^layout: default$' "$guide"
}

test_incremental() {
  log_info "Test: incremental runs skip unchanged sources"
  local out
  out=$(run_translate)
  # Match against the captured output via a here-string, not `echo '$out' |`:
  # a here-string can't be broken by an apostrophe (or other metachar) in a
  # log line the way single-quote-embedding into `bash -c` can.
  assert "second run reports everything up to date" grep -q 'up to date' <<<"$out"

  # Touching content re-translates exactly that page.
  printf '\nA brand new paragraph.\n' >> "$sandbox/pages/_docs/setup-guide.md"
  out=$(run_translate)
  assert "changed source is re-translated" grep -q 'setup-guide.md' <<<"$out"
  # $out passed as a positional arg (not interpolated into the script text) so
  # a metachar in the output can't corrupt the negation.
  assert "unchanged post is not re-translated" \
    bash -c '! grep -q "hello-world" <<<"$1"' _ "$out"
  assert "new paragraph lands in the translation" \
    grep -q 'A brand new paragraph. \[fr\]' "$sandbox/fr/docs/setup-guide.md"
}

test_check_and_dry_run() {
  log_info "Test: --check and --dry-run"
  assert "--check exits 0 when current" run_translate --check

  printf '\nAnother change.\n' >> "$sandbox/pages/_quickstart/install.md"
  assert "--check exits 1 when stale" bash -c "! ruby '$TRANSLATE' --root '$sandbox' --check"

  local before after
  before=$(cat "$sandbox/fr/quickstart/install.md")
  run_translate --dry-run >/dev/null
  after=$(cat "$sandbox/fr/quickstart/install.md")
  assert "--dry-run writes nothing" [ "$before" = "$after" ]

  run_translate >/dev/null
  assert "--check green again after translating" run_translate --check
}

test_prune() {
  log_info "Test: deleted sources are pruned"
  rm "$sandbox/pages/_docs/setup-guide.md"
  run_translate >/dev/null
  assert "orphaned translation is deleted" bash -c "! test -e '$sandbox/fr/docs/setup-guide.md'"
  assert "orphaned manifest entry is removed" \
    bash -c "test -f '$sandbox/_data/i18n/manifest.yml' && ! grep -q 'setup-guide' '$sandbox/_data/i18n/manifest.yml'"
}

test_theme_wiring() {
  log_info "Test: theme-side i18n wiring"
  assert "_config.yml declares the translation block" \
    ruby -ryaml -e 'exit(YAML.safe_load_file("'"$REPO_ROOT"'/_config.yml", aliases: true).key?("translation") ? 0 : 1)'
  assert "core/i18n.html resolver include exists" test -f "$REPO_ROOT/_includes/core/i18n.html"
  assert "language toggle component exists" test -f "$REPO_ROOT/_includes/components/language-toggle.html"
  assert "hreflang include exists" test -f "$REPO_ROOT/_includes/core/hreflang.html"
  assert "translation notice component exists" test -f "$REPO_ROOT/_includes/components/translation-notice.html"
  assert "language metadata exists" test -f "$REPO_ROOT/_data/i18n/languages.yml"
  assert "translate workflow exists" test -f "$REPO_ROOT/.github/workflows/translate.yml"
  assert "ui-text keeps en as source of truth" \
    ruby -ryaml -e 'exit(YAML.safe_load_file("'"$REPO_ROOT"'/_data/ui-text.yml", aliases: true).key?("en") ? 0 : 1)'
  assert "translate.rb syntax is valid" ruby -c "$TRANSLATE"
}

main() {
  log_info "i18n translation pipeline tests"
  test_generation
  test_prose_normalisation
  test_collection_layout_dropped
  test_incremental
  test_check_and_dry_run
  test_prune
  test_theme_wiring
  echo
  log_info "Passed: $PASS  Failed: $FAIL"
  [[ $FAIL -eq 0 ]]
}
main "$@"
