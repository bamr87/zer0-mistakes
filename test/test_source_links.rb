# frozen_string_literal: true

# test/test_source_links.rb — regression guard for issue #538.
#
# On a jekyll-paginate pager page (/blog/page2/, /pages/2/ …) `page.path` is
# the generated output path (blog/page2/index.html), not the template that
# produced it (blog/index.html). The env-switcher "View on GitHub" link and
# its filename label, the intro "Edit on GitHub" link, the dev-shortcuts links
# and the page-feedback source URL all built their GitHub blob URL from
# `page.path`, so on every pager page n > 1 they pointed at a file that does
# not exist (a 404). They now read one computation,
# _includes/core/source-path.html.
#
# A served-page test can't pin this: the result depends on the paginate_path
# and on where the template lives, and this repo's own pager template is the
# root index.html with `permalink: /pages/`, whose pager pages jekyll-paginate
# v1 writes out empty. So this builds tiny throwaway consumer sites through the
# real default layout, one per pagination shape, and checks every GitHub blob
# link each page renders.
#
# Usage: bundle exec ruby test/test_source_links.rb   (exit 0 = pass)

require "jekyll"
require "fileutils"
require "tmpdir"

REPO = File.expand_path("..", __dir__)
REPOSITORY = "acme/site"
GITHUB = "github.com/#{REPOSITORY}/blob/main/"
BLOB = %r{github\.(?:com|dev)/#{Regexp.escape(REPOSITORY)}/blob/main/([^"'\s<>]*)}.freeze

# Each surface that links the page's source file, as the pattern its link
# must match for source path `p`. Every one must be present on every page.
SURFACES = {
  "env-switcher label" => ->(p) { %r{>Source</span>\s*<span class="font-monospace[^"]*">\s*#{Regexp.escape(File.basename(p))}\s*</span>} },
  "env-switcher link" => ->(p) { %r{href="https://#{Regexp.escape(GITHUB + p)}"[^>]*title="View on GitHub"}m },
  "intro edit link" => ->(p) { %r{href="https://#{Regexp.escape(GITHUB + p)}"\s+class="btn btn-sm btn-dark bd-intro-action-link"} },
  "dev-shortcuts github.dev" => ->(p) { %r{href="https://github\.dev/#{Regexp.escape(REPOSITORY)}/blob/main/#{Regexp.escape(p)}"} },
  "page-feedback sourceUrl" => ->(p) { %r{"sourceUrl": "https://#{Regexp.escape(GITHUB + p)}"} },
}.freeze

TEMPLATE = <<~HTML
  ---
  layout: default
  title: Blog
  ---
  {% for post in paginator.posts %}<p>{{ post.title }}</p>{% endfor %}
HTML

def page(title)
  "---\nlayout: default\ntitle: #{title}\n---\nBody of #{title}.\n"
end

POSTS = {
  "_posts/2026-01-01-one.md" => page("One"),
  "_posts/2026-01-02-two.md" => page("Two"),
  "_posts/2026-01-03-three.md" => page("Three"),
}.freeze

# Builds a throwaway site and returns { output path => rendered html }.
def build(files, config)
  Dir.mktmpdir("zer0-source-links-") do |dir|
    src = File.join(dir, "src")
    FileUtils.mkdir_p(src)
    %w[_includes _layouts].each { |d| FileUtils.cp_r(File.join(REPO, d), File.join(src, d)) }
    files.each do |rel, body|
      path = File.join(src, rel)
      FileUtils.mkdir_p(File.dirname(path))
      File.write(path, body)
    end
    dest = File.join(dir, "_site")
    # safe: true also stops Jekyll preferring ./_layouts under the cwd (this
    # repo) over the fixture's own copy. root.html needs include-cache + seo-tag.
    plugins = %w[jekyll-include-cache jekyll-seo-tag jekyll-paginate]
    cfg = Jekyll.configuration(
      { "source" => src, "destination" => dest, "quiet" => true, "theme" => nil,
        "safe" => true, "plugins" => plugins, "whitelist" => plugins,
        "repository" => REPOSITORY, "branch" => "main", "paginate" => 1,
        "page_feedback" => { "enabled" => true },
        "collections" => { "docs" => { "output" => true } } }.merge(config)
    )
    Jekyll::Site.new(cfg).process
    Dir.glob("**/*.html", base: dest).to_h { |rel| [rel, File.read(File.join(dest, rel))] }
  end
end

# Every blob path a page links, minus the site-config shortcut dev-shortcuts
# renders on every page.
def links(html) = html.scan(BLOB).flatten.uniq.sort - ["_config.yml"]

failed = 0
total = 0
check = lambda do |name, site, output, expected|
  total += 1
  html = site[output]
  problems = []
  if html.nil?
    problems << "no #{output} in the build"
  else
    got = links(html)
    problems << "links #{got.inspect}, want only #{[expected].inspect}" unless got == [expected]
    missing = SURFACES.reject { |_, pattern| html.match?(pattern.call(expected)) }.keys
    problems << "no #{expected} link from: #{missing.join(', ')}" unless missing.empty?
  end
  if problems.empty?
    puts "  PASS #{name}"
  else
    failed += 1
    puts "  FAIL #{name}"
    problems.each { |p| puts "       #{p}" }
  end
end

# 1. The documented shape (pages/_docs/jekyll/pagination.md): the template is
#    blog/index.html, collections live under collections_dir.
blog = build(
  { "blog/index.html" => TEMPLATE, "about.md" => page("About"),
    "pages/_docs/guide.md" => page("Guide") }
    .merge(POSTS.transform_keys { |k| "pages/#{k}" }),
  { "paginate_path" => "/blog/page:num/", "collections_dir" => "pages" }
)
check.("pager page 2 links its template, not blog/page2/index.html", blog, "blog/page2/index.html", "blog/index.html")
check.("pager page 3 links its template, not blog/page3/index.html", blog, "blog/page3/index.html", "blog/index.html")
check.("pager page 1 (the template itself) is unchanged", blog, "blog/index.html", "blog/index.html")
check.("a plain page is unchanged", blog, "about.html", "about.md")
check.("a collection doc keeps the collections_dir prefix", blog, "docs/guide.html", "pages/_docs/guide.md")
check.("a post keeps the collections_dir prefix", blog, "2026/01/01/one.html", "pages/_posts/2026-01-01-one.md")

# 2. paginate_path /pages/:num/ with no pages/index.html: jekyll-paginate
#    walks up from pages/ and uses the root index.html as the template.
#    No collections_dir: a collection doc links without a "//".
root = build(
  { "index.html" => TEMPLATE, "_docs/guide.md" => page("Guide") }.merge(POSTS),
  { "paginate_path" => "/pages/:num/" }
)
check.("pager page 2 walks up to a root index.html template", root, "pages/2/index.html", "index.html")
check.("pager page 1 (the root index.html) is unchanged", root, "index.html", "index.html")
check.("a collection doc without collections_dir has no double slash", root, "docs/guide.html", "_docs/guide.md")

puts failed.zero? ? "OK: #{total} source-link cases pass" : "::error::#{failed} of #{total} source-link case(s) failed"
exit(failed.zero? ? 0 : 1)
