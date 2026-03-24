# frozen_string_literal: true

# =============================================================================
# Jekyll Test Helpers
# Utilities for loading Jekyll config, building test sites, and fixture mgmt
# =============================================================================

module JekyllHelper
  # Load and parse a YAML file safely
  def load_yaml(path)
    YAML.safe_load_file(path, permitted_classes: [Date, Time], aliases: true)
  rescue Psych::SyntaxError => e
    raise "Invalid YAML in #{path}: #{e.message}"
  end

  # Load the production Jekyll config
  def jekyll_config
    @jekyll_config ||= load_yaml(RSpec.configuration.config_file)
  end

  # Load the development Jekyll config
  def jekyll_dev_config
    @jekyll_dev_config ||= load_yaml(RSpec.configuration.config_dev_file)
  end

  # Load all schema definitions from _data/schemas/
  def load_schemas
    @schemas ||= begin
      schemas = {}
      Dir.glob(File.join(RSpec.configuration.schemas_dir, "*.yml")).each do |path|
        data = load_yaml(path)
        next unless data.is_a?(Hash) && data["collection"]
        schemas[data["collection"]] = data
      end
      schemas
    end
  end

  # Load the features registry
  def load_features
    @features ||= begin
      data = load_yaml(RSpec.configuration.features_file)
      data["features"] || []
    end
  end

  # List all content files for a given collection
  def collection_files(collection_name)
    pages_dir = RSpec.configuration.pages_dir
    collection_dir = File.join(pages_dir, "_#{collection_name}")
    return [] unless File.directory?(collection_dir)

    Dir.glob(File.join(collection_dir, "**", "*.{md,markdown,html}"))
  end

  # Parse front matter from a content file
  def parse_front_matter(file_path)
    content = File.read(file_path)
    if content =~ /\A---\s*\n(.*?\n?)^---\s*$/m
      YAML.safe_load(Regexp.last_match(1), permitted_classes: [Date, Time]) || {}
    else
      {}
    end
  rescue Psych::SyntaxError
    {}
  end

  # Get all layout files
  def layout_files
    Dir.glob(File.join(RSpec.configuration.layouts_dir, "*.html"))
  end

  # Get all include files (recursive)
  def include_files
    Dir.glob(File.join(RSpec.configuration.includes_dir, "**", "*.html"))
  end

  # Get all plugin files
  def plugin_files
    Dir.glob(File.join(RSpec.configuration.plugins_dir, "*.rb"))
  end

  # Read file content
  def read_file(path)
    File.read(path)
  end

  # Check if a file has a @zer0-component header
  def has_component_header?(file_path)
    content = File.read(file_path)
    content.include?("@zer0-component")
  end

  # Extract @zer0-component header fields from a file
  def extract_component_header(file_path)
    content = File.read(file_path)
    return nil unless content.include?("@zer0-component")

    header = {}
    in_header = false

    content.each_line do |line|
      if line.include?("@zer0-component")
        in_header = true
        next
      end

      if in_header
        # Stop at blank comment line or non-comment line
        break if line.strip.empty? || (!line.strip.start_with?("#", "<!--", "*", "//"))

        # Strip comment markers
        cleaned = line.gsub(/^\s*[#*\/]+\s?/, "").strip
        cleaned = cleaned.gsub(/<!--\s*/, "").gsub(/\s*-->/, "").strip

        if cleaned =~ /^(\S[\w-]+):\s*(.+)$/
          key = Regexp.last_match(1)
          value = Regexp.last_match(2).strip
          # Parse array values like [item1, item2]
          if value.start_with?("[") && value.end_with?("]")
            value = value[1..-2].split(",").map(&:strip).reject(&:empty?)
          end
          header[key] = value
        end
      end
    end

    header.empty? ? nil : header
  end
end

RSpec.configure do |config|
  config.include JekyllHelper
end
