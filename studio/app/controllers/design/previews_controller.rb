# frozen_string_literal: true

module Design
  # Docs-site previews: the newest builds, one shown in a cross-origin iframe,
  # and a button that queues a build.
  class PreviewsController < ApplicationController
    def index
      @builds = PreviewBuilder.builds
      @running = Job.of("preview_build").active.recent.first
      @current = @builds.find { |b| b.id == params[:build] } || @builds.first
      @iframe_url = @current && PreviewHost.url_for(request, @current.id)
    end

    def create
      job = Job.create!(kind: "preview_build")
      PreviewBuildJob.perform_later(job.id)
      redirect_to job_path(job), notice: "Preview build queued."
    end
  end
end
