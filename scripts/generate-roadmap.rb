#!/usr/bin/env ruby
# frozen_string_literal: true

# =============================================================================
# generate-roadmap.rb
# =============================================================================
#
# Reads `_data/roadmap.yml` and updates the README.md roadmap section in-place.
#
# It rewrites two regions delimited by HTML comment markers:
#
#   <!-- ROADMAP_MERMAID:START -->  ...  <!-- ROADMAP_MERMAID:END -->
#   <!-- ROADMAP_TABLE:START -->    ...  <!-- ROADMAP_TABLE:END -->
#
# Usage:
#   ruby scripts/generate-roadmap.rb              # update README.md in place
#   ruby scripts/generate-roadmap.rb --check      # exit non-zero if README is stale
#   ruby scripts/generate-roadmap.rb --validate   # check roadmap integrity & version tracking
#   ruby scripts/generate-roadmap.rb --stdout     # print regenerated sections only
#
# This script has no gem dependencies beyond the Ruby stdlib.
# =============================================================================

require 'yaml'
require 'date'
require 'optparse'

ROOT        = File.expand_path('..', __dir__)
DATA_FILE   = File.join(ROOT, '_data', 'roadmap.yml')
README      = File.join(ROOT, 'README.md')
VERSION_RB  = File.join(ROOT, 'lib', 'jekyll-theme-zer0', 'version.rb')

# Allowed enum values and the section each status must live in.
VALID_STATUSES  = %w[completed active planned milestone].freeze
SECTION_FOR     = {
  'completed' => 'Completed',
  'active'    => 'Current',
  'planned'   => 'Future',
  'milestone' => 'Future'
}.freeze
# How stale meta.updated may get before validation warns (days).
FRESHNESS_DAYS  = 120

MERMAID_START = '<!-- ROADMAP_MERMAID:START -->'
MERMAID_END   = '<!-- ROADMAP_MERMAID:END -->'
TABLE_START   = '<!-- ROADMAP_TABLE:START -->'
TABLE_END     = '<!-- ROADMAP_TABLE:END -->'

# Width used to right-pad the gantt label column so the `:status, start, end`
# tail aligns vertically. Adjust if very long version/title combinations show up.
GANTT_LABEL_WIDTH = 28

# ---------------------------------------------------------------------------
# Rendering helpers
# ---------------------------------------------------------------------------

# Mermaid gantt task line for a single milestone.
#
#   v0.22 AIEO Optimization :active, 2026-03, 2026-04
#   v1.0  Stable Release    :milestone, 2027-01, 1d
#
def gantt_task(milestone)
  label   = "v#{milestone['version']} #{milestone['title']}"
  status  = milestone['status'].to_s
  start   = milestone['start']
  finish  = milestone['end'] || milestone['start']

  prefix =
    case status
    when 'completed' then 'done, '
    when 'active'    then 'active, '
    when 'milestone' then 'milestone, '
    else ''
    end

  range = status == 'milestone' ? "#{start}, 1d" : "#{start}, #{finish}"
  "    #{label.ljust(GANTT_LABEL_WIDTH)} :#{prefix}#{range}"
end

def render_mermaid(data)
  title      = data.dig('meta', 'title') || 'zer0-mistakes Roadmap'
  milestones = data['milestones'] || []

  # Group by section while preserving the order in which sections first appear.
  sections = milestones.group_by { |m| m['section'] || 'Roadmap' }
  ordered  = milestones.map { |m| m['section'] }.uniq

  lines = []
  lines << '```mermaid'
  lines << 'gantt'
  lines << "    title #{title}"
  lines << '    dateFormat YYYY-MM'
  ordered.each do |section|
    lines << "    section #{section}"
    sections[section].each { |m| lines << gantt_task(m) }
  end
  lines << '```'
  lines.join("\n")
end

# Status → human-readable target column for the summary table.
def target_label(milestone)
  case milestone['status']
  when 'completed'
    if (released = milestone['released'])
      Date.parse(released.to_s).strftime('%b %Y') rescue 'Completed'
    else
      'Completed'
    end
  when 'active'
    milestone['target'] || 'In progress'
  when 'milestone', 'planned'
    milestone['target'] || milestone['start']
  else
    milestone['target'] || ''
  end
end

