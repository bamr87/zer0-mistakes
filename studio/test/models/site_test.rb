# frozen_string_literal: true

require "test_helper"

class SiteTest < ActiveSupport::TestCase
  setup do
    fixture_theme!
    @path = fixture_site!
  end

  test "registers a site inside SITES_DIR and reads its mode from the files" do
    site = Site.create!(path: @path.to_s)
    assert_equal "consumer-remote", site.name
    assert_equal "remote_theme_pinned", site.mode
    assert_equal "bamr87/zer0-mistakes@v9.9.9", site.theme_pin
    assert_equal "bamr87/consumer-remote", site.consumer.repo

    @path.join("_config.yml").write(@path.join("_config.yml").read.sub(%(remote_theme             : "bamr87/zer0-mistakes@v9.9.9"), %(remote_theme             : "bamr87/zer0-mistakes")))
    assert_equal "remote_theme_floating", Site.new(path: @path.to_s).tap(&:valid?).mode

    gem_site = fixture_site!("consumer-gem")
    gem_site.join("_config.yml").write("title: gem\n")
    gem_site.join("Gemfile").write(%(gem "jekyll-theme-zer0", "~> 9.9"\n))
    assert_equal "gem", Site.new(path: gem_site.to_s).tap(&:valid?).mode
    gem_site.join("Gemfile").write(%(gem "jekyll-theme-zer0", path: ENV["ZER0_THEME_LOCAL"]\n))
    assert_equal "path", Site.new(path: gem_site.to_s).tap(&:valid?).mode
  end

  test "refuses a path outside SITES_DIR, without a config, or registered twice" do
    outside = Site.new(path: Dir.tmpdir)
    refute outside.valid?
    assert_match(/not inside/, outside.errors[:path].first)
    empty = @path.dirname.join("empty")
    empty.mkpath
    refute Site.new(path: empty.to_s).valid?
    relative = Site.new(path: "consumer-remote")
    refute relative.valid?
    Site.create!(path: @path.to_s)
    refute Site.new(path: @path.to_s).valid?
  end

  test "discovery lists unregistered site directories one or two levels down" do
    nested = @path.dirname.join("org/nested")
    nested.mkpath
    nested.join("_config.yml").write("title: nested\n")
    assert_equal [ @path.to_s, nested.to_s ].sort, SitesRoot.discover.sort
    Site.create!(path: @path.to_s)
    assert_equal [ nested.to_s ], SitesRoot.discover(Site.pluck(:path))
  end
end
