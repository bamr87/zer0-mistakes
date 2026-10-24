# frozen_string_literal: true

# scripts/bin/release <level> --dry-run: what a release would change, nothing
# written. The studio never runs a release for real; merging release-please's
# pull request does.
class ReleaseDryRunJob < ScriptJob
  private

  def execute(job, sink, interrupt)
    result = ScriptRunner.run("release_dry_run", theme: ThemeRoot.path, args: { level: job.params_hash["level"] },
                              sink: sink, interrupt: interrupt)
    check!(result, "release --dry-run")
    { "exit" => result.status, "level" => job.params_hash["level"] }
  end
end
