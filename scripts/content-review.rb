#!/usr/bin/env ruby
# frozen_string_literal: true

# =============================================================================
# content-review.rb
# =============================================================================
#
# Deterministic (no-API) tier of the AI content reviewer framework.
#
# Scores Jekyll content files for SEO and content quality using the thresholds
# in .github/config/content_review.yml and the required-field schema in
# .github/config/frontmatter_schema.yml. Designed to run anywhere — locally,
# in CI, and on fork PRs without secrets — so contributors get fast, mechanical
# feedback before (and independently of) the Claude Code agent tier.
#
# Usage:
#   ruby scripts/content-review.rb --changed --base origin/main   # diff vs base
#   ruby scripts/content-review.rb --files "a.md b.md"            # explicit files
#   ruby scripts/content-review.rb --files a.md --json out.json --summary out.md
#   ruby scripts/content-review.rb --changed --strict            # non-zero on fail
#
# Options:
#   --files LIST      Space/newline-separated markdown files to review
#   --changed         Review files changed vs --base (git diff)
#   --base REF        Base git ref for --changed (default: origin/main)
#   --config PATH     content_review.yml (default: .github/config/content_review.yml)
#   --schema PATH     frontmatter_schema.yml (default: .github/config/frontmatter_schema.yml)
#   --json PATH       Write machine-readable JSON results
#   --summary PATH    Write a Markdown summary (suitable for a PR comment)
#   --strict          Exit non-zero if any file scores below the fail threshold
#   --quiet           Suppress the human-readable stdout table
#   --help            Show this help
#
# Exit codes:
#   0  clean (or warn mode)
#   1  one or more files below fail threshold (only when --strict)
#   2  invalid arguments / no files
#   3  config or parse error
#
# No gem dependencies beyond the Ruby stdlib.
# =============================================================================

require 'yaml'
require 'json'
require 'optparse'
require 'date'

# Content is UTF-8; force it so checks don't trip on emoji/accents under a
# US-ASCII locale (common on minimal CI runners).
Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8

ROOT = File.expand_path('..', __dir__)

# --- Severity helpers --------------------------------------------------------
SEVERITIES = %w[error warning info].freeze

Issue = Struct.new(:severity, :category, :message)

# --- Options -----------------------------------------------------------------
options = {
  files: nil,
  changed: false,
  base: ENV['CONTENT_REVIEW_BASE'] || 'origin/main',
  config: File.join(ROOT, '.github', 'config', 'content_review.yml'),
  schema: File.join(ROOT, '.github', 'config', 'frontmatter_schema.yml'),
  json: nil,
  summary: nil,
  strict: false,
  quiet: false
}

parser = OptionParser.new do |o|
  o.banner = 'Usage: ruby scripts/content-review.rb [options]'
  o.on('--files LIST', 'Files to review (space/newline separated)') { |v| options[:files] = v }
  o.on('--changed', 'Review files changed vs --base') { options[:changed] = true }
  o.on('--base REF', 'Base git ref for --changed') { |v| options[:base] = v }
  o.on('--config PATH', 'content_review.yml path') { |v| options[:config] = v }
  o.on('--schema PATH', 'frontmatter_schema.yml path') { |v| options[:schema] = v }
  o.on('--json PATH', 'Write JSON results') { |v| options[:json] = v }
  o.on('--summary PATH', 'Write Markdown summary') { |v| options[:summary] = v }
  o.on('--strict', 'Exit non-zero on failing files') { options[:strict] = true }
  o.on('--quiet', 'Suppress stdout table') { options[:quiet] = true }
  o.on('-h', '--help', 'Show help') { puts o; exit 0 }
end

begin
  parser.parse!(ARGV)
rescue OptionParser::ParseError => e
  warn "Error: #{e.message}"
  warn parser
  exit 2
end

# --- Load configuration ------------------------------------------------------
def load_yaml(path)
  YAML.safe_load(File.read(path), permitted_classes: [Date, Time], aliases: true) || {}
