# frozen_string_literal: true

require "test_helper"

class ConfinedPathTest < ActiveSupport::TestCase
  setup { @theme = fixture_theme! }

  test "resolves a plain file and refuses traversal, absolute paths, directories and symlinks" do
    c = ConfinedPath.new(@theme)
    assert c.file!("_data/theme_skins.yml").to_s.end_with?("_data/theme_skins.yml")
    assert_raises(ConfinedPath::Refused) { c.file!("../x") }
    assert_raises(ConfinedPath::Refused) { c.file!("/etc/passwd") }
    assert_raises(ConfinedPath::Refused) { c.file!("_data/../_config.yml") }
    assert_raises(ConfinedPath::Refused) { c.file!("") }
    assert_raises(ConfinedPath::Refused) { c.file!("_data") }
    assert_raises(ConfinedPath::NotFound) { c.file!("_data/nope.yml") }
    File.symlink("/etc", @theme.join("link"))
    assert_raises(ConfinedPath::Refused) { c.file!("link/hosts") }
    File.symlink(@theme.join("_config.yml"), @theme.join("alias.yml"))
    assert_raises(ConfinedPath::Refused) { c.file!("alias.yml") }
  end

  test "writable! admits only the allow-list, matched as whole paths" do
    c = ConfinedPath.new(@theme, writable: %w[_data/theme_*.yml _sass/tokens/*.scss])
    assert c.writable!("_data/theme_skins.yml")
    assert c.writable!("_sass/tokens/_color.scss")
    assert_raises(ConfinedPath::Refused) { c.writable!("_config.yml") }
    assert_raises(ConfinedPath::Refused) { c.writable!("_sass/theme/_skins.scss") }
    assert_raises(ConfinedPath::Refused) { c.writable!("_data/consumers.yml") }
  end

  test "read returns UTF-8 text with its digest, and relative_for inverts file!" do
    c = ConfinedPath.new(@theme)
    text, digest = c.read("_data/theme_skins.yml")
    assert_includes text, "default: air"
    assert_equal Digest::SHA256.hexdigest(text), digest
    assert_equal "_data/theme_skins.yml", c.relative_for(c.file!("_data/theme_skins.yml"))
    assert_nil c.relative_for("/elsewhere/file")
    assert c.exist?("_config.yml")
    refute c.exist?("missing")
  end
end
