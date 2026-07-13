# Feature: ZER0-002
# ==============================================================================
# Zer0-Mistakes Jekyll Theme - Zero Version Pin Dockerfile
# ==============================================================================
# 
# Philosophy: Never pin gem versions → always use latest compatible versions
# Build fails immediately if incompatible → caught in CI, not production
# 
# Ruby Version Strategy:
#   - Uses Ruby 3.3 (not :latest/3.4) for ecosystem compatibility
#   - Ruby 3.4 breaks many gems with native C extensions (posix-spawn, etc.)
#   - Aligns with CI test matrix (Ruby 3.2, 3.3)
#   - Will upgrade to 3.4 once gem ecosystem stabilizes
# 
# Multi-stage build:
#   - base: Ruby 3.3 slim + minimal build deps (bundle + jekyll build)
#   - dev-test: Heavy tools (Mermaid CLI, Jupyter, ImageMagick, libvips) + test gems
#   - production: Optimized for serving built site
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base Image - Ruby 3.3 with minimal build dependencies
# ------------------------------------------------------------------------------
# Note: Using Ruby 3.3 instead of :latest (3.4) for compatibility with gems
# Ruby 3.4 breaks compatibility with some older native extensions
FROM ruby:3.3-slim AS base

# Minimal packages for native gems and Jekyll (no Node/Mermaid/Jupyter here)
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libyaml-dev \
        zlib1g-dev \
        git && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

WORKDIR /site

# Install Bundler matching Gemfile.lock version (2.3.25)
# This matches the "BUNDLED WITH" version in Gemfile.lock
RUN gem install bundler -v '~> 2.3'

# Copy dependency files first for better caching
# Note: gemspec is required because Gemfile references it via `gemspec` directive
COPY Gemfile Gemfile.lock* ./
COPY jekyll-theme-zer0.gemspec ./
COPY lib/ ./lib/

# Install dependencies with compatible Bundler version
RUN bundle config set --local deployment false && \
    bundle config set --local without '' && \
    bundle install --jobs 4 --retry 3

# ------------------------------------------------------------------------------
# Stage 2: Development & Test Stage
# ------------------------------------------------------------------------------
FROM base AS dev-test

# Lean dev/test tooling. Deliberately EXCLUDED (all were unused dead weight that
# ballooned the image to ~4GB and added ~78s to every cold build):
#   - @mermaid-js/mermaid-cli (mmdc): the ONLY reference in the whole repo was
#     its own install line — Mermaid renders client-side from the vendored
#     assets/vendor/mermaid/mermaid.min.js, never via mmdc. It pulls a full
#     headless Chromium (~300MB).
#   - imagemagick / libvips: no gem (no mini_magick/image_processing/ruby-vips)
#     and no script in the image shells out to them.
#   - nodejs / npm: only existed to install mmdc; the package.json scripts
#     (playwright, sass, vendor) run on the HOST, not in this image.
# Kept: curl/jq (handy in CI), python3 + jupyter/nbconvert (used by
# scripts/convert-notebooks.sh and test/test-notebook-conversion.sh in-container)
# + pyyaml + librsvg2-bin (scripts/lib/preview_generator.py — the preview-image
# engine; rsvg-convert rasterizes the claude/local providers' SVG banners to PNG).
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
        curl \
        jq \
        librsvg2-bin \
        python3 \
        python3-pip \
        python3-venv && \
    pip3 install --break-system-packages jupyter nbconvert pyyaml && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Note: the `base` stage already runs `bundle install` with `without ''`, so the
# development+test gem groups are present here. No second bundle install needed.

# Copy full source for CI (the dev-server path bind-mounts the repo over /site,
# so this COPY only matters for image-only test runs without a mount).
COPY . .

# Default command for development
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--port", "4000", "--watch", "--force_polling"]

# ------------------------------------------------------------------------------
# Stage 3: Production Build Stage
# ------------------------------------------------------------------------------
FROM base AS build

# Copy full source
COPY . .

# Build site for production (local theme; see docker/config/docker-build.yml)
# .dockerignore excludes .git — jekyll-github-metadata needs PAGES_REPO_NWO in this context
ENV JEKYLL_ENV=production
ENV PAGES_REPO_NWO=bamr87/zer0-mistakes
RUN bundle exec jekyll build --config _config.yml,docker/config/docker-build.yml

# ------------------------------------------------------------------------------
# Stage 4: Production Runtime Stage
# ------------------------------------------------------------------------------
FROM ruby:3.3-slim AS production

# The CMD below serves static files with Ruby's built-in `un.rb` httpd, which
# needs nothing but the stdlib already present in ruby:3.3-slim — no gems, no
# Gemfile, no bundle install. (curl is kept only for container HEALTHCHECKs.)
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

WORKDIR /site

# Copy only the built static site from the build stage.
COPY --from=build /site/_site /site/_site

EXPOSE 4000

# Serve the built site
CMD ["ruby", "-run", "-e", "httpd", "/site/_site", "-p", "4000", "--bind", "0.0.0.0"]

# ------------------------------------------------------------------------------
# Labels for container metadata
# ------------------------------------------------------------------------------
LABEL org.opencontainers.image.title="zer0-mistakes" \
      org.opencontainers.image.description="Jekyll theme with zero version pins - bleeding edge dependencies" \
      org.opencontainers.image.source="https://github.com/bamr87/zer0-mistakes" \
      org.opencontainers.image.vendor="bamr87"
