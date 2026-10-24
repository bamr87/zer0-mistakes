# frozen_string_literal: true

require "test_helper"

class DesignTest < ActionDispatch::IntegrationTest
  setup { @theme = fixture_theme! }

  test "the dashboard renders" do
    get root_path
    assert_response :success
    assert_select "h2", "Theme"
    assert_includes response.body, "9.9.9"
    assert_select "a.chip", text: "air"
  end

  test "tokens: list, edit with a digest, refuse stale and bad values, diff" do
    get design_tokens_path
    assert_response :success
    assert_select "a", text: "_sass/tokens/_color.scss"

    get design_token_path("color")
    assert_response :success
    assert_select "input[name=?]", "tokens[--zer0-logo-red@0]"
    digest = css_select("input[name=base_digest]").first["value"]

    patch design_token_path("color"), params: { base_digest: digest, tokens: { "--zer0-logo-red@0" => "#b00000" } }
    assert_response :success
    assert_includes response.body, "design-system-check: OK"
    assert_includes @theme.join("_sass/tokens/_color.scss").read, "--zer0-logo-red: #b00000;"

    patch design_token_path("color"), params: { base_digest: digest, tokens: { "--zer0-logo-red@0" => "#c00000" } }
    assert_response :conflict
    assert_includes @theme.join("_sass/tokens/_color.scss").read, "--zer0-logo-red: #b00000;"

    digest = TokenEditor.new("color").base_digest
    patch design_token_path("color"), params: { base_digest: digest, tokens: { "--zer0-logo-red@0" => "x; }" } }
    assert_response :unprocessable_content

    post diff_design_token_path("color"), params: { tokens: { "--zer0-logo-red@0" => "#d00000" } }, xhr: true
    assert_response :success
    assert_includes response.body, "+  --zer0-logo-red: #d00000;"
    refute_includes response.body, "<!DOCTYPE"

    get design_token_path("nope")
    assert_response :not_found
  end

  test "skins: list, edit, contrast, refuse a bad colour" do
    get design_skins_path
    assert_response :success
    assert_select "a", text: "aqua"

    get design_skin_path("aqua")
    assert_response :success
    assert_select "input[name=?][value=?]", "skin[brand]", "#00b4d8"
    digest = css_select("input[name=base_digest]").first["value"]

    patch design_skin_path("aqua"), params: { base_digest: digest, skin: { brand: "#112233", bg_accent: "#445566" } }
    assert_response :success
    assert_includes @theme.join("_sass/theme/_skins.scss").read, %(#112233, "17, 34, 51", #90e0ef,)
    assert_includes @theme.join("_design-system/tokens/skins.css").read, "--bs-primary: #112233;"
    assert_includes @theme.join("_data/theme_backgrounds.yml").read, %(accent: "#445566")

    patch design_skin_path("aqua"), params: { base_digest: SkinEditor.new("aqua").base_digest, skin: { brand: "navy" } }
    assert_response :unprocessable_content

    post contrast_design_skin_path("aqua"), params: { skin: { link_light: "#ffffff" } }, xhr: true
    assert_response :success
    assert_includes response.body, "below 4.5"

    get design_skin_path("contrast")
    assert_response :not_found
  end

  test "the doctor page lists the latest findings after a run" do
    get design_doctor_path
    assert_response :success
    assert_includes response.body, "Never run"

    assert_enqueued_jobs 1, only: ThemeDoctorJob do
      post design_doctor_path
    end
    assert_response :redirect
    perform_enqueued_jobs
    job = Job.latest("theme_doctor")
    assert_equal "succeeded", job.status

    get design_doctor_path
    assert_response :success
    assert_select "td.mono", text: "backgrounds.gem"
    assert_select "td.mono", text: "gem-rejects-backgrounds"

    get job_path(job)
    assert_response :success
    assert_includes response.body, "doctor: tokens.parity"
  end

  test "previews: empty list, and a build is queued as a job" do
    get design_previews_path
    assert_response :success
    assert_includes response.body, "No build yet"
    assert_enqueued_jobs 1, only: PreviewBuildJob do
      post design_previews_path
    end
    assert_redirected_to job_path(Job.last)
  end
end
