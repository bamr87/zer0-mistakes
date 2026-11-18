# frozen_string_literal: true

# test/test_cookie_consent_gate.rb — regression guard for issue #566.
#
# _layouts/root.html used to include the cookie-consent banner (and its
# "Manage Cookies" modal) unconditionally, and core/footer.html always rendered
# the "Cookie Preferences" button. A consumer with no tracker configured asked
# every first-time visitor to consent to analytics/marketing cookies that do
# not exist. A served-page test can't see that — this repo's own dev config
# inherits a GTM container, so the banner is legitimately on — so this builds
# tiny throwaway sites through the real root layout, one per config variant,
# and counts what each renders.
#
# Usage: bundle exec ruby test/test_cookie_consent_gate.rb   (exit 0 = pass)

require "jekyll"
require "fileutils"
require "tmpdir"

REPO = File.expand_path("..", __dir__)

PAGE = "---\nlayout: root\ntitle: Probe\n---\nProbe body.\n"

# Nothing that needs consent: the state a no-tracker consumer is in.
NO_TRACKERS = {
  "google_analytics" => nil,
  "google_tag_manager" => nil,
  "posthog" => { "enabled" => false },
}.freeze

MARKERS = {
  banner: 'id="cookieConsent"',
  modal: 'id="cookieSettingsModal"',
  footer_button: 'data-bs-target="#cookieSettingsModal"',
}.freeze

def build(config)
  Dir.mktmpdir("zer0-consent-") do |dir|
    src = File.join(dir, "src")
    FileUtils.mkdir_p(src)
    %w[_includes _layouts].each { |d| FileUtils.cp_r(File.join(REPO, d), File.join(src, d)) }
    File.write(File.join(src, "probe.md"), PAGE)
    dest = File.join(dir, "_site")
    # safe: true also stops Jekyll preferring ./_layouts under the cwd (this
    # repo) over the fixture's own copy. root.html needs the two plugins.
    plugins = %w[jekyll-include-cache jekyll-seo-tag]
    cfg = Jekyll.configuration(
      { "source" => src, "destination" => dest, "quiet" => true, "theme" => nil,
        "safe" => true, "plugins" => plugins, "whitelist" => plugins }.merge(config)
    )
    Jekyll::Site.new(cfg).process
    html = File.read(File.join(dest, "probe.html"))
    MARKERS.transform_values { |m| html.scan(m).size }
  end
end

def all_absent(c) = c.values.all?(&:zero?)
# The banner's own "Manage Cookies" button also targets the modal, so a
# rendered banner + footer button is two data-bs-target hits.
def all_present(c) = c[:banner] == 1 && c[:modal] == 1 && c[:footer_button] == 2

CASES = [
  ["no tracker, no cookie_consent key -> no banner, modal or footer button",
   NO_TRACKERS, method(:all_absent)],
  ["blank tracker ids (setup-wizard output) -> no banner, modal or footer button",
   NO_TRACKERS.merge("google_analytics" => "", "google_tag_manager" => ""), method(:all_absent)],
  ["google_analytics set -> banner, modal and footer button",
   NO_TRACKERS.merge("google_analytics" => "G-TEST"), method(:all_present)],
  ["google_tag_manager set -> banner, modal and footer button",
   NO_TRACKERS.merge("google_tag_manager" => "GTM-TEST"), method(:all_present)],
  ["posthog.enabled -> banner, modal and footer button",
   NO_TRACKERS.merge("posthog" => { "enabled" => true }), method(:all_present)],
  ["cookie_consent.enabled: true, no tracker -> forced on",
   NO_TRACKERS.merge("cookie_consent" => { "enabled" => true }), method(:all_present)],
  ["cookie_consent.enabled: false, trackers set -> forced off",
   NO_TRACKERS.merge("google_analytics" => "G-TEST", "posthog" => { "enabled" => true },
                     "cookie_consent" => { "enabled" => false }), method(:all_absent)],
].freeze

failed = 0
CASES.each do |name, config, check|
  counts = build(config)
  if check.call(counts)
    puts "  PASS #{name}"
  else
    failed += 1
    puts "  FAIL #{name}"
    puts "       counts: #{counts.inspect}"
  end
end

puts failed.zero? ? "OK: #{CASES.size} cookie-consent gate cases pass" : "::error::#{failed} cookie-consent gate case(s) failed"
exit(failed.zero? ? 0 : 1)
