# ==============================================================================
# Zer0-Mistakes Jekyll Theme - Gemfile
# ==============================================================================
# 
# Philosophy: ZERO VERSION PINS
# - Let Bundler resolve the latest compatible versions at build time
# - Build fails immediately if incompatible → caught in CI, not production
# - Production always gets exactly what passed TEST (via Gemfile.lock)
# 
# See: docs/systems/ZERO_PIN_STRATEGY.md for full documentation
# ==============================================================================

source "https://rubygems.org"

# Load gem specification (contains runtime dependencies)
gemspec

# ------------------------------------------------------------------------------
# Core Dependencies - No version constraints → always latest compatible
# ------------------------------------------------------------------------------

# GitHub Pages gem (includes jekyll and most plugins)
# Note: When using GitHub Pages hosting, this provides:
#   - jekyll-remote-theme
#   - jekyll-feed
#   - jekyll-sitemap
#   - jekyll-seo-tag
#   - jekyll-paginate
gem "github-pages", group: :jekyll_plugins

# Web server for Ruby 3.0+ (required since WEBrick removed from stdlib)
gem "webrick"

# FFI for native extensions
gem "ffi"

# CommonMarker for Markdown processing
gem "commonmarker"

# Mermaid diagram support
gem "jekyll-mermaid"

# ------------------------------------------------------------------------------
# Development & Test - Only installed in dev/test environments
# ------------------------------------------------------------------------------
group :development, :test do
  # HTML validation and link checking
  gem "html-proofer"
  
  # Testing framework
  gem "rspec"
  
  # Task automation
  gem "rake"
  
  # Code linting (optional but recommended)
  gem "rubocop"
  gem "rubocop-rake"
end

# ------------------------------------------------------------------------------
# Platform-specific dependencies
# ------------------------------------------------------------------------------
# Ensure native gems work across platforms
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo"
  gem "tzinfo-data"
end

# Performance booster for watching directories on Windows
gem "wdm", :platforms => [:mingw, :x64_mingw, :mswin]