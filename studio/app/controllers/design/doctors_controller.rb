# frozen_string_literal: true

module Design
  # The latest doctor pass, and a button that queues a new one.
  class DoctorsController < ApplicationController
    def show
      @job = Job.latest("theme_doctor")
      @running = Job.of("theme_doctor").active.recent.first
      @findings = Array(@job&.stats_hash&.dig("findings"))
    end

    def create
      job = Job.create!(kind: "theme_doctor")
      ThemeDoctorJob.perform_later(job.id)
      redirect_to job_path(job), notice: "Doctor queued."
    end
  end
end
