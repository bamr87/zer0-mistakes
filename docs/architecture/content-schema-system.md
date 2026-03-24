# Content Schema System

The schema system provides **centralized, machine-readable definitions** for all content types in the Zer0-Mistakes framework.

## How It Works

```
_data/schemas/
├── post.yml      # Blog post front matter schema
├── doc.yml       # Documentation page schema
├── note.yml      # Short-form note schema
├── notebook.yml  # Jupyter notebook schema
├── quest.yml     # Learning quest schema
└── page.yml      # Standalone page schema
```

Each schema file defines:
- **Required fields** with types and validation rules
- **Optional fields** with defaults and allowed values (enums)
- **Feature traceability** — which `ZER0-XXX` feature uses each field
- **Collection/layout mapping** — which collection and layout the schema applies to

## Schema Format

```yaml
collection: posts
layout: article
fields:
  - name: title
    type: string
    required: true
    max_length: 120
  - name: post_type
    type: string
    required: false
    default: standard
    enum: [standard, featured, breaking, opinion, review, tutorial, listicle, interview]
    feature_id: ZER0-019
```

## Validation

Schemas are validated at two levels:

1. **RSpec specs** (`spec/schemas/`) — CI-enforced validation that all content files conform to their schema
2. **VS Code Front Matter CMS** (`frontmatter.json`) — real-time validation during editing

### Running Schema Validation

```bash
bundle exec rspec spec/schemas/                  # All schema specs
bundle exec rspec spec/schemas/ --format doc     # Verbose output
```

## Adding a New Schema

1. Create `_data/schemas/<collection>.yml` with the field definitions
2. Add corresponding RSpec spec in `spec/schemas/`
3. Update `frontmatter.json` to mirror the schema fields
4. Add `tokens` suite routing in `.github/actions/test-suite/action.yml` if needed

## Cross-Reference System

Schemas integrate with the cross-reference registry via `feature_id` fields. Each schema field can reference the feature that uses it, enabling bidirectional traceability:

- **Forward**: Feature → Schema fields it requires
- **Backward**: Schema field → Feature that uses it

See `spec/features/cross_reference_spec.rb` for the RSpec-enforced validation.
