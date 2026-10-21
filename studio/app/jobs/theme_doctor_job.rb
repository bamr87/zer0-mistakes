# frozen_string_literal: true

# Runs the doctor's rules read-only and stores the findings on the job.
class ThemeDoctorJob < ScriptJob
  private

  def execute(_job, sink, _interrupt)
    doctor = ThemeDoctor.new(theme: ThemeRoot, sink: sink)
    findings = doctor.run
    sink.say("doctor: #{doctor.errors} error(s), #{doctor.warnings} warning(s)")
    { "findings" => findings, "errors" => doctor.errors, "warnings" => doctor.warnings }
  end
end
