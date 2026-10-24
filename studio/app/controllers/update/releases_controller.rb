# frozen_string_literal: true

module Update
  # Queues `scripts/bin/release <level> --dry-run`.
  class ReleasesController < ApplicationController
    def create
      level = params[:level].to_s
      raise ScriptRunner::Refused, "level must be patch, minor or major" unless ScriptRunner::LEVELS.include?(level)

      job = Job.create!(kind: "release_dry_run", params: { "level" => level })
      ReleaseDryRunJob.perform_later(job.id)
      redirect_to job_path(job), notice: "Release dry run (#{level}) queued."
    end
  end
end
