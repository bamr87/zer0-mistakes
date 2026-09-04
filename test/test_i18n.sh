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
WORKFLOW="$REPO_ROOT/.github/workflows/translate.yml"

assert() {                              # assert "<message>" <command…>
  local msg="$1"; shift
  if "$@" >/dev/null 2>&1; then
    log_info "  ✓ $msg"; ((PASS+=1))
  else
    log_error "  ✗ $msg"; ((FAIL+=1))
  fi
}

refute() {                              # refute "<message>" <command…>  (must FAIL)
  local msg="$1"; shift
  if "$@" >/dev/null 2>&1; then
    log_error "  ✗ $msg"; ((FAIL+=1))
  else
    log_info "  ✓ $msg"; ((PASS+=1))
  fi
}

sandbox=$(mktemp -d)
trap 'rm -rf "$sandbox"' EXIT

# Read one field of a named step in translate.yml's `translate` job, addressed
# by dotted path (e.g. "if", "with.add-paths"). Parses the YAML rather than
# grepping it, so reformatting the workflow can't silently pass the assertions.
# Prints the empty string when the field is absent.
wf_step_field() {                       # wf_step_field "<step name>" "<dotted path>"
  ruby -ryaml -e '
    wf   = YAML.safe_load_file(ARGV[0], aliases: true)
    step = (wf.dig("jobs", "translate", "steps") || []).find { |s| s["name"] == ARGV[1] }
    abort("no step named #{ARGV[1].inspect} in translate.yml") unless step
    val  = ARGV[2].split(".").reduce(step) { |acc, k| acc.is_a?(Hash) ? acc[k] : nil }
    print(val.nil? ? "" : val.to_s)
  ' "$WORKFLOW" "$1" "$2"
}

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

Nested masks — a Liquid expression inside a link destination, and inside an
inline code span. Both shapes are masked twice (the inner Liquid first, then
the enclosing link/code span), so they are what a single-pass unmask strands
as a literal placeholder. Keep them here: they give the "no placeholder tokens
leak into output" assertion below its teeth.

Token files are addressable — [colors]({{ '/tokens/colors.css' | relative_url }}) and [motion]({{ '/tokens/motion.css' | relative_url }}).

| Variable | Description |
|----------|-------------|
| `{{ content }}` | Page content |
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
  assert "liquid nested in a link destination survives byte-identical" \
    grep -qF "[colors]({{ '/tokens/colors.css' | relative_url }})" "$post"
  assert "liquid nested in an inline code span survives byte-identical" \
    grep -qF '`{{ content }}`' "$post"
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

# ---------------------------------------------------------------------------
# A single failed page must not discard the pages that succeeded.
#
# translate.rb exits 1 when ANY unit fails, and a workflow `if:` with no status
# function carries an implicit `success()`. Together those threw away 49 good
# translations — ~21 minutes of paid model inference — because one page failed
# validation (run 30477839691). The guard is the pair of `!cancelled()` gates
# plus the blast-radius limits that make partial output safe to push; this
# asserts all of them, and that the failure is still *reported* (no
# continue-on-error, exit code unchanged).
test_partial_output_survives_failure() {
  log_info "Test: a failed page does not discard the pages that succeeded"

  local pr_if norm_if pr_ce run_ce add_paths branch
  pr_if=$(wf_step_field "Open PR with generated translations" "if")
  norm_if=$(wf_step_field "Normalise generated prose" "if")
  pr_ce=$(wf_step_field "Open PR with generated translations" "continue-on-error")
  run_ce=$(wf_step_field "Run translation" "continue-on-error")
  add_paths=$(wf_step_field "Open PR with generated translations" "with.add-paths")
  branch=$(wf_step_field "Open PR with generated translations" "with.branch")

  assert "PR step gates on !cancelled(), not the implicit success()" \
    grep -qF '!cancelled()' <<<"$pr_if"
  assert "prose normalisation also runs on a partially-failed run" \
    grep -qF '!cancelled()' <<<"$norm_if"
  # always() would also push from a cancelled run, which must stay a no-op.
  assert "PR step does not use always()" \
    bash -c '! grep -qF "always()" <<<"$1"' _ "$pr_if"
  assert "PR step still skips dry runs" grep -qF 'dry_run' <<<"$pr_if"

  # The run must still go red — the fix is "stop binning the output", not
  # "stop reporting the failure".
  assert "PR step does not suppress failure with continue-on-error" test -z "$pr_ce"
  assert "translation step does not suppress failure with continue-on-error" test -z "$run_ce"
  assert "translate.rb still exits non-zero when any page failed" \
    grep -qF '@stats[:failed].positive? ? 1 : 0' "$TRANSLATE"

  # What bounds a partial push: only generated trees, onto one stable branch
  # that the next run tops up.
  assert "add-paths still includes fr" grep -qx 'fr' <<<"$add_paths"
  assert "add-paths still includes _data/i18n" grep -qx '_data/i18n' <<<"$add_paths"
  assert "add-paths lists nothing beyond fr and _data/i18n" \
    awk 'NF && $0 != "fr" && $0 != "_data/i18n" { bad = 1 } END { exit bad }' <<<"$add_paths"
  assert "PR still targets the stable chore/i18n-translations branch" \
    test "$branch" = "chore/i18n-translations"
}

