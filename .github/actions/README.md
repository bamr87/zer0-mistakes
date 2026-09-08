# GitHub Composite Actions

This directory contains reusable composite actions for the zer0-mistakes Jekyll theme CI/CD pipelines.

## Overview

Composite actions encapsulate common workflow steps into reusable components, reducing duplication and ensuring consistency across workflows.

```
.github/actions/
├── claude-run/        # Shared ai-runner kit step (Claude Code, OAuth-first)
├── configure-git/     # Git identity configuration
├── quality-checks/    # Code quality validation
├── setup-ruby/        # Ruby environment setup
└── test-suite/        # Test execution
```

## Actions

### 1. `setup-ruby`

Sets up the Ruby environment with bundler caching.

**Usage:**
```yaml
- uses: ./.github/actions/setup-ruby
  with:
    ruby-version: '3.2'        # Default: '3.2'
    install-system-deps: true  # Default: true (installs jq)
```

**Inputs:**
| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `ruby-version` | No | `'3.2'` | Ruby version to install |
| `install-system-deps` | No | `'true'` | Install system dependencies (jq) |

**Used by:** All workflows

---

### 2. `configure-git`

Configures Git identity for automated commits and pushes.

**Usage:**
```yaml
- uses: ./.github/actions/configure-git
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    user-name: 'github-actions[bot]'  # Optional
    user-email: 'github-actions[bot]@users.noreply.github.com'  # Optional
```

**Inputs:**
| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `github-token` | Yes | - | GitHub token for authentication |
| `user-name` | No | `'github-actions[bot]'` | Git user name |
| `user-email` | No | `'github-actions[bot]@users.noreply.github.com'` | Git user email |

**Used by:** `version-bump.yml`

---

### 3. `test-suite`

Runs the comprehensive test suite with configurable options.

**Usage:**
```yaml
- uses: ./.github/actions/test-suite
  with:
    ruby-version: '3.2'
    verbose: true
    suites: 'core,quality'
    skip-docker: true
```

**Inputs:**
| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `ruby-version` | No | `'3.2'` | Ruby version for tests |
| `verbose` | No | `'true'` | Enable verbose test output |
| `suites` | No | `'core,quality'` | Comma-separated test suites |
| `skip-docker` | No | `'true'` | Skip Docker-dependent tests |

**Used by:** `ci.yml`, `release.yml`, `version-bump.yml`

---

### 4. `quality-checks`

Runs code quality checks including linting and formatting validation.

**Usage:**
```yaml
- uses: ./.github/actions/quality-checks
  with:
    ruby-version: '3.2'
    check-markdown: true
    fix-formatting: false
```

**Inputs:**
| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `ruby-version` | No | `'3.2'` | Ruby version |
| `check-markdown` | No | `'true'` | Run markdown format checks |
| `fix-formatting` | No | `'false'` | Auto-fix formatting issues |

**Checks performed:**
- Ruby code quality (`test/test_quality.sh`)
- Markdown formatting (`scripts/fix-markdown-format.sh`)
- Project structure validation (required files/directories)

**Used by:** `ci.yml`

---

### 5. `claude-run`

The universal AI step: runs one Claude Code invocation as a named agent (`.claude/agents/<name>.md`). This is the fleet's shared **`ai-runner` kit** — `action.yml` and `scripts/ai/run.sh` are byte-identical copies of lifehacker.dev's (the kit source of truth); change them there and copy forward, never fork them here. The action installs the CLI and hands off to `scripts/ai/run.sh`, which resolves the model from `_data/ai.yml`, runs `claude -p … --output-format json`, and falls back to the Claude API (`scripts/ai/api_call.rb`) when the CLI is missing or fails.

**Usage:**
```yaml
- uses: ./.github/actions/claude-run
  env:
    CLAUDE_CODE_OAUTH_TOKEN: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}   # optional fallback
  with:
    agent: issue-triager
    prompt: "..."
    tools: "Read,Grep,Glob,Bash(gh:*)"
```

**Inputs:**
| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `prompt` | Yes | - | The instruction for the agent |
| `agent` | No | `''` | Run AS a named agent (`.claude/agents/<name>.md`) |
| `tools` | No | `''` | Comma-separated `--allowedTools` for Claude Code |
| `mcp` | No | `''` | Path to an MCP config JSON |
| `system` | No | `''` | System prompt appended to the agent |
| `out` | No | `''` | Write the result to this file instead of stdout |
| `model` | No | `''` | Model override for this step (beats `AI_MODEL` and `_data/ai.yml`) |
| `max-turns` | No | `''` | Cap the agent's turns (`--max-turns`) |

**Contract (see `scripts/ai/README.md`):**
- **Auth from the job env, OAuth first.** `CLAUDE_CODE_OAUTH_TOKEN` is preferred; when it is set, `ANTHROPIC_API_KEY` is stripped from the CLI's environment (`env -u`) so the metered key is never billed for subscription work. With no auth at all the step is a clean no-op (exit 0).
- **Canonical `AI_*` env** — `AI_MODEL`, `AI_FORCE_API`, `AI_MAX_TURNS`, `AI_USAGE_DIR` — no repo prefix, so the file stays identical across the fleet. (The installer's own `ZER0_AI_MODEL` belongs to `install.sh`'s AI planner and is unrelated.)
- **Exit 1 on failure.** A call that was attempted and rejected (auth revoked, quota exhausted, `is_error` payload, CLI died without a payload) fails the step with the reason as a `::error::` annotation. The previous hand-rolled action exited 0 when the CLI install failed, so a dead run read green.
- **Metering optional.** `scripts/ai/usage.rb` records tokens + API-equivalent cost per call and `usage_report.rb` publishes a step summary, an `ai-usage-*` artifact, and a sticky PR comment; both post-steps are `always()` and never fail the job.

The exit-code contract is pinned by `scripts/ci/test_ai_runner.sh` (stubbed `claude`, no network, no credentials), wired into `./scripts/bin/test` through `scripts/test/lib/test_ai_runner.sh`.

**Used by:** `issue-autopilot.yml`, `visual-evidence-autogen.yml`

---

## Creating New Actions

### Action Structure

```
my-action/
└── action.yml    # Action definition
```

### Basic Template

```yaml
name: 'My Action'
description: 'Description of what this action does'

inputs:
  my-input:
    description: 'Input description'
    required: false
    default: 'default-value'

outputs:
  my-output:
    description: 'Output description'
    value: ${{ steps.my-step.outputs.value }}

runs:
  using: composite
  steps:
    - name: My Step
      id: my-step
      shell: bash
      run: |
        echo "Doing something..."
        echo "value=result" >> $GITHUB_OUTPUT
```

### Best Practices

1. **Use composite actions** for multi-step processes
2. **Set sensible defaults** to reduce required configuration
3. **Validate inputs** before executing main logic
4. **Use `::notice::` and `::error::`** for GitHub Actions annotations
5. **Document all inputs/outputs** in the action.yml description
6. **Test locally** before committing changes

## Troubleshooting

### Action not found
```
Error: Can't find 'action.yml', 'action.yaml' or 'Dockerfile'
```
- Verify action directory structure
- Check spelling of action path in workflow

### Input not passed correctly
- Ensure input names match exactly (case-sensitive)
- Check that required inputs are provided
- Verify default values in action.yml

### Shell script failures
- Ensure scripts have executable permissions
- Use absolute paths or `./` prefix
- Add `set -e` for early failure detection

### Debugging
Add debug output to actions:
```yaml
- name: Debug
  shell: bash
  run: |
    echo "Input value: ${{ inputs.my-input }}"
    echo "Working directory: $(pwd)"
    ls -la
```
