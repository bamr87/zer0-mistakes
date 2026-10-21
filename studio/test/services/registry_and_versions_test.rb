# frozen_string_literal: true

require "test_helper"

class RegistryAndVersionsTest < ActiveSupport::TestCase
  setup { @theme = fixture_theme! }

  test "the consumer registry is read, joined by name or repo" do
    registry = ConsumerRegistry.load
    assert_equal %w[bamr87/consumer-remote bamr87/consumer-gem bamr87/floating], registry.entries.map(&:repo)
    assert_equal "theme-release", registry.defaults["dispatch_event"]
    assert_equal "remote_theme_pinned", registry.find("consumer-remote").mode
    assert_equal "gem", registry.find("bamr87/consumer-gem").mode
    assert registry.find("consumer-gem").pinned?
    refute registry.find("floating").pinned?
    assert_equal "Unpinned.", registry.find("floating").risk
    assert_nil registry.find("nobody")
    assert_equal %w[gem remote_theme_floating remote_theme_pinned], registry.by_mode.keys.sort
  end

  test "version files are compared with lib/jekyll-theme-zer0/version.rb" do
    rows = VersionFiles.read
    assert_equal 6, rows.size
    assert rows.all?(&:ok?), rows.map { |r| [ r.file, r.version ] }.inspect
    @theme.join("package.json").write(%({ "version": "9.9.8" }\n))
    @theme.join("CHANGELOG.md").delete
    rows = VersionFiles.read.index_by(&:file)
    refute rows["package.json"].ok?
    assert_equal "9.9.8", rows["package.json"].version
    refute rows["CHANGELOG.md"].present
    assert rows["_data/theme-manifest.yml"].ok?
  end

  test "the preview origin is the other loopback name, and tokens round-trip" do
    request = Struct.new(:host, :protocol, :port_string, :base_url).new("localhost", "http://", ":3300", "http://localhost:3300")
    assert_equal "http://127.0.0.1:3300", PreviewHost.origin_for(request)
    request.host = "127.0.0.1"
    assert_equal "http://localhost:3300", PreviewHost.origin_for(request)
    request.host = "studio.example"
    request.base_url = "https://studio.example"
    assert_equal "https://studio.example", PreviewHost.origin_for(request)
    assert_equal "https://studio.example/preview/abcdefabcdef/", PreviewHost.url_for(request, "abcdefabcdef")
    with_env("STUDIO_PASSWORD" => "s3cret") do
      url = PreviewHost.url_for(request, "abcdefabcdef")
      token = url[/token=(.+)\z/, 1]
      assert PreviewHost.valid_token?(token, "abcdefabcdef")
      refute PreviewHost.valid_token?(token, "000000000000")
      refute PreviewHost.valid_token?("garbage", "abcdefabcdef")
    end
  end

  test "the theme root is validated, versioned and confined" do
    assert ThemeRoot.valid?
    assert_equal "9.9.9", ThemeRoot.version
    assert_raises(ConfinedPath::Refused) { ThemeRoot.confined.writable!("_config.yml") }
    assert ThemeRoot.confined.writable!("_sass/tokens/_color.scss")
    with_env("THEME_DIR" => Dir.tmpdir) do
      refute ThemeRoot.valid?
      assert_equal ThemeRoot::REQUIRED, ThemeRoot.missing
    end
  end
end
