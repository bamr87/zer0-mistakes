# frozen_string_literal: true

# File: sanitize_config_filter.rb
# Path: _plugins/sanitize_config_filter.rb
# Purpose: Liquid filter that masks sensitive key-value pairs in raw YAML
#          before the content is injected into the DOM. Used by the admin
#          config page to sanitize <pre id="cfg-full-yaml">.
#
# Masked patterns:
#   Key names: api_key, apikey, secret, password, token (case-insensitive)
#   Value prefix: phc_ (PostHog project API keys)

module Jekyll
  module SanitizeConfigFilter
    # Matches YAML lines whose key name is a common secret identifier.
    SENSITIVE_KEY_RE = /\A(\s*(?:api[_-]?key|secret|password|token)\s*:)/i.freeze
    # Matches PostHog project API key values anywhere on a line.
    PHC_VALUE_RE     = /phc_[A-Za-z0-9]+/.freeze

    def sanitize_config_yaml(input)
      return input unless input.is_a?(String)

      input.each_line.map do |line|
        if SENSITIVE_KEY_RE.match?(line)
          # Keep the key name and colon; replace everything after with [REDACTED]
          line.sub(/(:\s*).*$/, '\1[REDACTED]')
        elsif PHC_VALUE_RE.match?(line)
          line.gsub(PHC_VALUE_RE, '[REDACTED]')
        else
          line
        end
      end.join
    end
  end
end

Liquid::Template.register_filter(Jekyll::SanitizeConfigFilter)
