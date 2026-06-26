#!/usr/bin/env ruby
# frozen_string_literal: true

# =============================================================================
# sync-plan.rb
# =============================================================================
#
# Validates (and optionally mirrors) `_data/roadmap_plan.yml` — the ORDER-ONLY
# plan artifact produced by the /issue-plan committee. The plan sequences open
# backlog tasks into batches; it must NEVER re-encode anything the backlog owns
# (risk / priority / area / status / effort), which would create a second source
# of truth that drifts.
#
#   ruby scripts/sync-plan.rb --check    # validate the plan vs the backlog (CI/PR gate; stdlib only)
#   ruby scripts/sync-plan.rb --dry-run  # print the intended pinned-issue upsert
#   ruby scripts/sync-plan.rb            # upsert one pinned tracking issue via `gh`
#
# --check asserts:
#   * every batch task id exists in _data/backlog.yml and is OPEN (not done),
#   * batch `depends_on` references existing batch ids and the batch DAG is acyclic,
#   * no plan entry carries a backlog-owned field (order-only invariant).
# =============================================================================

require 'yaml'
require 'date'
require 'json'
require 'optparse'
require 'open3'

ROOT      = File.expand_path('..', __dir__)
PLAN_FILE = File.join(ROOT, '_data', 'roadmap_plan.yml')
BACKLOG   = File.join(ROOT, '_data', 'backlog.yml')

PIN_MARKER         = '<!-- roadmap-plan:pinned -->'
BACKLOG_OWNED      = %w[risk priority area status effort source acceptance title].freeze
OPEN_TASK_STATUS   = %w[open in-progress blocked].freeze

def load_yaml(path)
  YAML.load_file(path, permitted_classes: [Date, Time])
rescue ArgumentError
  YAML.safe_load(File.read(path, encoding: 'UTF-8'), permitted_classes: [Date, Time], aliases: false)
end

def backlog_status
  tasks = (load_yaml(BACKLOG)['tasks'] || [])
  tasks.each_with_object({}) { |t, h| h[t['id']] = t['status'] }
end

def validate(plan, statuses)
  errors = []
  unless plan.is_a?(Hash) && plan['batches'].is_a?(Array)
    return ['plan must have a `batches:` list.']
  end

  batch_ids = plan['batches'].map { |b| b['id'] }.compact
  seen = {}
  batch_ids.each { |bid| seen[bid] ? (errors << "duplicate batch id #{bid}.") : (seen[bid] = true) }

  plan['batches'].each_with_index do |batch, i|
    where = batch['id'] ? "batch #{batch['id']}" : "batches[#{i}]"
    errors << "#{where}: missing `id`." if batch['id'].to_s.empty?

    # Order-only invariant: a batch (or its task entries) may not carry a field
    # the backlog owns. Tasks must be bare id strings.
    (BACKLOG_OWNED & batch.keys).each { |k| errors << "#{where}: must not carry backlog-owned field `#{k}`." }
    Array(batch['tasks']).each do |t|
      unless t.is_a?(String) && t =~ /\AT-\d{3,}\z/
        errors << "#{where}: task entries must be bare T-NNN ids (got #{t.inspect})."
        next
      end
      if !statuses.key?(t)
        errors << "#{where}: task #{t} is not in the backlog."
      elsif !OPEN_TASK_STATUS.include?(statuses[t])
        errors << "#{where}: task #{t} is #{statuses[t]} (only open tasks may be planned)."
      end
    end

    Array(batch['depends_on']).each do |dep|
      errors << "#{where}: depends_on references unknown batch #{dep}." unless seen[dep]
    end
  end

  errors.concat(cycle_errors(plan['batches']))
  errors
end

# Kahn's algorithm over the batch DAG; any leftover nodes => a cycle.
def cycle_errors(batches)
  deps = {}
  batches.each { |b| deps[b['id']] = Array(b['depends_on']).dup }
  indeg = Hash.new(0)
  deps.each { |_n, ds| ds.each { |d| indeg[d] += 1 if deps.key?(d) } }
  # Edge dep -> node (dep must precede node); compute order by repeatedly removing
  # nodes whose deps are all satisfied.
  remaining = deps.keys
  progress = true
  while progress
    progress = false
    ready = remaining.select { |n| deps[n].all? { |d| !remaining.include?(d) } }
    unless ready.empty?
      remaining -= ready
      progress = true
    end
  end
  remaining.empty? ? [] : ["batch dependency cycle among: #{remaining.sort.join(', ')}."]
end

def pinned_body(plan)
  lines = ["#{PIN_MARKER}", '> Auto-managed by `scripts/sync-plan.rb` from `_data/roadmap_plan.yml`.',
           '> Order only — risk/priority/area come from `_data/backlog.yml`.', '']
  plan['batches'].each do |b|
    lines << "### #{b['id']} — #{b['goal']}"
    lines << "Tasks: #{Array(b['tasks']).join(', ')}"
    lines << "Depends on: #{Array(b['depends_on']).join(', ')}" unless Array(b['depends_on']).empty?
    lines << "Test framework: #{b['test_framework']}" if b['test_framework']
    lines << ''
  end
  lines.join("\n").strip
end

def upsert_pinned(plan, dry_run:)
  title = '📋 Roadmap plan (auto-managed)'
  body  = pinned_body(plan)
  found = `gh issue list --search #{PIN_MARKER.inspect}\\ in:body --state open --json number --jq '.[0].number' 2>/dev/null`.strip
  args =
    if found.empty?
      ['issue', 'create', '--title', title, '--body', body, '--label', 'agent-hold']
    else
      ['issue', 'edit', found, '--title', title, '--body', body]
    end
  if dry_run
    puts "DRY-RUN gh #{args.join(' ')}"
    return
  end
  _o, err, st = Open3.capture3('gh', *args)
  warn "gh failed: #{err}" unless st.success?
end

def main
  mode = :sync
  OptionParser.new do |o|
    o.on('--check') { mode = :check }
    o.on('--dry-run') { mode = :dry_run }
  end.parse!

  return 0 unless File.exist?(PLAN_FILE) # no plan yet => nothing to validate

  plan = load_yaml(PLAN_FILE)
  errors = validate(plan, backlog_status)
  unless errors.empty?
    warn '✗ _data/roadmap_plan.yml failed validation:'
    errors.each { |e| warn "  - #{e}" }
    return 1
  end

  if mode == :check
    puts "✓ _data/roadmap_plan.yml is valid (#{plan['batches'].size} batches)."
    return 0
  end
  upsert_pinned(plan, dry_run: mode == :dry_run)
  0
end

exit main if $PROGRAM_NAME == __FILE__
