# frozen_string_literal: true

# The theme checkout the studio works on: THEME_DIR, else the parent of
# studio/. A checkout qualifies when it carries the gemspec and the theme
# manifest; nothing is cached, so a test can point the studio at a fixture
# copy by setting the variable.
module ThemeRoot
  REQUIRED = %w[jekyll-theme-zer0.gemspec _data/theme-manifest.yml].freeze
  VERSION_FILE = "lib/jekyll-theme-zer0/version.rb"

  # Theme files the design pages may rewrite; every other path is read-only.
  WRITABLE = %w[
    _sass/tokens/*.scss
    _sass/theme/_skins.scss
    _sass/theme/_backgrounds.scss
    _data/theme_skins.yml
    _data/theme_backgrounds.yml
    _design-system/tokens/*.css
    _design-system/styles.css
  ].freeze

  module_function

  def path
    Pathname.new(File.expand_path(ENV["THEME_DIR"].presence || Rails.root.join("..").to_s))
  end

  def missing
    REQUIRED.reject { |rel| path.join(rel).file? }
  end

  def valid?
    missing.empty?
  end

  def version
    path.join(VERSION_FILE).read[/VERSION\s*=\s*"([^"]+)"/, 1]
  rescue SystemCallError
    nil
  end

  def confined
    ConfinedPath.new(path, writable: WRITABLE)
  end

  def read(relative)
    confined.read(relative)
  end
end
