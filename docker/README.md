# Docker Configuration

This directory contains Docker-related files for the zero-pin dependency strategy.

## Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build with zero version pins |
| `config/production.yml` | Jekyll production configuration overlay |
| `config/development.yml` | Jekyll development configuration overlay |

## Zero Pin Strategy

The Dockerfile uses `ruby:slim` without version pins, allowing Docker Hub to resolve the latest Ruby version. Similarly, Bundler resolves the latest compatible gem versions at build time.

### Build Stages

1. **base** - Ruby slim + build dependencies + Bundler
2. **dev-test** - Full dev/test gems for CI validation
3. **build** - Production Jekyll build
4. **production** - Minimal runtime for serving

## Usage

### Development

```bash
# From project root
docker compose up
```

### Testing

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml build --no-cache
docker compose -f docker-compose.yml -f docker-compose.test.yml run jekyll
```

### Production

```bash
# Use immutable tag from CI (never :latest)
IMAGE_TAG=20251128-1420-a1b2c3d docker compose -f docker-compose.prod.yml up -d
```

## Required Secrets (for CI/CD)

To publish Docker images, configure these secrets in GitHub:

- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_TOKEN` - Docker Hub access token

## Related Documentation

- [Zero Pin Strategy](../docs/systems/ZERO_PIN_STRATEGY.md)
- [Main docker-compose.yml](../docker-compose.yml)
