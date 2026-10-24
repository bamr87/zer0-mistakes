# frozen_string_literal: true

# Host authorization: the two loopback names (the preview iframe uses whichever
# one the page is not on), anything STUDIO_HOSTS lists, and Rails' own test
# host. An unknown Host header is refused outright; /up is exempt so a
# container health check never depends on how it addresses the app.
hosts = %w[localhost 127.0.0.1 [::1]] + ENV["STUDIO_HOSTS"].to_s.split(",").map(&:strip).reject(&:empty?)
hosts << "www.example.com" if Rails.env.test?

Rails.application.config.hosts = hosts
Rails.application.config.host_authorization = { exclude: ->(request) { request.path == "/up" } }
