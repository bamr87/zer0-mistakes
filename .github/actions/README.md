# GitHub Composite Actions

This directory contains reusable composite actions for the zer0-mistakes Jekyll theme CI/CD pipelines.

## Overview

Composite actions encapsulate common workflow steps into reusable components, reducing duplication and ensuring consistency across workflows.

```
.github/actions/
├── configure-git/     # Git identity configuration
├── prepare-release/   # Build gem and prepare release assets
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

### 5. `prepare-release`

Builds the gem and prepares release assets.

**Usage:**
```yaml
- uses: ./.github/actions/prepare-release
  with:
    ruby-version: '3.2'
    validate-assets: true
```

**Inputs:**
| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `ruby-version` | No | `'3.2'` | Ruby version for build |
| `validate-assets` | No | `'true'` | Validate built assets |

**Outputs:**
| Output | Description |
|--------|-------------|
| `gem-version` | Built gem version (e.g., `0.8.0`) |
| `gem-file` | Gem filename (e.g., `jekyll-theme-zer0-0.8.0.gem`) |
| `asset-directory` | Directory containing built assets (`./build`) |

**What it does:**
1. Sets up Ruby environment
2. Runs `scripts/build` to create the gem
3. Copies gem to `./build` directory
4. Extracts version information
5. Validates gem file (if enabled)

**Used by:** `release.yml`

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
