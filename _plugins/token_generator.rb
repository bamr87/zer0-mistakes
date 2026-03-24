# frozen_string_literal: true

# @zer0-component
#   feature-id: ZER0-045
#   type: plugin
#   dependencies: [_data/tokens/colors.yml, _data/tokens/typography.yml, _data/tokens/spacing.yml, _data/tokens/components.yml]
#
# File: token_generator.rb
# Path: _plugins/token_generator.rb
# Purpose: Generates SCSS variables and CSS custom properties from design token YAML files
#
# NOTE: The github-pages gem runs in safe mode which blocks custom plugins.
# For local builds, use `scripts/generate-tokens.rb` to regenerate tokens.
# The generated file _sass/generated/_tokens.scss is committed to version control.
#
# This plugin serves as a convenience for non-github-pages builds only.

require "yaml"
require "fileutils"

module Jekyll
  class TokenGenerator < Generator
    safe true
    priority :highest

    TOKENS_DIR = "_data/tokens"
    OUTPUT_DIR = "_sass/generated"
    OUTPUT_FILE = "_tokens.scss"

    def generate(site)
      tokens_path = File.join(site.source, TOKENS_DIR)
      return unless File.directory?(tokens_path)

      token_files = Dir.glob(File.join(tokens_path, "*.yml")).reject { |f| File.basename(f).start_with?("_") }
      return if token_files.empty?

      output_dir = File.join(site.source, OUTPUT_DIR)
      FileUtils.mkdir_p(output_dir)

      scss_content = TokenScssBuilder.build(token_files)
      output_path = File.join(output_dir, OUTPUT_FILE)

      existing = File.exist?(output_path) ? File.read(output_path) : ""
      if existing != scss_content
        File.write(output_path, scss_content)
        Jekyll.logger.info "TokenGenerator:", "Generated #{OUTPUT_DIR}/#{OUTPUT_FILE}"
      end
    end
  end

  # Shared builder used by both the plugin and the standalone script
  module TokenScssBuilder
    def self.build(token_files)
      lines = []
      lines << "// ============================================================================="
      lines << "// AUTO-GENERATED — DO NOT EDIT"
      lines << "// Generated from _data/tokens/*.yml"
      lines << "// Regenerate: ruby scripts/generate-tokens.rb"
      lines << "// ============================================================================="
      lines << ""

      dark_tokens = []

      token_files.sort.each do |file|
        data = YAML.safe_load(File.read(file), permitted_classes: [Date]) || {}
        tokens = data["tokens"]
        next unless tokens.is_a?(Array)

        basename = File.basename(file, ".yml")
        lines << "// --- #{basename} ---"
        lines << ""

        tokens.each do |token|
          name = token["name"]
          value = token["value"]
          next unless name && value

          lines << "$zer0-#{name}: #{value} !default;"

          if token["dark"]
            dark_tokens << { name: name, dark_value: token["dark"] }
          end
        end

        lines << ""
      end

      # CSS custom properties
      lines << "// --- CSS Custom Properties ---"
      lines << ""
      lines << ':root, [data-bs-theme="light"] {'

      token_files.sort.each do |file|
        data = YAML.safe_load(File.read(file), permitted_classes: [Date]) || {}
        tokens = data["tokens"]
        next unless tokens.is_a?(Array)

        tokens.each do |token|
          name = token["name"]
          value = token["value"]
          next unless name && value
          next if value.start_with?("$")

          lines << "  --zer0-#{name}: #{value};"
        end
      end

      lines << "}"
      lines << ""

      # Dark mode overrides
      unless dark_tokens.empty?
        lines << '[data-bs-theme="dark"] {'
        dark_tokens.each do |dt|
          lines << "  --zer0-#{dt[:name]}: #{dt[:dark_value]};"
        end
        lines << "}"
        lines << ""
      end

      lines.join("\n") + "\n"
    end
  end
end
