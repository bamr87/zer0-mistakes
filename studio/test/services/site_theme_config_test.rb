# frozen_string_literal: true

require "test_helper"

class SiteThemeConfigTest < ActiveSupport::TestCase
  setup do
    fixture_theme!
    @path = fixture_site!
    @site = Site.create!(path: @path.to_s)
    @editor = SiteThemeConfig.new(@site)
  end

  test "reads the theme keys as the file holds them" do
    c = @editor.current
    assert_equal "aqua", c["theme_skin"]
    assert_equal "light", c["color_mode_default"]
    assert_equal "true", c["color_mode_lock"]
    assert_nil c["appearance_panel"]
    assert_equal "0.6", c["theme_background"]["gradient_opacity"]
    assert_equal({ "main" => "#0077b6", "secondary" => "#6c757d" }, c["theme_color"])
  end

  test "preview rewrites one line per key and appends what is missing, comments intact" do
    out = @editor.preview("theme_skin" => "air", "appearance_panel" => "false",
                          "theme_background" => { "enabled" => "false", "pattern_opacity" => "0.1" },
                          "theme_color" => { "main" => "#123456" })
    assert_includes out, %(theme_skin               : "air" # one of the theme's skins\n)
    assert_includes out, "  enabled: false           # Master toggle\n"
    assert_includes out, "theme_background:\n  pattern_opacity: 0.1\n  enabled: false"
    assert_includes out, %(  main:         "#123456"\n  secondary:    "#6c757d" # muted\n)
    assert_includes out, "# Brand colours; hex, quoted.\n"
    assert out.end_with?("  - jekyll-feed\nappearance_panel: false\n")
  end

  test "refuses values the theme would not understand" do
    assert_raises(SiteThemeConfig::Invalid) { @editor.preview("color_mode_default" => "sepia") }
    assert_raises(SiteThemeConfig::Invalid) { @editor.preview("theme_color" => { "main" => "red" }) }
    assert_raises(SiteThemeConfig::Invalid) { @editor.preview("theme_background" => { "gradient_opacity" => "lots" }) }
    assert_raises(SiteThemeConfig::Invalid) { @editor.preview("theme_skin" => "../x") }
    assert_raises(SiteThemeConfig::Invalid) { @editor.preview("theme_color" => { "Bad Key" => "#123456" }) }
  end

  test "update writes through the digest guard and the diff shows the change" do
    assert_includes @editor.diff("theme_skin" => "air"), %(+theme_skin               : "air")
    assert_raises(AtomicWrite::Stale) { @editor.update({ "theme_skin" => "air" }, base_digest: "x") }
    @editor.update({ "theme_skin" => "air" }, base_digest: @editor.base_digest)
    assert_equal "air", SiteThemeConfig.new(@site).current["theme_skin"]
    assert_includes @path.join("_config.yml").read, "# Fixture consumer site (remote_theme, pinned)."
  end
end
