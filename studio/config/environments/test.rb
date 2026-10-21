# frozen_string_literal: true

# Tests run jobs inline (`perform_now` or perform_enqueued_jobs) and use the
# test cable adapter; the theme and the sites come from copies of the fixtures
# in test/fixtures, never from the real checkout.
Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = ENV["CI"].present?
  config.public_file_server.headers = { "cache-control" => "public, max-age=3600" }
  config.consider_all_requests_local = true
  config.cache_store = :null_store
  config.action_dispatch.show_exceptions = :rescuable
  config.action_controller.allow_forgery_protection = false
  config.active_support.deprecation = :stderr
  config.active_job.queue_adapter = :test
  config.action_controller.raise_on_missing_callback_actions = true
end
