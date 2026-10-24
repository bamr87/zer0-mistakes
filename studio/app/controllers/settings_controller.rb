# frozen_string_literal: true

# What the studio was started with: paths, access mode, where previews go.
# Values only, never a secret.
class SettingsController < ApplicationController
  def show
    @rows = [
      [ "Theme", ThemeRoot.path.to_s ],
      [ "Theme version", ThemeRoot.version ],
      [ "Sites directory (SITES_DIR)", SitesRoot.path.to_s ],
      [ "Access", ENV["STUDIO_PASSWORD"].present? ? "password (user #{ENV['STUDIO_USER'].presence || 'zer0'})" : "this machine only" ],
      [ "Docker gateway trusted", ENV["STUDIO_TRUST_DOCKER_GATEWAY"] == "1" ? "yes" : "no" ],
      [ "Extra hosts (STUDIO_HOSTS)", ENV["STUDIO_HOSTS"].presence || "—" ],
      [ "Previews", PreviewBuilder.dir.to_s ],
      [ "Theme bundle path", ENV["THEME_BUNDLE_PATH"].presence || "(the studio's own BUNDLE_PATH)" ],
      [ "Jobs", ENV["SOLID_QUEUE_IN_PUMA"].present? ? "Solid Queue inside Puma" : "Solid Queue (separate worker expected)" ]
    ]
  end
end
