#!/usr/bin/env ruby
# frozen_string_literal: true

# =============================================================================
# sync-backlog.rb
# =============================================================================
#
# Mirrors `_data/backlog.yml` (the tactical task queue) to GitHub Issues.
#
#   - Each task with status open|in-progress|blocked  -> an OPEN issue.
#   - Each task with status done                       -> its issue is CLOSED.
#
# Issues are matched back to tasks idempotently by a hidden marker embedded in
# the issue body: `<!-- backlog-id: T-001 -->`. Re-running the sync updates the
# title/body/labels in place rather than creating duplicates.
#
# Managed labels (created with `gh label create --force` if missing):
#   agent-ready · priority:P0..P3 · area:<area> · risk:<low|standard> · agent-hold
#
# Usage:
#   ruby scripts/sync-backlog.rb            # create/update/close issues via `gh`
#   ruby scripts/sync-backlog.rb --check    # validate schema only (no `gh`, CI/PR gate)
#   ruby scripts/sync-backlog.rb --dry-run  # print intended `gh` calls, make no changes
#
# Requires the `gh` CLI authenticated with `issues: write` for the write path.
# `--check` needs only Ruby stdlib (used as the pull-request gate).
# =============================================================================

require 'yaml'
require 'date'
require 'json'
require 'optparse'
require 'open3'
require 'shellwords'

ROOT      = File.expand_path('..', __dir__)
DATA_FILE = File.join(ROOT, '_data', 'backlog.yml')

VALID_STATUS   = %w[open in-progress blocked done].freeze
VALID_PRIORITY = %w[P0 P1 P2 P3].freeze
VALID_AREA     = %w[tests docs feat infra a11y perf deps lint].freeze
VALID_RISK     = %w[low standard].freeze
VALID_EFFORT   = %w[S M L].freeze
VALID_SOURCE   = %w[audit roadmap issue user].freeze

OPEN_STATUSES = %w[open in-progress blocked].freeze

# Labels this script owns. On each sync we reconcile a task's labels to exactly
# the managed set it should carry, leaving any human-applied labels untouched.
def managed_labels(task)
  labels = ['agent-ready', "priority:#{task['priority']}", "area:#{task['area']}", "risk:#{task['risk']}"]
  labels << 'agent-hold' if task['status'] == 'blocked'
  labels
end

ALL_MANAGED_LABELS = (
  ['agent-ready', 'agent-hold'] +
  VALID_PRIORITY.map { |p| "priority:#{p}" } +
  VALID_AREA.map { |a| "area:#{a}" } +
  VALID_RISK.map { |r| "risk:#{r}" }
).freeze

LABEL_COLORS = {
  'agent-ready' => '0e8a16',
  'agent-hold'  => 'b60205'
}.freeze
PRIORITY_COLOR = 'd93f0b'
AREA_COLOR     = '1d76db'
RISK_COLOR     = 'fbca04'

# ---------------------------------------------------------------------------
# Load + validate
# ---------------------------------------------------------------------------

def load_data
  # Mirror generate-roadmap.rb: permit Date/Time, and fall back for the older
  # macOS system Ruby (2.6) whose safe loader signature differs.
  begin
    YAML.load_file(DATA_FILE, permitted_classes: [Date, Time])
  rescue ArgumentError
    YAML.safe_load(File.read(DATA_FILE, encoding: 'UTF-8'), permitted_classes: [Date, Time], aliases: false)
  end
end

def validate(data)
  errors = []
  errors << 'Missing top-level `meta:` mapping.' unless data.is_a?(Hash) && data['meta'].is_a?(Hash)
  tasks = data.is_a?(Hash) ? data['tasks'] : nil
  return ['Missing or empty `tasks:` list.'] unless tasks.is_a?(Array) && !tasks.empty?

  seen_ids = {}
  tasks.each_with_index do |task, i|
    where = "tasks[#{i}]"
    unless task.is_a?(Hash)
      errors << "#{where}: each task must be a mapping."
      next
    end
    id = task['id']
    where = id ? "task #{id}" : where
    errors << "#{where}: missing `id`." if id.to_s.empty?
    errors << "#{where}: `id` must match T-NNN (got #{id.inspect})." if id && id !~ /\AT-\d{3,}\z/
    if id && seen_ids[id]
      errors << "#{where}: duplicate id #{id} (also at #{seen_ids[id]})."
    elsif id
      seen_ids[id] = where
    end
    errors << "#{where}: missing `title`." if task['title'].to_s.strip.empty?
    check_enum(errors, where, task, 'status', VALID_STATUS)
    check_enum(errors, where, task, 'priority', VALID_PRIORITY)
    check_enum(errors, where, task, 'area', VALID_AREA)
    check_enum(errors, where, task, 'risk', VALID_RISK)
    check_enum(errors, where, task, 'effort', VALID_EFFORT) if task['effort']
    check_enum(errors, where, task, 'source', VALID_SOURCE) if task['source']
    unless task['acceptance'].is_a?(Array) && !task['acceptance'].empty?
      errors << "#{where}: `acceptance` must be a non-empty list."
    end
  end
  errors
end

def check_enum(errors, where, task, field, allowed)
  value = task[field]
  return if allowed.include?(value)

  errors << "#{where}: `#{field}` must be one of #{allowed.join('|')} (got #{value.inspect})."
end

# ---------------------------------------------------------------------------
# Issue body rendering
# ---------------------------------------------------------------------------

def marker(id)
  "<!-- backlog-id: #{id} -->"
end

