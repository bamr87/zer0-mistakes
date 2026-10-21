# frozen_string_literal: true

# The shape every studio job shares: find the Job row, refuse to start one
# that was cancelled while queued, stream into its log, and record how it
# ended — succeeded with stats, failed with the error, or cancelled when the
# interrupt tripped. Subclasses implement `execute(job, sink, interrupt)` and
# return the stats hash.
class ScriptJob < ApplicationJob
  class Failed < StandardError; end
  class Cancelled < StandardError; end

  queue_as :default

  def perform(job_id)
    job = Job.find(job_id)
    return if job.cancelled?

    job.start!
    sink = JobLog.new(job)
    interrupt = JobInterrupt.new(job)
    stats = execute(job, sink, interrupt) || {}
    sink.flush!
    if Job.where(id: job.id).pick(:status) == "cancelled"
      job.update!(finished_at: Time.current, stats: stats)
    else
      job.finish!(stats: stats)
    end
  rescue Cancelled, PreviewBuilder::Cancelled
    sink&.flush!
    job.update!(status: "cancelled", finished_at: Time.current)
  rescue StandardError => e
    sink&.flush!
    job&.fail!("#{e.class}: #{e.message}")
  ensure
    broadcast_done(job) if job
  end

  private

  def execute(_job, _sink, _interrupt)
    raise NotImplementedError
  end

  # Raises for a script that was cancelled or did not exit 0.
  def check!(result, what)
    raise Cancelled if result.cancelled
    raise Failed, "#{what} timed out" if result.timed_out
    raise Failed, "#{what} exited #{result.status.inspect}" unless result.ok?

    result
  end

  def broadcast_done(job)
    Turbo::StreamsChannel.broadcast_replace_to(job, target: "job-header", partial: "jobs/header", locals: { job: job.reload })
  rescue StandardError
    nil
  end
end
