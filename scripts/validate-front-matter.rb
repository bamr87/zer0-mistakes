#!/usr/bin/env ruby
# frozen_string_literal: true

#
# @zer0-component
#   feature-id: ZER0-044
#   type: script
#   dependencies: []
#
# Validates content front matter against schemas in _data/schemas/.
# Used by pre-commit hooks for fast local feedback.
#
# Usage:
#   ruby scripts/validate-front-matter.rb pages/_posts/2025-01-01-my-post.md
#   ruby scripts/validate-front-matter.rb --all
#

require 'yaml'

SCHEMAS_DIR = '_data/schemas'

# Map file paths to collection names
def collection_for_path(path)
  case path
  when %r{pages/_posts/}    then 'posts'
  when %r{pages/_docs/}     then 'docs'
  when %r{pages/_notes/}    then 'notes'
  when %r{pages/_notebooks/} then 'notebooks'
  when %r{pages/_quests/}   then 'quests'
  when %r{pages/_about/}    then 'pages'
  when %r{pages/_quickstart/} then 'pages'
  when %r{pages/}           then 'pages'
  else nil
  end
end

def load_schemas
  schemas = {}
  Dir.glob(File.join(SCHEMAS_DIR, '*.yml')).each do |path|
    data = YAML.safe_load_file(path, permitted_classes: [Date, Time])
    next unless data.is_a?(Hash) && data['collection']

    schemas[data['collection']] = data
  end
  schemas
end

def extract_front_matter(path)
  content = File.read(path)
  match = content.match(/\A---\s*\n(.*?)\n---/m)
  return nil unless match

  YAML.safe_load(match[1], permitted_classes: [Date, Time])
rescue Psych::SyntaxError => e
  $stderr.puts "#{path}: Invalid YAML in front matter: #{e.message}"
  nil
end

def validate_document(path, front_matter, schema)
  errors = []
  fields = schema.fetch('fields', [])

  fields.each do |field_def|
    name = field_def['name']
    value = front_matter[name]
    required = field_def.fetch('required', false)

    if required && (value.nil? || (value.is_a?(String) && value.strip.empty?))
      errors << "#{path}: Missing required field '#{name}'"
      next
    end

    next if value.nil?

    # Enum validation
    if field_def['enum'] && !field_def['enum'].map(&:to_s).include?(value.to_s)
      errors << "#{path}: Field '#{name}' value '#{value}' not in: #{field_def['enum'].join(', ')}"
    end

    # Max length
    if field_def['max_length'] && value.is_a?(String) && value.length > field_def['max_length']
      errors << "#{path}: Field '#{name}' exceeds max length #{field_def['max_length']}"
    end
  end

  errors
end

# Main
schemas = load_schemas

files = if ARGV.include?('--all')
          Dir.glob('pages/**/*.{md,markdown,html}')
        else
          ARGV.reject { |a| a.start_with?('-') }
        end

all_errors = []
checked = 0

files.each do |path|
  next unless File.exist?(path)

  collection = collection_for_path(path)
  schema = schemas[collection]
  next unless schema

  front_matter = extract_front_matter(path)
  next unless front_matter

  checked += 1
  all_errors.concat(validate_document(path, front_matter, schema))
end

if all_errors.any?
  all_errors.each { |e| $stderr.puts "\e[31m✗ #{e}\e[0m" }
  $stderr.puts "\n#{all_errors.size} front matter error(s) in #{checked} files."
  exit 1
else
  puts "✓ #{checked} files validate against schemas."
  exit 0
end
