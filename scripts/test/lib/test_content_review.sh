#!/bin/bash

# Unit tests for the scripts/content-review.rb scoring engine (issue #166).
#
# content-review.rb is the deterministic (no-API) tier of the AI content
# reviewer. It had zero direct unit coverage — it only ran as a side effect of
# the ai-content-review workflow on PRs touching pages/**. A scoring regression
# (code-fence false-positive) shipped in v1.18 and was fixed in v1.18.1 (PR
# #155), which is exactly the class of bug a unit test catches.
#
# These tests drive the real production config + schema
# (.github/config/content_review.yml, frontmatter_schema.yml) against synthetic
# Markdown fixtures, so they exercise the actual thresholds rather than a copy
# that can drift. Fixtures live under a temp `pages/_docs/**` tree so the
# production scope/path-pattern globs match without polluting the content dirs.
#
# Run under LC_ALL=C LANG=C for locale-independence parity with the T-015 guard.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
CR_SCRIPT="$REPO_ROOT/scripts/content-review.rb"
CR_CONFIG="$REPO_ROOT/.github/config/content_review.yml"
CR_SCHEMA="$REPO_ROOT/.github/config/frontmatter_schema.yml"

echo "Testing content-review.rb scoring engine..."

# --- Fixture workspace -------------------------------------------------------
CR_WORK="$(mktemp -d)"
mkdir -p "$CR_WORK/pages/_docs/test"

# A well-formed docs page: complete front matter, in-range title/description,
# a keyword list, an H2, a language-tagged code fence, and an image with alt
# text. Should score high (no errors; at most cosmetic info items).
cat > "$CR_WORK/pages/_docs/test/good.md" <<'EOF'
---
title: Getting Started with the Zer0 Mistakes Theme
description: A friendly, complete walkthrough that takes you from an empty repository all the way to a deployed Zer0 Mistakes site in roughly ten short minutes.
lastmod: 2026-06-23T00:00:00.000Z
layout: default
categories:
  - docs
tags:
  - jekyll
  - setup
keywords:
  - jekyll
  - theme
  - setup
---

## Overview

This guide walks you through installing the theme, configuring your site, and
publishing it to GitHub Pages. Each step is short and copy-pasteable so you can
get a working site quickly without guessing at the details. We cover the local
development loop first, then the production deployment, and finally a few
verification checks so you know everything is wired up correctly before you
share the link with anyone else who might be reviewing your brand new site.

## Install

Run the bundled installer and start the development server with these commands:

```bash
bundle install
bundle exec jekyll serve
```

![Screenshot of the running theme](/assets/images/example.png)
EOF

# Same page with the required `description` removed: one frontmatter error
# (required field) plus one SEO warning (no meta description). Must score
# strictly lower than the well-formed page.
cat > "$CR_WORK/pages/_docs/test/missing-desc.md" <<'EOF'
---
title: Getting Started with the Zer0 Mistakes Theme
lastmod: 2026-06-23T00:00:00.000Z
layout: default
categories:
  - docs
tags:
  - jekyll
  - setup
keywords:
  - jekyll
  - theme
  - setup
---

## Overview

This guide walks you through installing the theme, configuring your site, and
publishing it to GitHub Pages. Each step is short and copy-pasteable so you can
get a working site quickly without guessing at the details. We cover the local
development loop first, then the production deployment, and finally a few
verification checks so you know everything is wired up correctly before you
share the link with anyone else.
EOF

# A page whose only code fence is properly language-tagged. The closing bare
# ``` must NOT be flagged as a fence without a language (the v1.18.1 regression).
cat > "$CR_WORK/pages/_docs/test/codefence.md" <<'EOF'
---
title: Configuring the Zer0 Mistakes Theme Options
description: A focused reference covering the handful of configuration options you will set most often when tailoring the Zer0 Mistakes theme to your own project.
lastmod: 2026-06-23T00:00:00.000Z
layout: default
categories:
  - docs
tags:
  - jekyll
  - config
keywords:
  - jekyll
  - config
  - options
---

## Configuration

Set the options you need in your config file, then restart the server so the
changes take effect. The example below shows the most common starting point for
a new site and is safe to copy verbatim into your own configuration before you
begin customizing anything else about the project.

