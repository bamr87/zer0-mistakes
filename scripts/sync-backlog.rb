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
  seen_links = {}
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

    # Adoption guard: an existing GitHub issue may be claimed by at most one task,
    # so two tasks can never fight over (or duplicate) the same issue.
    lnk = task.dig('links', 'issue')
    if lnk
      unless lnk.is_a?(Integer) || lnk.to_s =~ /\A\d+\z/
        errors << "#{where}: `links.issue` must be an issue number (got #{lnk.inspect})."
      end
      key = lnk.to_s
      if seen_links[key]
        errors << "#{where}: `links.issue` ##{key} already claimed by #{seen_links[key]}."
      else
        seen_links[key] = (id || where)
      end
    end
    # Optional routing/dependency metadata (consumed by /issue-implement + /issue-plan).
    if task.key?('route') && !task['route'].is_a?(String)
      errors << "#{where}: `route` must be a string."
    end
    if task.key?('depends_on') &&
       !(task['depends_on'].is_a?(Array) &&
         task['depends_on'].all? { |d| d.is_a?(String) && d =~ /\AT-\d{3,}\z/ })
      errors << "#{where}: `depends_on` must be a list of T-NNN ids."
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

# Delimiters around the sync-owned section of an ADOPTED human issue. Text ABOVE
# the start delimiter (the author's original report) is never touched; only this
# block is upserted on each sync, so adoption is non-destructive.
MANAGED_START = '<!-- backlog-managed:start -->'
MANAGED_END   = '<!-- backlog-managed:end -->'

def render_managed_block(task)
  accept = (task['acceptance'] || []).map { |a| "- [ ] #{a}" }.join("\n")
  roadmap = task.dig('links', 'roadmap')
  meta_row = [
    "**Priority:** #{task['priority']}",
    "**Area:** #{task['area']}",
    "**Risk:** #{task['risk']}",
    "**Effort:** #{task['effort']}",
    "**Source:** #{task['source']}"
  ].join(' · ')

  <<~BLOCK.strip
    #{MANAGED_START}
    #{marker(task['id'])}
    > Tracked from [`_data/backlog.yml`](../blob/main/_data/backlog.yml) by `scripts/sync-backlog.rb`.
    > The report above is the author's; this block is auto-managed — edit the backlog, not here.

    #{meta_row}#{roadmap ? " · **Roadmap:** v#{roadmap}" : ''}

    ## Acceptance criteria

    #{accept}

    Picked up by the IMPLEMENT routine; see [`docs/systems/continuous-evolution.md`](../blob/main/docs/systems/continuous-evolution.md).
    #{MANAGED_END}
  BLOCK
end

# Upsert the managed block into a (human-authored) issue body, preserving the
# author's text. Idempotent: replaces an existing block, else appends one.
def upsert_managed_block(body, task)
  body  = body.to_s
  block = render_managed_block(task)
  if body.include?(MANAGED_START) && body.include?(MANAGED_END)
    body.sub(/#{Regexp.escape(MANAGED_START)}.*#{Regexp.escape(MANAGED_END)}/m, block)
  else
    "#{body.rstrip}\n\n#{block}\n"
  end
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

# Returns [index, link_state]:
#   index      — backlog id -> {number,state,labels,body,marker_id} for every
#                marker-bearing agent-ready issue (the already-managed ones).
#   link_state — issue number -> same record, for each issue referenced by a task
#                `links.issue`. A human issue may carry neither the agent-ready
#                label nor a marker yet, so it is fetched by number for adoption +
#                provenance checks (is it already claimed by a foreign marker?).
def existing_issues(gh, link_numbers = [])
  index = {}
  link_state = {}
  to_rec = lambda do |issue|
    body = issue['body'].to_s
    rec = {
      'number'    => issue['number'],
      'state'     => issue['state'].to_s.downcase,
      'labels'    => (issue['labels'] || []).map { |l| l['name'] },
      'body'      => body,
      'marker_id' => body[/<!-- backlog-id: (T-\d+) -->/, 1]
    }
    index[rec['marker_id']] = rec if rec['marker_id']
    rec
  end

  raw = gh.read(
    ['issue', 'list', '--label', 'agent-ready', '--state', 'all', '--limit', '500',
     '--json', 'number,body,state,labels'],
    default: '[]'
  )
  begin
    JSON.parse(raw).each { |issue| to_rec.call(issue) }
  rescue JSON::ParserError
    # leave index empty; adoption/create still work off link_state
  end

  link_numbers.compact.map(&:to_i).uniq.each do |n|
    raw1 = gh.read(['issue', 'view', n.to_s, '--json', 'number,body,state,labels'], default: '')
    next if raw1.strip.empty?

    begin
      link_state[n] = to_rec.call(JSON.parse(raw1))
    rescue JSON::ParserError
      next
    end
  end

  [index, link_state]
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
  tasks = data['tasks'] || []
  link_numbers = tasks.map { |t| t.dig('links', 'issue') }.compact
  index, link_state = existing_issues(gh, link_numbers)
  created = adopted = updated = closed = 0

  tasks.each do |task|
    id        = task['id']
    title     = task['title']
    want_open = OPEN_STATUSES.include?(task['status'])
    lnk       = task.dig('links', 'issue')
    issue     = index[id] # already marker-tracked?

    # Adoption: task points at an existing issue not yet marker-tracked. Adopt it
    # (inject the managed block) instead of creating a duplicate — unless the
    # issue already carries a DIFFERENT marker (foreign provenance → refuse).
    if issue.nil? && lnk
      ls = link_state[lnk.to_i]
      if ls.nil?
        warn "task #{id}: links.issue ##{lnk} not found — creating a new issue instead."
      elsif ls['marker_id'] && ls['marker_id'] != id
        warn "task #{id}: refusing to adopt ##{lnk} — already marked #{ls['marker_id']} (foreign). Skipping."
        next
      else
        issue = ls.merge('adopt' => true)
      end
    end

    if issue.nil?
      next unless want_open # never create an issue for an already-done task

      args = ['issue', 'create', '--title', title, '--body', render_body(task)]
      managed_labels(task).each { |l| args.push('--label', l) }
      created += 1 if gh.write(args)
      next
    end

    number = issue['number'].to_s
    if lnk
      # Human-authored (adopted) issue: NEVER overwrite its title/body — only
      # upsert the managed block (preserving the author's report) + labels.
      gh.write(['issue', 'edit', number, '--body', upsert_managed_block(issue['body'], task)] +
               label_args(managed_labels(task), issue['labels']))
      issue['adopt'] ? (adopted += 1) : (updated += 1)
    else
      # Bot-created issue: fully sync-owned title + body.
      gh.write(['issue', 'edit', number, '--title', title, '--body', render_body(task)] +
               label_args(managed_labels(task), issue['labels']))
      updated += 1
    end

    if want_open && issue['state'] != 'open'
      gh.write(['issue', 'reopen', number])
    elsif !want_open && issue['state'] != 'closed'
      gh.write(['issue', 'close', number, '--reason', 'completed'])
      closed += 1
    end
  end

  puts "Backlog sync complete: #{created} created, #{adopted} adopted, #{updated} updated, #{closed} closed."
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
