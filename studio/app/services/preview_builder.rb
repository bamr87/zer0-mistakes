# Feature: ZER0-088
# frozen_string_literal: true

require "json"
require "securerandom"
require "fileutils"

# Builds the theme's docs site into studio/tmp/previews/<id> as a job: the
# theme's own `bundle exec jekyll build` with its two configs and the preview's
# base URL, so every link and asset resolves under /preview/<id>/. The theme's
# _site/ is never touched. The newest five builds are kept.
module PreviewBuilder
  KEEP = 5
  ID = /\A\h{12}\z/

  Build = Struct.new(:id, :dir, :built_at, :meta, keyword_init: true)

  class Failed < StandardError; end
  class Cancelled < StandardError; end

  module_function

  # STUDIO_PREVIEWS_DIR, else tmp/previews under the studio.
  def dir
    Pathname.new(ENV["STUDIO_PREVIEWS_DIR"].presence || Rails.root.join("tmp/previews").to_s)
  end

  def dir_for(id)
    return nil unless id.to_s.match?(ID)

    build = dir.join(id.to_s)
    build.directory? ? build : nil
  end

  def builds
    return [] unless dir.directory?

    dir.children.select(&:directory?).filter_map do |child|
      next unless child.basename.to_s.match?(ID)

      Build.new(id: child.basename.to_s, dir: child, built_at: child.mtime, meta: read_meta(child))
    end.sort_by(&:built_at).reverse
  end

  # Returns [id, stats]; raises on failure (the half-built directory is removed).
  def build(theme:, sink:, interrupt: nil)
    id = SecureRandom.hex(6)
    dest = dir.join(id)
    FileUtils.mkdir_p(dest)
    started = Process.clock_gettime(Process::CLOCK_MONOTONIC)

    check = ScriptRunner.run("bundle_check", theme: theme, sink: sink, interrupt: interrupt)
    unless check.ok?
      raise Cancelled if check.cancelled

      install = ScriptRunner.run("bundle_install", theme: theme, sink: sink, interrupt: interrupt)
      raise Cancelled if install.cancelled
      raise Failed, "bundle install failed (exit #{install.status})" unless install.ok?
    end

    result = ScriptRunner.run("jekyll_build", theme: theme, sink: sink, interrupt: interrupt,
                              args: { destination: dest.to_s, baseurl: "/preview/#{id}" },
                              env: { "JEKYLL_ENV" => "development", "PAGES_REPO_NWO" => ENV.fetch("PAGES_REPO_NWO", "bamr87/zer0-mistakes") })
    raise Cancelled if result.cancelled
    raise Failed, "jekyll build failed (exit #{result.status})" unless result.ok?

    seconds = (Process.clock_gettime(Process::CLOCK_MONOTONIC) - started).round(1)
    pages = dest.glob("**/*.html").size
    dest.join("studio-meta.json").write(JSON.pretty_generate("id" => id, "built_at" => Time.now.utc.iso8601,
                                                              "seconds" => seconds, "pages" => pages,
                                                              "theme_version" => ThemeRoot.version))
    prune
    [ id, { "pages" => pages, "seconds" => seconds } ]
  rescue StandardError
    FileUtils.rm_rf(dest) if dest.to_s.start_with?("#{dir}/")
    raise
  end

  def prune
    builds.drop(KEEP).each { |b| FileUtils.rm_rf(b.dir) if b.dir.to_s.start_with?("#{dir}/") }
  end

  def read_meta(build)
    JSON.parse(build.join("studio-meta.json").read)
  rescue SystemCallError, JSON::ParserError
    {}
  end
end