```yaml
title: My Site
description: A site built with the theme
```
EOF

# A clearly failing page: missing description, layout, categories, and tags
# (four required-field errors) — well below the fail threshold.
cat > "$CR_WORK/pages/_docs/test/failing.md" <<'EOF'
---
title: Bad
lastmod: 2026-06-23T00:00:00.000Z
---

Too short.
EOF

# --- Helpers -----------------------------------------------------------------
# Run the reviewer against one fixture (path relative to CR_WORK), writing JSON.
# Echoes nothing; returns the script's exit code.
cr_run() { # $1 = relative md path, $2 = json out path, $3..= extra args
  local rel="$1" out="$2"; shift 2
  ( cd "$CR_WORK" && LC_ALL=C LANG=C ruby "$CR_SCRIPT" \
      --files "$rel" --config "$CR_CONFIG" --schema "$CR_SCHEMA" \
      --json "$out" --quiet "$@" >/dev/null 2>&1 )
}

cr_score() { # $1 = json path -> prints first file's score
  ruby -E UTF-8 -rjson -e 'puts JSON.parse(File.read(ARGV[0]))["files"][0]["score"]' "$1"
}

cr_collection() { # $1 = json path -> prints detected collection
  ruby -E UTF-8 -rjson -e 'puts JSON.parse(File.read(ARGV[0]))["files"][0]["collection"]' "$1"
}

cr_has_message() { # $1 = json path, $2 = substring -> exit 0 if any issue contains it
  ruby -E UTF-8 -rjson -e 'd=JSON.parse(File.read(ARGV[0]))["files"][0]; exit(d["issues"].any?{|i| i["message"].include?(ARGV[1])} ? 0 : 1)' "$1" "$2"
}

# --- Run + assert ------------------------------------------------------------
cr_run "pages/_docs/test/good.md"        "$CR_WORK/good.json"
cr_run "pages/_docs/test/missing-desc.md" "$CR_WORK/missing.json"
cr_run "pages/_docs/test/codefence.md"   "$CR_WORK/codefence.json"

GOOD_SCORE="$(cr_score "$CR_WORK/good.json")"
MISSING_SCORE="$(cr_score "$CR_WORK/missing.json")"

assert_equals "docs" "$(cr_collection "$CR_WORK/good.json")" \
    "fixture under pages/_docs/** is detected as the 'docs' collection"

assert_true "[ '${GOOD_SCORE:-0}' -ge 80 ]" \
    "a well-formed docs page scores >= 80 (got ${GOOD_SCORE})"

assert_true "[ '${MISSING_SCORE:-100}' -lt '${GOOD_SCORE:-0}' ]" \
    "removing the required description lowers the score (${MISSING_SCORE} < ${GOOD_SCORE})"

assert_true "cr_has_message '$CR_WORK/missing.json' 'description'" \
    "the missing-description page reports a description issue"

assert_false "cr_has_message '$CR_WORK/codefence.json' 'Code fence without a language'" \
    "a closing bare \`\`\` after a tagged fence is not flagged (v1.18.1 regression guard)"

# --strict exit behaviour: a failing page exits 0 in warn mode, non-zero strict.
cr_run "pages/_docs/test/failing.md" "$CR_WORK/failing.json"
FAILING_SCORE="$(cr_score "$CR_WORK/failing.json")"
assert_true "[ '${FAILING_SCORE:-100}' -lt 70 ]" \
    "the failing fixture scores below the 70 fail threshold (got ${FAILING_SCORE})"

cr_run "pages/_docs/test/failing.md" "$CR_WORK/failing-warn.json"
assert_equals "0" "$?" \
    "without --strict, a failing page still exits 0 (advisory mode)"

cr_run "pages/_docs/test/failing.md" "$CR_WORK/failing-strict.json" --strict
assert_equals "1" "$?" \
    "with --strict, a failing page exits non-zero (1)"

# --- Cleanup -----------------------------------------------------------------
rm -rf "$CR_WORK"

echo -e "\n${GREEN}content-review.rb scoring tests complete${NC}"
