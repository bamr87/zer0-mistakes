# frozen_string_literal: true

require "digest"
require "yaml"

# The theme's own consistency rules, run read-only against the checkout.
# Findings use the fleet's findings.jsonl shape (`check_id, severity, file,
# line, rule, evidence, fingerprint`), so the same triage tooling reads them.
#
# Rules:
#   tokens.parity        scripts/design-system-check.rb exits non-zero
#   skins.registry       the skin names in _data/theme_skins.yml, _skins.scss,
#                        _backgrounds.scss, theme_backgrounds.yml and skins.css
#                        do not agree (a background-only skin has no palette)
#   skins.default        the registry default has no palette, or differs from
#                        the docs site's own theme_skin
#   backgrounds.gem      the gemspec rejects assets/backgrounds/ while
#                        _backgrounds.scss references it (a gem consumer 404s)
#   backgrounds.assets   a background SVG the stylesheet references is missing
#   tokens.contrast      a skin's link colours miss WCAG AA
#   config.byte-copy     pages/_about/settings/_config.yml is not the raw-wrapped
#                        copy of _config.yml that scripts/bin/validate requires
#   config.exclude       _config.yml or _config_dev.yml does not exclude studio/
class ThemeDoctor
  BYTE_COPY = "pages/_about/settings/_config.yml"
  DEV_CONFIG = "_config_dev.yml"
  CONFIG = "_config.yml"
  GEMSPEC = "jekyll-theme-zer0.gemspec"

  attr_reader :theme, :findings

  def self.run(theme: ThemeRoot, sink: nil)
    new(theme: theme, sink: sink).run
  end

  def initialize(theme: ThemeRoot, sink: nil)
    @theme = theme
    @sink = sink
    @findings = []
  end

  def run
    %i[tokens_parity skins_registry skins_default backgrounds_gem backgrounds_assets tokens_contrast
       config_byte_copy config_exclude].each do |rule|
      say("doctor: #{rule.to_s.tr('_', '.')}")
      send(rule)
    end
    findings
  end

  def errors
    findings.count { |f| f["severity"] == "error" }
  end

  def warnings
    findings.count { |f| f["severity"] == "warning" }
  end

  private

  def tokens_parity
    result = ScriptRunner.capture("design_system_check", theme: theme.path)
    say(result.output.to_s.strip)
    return if result.ok?

    lines = result.output.to_s.lines.map(&:strip).select { |l| l.start_with?("- ") }
    lines = [ "design-system-check exited #{result.status}" ] if lines.empty?
    lines.each { |line| finding("tokens.parity", "error", "design-system-check", line.delete_prefix("- "), file: DesignSystem::CHECK_SCRIPT) }
  end

  def skins_registry
    registry = SkinEditor.names(theme: theme)
    palette = selectors(DesignSystem::SKIN_SCSS)
    backgrounds = selectors(DesignSystem::BACKGROUNDS_SCSS)
    mirror = selectors(DesignSystem::SKIN_CSS)
    data = Array((YAML.safe_load(read(DesignSystem::BACKGROUNDS_DATA)) || {}).dig("skins")&.keys).map(&:to_s)

    (registry - palette).each { |s| finding("skins.registry", "error", "registered-without-palette", "#{s} is in theme_skins.yml order but has no zer0-skin-palette block", file: DesignSystem::SKIN_SCSS) }
    (palette - registry).each { |s| finding("skins.registry", "warning", "palette-not-registered", "#{s} has a palette but is not in theme_skins.yml order", file: DesignSystem::SKINS_DATA) }
    (backgrounds - palette).each { |s| finding("skins.registry", "warning", "background-only", "#{s} has backgrounds but no palette; the skin picker cannot offer it as a full skin", file: DesignSystem::BACKGROUNDS_SCSS) }
    (palette - backgrounds).each { |s| finding("skins.registry", "error", "palette-without-background", "#{s} has a palette but no background layers", file: DesignSystem::BACKGROUNDS_SCSS) }
    (backgrounds - data).each { |s| finding("skins.registry", "warning", "background-not-in-data", "#{s} is styled in _backgrounds.scss but absent from theme_backgrounds.yml", file: DesignSystem::BACKGROUNDS_DATA) }
    (palette - mirror).each { |s| finding("skins.registry", "error", "palette-not-mirrored", "#{s} is missing from the skins.css mirror", file: DesignSystem::SKIN_CSS) }
  rescue ConfinedPath::Refused, SkinEditor::Invalid, Psych::SyntaxError => e
    finding("skins.registry", "error", "unreadable", e.message)
  end

  def skins_default
    default = SkinEditor.default(theme: theme)
    palette = selectors(DesignSystem::SKIN_SCSS)
    finding("skins.default", "error", "default-without-palette", "theme_skins.yml default #{default.inspect} has no palette", file: DesignSystem::SKINS_DATA) unless palette.include?(default)
    site_skin = BlockRewriter.scalar(read(CONFIG), "theme_skin").to_s.delete('"')
    return if site_skin.empty? || site_skin == default

    finding("skins.default", "warning", "docs-site-differs", "theme_skins.yml default is #{default} but _config.yml theme_skin is #{site_skin}", file: CONFIG)
  rescue ConfinedPath::Refused, SkinEditor::Invalid => e
    finding("skins.default", "error", "unreadable", e.message)
  end

  def backgrounds_gem
    gemspec = read(GEMSPEC)
    scss = read(DesignSystem::BACKGROUNDS_SCSS)
    return unless gemspec.include?("^assets/backgrounds/") && scss.include?("../backgrounds/")

    finding("backgrounds.gem", "warning", "gem-rejects-backgrounds",
            "the gemspec rejects assets/backgrounds/ but _backgrounds.scss references ../backgrounds/*.svg; a gem consumer gets 404s for every skin layer", file: GEMSPEC)
  rescue ConfinedPath::Refused => e
    finding("backgrounds.gem", "error", "unreadable", e.message)
  end

  def backgrounds_assets
    scss = read(DesignSystem::BACKGROUNDS_SCSS)
    scss.scan(%r{url\('\.\./backgrounds/([^']+)'\)}).flatten.uniq.each do |rel|
      next if theme.path.join("assets/backgrounds", rel).file?

      finding("backgrounds.assets", "error", "missing-svg", "assets/backgrounds/#{rel} is referenced but missing", file: DesignSystem::BACKGROUNDS_SCSS)
    end
  rescue ConfinedPath::Refused => e
    finding("backgrounds.assets", "error", "unreadable", e.message)
  end

  def tokens_contrast
    SkinEditor.all(theme: theme).each do |skin|
      skin.contrast.reject(&:pass?).each do |r|
        finding("tokens.contrast", "warning", "below-minimum", "#{skin.name}: #{r.rule} is #{r.ratio}:1 (#{r.fg} on #{r.bg}), minimum #{r.minimum}:1", file: DesignSystem::SKIN_SCSS)
      end
    end
  rescue ConfinedPath::Refused, SkinEditor::Invalid => e
    finding("tokens.contrast", "error", "unreadable", e.message)
  end

  def config_byte_copy
    expected = "{% raw %}\n#{read(CONFIG)}{% endraw %}\n"
    actual = read(BYTE_COPY)
    return if actual == expected

    finding("config.byte-copy", "error", "stale-copy", "#{BYTE_COPY} is not the raw-wrapped byte copy of _config.yml; scripts/bin/validate fails until it is refreshed", file: BYTE_COPY)
  rescue ConfinedPath::NotFound
    finding("config.byte-copy", "error", "missing-copy", "#{BYTE_COPY} is missing", file: BYTE_COPY)
  rescue ConfinedPath::Refused => e
    finding("config.byte-copy", "error", "unreadable", e.message)
  end

  def config_exclude
    [ CONFIG, DEV_CONFIG ].each do |rel|
      text = read(rel)
      lines = text.lines
      range = BlockRewriter.block_range(lines, "exclude")
      excluded = range ? lines[range].filter_map { |l| l[/\A\s*-\s*"?([^"#\n]+?)"?\s*(#.*)?$/, 1] } : []
      next if excluded.any? { |e| e.chomp("/") == "studio" }

      finding("config.exclude", "error", "studio-not-excluded", "#{rel} does not exclude studio/, so Jekyll would publish the studio", file: rel)
    end
  rescue ConfinedPath::Refused => e
    finding("config.exclude", "error", "unreadable", e.message)
  end

  def selectors(rel)
    read(rel).scan(/\[data-theme-skin="(\w+)"\]/).flatten.uniq
  end

  def read(rel)
    theme.confined.read(rel).first
  end

  def finding(check_id, severity, rule, evidence, file: "", line: nil)
    row = {
      "check_id" => check_id, "severity" => severity, "file" => file, "line" => line, "rule" => rule,
      "evidence" => evidence, "fingerprint" => Digest::SHA1.hexdigest("#{check_id}|#{rule}|#{file}|#{evidence}")[0, 12]
    }
    say("#{severity.upcase} #{check_id} #{rule}: #{evidence}")
    findings << row
    row
  end

  def say(text)
    @sink&.say(text)
  end
end
