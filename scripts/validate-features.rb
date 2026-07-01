#!/usr/bin/env ruby
# frozen_string_literal: true

# ---------------------------------------------------------------------------
# validate-features.rb — canonical integrity checker for the feature registry.
#
# Single source of truth shared by `scripts/bin/validate` (preflight) and
# `test/test_features.sh` (the `features` test suite). Governance:
# .github/instructions/features.instructions.md.
#
# HARD failures (exit 1):
#   - features/features.yml and _data/features.yml are not byte-identical
#   - the header is missing a `# Last Updated:` line
#   - schema violations (missing required field, bad id/version, duplicate id)
#   - implemented:false without `removed_in:`
#   - a reference path on an ACTIVE feature does not exist in the repo
#   - missing/malformed `provenance:` block on an active feature (since PR B)
#   - missing/unresolvable `tests:` linkage on an active feature (since PR C):
#     every entry must be a real test path or `{na: reason}`
#
# WARNINGS (non-fatal unless FEATURES_STRICT=1):
#   - header `# Version:` not tracking the gem version
#   - id gaps (IDs are never reused, but gaps are worth a human glance)
#
# Portable across Ruby 2.6 (macOS system) and 3.x (CI/Docker).
# ---------------------------------------------------------------------------

require 'date'
require 'yaml'

MASTER = 'features/features.yml'
MIRROR = '_data/features.yml'
REQUIRED = %w[id title description implemented version link docs tags date].freeze
STRICT = ENV['FEATURES_STRICT'] == '1'

def die(msg)
  warn "  \e[31m✗\e[0m #{msg}"
  exit 1
end

# Ruby 3.1+ defaults YAML.load_file to safe loading (rejects Date); 2.6 does
# not accept the keywords. Try the strict form, fall back for old Ruby.
def load_yaml(path)
  YAML.load_file(path, permitted_classes: [Date, Time], aliases: true)
rescue ArgumentError
  YAML.load_file(path)
end

def ref_paths(refs)
  return [] unless refs.is_a?(Hash)

  refs.values.flat_map { |v| v.is_a?(Array) ? v : [v] }.select { |v| v.is_a?(String) }
end

[MASTER, MIRROR].each { |f| die "#{f} is missing" unless File.file?(f) }

# 1. Sync contract — the two registries must be byte-identical.
if File.binread(MASTER) != File.binread(MIRROR)
  die "#{MASTER} and #{MIRROR} differ — run `cp #{MASTER} #{MIRROR}` (must be byte-identical)"
end

data = load_yaml(MIRROR)
feats = data && data['features']
die 'top-level `features:` list missing' unless feats.is_a?(Array)

warnings = []

# Header sanity.
header = File.foreach(MIRROR).first(8).join
gem_version = File.read('lib/jekyll-theme-zer0/version.rb')[/VERSION\s*=\s*"([^"]+)"/, 1]
warnings << "header `# Version:` should match gem version #{gem_version}" unless header.include?("# Version: #{gem_version}")
die 'header missing `# Last Updated: YYYY-MM-DD` line' unless header =~ /# Last Updated: \d{4}-\d{2}-\d{2}/

seen = {}
feats.each_with_index do |f, i|
  die "entry ##{i} is not a mapping" unless f.is_a?(Hash)
  id = f['id'] || "(index #{i})"

  REQUIRED.each do |key|
    val = f[key]
    die "#{id}: required field `#{key}` is missing/empty" if val.nil? || (val.respond_to?(:empty?) && val.empty?)
  end

  # Title/description are rendered UNwrapped into HTML on /features/; a raw
  # angle bracket (e.g. "/authors/<key>/") becomes a stray tag that swallows
  # every following card. Keep them plain prose.
  %w[title description].each do |key|
    die "#{id}: `#{key}` must not contain raw `<`/`>` (breaks HTML on /features/ — use :key or &lt;)" if f[key].to_s =~ /[<>]/
  end

  die "#{id}: id must match ZER0-NNN" unless f['id'] =~ /\AZER0-\d{3}\z/
  die "#{id}: duplicate id" if seen[f['id']]
  seen[f['id']] = true
  die "#{id}: version must be X.Y.Z" unless f['version'].to_s =~ /\A\d+\.\d+\.\d+/
  die "#{id}: tags must be a non-empty list" unless f['tags'].is_a?(Array) && !f['tags'].empty?

  if f['implemented'] == false
    # Removed features keep their (now-absent) references for history but must
    # record when they went away.
    die "#{id}: implemented:false requires `removed_in:`" unless f['removed_in']
    next
  end

  # 2. Every reference path on an active feature must exist.
  ref_paths(f['references']).each do |p|
    ok = p.end_with?('/') ? File.directory?(p) : File.exist?(p)
    die "#{id}: reference path does not exist: #{p}" unless ok
  end

  # 3a. Provenance is REQUIRED on every active feature (backfilled in PR B).
  prov = f['provenance']
  die "#{id}: missing `provenance:` block" unless prov.is_a?(Hash)
  die "#{id}: provenance.introduced_in must be a version string" unless prov['introduced_in'].is_a?(String) && prov['introduced_in'] =~ /\A\d+\.\d+\.\d+/
  die "#{id}: provenance.commit must be a short git hash" unless prov['commit'].is_a?(String) && prov['commit'] =~ /\A[0-9a-f]{7,40}\z/
  die "#{id}: provenance.pr must be an integer or null" unless prov['pr'].nil? || prov['pr'].is_a?(Integer)
  die "#{id}: provenance.issue must be an integer or null" unless prov['issue'].nil? || prov['issue'].is_a?(Integer)

  # 3b. Test linkage is REQUIRED on every active feature (backfilled in PR C).
  tests = f['tests']
  die "#{id}: missing/empty `tests:` (a real test path or `{na: reason}`)" unless tests.is_a?(Array) && !tests.empty?
  tests.each do |t|
    if t.is_a?(String)
      die "#{id}: tests entry does not exist: #{t}" unless File.exist?(t)
    elsif t.is_a?(Hash)
      die "#{id}: tests `na:` must carry a non-empty reason" unless t['na'].is_a?(String) && !t['na'].strip.empty?
    else
      die "#{id}: tests entries must be a path string or `{na: reason}`"
    end
  end
end

# Sequential-id sanity (gaps allowed — never reuse an ID — but flagged).
nums = seen.keys.map { |k| k.split('-').last.to_i }.sort
gaps = (1..nums.last).to_a - nums
warnings << "id gaps (verify intentional): #{gaps.map { |n| format('ZER0-%03d', n) }.join(', ')}" unless gaps.empty?

unless warnings.empty?
  verbose = STRICT || ENV['FEATURES_VERBOSE'] == '1'
  prov  = warnings.count { |w| w.include?('provenance') }
  tests = warnings.count { |w| w.include?('`tests:`') }
  other = warnings.length - prov - tests
  warn "  \e[33m⚠\e[0m feature registry: #{warnings.length} warning(s) — " \
       "provenance:#{prov} tests:#{tests} other:#{other} (FEATURES_VERBOSE=1 for the full list)"
  warnings.each { |w| warn "    - #{w}" } if verbose
  die "#{warnings.length} warning(s) treated as errors (FEATURES_STRICT=1)" if STRICT
end

active = feats.count { |f| f['implemented'] != false }
puts "Feature registry valid: #{feats.length} entries (#{active} active), refs resolved, master/_data in sync"
