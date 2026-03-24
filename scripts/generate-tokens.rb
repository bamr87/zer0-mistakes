#!/usr/bin/env ruby
# frozen_string_literal: true

# @zer0-component
#   feature-id: ZER0-045
#   type: script
#   dependencies: [_data/tokens/*.yml]
#
# File: generate-tokens.rb
# Path: scripts/generate-tokens.rb
# Purpose: Generates _sass/generated/_tokens.scss from _data/tokens/*.yml
#
# Usage:
#   ruby scripts/generate-tokens.rb
#   ruby scripts/generate-tokens.rb --check   # Verify tokens are up to date (CI mode)

require "yaml"
require "fileutils"
require "date"

PROJECT_ROOT = File.expand_path("..", __dir__)
TOKENS_DIR = File.join(PROJECT_ROOT, "_data", "tokens")
OUTPUT_DIR = File.join(PROJECT_ROOT, "_sass", "generated")
OUTPUT_FILE = File.join(OUTPUT_DIR, "_tokens.scss")

def build_scss(token_files)
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

# Main
token_files = Dir.glob(File.join(TOKENS_DIR, "*.yml")).reject { |f| File.basename(f).start_with?("_") }

if token_files.empty?
  warn "No token files found in #{TOKENS_DIR}"
  exit 1
end

scss_content = build_scss(token_files)

if ARGV.include?("--check")
  if File.exist?(OUTPUT_FILE) && File.read(OUTPUT_FILE) == scss_content
    puts "✓ Tokens are up to date"
    exit 0
  else
    warn "✗ Tokens are out of date. Run: ruby scripts/generate-tokens.rb"
    exit 1
  end
end

FileUtils.mkdir_p(OUTPUT_DIR)
File.write(OUTPUT_FILE, scss_content)
puts "✓ Generated #{OUTPUT_FILE} from #{token_files.length} token files"
