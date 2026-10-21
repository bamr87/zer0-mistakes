# frozen_string_literal: true

# Production is the Docker image (studio/Dockerfile): one Puma with Solid
# Queue inside it, SQLite under storage/, plain HTTP on a loopback-published
# port. No TLS assumption, no CDN, no mailer.
require "active_support/core_ext/integer/time"

Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = true
  config.consider_all_requests_local = false
  config.action_controller.perform_caching = true

  config.public_file_server.headers = { "cache-control" => "public, max-age=#{1.year.to_i}" }

  # The port is published on 127.0.0.1 and reached over plain HTTP; a reverse
  # proxy that terminates TLS can set STUDIO_ASSUME_SSL=1.
  config.assume_ssl = ENV["STUDIO_ASSUME_SSL"] == "1"
  config.force_ssl = false

  config.log_tags = [ :request_id ]
  config.logger = ActiveSupport::TaggedLogging.logger(STDOUT)
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")
  config.silence_healthcheck_path = "/up"
  config.active_support.report_deprecations = false

  config.cache_store = :memory_store

  config.active_job.queue_adapter = :solid_queue
  config.solid_queue.connects_to = { database: { writing: :queue } }

  config.i18n.fallbacks = true
  config.active_record.dump_schema_after_migration = false
  config.active_record.attributes_for_inspect = [ :id ]
end
