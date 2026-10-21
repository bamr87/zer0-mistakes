# frozen_string_literal: true

# Serves a built preview's files for the iframe. Every path is confined to
# the build directory; X-Frame-Options is dropped and the theme's pages get a
# preview-only CSP (they carry inline scripts and one CDN page of their own).
# Access is loopback, or — in password mode, where a browser sends no Basic
# credentials into a cross-origin frame — a signed, expiring token.
class PreviewsController < ActionController::Base
  PREVIEW_CSP = [
    "default-src 'self' data:",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https:",
    "connect-src 'self'",
    "frame-ancestors http://localhost:* http://127.0.0.1:* 'self'"
  ].join("; ").freeze

  before_action :guard

  def show
    dir = PreviewBuilder.dir_for(params[:build_id]) or return head(:not_found)
    rel = params[:path].to_s.delete_suffix("/")
    confined = ConfinedPath.new(dir)
    # A directory request, with or without the trailing slash, is its index.
    rel = [ rel, "index.html" ].reject(&:empty?).join("/") if rel.empty? || confined.directory?(rel)
    real = confined.file!(rel)

    response.headers.delete("X-Frame-Options")
    response.headers["Content-Security-Policy"] = PREVIEW_CSP
    response.headers["Cache-Control"] = "no-store"
    send_file real, type: Rack::Mime.mime_type(File.extname(real.to_s), "application/octet-stream"), disposition: "inline"
  rescue ConfinedPath::NotFound
    head :not_found
  rescue ConfinedPath::Refused
    head :unprocessable_content
  end

  private

  def guard
    if PreviewHost.password_mode?
      head :forbidden unless PreviewHost.valid_token?(params[:token], params[:build_id])
    else
      head :forbidden unless LocalNetwork.local_request?(request)
    end
  end
end
