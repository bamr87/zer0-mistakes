---
applyTo: "_data/features.yml,features/features.yml,features/README.md,pages/features.md,_includes/components/feature-card.html,scripts/validate-features.rb,scripts/tag-features,test/test_features.sh"
description: "Feature registry maintenance — schema, sync contract, and update-on-change rules for zer0-mistakes."
date: 2026-05-18T12:00:00.000Z
lastmod: 2026-05-18T12:00:00.000Z
---

# Feature Registry Instructions

The feature registry is the single source of truth for what the theme does. It powers `pages/features.md`, the `feature-card.html` include, and external documentation. **Whenever code changes add, remove, or materially alter a feature, the registry MUST be updated in the same commit.**

## 📂 Files in Scope

| File | Role |
| --- | --- |
| `features/features.yml` | Editable master registry |
| `_data/features.yml` | Jekyll-consumed copy (must be byte-identical to master) |
| `features/README.md` | Human index — keep feature count + category list current |
| `pages/features.md` | Showcase page — uses `site.data.features.features` |
| `_includes/components/feature-card.html` | Renderer — defines which fields are surfaced |

> Both YAML files exist for historical reasons. Until consolidated, `features/features.yml` → `_data/features.yml` is a hard sync. Do not edit only one.

## 🧬 Feature Schema

```yaml
- id: ZER0-XXX                # REQUIRED. Sequential, zero-padded to 3 digits. Never reuse or reorder.
  title: "Short Name"          # REQUIRED. Title-case, no trailing punctuation.
  description: "One sentence." # REQUIRED. Plain prose, ≤ 200 chars.
  implemented: true            # REQUIRED. true | false (use false for planned/in-progress).
  version: "X.Y.Z"             # REQUIRED. Gem version that introduced/last materially changed it.
  link: "/path/"               # REQUIRED. Live URL or "/" if no dedicated page.
  docs: "/docs/path/"          # REQUIRED. Public docs URL (prefer `/docs/...` over GitHub URLs).
  tags: [tag1, tag2]           # REQUIRED. Lowercase, kebab-case. Used by features.md filters.
  date: YYYY-MM-DD             # REQUIRED. Date the feature was added or last materially changed.
  provenance:                  # REQUIRED (active features). How the feature reached main.
    introduced_in: "X.Y.Z"     #   REQUIRED. Gem version that introduced it (mirrors `version`).
    pr: 123                    #   REQUIRED key — integer PR number, or null for pre-PR-era commits.
    commit: "abc1234"          #   REQUIRED. 7–40-char introducing commit hash.
    issue: 456                 #   REQUIRED key — integer issue number, or null.
  tests:                       # REQUIRED (active features). ≥1 entry; each is either:
    - "test/visual/foo.spec.js"  #   a real test path that exists, OR
    - na: "CI workflow X; no unit test applicable"  #   a justified exemption.
  references:                  # OPTIONAL but strongly recommended. File paths from repo root.
    layouts: [...]
    includes: [...]
    scripts: [...]
    config: "..."
    docs: "..."
  features: [...]              # OPTIONAL. Sub-capability bullets shown by feature-card.html.
```

### Field rules

- **`id`** — Allocate the next free `ZER0-NNN`. Never recycle a retired ID; mark removed features `implemented: false` and append `removed_in: "X.Y.Z"` instead of deleting.
- **`tags`** — Reuse existing tags before inventing new ones (`grep -hoE "[a-z0-9-]+" _data/features.yml | sort -u` for the current set). Filters in `pages/features.md` rely on stable tag names (`ai`, `docker`, `jekyll`, `bootstrap`, `privacy`, `analytics`, `navigation`, `accessibility`, `ui`, `content`, `jupyter`, `mermaid`, `testing`, `ci-cd`, `automation`, `release`, …).
- **`docs`** — Prefer site-relative paths (`/docs/features/foo/`) so links survive repo moves. External GitHub URLs are allowed only when no public doc exists.
- **`references`** — Use real paths that exist at commit time. Stale references break trust in the registry.
- **`provenance`** — Resolve from git: `git log --follow --diff-filter=A -- <primary reference file>` gives the introducing commit; a `(#N)` suffix in its subject is the `pr`; cross-check the matching `## [version]` block in `CHANGELOG.md` for the `issue`. Pre-PR-era features use `pr: null` with the commit hash. Rendered on `/features/` as a `PR · commit` link.
- **`tests`** — Every active feature names the test(s) that guard it. Use a real path (a `test/visual/*.spec.js`, `test/test_*.sh`, or `test/*.rb|js`) when one exercises the feature; use `- na: "<reason>"` only for doc/CI/process features, and the reason MUST name the governing workflow or doc. Removed features (`implemented: false`) need neither `provenance` nor `tests`.

