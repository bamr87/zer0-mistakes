#!/usr/bin/env ruby
# frozen_string_literal: true

# Migration script: Add @zer0-component headers to all include files
# This is a one-time migration script for Phase 1, Step 1.2
# Run from project root: ruby scripts/migrate-add-component-headers.rb [--dry-run]

require 'fileutils'

DRY_RUN = ARGV.include?('--dry-run')

# Mapping: relative path => { feature_id, type, deps, styles }
INCLUDE_HEADERS = {
  # === CORE ===
  '_includes/core/head.html' => {
    feature_id: 'ZER0-001',
    type: 'include',
    deps: %w[ZER0-006 ZER0-038 ZER0-039 ZER0-041],
    styles: %w[bootstrap-5.3.3 bootstrap-icons],
    schema_fields: nil
  },
  '_includes/core/header.html' => {
    feature_id: 'ZER0-011',
    type: 'include',
    deps: %w[ZER0-001 ZER0-008 ZER0-020],
    styles: %w[bootstrap-navbar offcanvas],
    schema_fields: nil
  },
  '_includes/core/footer.html' => {
    feature_id: 'ZER0-020',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[bootstrap-footer],
    schema_fields: nil
  },
  '_includes/core/branding.html' => {
    feature_id: 'ZER0-001',
    type: 'include',
    deps: %w[],
    styles: %w[navbar-brand],
    schema_fields: nil
  },

  # === ANALYTICS ===
  '_includes/analytics/posthog.html' => {
    feature_id: 'ZER0-006',
    type: 'include',
    deps: %w[ZER0-007],
    styles: nil,
    schema_fields: nil
  },
  '_includes/analytics/google-analytics.html' => {
    feature_id: 'ZER0-038',
    type: 'include',
    deps: %w[ZER0-007],
    styles: nil,
    schema_fields: nil
  },
  '_includes/analytics/google-tag-manager-head.html' => {
    feature_id: 'ZER0-039',
    type: 'include',
    deps: %w[],
    styles: nil,
    schema_fields: nil
  },
  '_includes/analytics/google-tag-manager-body.html' => {
    feature_id: 'ZER0-039',
    type: 'include',
    deps: %w[],
    styles: nil,
    schema_fields: nil
  },

  # === NAVIGATION ===
  '_includes/navigation/sidebar-left.html' => {
    feature_id: 'ZER0-008',
    type: 'include',
    deps: %w[ZER0-001 ZER0-037],
    styles: %w[sidebar offcanvas],
    schema_fields: nil
  },
  '_includes/navigation/sidebar-right.html' => {
    feature_id: 'ZER0-008',
    type: 'include',
    deps: %w[ZER0-001 ZER0-010 ZER0-037],
    styles: %w[sidebar offcanvas],
    schema_fields: nil
  },
  '_includes/navigation/sidebar-categories.html' => {
    feature_id: 'ZER0-008',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[sidebar list-group],
    schema_fields: nil
  },
  '_includes/navigation/sidebar-folders.html' => {
    feature_id: 'ZER0-008',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[sidebar list-group],
    schema_fields: nil
  },
  '_includes/navigation/breadcrumbs.html' => {
    feature_id: 'ZER0-040',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[breadcrumb],
    schema_fields: nil
  },
  '_includes/navigation/navbar.html' => {
    feature_id: 'ZER0-008',
    type: 'include',
    deps: %w[ZER0-001 ZER0-020],
    styles: %w[navbar nav-item dropdown],
    schema_fields: nil
  },
  '_includes/navigation/nav-tree.html' => {
    feature_id: 'ZER0-008',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[nav-tree list-group],
    schema_fields: nil
  },
  '_includes/navigation/nav_list.html' => {
    feature_id: 'ZER0-008',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[nav list-group],
    schema_fields: nil
  },
  '_includes/navigation/section-sidebar.html' => {
    feature_id: 'ZER0-008',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[sidebar],
    schema_fields: nil
  },

  # === COMPONENTS ===
  '_includes/components/cookie-consent.html' => {
    feature_id: 'ZER0-007',
    type: 'include',
    deps: %w[ZER0-001 ZER0-006],
    styles: %w[modal toast],
    schema_fields: nil
  },
  '_includes/components/mermaid.html' => {
    feature_id: 'ZER0-013',
    type: 'include',
    deps: %w[],
    styles: %w[mermaid],
    schema_fields: nil
  },
  '_includes/components/theme-info.html' => {
    feature_id: 'ZER0-021',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[card],
    schema_fields: nil
  },
  '_includes/components/search-modal.html' => {
    feature_id: 'ZER0-032',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[modal form-control],
    schema_fields: nil
  },
  '_includes/components/searchbar.html' => {
    feature_id: 'ZER0-032',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[form-control input-group],
    schema_fields: nil
  },
  '_includes/components/preview-image.html' => {
    feature_id: 'ZER0-004',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[img-fluid card-img],
    schema_fields: %w[preview preview_image]
  },
  '_includes/components/post-card.html' => {
    feature_id: 'ZER0-014',
    type: 'include',
    deps: %w[ZER0-001 ZER0-004],
    styles: %w[card post-card],
    schema_fields: %w[title date categories tags preview]
  },
  '_includes/components/post-type-badge.html' => {
    feature_id: 'ZER0-014',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[badge],
    schema_fields: %w[post_type]
  },
  '_includes/components/js-cdn.html' => {
    feature_id: 'ZER0-001',
    type: 'include',
    deps: %w[],
    styles: nil,
    schema_fields: nil
  },
  '_includes/components/author-card.html' => {
    feature_id: 'ZER0-020',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[card author-card],
    schema_fields: %w[author]
  },
  '_includes/components/info-section.html' => {
    feature_id: 'ZER0-020',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[card],
    schema_fields: nil
  },
  '_includes/components/quick-index.html' => {
    feature_id: 'ZER0-020',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[list-group],
    schema_fields: nil
  },
  '_includes/components/powered-by.html' => {
    feature_id: 'ZER0-020',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[nav],
    schema_fields: nil
  },
  '_includes/components/env-switcher.html' => {
    feature_id: 'ZER0-002',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[dropdown],
    schema_fields: nil
  },
  '_includes/components/dev-shortcuts.html' => {
    feature_id: 'ZER0-002',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[dev-toolbar],
    schema_fields: nil
  },
  '_includes/components/halfmoon.html' => {
    feature_id: 'ZER0-001',
    type: 'include',
    deps: %w[],
    styles: %w[dark-mode],
    schema_fields: nil
  },
  '_includes/components/svg.html' => {
    feature_id: 'ZER0-020',
    type: 'include',
    deps: %w[],
    styles: nil,
    schema_fields: nil
  },
  '_includes/components/zer0-env-var.html' => {
    feature_id: 'ZER0-002',
    type: 'include',
    deps: %w[],
    styles: nil,
    schema_fields: nil
  },

  # === CONTENT ===
  '_includes/content/giscus.html' => {
    feature_id: 'ZER0-035',
    type: 'include',
    deps: %w[],
    styles: %w[giscus-frame],
    schema_fields: %w[comments]
  },
  '_includes/content/toc.html' => {
    feature_id: 'ZER0-037',
    type: 'include',
    deps: %w[ZER0-001 ZER0-008],
    styles: %w[toc nav],
    schema_fields: nil
  },
  '_includes/content/seo.html' => {
    feature_id: 'ZER0-041',
    type: 'include',
    deps: %w[],
    styles: nil,
    schema_fields: %w[title description author date preview keywords]
  },
  '_includes/content/sitemap.html' => {
    feature_id: 'ZER0-042',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[list-group],
    schema_fields: nil
  },
  '_includes/content/intro.html' => {
    feature_id: 'ZER0-020',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[jumbotron],
    schema_fields: %w[title description sub-title]
  },

  # === STATS ===
  '_includes/stats/stats-header.html' => {
    feature_id: 'ZER0-043',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[stats-header],
    schema_fields: nil
  },
  '_includes/stats/stats-overview.html' => {
    feature_id: 'ZER0-043',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[card stats-overview],
    schema_fields: nil
  },
  '_includes/stats/stats-categories.html' => {
    feature_id: 'ZER0-043',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[card stats-categories],
    schema_fields: nil
  },
  '_includes/stats/stats-tags.html' => {
    feature_id: 'ZER0-043',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[card stats-tags],
    schema_fields: nil
  },
  '_includes/stats/stats-metrics.html' => {
    feature_id: 'ZER0-043',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[card stats-metrics chart],
    schema_fields: nil
  },
  '_includes/stats/stats-no-data.html' => {
    feature_id: 'ZER0-043',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[alert],
    schema_fields: nil
  },

  # === LANDING ===
  '_includes/landing/landing-install-cards.html' => {
    feature_id: 'ZER0-003',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[card],
    schema_fields: nil
  },
  '_includes/landing/landing-quick-links.html' => {
    feature_id: 'ZER0-020',
    type: 'include',
    deps: %w[ZER0-001],
    styles: %w[card list-group],
    schema_fields: nil
  },

  # === DOCS ===
  '_includes/docs/bootstrap-docs.html' => {
    feature_id: 'ZER0-001',
    type: 'include',
    deps: %w[],
    styles: %w[bootstrap-docs],
    schema_fields: nil
  },

  # === ROOT-LEVEL ===
  '_includes/search-data.json' => {
    feature_id: 'ZER0-032',
    type: 'include',
    deps: %w[ZER0-042],
    styles: nil,
    schema_fields: nil
  }
}

