# PR #34 Review — Frontmatter Validation Bug Fixes

Follow-up commit fixing 5 critical correctness bugs discovered while testing the new `scripts/lint-pages` validator and `scripts/lib/frontmatter.sh` library introduced in this PR.

## Issues Found and Fixed

### 1. `YAML.safe_load` rejected `Time` objects (false "YAML parse error")
**Symptom:** 18/18 valid files in `pages/_about/` reported as `YAML parse error`.
**Cause:** Jekyll frontmatter commonly contains ISO-8601 timestamps (`lastmod: 2024-05-25T19:07:46.394Z`) which Ruby's YAML parser deserializes as `Time` instances. `YAML.safe_load` rejects `Time` by default.
**Fix:** Pass `permitted_classes: [Date, Time, Symbol], aliases: true` to all 3 `YAML.safe_load` call sites (`scripts/lint-pages` line 162, `scripts/lib/frontmatter.sh` lines 296 & 325).

### 2. `Time#to_s` does not produce ISO 8601 (false date-format failures)
**Symptom:** Valid `lastmod: 2024-05-25T19:07:46.394Z` flagged because `puts` on a `Time` instance prints `2024-05-25 19:07:46 UTC`, which fails the schema's datetime regex.
**Fix:** `get_frontmatter_field` now formats values explicitly:
- `Time` → `%Y-%m-%dT%H:%M:%S.%LZ` (UTC, milliseconds)
- `Date` → `%Y-%m-%d`
- everything else → `to_s`

### 3. Mid-document `---` misread as frontmatter
**Symptom:** Files with no frontmatter but a horizontal rule `---` somewhere in the body (e.g. `pages/_about/features/STATS_ENHANCEMENT_SUMMARY.md` at line 225) reported as YAML parse errors.
**Cause:** The awk extractor scanned the whole file for the first `---` boundary.
**Fix:** `extract_frontmatter` now requires the file's **first line** to be `---`. Files that don't start with `---` correctly report `No frontmatter block found` instead.

### 4. `set -e` aborted the loop on early-return files
**Symptom:** After hitting a file with no frontmatter, subsequent files in the same collection were silently skipped.
**Cause:** `fm="$(extract_frontmatter "$filepath")"` — when `extract_frontmatter` returned 1, `set -euo pipefail` propagated the exit through the command substitution, killing the calling function (and only that loop iteration's `validate_file` invocation, but in some shells the entire scan).
**Fix:** Wrapped the call in `|| true` to allow the empty-output guard to handle the case.

### 5. Auto-fix produced duplicate `lastmod:` keys
**Symptom:** Running `--fix` against a file with `updated:` (no `lastmod:`) generated two `lastmod:` lines — one freshly-added at top, plus the one renamed from `updated:`.
**Cause:** Required-field check ran before deprecated-field renames, so `lastmod` was added before the rename happened.
**Fix:** Reordered `validate_file` so deprecated-field renames run **first**, frontmatter is re-extracted if any rename occurred, then required-field checks run. Also added a guard: if both deprecated and canonical names already coexist, skip the rename and report it as a manual cleanup.

## Verification

After all fixes, on `pages/_about/`:
- Before: 42 false-positive YAML parse errors masking real issues
- After: 18 files scanned, 0 errors, 20 legitimate warnings (all deprecated `draft:` strings, missing `lastmod`, etc.)

Tested:
- `--collection about` — accurate output
- `--collection docs` — 67 files, 269 legitimate warnings
- `--strict` — exits 1 on errors
- `--report` — prints summary
- `--fix --dry-run` — previews safely
- `--fix` — idempotent (clean re-run reports no issues)

## Known Performance Issue (out of scope)

The validator invokes ~5–10 Ruby subprocesses per file via the `frontmatter.sh` helpers. Full-repo scan currently takes >10 minutes. A follow-up should batch frontmatter extraction into a single Ruby helper. Tracking separately.

## Files Modified
- `scripts/lint-pages` — bugs #1, #4, #5
- `scripts/lib/frontmatter.sh` — bugs #1, #2, #3
