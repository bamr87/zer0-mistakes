# frozen_string_literal: true

# test/test_newsletter_gate.rb — regression guard for issue #554.
#
# _includes/core/footer.html used to render a newsletter form on every page of
# every site: a disabled email input, a disabled "Subscribe" button whose
# tooltip told the reader to "Configure a newsletter endpoint in your site
# config", and a "placeholder until you connect a provider" caption. No config
# key enabled it or hid it.
#
# The form now renders only when a provider endpoint is configured — the
# top-level `newsletter:` block, falling back to `news.newsletter:` — and then
# as a working form that submits the address. A served-page test sees only the
# theme's own config, so this builds tiny throwaway sites through the real
# footer include, one per config variant, and checks what each renders.
#
# Usage: bundle exec ruby test/test_newsletter_gate.rb   (exit 0 = pass)

require "jekyll"
require "fileutils"
require "tmpdir"

REPO = File.expand_path("..", __dir__)

PAGE = "---\nlayout: probe\ntitle: Probe\n---\nProbe body.\n"
LAYOUT = "<body>{% include core/footer.html lang=page.lang %}</body>\n"

ENDPOINT = "https://example.com/subscribe"
NEWS_ENDPOINT = "https://example.com/news-subscribe"

# A consumer's own ui-text.yml, to prove the strings come from `ui.*`.
CUSTOM_UI = <<~YAML
  en:
    newsletter_label: "Join the list"
    newsletter_email_label: "Your email address"
    newsletter_placeholder: "you@example.com"
    newsletter_subscribe: "Join"
YAML

# ui: :theme copies the theme's _data/ui-text.yml, :none ships no ui-text at
# all (a remote_theme consumer without one), :custom writes CUSTOM_UI.
def build(config, ui: :theme)
  Dir.mktmpdir("zer0-newsletter-") do |dir|
    src = File.join(dir, "src")
    FileUtils.mkdir_p(File.join(src, "_layouts"))
    FileUtils.mkdir_p(File.join(src, "_data"))
    FileUtils.cp_r(File.join(REPO, "_includes"), File.join(src, "_includes"))
    case ui
    when :theme then FileUtils.cp(File.join(REPO, "_data", "ui-text.yml"), File.join(src, "_data", "ui-text.yml"))
    when :custom then File.write(File.join(src, "_data", "ui-text.yml"), CUSTOM_UI)
    end
    File.write(File.join(src, "_layouts", "probe.html"), LAYOUT)
    File.write(File.join(src, "probe.md"), PAGE)
    dest = File.join(dir, "_site")
    cfg = Jekyll.configuration(
      { "source" => src, "destination" => dest, "quiet" => true,
        "plugins" => [], "theme" => nil, "safe" => true }.merge(config)
    )
    Jekyll::Site.new(cfg).process
    File.read(File.join(dest, "probe.html"))
  end
end

# The attributes of the first start tag matching `pattern`, as a hash; a
# boolean attribute (required, disabled) maps to "".
def attrs(html, pattern)
  tag = html[pattern]
  return nil unless tag

  tag.scan(/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:="([^"]*)")?/).to_h { |name, value| [name, value.to_s] }
end

def probe(html)
  {
    form: attrs(html, /<form\b[^>]*\bfooter-subscribe-form\b[^>]*>/),
    input: attrs(html, /<input\b[^>]*\bid="footer-email"[^>]*>/),
    button: attrs(html, /<button\b[^>]*\btype="submit"[^>]*>/),
    button_text: html[%r{<button\b[^>]*\btype="submit"[^>]*>\s*([^<]*?)\s*</button>}, 1],
    label_text: html[%r{<label for="footer-email"[^>]*>\s*([^<]*?)\s*</label>}, 1],
    policy_cols: html[/<div class="([^"]*)\s*footer-policy-links"/, 1].to_s.split,
    placeholder_text: html.include?("placeholder until you connect"),
    setup_tooltip: html.include?("Configure a newsletter endpoint"),
    onsubmit: html.include?("onsubmit="),
  }
end

def no_form(p)
  p[:form].nil? && p[:input].nil? && p[:button].nil? &&
    !p[:placeholder_text] && !p[:setup_tooltip] && !p[:onsubmit] &&
    p[:policy_cols].include?("col-12") && p[:policy_cols].include?("text-center") &&
    !p[:policy_cols].include?("col-md-4")
end

