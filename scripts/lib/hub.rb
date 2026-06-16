# frozen_string_literal: true

# =============================================================================
# scripts/lib/hub.rb — shared helpers for the org content hub tooling
# =============================================================================
#
# Used by:
#   scripts/sync-hub-metadata.rb    dashboard data refresh (_data/hub_index.yml)
#   scripts/provision-org-sites.rb  Pages scaffold rollout to org repos
#
# The registry (_data/hub.yml) is the single source of truth; see its header
# for the architecture. Everything here is read-only with respect to this
# repository — callers decide what to write.
# =============================================================================

require 'yaml'
require 'json'
require 'date'
require 'base64'
require 'open3'

module Hub
  ROOT        = File.expand_path('../..', __dir__)
  CONFIG_FILE = File.join(ROOT, '_data', 'hub.yml')

  GENERATED_HEADER = <<~HEADER
    # =============================================================================
    # GENERATED FILE — do not edit by hand.
    # Regenerate with: ./scripts/sync-hub-metadata.sh
    # Source registry: _data/hub.yml
    # =============================================================================
  HEADER

  module_function

  def log_info(msg)
    puts "[INFO]  #{msg}"
  end

  def log_warn(msg)
    warn "[WARN]  #{msg}"
  end

  def log_error(msg)
    warn "[ERROR] #{msg}"
  end

  # Permit Date/Time; fall back for the older macOS system Ruby (2.6) whose
  # safe loader signature differs.
  def load_yaml(path)
    YAML.load_file(path, permitted_classes: [Date, Time])
  rescue ArgumentError
    YAML.load_file(path)
  end

  def run_cmd(*cmd)
    out, err, status = Open3.capture3(*cmd)
    raise "command failed: #{cmd.join(' ')}\n#{err}" unless status.success?

    out
  end

  # gh api wrapper returning parsed JSON, or nil on a 404.
  def gh_api(path)
    out, err, status = Open3.capture3('gh', 'api', path)
    return JSON.parse(out) if status.success?
    return nil if err.include?('404') || out.include?('"status": "404"')

    raise "gh api #{path} failed:\n#{err}"
  end

  def load_registry
    raise "registry not found: #{CONFIG_FILE}" unless File.exist?(CONFIG_FILE)

    load_yaml(CONFIG_FILE)
  end

  def validate_registry(cfg)
    return ['registry is not a YAML mapping'] unless cfg.is_a?(Hash)

    errors = []
    errors << 'org: must be a non-empty string' unless cfg['org'].is_a?(String) && !cfg['org'].strip.empty?

    if cfg.key?('auto_discover') && ![true, false].include?(cfg['auto_discover'])
      errors << 'auto_discover: must be true or false'
    end

    if cfg.key?('exclude_repos') && !(cfg['exclude_repos'].is_a?(Array) && cfg['exclude_repos'].all? { |r| r.is_a?(String) })
      errors << 'exclude_repos: must be a list of strings'
    end

    pages = cfg['pages'] || {}
    errors << 'pages: must be a mapping' unless pages.is_a?(Hash)
    if pages.is_a?(Hash) && !(pages['theme_repo'].is_a?(String) && pages['theme_repo'].include?('/'))
      errors << 'pages.theme_repo: must be an <owner>/<repo> string'
    end

    defaults = cfg['defaults'] || {}
    errors << 'defaults: must be a mapping' unless defaults.is_a?(Hash)
    if defaults.is_a?(Hash) && defaults.key?('exclude') &&
       !(defaults['exclude'].is_a?(Array) && defaults['exclude'].all? { |p| p.is_a?(String) })
      errors << 'defaults.exclude: must be a list of glob strings'
    end

    repos = cfg['repos'] || []
    errors << 'repos: must be a list' unless repos.is_a?(Array)
    if repos.is_a?(Array)
      repos.each_with_index do |repo, i|
        unless repo.is_a?(Hash) && repo['name'].is_a?(String) && !repo['name'].strip.empty?
          errors << "repos[#{i}]: needs a non-empty `name`"
          next
        end
        errors << "repos[#{i}] (#{repo['name']}): name contains unsafe characters" unless repo['name'].match?(%r{\A[\w.-]+\z})
      end
    end

    if cfg['auto_discover'] == false && repos.empty?
      errors << 'auto_discover is false but repos: is empty — nothing to include'
    end

    errors
  end

  # Org repos that are hub content sites, with per-repo registry overrides
  # merged on top. Requires `gh` unless auto_discover is false.
  def discover_repos(cfg)
    org      = cfg['org']
    excluded = cfg['exclude_repos'] || []
    manual   = (cfg['repos'] || []).map { |r| [r['name'], r] }.to_h

    discovered =
      if cfg.fetch('auto_discover', true)
        json = run_cmd('gh', 'repo', 'list', org, '--limit', '200',
                       '--json', 'name,description,defaultBranchRef,isArchived,pushedAt')
        JSON.parse(json).reject { |r| r['isArchived'] }.map do |r|
          {
            'name'        => r['name'],
            'description' => r['description'].to_s,
            'branch'      => r.dig('defaultBranchRef', 'name') || 'main',
            'pushed_at'   => r['pushedAt'].to_s
          }
        end
      else
        manual.values.map { |r| { 'branch' => 'main' }.merge(r) }
      end

    discovered
      .reject  { |r| excluded.include?(r['name']) }
      .map     { |r| r.merge(manual[r['name']] || {}) { |_k, auto, over| (over.nil? || over == '') ? auto : over } }
      .sort_by { |r| r['name'] }
  end

  def excluded?(rel, patterns)
    patterns.any? do |pat|
      rel == pat ||
        File.fnmatch?(pat, rel, File::FNM_PATHNAME) ||
        (pat.end_with?('/**') && rel.start_with?("#{pat[0..-4]}/"))
    end
  end

  def slugify(segment)
    segment.to_s.downcase.gsub(/[^a-z0-9]+/, '-').gsub(/\A-+|-+\z/, '')
  end

  def humanize(name)
    name.tr('-_', '  ').split.map(&:capitalize).join(' ')
  end

  FRONT_MATTER_RE = /\A---\s*\n(.*?\n?)^---\s*\n/m

  def split_front_matter(raw)
    match = raw.match(FRONT_MATTER_RE)
    return [nil, raw] unless match

    fm = begin
      YAML.safe_load(match[1], permitted_classes: [Date, Time]) || {}
    rescue StandardError
      nil
    end
    return [nil, raw] unless fm.is_a?(Hash)

    [fm, match.post_match]
  end

  # Title of a markdown document: front matter `title`, else first H1, else
  # the humanized fallback.
  def title_of(raw, fallback)
    fm, body = split_front_matter(raw)
    (fm && fm['title']) || body[/^\#\s+(.+?)\s*$/, 1] || humanize(fallback)
  end

  # The markdown content files of a repo tree (array of path strings),
  # filtered through the registry's exclude patterns.
  def content_paths(paths, exclude_patterns)
    paths.select { |p| p.end_with?('.md') }
         .reject { |p| p.split('/').any? { |seg| seg.start_with?('.') } }
         .reject { |p| excluded?(p, exclude_patterns) }
         .sort
  end

  # Pretty-permalink URL of a repo-root or nested page on the published site.
  #   site_url must end with '/'. README/index map to their directory root.
  def page_url(site_url, rel)
    segments = rel.sub(/\.md\z/i, '').split('/')
    segments.pop if %w[index readme].include?(segments.last.downcase)
    segments.empty? ? site_url : "#{site_url}#{segments.join('/')}/"
  end
end
