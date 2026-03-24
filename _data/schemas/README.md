# Content Schemas

Schema definitions for all Jekyll collections in the Zer0-Mistakes theme.
These YAML files are the **single source of truth** for front matter validation.

## How It Works

1. **Build-time validation**: `_plugins/schema_validator.rb` validates all content
   front matter against these schemas during `jekyll build`.
2. **Pre-commit validation**: `.pre-commit-config.yaml` runs schema checks before commits.
3. **CI enforcement**: GitHub Actions runs schema validation as a required gate.

## Schema Format

```yaml
collection: posts          # Jekyll collection name
layout: article            # Default layout for this collection
description: "..."         # Human-readable description
fields:
  - name: title            # Field name in front matter
    type: string           # Type: string, integer, boolean, date, array, object, image
    required: true         # Whether the field must be present
    description: "..."     # What this field does
    max_length: 120        # Optional: max string length
    enum: [a, b, c]        # Optional: allowed values
    pattern: "^[a-z]+$"    # Optional: regex validation
    default: "value"       # Optional: default value from _config.yml
    feature_id: ZER0-XXX   # Optional: which feature uses this field
```

## Adding a New Content Type

1. Create `_data/schemas/<collection>.yml`
2. Add the collection to `_config.yml` under `collections:`
3. Add defaults under `defaults:` in `_config.yml`
4. Register as a feature in `features/features.yml`
5. Run `bundle exec rspec spec/schemas/` to validate