def render_table(data)
  rows = (data['milestones'] || []).map do |m|
    version  = "**v#{m['version']}**"
    target   = target_label(m)
    summary  = m['summary'] || ''
    status_emoji =
      case m['status']
      when 'completed' then '✅ Completed'
      when 'active'    then '🚧 In Progress'
      when 'milestone' then '🎯 Milestone'
      else                  '🗓 Planned'
      end
    "| #{version} | #{status_emoji} | #{target} | #{summary} |"
  end

  header = [
    '| Version | Status | Target | Highlights |',
    '|---------|--------|--------|------------|'
  ]

  (header + rows).join("\n")
end

# ---------------------------------------------------------------------------
# Tracking / validation helpers
# ---------------------------------------------------------------------------

# Reads the canonical gem version (e.g. "1.9.8") from lib/.../version.rb.
# Returns nil if the file or constant can't be found, so validation degrades
# gracefully on stripped checkouts.
def current_gem_version
  return nil unless File.exist?(VERSION_RB)

  m = File.read(VERSION_RB).match(/VERSION\s*=\s*["']([^"']+)["']/)
  m && m[1]
end

# "1.9.8" -> "1.9" (the major.minor series a milestone version tracks).
def minor_series(version_string)
  parts = version_string.to_s.split('.')
  "#{parts[0]}.#{parts[1] || '0'}"
end

def parse_month(value)
  Date.strptime(value.to_s, '%Y-%m')
rescue ArgumentError
  nil
end

# Validates the roadmap data for internal consistency and tracking accuracy.
# Returns [errors, warnings] as arrays of strings. Errors are integrity
# violations (fail CI); warnings flag drift that humans should review.
def validate_roadmap(data)
  errors   = []
  warnings = []
  milestones = data['milestones'] || []

  errors << 'No milestones defined.' if milestones.empty?

  seen_versions = {}
  milestones.each do |m|
    id = "v#{m['version'] || '?'}"

    %w[version title status section start].each do |field|
      errors << "#{id}: missing required field '#{field}'." if m[field].nil? || m[field].to_s.empty?
    end

    status = m['status'].to_s
    unless VALID_STATUSES.include?(status)
      errors << "#{id}: invalid status '#{status}' (expected #{VALID_STATUSES.join(', ')})."
    end

    if (expected = SECTION_FOR[status]) && m['section'] != expected
      errors << "#{id}: status '#{status}' must use section '#{expected}', found '#{m['section']}'."
    end

    if (v = m['version'])
      errors << "#{id}: duplicate version '#{v}'." if seen_versions[v]
      seen_versions[v] = true
    end

    start_d  = parse_month(m['start'])
    errors << "#{id}: start '#{m['start']}' is not a valid YYYY-MM date." if m['start'] && start_d.nil?
    if m['end']
      end_d = parse_month(m['end'])
      if end_d.nil?
        errors << "#{id}: end '#{m['end']}' is not a valid YYYY-MM date."
      elsif start_d && end_d < start_d
        errors << "#{id}: end '#{m['end']}' precedes start '#{m['start']}'."
      end
    end

    if status == 'completed' && (m['released'].nil? || m['released'].to_s.empty?)
      warnings << "#{id}: completed milestone has no 'released' date."
    end

    if status == 'active' && !m['released'].to_s.empty?
      warnings << "#{id}: active milestone has a 'released' date — should it be marked 'completed'?"
    end
  end

  # Exactly one in-flight milestone keeps "Current" unambiguous.
  active = milestones.select { |m| m['status'] == 'active' }
  case active.size
  when 0 then warnings << "No 'active' milestone — nothing marks the current focus."
  when 1 then nil
  else errors << "Multiple 'active' milestones (#{active.map { |m| "v#{m['version']}" }.join(', ')}); only one allowed."
  end

  # Cross-reference the canonical gem version so the roadmap can't drift.
  if (gem_v = current_gem_version)
    require 'rubygems'
    gem_ver = Gem::Version.new(gem_v)
    series  = minor_series(gem_v)

    if active.size == 1 && active.first['version'].to_s != series
      warnings << "Active milestone is v#{active.first['version']} but the gem is at v#{gem_v} " \
                  "(series #{series}). Advance the roadmap to track the shipped version."
    end

    milestones.each do |m|
      next unless %w[planned milestone].include?(m['status'].to_s)

      begin
        next if Gem::Version.new(m['version'].to_s) > gem_ver
      rescue ArgumentError
        next
      end
      warnings << "v#{m['version']} is still '#{m['status']}' but the gem already shipped v#{gem_v}; " \
                  'mark it completed or renumber it.'
    end
  else
    warnings << "Could not read gem version from #{File.basename(VERSION_RB)} — skipped version tracking."
  end

  # Freshness of the last-reviewed date.
  if (updated = data.dig('meta', 'updated'))
    updated_d = updated.is_a?(Date) ? updated : (Date.parse(updated.to_s) rescue nil)
    if updated_d.nil?
      warnings << "meta.updated '#{updated}' is not a valid date."
    elsif (Date.today - updated_d).to_i > FRESHNESS_DAYS
      warnings << "meta.updated (#{updated_d}) is more than #{FRESHNESS_DAYS} days old; review the roadmap."
    end
  else
    warnings << 'meta.updated is not set.'
  end

  [errors, warnings]
