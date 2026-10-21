# frozen_string_literal: true

require "test_helper"

class AtomicWriteTest < ActiveSupport::TestCase
  setup do
    @theme = fixture_theme!
    @path = @theme.join("_data/theme_skins.yml")
  end

  test "replaces the bytes, keeps the mode and leaves no temp file" do
    File.chmod(0o640, @path)
    original = @path.read
    AtomicWrite.replace(@path, original: original, text: original.sub("default: air", "default: aqua"))
    assert_includes @path.read, "default: aqua"
    assert_equal 0o640, File.stat(@path).mode & 0o7777
    assert_empty Dir.glob(@theme.join("_data/.*.tmp"))
  end

  test "refuses when the file no longer holds the original" do
    original = @path.read
    @path.write("#{original}# edited elsewhere\n")
    assert_raises(AtomicWrite::Stale) { AtomicWrite.replace(@path, original: original, text: "x") }
    assert_includes @path.read, "edited elsewhere"
    assert_empty Dir.glob(@theme.join("_data/.*.tmp"))
  end

  test "an unchanged text writes nothing" do
    original = @path.read
    before = File.mtime(@path)
    AtomicWrite.replace(@path, original: original, text: original.dup)
    assert_equal before, File.mtime(@path)
  end

  test "check_base! compares the form's digest with the current one" do
    AtomicWrite.check_base!("x", "abc", "abc")
    assert_raises(AtomicWrite::Stale) { AtomicWrite.check_base!("x", "abc", "abd") }
    assert_raises(AtomicWrite::Stale) { AtomicWrite.check_base!("x", nil, "abd") }
  end
end