def render_body(task)
  accept = (task['acceptance'] || []).map { |a| "- [ ] #{a}" }.join("\n")
  roadmap = task.dig('links', 'roadmap')
  meta_row = [
    "**Priority:** #{task['priority']}",
    "**Area:** #{task['area']}",
    "**Risk:** #{task['risk']}",
    "**Effort:** #{task['effort']}",
    "**Source:** #{task['source']}"
  ].join(' · ')

  <<~BODY.strip
    #{marker(task['id'])}
    > Auto-managed from [`_data/backlog.yml`](../blob/main/_data/backlog.yml) by `scripts/sync-backlog.rb`.
    > Edit the backlog file, not this issue body — changes here are overwritten on the next sync.

    #{meta_row}#{roadmap ? " · **Roadmap:** v#{roadmap}" : ''}

    #{task['summary'].to_s.strip}

    ## Acceptance criteria

    #{accept}

    ---
    Picked up by the IMPLEMENT routine (`.github/prompts/backlog-implement.prompt.md`).
    See [`docs/systems/continuous-evolution.md`](../blob/main/docs/systems/continuous-evolution.md).
  BODY
end

# ---------------------------------------------------------------------------
# gh helpers
# ---------------------------------------------------------------------------

class Gh
  def initialize(dry_run:)
    @dry_run = dry_run
  end

  # Read-only call. Always executed (even in dry-run) so we can compute a diff;
  # degrades to a default value if `gh` is unavailable/unauthenticated.
  def read(args, default:)
    out, _err, status = Open3.capture3('gh', *args)
    return default unless status.success?

    out
  rescue Errno::ENOENT
    default
  end

  # Mutating call. Printed (not executed) in dry-run mode.
  def write(args)
    if @dry_run
      puts "DRY-RUN gh #{args.map { |a| a.to_s.include?(' ') ? a.inspect : a }.join(' ')}"
      return true
    end
    _out, err, status = Open3.capture3('gh', *args)
    warn "gh #{args.first} failed: #{err.strip}" unless status.success?
    status.success?
  end
end

def ensure_labels(gh)
  LABEL_COLORS.each { |name, color| gh.write(['label', 'create', name, '--color', color, '--force']) }
  VALID_PRIORITY.each { |p| gh.write(['label', 'create', "priority:#{p}", '--color', PRIORITY_COLOR, '--force']) }
  VALID_AREA.each { |a| gh.write(['label', 'create', "area:#{a}", '--color', AREA_COLOR, '--force']) }
  VALID_RISK.each { |r| gh.write(['label', 'create', "risk:#{r}", '--color', RISK_COLOR, '--force']) }
end

# Map of backlog id -> existing issue {number, state, labels} via the body marker.
def existing_issues(gh)
  raw = gh.read(
    ['issue', 'list', '--label', 'agent-ready', '--state', 'all', '--limit', '500',
     '--json', 'number,body,state,labels'],
    default: '[]'
  )
  index = {}
  JSON.parse(raw).each do |issue|
    next unless issue['body'] =~ /<!-- backlog-id: (T-\d+) -->/

    index[Regexp.last_match(1)] = {
      'number' => issue['number'],
      'state'  => issue['state'].to_s.downcase,
      'labels' => (issue['labels'] || []).map { |l| l['name'] }
    }
  end
  index
rescue JSON::ParserError
  {}
end

# ---------------------------------------------------------------------------
# Sync
# ---------------------------------------------------------------------------

def label_args(desired, current)
  desired_set = desired
  # Only remove labels we manage; never touch human-applied ones.
  to_remove = (current & ALL_MANAGED_LABELS) - desired_set
  to_add    = desired_set - current
  args = []
  to_add.each    { |l| args.push('--add-label', l) }
  to_remove.each { |l| args.push('--remove-label', l) }
  args
end

def sync(data, gh)
  ensure_labels(gh)
  index = existing_issues(gh)
  created = updated = closed = 0

  (data['tasks'] || []).each do |task|
    id    = task['id']
    title = task['title']
    body  = render_body(task)
    want_open = OPEN_STATUSES.include?(task['status'])
    issue = index[id]

    if issue.nil?
      next unless want_open # never create an issue for an already-done task

      args = ['issue', 'create', '--title', title, '--body', body]
      managed_labels(task).each { |l| args.push('--label', l) }
      created += 1 if gh.write(args)
      next
    end

    number = issue['number'].to_s
    gh.write(['issue', 'edit', number, '--title', title, '--body', body] +
             label_args(managed_labels(task), issue['labels']))
    updated += 1

    if want_open && issue['state'] != 'open'
      gh.write(['issue', 'reopen', number])
    elsif !want_open && issue['state'] != 'closed'
      gh.write(['issue', 'close', number, '--reason', 'completed'])
      closed += 1
    end
  end

  puts "Backlog sync complete: #{created} created, #{updated} updated, #{closed} closed."
  0
end

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main
  mode = :sync
  OptionParser.new do |opts|
    opts.banner = 'Usage: sync-backlog.rb [--check|--dry-run]'
    opts.on('--check', 'Validate schema only; make no gh calls') { mode = :check }
    opts.on('--dry-run', 'Print intended gh calls without executing') { mode = :dry_run }
  end.parse!

  data = load_data
  errors = validate(data)
  unless errors.empty?
    warn '✗ _data/backlog.yml failed validation:'
    errors.each { |e| warn "  - #{e}" }
    return 1
  end
  task_count = (data['tasks'] || []).size

  if mode == :check
    puts "✓ _data/backlog.yml is valid (#{task_count} tasks)."
    return 0
  end

  sync(data, Gh.new(dry_run: mode == :dry_run))
end

exit main if $PROGRAM_NAME == __FILE__