def generate_header(data)
  lines = []
  lines << '<!-- @zer0-component'
  lines << "  feature-id: #{data[:feature_id]}"
  lines << "  type: #{data[:type]}"
  lines << "  dependencies: [#{data[:deps].join(', ')}]" if data[:deps] && !data[:deps].empty?
  lines << '  dependencies: []' if data[:deps].nil? || data[:deps].empty?
  lines << "  schema-fields: [#{data[:schema_fields].join(', ')}]" if data[:schema_fields]
  lines << "  styles: [#{data[:styles].join(', ')}]" if data[:styles] && !data[:styles].empty?
  lines << '-->'
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

  # Strategy 1: After closing --> of a === block comment
  if content =~ /^(.*?===+\s*\n-->\n)/m
    insertion_point = $1
    new_content = content.sub(insertion_point, insertion_point + header_text + "\n")
    write_file(file_path, new_content)
    return :inserted_after_block

  # Strategy 2: After a simple closing --> (any multi-line HTML comment at the top)
  elsif content =~ /\A(<!--[\s\S]*?-->\n)/
    insertion_point = $1
    new_content = content.sub(insertion_point, insertion_point + header_text + "\n")
    write_file(file_path, new_content)
    return :inserted_after_comment

  # Strategy 3: After a Liquid comment block at the top
  elsif content =~ /\A(\{%[-\s]*comment\s*[-\s]*%\}[\s\S]*?\{%[-\s]*endcomment\s*[-\s]*%\}\n?)/
    insertion_point = $1
    new_content = content.sub(insertion_point, insertion_point + header_text + "\n")
    write_file(file_path, new_content)
    return :inserted_after_liquid

  # Strategy 4: Prepend at top (no comment block found)
  else
    new_content = header_text + "\n" + content
    write_file(file_path, new_content)
    return :prepended
  end
end

def write_file(file_path, content)
  if DRY_RUN
    puts "  DRY RUN: Would write #{content.length} bytes to #{file_path}"
  else
    File.write(file_path, content)
  end
end

# Main execution
puts "=" * 60
puts "Migration: Add @zer0-component headers to includes"
puts "Mode: #{DRY_RUN ? 'DRY RUN' : 'LIVE'}"
puts "=" * 60

results = { inserted_after_block: 0, inserted_after_comment: 0,
            inserted_after_liquid: 0, prepended: 0, skipped: 0, missing: 0 }

INCLUDE_HEADERS.each do |rel_path, data|
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

puts "\n" + "=" * 60
puts "Results:"
results.each { |k, v| puts "  #{k}: #{v}" if v > 0 }
puts "Total files processed: #{results.values.sum}"
puts "=" * 60
