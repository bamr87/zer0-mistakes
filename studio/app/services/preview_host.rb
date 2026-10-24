# frozen_string_literal: true

# Where the preview iframe loads from. On a loopback request it is the OTHER
# loopback name on the same port (localhost ↔ 127.0.0.1), so the iframe is
# cross-origin: the theme's colour-mode and appearance scripts keep their
# localStorage apart from the studio's, and the studio's CSP applies to the
# studio alone. Reached by any other host name, the preview shares the
# studio's origin. With a password set, the iframe URL carries a short-lived
# signed token, because a browser does not send Basic credentials into a
# cross-origin frame.
module PreviewHost
  TOKEN_TTL = 2.hours

  module_function

  def origin_for(request)
    other = { "localhost" => "127.0.0.1", "127.0.0.1" => "localhost" }[request.host]
    return request.base_url unless other

    "#{request.protocol}#{other}#{request.port_string}"
  end

  def url_for(request, build_id)
    url = "#{origin_for(request)}/preview/#{build_id}/"
    url += "?token=#{token_for(build_id)}" if password_mode?
    url
  end

  def password_mode?
    ENV["STUDIO_PASSWORD"].present?
  end

  def token_for(build_id)
    verifier.generate(build_id.to_s, expires_in: TOKEN_TTL, purpose: :preview)
  end

  def valid_token?(token, build_id)
    verifier.verified(token.to_s, purpose: :preview) == build_id.to_s
  end

  def verifier
    Rails.application.message_verifier("studio-preview")
  end
end
