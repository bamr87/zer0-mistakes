# frozen_string_literal: true

# A logging sink (say/log/header) that appends every line to a Job's log and
# broadcasts it over Turbo Streams so the job page tails live.
#
# Lines are flushed on a short interval rather than one by one: a Jekyll
# build emits hundreds, and one UPDATE plus one broadcast each would swamp
# both. ANSI colour is stripped; the text is stored plain.
#
# Copied from zer0-image-generator's RunLogSink.
class JobLog
  ANSI = /\e\[[0-9;]*m/

  def initialize(job, broadcast: true)
    @job = job
    @broadcast = broadcast
    @buffer = +""
    @mutex = Mutex.new
    @last_flush = monotonic
  end

  def log(message, level)
    append("[#{level.to_s.upcase}] #{strip(message)}\n")
  end

  def say(text)
    append("#{strip(text)}\n")
  end

  def header(title)
    append("\n=== #{strip(title)} ===\n")
  end

  def flush!
    pending = nil
    @mutex.synchronize do
      pending = @buffer
      @buffer = +""
      @last_flush = monotonic
    end
    return if pending.empty?

    @job.append_log(pending)
    broadcast(pending) if @broadcast
  end

  private

  def append(line)
    ready = false
    @mutex.synchronize do
      @buffer << line
      ready = (monotonic - @last_flush) >= 0.4 || @buffer.bytesize > 4_000
    end
    flush! if ready
  end

  def broadcast(text)
    Turbo::StreamsChannel.broadcast_append_to(@job, target: "job-log", partial: "jobs/log_chunk", locals: { text: text })
  rescue StandardError
    # A broadcast failure (no subscriber, cable hiccup) must never fail the
    # job — the log is already durably in the database.
    nil
  end

  def strip(text)
    text.to_s.gsub(ANSI, "")
  end

  def monotonic
    Process.clock_gettime(Process::CLOCK_MONOTONIC)
  end
end
