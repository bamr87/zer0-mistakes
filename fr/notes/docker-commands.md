---
title: Référence des commandes Docker
description: Commandes Docker et Docker Compose essentielles pour la gestion des conteneurs,
  les workflows de développement et les déploiements en production
layout: note
date: 2026-01-30 10:00:00.000000000 Z
lastmod: 2026-01-31 10:00:00.000000000 Z
categories:
- Notes
- DevOps
tags:
- docker
- containers
- devops
- reference
author: Zer0-Mistakes Team
difficulty: intermediate
comments: true
lang: fr
permalink: "/fr/notes/docker-commands/"
translation_of: pages/_notes/docker-commands.md
translation_source_url: "/notes/docker-commands/"
machine_translated: true
translated_from_sha: 1ba8b6bf9456
---

## Gestion des conteneurs

### Exécution de conteneurs

```bash
# Run container from image
docker run nginx

# Run in detached mode (background)
docker run -d nginx

# Run with custom name
docker run -d --name my-nginx nginx

# Run with port mapping
docker run -d -p 8080:80 nginx

# Run with environment variables
docker run -d -e MYSQL_ROOT_PASSWORD=secret mysql

# Run with volume mount
docker run -d -v /host/path:/container/path nginx

# Run with interactive terminal
docker run -it ubuntu bash

# Run and auto-remove on exit
docker run --rm ubuntu echo "Hello"

# Run with resource limits
docker run -d --memory=512m --cpus=1 nginx
```

### Gestion des conteneurs en cours d'exécution

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop container
docker stop container_name

# Stop with timeout
docker stop -t 30 container_name

# Start stopped container
docker start container_name

# Restart container
docker restart container_name

# Kill container (force stop)
docker kill container_name

# Remove container
docker rm container_name

# Remove running container (force)
docker rm -f container_name

# Remove all stopped containers
docker container prune
```

### Inspection des conteneurs

```bash
# View container logs
docker logs container_name

# Follow log output
docker logs -f container_name

# Show last 100 lines
docker logs --tail 100 container_name

# Show timestamps
docker logs -t container_name

# Inspect container details
docker inspect container_name

# View container stats
docker stats

# View stats for specific container
docker stats container_name

# View processes in container
docker top container_name
```

### Exécution de commandes

```bash
# Execute command in running container
docker exec container_name ls -la

# Interactive shell in container
docker exec -it container_name bash

# Execute as specific user
docker exec -u root container_name whoami

# Execute with environment variable
docker exec -e VAR=value container_name printenv VAR
```

---

## Gestion des images

### Utilisation des images

```bash
# List local images
docker images

# Pull image from registry
docker pull nginx:latest

# Pull specific version
docker pull nginx:1.25

# Push image to registry
docker push myregistry/myimage:tag

# Tag an image
docker tag source_image:tag target_image:tag

# Remove image
docker rmi image_name

# Remove unused images
docker image prune

# Remove all unused images
docker image prune -a

# View image history
docker history image_name

# Inspect image details
docker inspect image_name
```

### Construction d'images

```bash
# Build from Dockerfile in current directory
docker build -t myimage:latest .

# Build with specific Dockerfile
docker build -f Dockerfile.prod -t myimage:prod .

# Build with build arguments
docker build --build-arg VERSION=1.0 -t myimage .

# Build without cache
docker build --no-cache -t myimage .

# Build for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 -t myimage .
```

---

## Docker Compose

### Commandes de base

```bash
# Start services
docker-compose up

# Start in detached mode
docker-compose up -d

# Start specific service
docker-compose up -d nginx

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop and remove images
docker-compose down --rmi all

# Restart services
docker-compose restart

# View service logs
docker-compose logs

# Follow logs for specific service
docker-compose logs -f web
```

### Gestion des services

```bash
# List running services
docker-compose ps

# Build/rebuild services
docker-compose build

# Build without cache
docker-compose build --no-cache

# Pull service images
docker-compose pull

# Scale service
docker-compose up -d --scale web=3

# Execute command in service
docker-compose exec web bash

# Run one-off command
docker-compose run --rm web npm test
```

### Configuration

```bash
# Validate compose file
docker-compose config

# View parsed compose file
docker-compose config --services

# Use specific compose file
docker-compose -f docker-compose.prod.yml up

# Use multiple compose files
docker-compose -f docker-compose.yml -f docker-compose.override.yml up
```

---

## Gestion des volumes

```bash
# List volumes
docker volume ls

# Create volume
docker volume create my_volume

# Inspect volume
docker volume inspect my_volume

# Remove volume
docker volume rm my_volume

# Remove unused volumes
docker volume prune

# Mount named volume
docker run -v my_volume:/data nginx

# Mount with read-only
docker run -v my_volume:/data:ro nginx
```

---

## Gestion du réseau

```bash
# List networks
docker network ls

# Create network
docker network create my_network

# Create bridge network
docker network create --driver bridge my_bridge

# Connect container to network
docker network connect my_network container_name

# Disconnect from network
docker network disconnect my_network container_name

# Inspect network
docker network inspect my_network

# Remove network
docker network rm my_network

# Remove unused networks
docker network prune

# Run container on specific network
docker run -d --network my_network nginx
```

---

## Commandes système

```bash
# View Docker system info
docker info

# View disk usage
docker system df

# View detailed disk usage
docker system df -v

# Clean up everything
docker system prune

# Clean up including volumes
docker system prune --volumes

# Clean up including all images
docker system prune -a

# View Docker version
docker version

# View Docker events
docker events
```

---

## Exemple de docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://db:5432/mydb
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - db
      - redis
    networks:
      - app-network
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

---

## Exemple de Dockerfile

```dockerfile
# Multi-stage build example
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

---

## Tableau de référence rapide

| Action | Commande |
|--------|---------|
| Exécuter un conteneur | `docker run -d image` |
| Lister les conteneurs | `docker ps -a` |
| Arrêter un conteneur | `docker stop name` |
| Supprimer un conteneur | `docker rm name` |
| Afficher les journaux | `docker logs name` |
| Ouvrir un shell dans le conteneur | `docker exec -it name bash` |
| Construire une image | `docker build -t name .` |
| Lister les images | `docker images` |
| Démarrer les services | `docker-compose up -d` |
| Arrêter les services | `docker-compose down` |
| Afficher les journaux des services | `docker-compose logs -f` |
| Nettoyer | `docker system prune` |

---

## Ressources

- [Documentation Docker](https://docs.docker.com/)
- [Référence Docker Compose](https://docs.docker.com/compose/compose-file/)
- [Référence Dockerfile](https://docs.docker.com/engine/reference/builder/)
- [Docker Hub](https://hub.docker.com/)
