# frozen_string_literal: true

module Update
  # The consumer pin matrix from _data/consumers.yml, joined to registered
  # checkouts, and the propagate report as a job.
  class ConsumersController < ApplicationController
    def show
      @registry = ConsumerRegistry.load
      @sites = Site.all.index_by(&:name)
      @last = Job.latest("propagate_report")
    end

    def drift
      job = Job.create!(kind: "propagate_report")
      PropagateReportJob.perform_later(job.id)
      redirect_to job_path(job), notice: "Propagate report queued (reads GitHub)."
    end
  end
end
