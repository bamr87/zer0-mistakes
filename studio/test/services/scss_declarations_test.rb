# frozen_string_literal: true

require "test_helper"

class ScssDeclarationsTest < ActiveSupport::TestCase
  setup { @theme = fixture_theme! }

  test "finds the skin palette includes with their selectors and argument text" do
    decls = ScssDeclarations.parse(@theme.join("_sass/theme/_skins.scss").read)
    includes = decls.select { |d| d.kind == :include }
    assert_equal %w[air aqua], includes.map { |d| d.selector[/skin="(\w+)"/, 1] }
    assert_includes includes.last.value, "$link-dark-hover:  #9ae8f5"
    assert_includes includes.last.value, '#00b4d8, "0, 180, 216", #90e0ef'
  end

  test "keeps the mixin body's properties under their nested selectors" do
    decls = ScssDeclarations.parse(@theme.join("_sass/theme/_skins.scss").read)
    dark = decls.find { |d| d.name == "--bs-link-color" }
    assert_includes dark.selector, '&[data-bs-theme="dark"]'
    assert_equal "#{'#{'}$link-dark}", dark.value
  end

  test "ignores comments and strings, reads interpolated url() values whole" do
    text = <<~'SCSS'
      // --zer0-not: here;
      /* --zer0-nor: here; */
      [data-theme-skin="air"] {
        --zer0-bg-gradient: #{"url('../backgrounds/gradients/air.svg')"};
        --zer0-label: "a; b { c }"; // trailing
        --zer0-bg-pattern-size: 50px 50px;
      }
    SCSS
    decls = ScssDeclarations.parse(text)
    assert_equal %w[--zer0-bg-gradient --zer0-label --zer0-bg-pattern-size], decls.map(&:name)
    assert_equal %q(#{"url('../backgrounds/gradients/air.svg')"}), decls[0].value
    assert_equal %q("a; b { c }"), decls[1].value
    assert_equal "50px 50px", decls[2].value
  end

  test "replace splices by byte range and leaves everything else untouched" do
    text = @theme.join("_sass/theme/_backgrounds.scss").read
    decl = ScssDeclarations.find(text, selector: '[data-theme-skin="aqua"]', name: "--zer0-bg-pattern-size").first
    out = ScssDeclarations.replace(text, { decl => "64px 64px" })
    assert_equal text.sub("48px 48px", "64px 64px"), out
    assert_raises(ScssDeclarations::ParseError) { ScssDeclarations.replace(text, { decl => "1px; }" }) }
  end

  test "a text it cannot follow raises ParseError" do
    assert_raises(ScssDeclarations::ParseError) { ScssDeclarations.parse(":root { --a: 1;") }
    assert_raises(ScssDeclarations::ParseError) { ScssDeclarations.parse(":root { --a: \"oops; }") }
    assert_raises(ScssDeclarations::ParseError) { ScssDeclarations.parse("} :root {}") }
  end

  test "find normalises selector whitespace" do
    text = ":root,\n[data-bs-theme=\"light\"] {\n  --zer0-a: 1;\n}\n"
    assert_equal 1, ScssDeclarations.find(text, selector: ':root, [data-bs-theme="light"]', name: "--zer0-a").size
  end
end
