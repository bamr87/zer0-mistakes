---
name: committee-plan
description: "**WORKFLOW SKILL** — How the /issue-plan committee fans out four read-only lenses over the open backlog and synthesizes an ORDER-ONLY plan deterministically. USE WHEN running /issue-plan or building the planning step. INVOKES: the plan-lens-* agents (or inline personas), scripts/sync-plan.rb. DO NOT USE FOR implementing tasks (use /issue-implement) or filing them (use /repo-audit intake)."
---

# Committee Plan

Operational checklist for the planning committee. Canonical contract: [`/issue-plan`](../../prompts/issue-plan.prompt.md). The committee **plans, it does not build** — it writes only `_data/roadmap_plan.yml` + one pinned issue.

## Golden rules
1. **Read-only on code.** Only `_data/roadmap_plan.yml` and the pinned issue change.
2. **Order only.** Reference task ids; never copy a backlog-owned field
   (risk/priority/area/status) into the plan — `sync-plan.rb --check` rejects it.
3. **Deterministic.** Same corpus ⇒ byte-identical plan. Skip the whole run when
   the corpus hash is unchanged.
4. **Bounded.** Exactly 4 lenses, no recursion; batches ≤6 tasks; ≤5 batches/run.
5. **Autonomy is derived, never re-encoded** — point at `continuous-evolution.md`.

## The four lenses (read-only, write nothing)
| Lens | Agent | Answers |
|---|---|---|
| Priority/impact | `plan-lens-priority` | which tasks matter most |
| Dependency/DAG | `plan-lens-dependency` | what must precede / not parallelize |
| Risk/autonomy | `plan-lens-risk` | which batches mix auto + human (→ split) |
| Test framework | `plan-lens-test` | the tests/evidence each batch needs |

Prefer one Task subagent per lens; if the runtime can't delegate, run the four personas **inline and sequentially** — identical output.

## Synthesis (fixed precedence ⇒ determinism)
`dependency` sets batch membership → `risk` splits mixed batches → `priority` orders within the layering → `test` annotates `test_framework`. Write the plan, record `meta.corpus_hash` + `meta.updated`, then:

```bash
ruby scripts/sync-plan.rb --check   # ids open · DAG acyclic · order-only
```

Open a `chore(plan)` PR (no auto-merge). On merge, `scripts/sync-plan.sh` upserts the single pinned tracking issue (`agent-hold`).

## Idempotency
- The corpus-hash gate makes a no-change run a no-op (cheap on schedule).
- The pinned issue is marker-fenced (`<!-- roadmap-plan:pinned -->`) and upserted,
  never duplicated.
