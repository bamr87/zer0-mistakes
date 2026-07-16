#!/usr/bin/env ruby
# frozen_string_literal: true
#
# test_plugins.rb — Standalone unit tests for the previously-uncovered
# Jekyll plugins (T-011):
#
#   _plugins/content_statistics_generator.rb (after_init hook helpers)
#
# Follows the test_ruby_converter.rb pattern: stub Jekyll/Liquid just enough
# that requiring the plugins doesn't boot Jekyll, then drive the pure logic
# with Structs. Runs standalone: `ruby test/test_plugins.rb`.
#

require 'minitest/autorun'
require 'tmpdir'
require 'fileutils'

# --- Minimal Jekyll/Liquid stubs (capture hook blocks so tests can fire them)
module Jekyll
  module Hooks
    @registered = {}

    def self.register(owner, event, &block)
      (@registered[[owner, event]] ||= []) << block
    end

    def self.fire(owner, event, payload)
      Array(@registered[[owner, event]]).each { |b| b.call(payload) }
    end
  end

  class Logger
    def info(*); end
    def warn(*); end
    def debug(*); end
  end

  def self.logger
    @logger ||= Logger.new
  end

  class Generator
    def self.safe(*); end
    def self.priority(*); end
  end
end

module Liquid
  class Tag
    def initialize(*); end
  end

  class Template
    def self.register_filter(*); end
    def self.register_tag(*); end
  end
end

require_relative '../_plugins/content_statistics_generator'
require_relative '../_plugins/theme_version'
require_relative '../_plugins/sanitize_config_filter'

FakePage = Struct.new(:output_ext, :url)
FakeSite = Struct.new(:pages, :data, :config, :source, :theme, :collections) do
  def respond_to_missing?(name, _ = false)
    name == :posts ? false : super
  end
end

# ---------------------------------------------------------------------------
class ContentStatisticsGeneratorTest < Minitest::Test
  def test_finds_script_in_site_source
    Dir.mktmpdir do |dir|
      FileUtils.mkdir_p(File.join(dir, '_data'))
      script = File.join(dir, '_data', 'generate_statistics.rb')
      File.write(script, '# stub')
      site = FakeSite.new([], {}, {}, dir, nil, nil)
      assert_equal script, Jekyll::ContentStatisticsBuild.generator_script(site)
    end
  end

  def test_falls_back_to_theme_root
    Dir.mktmpdir do |site_dir|
      Dir.mktmpdir do |theme_dir|
        FileUtils.mkdir_p(File.join(theme_dir, '_data'))
        script = File.join(theme_dir, '_data', 'generate_statistics.rb')
        File.write(script, '# stub')
        theme = Struct.new(:root_dir).new(theme_dir)
        site = FakeSite.new([], {}, {}, site_dir, theme, nil)
        assert_equal script, Jekyll::ContentStatisticsBuild.generator_script(site)
      end
    end
  end

  def test_nil_when_script_missing_everywhere
    Dir.mktmpdir do |dir|
      site = FakeSite.new([], {}, {}, dir, nil, nil)
      assert_nil Jekyll::ContentStatisticsBuild.generator_script(site)
    end
  end
end

# ---------------------------------------------------------------------------
class ThemeVersionGeneratorTest < Minitest::Test
  # site.config is a plain Hash for this generator
  def run_generator(config)
    site = Struct.new(:config).new(config)
    # Silence the gem scan so the test is deterministic regardless of which
    # jekyll-theme-* gems happen to be installed in the runner. Save/restore
    # the original Gem::Specification.each around the run.
    original = Gem::Specification.method(:each)
    Gem::Specification.define_singleton_method(:each) { |*| nil }
    begin
      Jekyll::ThemeVersionGenerator.new.generate(site)
    ensure
      Gem::Specification.define_singleton_method(:each, original)
    end
    site.config['theme_specs']
  end

  def test_remote_theme_records_latest
    specs = run_generator({ 'remote_theme' => 'bamr87/zer0-mistakes' })
    assert_equal 1, specs.length
    assert_equal 'zer0-mistakes', specs.first['name']
    assert_equal 'remote', specs.first['type']
    assert_equal 'latest', specs.first['version']
    assert_equal 'bamr87/zer0-mistakes', specs.first['repository']
  end

  def test_unknown_gem_theme_records_unknown_version
    specs = run_generator({ 'theme' => 'jekyll-theme-does-not-exist-xyz' })
    assert_equal 1, specs.length
    assert_equal 'jekyll-theme-does-not-exist-xyz', specs.first['name']
    assert_equal 'unknown', specs.first['version']
    assert_equal 'gem', specs.first['type']
  end

  def test_no_theme_config_yields_empty_specs
    assert_equal [], run_generator({})
  end
end

# ---------------------------------------------------------------------------
class SanitizeConfigFilterTest < Minitest::Test
  include Jekyll::SanitizeConfigFilter

  def filter(input) = sanitize_config_yaml(input)

  # --- SENSITIVE_KEY_RE: key-name matching -----------------------------------

  def test_redacts_api_key
    assert_equal "api_key: [REDACTED]\n", filter("api_key: secret123\n")
  end

  def test_redacts_apikey_no_separator
    assert_equal "apikey: [REDACTED]\n", filter("apikey: value\n")
  end

  def test_redacts_secret
    assert_equal "secret: [REDACTED]\n", filter("secret: mysecret\n")
  end

  def test_redacts_password
    assert_equal "password: [REDACTED]\n", filter("password: pass123\n")
  end

  def test_redacts_token
    assert_equal "token: [REDACTED]\n", filter("token: tok123\n")
  end

  def test_redacts_case_insensitive
    assert_equal "TOKEN: [REDACTED]\n", filter("TOKEN: upper\n")
  end

  def test_leaves_non_secret_key_untouched
    assert_equal "title: My Blog\n", filter("title: My Blog\n")
  end

  # --- PHC_VALUE_RE: PostHog project key prefix -----------------------------

  def test_redacts_phc_value_in_non_secret_key_line
    assert_equal "posthog_key: [REDACTED]\n", filter("posthog_key: phc_AbcDef123\n")
  end

  def test_leaves_line_without_phc_untouched
    assert_equal "some_key: normalvalue\n", filter("some_key: normalvalue\n")
  end

  # --- Mixed input: partial redaction across multiple lines -----------------

  def test_mixed_input_redacts_only_secret_lines
    input = "title: My Blog\napi_key: supersecret\ndescription: A blog\ntoken: mytoken\n"
    result = filter(input)
    assert_includes result, "title: My Blog\n"
    assert_includes result, "api_key: [REDACTED]\n"
    assert_includes result, "description: A blog\n"
    assert_includes result, "token: [REDACTED]\n"
  end

  # --- Edge cases -----------------------------------------------------------

  def test_empty_string_returns_empty
    assert_equal "", filter("")
  end

  def test_nil_returns_nil
    assert_nil filter(nil)
  end
end
