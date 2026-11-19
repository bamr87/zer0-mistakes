# frozen_string_literal: true

# test/test_page_feedback_template.rb — regression guard for issue #636.
#
# The page-feedback widget's no-JS links (the FAB, the intro "Improve" link
# and the 404 report link) used to hard-code template=page_improvement.yml,
# this repo's own issue form. Remote-theme consumers on the fleet feedback kit
# ship page_feedback.yml instead, so on their sites those links opened a
# blank issue. site.page_feedback.issue_template now names the form; unset, it
# keeps the old default.
#
# Like test_consumer_404_gates.rb, this builds tiny throwaway consumer sites
# that reuse the theme's _includes/ (and the 404 layout) and asserts the hrefs.
#
# Usage: bundle exec ruby test/test_page_feedback_template.rb   (exit 0 = pass)

require "jekyll"
require "fileutils"
require "tmpdir"

REPO = File.expand_path("..", __dir__)

PROBE = <<~MD
  ---
  layout: probe
  title: Probe
  ---
  Probe body.
MD

PROBE_LAYOUT = <<~HTML
  <body>{% include content/intro.html %}{% include components/page-feedback.html %}</body>
HTML

NOT_FOUND = <<~MD
  ---
  layout: "404"
  permalink: /404.html
  ---
MD

def build(page_feedback)
  Dir.mktmpdir("zer0-feedback-") do |dir|
    src = File.join(dir, "src")
    FileUtils.mkdir_p(File.join(src, "_layouts"))
    FileUtils.cp_r(File.join(REPO, "_includes"), File.join(src, "_includes"))
    FileUtils.cp(File.join(REPO, "_layouts", "404.html"), File.join(src, "_layouts", "404.html"))
    File.write(File.join(src, "_layouts", "root.html"), "{{ content }}")
    File.write(File.join(src, "_layouts", "probe.html"), PROBE_LAYOUT)
    File.write(File.join(src, "probe.md"), PROBE)
    File.write(File.join(src, "404.md"), NOT_FOUND)
    dest = File.join(dir, "_site")
    cfg = Jekyll.configuration(
      { "source" => src, "destination" => dest, "quiet" => true,
        "plugins" => [], "theme" => nil, "safe" => true,
        "repository" => "acme/site", "site_configured" => true,
        "page_feedback" => { "enabled" => true, "fab" => true }.merge(page_feedback) }
    )
    Jekyll::Site.new(cfg).process
    [File.read(File.join(dest, "probe.html")), File.read(File.join(dest, "404.html"))]
  end
end

# Every issues/new href, keyed by the element that carries it.
def hrefs(probe, not_found)
  pick = ->(html, pattern) { html[pattern, 1] }
  {
    fab: pick.(probe, /<a id="pageFeedbackFab"[^>]*?href="([^"]*)"/m),
    intro: pick.(probe, /<a class="btn btn-sm btn-success bd-intro-action-link"[^>]*?href="([^"]*)"/m),
    not_found: pick.(not_found, /<a id="github-issue-link"[^>]*?href="([^"]*)"/m),
  }
end

def expect_template(name)
  # Asserts the query, not the whole URL: how each element builds the repo
  # path (404.html's repository/github_user fallback) is not under test here.
  query = "/issues/new?template=#{name}&labels=page-feedback"
  ->(links) { links.values.all? { |href| href.to_s.start_with?("https://github.com/acme/site") && href.to_s.end_with?(query) } }
end

CASES = [
  ["issue_template: page_feedback.yml -> all three links open that form",
   { "issue_template" => "page_feedback.yml" }, expect_template("page_feedback.yml")],
  ["no issue_template -> all three links keep page_improvement.yml",
   {}, expect_template("page_improvement.yml")],
].freeze

failed = 0
CASES.each do |name, config, check|
  links = hrefs(*build(config))
  if check.call(links)
    puts "  PASS #{name}"
  else
    failed += 1
    puts "  FAIL #{name}"
    links.each { |key, href| puts "       #{key}: #{href.inspect}" }
  end
end

puts failed.zero? ? "OK: #{CASES.size} page-feedback template cases pass" : "::error::#{failed} page-feedback template case(s) failed"
exit(failed.zero? ? 0 : 1)
