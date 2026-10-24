# frozen_string_literal: true

# The audit trail: every job, one job with its live log, and cancel.
class JobsController < ApplicationController
  def index
    @jobs = Job.recent.includes(:site).limit(100)
  end

  def show
    @job = Job.find(params[:id])
  end

  def cancel
    job = Job.find(params[:id])
    notice = job.cancel! ? "Cancel requested." : "The job had already finished."
    redirect_to job_path(job), notice: notice
  end
end
