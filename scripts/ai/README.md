# scripts/ai — the `ai-runner` kit

One runner for every model call this repo makes, and the source of truth for the same runner in the sibling content sites (it-journey, zer0-mistakes). The files marked **kit** below are meant to be byte-identical across those repos: change them here first, then copy them forward. A drifted copy is a repo passing a *different* gate from everyone else, which is exactly how three silently different runners came to exist before this kit.

## Files

| File | Kit | What it does |
| --- | --- | --- |
| `run.sh` | **kit** | The universal runner: Claude Code first (`claude -p … --output-format json`), Claude API fallback; OAuth-first auth; honest exit codes; failure diagnosis; optional metering, prose normalization, and API fallback (see below). |
| `../../.github/actions/claude-run/action.yml` | **kit** | The composite action every workflow uses instead of hand-rolling `npm install` + `claude -p`. Installs the CLI, calls `run.sh`, publishes metering (when present). |
| `usage.rb` | kit (optional) | Metering: one JSONL record per call (tokens, API-equivalent cost, model, status, CI context) into `$AI_USAGE_DIR/records.jsonl` (default `$RUNNER_TEMP/ai-usage`, outside the checkout). |
| `usage_report.rb` | kit (optional) | End-of-job publisher: step summary, `ai-usage-*` artifact, sticky PR comment (marker `<!-- lh-ai-usage -->`). |
| `api_call.rb` | kit (optional) | The single-shot Messages API fallback. Stdlib only, self-contained. `api_call.py` is accepted as an alternative in Python-tooled repos. |
| `usage_ledger.rb` | lifehacker.dev only | Sweeps the artifacts into `_data/ai_usage/` + `AI_USAGE.md` (the `ai-usage.yml` workflow). Not part of the kit. |
| `../ci/test_ai_runner.sh` | kit (test) | Pins the exit-code contract with a stubbed `claude`: success, rejected call, silent CLI, no-op, is_error-with-exit-0, kit-only mode, flag passthrough. |

Configuration lives in `_data/ai.yml` (`model`, `fallback_model`, `max_tokens`, API wire details). Auth never lives in a file.

## Contract

**Invocation**

```bash
scripts/ai/run.sh --prompt "..." [--agent name] [--tools "Bash,Read"] [--mcp cfg.json] \
                  [--system "..."] [--out file] [--model id] [--max-turns N]
```

**Environment** (canonical names — no repo prefix, so the file stays identical everywhere)

| Variable | Meaning |
| --- | --- |
| `CLAUDE_CODE_OAUTH_TOKEN` | Preferred credential (`claude setup-token`). When set, `ANTHROPIC_API_KEY` is stripped from the CLI's environment so the metered key is never billed for subscription work. |
| `ANTHROPIC_API_KEY` | Fallback credential; the only one the raw API fallback can use. |
| `AI_MODEL` | Override the model from `_data/ai.yml` for one run (`--model` beats it). |
| `AI_FORCE_API=1` | Skip Claude Code, go straight to the API fallback. |
| `AI_MAX_TURNS` | Cap the agent's turns (`--max-turns`); unset = CLI default. |
| `AI_USAGE_DIR` | Where `usage.rb` writes records. |
| `AI_ROLE` | Set by `run.sh` for the fallback so its record carries the agent name. |

**Exit codes** — a failed call is never silently green.

| Exit | Meaning |
| --- | --- |
| `0` | The call ran, **or** nothing was ever attempted (no `claude` on PATH and no API key — the documented no-op). |
| `1` | The call was attempted and failed with no usable fallback. The reason is printed and raised as a `::error::` annotation under Actions. |

**Optional companions.** `run.sh` probes for each and degrades honestly when one is absent:

- `scripts/ai/usage.rb` — metering. Without it, an inline stdlib emitter enforces the same "is_error is a failure" rule; nothing is recorded.
- `scripts/ai/api_call.rb` or `api_call.py` — the fallback. Without it, a failed primary call exits `1` with "no scripts/ai/api_call.rb|py to fall back to".
- `tools/unwrap-prose.py` — after a successful run, markdown the agent changed is unwrapped to one paragraph per line (the `markdown-oneline` gate). `SCHEMA.md`/`CHANGELOG.md` are always skipped; list further exclusions, one extended regex per line, in a repo-root `.prose-excludes`.

## Adopting the kit in a sibling repo

1. Copy `scripts/ai/run.sh` and `.github/actions/claude-run/action.yml` verbatim.
2. Copy `usage.rb` + `usage_report.rb` for metering and `api_call.rb` for the fallback, or leave them out — the runner adapts.
3. Provide `_data/ai.yml` with at least `model:`.
4. Copy `scripts/ci/test_ai_runner.sh` and run it: it needs no network and no credentials.
5. Wire workflows through `uses: ./.github/actions/claude-run` with the job env carrying the auth secret, behind a `<LANE>_ENABLED` repository variable.

Verify parity with `shasum scripts/ai/run.sh .github/actions/claude-run/action.yml` against lifehacker.dev's `main`.
