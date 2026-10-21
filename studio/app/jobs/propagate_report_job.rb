# frozen_string_literal: true

# scripts/propagate.rb in report mode: pin drift across the consumers, read
# from GitHub. Explicit and network-bound; never --dispatch.
class PropagateReportJob < ScriptJob
  private

  def execute(_job, sink, interrupt)
    result = ScriptRunner.run("propagate_report", theme: ThemeRoot.path, sink: sink, interrupt: interrupt)
    check!(result, "propagate.rb")
    { "exit" => result.status }
  end
end