# A form that can actually submit: posts to `action`, an enabled required
# email input, an enabled submit button with no setup tooltip, and the policy
# links back in their narrow right-hand column.
def working_form(p, action:, method: "post", field: "email")
  f, i, b = p[:form], p[:input], p[:button]
  !f.nil? && !i.nil? && !b.nil? &&
    f["action"] == action && f["method"] == method && !f.key?("onsubmit") &&
    i["type"] == "email" && i["name"] == field && i.key?("required") &&
    !i.key?("disabled") && !i.key?("aria-describedby") &&
    !b.key?("disabled") && !b.key?("title") &&
    !p[:placeholder_text] && !p[:setup_tooltip] &&
    p[:policy_cols].include?("col-md-4") && !p[:policy_cols].include?("text-center")
end

def labelled(p, label:, email_label:, placeholder:, subscribe:)
  !p[:form].nil? && !p[:input].nil? &&
    p[:form]["aria-label"] == label && p[:label_text] == email_label &&
    p[:input]["placeholder"] == placeholder && p[:button_text] == subscribe
end

THEME_STRINGS = { label: "Newsletter signup", email_label: "Email",
                  placeholder: "Enter your email", subscribe: "Subscribe" }.freeze

CASES = [
  ["no newsletter config -> no form, no placeholder text, policy links span the row",
   {}, :theme, ->(p) { no_form(p) }],
  ["newsletter.endpoint -> enabled form posting to it",
   { "newsletter" => { "endpoint" => ENDPOINT } }, :theme,
   ->(p) { working_form(p, action: ENDPOINT) && labelled(p, **THEME_STRINGS) }],
  ["only news.newsletter.endpoint -> the footer falls back to it",
   { "news" => { "newsletter" => { "endpoint" => NEWS_ENDPOINT } } }, :theme,
   ->(p) { working_form(p, action: NEWS_ENDPOINT) }],
  ["both set -> the top-level newsletter block wins",
   { "newsletter" => { "endpoint" => ENDPOINT }, "news" => { "newsletter" => { "endpoint" => NEWS_ENDPOINT } } }, :theme,
   ->(p) { working_form(p, action: ENDPOINT) }],
  ["newsletter.enabled: false with an endpoint -> no form",
   { "newsletter" => { "enabled" => false, "endpoint" => ENDPOINT } }, :theme, ->(p) { no_form(p) }],
  ["newsletter.enabled: false, news.newsletter.endpoint set -> no footer form",
   { "newsletter" => { "enabled" => false }, "news" => { "newsletter" => { "endpoint" => NEWS_ENDPOINT } } }, :theme,
   ->(p) { no_form(p) }],
  ["blank newsletter.endpoint -> no form ('' is truthy in Liquid)",
   { "newsletter" => { "endpoint" => "  " } }, :theme, ->(p) { no_form(p) }],
  ["news.newsletter without an endpoint (mailto-only news band) -> no footer form",
   { "news" => { "newsletter" => { "heading" => "Stay Updated" } }, "email" => "me@example.com" }, :theme,
   ->(p) { no_form(p) }],
  ["method and email_field -> passed through to the form",
   { "newsletter" => { "endpoint" => ENDPOINT, "method" => "get", "email_field" => "EMAIL" } }, :theme,
   ->(p) { working_form(p, action: ENDPOINT, method: "get", field: "EMAIL") }],
  ["endpoint with a query string -> & escaped in the action attribute",
   { "newsletter" => { "endpoint" => "#{ENDPOINT}?list=1&src=footer" } }, :theme,
   ->(p) { working_form(p, action: "#{ENDPOINT}?list=1&amp;src=footer") }],
  ["consumer ui-text.yml -> the form's strings come from ui.*",
   { "newsletter" => { "endpoint" => ENDPOINT } }, :custom,
   ->(p) { labelled(p, label: "Join the list", email_label: "Your email address", placeholder: "you@example.com", subscribe: "Join") }],
  ["no ui-text.yml at all (remote_theme consumer) -> English defaults",
   { "newsletter" => { "endpoint" => ENDPOINT } }, :none,
   ->(p) { working_form(p, action: ENDPOINT) && labelled(p, **THEME_STRINGS) }],
].freeze

failed = 0
CASES.each do |name, config, ui, check|
  result = probe(build(config, ui: ui))
  if check.call(result)
    puts "  PASS #{name}"
  else
    failed += 1
    puts "  FAIL #{name}"
    puts "       probe: #{result.inspect}"
  end
end

puts failed.zero? ? "OK: #{CASES.size} newsletter gate cases pass" : "::error::#{failed} newsletter gate case(s) failed"
exit(failed.zero? ? 0 : 1)
