# frozen_string_literal: true

# test/test_giscus_config.rb — regression guard for issue #574.
#
# _includes/content/giscus.html hard-coded data-theme="preferred_color_scheme",
# so the widget followed the visitor's OS instead of the site: on a dark-skin
# site a visitor whose OS was in light mode got a white comment box.
# data-mapping, data-input-position and data-lang were fixed too, and the only
# way to change any of them was to fork the include. Each now reads
# site.giscus.<attribute> and falls back to its old value, and
# content/comments.html owns the gate, the heading and the widget for every
# layout that shows comments.
#
# A served-page test only ever sees this repo's own _config.yml, so this
# builds tiny throwaway sites through the real layouts, one per config
# variant, and reads the comment section and the giscus <script> each page
# renders.
#
# Usage: bundle exec ruby test/test_giscus_config.rb   (exit 0 = pass)

require "jekyll"
require "fileutils"
require "tmpdir"
require "yaml"

REPO = File.expand_path("..", __dir__)

# root.html needs these two; nothing on the comment path needs more.
PLUGINS = %w[jekyll-include-cache jekyll-seo-tag].freeze

GISCUS = { "enabled" => true, "data-repo-id" => "R_test", "data-category-id" => "DIC_test" }.freeze

# The tag main rendered before the four attributes became configurable, byte
# for byte (with this file's repository and IDs). A site that sets none of the
# new keys must keep getting exactly this.
LEGACY_TAG = <<~HTML.chomp
  <script src="https://giscus.app/client.js"
          data-repo="owner/site"
          data-repo-id="R_test"
          data-category-id="DIC_test"
          data-mapping="pathname"
          data-strict="1"
          data-reactions-enabled="1"
          data-emit-metadata="0"
          data-input-position="top"
          data-theme="preferred_color_scheme"
          data-lang="en"
          crossorigin="anonymous"
          async>
  </script>
HTML

WIDGET = '<script src="https://giscus\.app/client\.js".*?</script>'
H2 = '<h2 class="h4 mb-4">\s*<i class="bi bi-chat-dots me-2"[^>]*></i>Comments\s*</h2>'
H5 = '<h5 class="mb-4">Comments</h5>'

# The comment section each layout rendered before content/comments.html
# existed: the container, the heading, the widget, and nothing in between.
def section(open, heading, close)
  Regexp.new("#{Regexp.escape(open)}\\s*#{heading}\\s*#{WIDGET}\\s*#{Regexp.escape(close)}", Regexp::MULTILINE)
end

MARKUP = {
  section: section('<section class="post-comments mt-5 pt-4 border-top" id="comments">', H2, "</section>"),
  note: section('<div class="note-comments mt-5 pt-4 border-top">', H5, "</div>"),
  notebook: section('<div class="notebook-comments mt-5 pt-4 border-top">', H5, "</div>"),
}.freeze

# probe page => [layout, front-matter `comments:` (nil = no key), the comment
# section it must render (nil = none)]. article, note and notebook show
# comments unless a page opts out; recipe and book-story only when it opts in.
PROBES = {
  "article" => ["article", nil, :section],
  "article-off" => ["article", false, nil],
  "note" => ["note", nil, :note],
  "note-off" => ["note", false, nil],
  "notebook" => ["notebook", nil, :notebook],
  "notebook-off" => ["notebook", false, nil],
  "recipe" => ["recipe", nil, nil],
  "recipe-on" => ["recipe", true, :section],
  "book-story" => ["book-story", nil, nil],
  "book-story-on" => ["book-story", true, :section],
}.freeze
SHOWN = PROBES.select { |_, (_, _, markup)| markup }.freeze
HIDDEN = SHOWN.transform_values { |(layout, comments, _)| [layout, comments, nil] }.freeze

OVERLAY = {
  "data-theme" => "transparent_dark",
  "data-mapping" => "title",
  "data-input-position" => "bottom",
  "data-lang" => "fr",
}.freeze
FIXED = {
  "data-repo" => "owner/site",
  "data-repo-id" => "R_test",
  "data-category-id" => "DIC_test",
  "data-strict" => "1",
  "data-reactions-enabled" => "1",
  "data-emit-metadata" => "0",
}.freeze

