# AI Features

Every AI feature in the installer is **opt-in, sandboxed, and visible**. Nothing reaches a third party unless you explicitly invoke an `--ai`-flagged subcommand or set `OPENAI_API_KEY` and run a wizard. Everything written to disk is shown as a unified diff first.

## Kill switch

```bash
export ZER0_NO_AI=1     # forces every AI codepath to fall back to non-AI behavior
```

Use this in compliance environments or CI where you want AI subcommands to be no-ops rather than errors.

## Features at a glance

| Subcommand | What it does | What's sent | Default model |
|---|---|---|---|
| `install agents` | Pure file copy of agent guidance into a site. **No network.** | Nothing. | n/a |
| `install wizard --ai` | Generates `_config.yml` from a one-line site description. | Site description + audience. | `gpt-4o-mini` |
| `install diagnose --ai` | Proposes a unified-diff patch for build errors. | Sanitized error log + relevant config files. | `gpt-4o` |
| `install deploy --ai-suggest` | Recommends a deploy target with rationale. | Site fingerprint (file presence, size). | `gpt-4o-mini` |

Override the model with `ZER0_AI_MODEL=<model-id>` per session.

## Sanitization (always applied before send)

The shared sanitizer in [`scripts/lib/install/ai/openai.sh`](../../scripts/lib/install/ai/openai.sh) redacts:

| Pattern | Redacted with |
|---|---|
| `OPENAI_API_KEY`, `RUBYGEMS_API_KEY`, `GITHUB_TOKEN` env values | `[REDACTED_KEY]` |
| Any `sk-...` / `ghp_...` / `gho_...` token-shaped string | `[REDACTED_TOKEN]` |
| Email addresses | `[REDACTED_EMAIL]` |
| Absolute `$HOME` paths | `~` |
| Long hex blobs (≥ 32 chars) | `[REDACTED_HEX]` |

BSD-`sed` compatible. Tested on macOS (the strictest baseline).

## Diff-then-confirm

Every AI codepath that proposes a write:

1. Builds the proposed file content **in memory**.
2. Shows a unified diff against the current state (or the empty file).
3. Waits for `y/N` confirmation. (`--auto-accept` short-circuits this for CI.)
4. Only then writes through `fs.sh::copy_file_with_backup` (timestamped backup).

## Cost transparency

Before each AI call, the installer prints the estimated input token count and a USD estimate using the published `gpt-4o-mini` / `gpt-4o` rate. Interactive sessions require a `y/N` confirm; non-interactive (`--auto-accept`) sessions log the estimate and proceed.

## Required environment

```bash
export OPENAI_API_KEY=sk-...           # required for any --ai feature
export ZER0_AI_MODEL=gpt-4o-mini       # optional override
export ZER0_NO_AI=1                    # global disable
```

If `OPENAI_API_KEY` is unset and you invoke an `--ai` flag, the installer aborts with a clear message and the install instructions for setting the key — it never silently degrades to a non-AI codepath without warning.

## Network behavior

- Single endpoint: `https://api.openai.com/v1/chat/completions` (and `/v1/models` for `doctor --ai` connectivity ping).
- 30-second timeout. On timeout/HTTP failure, the command falls back to the non-AI codepath when one exists, or exits non-zero with a clear message.
- No telemetry. No background calls. No retry storms — single attempt per invocation.

## Where the prompts live

System prompts are checked-in templates so you can audit / fork them:

- [`templates/ai/prompts/wizard-system.md`](../../templates/ai/prompts/wizard-system.md)
- [`templates/ai/prompts/diagnose-system.md`](../../templates/ai/prompts/diagnose-system.md)
- [`templates/ai/prompts/suggest-system.md`](../../templates/ai/prompts/suggest-system.md)

## Compliance checklist

Use this in a regulated environment:

- [ ] Set `ZER0_NO_AI=1` in the install host's environment (or CI secret).
- [ ] Confirm `install doctor` reports `AI: disabled (ZER0_NO_AI=1)` under the AI section.
- [ ] Pin a reviewed installer version (tag, not `main`) for the bootstrap.
- [ ] Audit the three system prompts above.
- [ ] Audit `scripts/lib/install/ai/openai.sh::_sanitize` against your data-classification policy.

---

**Last updated:** 2026-04-20 — Phase 7.
