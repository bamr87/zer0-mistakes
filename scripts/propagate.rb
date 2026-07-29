#!/usr/bin/env ruby
# frozen_string_literal: true

# =============================================================================
# scripts/propagate.rb — theme release fan-out
# =============================================================================
#
# Reads _data/consumers.yml (the downstream registry) and either REPORTS which
# consumers have drifted behind the current theme version, or DISPATCHES a
# `theme-release` event to each one so it opens its own bump PR.
#
# The problem this solves: a release used to end at RubyGems. Nothing told the
# five sites built on this theme that a new version existed, so their pins sat
# where someone last edited them by hand — all of them a full minor behind when
# 1.27.0 shipped.
#
# Dispatch, rather than this repo opening PRs directly, because every consumer
# gates differently: it-journey runs `make build-ci` + `make content-audit`,
# bashconsultants builds in Docker and runs its editorial lint, the org hubs
# re-roll member configs with provision-org-sites.rb. Each repo owns its own
# validation; this script only announces the release.
#
# Usage:
#   ruby scripts/propagate.rb                    # report drift (default)
#   ruby scripts/propagate.rb --format json      # machine-readable report
#   ruby scripts/propagate.rb --strict           # exit 1 if any consumer is behind
#   ruby scripts/propagate.rb --dispatch         # fire theme-release events
#   ruby scripts/propagate.rb --dispatch --dry-run
#
# Auth: uses `gh` when available, else GH_TOKEN / GITHUB_TOKEN / LIFECYCLE_PAT
# against the REST API. Reporting works unauthenticated for public repos;
# --dispatch always needs a token with `repo` scope on the target.
# =============================================================================

require 'yaml'
require 'json'
require 'net/http'
require 'uri'
require 'optparse'
require 'base64'

REPO_ROOT = File.expand_path('..', __dir__)
REGISTRY  = File.join(REPO_ROOT, '_data', 'consumers.yml')
VERSION_RB = File.join(REPO_ROOT, 'lib', 'jekyll-theme-zer0', 'version.rb')

