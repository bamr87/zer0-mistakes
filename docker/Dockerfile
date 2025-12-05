# ==============================================================================
# Zer0-Mistakes Jekyll Theme - Zero Version Pin Dockerfile
# ==============================================================================
# 
# Philosophy: Never pin any version → always use latest compatible versions
# Build fails immediately if incompatible → caught in CI, not production
# 
# Multi-stage build:
#   - base: Latest Ruby slim + build dependencies
#   - dev-test: Includes test gems for CI validation
#   - production: Optimized for serving built site
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base Image - Latest Ruby with build dependencies
# ------------------------------------------------------------------------------
FROM ruby:slim AS base

# Install system dependencies without version pins
# Let apt resolve latest compatible versions
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libyaml-dev \
        zlib1g-dev \
        git \
        imagemagick \
        libvips \
        nodejs \
        npm \
        curl \
        python3 \
        python3-pip \
        python3-venv && \
    npm install -g @mermaid-js/mermaid-cli && \
    pip3 install --break-system-packages jupyter nbconvert && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

WORKDIR /site

# Install latest Bundler - no version pin
RUN gem install bundler

# Copy dependency files first for better caching
# Note: gemspec is required because Gemfile references it via `gemspec` directive
COPY Gemfile Gemfile.lock* ./
COPY jekyll-theme-zer0.gemspec ./
COPY lib/ ./lib/

# Update lockfile to match Bundler version, then install
# This allows using latest Bundler while preserving dependency versions
RUN bundle config set --local deployment false && \
    bundle config set --local without '' && \
    bundle update --bundler && \
    bundle install --jobs 4 --retry 3

# ------------------------------------------------------------------------------
# Stage 2: Development & Test Stage
# ------------------------------------------------------------------------------
FROM base AS dev-test

# Ensure all gems including dev/test are installed
RUN bundle config set --local with 'development test' && \
    bundle install --jobs 4 --retry 3

# Copy full source for testing
COPY . .

# Default command for development
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--port", "4000", "--watch", "--force_polling"]

# ------------------------------------------------------------------------------
# Stage 3: Production Build Stage
# ------------------------------------------------------------------------------
FROM base AS build

# Copy full source
COPY . .

# Build site for production
RUN bundle exec jekyll build --config _config.yml

# ------------------------------------------------------------------------------
# Stage 4: Production Runtime Stage
# ------------------------------------------------------------------------------
FROM ruby:slim AS production

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
        webrick \
        curl && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean && \
    gem install bundler webrick

WORKDIR /site

# Copy only the built site from build stage
COPY --from=build /site/_site /site/_site
COPY --from=build /site/Gemfile /site/Gemfile
COPY --from=build /site/Gemfile.lock /site/Gemfile.lock

# Install minimal runtime dependencies
RUN bundle config set --local deployment true && \
    bundle config set --local without 'development test' && \
    bundle install --jobs 4 --retry 3 || true

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
