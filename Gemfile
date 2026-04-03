# ==============================================================================
# Zer0-Mistakes Jekyll Theme - Gemfile
# ==============================================================================
# 
# Compatibility: Ruby >= 2.6.0, GitHub Pages (github-pages gem 228–231)
#
# Version constraints applied for broad Ruby compatibility:
#   - github-pages < 232 (v232 requires nokogiri >= 1.16.2 → Ruby >= 3.0)
#   - commonmarker ~> 0.23 (1.x requires Ruby >= 3.1)
#   - html-proofer ~> 4.0 (5.x requires Ruby >= 3.1)
#   - rubocop < 1.73 (>= 1.73 requires Ruby >= 2.7)
#
# Production always gets exactly what passed TEST (via Gemfile.lock)
# 
# See: docs/systems/ZERO_PIN_STRATEGY.md for full documentation
# ==============================================================================

source "https://rubygems.org"

# Load gem specification (contains runtime dependencies)
gemspec

# ------------------------------------------------------------------------------
# Core Dependencies - Version-capped for Ruby 2.6+ / GitHub Pages compat
# ------------------------------------------------------------------------------

# GitHub Pages gem (includes jekyll and most plugins)
# Note: When using GitHub Pages hosting, this provides:
#   - jekyll-remote-theme
#   - jekyll-feed
#   - jekyll-sitemap
#   - jekyll-seo-tag
#   - jekyll-paginate
# Note: github-pages uses Jekyll 3.x (not 4.x) - this is by design for GitHub Pages stability
# Cap < 232: v232 requires nokogiri >= 1.16.2 which needs Ruby >= 3.0
# Floor >= 228 ensures Ruby 3.x compat; ceiling < 232 preserves Ruby 2.6+ compat
gem "github-pages", ">= 228", "< 232", group: :jekyll_plugins

# Web server for Ruby 3.0+ (required since WEBrick removed from stdlib)
gem "webrick"

# FFI for native extensions
gem "ffi"

# CommonMarker for Markdown processing
# Pin to 0.23.x: commonmarker 1.x requires Ruby >= 3.1
gem "commonmarker", "~> 0.23"

# Mermaid diagram support
gem "jekyll-mermaid"

# Faraday retry middleware for Faraday v2.0+
gem "faraday-retry"

# ------------------------------------------------------------------------------
# Development & Test - Only installed in dev/test environments
# ------------------------------------------------------------------------------
group :development, :test do
  # HTML validation and link checking
  # Pin to 4.x: html-proofer 5.x requires Ruby >= 3.1 (async, zeitwerk)
  gem "html-proofer", "~> 4.0"
  
  # Testing framework
  gem "rspec"
  
  # Task automation
  gem "rake"
  
  # Code linting (optional but recommended)
  # Pin < 1.73: rubocop >= 1.73 requires Ruby >= 2.7; >= 1.86 requires Ruby >= 3.1
  gem "rubocop", "< 1.73"
  gem "rubocop-rake"
end

# ------------------------------------------------------------------------------
# Platform-specific dependencies
# ------------------------------------------------------------------------------
# Ensure native gems work across platforms
platforms :windows, :jruby do
  gem "tzinfo"
  gem "tzinfo-data"
end

# Performance booster for watching directories on Windows
gem "wdm", :platforms => [:windows]