# ---------------------------------------------------------------------------
# Unit checks that load translate.rb as a library.
#
# Everything above drives the offline stub provider, which never reaches the
# credential path and never lets a page fail — so neither the auth fallback nor
# the manifest write guard is reachable from the pipeline tests.
# ---------------------------------------------------------------------------
rb_check() {                            # rb_check "<message>"  (ruby script on stdin)
  local msg="$1" f
  f=$(mktemp "$sandbox/unit-XXXXXX.rb")
  { printf 'require "%s"\n' "$TRANSLATE"; cat; } > "$f"
  assert "$msg" env SANDBOX="$sandbox" ruby "$f"
}

test_manifest_write_guard() {
  log_info "Test: the manifest is not rewritten by a run that changed nothing"

  rb_check "a no-op save leaves the manifest byte-identical" <<'RUBY'
require "fileutils"
root = File.join(ENV.fetch("SANDBOX"), "manifest-unit")
path = File.join(root, "_data", "i18n", "manifest.yml")
FileUtils.rm_rf(root)

m = Zer0Translate::Manifest.new(root)
m.entry_for("/hello/")["fr"] = { "url" => "/fr/hello/" }
m.save("en", ["fr"])
abort "manifest was not written at all" unless File.file?(path)

# Backdate the stamp so an unwanted bump is unmistakable.
sentinel = "2020-01-01T00:00:00Z"
raw = File.read(path, encoding: "bom|utf-8")
File.write(path, raw.sub(/^updated_at:.*$/, "updated_at: '#{sentinel}'"))
before = File.read(path, encoding: "bom|utf-8")

# The regression: every page failing used to still stamp updated_at, producing
# a one-line diff that opened a PR looking like a routine refresh of nothing.
again = Zer0Translate::Manifest.new(root)
again.save("en", ["fr"])
abort "no-op save rewrote the manifest" unless File.read(path, encoding: "bom|utf-8") == before
RUBY

  rb_check "a real change still stamps updated_at and writes" <<'RUBY'
root = File.join(ENV.fetch("SANDBOX"), "manifest-unit")
path = File.join(root, "_data", "i18n", "manifest.yml")
before = File.read(path, encoding: "bom|utf-8")

changed = Zer0Translate::Manifest.new(root)
changed.entry_for("/second/")["fr"] = { "url" => "/fr/second/" }
changed.save("en", ["fr"])

after = File.read(path, encoding: "bom|utf-8")
abort "a real change did not rewrite the manifest" if after == before
abort "a real change did not refresh updated_at" if after.include?("2020-01-01T00:00:00Z")
abort "the new page is missing from the manifest" unless after.include?("/second/")
RUBY
}