## 🛡 Validation Gate (enforced)

The `features` test suite (`test/test_features.sh`, registered in `test_runner.sh` + CI, and run by `scripts/bin/validate`) **hard-fails** on:

1. `scripts/validate-features.rb` — master/`_data` drift, schema violations,
stale reference paths, a removed feature missing `removed_in`, and a missing/malformed `provenance` **or** `tests` block on an active feature.
2. `scripts/tag-features --check` — **reverse traceability**: every source file
a feature lists under `references:` must carry a top-of-file `Feature: ZER0-NNN` comment (the code→registry link, mirroring the registry→code `references:`). Scope and placement are owned by the tool; markdown docs, JSON, vendored/minified libs, directory refs, and `_config.yml` are exempt.

Run both locally before committing a registry or feature change:

```bash
ruby scripts/validate-features.rb        # registry integrity
ruby scripts/tag-features --check        # source-file tags (…--write to apply)
# or, both plus the README-count check:  ./test/test_runner.sh --suites features
```

## 🔄 Sync Contract (REQUIRED)

After every edit:

```bash
# From repo root
cp features/features.yml _data/features.yml
diff -q features/features.yml _data/features.yml   # must report no difference
python3 -c "import yaml; yaml.safe_load(open('_data/features.yml'))"
```

The two files must be byte-identical. CI / reviewers may reject PRs where they drift.

## 📝 Header Metadata (REQUIRED)

The top of `_data/features.yml` (and its master) carries:

```yaml
# Version: <current gem version from lib/jekyll-theme-zer0/version.rb>
# Last Updated: <YYYY-MM-DD of this edit>
```

**Update both lines on every change to the registry.** Do not leave them stale (a registry header older than the gem version is a code-review blocker).

Also update the `Current count: **N features**` line and the **Categories** list in `features/README.md` whenever the feature count or category set changes.

## 🚦 When to Touch the Registry

Add, modify, or flag (`implemented: false` + `removed_in:`) an entry **in the same commit** as any of the following:

| Code change | Registry action |
| --- | --- |
| New layout, include, plugin, script, or workflow that ships user-visible behavior | Add a new `ZER0-NNN` entry **with `provenance` + `tests`**, then `ruby scripts/tag-features --write` to tag its source files — all in the same change |
| Material change to an existing feature (new sub-capability, new dependency, new docs) | Bump `version`, refresh `date`, update `features:` / `references:` |
| Renaming or moving referenced files | Update every affected `references:` block |
| Removing a feature | Set `implemented: false`, add `removed_in: "X.Y.Z"`, keep the entry |
| Cutting a release (`./scripts/bin/release …`) | Bump the `# Version:` header to the new gem version, refresh `# Last Updated:` |

Documentation-only changes (typos, formatting in `pages/features.md` or `features/README.md`) do **not** require a `version` bump on individual feature entries.

## ✅ Validation Checklist (run before commit)

- [ ] `features/features.yml` and `_data/features.yml` are identical (`diff -q`)
- [ ] YAML parses (`python3 -c "import yaml; yaml.safe_load(open('_data/features.yml'))"`)
- [ ] Header `# Version:` matches `lib/jekyll-theme-zer0/version.rb`
- [ ] Header `# Last Updated:` is today
- [ ] `features/README.md` feature count matches `grep -c "^  - id: ZER0-" _data/features.yml`
- [ ] All `references:` paths exist in the repo
- [ ] Every active feature has a `provenance:` block and a `tests:` block
- [ ] `ruby scripts/validate-features.rb` passes (the canonical gate)
- [ ] `ruby scripts/tag-features --check` passes (referenced source files carry their `Feature: ZER0-NNN` comment; `--write` applies them)
- [ ] Jekyll renders the showcase page without Liquid errors:
      `docker-compose exec -T jekyll bundle exec jekyll build --config '_config.yml,_config_dev.yml'`

## 🧱 Renderer Contract (`feature-card.html`)

When adding fields, check the include — only fields it reads will appear on `/features/`. Adding a field to YAML without updating the renderer is silent dead data. If a new field should be surfaced, extend `_includes/components/feature-card.html` and document the parameter in its header comment.

---

_Keep this file short. Project-wide conventions live in [`copilot-instructions.md`](../copilot-instructions.md); release/version mechanics live in [`version-control.instructions.md`](./version-control.instructions.md)._
