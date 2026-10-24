# frozen_string_literal: true

# Every test works on a COPY of the fixture theme (test/fixtures/theme) and
# the fixture site (test/fixtures/site) in a temporary directory, pointed at
# through THEME_DIR and SITES_DIR, so nothing ever touches the real checkout.
ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"
require "fileutils"
require "tmpdir"

module FixtureWorld
  FIXTURES = Pathname.new(File.expand_path("fixtures", __dir__))

  # A fresh copy of the fixture theme; returns its path.
  def fixture_theme!
    @fixture_tmp ||= Pathname.new(Dir.mktmpdir("zer0-studio-test"))
    theme = @fixture_tmp.join("theme")
    FileUtils.cp_r(FIXTURES.join("theme"), theme)
    theme.join("pages/_about/settings").mkpath
    theme.join("pages/_about/settings/_config.yml").write("{% raw %}\n#{theme.join('_config.yml').read}{% endraw %}\n")
    Dir.glob(theme.join("scripts/**/*")).each { |f| File.chmod(0o755, f) if File.file?(f) }
    set_env("THEME_DIR", theme.to_s)
    set_env("STUDIO_PREVIEWS_DIR", @fixture_tmp.join("previews").to_s)
    theme
  end

  # A fresh copy of the fixture site under a SITES_DIR; returns the site path.
  def fixture_site!(name = "consumer-remote")
    @fixture_tmp ||= Pathname.new(Dir.mktmpdir("zer0-studio-test"))
    sites = @fixture_tmp.join("sites")
    sites.mkpath
    site = sites.join(name)
    FileUtils.cp_r(FIXTURES.join("site"), site)
    set_env("SITES_DIR", sites.to_s)
    site
  end

  def set_env(key, value)
    @saved_env ||= {}
    @saved_env[key] = ENV[key] unless @saved_env.key?(key)
    ENV[key] = value
  end

  def with_env(pairs)
    pairs.each { |k, v| set_env(k, v) }
    yield
  ensure
    pairs.each_key { |k| ENV[k] = @saved_env.delete(k) }
  end

  def teardown_fixture_world
    @saved_env&.each { |k, v| ENV[k] = v }
    @saved_env = nil
    FileUtils.rm_rf(@fixture_tmp) if @fixture_tmp && @fixture_tmp.to_s.start_with?(Dir.tmpdir)
    @fixture_tmp = nil
  end
end

module ActiveSupport
  class TestCase
    include FixtureWorld
    parallelize(workers: :number_of_processors)
    teardown :teardown_fixture_world
  end
end
