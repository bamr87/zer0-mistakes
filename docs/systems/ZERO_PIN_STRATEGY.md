# Zero Version Pin Strategy

> **Always use the latest compatible versions of everything, with zero version pins anywhere — while maintaining 100% reproducible builds and failing fast in TEST/DEV.**

This is the pattern used internally by Shopify, GitHub, GitLab, and most large Jekyll/Docker teams that want bleeding-edge dependencies with zero version drift.

## Core Philosophy

- **Never pin any version in code** (no `ruby '3.3'`, no `gem 'jekyll', '~> 4.3'`, no `FROM ruby:3.3`, no `BUNDLER_VERSION=…`)
- **Let Bundler + Docker Hub resolve the latest compatible versions at build time**
- **Fail immediately and loudly in CI (TEST) if the latest versions are incompatible**
- **Production always gets exactly what passed TEST** (via immutable image tags, never `:latest`)

## How It Works

### Dependency Resolution Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ZERO PIN DEPENDENCY FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. DEVELOP/TEST (Build with --no-cache)                                    │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                   │
│     │ Dockerfile  │───▶│   Bundler   │───▶│ Gemfile.lock│                   │
│     │ (no pins)   │    │  resolves   │    │  (auto-gen) │                   │
│     └─────────────┘    └─────────────┘    └─────────────┘                   │
│            │                  │                   │                          │
│            ▼                  ▼                   ▼                          │
│     ┌─────────────────────────────────────────────────┐                     │
│     │  Latest compatible versions for ALL gems        │                     │
│     │  → Tests run against these exact versions       │                     │
│     │  → If incompatible: BUILD FAILS ❌              │                     │
│     │  → If compatible: Tests proceed ✅              │                     │
│     └─────────────────────────────────────────────────┘                     │
│                              │                                               │
│                              ▼                                               │
│  2. CI/TEST PASS                                                            │
│     ┌─────────────────────────────────────────────────┐                     │
│     │  Create immutable image tag:                    │                     │
│     │  bamr87/zer0-mistakes:20251128-1420-a1b2c3d    │                     │
│     │  (date + time + commit hash)                    │                     │
│     └─────────────────────────────────────────────────┘                     │
│                              │                                               │
│                              ▼                                               │
│  3. PRODUCTION (Uses immutable tag)                                         │
│     ┌─────────────────────────────────────────────────┐                     │
│     │  image: bamr87/zer0-mistakes:20251128-1420-... │                     │
│     │  → Exact same image that passed tests          │                     │
│     │  → 100% reproducible                           │                     │
│     │  → NEVER uses :latest in production            │                     │
│     └─────────────────────────────────────────────────┘                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## File Structure

```
zer0-mistakes/
├── docker/
│   ├── Dockerfile                    # Multi-stage, zero version pins
│   └── config/
│       ├── production.yml            # Jekyll production config
│       └── development.yml           # Jekyll development config
├── Gemfile                           # Zero version constraints
├── Gemfile.lock                      # Auto-generated, tracks exact versions
├── jekyll-theme-zer0.gemspec         # Minimal version requirements
├── docker-compose.yml                # Development environment
├── docker-compose.test.yml           # CI testing overlay
├── docker-compose.prod.yml           # Production (immutable tags only)
└── .github/workflows/
    └── test-latest.yml               # Fail-fast CI with latest deps
```

## Key Files Explained

### Dockerfile (`docker/Dockerfile`)

```dockerfile
# Zero version pins - always latest
FROM ruby:slim AS base

# Install dependencies without version pins
RUN apt-get update -qq && \
    apt-get install -y build-essential libyaml-dev ...

# Install latest Bundler
RUN gem install bundler

# Let Bundler resolve latest compatible
COPY Gemfile Gemfile.lock* ./
RUN bundle install
```

### Gemfile

```ruby
source "https://rubygems.org"
gemspec

# NO version constraints → always latest compatible
gem "github-pages", group: :jekyll_plugins
gem "webrick"
gem "ffi"
gem "commonmarker"
```

### docker-compose.prod.yml

```yaml
services:
  jekyll:
    # NEVER use :latest in production
    # Always use immutable tag from CI
    image: bamr87/zer0-mistakes:${IMAGE_TAG:-20251128-1420-a1b2c3d}
```

## Usage

### Development

```bash
# Start development server (builds with latest deps)
docker compose up

# Rebuild with fresh dependencies
docker compose up --build

# Access container shell
docker compose exec jekyll bash
```

### Testing (CI)

```bash
# Build with no cache to ensure latest dependencies
docker compose -f docker-compose.yml -f docker-compose.test.yml build --no-cache

# Run tests
docker compose -f docker-compose.yml -f docker-compose.test.yml run jekyll

# Validate only
docker compose -f docker-compose.yml -f docker-compose.test.yml run validate
```

### Production Deployment

```bash
# Get the latest successful tag from CI artifact
IMAGE_TAG=$(cat LATEST_SUCCESSFUL_TAG)

# Deploy with immutable tag
IMAGE_TAG=$IMAGE_TAG docker compose -f docker-compose.prod.yml up -d

# Or set in environment file
echo "IMAGE_TAG=$IMAGE_TAG" > .env.prod
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

## Benefits Summary

| Goal | How It's Achieved |
|------|-------------------|
| Always use latest dependencies | Zero version pins anywhere |
| Auto-resolve compatible set | Bundler + lockfile does it on every build |
| Incompatibilities caught early | Build fails loudly in TEST/CI → PR blocked |
| Production never breaks | Only images that passed TEST are promoted |
| Zero version maintenance | No one ever has to bump versions manually |
| Full reproducibility | Immutable tags (date+commit) lock the exact set |

## Handling Breaking Changes

When the CI build fails due to an upstream breaking change:

1. **Check the CI logs** - The `debug-failure` job shows exactly what versions were attempted
2. **Identify the culprit** - Usually one gem released a breaking change
3. **Options:**
   - Wait for upstream fix (often resolved within hours)
   - Open issue upstream
   - **Last resort**: Temporarily pin the problematic gem
4. **Temporary pins should be documented and removed ASAP**

### Example: Temporary Pin (Last Resort)

```ruby
# Gemfile
# TEMPORARY: commonmarker 0.24.0 breaks our build
# Issue: https://github.com/github/commonmarker/issues/XXX
# TODO: Remove this pin when issue is resolved
gem "commonmarker", "< 0.24.0"
```

## CI Workflow

The `.github/workflows/test-latest.yml` workflow:

1. **Builds** Docker image with `--no-cache` (latest everything)
2. **Documents** resolved versions in workflow summary
3. **Tests** Jekyll build, RSpec, HTML validation
4. **Tags** successful images with immutable tag (date+commit)
5. **Publishes** to Docker Hub (only on main branch)
6. **Debug info** on failure (shows what versions were attempted)

## Migration from Pinned Versions

If you're coming from a project with version pins:

1. Remove all version constraints from `Gemfile`
2. Remove all version constraints from `gemspec`
3. Update `Dockerfile` to use `ruby:slim` (no version)
4. Delete `Gemfile.lock` (let it regenerate)
5. Run `docker compose up --build`
6. Fix any compatibility issues that surface
7. Commit the new `Gemfile.lock`

## Related Documentation

- [Docker Development Guide](../jekyll/docker-development.md)
- [CI/CD Workflows](../systems/ci-cd.md)
- [Release Process](../releases/release-process.md)
