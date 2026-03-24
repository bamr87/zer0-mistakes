#!/usr/bin/env ruby
# frozen_string_literal: true

# Migration script: Add @zer0-component headers to shell/Ruby scripts
# Run from project root: ruby scripts/migrate-add-script-headers.rb [--dry-run]

DRY_RUN = ARGV.include?('--dry-run')

# Mapping: relative path => { feature_id, type, deps }
SCRIPT_HEADERS = {
  # === Release/Version Management (ZER0-015) ===
  'scripts/lib/version.sh' => { feature_id: 'ZER0-015', type: 'script', deps: %w[] },
  'scripts/lib/git.sh' => { feature_id: 'ZER0-015', type: 'script', deps: %w[] },
  'scripts/lib/validation.sh' => { feature_id: 'ZER0-015', type: 'script', deps: %w[ZER0-002] },
  'scripts/lib/gem.sh' => { feature_id: 'ZER0-015', type: 'script', deps: %w[ZER0-015] },
  'scripts/lib/changelog.sh' => { feature_id: 'ZER0-015', type: 'script', deps: %w[] },
  'scripts/lib/common.sh' => { feature_id: 'ZER0-015', type: 'script', deps: %w[] },
  'scripts/lib/template.sh' => { feature_id: 'ZER0-014', type: 'script', deps: %w[] },
  'scripts/bin/release' => { feature_id: 'ZER0-015', type: 'script', deps: %w[] },
  'scripts/analyze-commits.sh' => { feature_id: 'ZER0-015', type: 'script', deps: %w[] },

  # === Preview Image Generation (ZER0-004) ===
  'scripts/generate-preview-images.sh' => { feature_id: 'ZER0-004', type: 'script', deps: %w[] },
  'scripts/install-preview-generator.sh' => { feature_id: 'ZER0-004', type: 'script', deps: %w[] },
  'scripts/update-preview-paths.sh' => { feature_id: 'ZER0-004', type: 'script', deps: %w[] },
  'scripts/features/generate-preview-images' => { feature_id: 'ZER0-004', type: 'script', deps: %w[] },
  'scripts/features/install-preview-generator' => { feature_id: 'ZER0-004', type: 'script', deps: %w[] },

  # === Setup/Installation (ZER0-003) ===
  'scripts/setup.sh' => { feature_id: 'ZER0-003', type: 'script', deps: %w[ZER0-002] },
  'scripts/init_setup.sh' => { feature_id: 'ZER0-003', type: 'script', deps: %w[ZER0-002] },

  # === Utilities ===
  'scripts/convert-notebooks.sh' => { feature_id: 'ZER0-012', type: 'script', deps: %w[] },
  'scripts/migrate-nav-modes.sh' => { feature_id: 'ZER0-008', type: 'script', deps: %w[] },
  'scripts/fork-cleanup.sh' => { feature_id: 'ZER0-002', type: 'script', deps: %w[] },
  'scripts/fix-markdown-format.sh' => { feature_id: 'ZER0-020', type: 'script', deps: %w[] },
  'scripts/post-template-setup.sh' => { feature_id: 'ZER0-014', type: 'script', deps: %w[] },
  'scripts/example-usage.sh' => { feature_id: 'ZER0-020', type: 'script', deps: %w[] },

  # === Validation Scripts (ZER0-044 - Cross-cutting infrastructure) ===
  'scripts/validate-references.rb' => { feature_id: 'ZER0-044', type: 'script', deps: %w[] },
  'scripts/validate-feature-ids.rb' => { feature_id: 'ZER0-044', type: 'script', deps: %w[] },
  'scripts/validate-front-matter.rb' => { feature_id: 'ZER0-044', type: 'script', deps: %w[] },
  # validate-component-headers.rb already has a header

  # === Plugins ===
  '_plugins/schema_validator.rb' => { feature_id: 'ZER0-044', type: 'plugin', deps: %w[] },
  '_plugins/preview_image_generator.rb' => { feature_id: 'ZER0-004', type: 'plugin', deps: %w[] },
  '_plugins/theme_version.rb' => { feature_id: 'ZER0-021', type: 'plugin', deps: %w[] }
}

def generate_header(data)
  lines = []
  lines << '# @zer0-component'
  lines << "#   feature-id: #{data[:feature_id]}"
  lines << "#   type: #{data[:type]}"
  lines << "#   dependencies: [#{data[:deps].join(', ')}]"
  lines.join("\n")
end

def already_has_header?(content)
  content.include?('@zer0-component')
end

def insert_header(file_path, header_text)
  content = File.read(file_path)

  if already_has_header?(content)
    puts "  SKIP (already has header): #{file_path}"
    return :skipped
  end

  # For shell scripts: insert after shebang + first comment block
  # For Ruby scripts: insert after frozen_string_literal
  lines = content.lines

  # Find insertion point: after shebang and frozen_string_literal
  insert_at = 0
  lines.each_with_index do |line, i|
    if line.start_with?('#!') || line.strip == '# frozen_string_literal: true' || line.strip.empty?
      insert_at = i + 1
    else
      break
    end
  end

  # Insert the header block with a trailing blank line
  lines.insert(insert_at, header_text + "\n#\n")

  new_content = lines.join
  write_file(file_path, new_content)
  :inserted
end

def write_file(file_path, content)
  if DRY_RUN
    puts "  DRY RUN: Would write #{content.length} bytes to #{file_path}"
  else
    File.write(file_path, content)
  end
end

# Main execution
puts '=' * 60
puts 'Migration: Add @zer0-component headers to scripts/plugins'
puts "Mode: #{DRY_RUN ? 'DRY RUN' : 'LIVE'}"
puts '=' * 60

results = { inserted: 0, skipped: 0, missing: 0 }

SCRIPT_HEADERS.each do |rel_path, data|
  full_path = File.join(Dir.pwd, rel_path)

  unless File.exist?(full_path)
    puts "  MISSING: #{rel_path}"
    results[:missing] += 1
    next
  end

  header = generate_header(data)
  result = insert_header(full_path, header)
  results[result] += 1
  puts "  #{result.to_s.upcase}: #{rel_path}" unless result == :skipped
end

puts "\n" + '=' * 60
puts 'Results:'
results.each { |k, v| puts "  #{k}: #{v}" if v > 0 }
puts "Total files processed: #{results.values.sum}"
puts '=' * 60
