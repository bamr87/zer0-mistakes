# frozen_string_literal: true

require "test_helper"
require "yaml"

# The studio never changes what the gem ships or what Jekyll publishes: this
# reads the REAL theme beside studio/, not the fixture.
class GemBoundaryTest < ActiveSupport::TestCase
  THEME = Rails.root.join("..").expand_path

  test "the gemspec packages nothing under studio/" do
    gemspec = THEME.join("jekyll-theme-zer0.gemspec")
    skip "no theme beside studio/" unless gemspec.file? && THEME.join(".git").exist?

    spec = Dir.chdir(THEME) { Gem::Specification.load(gemspec.to_s) }
    assert spec, "the gemspec did not load"
    assert_operator spec.files.size, :>, 0
    leaked = spec.files.select { |f| f.start_with?("studio/") }
    assert_empty leaked, "the gem would ship #{leaked.size} studio file(s): #{leaked.first(5).join(', ')}"
  end

  test "both Jekyll configs exclude studio/" do
    %w[_config.yml _config_dev.yml].each do |name|
      file = THEME.join(name)
      skip "no theme beside studio/" unless file.file?

      excluded = Array(YAML.safe_load(file.read, aliases: true)["exclude"]).map { |e| e.to_s.chomp("/") }
      assert_includes excluded, "studio", "#{name} does not exclude studio/"
    end
  end
end
