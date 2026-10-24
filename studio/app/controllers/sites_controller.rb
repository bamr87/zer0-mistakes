# frozen_string_literal: true

# Registered consumer checkouts under SITES_DIR, the ones discovered there
# but not yet registered, and a consumer audit as a job.
class SitesController < ApplicationController
  before_action :load_site, only: %i[show destroy audit]

  def index
    @sites = Site.named
    @discoverable = SitesRoot.discover(@sites.map(&:path))
    @registry = ConsumerRegistry.load
  end

  def show
    @pin = @site.theme_pin
    @consumer = @site.consumer
    @config = SiteThemeConfig.new(@site).current
    @jobs = @site.jobs.recent.limit(10)
  end

  def new
    @site = Site.new(path: params[:path])
  end

  def create
    @site = Site.new(site_params)
    @site.registered_from = params.dig(:site, :discovered) == "1" ? "discover" : "form"
    if @site.save
      redirect_to site_path(@site), notice: "#{@site.name} registered."
    else
      render :new, status: :unprocessable_content
    end
  end

  # Forgets the row; the directory is untouched.
  def destroy
    @site.destroy!
    redirect_to sites_path, notice: "#{@site.name} forgotten (its files are untouched)."
  end

  def audit
    mode = params[:mode].presence
    job = Job.create!(kind: "audit_consumer", site: @site, params: mode ? { "mode" => mode } : {})
    AuditConsumerJob.perform_later(job.id)
    redirect_to job_path(job), notice: "Audit queued."
  end

  private

  def load_site
    @site = Site.find(params[:id])
  end

  def site_params
    params.fetch(:site, {}).permit(:path, :name, :repo, :notes)
  end
end