# Builds the probes through the real _includes/ and _layouts/ (plus any extra
# layouts) and returns { probe => rendered html }.
def build(config, probes, layouts: {})
  Dir.mktmpdir("zer0-giscus-") do |dir|
    src = File.join(dir, "src")
    FileUtils.mkdir_p(src)
    %w[_includes _layouts].each { |d| FileUtils.cp_r(File.join(REPO, d), File.join(src, d)) }
    layouts.each { |name, body| File.write(File.join(src, "_layouts", "#{name}.html"), body) }
    probes.each do |name, (layout, comments, _)|
      front = { "layout" => layout, "title" => "Probe #{name}" }
      front["comments"] = comments unless comments.nil?
      File.write(File.join(src, "#{name}.md"), "#{front.to_yaml}---\nProbe body.\n")
    end
    dest = File.join(dir, "_site")
    # safe: true also stops Jekyll preferring ./_layouts under the cwd (this
    # repo) over the fixture's own copy. note.html and notebook.html sort
    # their collection for prev/next, which fails on a nil one, so both are
    # declared (empty).
    cfg = Jekyll.configuration(
      { "source" => src, "destination" => dest, "quiet" => true, "theme" => nil,
        "safe" => true, "plugins" => PLUGINS, "whitelist" => PLUGINS,
        "collections" => { "notes" => {}, "notebooks" => {} },
        "repository" => "owner/site" }.merge(config)
    )
    Jekyll::Site.new(cfg).process
    probes.keys.to_h { |name| [name, File.read(File.join(dest, "#{name}.html"))] }
  end
end

def widgets(html) = html.scan(Regexp.new(WIDGET, Regexp::MULTILINE))
def attrs(tag) = tag.to_s.scan(/(data-[a-z-]+)="([^"]*)"/).to_h

# Each probe renders its expected section (exactly one widget, in the old
# markup) or nothing at all.
def gate_problems(pages, probes)
  probes.filter_map do |name, (_, _, markup)|
    html = pages.fetch(name)
    found = widgets(html).size
    if markup.nil?
      "#{name}: expected no comment section, found #{found} giscus tag(s)" unless found.zero?
    elsif found != 1
      "#{name}: expected one giscus tag, found #{found}"
    elsif !html.match?(MARKUP.fetch(markup))
      "#{name}: the comment section no longer renders the #{markup} markup"
    end
  end
end

def attr_problems(pages, names, want)
  names.filter_map do |name|
    got = attrs(widgets(pages.fetch(name)).first)
    wrong = want.reject { |key, value| got[key] == value }
    "#{name}: " + wrong.map { |key, value| "#{key}=#{got[key].inspect} (want #{value.inspect})" }.join(", ") if wrong.any?
  end
end

def legacy_problems(pages, names)
  names.filter_map do |name|
    tag = widgets(pages.fetch(name)).first
    "#{name}: the tag differs from main's:\n#{tag}" unless tag == LEGACY_TAG
  end
end

CONSUMER_LAYOUT = "---\nlayout: default\n---\n{{ content }}\n{% include content/comments.html %}\n"

CASES = [
  ["no new giscus keys -> every layout keeps its gate and markup, and the tag is main's byte for byte", lambda {
    pages = build({ "giscus" => GISCUS }, PROBES)
    gate_problems(pages, PROBES) + legacy_problems(pages, SHOWN.keys)
  }],
  ["data-theme/data-mapping/data-input-position/data-lang set -> every layout's tag follows the config", lambda {
    pages = build({ "giscus" => GISCUS.merge(OVERLAY) }, PROBES)
    gate_problems(pages, PROBES) + attr_problems(pages, SHOWN.keys, FIXED.merge(OVERLAY))
  }],
  ["blank keys (setup-wizard output) -> the defaults", lambda {
    legacy_problems(build({ "giscus" => GISCUS.merge(OVERLAY.transform_values { "" }) }, SHOWN), SHOWN.keys)
  }],
  ["a custom theme URL is HTML-escaped into the attribute", lambda {
    theme = "https://example.com/giscus.css?v=1&dark=1"
    pages = build({ "giscus" => GISCUS.merge("data-theme" => theme) }, SHOWN.slice("article"))
    want = 'data-theme="https://example.com/giscus.css?v=1&amp;dark=1"'
    pages["article"].include?(want) ? [] : ["article: no #{want}"]
  }],
  ["giscus.enabled: false -> no comment section, even on a page that opts in", lambda {
    gate_problems(build({ "giscus" => GISCUS.merge("enabled" => false) }, HIDDEN), HIDDEN)
  }],
  ["no giscus block (a consumer without comments) -> no comment section", lambda {
    gate_problems(build({}, HIDDEN), HIDDEN)
  }],
  ["a consumer layout shows comments with one include line", lambda {
    probes = { "consumer" => ["consumer", nil, :section], "consumer-off" => ["consumer", false, nil] }
    gate_problems(build({ "giscus" => GISCUS }, probes, layouts: { "consumer" => CONSUMER_LAYOUT }), probes)
  }],
].freeze

failed = 0
CASES.each do |name, run|
  problems =
    begin
      run.call
    rescue StandardError => e
      ["build raised #{e.class}: #{e.message.lines.first.to_s.strip}"]
    end
  if problems.empty?
    puts "  PASS #{name}"
  else
    failed += 1
    puts "  FAIL #{name}"
    problems.each { |p| puts "       #{p}" }
  end
end

puts failed.zero? ? "OK: #{CASES.size} giscus config cases pass" : "::error::#{failed} giscus config case(s) failed"
exit(failed.zero? ? 0 : 1)
