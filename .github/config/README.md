# GitHub Configuration Files

This directory contains configuration files for various development tools and linters used in the Zer0-Mistakes project.

## Linting Configurations

### `.yamllint.yml`

YAML linting configuration for validating YAML files across the project.

**Usage:**

```bash
yamllint -c .github/config/.yamllint.yml .
```

### `.markdownlint.json`

Markdown linting rules for consistent documentation formatting.

**Configuration highlights:**

- Extended line length for complex content
- Allows HTML elements commonly used in Jekyll themes
- Permits liquid template syntax

**Usage:**

```bash
markdownlint "**/*.md" --config .github/config/.markdownlint.json
```

### `.markdown-link-check.json`

Configuration for checking broken links in markdown documentation.

**Features:**

- Ignores localhost and local development URLs
- Handles Jekyll liquid template syntax
- Configures retry logic for rate-limited APIs
- Custom headers for GitHub API requests

**Usage:**

```bash
markdown-link-check -c .github/config/.markdown-link-check.json README.md
```

## Environment Configuration

### `environment.yml`

Environment-specific configuration settings.

---

**Note:** These configurations are referenced by CI/CD workflows, development scripts, and documentation. Update references when modifying file locations.