rescue StandardError => e
  warn "Failed to read #{path}: #{e.message}"
  exit 3
end

unless File.exist?(options[:config])
  warn "Config not found: #{options[:config]}"
  exit 3
end

CONFIG = load_yaml(options[:config])
SCHEMA = File.exist?(options[:schema]) ? load_yaml(options[:schema]) : {}

# Backward-compatible: v2 uses `defaults:`, but fall back to top-level keys.
DEFAULTS = CONFIG['defaults'] || CONFIG
COLLECTION_CFG = CONFIG['collections'] || {}
DEFAULT_FAIL_UNDER = ((DEFAULTS['scoring'] || {})['fail_under'] || 70).to_i

# Recursively merge `override` onto `base` (override wins; hashes merge deep).
def deep_merge(base, override)
  return base if override.nil?
  return override unless base.is_a?(Hash) && override.is_a?(Hash)

  merged = base.dup
  override.each do |k, v|
    merged[k] = merged.key?(k) ? deep_merge(merged[k], v) : v
  end
  merged
end

# Effective rules for a collection = deep-merge(defaults, collections[name]).
# `collections.*` in frontmatter_schema.yml may differ from content_review.yml;
# here we only merge the review config, not the schema.
def effective_config(collection)
  base = DEFAULTS
  override = collection ? (COLLECTION_CFG[collection] || {}) : {}
  deep_merge(base, override)
end

# --- Resolve the list of files ----------------------------------------------
def git_changed_files(base)
  merge_base = `git merge-base #{base} HEAD 2>/dev/null`.strip
  ref = merge_base.empty? ? base : merge_base
  out = `git diff --name-only --diff-filter=ACMR #{ref} HEAD 2>/dev/null`
  out.split("\n").map(&:strip).reject(&:empty?)
end

def excluded?(path, config)
  patterns = (config['scope'] || {})['exclude'] || []
  patterns.any? { |g| File.fnmatch(g, path, File::FNM_PATHNAME | File::FNM_EXTGLOB) }
end

def included?(path, config)
  patterns = (config['scope'] || {})['include'] || []
  patterns.any? { |g| File.fnmatch(g, path, File::FNM_PATHNAME | File::FNM_EXTGLOB) }
end

raw_files =
  if options[:files]
    options[:files].split(/[\s\n]+/).map(&:strip).reject(&:empty?)
  elsif options[:changed]
    git_changed_files(options[:base])
  else
    warn 'Nothing to review: pass --files or --changed.'
    exit 2
  end

files = raw_files
        .select { |f| f.end_with?('.md') }
        .select { |f| included?(f, CONFIG) && !excluded?(f, CONFIG) }
        .select { |f| File.exist?(File.join(ROOT, f)) || File.exist?(f) }
        .uniq

if files.empty?
  puts 'No in-scope content files to review.'
  # Still emit empty artifacts so downstream steps don't choke.
  File.write(options[:json], JSON.pretty_generate({ 'files' => [], 'average_score' => nil })) if options[:json]
  File.write(options[:summary], "## 📝 Content Review\n\nNo in-scope content files changed.\n") if options[:summary]
  exit 0
end

# --- Front matter + body parsing --------------------------------------------
def split_front_matter(text)
  if text =~ /\A---\s*\n(.*?)\n---\s*\n?(.*)\z/m
    [Regexp.last_match(1), Regexp.last_match(2)]
  else
    [nil, text]
  end
end

def parse_front_matter(yaml_text)
  return {} if yaml_text.nil? || yaml_text.strip.empty?

  YAML.safe_load(yaml_text, permitted_classes: [Date, Time], aliases: true) || {}
rescue StandardError
  nil # signals a parse error
end

