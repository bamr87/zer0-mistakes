# scripts/ai — companions to the fleet's `ai-runner` kit

Every model call a workflow here makes goes through `uses: bamr87/bamr87/.github/actions/claude-run@main` — the fleet's one AI step, versioned once in the [bamr87/bamr87 hub](https://github.com/bamr87/bamr87) and consumed **by reference**. This repo no longer carries the runner (`scripts/ai/run.sh`) or the composite action (`.github/actions/claude-run/`); it receives every fix on its next run with nothing to copy forward. The kit's contract, environment, and exit codes are documented in the hub: [`templates/ai-runner/README.md`](https://github.com/bamr87/bamr87/blob/main/templates/ai-runner/README.md).

What stays here are the **consumer-owned companions** the hub runner probes for in `$GITHUB_WORKSPACE` and uses when present:

| File | Role | Required |
| --- | --- | --- |
| `usage.rb` | Metering: one JSONL record per call (tokens, API-equivalent cost, model, status, CI context) into `$AI_USAGE_DIR/records.jsonl` (default `$RUNNER_TEMP/ai-usage`, outside the checkout). Prices come from `_data/ai_pricing.yml`. | optional |
| `usage_report.rb` | End-of-job publisher: step summary, `ai-usage-*` artifact, sticky PR comment (marker `<!-- lh-ai-usage -->`). Run by the hub action's `always()` post-step. | optional |
| `api_call.rb` | The single-shot Messages API fallback the runner uses when Claude Code is missing or fails. Stdlib only, self-contained. | optional |
| `../../_data/ai.yml` | `model:` (and `max_tokens` for the API fallback). The runner resolves `--model` > `AI_MODEL` > this file > the fleet default. | recommended |
| `../../tools/unwrap-prose.py` | Post-run one-paragraph-per-line normalizer for markdown the agent changed. `SCHEMA.md`/`CHANGELOG.md` are always skipped; further exclusions go in a repo-root `.prose-excludes`, one extended regex per line. | optional |

Without a companion the runner degrades honestly: no `usage.rb` means nothing is recorded (an inline emitter still treats `is_error` as a failure); no `api_call.rb` means a failed primary call exits `1` with "no scripts/ai/api_call.rb|py to fall back to".

## Contract, in one line

Auth from the job env, OAuth first (`CLAUDE_CODE_OAUTH_TOKEN`, then `ANTHROPIC_API_KEY`); canonical `AI_*` environment with no repo prefix (`AI_MODEL`, `AI_FORCE_API`, `AI_MAX_TURNS`, `AI_USAGE_DIR`, `AI_ROLE`, `AI_REPO_ROOT`); exit `0` when the call ran or nothing was attempted (no auth — the documented no-op), exit `1` when a call was attempted and failed with no usable fallback, with the reason raised as a `::error::` annotation. The exit-code contract is pinned by the hub's `templates/ai-runner/tests/contract.sh` (stubbed `claude`, no network, no credentials) and run there on every change to the runner — not vendored here.

## Calling it

```yaml
- uses: bamr87/bamr87/.github/actions/claude-run@main
  env:
    CLAUDE_CODE_OAUTH_TOKEN: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}   # optional fallback
  with:
    agent: issue-triager            # .claude/agents/<name>.md
    prompt: "..."
    tools: "Read,Grep,Glob,Bash(gh:*)"
```

Inputs: `prompt`, `agent`, `tools`, `mcp`, `system`, `out`, `model`, `max-turns`. Callers in this repo: `issue-autopilot.yml` (triage, verify, resolve) and `visual-evidence-autogen.yml`. Where a lane is the standard shape (gate on a `*_ENABLED` variable, run one agent, open one PR), the hub also offers the reusable `bamr87/bamr87/.github/workflows/ai-lane.yml@main`; the matrix-fed autopilot is deliberately not that shape.

## Metering companions are kit files too

`usage.rb`, `usage_report.rb`, and `api_call.rb` are the same files lifehacker.dev runs. Fix them there first and copy forward (`shasum` parity is the check); never fork them here.
