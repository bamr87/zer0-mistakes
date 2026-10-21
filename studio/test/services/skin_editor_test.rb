# frozen_string_literal: true

require "test_helper"

class SkinEditorTest < ActiveSupport::TestCase
  setup do
    @theme = fixture_theme!
    @skin = SkinEditor.new("aqua")
  end

  test "reads the registry and one skin's palette from all four files" do
    assert_equal %w[air aqua], SkinEditor.names
    assert_equal "air", SkinEditor.default
    p = @skin.palette
    assert_equal "#00b4d8", p["brand"]
    assert_equal "0, 180, 216", p["brand_rgb"]
    assert_equal "#90e0ef", p["accent"]
    assert_equal "#006d99", p["link_light"]
    assert_equal "#9ae8f5", p["link_dark_hover"]
    assert_equal "48px 48px", p["pattern_size"]
    assert_equal "#0077b6", p["bg_primary"]
    assert_equal "#90e0ef", p["bg_accent"]
    assert_raises(ConfinedPath::NotFound) { SkinEditor.new("contrast") }
    assert_raises(ConfinedPath::NotFound) { SkinEditor.new("../x") }
  end

  test "preview rewrites the include, the mirror, the pattern size and the yaml colours" do
    texts = @skin.preview("brand" => "#112233", "link_dark" => "#aabbcc", "pattern_size" => "32px 32px", "bg_primary" => "#445566")
    assert_includes texts[:skins_scss], %(#112233, "17, 34, 51", #90e0ef,)
    assert_includes texts[:skins_scss], "/* Aqua — the brand itself fails AA on white; the links do not. */"
    css = texts[:skins_css]
    assert_includes css, "[data-theme-skin=\"aqua\"] {\n  --zer0-color-primary: #112233;\n  --zer0-color-primary-rgb: 17, 34, 51; /* @kind color */"
    assert_includes css, "--bs-primary: #112233;"
    assert_includes css, "--zer0-color-border: rgba(17, 34, 51, 0.28);"
    assert_includes css, "[data-theme-skin=\"aqua\"][data-bs-theme=\"dark\"] {\n  --bs-link-color: #aabbcc;\n  --zer0-color-link: #aabbcc;"
    assert_includes css, "[data-theme-skin=\"air\"] {\n  --zer0-color-primary: #6fa8dc;"
    assert_includes texts[:backgrounds_scss], "[data-theme-skin=\"aqua\"] {\n  --zer0-bg-gradient: #{'#{'}\"url('../backgrounds/gradients/aqua.svg')\"};\n  --zer0-bg-pattern: #{'#{'}\"url('../backgrounds/patterns/aqua.svg')\"};\n  --zer0-bg-noise: #{'#{'}\"url('../backgrounds/noise/aqua.svg')\"};\n  --zer0-bg-pattern-size: 32px 32px;"
    assert_includes texts[:backgrounds_scss], "--zer0-bg-pattern-size: 50px 50px;"
    assert_includes texts[:backgrounds_yml], "  aqua:\n    label: \"Aqua\"\n    colors:\n      primary: \"#445566\"\n      secondary: \"#00b4d8\""
    assert_includes texts[:backgrounds_yml], %(primary: "#e8f4f8"   # hero)
  end

  test "update writes the four files and runs the parity script" do
    result = @skin.update({ "accent" => "#abcdef" }, base_digest: @skin.base_digest)
    assert result.ok?, result.output
    assert_includes @theme.join("_sass/theme/_skins.scss").read, %(#00b4d8, "0, 180, 216", #abcdef,)
    assert_includes @theme.join("_design-system/tokens/skins.css").read, "--zer0-color-accent: #abcdef;"
    assert_equal "#abcdef", SkinEditor.new("aqua").palette["accent"]
  end

  test "bad values and a stale digest are refused before anything is written" do
    before = @theme.join("_sass/theme/_skins.scss").read
    assert_raises(SkinEditor::Invalid) { @skin.preview("brand" => "blue") }
    assert_raises(SkinEditor::Invalid) { @skin.preview("pattern_size" => "big") }
    assert_raises(AtomicWrite::Stale) { @skin.update({ "brand" => "#112233" }, base_digest: "stale") }
    assert_equal before, @theme.join("_sass/theme/_skins.scss").read
  end

  test "a refused later write undoes the earlier ones" do
    digest = @skin.base_digest
    @skin.palette
    @skin.skins_css
    css = @theme.join("_design-system/tokens/skins.css")
    css.write("#{css.read}/* touched in an editor */\n")
    before = @theme.join("_sass/theme/_skins.scss").read
    assert_raises(AtomicWrite::Stale) { @skin.update({ "brand" => "#112233" }, base_digest: digest) }
    assert_equal before, @theme.join("_sass/theme/_skins.scss").read
    assert_includes css.read, "/* touched in an editor */"
    refute_includes css.read, "#112233"
  end

  test "a file the save would not change is left alone even if it moved on" do
    digest = @skin.base_digest
    @skin.palette
    yml = @theme.join("_data/theme_backgrounds.yml")
    yml.write("#{yml.read}# touched\n")
    assert @skin.update({ "accent" => "#abcdef" }, base_digest: digest).ok?
    assert_includes yml.read, "# touched"
  end

  test "contrast reports the link rules, with the form's values merged in" do
    results = @skin.contrast
    assert results.find { |r| r.rule.start_with?("link-light on white") }.pass?
    refute results.find { |r| r.rule.start_with?("brand on white") }.pass?
    assert_equal 1.0, ContrastCheck.ratio("#ffffff", "#ffffff")
    assert_equal 21.0, ContrastCheck.ratio("#000000", "#ffffff")
    refute @skin.contrast("link_light" => "#ffffff").find { |r| r.rule.start_with?("link-light on white") }.pass?
  end
end
