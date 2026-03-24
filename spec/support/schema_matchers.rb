# frozen_string_literal: true

# =============================================================================
# Custom RSpec Matchers for Schema Validation
# =============================================================================

# Validates that a front matter hash conforms to a schema definition
RSpec::Matchers.define :validate_against_schema do |schema|
  match do |front_matter|
    @errors = []
    fields = schema.fetch("fields", [])

    fields.each do |field_def|
      name = field_def["name"]
      value = front_matter[name]
      required = field_def.fetch("required", false)

      if required && (value.nil? || (value.is_a?(String) && value.strip.empty?))
        @errors << "Missing required field '#{name}'"
        next
      end

      next if value.nil?

      if field_def["type"]
        type_err = check_type(name, value, field_def["type"])
        @errors << type_err if type_err
      end

      if field_def["enum"] && !field_def["enum"].map(&:to_s).include?(value.to_s)
        @errors << "Field '#{name}' value '#{value}' not in #{field_def['enum']}"
      end

      if field_def["max_length"] && value.is_a?(String) && value.length > field_def["max_length"]
        @errors << "Field '#{name}' exceeds max length #{field_def['max_length']}"
      end

      if field_def["pattern"] && value.is_a?(String)
        unless value.match?(Regexp.new(field_def["pattern"]))
          @errors << "Field '#{name}' does not match pattern '#{field_def['pattern']}'"
        end
      end
    end

    @errors.empty?
  end

  failure_message do
    "expected front matter to validate against schema, but got errors:\n  #{@errors.join("\n  ")}"
  end

  def check_type(name, value, expected)
    case expected
    when "string", "image"
      "Field '#{name}' expected string, got #{value.class}" unless value.is_a?(String)
    when "integer"
      "Field '#{name}' expected integer, got #{value.class}" unless value.is_a?(Integer)
    when "boolean"
      "Field '#{name}' expected boolean, got #{value.class}" unless [true, false].include?(value)
    when "date"
      "Field '#{name}' expected date, got #{value.class}" unless value.is_a?(Date) || value.is_a?(Time)
    when "array"
      "Field '#{name}' expected array, got #{value.class}" unless value.is_a?(Array)
    when "object"
      "Field '#{name}' expected object, got #{value.class}" unless value.is_a?(Hash)
    end
  end
end

# Checks that a schema has all expected required fields
RSpec::Matchers.define :have_required_fields do |*field_names|
  match do |schema|
    fields = schema.fetch("fields", [])
    required = fields.select { |f| f["required"] }.map { |f| f["name"] }
    @missing = field_names.flatten - required
    @missing.empty?
  end

  failure_message do
    "expected schema to require #{field_names}, but missing: #{@missing.join(', ')}"
  end
end

# Checks that a schema defines fields with valid types
RSpec::Matchers.define :have_valid_field_types do
  match do |schema|
    valid_types = %w[string integer boolean date array object image]
    fields = schema.fetch("fields", [])
    @invalid = fields.select { |f| f["type"] && !valid_types.include?(f["type"]) }
    @invalid.empty?
  end

  failure_message do
    names = @invalid.map { |f| "#{f['name']}:#{f['type']}" }.join(", ")
    "expected all field types to be valid, but found invalid: #{names}"
  end
end
