# frozen_string_literal: true

require "test_helper"

class ThemeDoctorTest < ActiveSupport::TestCase
  setup { @theme = fixture_theme! }

  def run_doctor
    ThemeDoctor.run.group_by { |f| f["check_id"] }
  end

  test "the fixture theme carries the known drift and nothing else" do
    by = run_doctor
    assert_equal %w[background-only], by["skins.registry"].map { |f| f["rule"] }
    assert_equal 3, by["backgrounds.assets"].size
    assert_equal 1, by["backgrounds.gem"].size
    assert_equal 2, by["tokens.contrast"].size
    assert_nil by["tokens.parity"]
    assert_nil by["skins.default"]
    assert_nil by["config.byte-copy"]
    assert_nil by["config.exclude"]
    assert_match(/\A\h{12}\z/, by["backgrounds.gem"].first["fingerprint"])
    assert_equal run_doctor["backgrounds.assets"].map { |f| f["fingerprint"] }, by["backgrounds.assets"].map { |f| f["fingerprint"] }
  end

  test "parity, byte-copy, exclusion and default drift are each flagged" do
    @theme.join("DRIFT").write("colors.css: missing --zer0-x (declared in _color.scss)\n")
    @theme.join("pages/_about/settings/_config.yml").write("stale\n")
    config = @theme.join("_config_dev.yml")
    config.write(config.read.sub("  - studio/\n", ""))
    skins = @theme.join("_data/theme_skins.yml")
    skins.write(skins.read.sub("default: air", "default: plum"))

    by = run_doctor
    assert_equal [ "colors.css: missing --zer0-x (declared in _color.scss)" ], by["tokens.parity"].map { |f| f["evidence"] }
    assert_equal "error", by["tokens.parity"].first["severity"]
    assert_equal %w[stale-copy], by["config.byte-copy"].map { |f| f["rule"] }
    assert_equal [ "_config_dev.yml" ], by["config.exclude"].map { |f| f["file"] }
    assert_equal %w[default-without-palette docs-site-differs], by["skins.default"].map { |f| f["rule"] }
  end

  test "the job stores the findings and the counts" do
    job = Job.create!(kind: "theme_doctor")
    ThemeDoctorJob.perform_now(job.id)
    job.reload
    assert_equal "succeeded", job.status
    assert_equal 3, job.stats["errors"]
    assert_equal 4, job.stats["warnings"]
    assert_includes job.log, "doctor: tokens.parity"
    assert_includes job.log, "design-system-check: OK"
  end
end
