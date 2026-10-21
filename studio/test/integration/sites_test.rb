# frozen_string_literal: true

require "test_helper"

class SitesTest < ActionDispatch::IntegrationTest
  setup do
    fixture_theme!
    @path = fixture_site!
  end

  test "discover, register, show, forget" do
    get sites_path
    assert_response :success
    assert_includes response.body, @path.to_s
    assert_includes response.body, "Nothing registered"

    post sites_path, params: { site: { path: @path.to_s, discovered: "1" } }
    site = Site.last
    assert_redirected_to site_path(site)
    assert_equal "discover", site.registered_from
    assert_equal "remote_theme_pinned", site.mode

    get site_path(site)
    assert_response :success
    assert_includes response.body, "bamr87/zer0-mistakes@v9.9.9"
    assert_includes response.body, "bamr87/consumer-remote"

    delete site_path(site)
    assert_redirected_to sites_path
    assert_nil Site.find_by(id: site.id)
    assert @path.join("_config.yml").file?
  end

  test "a path outside SITES_DIR is refused with the reason" do
    post sites_path, params: { site: { path: Dir.tmpdir } }
    assert_response :unprocessable_content
    assert_includes response.body, "not inside"
    assert_equal 0, Site.count
  end

  test "the theme config editor rewrites lines and refuses a stale form" do
    site = Site.create!(path: @path.to_s)
    get site_theme_config_path(site)
    assert_response :success
    assert_select "input[name=?][value=?]", "config[theme_skin]", "aqua"
    digest = css_select("input[name=base_digest]").first["value"]

    post diff_site_theme_config_path(site), params: { config: { theme_skin: "air" } }, xhr: true
    assert_includes response.body, %(+theme_skin               : &quot;air&quot;)

    patch site_theme_config_path(site), params: { base_digest: digest, config: { theme_skin: "air", theme_color: { main: "#123456" } } }
    assert_redirected_to site_theme_config_path(site)
    text = @path.join("_config.yml").read
    assert_includes text, %(theme_skin               : "air" # one of the theme's skins)
    assert_includes text, %(  main:         "#123456")
    assert_includes text, "# Brand colours; hex, quoted."

    patch site_theme_config_path(site), params: { base_digest: digest, config: { theme_skin: "aqua" } }
    assert_response :conflict

    patch site_theme_config_path(site), params: { base_digest: SiteThemeConfig.new(site).base_digest, config: { color_mode_default: "sepia" } }
    assert_response :unprocessable_content
  end

  test "an audit runs the consumer script and stores its report on the site" do
    site = Site.create!(path: @path.to_s)
    post audit_site_path(site), params: { mode: "remote_theme" }
    job = Job.last
    assert_redirected_to job_path(job)
    assert_equal "remote_theme", job.params["mode"]
    perform_enqueued_jobs
    job.reload
    assert_equal "succeeded", job.status, job.error
    assert_includes job.log, "auditing #{site.path}"
    site.reload
    assert_equal site.path, site.last_audit_summary["consumer"]
    assert_equal "remote_theme", site.last_audit_summary["mode"]
    assert site.last_audit_at

    get site_path(site)
    assert_response :success
    assert_includes response.body, "1 item(s)"
  end
end
