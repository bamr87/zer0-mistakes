# frozen_string_literal: true

# The cancellation primitive a running script polls, backed by the Job's
# status. The Cancel button is a status change written by the web process,
# which may not be the worker's, so the flag consults the database — at most
# once a second.
#
# Copied from zer0-image-generator's DbInterrupt.
class JobInterrupt
  POLL_INTERVAL = 1.0

  def initialize(job)
    @job = job
    @tripped = false
    @last_check = 0.0
  end

  def trip
    @tripped = true
  end

  def tripped?
    return true if @tripped

    now = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    return @tripped if (now - @last_check) < POLL_INTERVAL

    @last_check = now
    @tripped = Job.where(id: @job.id).pick(:status) == "cancelled"
  end
end
