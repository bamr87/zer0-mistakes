# frozen_string_literal: true

require "test_helper"

# Cancel reaches a running script through the database, so this test runs
# the job in a thread and the Cancel button's write from the test thread —
# outside the transactional fixture wrapper, as production would.
class ScriptJobCancelTest < ActiveSupport::TestCase
  self.use_transactional_tests = false

  setup { @theme = fixture_theme! }
  teardown { Job.delete_all }

  test "a cancel flips a running script to cancelled within seconds and leaves no process" do
    @theme.join("slow").write("")
    job = Job.create!(kind: "validate")
    worker = Thread.new { ValidateJob.perform_now(job.id) }

    # Each poll uses a fresh connection: the test thread's own would keep
    # reading the snapshot it opened before the worker wrote.
    deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + 10
    until fresh_log(job).include?("tick 1")
      if Process.clock_gettime(Process::CLOCK_MONOTONIC) > deadline
        worker.join(1)
        flunk "the job never produced its first line: #{Job.find(job.id).attributes.slice('status', 'error', 'log').inspect}"
      end
      sleep 0.2
    end
    assert_equal "running", Job.find(job.id).status
    assert Job.find(job.id).cancel!

    worker.join(8) or flunk "the job did not stop after the cancel"
    job.reload
    assert_equal "cancelled", job.status
    assert job.finished_at
    assert_includes job.log, "[WARN] cancelled"
    sleep 0.3
    procs = `ps -eo args`.lines.select { |l| l.include?(@theme.to_s) && l.include?("validate") }
    assert_empty procs, "still running: #{procs.join}"
  end

  def fresh_log(job)
    Job.connection_pool.with_connection { Job.uncached { Job.where(id: job.id).pick(:log).to_s } }
  end

  test "a succeeded job keeps its full log" do
    job = Job.create!(kind: "validate", params: { "quick" => true })
    ValidateJob.perform_now(job.id)
    job.reload
    assert_equal "succeeded", job.status
    assert_includes job.log, "validate: ok --quick"
    assert_includes job.log, "exit 0 after"
    assert_equal 0, job.stats["exit"]
    assert job.duration
  end
end