# Remove fenced code blocks so prose checks don't trip on code.
def strip_code_fences(body)
  body.gsub(/^```.*?^```/m, '').gsub(/`[^`]*`/, '')
end

# Remove Liquid {% raw %}...{% endraw %} regions. Content inside them is a
# literal display example (often showing ``` fences or {{ }} tags), not real
# page structure, so it must not be counted by the quality/style checks.
def strip_liquid_raw(body)
  body.gsub(/\{%-?\s*raw\s*-?%\}.*?\{%-?\s*endraw\s*-?%\}/m, '')
end

# --- Collection detection ----------------------------------------------------
def detect_collection(path, schema)
  collections = schema['collections'] || {}
  # Match specific collections before the generic top-level `pages` pattern.
  ordered = collections.sort_by { |name, _| name == 'pages' ? 1 : 0 }
  ordered.each do |name, spec|
    pattern = spec['path_pattern']
    next unless pattern

    return name if File.fnmatch(pattern, path, File::FNM_PATHNAME | File::FNM_EXTGLOB)
  end
  nil
end

# --- Individual checks -------------------------------------------------------
def check_frontmatter(fm, collection, schema)
  issues = []
  return [Issue.new('error', 'frontmatter', 'No front matter block found')] if fm.nil?
  return [Issue.new('error', 'frontmatter', 'Front matter is not valid YAML')] if fm == :parse_error

  spec = (schema['collections'] || {})[collection]
  required = spec ? (spec['required'] || []) : []
  required.each do |field|
    val = fm[field]
    if val.nil? || (val.respond_to?(:empty?) && val.empty?)
      issues << Issue.new('error', 'frontmatter', "Missing required field: `#{field}`")
    end
  end

  # categories/tags should be lists, not bare strings.
  %w[categories tags].each do |field|
    next unless fm.key?(field)

    issues << Issue.new('warning', 'frontmatter', "`#{field}` should be a YAML list, not a bare string") if fm[field].is_a?(String)
  end
  issues
end

def check_seo(fm, seo)
  issues = []
  return issues if fm.nil? || fm == :parse_error

  title = fm['title'].to_s
  unless title.empty?
    t = (seo['title'] || {})
    min = (t['min_length'] || 30).to_i
    max = (t['max_length'] || 60).to_i
    if title.length < min
      issues << Issue.new('warning', 'seo', "Title is #{title.length} chars (aim for #{min}–#{max})")
    elsif title.length > max
      issues << Issue.new('warning', 'seo', "Title is #{title.length} chars — over #{max}, will truncate in search results")
    end
  end

  desc = fm['description'].to_s
  d = (seo['description'] || {})
  dmin = (d['min_length'] || 120).to_i
  dmax = (d['max_length'] || 160).to_i
  if desc.empty?
    issues << Issue.new('warning', 'seo', 'No meta description — add a 120–160 char `description`')
  elsif desc.length < dmin
    issues << Issue.new('warning', 'seo', "Description is #{desc.length} chars (aim for #{dmin}–#{dmax})")
  elsif desc.length > dmax
    issues << Issue.new('warning', 'seo', "Description is #{desc.length} chars — over #{dmax}, will truncate")
  end

  kw = (seo['keywords'] || {})
  if kw['recommended']
    keywords = fm['keywords']
    if keywords.nil?
      issues << Issue.new('info', 'seo', 'No `keywords` — a 3–10 item list aids AI-engine optimization (AIEO)')
    elsif keywords.is_a?(Array)
      kmin = (kw['min'] || 3).to_i
      kmax = (kw['max'] || 10).to_i
      issues << Issue.new('info', 'seo', "Only #{keywords.length} keyword(s) — aim for #{kmin}–#{kmax}") if keywords.length < kmin
      issues << Issue.new('info', 'seo', "#{keywords.length} keywords — trim to #{kmax} most relevant") if keywords.length > kmax
    end
  end

  if seo['require_preview_image']
    has_image = %w[preview image og_image].any? { |k| !fm[k].to_s.empty? }
    issues << Issue.new('info', 'seo', 'No preview/social image set') unless has_image
  end
  issues
