#!/usr/bin/env ruby
# frozen_string_literal: true

#
# @zer0-component
#   feature-id: ZER0-044
#   type: script
#   dependencies: []
#
# Bidirectional Reference Validator
# Enforces traceability between features/features.yml and @zer0-component headers.
#
# Validates:
#   1. Every file in features.yml references has @zer0-component header
#   2. Every @zer0-component header references a valid ZER0-XXX feature
#   3. Schema-fields in headers reference fields that exist in _data/schemas/
#   4. No circular dependencies between features
#
# Usage:
#   ruby scripts/validate-references.rb
#   ruby scripts/validate-references.rb --json   # JSON output for CI
#
# Exit codes:
#   0 = all valid
#   1 = validation errors found
#

require 'yaml'
require 'json'
require 'set'
require 'date'

FEATURES_FILE = 'features/features.yml'
SCHEMAS_DIR = '_data/schemas'
COMPONENT_HEADER_REGEX = /<!--\s*@zer0-component\s*\n(.*?)\n\s*-->/m
SCRIPT_HEADER_REGEX = /#\s*@zer0-component\s*\n((?:#\s{2,3}\S[^\n]*\n)*)/m

class ReferenceValidator
  attr_reader :errors, :warnings, :stats

  def initialize
    @errors = []
    @warnings = []
    @stats = { features: 0, files_with_headers: 0, schemas: 0, fields_validated: 0 }
  end

  def run
    features = load_features
    schemas = load_schemas
    headers = scan_component_headers

    @stats[:features] = features.size
    @stats[:files_with_headers] = headers.size
    @stats[:schemas] = schemas.size

    validate_features_to_headers(features, headers)
    validate_headers_to_features(headers, features)
    validate_schema_fields(headers, schemas)
    validate_dependencies(features)

    self
  end

  def success?
    @errors.empty?
  end

  def report_text
    lines = []
    lines << "=" * 60
    lines << "BIDIRECTIONAL REFERENCE VALIDATION REPORT"
    lines << "=" * 60
    lines << ""
    lines << "Stats:"
    lines << "  Features registered: #{@stats[:features]}"
    lines << "  Files with headers:  #{@stats[:files_with_headers]}"
    lines << "  Schemas loaded:      #{@stats[:schemas]}"
    lines << "  Fields validated:    #{@stats[:fields_validated]}"
    lines << ""

    if @errors.any?
      lines << "ERRORS (#{@errors.size}):"
      @errors.each { |e| lines << "  ✗ #{e}" }
      lines << ""
    end

    if @warnings.any?
      lines << "WARNINGS (#{@warnings.size}):"
      @warnings.each { |w| lines << "  ⚠ #{w}" }
      lines << ""
    end

    if success?
      lines << "✓ All cross-references are valid."
    else
      lines << "✗ #{@errors.size} error(s) found. Fix before merging."
    end

    lines.join("\n")
  end

  def report_json
    {
      success: success?,
      stats: @stats,
      errors: @errors,
      warnings: @warnings
    }.to_json
  end

  private

  def load_features
    return {} unless File.exist?(FEATURES_FILE)

    data = YAML.safe_load(File.read(FEATURES_FILE), permitted_classes: [Date, Time])
    return {} unless data.is_a?(Hash) && data['features']

    features = {}
    data['features'].each do |f|
      features[f['id']] = f if f['id']
    end
    features
  end

  def load_schemas
    schemas = {}
    return schemas unless File.directory?(SCHEMAS_DIR)

    Dir.glob(File.join(SCHEMAS_DIR, '*.yml')).each do |path|
      data = YAML.safe_load(File.read(path), permitted_classes: [Date, Time])
      next unless data.is_a?(Hash) && data['collection']

      field_names = (data['fields'] || []).map { |f| f['name'] }.compact.to_set
      schemas[data['collection']] = field_names
    end
    schemas
  end

  def scan_component_headers
    headers = {}
    files = Dir.glob('{_layouts,_includes}/**/*.html') +
            Dir.glob('_plugins/**/*.rb') +
            Dir.glob('scripts/**/*.{rb,sh}') +
            Dir.glob('scripts/bin/*') +
            Dir.glob('scripts/features/*')

    files.each do |path|
      content = File.read(path)

      # Try HTML comment style
      match = content.match(COMPONENT_HEADER_REGEX)
      # Try script comment style
      match ||= content.match(SCRIPT_HEADER_REGEX)

      next unless match

      raw = match[1]
      # Strip leading '#' and up to 3 spaces for script-style headers
      if path.end_with?('.rb', '.sh') || !path.include?('.')
        raw = raw.gsub(/^#\s{0,3}/, '')
      end

      begin
        header = YAML.safe_load(raw)
        headers[path] = header if header.is_a?(Hash)
      rescue Psych::SyntaxError
        @warnings << "#{path}: Could not parse @zer0-component YAML"
      end
    end
    headers
  end

  def validate_features_to_headers(features, headers)
    header_feature_ids = headers.values.map { |h| h['feature-id'] }.compact.to_set

    features.each do |id, feature|
      refs = feature['references'] || {}
      ref_files = extract_ref_files(refs)

      ref_files.each do |ref_path|
        next unless File.exist?(ref_path)
        next if ref_path.end_with?('.yml', '.json', '.css', '.scss')

        unless headers.key?(ref_path)
          @warnings << "#{id}: Referenced file '#{ref_path}' has no @zer0-component header"
        end
      end
    end
  end

  def validate_headers_to_features(headers, features)
    headers.each do |path, header|
      feature_id = header['feature-id']
      next unless feature_id

      unless features.key?(feature_id)
        @errors << "#{path}: @zer0-component references unknown feature '#{feature_id}'"
      end
    end
  end

  def validate_schema_fields(headers, schemas)
    all_field_names = schemas.values.reduce(Set.new) { |acc, fields| acc | fields }

    headers.each do |path, header|
      schema_fields = header['schema-fields']
      next unless schema_fields.is_a?(Array)

      schema_fields.each do |field|
        @stats[:fields_validated] += 1
        # Strip nested notation (e.g., "sidebar.nav" -> "sidebar")
        root_field = field.to_s.split('.').first
        unless all_field_names.include?(root_field)
          @warnings << "#{path}: schema-field '#{field}' not found in any schema"
        end
      end
    end
  end

  def validate_dependencies(features)
    # Build dependency graph and check for cycles
    graph = {}
    features.each do |id, feature|
      deps = feature.dig('references', 'dependencies') || []
      graph[id] = deps.is_a?(Array) ? deps : [deps]
    end

    graph.each do |id, deps|
      deps.each do |dep|
        unless features.key?(dep)
          @errors << "#{id}: Depends on unknown feature '#{dep}'"
        end
      end
    end

    # Simple cycle detection via DFS
    visited = Set.new
    in_stack = Set.new

    detect_cycle = lambda do |node, path|
      return if visited.include?(node)

      if in_stack.include?(node)
        cycle = path[path.index(node)..] + [node]
        @errors << "Circular dependency detected: #{cycle.join(' → ')}"
        return
      end

      in_stack.add(node)
      (graph[node] || []).each { |dep| detect_cycle.call(dep, path + [node]) }
      in_stack.delete(node)
      visited.add(node)
    end

    graph.keys.each { |node| detect_cycle.call(node, []) }
  end

  def extract_ref_files(refs)
    files = []
    refs.each do |_key, value|
      case value
      when String
        files << value
      when Array
        value.each { |v| files << v.to_s if v.is_a?(String) }
      end
    end
    files
  end
end

# Main execution
validator = ReferenceValidator.new.run

if ARGV.include?('--json')
  puts validator.report_json
else
  puts validator.report_text
end

exit(validator.success? ? 0 : 1)
