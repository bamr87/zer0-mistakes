# frozen_string_literal: true

# scripts/bin/validate, the theme's own configuration gate.
class ValidateJob < ScriptJob
  private

  def execute(job, sink, interrupt)
    result = ScriptRunner.run("validate", theme: ThemeRoot.path, args: { quick: job.params_hash["quick"] == true },
                              sink: sink, interrupt: interrupt)
    check!(result, "validate")
    { "exit" => result.status }
  end
end
