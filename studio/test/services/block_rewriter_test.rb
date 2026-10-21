# frozen_string_literal: true

require "test_helper"

class BlockRewriterTest < ActiveSupport::TestCase
  TEXT = <<~YAML
    # header comment
    title                    : "fixture"
    theme_skin               : "air" # "air", "aqua"
    color_mode_default       : auto

    theme_background:
      enabled: true           # Master toggle
      gradient_opacity: 0.6   # Hero gradient

    # trailing comment
    plugins:
      - jekyll-feed
  YAML

  test "reads top-level and nested scalars" do
    assert_equal '"air"', BlockRewriter.scalar(TEXT, "theme_skin")
    assert_equal "auto", BlockRewriter.scalar(TEXT, "color_mode_default")
    assert_nil BlockRewriter.scalar(TEXT, "missing")
    assert_equal "true", BlockRewriter.nested_scalar(TEXT, "theme_background", "enabled")
    assert_equal "0.6", BlockRewriter.nested_scalar(TEXT, "theme_background", "gradient_opacity")
    assert_nil BlockRewriter.nested_scalar(TEXT, "theme_background", "nope")
  end

  test "rewrites one line keeping alignment and the trailing comment" do
    out = BlockRewriter.replace_scalar(TEXT, "theme_skin", '"aqua"')
    assert_includes out, %(theme_skin               : "aqua" # "air", "aqua"\n)
    assert_equal TEXT.lines.size, out.lines.size
    assert_equal TEXT.sub(%("air" # "air"), %("aqua" # "air")), out
  end

  test "appends a missing top-level key" do
    out = BlockRewriter.replace_scalar(TEXT, "appearance_panel", "false")
    assert out.end_with?("  - jekyll-feed\nappearance_panel: false\n")
  end

  test "rewrites, adds and creates nested scalars" do
    out = BlockRewriter.replace_nested_scalar(TEXT, "theme_background", "enabled", "false")
    assert_includes out, "  enabled: false           # Master toggle\n"
    out = BlockRewriter.replace_nested_scalar(TEXT, "theme_background", "blend_mode", "screen")
    assert_includes out, "theme_background:\n  blend_mode: screen\n  enabled: true"
    out = BlockRewriter.replace_nested_scalar(TEXT, "theme_color", "main", '"#112233"')
    assert out.end_with?("  - jekyll-feed\ntheme_color:\n  main: \"#112233\"\n")
  end

  test "replaces or appends a whole block and refuses multi-line values" do
    out = BlockRewriter.replace_block(TEXT, "theme_background", "theme_background:\n  enabled: false\n")
    assert_includes out, "theme_background:\n  enabled: false\n\n# trailing comment\n"
    refute_includes out, "gradient_opacity"
    assert_raises(BlockRewriter::Error) { BlockRewriter.replace_scalar(TEXT, "title", "a\nb") }
  end
end
