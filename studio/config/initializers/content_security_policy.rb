# frozen_string_literal: true

# A strict policy with a per-request nonce. `javascript_importmap_tags` puts
# the nonce on the inline importmap and module scripts, so Turbo and Stimulus
# load; Turbo reads the same nonce from `csp_meta_tag` for its progress-bar
# style. Nothing else inline runs, and no `style=` attribute applies.
#
# `frame-src` admits the preview origin: a built docs site is shown in an
# iframe served from the OTHER loopback name (PreviewHost), so the theme's own
# localStorage never collides with the studio's. PreviewsController replaces
# this policy with the preview's own, looser one for the files it serves.
Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self
    policy.base_uri :self
    policy.connect_src :self
    policy.font_src :self, :data
    policy.form_action :self
    policy.frame_ancestors :none
    policy.frame_src :self, "http://localhost:*", "http://127.0.0.1:*"
    policy.img_src :self, :data
    policy.object_src :none
    policy.script_src :self
    policy.style_src :self
  end

  config.content_security_policy_nonce_generator = ->(_request) { SecureRandom.base64(16) }
  config.content_security_policy_nonce_directives = %w[script-src style-src]
end
