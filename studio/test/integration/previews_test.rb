# frozen_string_literal: true

require "test_helper"

class PreviewsTest < ActionDispatch::IntegrationTest
  setup do
    fixture_theme!
    @id = SecureRandom.hex(6)
    @dir = PreviewBuilder.dir.join(@id)
    @dir.join("sub").mkpath
    @dir.join("index.html").write("<html><body>home</body></html>")
    @dir.join("sub/index.html").write("<html><body>sub</body></html>")
    @dir.join("a.css").write("body{}")
    @dir.join("studio-meta.json").write({ "id" => @id, "pages" => 2, "seconds" => 1.0, "theme_version" => "9.9.9" }.to_json)
  end

  teardown { FileUtils.rm_rf(@dir) }

  test "serves a build's files with the preview policy and without X-Frame-Options" do
    get "/preview/#{@id}/"
    assert_response :success
    assert_equal "home", response.body[/<body>(.*)<\/body>/, 1]
    assert_nil response.headers["X-Frame-Options"]
    assert response.headers["Content-Security-Policy"].start_with?("default-src 'self' data:")
    assert_includes response.headers["Content-Security-Policy"], "frame-ancestors http://localhost:*"

    get "/preview/#{@id}/sub/"
    assert_response :success
    get "/preview/#{@id}/sub"
    assert_response :success
    get "/preview/#{@id}/a.css"
    assert_response :success
    assert_equal "text/css", response.media_type
  end

  test "refuses traversal and answers 404 for what is not there" do
    get "/preview/#{@id}/%2e%2e/%2e%2e/config/database.yml"
    assert_response :unprocessable_content
    get "/preview/#{@id}/missing.html"
    assert_response :not_found
    get "/preview/000000000000/"
    assert_response :not_found
    get "/preview/not-an-id/"
    assert_response :not_found
  end

  test "is loopback-only without a password, and token-gated with one" do
    get "/preview/#{@id}/", env: { "REMOTE_ADDR" => "192.168.1.20" }
    assert_response :forbidden
    with_env("STUDIO_PASSWORD" => "s3cret") do
      get "/preview/#{@id}/"
      assert_response :forbidden
      get "/preview/#{@id}/?token=#{PreviewHost.token_for(@id)}", env: { "REMOTE_ADDR" => "192.168.1.20" }
      assert_response :success
      get "/preview/#{@id}/?token=#{PreviewHost.token_for('000000000000')}"
      assert_response :forbidden
    end
  end

  test "the previews page shows the newest build in an iframe from the other loopback origin" do
    host! "localhost"
    get design_previews_path
    assert_response :success
    assert_select "iframe.preview[src=?]", "http://127.0.0.1/preview/#{@id}/"
    assert_select "a.chip.active", text: /#{@id}/
  end
end
