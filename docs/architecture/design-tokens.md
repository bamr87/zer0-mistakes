# Design Token System

The design token system provides a **single source of truth** for colors, typography, spacing, and component tokens — consumed by SCSS, CSS custom properties, and documentation.

## Architecture

```
_data/tokens/           ← Token definitions (YAML)
  ├── colors.yml
  ├── typography.yml
  ├── spacing.yml
  ├── components.yml
  └── _schema.yml       ← Token schema/naming rules

scripts/generate-tokens.rb   ← Standalone generator script
_plugins/token_generator.rb  ← Jekyll plugin (non-github-pages only)

_sass/generated/
  └── _tokens.scss      ← Generated output (committed to git)
```

## Token Flow

```
YAML tokens → Ruby script → _sass/generated/_tokens.scss
                              ├── $zer0-* SCSS variables (!default)
                              ├── :root CSS custom properties
                              └── [data-bs-theme="dark"] overrides
```

## Token Format

```yaml
tokens:
  - name: primary           # kebab-case name
    value: "#0d6efd"         # Literal value
    description: "Primary brand color"
    category: semantic       # Token category
    bootstrap-var: "--bs-primary"
    usage: [buttons, links]
    dark: "#6ea8fe"          # Dark mode override (optional)
    scss-var: "$primary"     # Maps to existing SCSS var (optional)
```

## Generated Output

The script produces three layers in `_tokens.scss`:

1. **SCSS Variables**: `$zer0-primary: #0d6efd !default;`
2. **CSS Custom Properties**: `:root { --zer0-primary: #0d6efd; }`
3. **Dark Mode Overrides**: `[data-bs-theme="dark"] { --zer0-body-bg: #212529; }`

Tokens whose values reference SCSS variables (starting with `$`) are emitted as SCSS variables only — CSS custom properties are skipped for those.

## Import Order

In `assets/css/main.scss`:
```scss
@import "core/variables";     // Core SCSS variables (defines $sans-serif, etc.)
@import "generated/tokens";   // Generated tokens (may reference core variables)
@import "core/docs";          // ... rest of imports
```

**Critical**: Generated tokens must be imported AFTER `core/variables` because some token values reference SCSS variables like `$sans-serif`.

## Regenerating Tokens

```bash
ruby scripts/generate-tokens.rb           # Generate _sass/generated/_tokens.scss
ruby scripts/generate-tokens.rb --check   # CI mode: verify file is up-to-date
bundle exec rake tokens:generate          # Via Rake task
bundle exec rake tokens:check             # Rake CI check
```

## Adding New Tokens

1. Add token entries to the appropriate `_data/tokens/*.yml` file
2. Run `ruby scripts/generate-tokens.rb` to regenerate SCSS
3. Commit both the YAML and generated SCSS files
4. Token specs (`spec/tokens/`) will validate naming, schema, and coverage

## CI Enforcement

- **Fast Checks job**: `ruby scripts/generate-tokens.rb --check` — ensures generated SCSS matches token YAML
- **RSpec token specs**: `bundle exec rspec spec/tokens/` — validates naming conventions, schema compliance, dark mode coverage, and hardcoded color detection

## github-pages Compatibility

The `github-pages` gem enforces safe mode, which blocks custom Jekyll plugins. The token generator is therefore a **standalone script** rather than a build-time plugin. The generated `_tokens.scss` file is committed to git so github-pages builds work without running the generator.
