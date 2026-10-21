# frozen_string_literal: true

require "test_helper"

class TokenEditorTest < ActiveSupport::TestCase
  setup do
    @theme = fixture_theme!
    @editor = TokenEditor.new("color")
  end

  test "lists every token file and matches mirrors by name and scope" do
    assert_equal DesignSystem.slugs, TokenEditor.all.map(&:slug)
    tokens = @editor.tokens
    primary = tokens.find { |t| t.name == "--zer0-color-primary" }
    assert_equal "var(--bs-primary, #007bff)", primary.value
    assert_equal "#007bff", primary.mirror_value
    assert tokens.find { |t| t.name == "--zer0-logo-red" }.mirror_missing?
    accents = tokens.select { |t| t.name == "--zer0-color-accent" }
    assert_equal %w[--zer0-color-accent@0 --zer0-color-accent@1], accents.map(&:id)
    assert_equal "#ffe484", accents[0].mirror_value
    assert_equal "#ffd400", accents[1].mirror_value
    assert_includes accents[1].mirror_decl.selector, "dark"
  end

  test "preview and diff change both files without writing" do
    texts = @editor.preview("--zer0-color-accent@1" => "#ffcc00")
    assert_includes texts[:scss], "[data-bs-theme=\"dark\"] {\n  --zer0-color-accent: #ffcc00;"
    assert_includes texts[:css], "[data-bs-theme=\"dark\"] {\n  --zer0-color-accent: #ffcc00;"
    refute_includes texts[:css], "#ffd400"
    assert_includes @editor.diff("--zer0-color-accent@1" => "#ffcc00"), "+  --zer0-color-accent: #ffcc00;"
    assert_equal "", @editor.diff("--zer0-color-accent@1" => "#ffd400")
    assert_includes @theme.join("_sass/tokens/_color.scss").read, "#ffd400"
  end

  test "update writes the source and the mirror, then runs the parity script" do
    result = @editor.update({ "--zer0-logo-red@0" => "#b00000", "--zer0-color-primary@0" => "var(--bs-primary, #0055cc)" },
                            base_digest: @editor.base_digest)
    assert result.ok?, result.output
    assert_includes result.output, "design-system-check: OK"
    scss = @theme.join("_sass/tokens/_color.scss").read
    css = @theme.join("_design-system/tokens/colors.css").read
    assert_includes scss, "--zer0-logo-red: #b00000;"
    assert_includes scss, "--zer0-color-primary: var(--bs-primary, #0055cc);"
    assert_includes css, "--zer0-color-primary: var(--bs-primary, #0055cc);"
    assert_includes scss, "// Brand / accent ---"
  end

  test "a stale form digest, an empty value and a value with a semicolon are refused" do
    assert_raises(AtomicWrite::Stale) { @editor.update({ "--zer0-logo-red@0" => "#b00000" }, base_digest: "nope") }
    assert_raises(TokenEditor::Invalid) { @editor.preview("--zer0-logo-red@0" => "") }
    assert_raises(TokenEditor::Invalid) { @editor.preview("--zer0-logo-red@0" => "#b00000; --x: 1") }
    assert_raises(TokenEditor::Invalid) { @editor.preview("--nope@0" => "1") }
    assert_includes @theme.join("_sass/tokens/_color.scss").read, "--zer0-logo-red: #a11111;"
  end

  test "when the mirror refuses, the source is put back" do
    digest = @editor.base_digest
    @editor.tokens
    css = @theme.join("_design-system/tokens/colors.css")
    css.write("#{css.read}/* edited in an editor */\n")
    scss_before = @theme.join("_sass/tokens/_color.scss").read
    assert_raises(AtomicWrite::Stale) { @editor.update({ "--zer0-color-primary@0" => "red" }, base_digest: digest) }
    assert_equal scss_before, @theme.join("_sass/tokens/_color.scss").read
  end
end
