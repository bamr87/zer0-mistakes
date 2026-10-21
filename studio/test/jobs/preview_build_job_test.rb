# frozen_string_literal: true

require "test_helper"

# The real build: the theme beside studio/, its own bundle, several minutes.
# Opt in with STUDIO_REAL_THEME=1 on a machine (or runner) that has the
# theme's gems installed.
class PreviewBuildJobTest < ActiveSupport::TestCase
  test "builds the docs site into a preview directory" do
    skip "set STUDIO_REAL_THEME=1 to build the real theme" unless ENV["STUDIO_REAL_THEME"] == "1"

    with_env("THEME_DIR" => Rails.root.join("..").expand_path.to_s) do
      job = Job.create!(kind: "preview_build")
      PreviewBuildJob.perform_now(job.id)
      job.reload
      assert_equal "succeeded", job.status, job.error
      id = job.stats["build_id"]
      assert PreviewBuilder.dir_for(id).join("index.html").file?
      assert_operator job.stats["pages"], :>, 10
    ensure
      FileUtils.rm_rf(PreviewBuilder.dir.join(id)) if id
    end
  end
end
