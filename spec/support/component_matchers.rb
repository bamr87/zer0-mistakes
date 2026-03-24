# frozen_string_literal: true

# =============================================================================
# Custom RSpec Matchers for Component Headers & Feature References
# =============================================================================

# Checks that a file contains a @zer0-component header
RSpec::Matchers.define :have_component_header do
  match do |file_path|
    File.read(file_path).include?("@zer0-component")
  end

  failure_message do |file_path|
    "expected #{File.basename(file_path)} to have a @zer0-component header"
  end
end

# Checks that a component header references a valid ZER0-XXX feature ID
RSpec::Matchers.define :reference_valid_feature do |valid_ids|
  match do |file_path|
    content = File.read(file_path)
    return true unless content.include?("@zer0-component")

    # Extract feature-id from header
    if content =~ /feature-id:\s*(ZER0-\d{3})/
      @feature_id = Regexp.last_match(1)
      valid_ids.include?(@feature_id)
    else
      @feature_id = nil
      false
    end
  end

  failure_message do |file_path|
    if @feature_id
      "expected #{File.basename(file_path)} feature-id '#{@feature_id}' to be in valid IDs"
    else
      "expected #{File.basename(file_path)} to have a feature-id in its @zer0-component header"
    end
  end
end

# Checks that content has balanced Liquid template tags
RSpec::Matchers.define :have_balanced_liquid_tags do
  match do |content|
    @unbalanced = []
    %w[if unless for case comment capture highlight].each do |tag|
      opens = content.scan(/\{%[-\s]*#{tag}\b/).count
      closes = content.scan(/\{%[-\s]*end#{tag}\s*[-]?%\}/).count
      if opens != closes
        @unbalanced << "#{tag}: #{opens} opens vs #{closes} closes"
      end
    end
    @unbalanced.empty?
  end

  failure_message do
    "expected balanced Liquid tags, but found:\n  #{@unbalanced.join("\n  ")}"
  end
end

# Checks that a YAML file is syntactically valid
RSpec::Matchers.define :be_valid_yaml do
  match do |file_path|
    YAML.safe_load_file(file_path, permitted_classes: [Date, Time], aliases: true)
    true
  rescue Psych::SyntaxError => e
    @error = e.message
    false
  end

  failure_message do |file_path|
    "expected #{file_path} to be valid YAML, but got: #{@error}"
  end
end