end

def run_validation(data)
  errors, warnings = validate_roadmap(data)

  warnings.each { |w| warn "  ⚠ WARN  #{w}" }
  errors.each   { |e| warn "  ✗ FAIL  #{e}" }

  if errors.empty? && warnings.empty?
    puts '✓ Roadmap is valid and tracks the current version.'
  elsif errors.empty?
    puts "✓ Roadmap valid (#{warnings.size} warning(s) — see above)."
  else
    warn "✗ Roadmap validation failed: #{errors.size} error(s), #{warnings.size} warning(s)."
  end

  errors.empty? ? 0 : 1
end

def replace_block(content, marker_start, marker_end, replacement)
  pattern = /(#{Regexp.escape(marker_start)})(.*?)(#{Regexp.escape(marker_end)})/m
  unless content.match?(pattern)
    raise "Markers not found in README: #{marker_start} ... #{marker_end}"
  end

  # Surround the replacement with blank lines so kramdown parses the following
  # markdown (especially tables) instead of treating it as part of the HTML
  # comment block. Without the blank line after `<!-- ... -->`, GFM tables
  # collapse into a single paragraph.
  content.sub(pattern, "\\1\n\n#{replacement}\n\n\\3")
end

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main
  options = { mode: :write }
  OptionParser.new do |opts|
    opts.banner = 'Usage: generate-roadmap.rb [--check|--validate|--stdout]'
    opts.on('--check', 'Exit non-zero if README would change') { options[:mode] = :check }
    opts.on('--validate', 'Check roadmap integrity & version tracking') { options[:mode] = :validate }
    opts.on('--stdout', 'Print regenerated sections to stdout') { options[:mode] = :stdout }
  end.parse!

  # The roadmap data only contains scalars and Date values; Symbol is not used,
  # but Date/Time must be permitted because YAML's safe loader rejects them by default.
  # Ruby >= 3.1 supports `permitted_classes:` on `YAML.load_file`. On older Rubies
  # (e.g. macOS system Ruby 2.6), fall back to `safe_load` which accepted the
  # keyword earlier, so the generator works for contributors without rbenv/rvm.
  data =
    begin
      YAML.load_file(DATA_FILE, permitted_classes: [Date, Time])
    rescue ArgumentError
      YAML.safe_load(File.read(DATA_FILE), permitted_classes: [Date, Time], aliases: false)
    end

  return run_validation(data) if options[:mode] == :validate

  mermaid = render_mermaid(data)
  table   = render_table(data)

  if options[:mode] == :stdout
    puts mermaid
    puts
    puts table
    return 0
  end

  original = File.read(README)
  updated  = original.dup
  updated  = replace_block(updated, MERMAID_START, MERMAID_END, mermaid)
  updated  = replace_block(updated, TABLE_START,   TABLE_END,   table)

  if options[:mode] == :check
    if original == updated
      puts '✓ README.md roadmap section is up to date with _data/roadmap.yml'
      return 0
    else
      warn '✗ README.md roadmap section is out of date with _data/roadmap.yml'
      warn '  Run: ./scripts/generate-roadmap.sh'
      return 1
    end
  end

  if original == updated
    puts 'README.md roadmap section already up to date.'
  else
    File.write(README, updated)
    puts "Updated README.md roadmap section from #{File.basename(DATA_FILE)}."
  end
  0
end

exit main if $PROGRAM_NAME == __FILE__
