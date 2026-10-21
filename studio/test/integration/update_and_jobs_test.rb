# frozen_string_literal: true

require "test_helper"

class UpdateAndJobsTest < ActionDispatch::IntegrationTest
  setup { @theme = fixture_theme! }

  test "versions page flags a file out of step and queues a release dry run" do
    get update_versions_path
    assert_response :success
    assert_select "span.badge.ok", text: "ok", count: 6

    @theme.join("package.json").write(%({ "version": "9.9.8" }\n))
    get update_versions_path
    assert_select "span.badge.warn", text: "out of step", count: 1

    post update_release_path, params: { level: "minor" }
    job = Job.last
    assert_redirected_to job_path(job)
    assert_equal "minor", job.params["level"]
    perform_enqueued_jobs
    assert_equal "succeeded", job.reload.status, job.error
    assert_includes job.log, "release: minor --dry-run"

    post update_release_path, params: { level: "huge" }
    assert_response :unprocessable_content
  end

  test "consumers page shows the pin matrix and queues the propagate report" do
    get update_consumers_path
    assert_response :success
    assert_select "td.mono", text: "bamr87/consumer-gem"
    assert_select "span.badge.warn", text: "remote_theme_floating"

    post drift_update_consumers_path
    job = Job.last
    assert_equal "propagate_report", job.kind
    perform_enqueued_jobs
    assert_equal "succeeded", job.reload.status, job.error
    assert_includes job.log, "propagate: report"
  end

  test "jobs: index, show, cancel a queued job, and a failed script is recorded" do
    job = Job.create!(kind: "validate")
    get jobs_path
    assert_response :success
    assert_select "a", text: "##{job.id}"
    get job_path(job)
    assert_response :success
    assert_includes response.body, "waiting for output"

    post cancel_job_path(job)
    assert_redirected_to job_path(job)
    job.reload
    assert_equal "cancelled", job.status
    assert job.finished_at
    ValidateJob.perform_now(job.id)
    assert_nil job.reload.started_at

    @theme.join("fail").write("")
    failed = Job.create!(kind: "validate")
    ValidateJob.perform_now(failed.id)
    failed.reload
    assert_equal "failed", failed.status
    assert_equal "ScriptJob::Failed: validate exited 3", failed.error
    assert_includes failed.log, "validate: something is wrong"
    post cancel_job_path(failed)
    assert_equal "failed", failed.reload.status

    get settings_path
    assert_response :success
    assert_includes response.body, "this machine only"
  end
end
