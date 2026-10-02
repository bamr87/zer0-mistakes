# agent-issue-265 — visual evidence

**[bamr87/bamr87#265](https://github.com/bamr87/bamr87/issues/265) — the Site Builder moved the first time it saved a draft.**

`showDraftChip()` cleared the "Draft saved" chip's `hidden` attribute, and the 2s timer that follows only removes `is-visible` (an opacity class). So the first debounced save moved the chip from `display: none` into layout **for good**: its box is 26px against the 19px "Start over" `.btn-sm` beside it, the `.wizard-header` grew, and `#wizardTabContent` and every Back/Next row below it went down with it — permanently, in one direction, from a single keystroke.

That is what failed the `@critical` stable-height spec on every push to `main` with `Next button document-y offsets across steps: 2029, 2036, 2036, 2036, 2036, 2036, 2036, 2036`. Connect was not 7px off; Connect was simply the step measured *before* the 300ms debounce fired.

## What each image shows

- **`01-draft-chip-before-after.png`** — the finding. Four panels at 1280px:
the base branch cold and after one keystroke, then this PR cold and after one keystroke. Every panel is captioned with the measured `.wizard-header` height, `#wizardTabContent`'s document-y top, the Next button's offset, and the chip's computed `display` / `visibility` / height.

  | | `.wizard-header` | panes top | Next | movement |
  | --- | ---: | ---: | ---: | ---: |
  | base, cold | 107px | 270px | 1844px | |
  | base, after save | 149px | 312px | 1886px | **+42px** |
  | this PR, cold | 149px | 312px | 1886px | |
  | this PR, after save | 149px | 312px | 1886px | **0px** |

Look at the base pair: "Start over" starts inline beside the lead paragraph and ends up wrapped onto its own line. **The magnitude is layout-dependent and the movement is not.** The chip's arrival grows the header's right-hand block from 19px to 26px; that costs 7px where the block has already wrapped (which is what the CI runner measures, hence `2029 → 2036`) and a whole wrapped line where those 7px are what tips it over (42px, as in this jammy render). Same one-way transition; only the price differs. After the fix the wizard simply starts in the settled position and never moves.

- **`02-unchanged-home-before-after.png`** / **`03-unchanged-home-viewport-matrix.png`**
— the control, from the generic base-vs-head generator: the homepage is untouched at all six widths, page overflow 0px before and after. The change is confined to `/setup/`, which is also why the nine committed pixel baselines passed unchanged (`0 pixel failure(s)`) and nothing was re-blessed.

- **`metrics.json`** — every number above, as measured in the page.

## Regenerate

```bash
docker compose up -d                              # serves :4000
python3 scripts/ci/visual_evidence_autogen.py all --base origin/main   # stands up :4001 too
BASE_URL=http://localhost:4000 BEFORE_URL=http://localhost:4001 \
  node test/visual/setup-wizard-draft-chip-evidence.mjs
```

`pr-evidence.mjs` alone cannot show this one: the defect is not a resting-state difference two screenshots catch, it is a transition that only happens after the wizard's 300ms save debounce. `setup-wizard-draft-chip-evidence.mjs` drives that interaction on **both** sites and measures either side of it.

<!-- visual-autogen:begin -->
## Generated evidence

Reviewed by the visual-evidence reviewer for PR #489. The homepage pixel-baseline verify passed 9/9 (`0 pixel failure(s)`), so no baselines were re-blessed; this section records what the three montages actually show.

- **`01-draft-chip-before-after.png`** — four captioned panels at 1280px. The base
pair reproduces the defect: cold header 107px with the chip at `display:none` (height 0), then after one keystroke the chip becomes `display:block` (height 26px), "Start over" wraps onto its own line, and the header grows to 149px — `#wizardTabContent` and the Next row drop **+42px** and stay down. The PR pair starts settled at 149px (chip `visibility:hidden`, box held from first paint) and does not move after the save: **0px**. Measurements in the panels agree with `metrics.json` (base shift 42/42/42; after-branch shift 0/0/0).
- **`02-unchanged-home-before-after.png`** — control. The homepage is visually
  identical base-vs-head at 390px and 1280px, page overflow 0px either side.
- **`03-unchanged-home-viewport-matrix.png`** — control. The header band renders
  cleanly at 320/390/768/992/1280/1440px with overflow 0px at every width.

Together the controls confirm the change is confined to `/setup/`, consistent with the untouched homepage baselines passing unchanged. Note: the two home-control montages are labelled as rendered from `33a12c8` while the head of this branch is `9bf3ebe` — one commit stale; the draft-chip montage and metrics reflect the head.
<!-- visual-autogen:end -->
