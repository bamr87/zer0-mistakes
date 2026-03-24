#!/usr/bin/env ruby
# frozen_string_literal: true

#
# @zer0-component
#   feature-id: ZER0-044
#   type: script
#   dependencies: []
#
# Validates that feature IDs in code match the ZER0-XXX format
# and reference valid entries in features/features.yml.
#
# Usage:
#   ruby scripts/validate-feature-ids.rb _layouts/default.html
#   ruby scripts/validate-feature-ids.rb --all
#

require 'yaml'
require 'set'

FEATURES_FILE = 'features/features.yml'
FEATURE_ID_REGEX = /ZER0-\d{3}/

def load_valid_ids
  return Set.new unless File.exist?(FEATURES_FILE)

  data = YAML.safe_load_file(FEATURES_FILE, permitted_classes: [Date, Time])
  return Set.new unless data.is_a?(Hash) && data['features']

  data['features'].map { |f| f['id'] }.compact.to_set
end

def extract_feature_ids(path)
  content = File.read(path)
  content.scan(FEATURE_ID_REGEX).uniq
end

# Main
valid_ids = load_valid_ids

files = if ARGV.include?('--all')
          Dir.glob('{_layouts,_includes,_plugins,scripts}/**/*.{html,rb,sh}') +
            Dir.glob('_data/schemas/*.yml')
        else
          ARGV.reject { |a| a.start_with?('-') }
        end

all_errors = []

files.each do |path|
  next unless File.exist?(path)

  ids = extract_feature_ids(path)
  ids.each do |id|
    unless valid_ids.include?(id)
      all_errors << "#{path}: References unknown feature ID '#{id}'"
    end
  end
end

if all_errors.any?
  all_errors.each { |e| $stderr.puts "\e[31m✗ #{e}\e[0m" }
  $stderr.puts "\n#{all_errors.size} invalid feature ID reference(s)."
  exit 1
else
  puts "✓ All feature ID references are valid."
  exit 0
end
