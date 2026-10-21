# frozen_string_literal: true

# Who may use the studio: with STUDIO_PASSWORD set, anyone who passes HTTP
# basic auth; without it, only requests from this machine (LocalNetwork).
#
# Copied from zer0-CMS, with the studio's variable names.
module AccessGuard
  extend ActiveSupport::Concern

  included do
    before_action :guard_access
  end

  private

  def guard_access
    password = ENV["STUDIO_PASSWORD"].to_s
    if password.empty?
      refuse_remote unless LocalNetwork.local_request?(request)
    else
      # Compose passes an unset variable through as "", which means the default.
      user = ENV["STUDIO_USER"].presence || "zer0"
      authenticate_or_request_with_http_basic("zer0 studio") do |given_user, given_password|
        user_ok = ActiveSupport::SecurityUtils.secure_compare(given_user.to_s, user)
        password_ok = ActiveSupport::SecurityUtils.secure_compare(given_password.to_s, password)
        user_ok & password_ok
      end
    end
  end

  def refuse_remote
    render plain: "zer0 studio answers requests from this machine only. Set STUDIO_PASSWORD to allow other clients.\n",
           status: :forbidden
  end
end
