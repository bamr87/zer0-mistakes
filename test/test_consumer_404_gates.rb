# frozen_string_literal: true

# test/test_consumer_404_gates.rb — regression guard for issues #536 / #537.
#
# A remote_theme consumer gets this theme's _includes/ but NOT this repo's
# root files or pages: no /favicon.ico, no /tags/ index. Two includes used to
# link those paths unconditionally, so every page of such a site carried a
# 404 (favicon request) and every tagged page carried 404 links (tag/category
# badges). A served-page test can't see that — it always runs with this repo's
# own pages — so this builds tiny throwaway consumer sites that reuse the
# theme's _includes/ and asserts what each variant renders.
#
# Usage: bundle exec ruby test/test_consumer_404_gates.rb   (exit 0 = pass)

require "jekyll"
require "fileutils"
require "tmpdir"

REPO = File.expand_path("..", __dir__)

PAGE = <<~MD
  ---
  layout: probe
  title: Probe
  categories: [guides]
  tags: [alpha, beta]
  ---
  Probe body.
MD

LAYOUT = <<~HTML
  <head>{% include core/favicon.html %}</head>
  <body>{% include content/intro.html %}</body>
HTML

def build(files: {}, config: {})
  Dir.mktmpdir("zer0-consumer-") do |dir|
    src = File.join(dir, "src")
    FileUtils.mkdir_p(File.join(src, "_layouts"))
    FileUtils.cp_r(File.join(REPO, "_includes"), File.join(src, "_includes"))
    File.write(File.join(src, "_layouts", "probe.html"), LAYOUT)
    File.write(File.join(src, "probe.md"), PAGE)
    files.each do |rel, body|
      path = File.join(src, rel)
      FileUtils.mkdir_p(File.dirname(path))
      File.write(path, body)
    end
    dest = File.join(dir, "_site")
    cfg = Jekyll.configuration(
      { "source" => src, "destination" => dest, "quiet" => true,
        "plugins" => [], "theme" => nil, "safe" => true }.merge(config)
    )
    Jekyll::Site.new(cfg).process
    File.read(File.join(dest, "probe.html"))
  end
end

def icon_links(html)
  html.scan(/<link rel="icon"[^>]*>/)
end

def tag_hrefs(html)
  html.scan(/<a [^>]*href="[^"]*#(?:alpha|beta|guides)"[^>]*>/)
end

TAGS_PAGE = "---\npermalink: /tags/\ntitle: Tags\n---\nTags\n"

CASES = [
  ["no favicon file, no config -> no icon link (#536)", {}, {},
   ->(h) { icon_links(h).empty? }],
  ["root favicon.ico present -> .ico link", { "favicon.ico" => "x" }, {},
   ->(h) { icon_links(h) == ['<link rel="icon" href="/favicon.ico" sizes="32x32">'] }],
  ["only favicon.png present -> png fallback, no .ico", { "favicon.png" => "x" }, {},
   ->(h) { icon_links(h) == ['<link rel="icon" type="image/png" href="/favicon.png">'] }],
  ["only favicon.svg present -> svg fallback", { "favicon.svg" => "<svg/>" }, {},
   ->(h) { icon_links(h) == ['<link rel="icon" type="image/svg+xml" href="/favicon.svg">'] }],
  ["favicon.ico configured, no file -> configured link kept", {},
   { "favicon" => { "ico" => "/brand.ico" } },
   ->(h) { icon_links(h) == ['<link rel="icon" href="/brand.ico" sizes="32x32">'] }],
  ["baseurl site with favicon.ico -> baseurl-prefixed link", { "favicon.ico" => "x" },
   { "baseurl" => "/proj" },
   ->(h) { icon_links(h) == ['<link rel="icon" href="/proj/favicon.ico" sizes="32x32">'] }],
  ["no /tags/ page -> tag + category badges are plain spans (#537)", {}, {},
   ->(h) { tag_hrefs(h).empty? && h.include?('<span class="bd-intro-badge bd-intro-badge--tag">alpha</span>') &&
           h.include?('<span class="bd-intro-badge">Guides</span>') }],
  ["/tags/ page exists -> badges link to /tags/#slug", { "tags.md" => TAGS_PAGE }, {},
   ->(h) { tag_hrefs(h).size == 3 && h.include?('href="/tags/#alpha"') && h.include?('href="/tags/#guides"') }],
  ["site.tags_page configured, no page -> badges link to it", {},
   { "tags_page" => "/topics/" },
   ->(h) { tag_hrefs(h).size == 3 && h.include?('href="/topics/#beta"') }],
].freeze

failed = 0
CASES.each do |name, files, config, check|
  html = build(files: files, config: config)
  if check.call(html)
    puts "  PASS #{name}"
  else
    failed += 1
    puts "  FAIL #{name}"
    puts "       icon links: #{icon_links(html).inspect}"
    puts "       tag hrefs:  #{tag_hrefs(html).inspect}"
  end
end

puts failed.zero? ? "OK: #{CASES.size} consumer 404-gate cases pass" : "::error::#{failed} consumer 404-gate case(s) failed"
exit(failed.zero? ? 0 : 1)
