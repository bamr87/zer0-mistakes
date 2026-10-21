# frozen_string_literal: true

require "json"

# scripts/bin/audit-consumer against a registered site, JSON on stdout; the
# parsed report is stored on the site as its last audit.
class AuditConsumerJob < ScriptJob
  private

  def execute(job, sink, interrupt)
    site = job.site or raise Failed, "the site is gone"
    args = { consumer: site.path }
    args[:mode] = job.params_hash["mode"] if job.params_hash["mode"].present?
    runner = ScriptRunner.new("audit_consumer", theme: ThemeRoot.path, args: args)
    result = runner.run(sink: sink, interrupt: interrupt)
    summary = parse(result.output)
    site.update!(last_audit_at: Time.current, last_audit_summary: summary) if summary.is_a?(Hash)
    check!(result, "audit-consumer")
    { "exit" => result.status, "summary" => summary }
  end

  def parse(text)
    JSON.parse(text.to_s)
  rescue JSON::ParserError
    { "raw" => text.to_s[0, 4000] }
  end
end
