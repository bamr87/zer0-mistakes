# Design-system sync contract

This directory is the in-repo mirror of the **zer0-mistakes Design System** project on [claude.ai/design](https://claude.ai/design/p/e75121c0-9210-42d1-ade3-2c8af9111cbe) (project id `e75121c0-9210-42d1-ade3-2c8af9111cbe`). It exists so the design system can be built from **either** side:

- **Claude Code** edits the theme — tokens change in `_sass/tokens/` (the
single source of truth), the mirror's `tokens/*.css` are updated in the same PR, and the result is pushed to the Claude Design project.
- **Claude Design** edits the design project — components, guideline cards, or
token experiments land there, get pulled here (handoff zip or `DesignSync` reads), and token changes are folded back into `_sass/tokens/` before merge.

Either way, `scripts/design-system-check.rb` (run by the `core` test suite) fails CI when `_sass/tokens/` and `_design-system/tokens/` disagree, so the two worlds cannot drift silently.

## Source-of-truth rules

| Surface | Canonical home | Mirror |
|---------|----------------|--------|
| Design tokens (`--zer0-*`) | `_sass/tokens/*.scss` (+ `_sass/theme/_skins.scss` for skins) | `_design-system/tokens/*.css` |
| Component specs (React + prompts + cards) | `_design-system/components/` | Claude Design project |
| Guideline specimen cards | `_design-system/guidelines/` | Claude Design project |
| Website UI kit | `_design-system/ui_kits/website/` | Claude Design project |
| Design guide (`readme.md`) + `SKILL.md` | `_design-system/` | Claude Design project |
| Brand imagery | `assets/images/` (repo) | `assets/images/` in the Design project |

The token CSS files intentionally ship concrete `--bs-*` / `--bd-*` base values so the design system renders without Bootstrap loaded; in the theme those primitives come from the vendored Bootstrap CSS and `_sass/theme/_css-variables.scss`.

## File map (token pairs checked by CI)

| Theme (source of truth) | Mirror |
|-------------------------|--------|
| `_sass/tokens/_color.scss` | `tokens/colors.css` |
| `_sass/tokens/_spacing.scss` | `tokens/spacing.css` |
| `_sass/tokens/_radius.scss` | `tokens/radius.css` |
| `_sass/tokens/_typography.scss` | `tokens/typography.css` |
| `_sass/tokens/_shadow.scss` | `tokens/shadows.css` |
| `_sass/tokens/_motion.scss` | `tokens/motion.css` |
| `_sass/tokens/_breakpoints.scss` | `tokens/breakpoints.css` |
| `_sass/tokens/_layers.scss` | `tokens/layers.css` |
| `_sass/theme/_skins.scss` | `tokens/skins.css` (skin names + brand hex) |

## Not mirrored in git (on purpose)

| Design-project file | Why absent here |
|---------------------|-----------------|
| `assets/images/*.png` | Byte-identical to `assets/images/` in the repo root — push from there when art changes |
| `favicon.ico` | Byte-identical to the repo root `favicon.ico` |
| `_ds_bundle.js`, `_ds_manifest.json` | Compiled by the Claude Design app from the component sources |
| `_adherence.oxlintrc.json`, `.thumbnail` | Generated/maintained by the Claude Design app |

## Pushing (repo → Claude Design)

From a Claude Code session with design access (`/design-login` if needed), use the `DesignSync` tool against project `e75121c0-9210-42d1-ade3-2c8af9111cbe`:

1. `list_files` to diff structure; `get_file` only for files you must compare.
2. `finalize_plan` with the exact paths you'll write (e.g.
`tokens/*.css`, `styles.css`, `SKILL.md`, `readme.md`), `localDir` = `_design-system/`.
3. `write_files` with `localPath` entries. Push brand imagery from
   `assets/images/` in a separate plan when it changes.

Push **incrementally** — the changed files only, never a wholesale replace.

## Pulling (Claude Design → repo)

Download the project handoff zip (or `get_file` the changed paths), copy the changed source files into `_design-system/`, then reconcile any token change into `_sass/tokens/` in the same PR so `scripts/design-system-check.rb` passes.

### Markdown pulled here is rendered by Jekyll

`_config.yml` force-includes `_design-system`, so every `.md` here becomes a live page — and Liquid runs over it before Markdown. Any `{% raw %}{{ … }}{% endraw %}` or `{% raw %}{% … %}{% endraw %}` the design project writes is therefore parsed as a template expression, not shown as text. JSX is the common casualty: `{% raw %}style={{ … }}{% endraw %}` is a Liquid syntax error, and the published page renders `<div style=>`.

**On every pull, wrap code fences that contain braces in a Liquid `{% raw %}{% raw %}{% endraw %}` block.** `Skeleton.prompt.md` is the worked example. The Pages workflow fails on `Liquid Warning`, so an unwrapped fence blocks the merge rather than shipping a mangled page.

## Verifying

```bash
ruby scripts/design-system-check.rb   # token parity + dangling-token audit
ruby scripts/lint-liquid-raw.rb       # Liquid raw-block balance across rendered Markdown
./test/test_runner.sh --suites core   # includes the parity check
```
