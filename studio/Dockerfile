# syntax=docker/dockerfile:1
#
# zer0 studio — the theme's Rails workbench. The build context is studio/;
# the theme itself is mounted at runtime (/theme) and never baked in.
#
# Ruby 3.4 on purpose: docker-compose.yml shares the theme's bundle volume
# (/usr/local/bundle, filled by the jekyll service, ruby:3.4-slim) with this
# container, and native gems only load on the Ruby that built them. The
# studio's own gems live apart in /usr/local/studio-bundle so the shared
# volume can never shadow them. The build tools the theme's Gemfile needs are
# here too, so a first preview on a fresh volume can `bundle install` the
# theme from inside the studio.
#
# Three stages, like the fleet CMS image: base (what runs), build (toolchain,
# the locked bundle, precompiled assets), final (both, unprivileged).

ARG RUBY_VERSION=3.4
FROM docker.io/library/ruby:$RUBY_VERSION-slim AS base

WORKDIR /studio

ENV RAILS_ENV=production \
    BUNDLE_PATH=/usr/local/studio-bundle \
    BUNDLE_DEPLOYMENT=1 \
    BUNDLE_WITHOUT=development:test \
    BUNDLE_APP_CONFIG=/usr/local/studio-bundle/.bundle-config \
    RAILS_LOG_TO_STDOUT=1 \
    LANG=C.UTF-8 \
    THEME_DIR=/theme \
    SITES_DIR=/sites \
    THEME_BUNDLE_PATH=/usr/local/bundle

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      curl \
      diffutils \
      git \
      libjemalloc2 \
      libsqlite3-0 \
      libyaml-0-2 \
      libyaml-dev \
      pkg-config \
      procps \
      zlib1g-dev && \
    rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------

FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y libsqlite3-dev && \
    rm -rf /var/lib/apt/lists/*

# Gemfile and Gemfile.lock first, so the bundle layer caches independently of
# the app. Install the exact Bundler the lock was written with.
COPY Gemfile Gemfile.lock ./
RUN gem install bundler -v "$(tail -1 Gemfile.lock | tr -d ' ')" --no-document && \
    bundle install --jobs 4 && \
    rm -rf /usr/local/studio-bundle/cache/*.gem && \
    find /usr/local/studio-bundle -name "*.c" -delete && \
    find /usr/local/studio-bundle -name "*.o" -delete

COPY . .

# Propshaft serves digested files from public/assets in production. The dummy
# secret exists only for this step and is never baked into the image.
RUN SECRET_KEY_BASE_DUMMY=1 bin/rails assets:precompile

# ---------------------------------------------------------------------------

FROM base

ARG UID=1000
ARG GID=1000

COPY --from=build /usr/local/studio-bundle /usr/local/studio-bundle
COPY --from=build /studio /studio

# storage/ is where compose mounts the named SQLite volume; a fresh named
# volume takes this directory's ownership, so the databases stay writable.
# /usr/local/bundle is the theme's shared bundle volume, writable so a first
# preview can install the theme's gems. On Linux, build with
# --build-arg UID=$(id -u) --build-arg GID=$(id -g) to write to bind-mounted
# checkouts as their owner.
RUN groupadd --system --gid "$GID" studio && \
    useradd --system --uid "$UID" --gid "$GID" --create-home --shell /usr/sbin/nologin studio && \
    mkdir -p /theme /sites /usr/local/bundle storage log tmp/previews tmp/pids && \
    chown -R studio:studio /usr/local/bundle storage log tmp
USER studio:studio

EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=40s --retries=12 \
  CMD curl -fsS http://localhost:3000/up || exit 1
ENTRYPOINT ["/studio/bin/docker-entrypoint"]
CMD ["bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]
