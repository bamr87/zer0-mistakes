# frozen_string_literal: true

#
# @zer0-component
#   feature-id: ZER0-044
#   type: plugin
#   dependencies: []
#   schema-fields: []
#   styles: []
#
# File: schema_validator.rb
# Path: _plugins/schema_validator.rb
# Purpose: Validates content front matter against schemas in _data/schemas/
#
# Configuration in _config.yml:
#   schema_validation: strict   # strict | warn | off
#
# Schemas are loaded from _data/schemas/<collection>.yml
# Each schema defines required fields, types, enums, patterns, and max lengths.
#

module Jekyll
  class SchemaValidator < Generator
    safe true
    priority :low

    VALID_TYPES = %w[string integer boolean date array object image].freeze

    def generate(site)
      mode = site.config.fetch('schema_validation', 'warn')
      return if mode == 'off'

      schemas = load_schemas(site)
      return if schemas.empty?

      errors = []
      warnings = []

      site.collections.each do |name, collection|
        schema = schemas[name]
        next unless schema

        collection.docs.each do |doc|
          doc_errors = validate_document(doc, schema)
          doc_errors.each do |err|
            msg = "#{relative_path(doc)}: #{err}"
            if mode == 'strict'
              errors << msg
            else
              warnings << msg
            end
          end
        end
      end

      warnings.each { |w| Jekyll.logger.warn "Schema Warning:", w }
      errors.each { |e| Jekyll.logger.error "Schema Error:", e }

      if errors.any?
        raise Jekyll::Errors::FatalException,
              "Schema validation failed with #{errors.size} error(s). " \
              "Set schema_validation: warn in _config.yml to downgrade to warnings."
      end

      if warnings.empty? && errors.empty?
        Jekyll.logger.info "Schema Validation:", "All content validates against schemas"
      end
    end

    private

    def load_schemas(site)
      schemas = {}
      schema_dir = File.join(site.source, '_data', 'schemas')
      return schemas unless File.directory?(schema_dir)

      Dir.glob(File.join(schema_dir, '*.yml')).each do |path|
        data = YAML.safe_load_file(path, permitted_classes: [Date, Time])
        next unless data.is_a?(Hash) && data['collection']

        schemas[data['collection']] = data
      end

      schemas
    end

    def validate_document(doc, schema)
      errors = []
      fields = schema.fetch('fields', [])
      front_matter = doc.data

      fields.each do |field_def|
        name = field_def['name']
        value = front_matter[name]
        required = field_def.fetch('required', false)

        # Check required fields
        if required && (value.nil? || (value.is_a?(String) && value.strip.empty?))
          errors << "Missing required field '#{name}'"
          next
        end

        next if value.nil?

        # Type validation
        type_error = validate_type(name, value, field_def['type'])
        errors << type_error if type_error

        # Enum validation
        if field_def['enum'] && !field_def['enum'].map(&:to_s).include?(value.to_s)
          errors << "Field '#{name}' value '#{value}' not in allowed values: #{field_def['enum'].join(', ')}"
        end

        # Max length validation
        if field_def['max_length'] && value.is_a?(String) && value.length > field_def['max_length']
          errors << "Field '#{name}' exceeds max length #{field_def['max_length']} (got #{value.length})"
        end

        # Pattern validation
        if field_def['pattern'] && value.is_a?(String)
          unless value.match?(Regexp.new(field_def['pattern']))
            errors << "Field '#{name}' value '#{value}' does not match pattern '#{field_def['pattern']}'"
          end
        end
      end

      errors
    end

    def validate_type(name, value, expected_type)
      return nil unless expected_type

      case expected_type
      when 'string', 'image'
        return "Field '#{name}' expected string, got #{value.class}" unless value.is_a?(String)
      when 'integer'
        return "Field '#{name}' expected integer, got #{value.class}" unless value.is_a?(Integer)
      when 'boolean'
        return "Field '#{name}' expected boolean, got #{value.class}" unless [true, false].include?(value)
      when 'date'
        unless value.is_a?(Date) || value.is_a?(Time)
          return "Field '#{name}' expected date, got #{value.class}"
        end
      when 'array'
        return "Field '#{name}' expected array, got #{value.class}" unless value.is_a?(Array)
      when 'object'
        unless value.is_a?(Hash)
          return "Field '#{name}' expected object/hash, got #{value.class}"
        end
      end
      nil
    end

    def relative_path(doc)
      doc.relative_path || doc.path
    end
  end
end
