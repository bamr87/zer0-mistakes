# zer0-mistakes Issue Autopilot — the `.issues/` data layer

The content layer for the open-issue queue, ported from it-journey and adapted to this theme repo. A deterministic engine classifies every open GitHub issue into a **disposition**, groups related issues into batches, and emits a dated worklist. AI agents act on that plan — they never re-decide the policy encoded here.

```
.issues/config.yml          # disposition rules + label namespace + safety globs (hand-edited)
.issues/budget.yml          # backpressure caps (hand-edited)
.issues/worklists/<date>.md  # generated — committed locally, uploaded as a CI artifact
.issues/reports/<date>.md    # generated — health rollup
.issues/{index,plan,dispatch}.json   # generated, NOT committed — transient working state
```

## What makes this port theme-safe

- **Backlog-synced issues are never touched.** `sync.yml` mirrors
  `_data/backlog.yml` → GitHub Issues (marked with `<!-- backlog-id: T-### -->`
  + the `agent-ready` label). The engine's FIRST disposition (`backlog-managed`)
catches these and lists them under **"Left alone (protected)"** — the autopilot records but never comments/labels/closes them. Edit the backlog file instead.
- **The resolver never edits theme code.** Auto-resolution PRs are scoped to
`docs/**` + `pages/**` Markdown only (`resolve_allow_globs`). Anything touching `_layouts/_includes/_sass/_plugins/lib/assets` is escalated to a human (theme changes need visual review). The auto-merge smuggle guard enforces the same.
- **Closing is deterministic + gated.** No LLM lane runs `gh issue close`. Three
gated paths close issues: bot-noise (`eligible_autoclose`, under `ISSUE_AUTOCLOSE_ENABLED`); **verify-and-close** (a human issue already fixed on `main` — the read-only `issue-verifier` proposes, `verify_close.py` closes only when `main`'s full CI/CD suite is green, under `ISSUE_VERIFY_CLOSE_ENABLED`); and PR-merge (a resolver `Closes #N` PR that passes all checks). A human issue is never closed on a heuristic/stale signal.

## The loop

1. `scripts/issues/triage.py plan` — classify + group + write the worklist/plan.
   **Read/plan only** — never mutates GitHub.
2. `scripts/issues/dispatch.py` — observe open `auto:issue` PRs, decide which docs
   batches to resolve this run (`budget.yml` backpressure).
3. `issue-triager` (label/route/flag) and `issue-resolver` (one docs batch → one
   PR) run the `issue-triage` skill via `.github/workflows/issue-autopilot.yml`.
4. `issue-verifier` (read-only) judges whether each `verify_candidate` human issue
is already fixed on `main` → `.issues/verify.json`; `scripts/issues/verify_close.py` closes the resolved + high-confidence ones, gated on a green `main` CI/CD suite.
5. `issue-pr-auto-merge.yml` merges green docs-only `auto:issue` PRs.

## Run it locally

```bash
make issue-triage    # build today's worklist from the live queue
make issue-status    # dashboard (counts by disposition)
make issue-plan      # what the resolve lane would dispatch (dry-run)
```

Needs Python 3.12 + PyYAML and an authenticated `gh`.

## Turn it on (OFF by default)

1. Add the auth secret: `gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo bamr87/zer0-mistakes`.
2. Create the labels:
   ```bash
   R=bamr87/zer0-mistakes
   gh label create auto:issue            -R $R -c 0e8a16 -d "Autonomous issue-resolution PR" || true
   gh label create autopilot:triaged     -R $R -c ededed -d "Analyzed by the issue autopilot" || true
   gh label create autopilot:stale        -R $R -c cccccc -d "Recommended for closing (bot-noise)" || true
   gh label create autopilot:epic         -R $R -c a2eeef -d "Large issue — decomposed, kept open" || true
   gh label create autopilot:go           -R $R -c 5319e7 -d "Human opt-in: resolve this issue now" || true
   gh label create autopilot:needs-human  -R $R -c b60205 -d "Autopilot routed to a human" || true
   gh label create autopilot:verified-resolved -R $R -c 0e8a16 -d "Closed by verify-and-close (fixed on main + green CI)" || true
   ```
3. Ramp the repo variables: `ISSUE_AUTOPILOT_ENABLED` (triage) → `ISSUE_AUTOCLOSE_ENABLED`
(close bot-noise) → `ISSUE_VERIFY_CLOSE_ENABLED` (verify-and-close human issues already fixed on `main`, gated on green CI) → `ISSUE_RESOLVE_ENABLED` (open docs PRs) → `ISSUE_AUTOMERGE_ENABLED`.
