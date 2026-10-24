# frozen_string_literal: true

require "test_helper"

class ScriptRunnerTest < ActiveSupport::TestCase
  setup { @theme = fixture_theme! }

  test "only named commands with allow-listed arguments run" do
    assert_raises(ScriptRunner::Refused) { ScriptRunner.new("rm_rf", theme: @theme) }
    assert_raises(ScriptRunner::Refused) { ScriptRunner.new("release_dry_run", theme: @theme, args: { level: "huge" }) }
    assert_raises(ScriptRunner::Refused) { ScriptRunner.new("audit_consumer", theme: @theme, args: { consumer: "relative/path" }) }
    assert_raises(ScriptRunner::Refused) { ScriptRunner.new("audit_consumer", theme: @theme, args: { consumer: "/x", mode: "weird" }) }
    assert_raises(ScriptRunner::Refused) { ScriptRunner.new("jekyll_build", theme: @theme, args: { destination: "/x", baseurl: "http://evil" }) }
    runner = ScriptRunner.new("audit_consumer", theme: @theme, args: { consumer: "/x", mode: "gem", extra: "ignored" })
    assert_equal [ "bash", "scripts/bin/audit-consumer", "--consumer-path", "/x", "--theme-path", @theme.to_s, "--format", "json", "--mode", "gem" ], runner.argv
  end

  test "captures a script's output, exit status and duration" do
    result = ScriptRunner.capture("validate", theme: @theme, args: { quick: true })
    assert result.ok?
    assert_equal 0, result.status
    assert_includes result.output, "validate: ok --quick"
    assert_includes result.output, "=== validate: bash scripts/bin/validate --quick ==="
    assert result.duration >= 0

    @theme.join("fail").write("")
    result = ScriptRunner.capture("validate", theme: @theme)
    refute result.ok?
    assert_equal 3, result.status
    assert_includes result.output, "validate: something is wrong"
  end

  test "a captured command keeps stdout apart from the streamed stderr" do
    sink = ScriptRunner::StringSink.new
    runner = ScriptRunner.new("audit_consumer", theme: @theme, args: { consumer: "/sites/x" })
    result = runner.run(sink: sink)
    assert result.ok?
    assert_equal({ "consumer" => "/sites/x", "mode" => "auto", "identical" => [ "_includes/custom/head.html" ], "stale" => [], "missing" => [], "unjustified" => 0 }, JSON.parse(result.output))
    assert_includes sink.text, "auditing /sites/x"
    refute_includes sink.text, '"consumer"'
  end

  test "the child sees only the allow-listed environment, plus what the caller passes" do
    with_env("PROBE" => "leaked") do
      assert_not_includes ScriptRunner.capture("validate", theme: @theme).output, "probe="
      assert_includes ScriptRunner.capture("validate", theme: @theme, env: { "PROBE" => "given" }).output, "probe=given"
    end
  end

  test "a timeout ends the process group" do
    @theme.join("slow").write("")
    started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    result = ScriptRunner.capture("validate", theme: @theme, timeout: 1)
    assert result.timed_out
    refute result.ok?
    assert_operator Process.clock_gettime(Process::CLOCK_MONOTONIC) - started, :<, 8
    assert_includes result.output, "timed out after 1s"
    assert_no_process_in(@theme)
  end

  test "an interrupt cancels after the first line and the process group is gone" do
    @theme.join("slow").write("")
    interrupt = Class.new do
      attr_accessor :armed
      def tripped? = armed
    end.new
    sink = Class.new(ScriptRunner::StringSink) do
      attr_accessor :interrupt
      def say(line)
        super
        interrupt.armed = true if line.start_with?("tick")
      end
    end.new
    sink.interrupt = interrupt
    started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    result = ScriptRunner.run("validate", theme: @theme, sink: sink, interrupt: interrupt)
    assert result.cancelled
    refute result.ok?
    assert_operator Process.clock_gettime(Process::CLOCK_MONOTONIC) - started, :<, 8
    assert_includes sink.text, "tick 1"
    assert_no_process_in(@theme)
  end

  private

  def assert_no_process_in(theme)
    sleep 0.2
    procs = `ps -eo args`.lines.select { |l| l.include?(theme.to_s) && l.include?("validate") }
    assert_empty procs, "still running: #{procs.join}"
  end
end