# Version-bearing patterns per pin kind. `theme_name` and `path_gem` carry no
# version by design — they are tracked so a bump does not miss the file that
# activates the theme, but they never report drift.
PIN_PATTERNS = {
  'remote_theme' => /remote_theme\s*:\s*["']?bamr87\/zer0-mistakes(?:@v?([0-9][^"'\s]*))?/,
  'hub_registry' => /theme_repo\s*:\s*["']?bamr87\/zer0-mistakes(?:@v?([0-9][^"'\s]*))?/,
  'gem_constraint' => /gem\s+["']jekyll-theme-zer0["']\s*,\s*["'][^0-9]*([0-9][^"']*)["']/,
  'theme_name' => nil,
  'path_gem' => nil
}.freeze

options = {
  format: 'text', strict: false, dispatch: false, dry_run: false, version: nil
}

OptionParser.new do |o|
  o.banner = 'Usage: ruby scripts/propagate.rb [options]'
  o.on('--dispatch', 'Send theme-release events instead of reporting') { options[:dispatch] = true }
  o.on('--dry-run', 'Show what --dispatch would send; send nothing') { options[:dry_run] = true }
  o.on('--strict', 'Exit 1 when a consumer is behind the current version') { options[:strict] = true }
  o.on('--format FMT', %w[text json github], 'Output format (text|json|github)') { |v| options[:format] = v }
  o.on('--version VER', 'Theme version to compare against (default: version.rb)') { |v| options[:version] = v }
  o.on('-h', '--help', 'Show this help') { puts o; exit 0 }
end.parse!

# -----------------------------------------------------------------------------
def theme_version
  content = File.read(VERSION_RB)
  content[/VERSION\s*=\s*"([^"]+)"/, 1] or abort('could not parse version.rb')
end

def gh_available?
  return @gh_available unless @gh_available.nil?

  @gh_available = system('command -v gh > /dev/null 2>&1')
end

def token
  ENV['GH_TOKEN'] || ENV['GITHUB_TOKEN'] || ENV['LIFECYCLE_PAT']
end

def http_get(uri, headers = {})
  req = Net::HTTP::Get.new(uri)
  headers.each { |k, v| req[k] = v }
  res = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 10, read_timeout: 15) do |http|
    http.request(req)
  end
  res.is_a?(Net::HTTPSuccess) ? res.body : nil
rescue StandardError
  nil
end

# Fetch one file from a consumer repo. Returns nil (never raises) when the repo,
# branch, or path is unreachable — an unreachable consumer must degrade to
# "unknown" in the report, not take the whole fan-out down.
#
# Two transports, in order of capability:
#   1. api.github.com/contents with a token — the only path that reads PRIVATE
#      consumer repos, and the one CI uses.
#   2. raw.githubusercontent.com unauthenticated — public repos only.
# Never send the token to raw.githubusercontent.com: a token that is valid for
# the API but not for raw turns a public 200 into a 404, which silently reports
# every consumer as unreachable.
def fetch_file(repo, branch, path)
  if gh_available?
    out = `gh api "repos/#{repo}/contents/#{path}?ref=#{branch}" --jq .content 2>/dev/null`
    return Base64.decode64(out) if $?.success? && !out.strip.empty?
  end

  if token
    body = http_get(
      URI("https://api.github.com/repos/#{repo}/contents/#{path}?ref=#{branch}"),
      'Authorization' => "Bearer #{token}",
      'Accept' => 'application/vnd.github.raw',
      'X-GitHub-Api-Version' => '2022-11-28'
    )
    return body if body
  end

  http_get(URI("https://raw.githubusercontent.com/#{repo}/#{branch}/#{path}"))
end

def extract_pin(kind, content)
  pattern = PIN_PATTERNS[kind]
  return { versioned: false, version: nil } if pattern.nil?
  return { versioned: true, version: nil, missing: true } if content.nil?

  match = content.match(pattern)
  return { versioned: true, version: nil, missing: true } if match.nil?

  # A matched pin with no captured version is a deliberate floating ref
  # (`remote_theme: bamr87/zer0-mistakes`), not a parse failure.
  { versioned: true, version: match[1] }
end

def compare(pinned, current)
  return :floating if pinned.nil?

  a = Gem::Version.new(pinned.sub(/\A[v=~> ]+/, ''))
  b = Gem::Version.new(current)
  return :current if a == b
  return :behind if a < b

  :ahead
rescue ArgumentError
  :unknown
end

def dispatch(repo, event, version, dry_run)
  payload = {
    event_type: event,
    client_payload: { version: version, theme: 'bamr87/zer0-mistakes', tag: "v#{version}" }
  }

  if dry_run
    puts "  [DRY RUN] POST repos/#{repo}/dispatches #{payload[:client_payload].to_json}"
    return :dry_run
  end

  unless token
    warn "  ✗ #{repo}: no token (GH_TOKEN / GITHUB_TOKEN / LIFECYCLE_PAT) — cannot dispatch"
    return :no_token
  end

  uri = URI("https://api.github.com/repos/#{repo}/dispatches")
  req = Net::HTTP::Post.new(uri)
  req['Authorization'] = "Bearer #{token}"
  req['Accept'] = 'application/vnd.github+json'
  req['Content-Type'] = 'application/json'
  req.body = payload.to_json
  res = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 10, read_timeout: 15) do |http|
    http.request(req)
  end

  if res.is_a?(Net::HTTPSuccess)
    :dispatched
  else
    warn "  ✗ #{repo}: dispatch failed (HTTP #{res.code})"
    :failed
  end
rescue StandardError => e
  warn "  ✗ #{repo}: dispatch error (#{e.class})"
  :failed
end

# -----------------------------------------------------------------------------
abort("registry not found: #{REGISTRY}") unless File.exist?(REGISTRY)

registry = YAML.load_file(REGISTRY)
defaults = registry['defaults'] || {}
current  = options[:version] || theme_version
consumers = registry['consumers'] || []

results = consumers.map do |consumer|
  repo   = consumer['repo']
  branch = consumer['branch'] || defaults['branch'] || 'main'

  pins = (consumer['pins'] || []).map do |pin|
    kind = pin['kind']
    content = PIN_PATTERNS[kind].nil? ? nil : fetch_file(repo, branch, pin['file'])
    info = extract_pin(kind, content)
    status = if !info[:versioned] then :not_versioned
             elsif info[:missing] then :unreachable
             else compare(info[:version], current)
             end
    { 'file' => pin['file'], 'kind' => kind, 'pinned' => info[:version], 'status' => status.to_s }
  end

  versioned = pins.reject { |p| %w[not_versioned unreachable].include?(p['status']) }
  overall = if versioned.any? { |p| p['status'] == 'behind' } then :behind
            elsif versioned.any? { |p| p['status'] == 'floating' } then :floating
            elsif versioned.empty? then :unknown
            elsif versioned.all? { |p| p['status'] == 'current' } then :current
            else :mixed
            end

  {
    'repo' => repo, 'mode' => consumer['mode'], 'dispatch' => consumer['dispatch'] == true,
    'status' => overall.to_s, 'pins' => pins
  }
end

behind = results.select { |r| r['status'] == 'behind' || r['status'] == 'mixed' }

# -----------------------------------------------------------------------------
if options[:dispatch]
  event = defaults['dispatch_event'] || 'theme-release'
  puts "Dispatching #{event} v#{current} to #{results.count { |r| r['dispatch'] }} consumer(s)"
  results.each do |r|
    unless r['dispatch']
      puts "  – #{r['repo']}: skipped (dispatch: false — #{r['mode']})"
      next
    end
    outcome = dispatch(r['repo'], event, current, options[:dry_run])
    puts "  ✓ #{r['repo']}: #{outcome}" if %i[dispatched dry_run].include?(outcome)
  end
  exit 0
end

case options[:format]
when 'json'
  puts JSON.pretty_generate({ 'theme_version' => current, 'consumers' => results })
when 'github'
  results.each do |r|
    next unless %w[behind mixed].include?(r['status'])

    stale = r['pins'].select { |p| p['status'] == 'behind' }
                     .map { |p| "#{p['file']} (#{p['pinned']})" }.join(', ')
    puts "::warning::#{r['repo']} is behind v#{current} — #{stale}"
  end
  puts "::notice::#{behind.size}/#{results.size} consumers behind v#{current}"
else
  puts "Theme version: #{current}"
  puts
  results.each do |r|
    marker = { 'current' => '✓', 'behind' => '✗', 'floating' => '~', 'mixed' => '✗' }[r['status']] || '?'
    puts format('%s %-38s %-22s %s', marker, r['repo'], r['mode'], r['status'])
    r['pins'].each do |p|
      detail = case p['status']
               when 'not_versioned' then 'no version (tracked only)'
               when 'unreachable' then 'unreachable — check repo/branch/path'
               when 'floating' then 'floating on main'
               else p['pinned']
               end
      puts format('    %-24s %-16s %s', p['file'], p['kind'], detail)
    end
    puts
  end
  puts "#{behind.size}/#{results.size} consumer(s) behind v#{current}"
end

exit 1 if options[:strict] && !behind.empty?
