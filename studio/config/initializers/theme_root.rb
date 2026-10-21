# frozen_string_literal: true

# Say at boot where the theme is and whether it looks like one. The app still
# starts (and /up still answers) when it does not, so a misconfigured
# container reports the problem on every page instead of dying in a loop.
Rails.application.config.after_initialize do
  next if Rails.env.test?

  if ThemeRoot.valid?
    Rails.logger.info("zer0 studio: theme at #{ThemeRoot.path} (#{ThemeRoot.version || 'version unknown'})")
  else
    Rails.logger.warn("zer0 studio: #{ThemeRoot.path} is not a theme checkout — missing #{ThemeRoot.missing.join(', ')}; set THEME_DIR")
  end
end
