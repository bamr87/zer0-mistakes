# frozen_string_literal: true

require "yaml"
require "date"
require "json"
require "fileutils"

# =============================================================================
# RSpec Configuration for Zer0-Mistakes Jekyll Theme
# Feature: ZER0-044 (Schema System), ZER0-014 (Collections)
# =============================================================================

RSpec.configure do |config|
  # Use expect syntax exclusively
  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
    expectations.syntax = :expect
  end

  config.mock_with :rspec do |mocks|
    mocks.verify_partial_doubles = true
  end

  config.shared_context_metadata_behavior = :apply_to_host_groups
  config.filter_run_when_matching :focus
  config.disable_monkey_patching!
  config.warnings = true

  config.default_formatter = "doc" if config.files_to_run.one?

  config.order = :random
  Kernel.srand config.seed

  # ---------------------------------------------------------------------------
  # Project paths
  # ---------------------------------------------------------------------------
  config.add_setting :project_root
  config.project_root = File.expand_path("..", __dir__)

  config.add_setting :schemas_dir
  config.schemas_dir = File.join(config.project_root, "_data", "schemas")

  config.add_setting :features_file
  config.features_file = File.join(config.project_root, "features", "features.yml")

  config.add_setting :layouts_dir
  config.layouts_dir = File.join(config.project_root, "_layouts")

  config.add_setting :includes_dir
  config.includes_dir = File.join(config.project_root, "_includes")

  config.add_setting :plugins_dir
  config.plugins_dir = File.join(config.project_root, "_plugins")

  config.add_setting :config_file
  config.config_file = File.join(config.project_root, "_config.yml")

  config.add_setting :config_dev_file
  config.config_dev_file = File.join(config.project_root, "_config_dev.yml")

  config.add_setting :pages_dir
  config.pages_dir = File.join(config.project_root, "pages")
end

# Load all support files
Dir[File.join(__dir__, "support", "**", "*.rb")].sort.each { |f| require f }
