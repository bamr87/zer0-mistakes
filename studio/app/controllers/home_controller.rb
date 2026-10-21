# frozen_string_literal: true

# The dashboard: the theme's version and lockstep, the latest doctor pass,
# the skins, registered sites, recent jobs and the newest previews.
class HomeController < ApplicationController
  def index
    @versions = VersionFiles.read
    @doctor = Job.latest("theme_doctor")
    @skins = SkinEditor.names
    @default_skin = SkinEditor.default
    @sites = Site.named.limit(8)
    @jobs = Job.recent.limit(8)
    @builds = PreviewBuilder.builds.first(3)
  end
end
