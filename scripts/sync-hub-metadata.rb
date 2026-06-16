#!/usr/bin/env ruby
# frozen_string_literal: true

# =============================================================================
# sync-hub-metadata.rb
# =============================================================================
#
# Refreshes the org content hub dashboard data. Content stays in the source
# repos (each publishes its own GitHub Pages site at
# https://<org>.github.io/<repo>/ — see scripts/provision-org-sites.rb); this
# script only gathers METADATA about them via the GitHub API:
#
#   _data/hub_index.yml       — per-repo stats for the /hub/ dashboard
#                               (page counts, sections, Pages status, links)
#   _data/navigation/hub.yml  — sidebar tree for the hub pages (sidebar.nav: hub)
#
# Nothing is cloned and no content is copied into this repository. Output is
# deterministic for unchanged sources, so the scheduled workflow only commits
# real changes.
#
# Usage:
#   ruby scripts/sync-hub-metadata.rb              # refresh dashboard data
#   ruby scripts/sync-hub-metadata.rb --check      # validate registry/output only (CI gate)
#   ruby scripts/sync-hub-metadata.rb --dry-run    # print planned writes, change nothing
#
# Requires the `gh` CLI (read scope). `--check` needs only the Ruby stdlib.
# =============================================================================

require 'optparse'
require 'fileutils'
require_relative 'lib/hub'

INDEX_FILE = File.join(Hub::ROOT, '_data', 'hub_index.yml')
NAV_FILE   = File.join(Hub::ROOT, '_data', 'navigation', 'hub.yml')

def check_generated_output
  errors = []
  if File.exist?(INDEX_FILE)
    index = Hub.load_yaml(INDEX_FILE)
    if index.is_a?(Hash) && index['repos'].is_a?(Array)
      index['repos'].each do |repo|
        errors << "hub_index repo #{repo['name']}: missing site_url" unless repo['site_url'].to_s.start_with?('https://')
      end
    else
      errors << '_data/hub_index.yml: missing repos list'
    end
  end
  errors
end

# Gathers everything the dashboard needs about one repo from the GitHub API:
# the markdown tree (for counts/sections), the Pages site status, and whether
# the Pages scaffold (_config.yml) has landed.
def inspect_repo(repo, cfg)
  org      = cfg['org']
  excludes = (cfg['defaults'] || {})['exclude'] || []

  tree  = Hub.gh_api("repos/#{org}/#{repo['name']}/git/trees/#{repo['branch']}?recursive=1")
  paths = (tree ? tree['tree'] : []).select { |e| e['type'] == 'blob' }.map { |e| e['path'] }
  files = Hub.content_paths(paths, excludes)

  pages    = Hub.gh_api("repos/#{org}/#{repo['name']}/pages")
  site_url = (pages && pages['html_url']) || "https://#{org}.github.io/#{repo['name']}/"
  site_url += '/' unless site_url.end_with?('/')

  sections = files.select { |f| f.include?('/') }.group_by { |f| f.split('/').first }.sort.map do |dir, pages_in|
    {
      'name'  => dir,
      'title' => section_title(org, repo, dir),
      'url'   => "#{site_url}#{dir}/",
      'count' => pages_in.count { |f| File.basename(f, '.md').downcase != 'index' }
    }
  end

  root_pages = files.reject { |f| f.include?('/') }
                    .reject { |f| %w[index readme].include?(File.basename(f, '.md').downcase) }
                    .map { |f| { 'title' => Hub.humanize(File.basename(f, '.md')), 'url' => Hub.page_url(site_url, f) } }

  {
    'name'          => repo['name'],
    'title'         => repo['title'] || repo['name'],
    'description'   => repo['description'].to_s,
    'url'           => "https://github.com/#{org}/#{repo['name']}",
    'site_url'      => site_url,
    'pages_enabled' => !pages.nil?,
    'scaffolded'    => paths.include?('_config.yml'),
    'branch'        => repo['branch'],
    'pushed_at'     => repo['pushed_at'].to_s,
    'page_count'    => files.size,
    'sections'      => sections,
    'root_pages'    => root_pages
  }
