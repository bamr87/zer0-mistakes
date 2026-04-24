# Deploy target: docker-prod (self-hosted production)

Generates a two-stage Docker build (Ruby + Nginx) and a production
compose file you can run on any container host (Fly.io, Render, a VPS,
Kubernetes via Kompose, etc.).

## Files installed

| Source                                   | Destination                       |
| ---------------------------------------- | --------------------------------- |
| `Dockerfile.prod.template`               | `docker/Dockerfile.prod`          |
| `docker-compose.prod.yml.template`       | `docker-compose.prod.yml`         |
| `nginx.conf`                             | `docker/nginx.conf`               |
| `.dockerignore`                          | `.dockerignore` (only if missing) |

## Template variables

| Variable             | Default | Notes                                  |
| -------------------- | ------- | -------------------------------------- |
| `{{RUBY_VERSION}}`   | `3.3`   | Builder stage base image tag.          |
| `{{GITHUB_USER}}`    | `me`    | Used in the OCI label + image name.    |
| `{{SITE_NAME}}`      | `site`  | Image repository name suffix.          |

## Build & run

```bash
# Build immutable, tested image
IMAGE_TAG=$(date +%Y%m%d)-$(git rev-parse --short HEAD)
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Health check
curl -fsSL http://localhost:${PORT:-8080}/ | head -1
```

## Documentation

- <https://hub.docker.com/_/ruby>
- <https://hub.docker.com/_/nginx>
- <https://docs.docker.com/compose/production/>
