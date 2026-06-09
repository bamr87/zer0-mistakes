# frozen_string_literal: true

#
# File: config_sanitizer.rb
# Path: _plugins/config_sanitizer.rb
# Purpose: Liquid filter that masks sensitive YAML keys before DOM injection.
#
# Registered filter: sanitize_config
#
# Masks values for keys matching api_key, secret, password, token (case-insensitive)
# and any value starting with the PostHog phc_ prefix.
#
# Usage in templates:
#   {% capture raw_config %}{% include_relative _config.yml %}{% endcapture %}
#   {{ raw_config | sanitize_config }}
#

module Jekyll
  module ConfigSanitizerFilter
    SENSITIVE_KEY_RE = /\A(\s*(?:api[_-]?key|secret|password|token)\s*:)\s*.*/i
    PHC_RE           = /phc_[A-Za-z0-9_]+/

    def sanitize_config(input)
      safe = input.encode('UTF-8', invalid: :replace, undef: :replace, replace: '')
      safe.each_line.map do |line|
        if SENSITIVE_KEY_RE.match(line)
          "#{Regexp.last_match(1)} '[REDACTED]'\n"
        elsif PHC_RE.match(line)
          line.gsub(PHC_RE, '[REDACTED]')
        else
          line
        end
      end.join
    end
  end
end

Liquid::Template.register_filter(Jekyll::ConfigSanitizerFilter)