test_credential_fallback() {
  log_info "Test: a rejected credential falls back to the next configured one"

  rb_check "a revoked OAuth token falls back to ANTHROPIC_API_KEY" <<'RUBY'
require "json"
FakeResp = Struct.new(:code, :body) { def [](_key) = nil }

ENV["ANTHROPIC_AUTH_TOKEN"]   = nil
ENV["CLAUDE_CODE_OAUTH_TOKEN"] = "revoked-oauth"
ENV["ANTHROPIC_API_KEY"]       = "good-key"

provider = Zer0Translate::ClaudeProvider.new(model: "test-model", max_tokens: 64)
seen = []
provider.define_singleton_method(:post) do |payload|
  hdrs = send(:headers)
  seen << { headers: hdrs, payload: payload }
  if hdrs.key?("authorization")
    FakeResp.new("401", JSON.generate("error" => { "message" => "OAuth access token has been revoked." }))
  else
    FakeResp.new("200", JSON.generate("content" => [{ "type" => "text",
                                                      "text" => JSON.generate("s1" => "bonjour") }]))
  end
end

out = provider.translate({ "s1" => "hello" }, "fr", "ctx")
abort "fallback produced no translation: #{out.inspect}" unless out == { "s1" => "bonjour" }
abort "expected one retry, saw #{seen.size} request(s)" unless seen.size == 2
abort "first attempt should present the OAuth bearer" unless seen[0][:headers].key?("authorization")
abort "second attempt should present the API key" unless seen[1][:headers].key?("x-api-key")

# The Claude Code identity block is OAuth-only, so the retry has to rebuild the
# payload — reusing the first one would send a system block the API key must not
# carry. This is why translate() builds inside the begin rather than hoisting.
abort "OAuth attempt lost its Claude Code identity block" \
  unless seen[0][:payload][:system][0][:text].include?("Claude Code")
abort "API-key attempt kept the OAuth-only identity block" \
  if seen[1][:payload][:system][0][:text].include?("Claude Code")

# Sticky: a dead credential costs one rejection in total, not one per chunk.
provider.translate({ "s1" => "hello" }, "fr", "ctx")
abort "fallback is not sticky — the dead credential was retried" unless seen.size == 3
abort "third attempt should present the API key" unless seen[2][:headers].key?("x-api-key")
RUBY

  rb_check "a rejected sole credential still fails, and is tried only once" <<'RUBY'
require "json"
FakeResp = Struct.new(:code, :body) { def [](_key) = nil }

ENV["CLAUDE_CODE_OAUTH_TOKEN"] = "revoked-oauth"
ENV["ANTHROPIC_AUTH_TOKEN"]    = nil
ENV["ANTHROPIC_API_KEY"]       = nil

provider = Zer0Translate::ClaudeProvider.new(model: "test-model", max_tokens: 64)
calls = 0
provider.define_singleton_method(:post) do |_payload|
  calls += 1
  FakeResp.new("401", JSON.generate("error" => { "message" => "OAuth access token has been revoked." }))
end

begin
  provider.translate({ "s1" => "hello" }, "fr", "ctx")
  abort "a rejected sole credential must still raise"
rescue Zer0Translate::ClaudeProvider::ProviderError => e
  abort "the raised error lost the API message" unless e.message.include?("revoked")
end
abort "a sole credential should be attempted exactly once, saw #{calls}" unless calls == 1
RUBY

  rb_check "with no credential configured at all, construction still fails fast" <<'RUBY'
ENV["CLAUDE_CODE_OAUTH_TOKEN"] = nil
ENV["ANTHROPIC_AUTH_TOKEN"]    = nil
ENV["ANTHROPIC_API_KEY"]       = nil
begin
  Zer0Translate::ClaudeProvider.new(model: "test-model", max_tokens: 64)
  abort "expected a missing-credential error"
rescue RuntimeError => e
  abort "unhelpful message: #{e.message}" unless e.message.include?("No Anthropic credential")
end
RUBY
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

# ---------------------------------------------------------------------------
# T-038 / #406 — the compact language menu.
#
# The navbar ("default") variant of language-toggle.html is NOT rendered on the
# theme's own pages (the theme ships the panel variant; the navbar is reserved
# for main navigation, and test/visual/features/language-toggle.spec.js asserts
# exactly that). Playwright therefore cannot reach the trigger button, so the
# icon-only/no-caret half of #406 is pinned statically here. The menu semantics
# that ARE rendered are covered in the Playwright spec; these assertions cover
# the markup contract for both variants plus the SCSS width cap.
# ---------------------------------------------------------------------------
test_language_menu() {
  log_info "Test: compact language menu (T-038 / #406)"
  local toggle="$REPO_ROOT/_includes/components/language-toggle.html"
  local navbar_scss="$REPO_ROOT/_sass/core/_navbar.scss"

  # --- Trigger: icon-only, caret-free, square, still accessible -------------
  refute "trigger drops the Bootstrap caret (no dropdown-toggle class)" \
    grep -q 'class="btn nav-lang-button dropdown-toggle"' "$toggle"
  refute "trigger drops the visible language text span" \
    grep -q 'nav-link-text d-none d-xl-inline' "$toggle"
  assert "trigger is still wired to Bootstrap via data-bs-toggle" \
    grep -q 'data-bs-toggle="dropdown"' "$toggle"
  assert "trigger keeps an aria-label" grep -q 'aria-label="{{ ui.lang_toggle_aria' "$toggle"
  assert "trigger's title names the current language" \
    grep -q 'title="{{ ui.lang_toggle_label | default: .Language. }}: {{ _lt_current_name }}"' "$toggle"
  assert "trigger is a 38px square" grep -q 'width: 2.375rem;' "$navbar_scss"

  # --- Menu: no dead rows, one footnote, capped width -----------------------
  # Match the MARKUP, not the word — the comments legitimately discuss the
  # disabled rows this change removed.
  refute "no row carries a disabled class in either variant" \
    grep -qE 'class="[^"]*\bdisabled\b' "$toggle"
  refute "no aria-disabled rows remain in either variant" grep -q 'aria-disabled=' "$toggle"
  refute "current row no longer uses Bootstrap's .active primary fill" \
    grep -q 'dropdown-item active\|list-group-item-action active' "$toggle"
  assert "current row is marked .is-current" grep -q 'nav-lang-item is-current' "$toggle"
  assert "current row keeps aria-current for AT" grep -q 'aria-current="true"' "$toggle"
  assert "current row carries a check icon" grep -q 'bi-check2 nav-lang-check' "$toggle"
  assert "untranslated rows are links, not spans" \
    grep -q '<a class="dropdown-item nav-lang-item is-untranslated"' "$toggle"
  assert "untranslated rows fall back to the source URL" \
    grep -q 'is-untranslated" data-lang="{{ _lt_lang }}" hreflang="{{ _lt_source }}" href="{{ _lt_fallback_url }}"' "$toggle"
  assert "untranslated rows point at the single footnote" \
    grep -q 'aria-describedby="{{ _lt_note_id }}"' "$toggle"
  refute "per-row '(Not yet translated)' text is gone" \
    grep -q 'text-body-secondary">({{ ui.lang_not_available' "$toggle"
  assert "the footnote renders only when something is untranslated" \
    grep -q '{%- if _lt_untranslated > 0 %}' "$toggle"
  assert "machine translations carry an auto chip" grep -q 'class="nav-lang-auto"' "$toggle"
  assert "the menu is capped at 220px" grep -q 'max-width: 220px;' "$navbar_scss"

  # --- The chip/footnote strings resolve, translated page or not ------------
  # core/i18n.html REPLACES `ui` wholesale on a translated page, so a key added
  # to ui-text.yml is missing from _data/i18n/<lang>.yml until translate.rb
  # regenerates it. Every new key must therefore carry a literal fallback.
  local key
  for key in lang_machine_translated lang_machine_translated_title lang_untranslated_note; do
    assert "ui-text.yml en defines $key" \
      grep -qE "^  $key +:" "$REPO_ROOT/_data/ui-text.yml"
    assert "$key has a literal fallback in the include" \
      grep -q "ui.$key | default: '" "$toggle"
  done
}

main() {
  log_info "i18n translation pipeline tests"
  test_generation
  test_prose_normalisation
  test_collection_layout_dropped
  test_incremental
  test_check_and_dry_run
  test_prune
  test_partial_output_survives_failure
  test_manifest_write_guard
  test_credential_fallback
  test_theme_wiring
  test_language_menu
  echo
  log_info "Passed: $PASS  Failed: $FAIL"
  [[ $FAIL -eq 0 ]]
}
main "$@"
