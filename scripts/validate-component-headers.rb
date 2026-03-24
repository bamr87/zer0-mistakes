#!/usr/bin/env ruby
# frozen_string_literal: true

#
# @zer0-component
#   feature-id: ZER0-044
#   type: script
#   dependencies: []
#
# Validates @zer0-component headers in layout and include files.
# Used by pre-commit hooks and CI pipeline.
#
# Usage:
#   ruby scripts/validate-component-headers.rb _layouts/default.html _includes/core/head.html
#   ruby scripts/validate-component-headers.rb --all
#

require 'yaml'

# HTML comment format: <!-- @zer0-component ... -->
HTML_HEADER_REGEX = /<!--\s*@zer0-component\s*\n(.*?)\n\s*-->/m
# Hash comment format: # @zer0-component ... (for .sh, .rb files)
HASH_HEADER_REGEX = /^#\s*@zer0-component\s*\n((?:#\s{2,3}\S[^\n]*\n)*)/m

REQUIRED_KEYS = %w[feature-id type].freeze
VALID_TYPES = %w[layout include plugin script].freeze

def extract_header(content)
  # Try HTML format first
  match = content.match(HTML_HEADER_REGEX)
  return match[1] if match

  # Try hash-comment format
  match = content.match(HASH_HEADER_REGEX)
  if match
    # Strip leading '# ' from each line
    return match[1].gsub(/^#\s{0,3}/, '')
  end

  nil
end

def validate_file(path)
  content = File.read(path)
  errors = []

  raw_yaml = extract_header(content)
  unless raw_yaml
    errors << "#{path}: Missing @zer0-component header"
    return errors
  end

  begin
    header = YAML.safe_load(raw_yaml)
  rescue Psych::SyntaxError => e
    errors << "#{path}: Invalid YAML in @zer0-component header: #{e.message}"
    return errors
  end

  unless header.is_a?(Hash)
    errors << "#{path}: @zer0-component header must be a YAML mapping"
    return errors
  end

  REQUIRED_KEYS.each do |key|
    errors << "#{path}: Missing required key '#{key}' in @zer0-component header" unless header[key]
  end

  if header['feature-id'] && !header['feature-id'].to_s.match?(/^ZER0-\d{3}$/)
    errors << "#{path}: Invalid feature-id format '#{header['feature-id']}' (expected ZER0-XXX)"
  end

  if header['type'] && !VALID_TYPES.include?(header['type'])
    errors << "#{path}: Invalid type '#{header['type']}' (expected: #{VALID_TYPES.join(', ')})"
  end

  errors
end

def scan_all
  files = Dir.glob('_layouts/**/*.html') +
          Dir.glob('_includes/**/*.html') +
          Dir.glob('scripts/**/*.sh') +
          Dir.glob('scripts/**/*.rb') +
          Dir.glob('_plugins/**/*.rb')
  files
end

# Main execution
files = if ARGV.include?('--all')
          scan_all
        elsif ARGV.empty?
          $stderr.puts "Usage: #{$PROGRAM_NAME} [--all | file1.html file2.html ...]"
          exit 1
        else
          ARGV.reject { |a| a.start_with?('-') }
        end

all_errors = []
files.each do |f|
  next unless File.exist?(f)

  all_errors.concat(validate_file(f))
end

if all_errors.any?
  all_errors.each { |e| $stderr.puts "\e[31m✗ #{e}\e[0m" }
  $stderr.puts "\n#{all_errors.size} component header error(s) found."
  exit 1
else
  puts "✓ All #{files.size} component headers valid."
  exit 0
end
