# frozen_string_literal: true

require "test_helper"

# Copied from zer0-CMS's security_test and pointed at the studio's surfaces.
class SecurityTest < ActionDispatch::IntegrationTest
  setup { @theme = fixture_theme! }

  def credentials(user, password)
    { "HTTP_AUTHORIZATION" => ActionController::HttpAuthentication::Basic.encode_credentials(user, password) }
  end

  test "basic auth is enforced on every surface when STUDIO_PASSWORD is set" do
    with_env("STUDIO_PASSWORD" => "s3cret") do
      [ root_path, design_tokens_path, jobs_path, settings_path ].each do |path|
        get path
        assert_response :unauthorized, path
      end
      get root_path, env: credentials("zer0", "wrong")
      assert_response :unauthorized
      get root_path, env: credentials("zer0", "s3cret")
      assert_response :success
      get root_path, env: credentials("zer0", "s3cret").merge("REMOTE_ADDR" => "192.168.1.20")
      assert_response :success
    end
  end

  test "an empty STUDIO_USER (how compose passes an unset one) means the default user" do
    with_env("STUDIO_PASSWORD" => "s3cret", "STUDIO_USER" => "") do
      get root_path, env: credentials("", "s3cret")
      assert_response :unauthorized
      get root_path, env: credentials("zer0", "s3cret")
      assert_response :success
    end
  end

  test "without a password, requests from other machines are refused" do
    [ root_path, design_skins_path, sites_path, jobs_path ].each do |path|
      get path, env: { "REMOTE_ADDR" => "192.168.1.20" }
      assert_response :forbidden, path
    end
    get root_path, env: { "REMOTE_ADDR" => "::1" }
    assert_response :success
  end

  test "X-Forwarded-For cannot claim loopback, and a forwarded remote client is refused" do
    get root_path, env: { "REMOTE_ADDR" => "10.0.0.2", "HTTP_X_FORWARDED_FOR" => "127.0.0.1" }
    assert_response :forbidden
    get root_path, env: { "REMOTE_ADDR" => "127.0.0.1", "HTTP_X_FORWARDED_FOR" => "203.0.113.9" }
    assert_response :forbidden
  end

  test "an unknown Host header is refused, except for the health check" do
    host! "attacker.example"
    get root_path
    assert_response :forbidden
    get "/up"
    assert_response :success
  end

  test "the CSP carries a fresh nonce that the importmap scripts use, and admits the preview origin in frames" do
    get design_tokens_path
    policy = response.headers["Content-Security-Policy"]
    nonce = policy[/script-src [^;]*'nonce-([^']+)'/, 1]
    assert nonce, policy
    assert_no_match(/unsafe-inline|unsafe-eval/, policy[/script-src[^;]*/])
    assert_match(/frame-src [^;]*http:\/\/127\.0\.0\.1:\*/, policy)
    assert_select "script[type=importmap][nonce=?]", nonce
    assert_select "script[type=module][nonce=?]", nonce
    assert_select "meta[name=csp-nonce][content=?]", nonce

    get root_path
    refute_equal nonce, response.headers["Content-Security-Policy"][/'nonce-([^']+)'/, 1]
  end

  test "a write without the CSRF token is rejected" do
    before = @theme.join("_sass/tokens/_color.scss").read
    ActionController::Base.allow_forgery_protection = true
    patch design_token_path("color"), params: { base_digest: TokenEditor.new("color").base_digest, tokens: { "--zer0-logo-red@0" => "#000000" } }
    assert_response :unprocessable_content
    assert_equal before, @theme.join("_sass/tokens/_color.scss").read
  ensure
    ActionController::Base.allow_forgery_protection = false
  end

  test "a directory that is not a theme answers 503 on every page and 200 on /up" do
    with_env("THEME_DIR" => Dir.tmpdir) do
      get root_path
      assert_response :service_unavailable
      assert_includes response.body, "not a theme checkout"
      get "/up"
      assert_response :success
    end
  end
end