end

def check_quality(body, quality)
  issues = []
  # Liquid {% raw %} examples are display-only — exclude them from every check.
  body = strip_liquid_raw(body)
  prose = strip_code_fences(body)
  words = prose.split(/\s+/).reject(&:empty?)
  wc = words.length

  min_wc = (quality['min_word_count'] || 100).to_i
  max_wc = (quality['max_word_count'] || 3500).to_i
  if wc < min_wc
    issues << Issue.new('warning', 'quality', "Only ~#{wc} words — below the #{min_wc}-word minimum (reads as a stub)")
  elsif wc > max_wc
    issues << Issue.new('info', 'quality', "~#{wc} words — over #{max_wc}; consider splitting into multiple pages")
  end

  # Heading structure (ignore headings inside code fences).
  headings = body.gsub(/^```.*?^```/m, '').scan(/^(#{'#'}{1,6})\s+\S/).map { |m| m[0].length }
  h2_plus = headings.count { |lvl| lvl >= 2 }
  min_h2 = (quality['min_h2_headings'] || 1).to_i
  issues << Issue.new('info', 'quality', "Fewer than #{min_h2} H2 heading(s) — add sections for scannability") if h2_plus < min_h2

  max_skip = (quality['max_heading_skip'] || 1).to_i
  headings.each_cons(2) do |a, b|
    if b - a > max_skip
      issues << Issue.new('warning', 'quality', "Heading level jumps from H#{a} to H#{b} — don't skip levels")
      break
    end
  end

  # Code fences must declare a language.
  if quality['require_code_fence_language']
    # Only opening fences need a language; toggle state so the matching closing
    # fence (a bare ```) is not counted.
    in_fence = false
    body.each_line do |line|
      next unless line =~ /^\s*```(.*)$/

      if in_fence
        in_fence = false # closing fence — no language required
      else
        in_fence = true
        issues << Issue.new('info', 'quality', 'Code fence without a language (use ```bash, ```ruby, …)') if Regexp.last_match(1).strip.empty?
      end
    end
  end

  # Images must have alt text.
  if quality['require_image_alt_text']
    body.scan(/!\[(.*?)\]\(([^)]*)\)/).each do |alt, src|
      issues << Issue.new('warning', 'accessibility', "Image missing alt text: `#{src}`") if alt.strip.empty?
    end
  end

  # Bare URLs.
  if quality['flag_bare_urls']
    bare = strip_code_fences(body).scan(%r{(?<![("<\]])\bhttps?://[^\s)>\]]+}).reject { |u| u.include?('](') }
    issues << Issue.new('info', 'quality', "#{bare.length} bare URL(s) — wrap as [text](url)") unless bare.empty?
  end
  issues
end

def check_style(body, style)
  issues = []
  prose = strip_code_fences(strip_liquid_raw(body))
  (style['terminology'] || {}).each do |wrong, right|
    next if wrong.to_s.empty?

    if prose.match?(/\b#{Regexp.escape(wrong)}\b/)
      issues << Issue.new('info', 'style', "Use \"#{right}\" instead of \"#{wrong}\"")
    end
  end
  issues
end

# --- Scoring -----------------------------------------------------------------
def score_for(issues, weights)
  penalty = issues.sum { |i| (weights[i.severity] || 0).to_i }
  [100 - penalty, 0].max
end

def verdict(score, scoring)
  th = scoring['thresholds'] || {}
  return '🟢 excellent' if score >= (th['excellent'] || 90).to_i
  return '🟡 acceptable' if score >= (th['acceptable'] || 70).to_i

  '🔴 needs work'
end

# --- Run ---------------------------------------------------------------------
results = []

files.each do |rel|
  abs = File.exist?(rel) ? rel : File.join(ROOT, rel)
  text = File.read(abs, encoding: 'UTF-8')
  fm_text, body = split_front_matter(text)
  fm = parse_front_matter(fm_text)
  fm = :parse_error if fm.nil? && !fm_text.nil?

  collection = detect_collection(rel, SCHEMA)
  eff = effective_config(collection)
  weights = (eff['scoring'] || {})['weights'] || { 'error' => 15, 'warning' => 5, 'info' => 1 }
  fail_under = ((eff['scoring'] || {})['fail_under'] || DEFAULT_FAIL_UNDER).to_i

  issues = []
  issues.concat(check_frontmatter(fm == :parse_error ? :parse_error : fm, collection, SCHEMA))
  issues.concat(check_seo(fm, eff['seo'] || {}))
  issues.concat(check_quality(body, eff['quality'] || {}))
  issues.concat(check_style(body, eff['style'] || {}))

  score = score_for(issues, weights)
  results << {
    'file' => rel,
    'collection' => collection,
    'score' => score,
    'fail_under' => fail_under,
    'verdict' => verdict(score, eff['scoring'] || {}),
    'instructions' => eff['instructions'] || [],
    'issues' => issues.map { |i| { 'severity' => i.severity, 'category' => i.category, 'message' => i.message } }
  }
end

avg = results.empty? ? nil : (results.sum { |r| r['score'] } / results.length.to_f).round(1)
failing = results.select { |r| r['score'] < r['fail_under'] }

# --- Markdown summary --------------------------------------------------------
def render_summary(results, avg, fail_under)
  lines = []
  lines << '## 📝 AI Content Review — deterministic checks'
  lines << ''
  lines << "Reviewed **#{results.length}** file(s) · average score **#{avg}/100** · pass threshold **#{fail_under}** (per-collection)."
  lines << ''
  lines << '| File | Collection | Score | Verdict |'
  lines << '| --- | --- | ---: | --- |'
  results.sort_by { |r| r['score'] }.each do |r|
    lines << "| `#{r['file']}` | #{r['collection'] || '—'} | #{r['score']}/#{r['fail_under']} | #{r['verdict']} |"
  end
  lines << ''

  emoji = { 'error' => '❌', 'warning' => '⚠️', 'info' => 'ℹ️' }
  results.each do |r|
    next if r['issues'].empty?

    lines << "<details><summary><code>#{r['file']}</code> — #{r['issues'].length} item(s), score #{r['score']}</summary>"
    lines << ''
    r['issues'].sort_by { |i| SEVERITIES.index(i['severity']) || 9 }.each do |i|
      lines << "- #{emoji[i['severity']] || '•'} **#{i['category']}** — #{i['message']}"
    end
    lines << ''
    lines << '</details>'
    lines << ''
  end

  lines << '---'
  lines << '_Deterministic tier (frontmatter + SEO + structure). The Claude Code'
  lines << 'content-reviewer agent covers tone, clarity, and accuracy separately._'
  lines.join("\n") + "\n"
end

summary_md = render_summary(results, avg, DEFAULT_FAIL_UNDER)

# --- Outputs -----------------------------------------------------------------
File.write(options[:json], JSON.pretty_generate({ 'files' => results, 'average_score' => avg, 'default_fail_under' => DEFAULT_FAIL_UNDER })) if options[:json]
File.write(options[:summary], summary_md) if options[:summary]

unless options[:quiet]
  results.sort_by { |r| r['score'] }.each do |r|
    puts "#{r['verdict'].ljust(14)} #{r['score'].to_s.rjust(3)}  #{r['file']}"
    r['issues'].each { |i| puts "    [#{i['severity']}] #{i['category']}: #{i['message']}" }
  end
  puts ''
  puts "Average: #{avg}/100  (#{results.length} file(s), default threshold #{DEFAULT_FAIL_UNDER})"
  puts "Failing: #{failing.map { |r| r['file'] }.join(', ')}" unless failing.empty?
end

exit 1 if options[:strict] && !failing.empty?
exit 0
