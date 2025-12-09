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
#   - base: Ruby 3.3 slim + build dependencies
#   - dev-test: Includes test gems for CI validation
#   - production: Optimized for serving built site
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base Image - Ruby 3.3 with build dependencies
# ------------------------------------------------------------------------------
# Note: Using Ruby 3.3 instead of :latest (3.4) for compatibility with gems
# Ruby 3.4 breaks compatibility with some older native extensions
FROM ruby:3.3-slim AS base

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
FROM ruby:3.3-slim AS production

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
