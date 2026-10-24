# frozen_string_literal: true

# Every page: loopback-or-password access, the editor error mapping, and the
# theme check — a studio pointed at a directory that is not a theme checkout
# answers 503 on every page (and 200 on /up) until THEME_DIR is right.
class ApplicationController < ActionController::Base
  include AccessGuard
  include EditorErrors

  allow_browser versions: :modern
  before_action :require_theme

  helper_method :theme_version, :active_jobs_count

  private

  def require_theme
    return if ThemeRoot.valid?

    render "shared/no_theme", status: :service_unavailable
  end

  def theme_version
    ThemeRoot.version
  end

  def active_jobs_count
    Job.active.count
  end
end
