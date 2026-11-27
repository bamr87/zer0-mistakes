# frozen_string_literal: true

# test/test_fleet_assist_gate.rb — the fleet page bridge is opt-in, written in
# development only, and mounted once (ZER0-089).
#
# _includes/components/fleet-assist.html renders <fleet-assist>, the element a
# Claude Code session paired through the Harness Console uses to see the page a
# developer has open. _layouts/root.html mounts it for every site built on the
# theme, so the include's own gate is all that keeps the tag off the production
# pages of every consumer:
#
#   site.fleet_assist.enabled                        the master switch (default off)
#   jekyll.environment != "production" or .deployed  development only, unless deployed
#
# Like test_page_feedback_template.rb, this builds tiny throwaway consumer sites
# through the real include and asserts what reaches the page. It then checks the
# mount itself: one include tag in the theme-owned layout, none in the
# consumer-shadowable stubs, and the payload at the path the include emits.
#
# Usage: bundle exec ruby test/test_fleet_assist_gate.rb   (exit 0 = pass)

require "jekyll"
require "fileutils"
require "tmpdir"

REPO = File.expand_path("..", __dir__)
INCLUDE = "components/fleet-assist.html"
PAYLOAD = "assets/js/fleet-assist.js"

PROBE = <<~MD
  ---
  layout: probe
  title: Probe
  ---
  Probe body.
MD

# The markers make "renders nothing" an exact claim: not one byte between them.
PROBE_LAYOUT = <<~HTML
  <body>BEGIN[{% include #{INCLUDE} %}]END</body>
HTML

# What the include writes for one site config in one JEKYLL_ENV.
def render(env, site_config)
  Dir.mktmpdir("zer0-assist-") do |dir|
    src = File.join(dir, "src")
    FileUtils.mkdir_p(File.join(src, "_layouts"))
    FileUtils.cp_r(File.join(REPO, "_includes"), File.join(src, "_includes"))
    File.write(File.join(src, "_layouts", "probe.html"), PROBE_LAYOUT)
    File.write(File.join(src, "probe.md"), PROBE)
    dest = File.join(dir, "_site")
    cfg = Jekyll.configuration(
      { "source" => src, "destination" => dest, "quiet" => true,
        "plugins" => [], "theme" => nil, "safe" => true,
        "repository" => "acme/site" }.merge(site_config)
    )
    was = ENV["JEKYLL_ENV"]
    begin
      ENV["JEKYLL_ENV"] = env
      Jekyll::Site.new(cfg).process
    ensure
      ENV["JEKYLL_ENV"] = was
    end
    File.read(File.join(dest, "probe.html"))[/BEGIN\[(.*)\]END/m, 1]
  end
end

# The attributes of the one <fleet-assist> tag, or nil unless there is exactly one.
def tag(html)
  opens = html.to_s.scan(/<fleet-assist\b([^>]*)>/m)
  return nil unless opens.size == 1

  opens.first.first.scan(/([\w-]+)="([^"]*)"/).to_h
end

def scripts(html)
  html.to_s.scan(/<script\b[^>]*\bsrc="([^"]*)"[^>]*>/m).flatten
end

ON = { "fleet_assist" => { "enabled" => true } }.freeze
nothing = ->(html) { html == "" }

CASES = [
  ["development, no fleet_assist key -> nothing (off by default)",
   "development", {}, nothing],
  ["development, enabled: false -> nothing",
   "development", { "fleet_assist" => { "enabled" => false } }, nothing],
  ["development, deployed without enabled -> nothing",
   "development", { "fleet_assist" => { "deployed" => true } }, nothing],
  ["production, enabled -> nothing (development only)",
   "production", ON, nothing],
  ["development, enabled -> one payload script and one tag naming the repo and the source",
   "development", ON,
   lambda { |html|
     t = tag(html)
     t && scripts(html) == ["/#{PAYLOAD}"] && html.include?(" defer></script>") &&
       t["repo"] == "acme/site" && t["branch"] == "main" && t["source"] == "probe.md" &&
       t["framework"] == "jekyll" && t["env"] == "development" && !t.key?("broker")
   }],
  ["production, enabled + deployed -> the tag is written on the built site too",
   "production", { "fleet_assist" => { "enabled" => true, "deployed" => true } },
   ->(html) { (t = tag(html)) && scripts(html) == ["/#{PAYLOAD}"] && t["env"] == "production" }],
  ["broker -> its own attribute, separated from the one before it",
   "development", { "fleet_assist" => { "enabled" => true, "broker" => "http://127.0.0.1:4003" } },
   lambda { |html|
     (t = tag(html)) && t["broker"] == "http://127.0.0.1:4003" && html !~ /"[A-Za-z_:][\w:.-]*=/
   }],
  ["repository as a YAML list (this repo's own _config.yml) -> owner/name",
   "development", ON.merge("repository" => ["bamr87", "/", "zer0-mistakes"]),
   ->(html) { (t = tag(html)) && t["repo"] == "bamr87/zer0-mistakes" }],
  ["branch and baseurl -> the tag and the payload URL carry them",
   "development", ON.merge("branch" => "dev", "baseurl" => "/docs-site"),
   lambda { |html|
     (t = tag(html)) && t["branch"] == "dev" && t["base"] == "/docs-site" &&
       scripts(html) == ["/docs-site/#{PAYLOAD}"]
   }],
].freeze

failed = 0
CASES.each do |name, env, config, check|
  html = render(env, config)
  if check.call(html)
    puts "  PASS #{name}"
  else
    failed += 1
    puts "  FAIL #{name}"
    puts "       rendered: #{html.inspect}"
  end
end

# --- The mount ---------------------------------------------------------------
# One include tag, in the layout that closes </body>. A consumer may shadow
# everything under _includes/custom/, so a mount there would be lost (or, with
# this one, doubled: two tags draw two launchers).
mounts = Dir.glob(File.join(REPO, "{_layouts,_includes}", "**", "*.html")).each_with_object({}) do |path, found|
  hits = File.read(path, encoding: "UTF-8").scan(/\{%-?\s*include(?:_cached)?\s+#{Regexp.escape(INCLUDE)}/).size
  found[path.sub("#{REPO}/", "")] = hits if hits.positive?
end

STATIC = [
  ["_layouts/root.html mounts #{INCLUDE} exactly once, and nothing else does",
   mounts == { "_layouts/root.html" => 1 }, mounts.inspect],
  ["the payload exists at the path the include emits (#{PAYLOAD})",
   File.file?(File.join(REPO, PAYLOAD)), "missing"],
].freeze

STATIC.each do |name, ok, detail|
  if ok
    puts "  PASS #{name}"
  else
    failed += 1
    puts "  FAIL #{name}"
    puts "       #{detail}"
  end
end

total = CASES.size + STATIC.size
puts failed.zero? ? "OK: #{total} fleet-assist gate cases pass" : "::error::#{failed} fleet-assist gate case(s) failed"
exit(failed.zero? ? 0 : 1)
