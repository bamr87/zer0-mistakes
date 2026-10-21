# Feature: ZER0-088
# frozen_string_literal: true

require "io/wait"

# Runs the theme's own scripts, and nothing else.
#
# Every command the studio can start is a named entry below with a fixed
# argv; arguments arrive as a small allow-listed hash, never as a string. The
# child runs in the theme directory, in its own process group, with an
# environment built from an allow-list (plus BUNDLE_GEMFILE pointing at the
# theme's Gemfile, so `bundle exec` inside it resolves the theme's bundle and
# not the studio's). Output streams line by line to a sink (a job log or a
# string); an interrupt is polled every quarter second and a timeout is
# enforced, both ending with TERM to the group and then KILL. A command whose
# stdout is a document (`capture: true`) gets it collected separately while
# its stderr still streams.
class ScriptRunner
  class Refused < StandardError; end

  Result = Struct.new(:status, :duration, :timed_out, :cancelled, :output, keyword_init: true) do
    def ok?
      status&.zero? && !timed_out && !cancelled
    end
  end

  LEVELS = %w[patch minor major].freeze
  MODES = %w[gem remote_theme].freeze

  COMMANDS = {
    "design_system_check" => { argv: ->(_t, _a) { [ "ruby", "scripts/design-system-check.rb" ] }, timeout: 60 },
    "validate" => { argv: ->(_t, a) { [ "bash", "scripts/bin/validate", *(a[:quick] ? [ "--quick" ] : []) ] }, timeout: 600 },
    "audit_consumer" => {
      argv: lambda { |theme, a|
        argv = [ "bash", "scripts/bin/audit-consumer", "--consumer-path", a.fetch(:consumer), "--theme-path", theme.to_s, "--format", "json" ]
        argv += [ "--mode", a[:mode] ] if a[:mode]
        argv
      },
      timeout: 300, capture: true
    },
    "release_dry_run" => { argv: ->(_t, a) { [ "bash", "scripts/bin/release", a.fetch(:level), "--dry-run" ] }, timeout: 600 },
    "propagate_report" => { argv: ->(_t, _a) { [ "ruby", "scripts/propagate.rb" ] }, timeout: 300 },
    "bundle_check" => { argv: ->(_t, _a) { [ "bundle", "check" ] }, timeout: 120, bundle: true },
    "bundle_install" => { argv: ->(_t, _a) { [ "bundle", "install", "--jobs", "4" ] }, timeout: 1800, bundle: true },
    "jekyll_build" => {
      argv: lambda { |_t, a|
        [ "bundle", "exec", "jekyll", "build", "--destination", a.fetch(:destination),
          "--config", "_config.yml,_config_dev.yml", "--baseurl", a.fetch(:baseurl) ]
      },
      timeout: 1800, bundle: true
    }
  }.freeze

  PASS_THROUGH = %w[PATH HOME LANG LC_ALL TMPDIR GEM_HOME GEM_PATH].freeze
  STOP_GRACE = 3.0

  # Streams into `sink` (responds to say/log/header, as JobLog does); returns a Result.
  def self.run(kind, theme:, args: {}, sink:, interrupt: nil, env: {}, timeout: nil)
    new(kind, theme: theme, args: args).run(sink: sink, interrupt: interrupt, env: env, timeout: timeout)
  end

  # Runs to completion and returns the Result with everything it printed as `output`.
  def self.capture(kind, theme:, args: {}, env: {}, timeout: nil)
    sink = StringSink.new
    runner = new(kind, theme: theme, args: args)
    result = runner.run(sink: sink, env: env, timeout: timeout)
    result.output = runner.spec[:capture] ? result.output : sink.text
    result
  end

  attr_reader :kind, :theme, :argv, :spec

  def initialize(kind, theme:, args: {})
    @kind = kind.to_s
    @spec = COMMANDS[@kind] or raise Refused, "#{kind} is not a command the studio runs"
    @theme = Pathname.new(theme.to_s)
    @args = check_args(args)
    @argv = spec[:argv].call(@theme, @args)
  end

  def run(sink:, interrupt: nil, env: {}, timeout: nil)
    timeout ||= spec[:timeout]
    sink.header("#{kind}: #{argv.join(' ')}")
    err_r, err_w = IO.pipe
    out_r, out_w = spec[:capture] ? IO.pipe : [ nil, err_w ]
    started = clock
    pid = Bundler.with_unbundled_env do
      Process.spawn(environment(env), *argv, chdir: theme.to_s, pgroup: true,
                    in: File::NULL, out: out_w, err: err_w, unsetenv_others: true)
    end
    err_w.close
    out_w.close if spec[:capture]

    result = Result.new(timed_out: false, cancelled: false, output: +"")
    buffer = +""
    open = [ err_r, out_r ].compact
    deadline = started + timeout
    while open.any?
      ready, = IO.select(open, nil, nil, 0.25)
      Array(ready).each do |io|
        chunk = io.read_nonblock(65_536).force_encoding(Encoding::UTF_8)
        if io.equal?(out_r)
          result.output << chunk
        else
          buffer << chunk
          emit(sink, buffer)
        end
      rescue EOFError
        open.delete(io)
      rescue IO::WaitReadable
        nil
      end
      if interrupt&.tripped?
        result.cancelled = true
        sink.log("cancelled", :warn)
        stop(pid)
        break
      end
      if clock > deadline
        result.timed_out = true
        sink.log("timed out after #{timeout}s", :error)
        stop(pid)
        break
      end
    end
    emit(sink, buffer, final: true)
    result.status = wait(pid)
    result.duration = (clock - started).round(2)
    result.output = result.output.scrub
    sink.say("exit #{result.status.inspect} after #{result.duration}s")
    result
  ensure
    [ err_r, err_w, out_r, out_w ].compact.uniq.each { |io| io.close unless io.closed? }
  end

  private

  def check_args(args)
    args = args.to_h.transform_keys(&:to_sym).slice(:quick, :consumer, :mode, :level, :destination, :baseurl)
    raise Refused, "level must be patch, minor or major" if args.key?(:level) && !LEVELS.include?(args[:level].to_s)
    raise Refused, "mode must be gem or remote_theme" if args.key?(:mode) && !MODES.include?(args[:mode].to_s)
    raise Refused, "the consumer path must be absolute" if args.key?(:consumer) && !args[:consumer].to_s.start_with?("/")
    raise Refused, "the destination must be absolute" if args.key?(:destination) && !args[:destination].to_s.start_with?("/")
    raise Refused, "baseurl must be a plain path" if args.key?(:baseurl) && !args[:baseurl].to_s.match?(%r{\A/[\w/-]*\z})

    args.transform_values { |v| v == true || v == false ? v : v.to_s }
  end

  def environment(extra)
    env = ENV.to_h.slice(*PASS_THROUGH)
    if spec[:bundle]
      env["BUNDLE_GEMFILE"] = theme.join("Gemfile").to_s
      env["BUNDLE_PATH"] = ENV["THEME_BUNDLE_PATH"] if ENV["THEME_BUNDLE_PATH"].present?
      env["BUNDLE_APP_CONFIG"] = ENV["THEME_BUNDLE_APP_CONFIG"] if ENV["THEME_BUNDLE_APP_CONFIG"].present?
    end
    env.merge(extra.to_h.transform_keys(&:to_s).transform_values(&:to_s))
  end

  def emit(sink, buffer, final: false)
    while (nl = buffer.index("\n"))
      sink.say(buffer.slice!(0..nl).chomp.scrub)
    end
    return unless final && !buffer.empty?

    sink.say(buffer.scrub)
    buffer.clear
  end

  def stop(pid)
    Process.kill("TERM", -pid)
    deadline = clock + STOP_GRACE
    while clock < deadline
      return if Process.waitpid(pid, Process::WNOHANG)

      sleep 0.1
    end
    Process.kill("KILL", -pid)
  rescue Errno::ESRCH, Errno::ECHILD
    nil
  end

  def wait(pid)
    _, status = Process.wait2(pid)
    status.exitstatus || (status.termsig ? 128 + status.termsig : nil)
  rescue Errno::ECHILD
    nil
  end

  def clock
    Process.clock_gettime(Process::CLOCK_MONOTONIC)
  end

  # Collects output in memory for ScriptRunner.capture.
  class StringSink
    attr_reader :text

    def initialize
      @text = +""
    end

    def say(line)
      @text << line << "\n"
    end

    def log(message, level)
      @text << "[#{level.to_s.upcase}] #{message}\n"
    end

    def header(title)
      @text << "=== #{title} ===\n"
    end
  end
end
