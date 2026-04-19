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
#   ruby scripts/generate-roadmap.rb --stdout     # print regenerated sections only
#
# This script has no gem dependencies beyond the Ruby stdlib.
# =============================================================================

require 'yaml'
require 'date'
require 'optparse'

ROOT       = File.expand_path('..', __dir__)
DATA_FILE  = File.join(ROOT, '_data', 'roadmap.yml')
README     = File.join(ROOT, 'README.md')

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
      Date.parse(released.to_s).strftime('%b %Y')
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

def replace_block(content, marker_start, marker_end, replacement)
  pattern = /(#{Regexp.escape(marker_start)})(.*?)(#{Regexp.escape(marker_end)})/m
  unless content.match?(pattern)
    raise "Markers not found in README: #{marker_start} ... #{marker_end}"
  end

  content.sub(pattern, "\\1\n#{replacement}\n\\3")
end

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main
  options = { mode: :write }
  OptionParser.new do |opts|
    opts.banner = 'Usage: generate-roadmap.rb [--check|--stdout]'
    opts.on('--check', 'Exit non-zero if README would change') { options[:mode] = :check }
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