end

# Title of a section's index page (one contents API call), falling back to a
# humanized directory name.
def section_title(org, repo, dir)
  doc = Hub.gh_api("repos/#{org}/#{repo['name']}/contents/#{dir}/index.md?ref=#{repo['branch']}")
  return Hub.humanize(dir) unless doc && doc['content']

  Hub.title_of(Base64.decode64(doc['content']).force_encoding('utf-8'), dir)
rescue StandardError
  Hub.humanize(dir)
end

def build_index(cfg, repos)
  {
    'org'    => cfg['org'],
    'totals' => { 'repos' => repos.size, 'pages' => repos.sum { |r| r['page_count'] } },
    'repos'  => repos
  }
end

def build_nav(repos)
  items = [{ 'title' => 'Hub Dashboard', 'icon' => 'bi-grid-1x2', 'url' => '/hub/' }]
  repos.each do |repo|
    children = [{ 'title' => 'Site Home', 'url' => repo['site_url'] }]
    repo['root_pages'].each { |p| children << { 'title' => p['title'], 'url' => p['url'] } }
    repo['sections'].each   { |s| children << { 'title' => s['title'], 'url' => s['url'] } }
    items << {
      'title'    => repo['title'],
      'icon'     => 'bi-journal-richtext',
      'url'      => repo['site_url'],
      'children' => children
    }
  end
  items
end

def write_generated_yaml(path, data, dry_run:)
  content = Hub::GENERATED_HEADER + data.to_yaml.sub(/\A---\n/, '')
  if File.exist?(path) && File.read(path, encoding: 'utf-8') == content
    Hub.log_info "unchanged: #{path.sub("#{Hub::ROOT}/", '')}"
  elsif dry_run
    Hub.log_info "DRY: would write #{path.sub("#{Hub::ROOT}/", '')}"
  else
    FileUtils.mkdir_p(File.dirname(path))
    File.write(path, content)
    Hub.log_info "wrote #{path.sub("#{Hub::ROOT}/", '')}"
  end
end

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

options = { mode: :sync, dry_run: false }
OptionParser.new do |opts|
  opts.banner = 'Usage: ruby scripts/sync-hub-metadata.rb [--check|--dry-run]'
  opts.on('--check',   'validate registry and generated data, no writes') { options[:mode] = :check }
  opts.on('--dry-run', 'print planned actions without writing')           { options[:dry_run] = true }
end.parse!

cfg    = Hub.load_registry
errors = Hub.validate_registry(cfg)
errors += check_generated_output if options[:mode] == :check && errors.empty?

unless errors.empty?
  errors.each { |e| Hub.log_error(e) }
  exit 1
end

if options[:mode] == :check
  Hub.log_info 'hub registry and generated data are valid'
  exit 0
end

repos = Hub.discover_repos(cfg)
if repos.empty?
  Hub.log_warn 'no repos found (check org and exclude_repos)'
  exit 0
end

Hub.log_info "Inspecting #{repos.size} repo(s) in #{cfg['org']}: #{repos.map { |r| r['name'] }.join(', ')}"
inspected = repos.map do |repo|
  info = inspect_repo(repo, cfg)
  state = info['pages_enabled'] ? "live at #{info['site_url']}" : 'Pages NOT enabled'
  Hub.log_info "  #{info['name']}: #{info['page_count']} pages, #{info['sections'].size} sections — #{state}"
  info
end

write_generated_yaml(INDEX_FILE, build_index(cfg, inspected), dry_run: options[:dry_run])
write_generated_yaml(NAV_FILE, build_nav(inspected), dry_run: options[:dry_run])
Hub.log_info 'Hub metadata refresh complete'
