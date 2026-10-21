# frozen_string_literal: true

require "yaml"

# Edits one palette skin across the four files that describe it:
#
#   _sass/theme/_skins.scss          the `@include zer0-skin-palette(...)` call
#   _design-system/tokens/skins.css  the plain-CSS mirror (light + dark blocks)
#   _sass/theme/_backgrounds.scss    the skin's pattern size
#   _data/theme_backgrounds.yml      the skin's three background colours
#
# The palette's RGB triplet is derived from the brand colour, never typed.
# Every write is a byte-range splice or a one-line rewrite, so comments and
# alignment survive; the four writes run in order and are undone in reverse
# when a later one fails; the parity script runs afterwards.
class SkinEditor
  class Invalid < StandardError; end

  COLOR_FIELDS = %w[brand accent link_light link_light_hover link_dark link_dark_hover].freeze
  BACKGROUND_FIELDS = %w[bg_primary bg_secondary bg_accent].freeze
  PATTERN_SIZE = /\A\d{1,3}px \d{1,3}px\z/
  NAME = /\A[a-z][a-z0-9-]{0,31}\z/

  # The mirror's declarations, light block then dark block.
  LIGHT_MIRROR = {
    "--zer0-color-primary" => "brand", "--bs-primary" => "brand",
    "--zer0-color-primary-rgb" => "brand_rgb", "--bs-primary-rgb" => "brand_rgb",
    "--zer0-color-accent" => "accent",
    "--bs-link-color" => "link_light", "--zer0-color-link" => "link_light",
    "--bs-link-hover-color" => "link_light_hover", "--zer0-color-link-hover" => "link_light_hover",
    "--zer0-color-border" => "border"
  }.freeze
  DARK_MIRROR = {
    "--bs-link-color" => "link_dark", "--zer0-color-link" => "link_dark",
    "--bs-link-hover-color" => "link_dark_hover", "--zer0-color-link-hover" => "link_dark_hover"
  }.freeze

  attr_reader :name, :theme

  def self.names(theme: ThemeRoot)
    Array(registry(theme)["order"]).map(&:to_s)
  end

  def self.default(theme: ThemeRoot)
    registry(theme)["default"].to_s
  end

  def self.registry(theme)
    YAML.safe_load(theme.confined.read(DesignSystem::SKINS_DATA).first) || {}
  rescue Psych::SyntaxError => e
    raise Invalid, "#{DesignSystem::SKINS_DATA}: #{e.message}"
  end

  def self.all(theme: ThemeRoot)
    names(theme: theme).map { |n| new(n, theme: theme) }
  end

  def initialize(name, theme: ThemeRoot)
    raise ConfinedPath::NotFound, "#{name.inspect} is not a skin name" unless name.to_s.match?(NAME)

    @name = name.to_s
    @theme = theme
    raise ConfinedPath::NotFound, "no skin #{@name} in #{DesignSystem::SKIN_SCSS}" unless include_decl
  end

  def selector
    %([data-theme-skin="#{name}"])
  end

  def dark_selector
    %([data-theme-skin="#{name}"][data-bs-theme="dark"])
  end

  def skins_scss = @skins_scss ||= theme.confined.read(DesignSystem::SKIN_SCSS)
  def skins_css = @skins_css ||= theme.confined.read(DesignSystem::SKIN_CSS)
  def backgrounds_scss = @backgrounds_scss ||= theme.confined.read(DesignSystem::BACKGROUNDS_SCSS)
  def backgrounds_yml = @backgrounds_yml ||= theme.confined.read(DesignSystem::BACKGROUNDS_DATA)

  def base_digest
    skins_scss.last
  end

  # String-keyed: brand, brand_rgb, accent, the four link colours, pattern_size,
  # bg_primary, bg_secondary, bg_accent. Missing pieces are nil.
  def palette
    @palette ||= begin
      args = ArgList.new(include_decl.value)
      p = {
        "brand" => args.positional(0), "brand_rgb" => args.positional(1)&.delete('"'),
        "accent" => args.positional(2),
        "link_light" => args.keyword("link-light"), "link_light_hover" => args.keyword("link-light-hover"),
        "link_dark" => args.keyword("link-dark"), "link_dark_hover" => args.keyword("link-dark-hover")
      }
      size = ScssDeclarations.find(backgrounds_scss.first, selector: selector, name: "--zer0-bg-pattern-size").first
      p["pattern_size"] = size&.value
      colors = background_colors
      p["bg_primary"] = colors["primary"]
      p["bg_secondary"] = colors["secondary"]
      p["bg_accent"] = colors["accent"]
      p
    end
  end

  def contrast(params = {})
    ContrastCheck.skin(palette.merge(clean(params).slice(*COLOR_FIELDS)))
  end

  # The four texts a save would write.
  def preview(params)
    values = clean(params)
    wanted = palette.merge(values)
    wanted["brand_rgb"] = ContrastCheck.rgb_triplet(wanted["brand"]) if ContrastCheck.hex?(wanted["brand"])
    wanted["border"] = "rgba(#{wanted['brand_rgb']}, 0.28)"

    {
      skins_scss: rewrite_include(wanted),
      skins_css: rewrite_mirror(wanted),
      backgrounds_scss: rewrite_pattern_size(wanted),
      backgrounds_yml: rewrite_background_colors(wanted)
    }
  rescue ScssDeclarations::ParseError => e
    raise Invalid, e.message
  end

  def diff(params)
    texts = preview(params)
    UnifiedDiff.of(skins_scss.first, texts[:skins_scss], DesignSystem::SKIN_SCSS) +
      UnifiedDiff.of(skins_css.first, texts[:skins_css], DesignSystem::SKIN_CSS) +
      UnifiedDiff.of(backgrounds_scss.first, texts[:backgrounds_scss], DesignSystem::BACKGROUNDS_SCSS) +
      UnifiedDiff.of(backgrounds_yml.first, texts[:backgrounds_yml], DesignSystem::BACKGROUNDS_DATA)
  end

  def update(params, base_digest:)
    AtomicWrite.check_base!(DesignSystem::SKIN_SCSS, base_digest, self.base_digest)
    texts = preview(params)
    writes = [
      [ DesignSystem::SKIN_SCSS, skins_scss.first, texts[:skins_scss] ],
      [ DesignSystem::SKIN_CSS, skins_css.first, texts[:skins_css] ],
      [ DesignSystem::BACKGROUNDS_SCSS, backgrounds_scss.first, texts[:backgrounds_scss] ],
      [ DesignSystem::BACKGROUNDS_DATA, backgrounds_yml.first, texts[:backgrounds_yml] ]
    ]
    done = []
    writes.each do |rel, original, text|
      path = theme.confined.writable!(rel)
      begin
        AtomicWrite.replace(path, original: original, text: text)
      rescue AtomicWrite::Error
        done.reverse_each { |p, o, t| AtomicWrite.replace(p, original: t, text: o) }
        raise
      end
      done << [ path, original, text ]
    end
    reset!
    ScriptRunner.capture("design_system_check", theme: theme.path)
  end

  private

  def reset!
    @skins_scss = @skins_css = @backgrounds_scss = @backgrounds_yml = @palette = @include_decl = nil
  end

  def include_decl
    @include_decl ||= ScssDeclarations.find(skins_scss.first, selector: selector, name: ScssDeclarations::INCLUDE).first
  end

  def clean(params)
    values = {}
    params.to_h.each do |key, value|
      key = key.to_s
      value = value.to_s.strip
      next unless (COLOR_FIELDS + BACKGROUND_FIELDS + %w[pattern_size]).include?(key)
      next if value.empty?

      if key == "pattern_size"
        raise Invalid, "pattern size must look like 48px 48px" unless value.match?(PATTERN_SIZE)
      else
        value = value.downcase
        raise Invalid, "#{key.tr('_', '-')} must be a #rrggbb colour" unless ContrastCheck.hex?(value)
      end
      values[key] = value
    end
    values
  end

  def rewrite_include(wanted)
    args = ArgList.new(include_decl.value)
    changes = {}
    changes[args.positional_range(0)] = wanted["brand"] if args.positional(0)
    changes[args.positional_range(1)] = %("#{wanted['brand_rgb']}") if args.positional(1)
    changes[args.positional_range(2)] = wanted["accent"] if args.positional(2)
    %w[link-light link-light-hover link-dark link-dark-hover].each do |kw|
      range = args.keyword_range(kw)
      changes[range] = wanted[kw.tr("-", "_")] if range && wanted[kw.tr("-", "_")]
    end
    new_args = include_decl.value.dup
    changes.sort_by { |range, _| -range.begin }.each { |range, value| new_args[range] = value }
    ScssDeclarations.replace(skins_scss.first, { include_decl => new_args })
  end

  def rewrite_mirror(wanted)
    text = skins_css.first
    changes = {}
    [ [ selector, LIGHT_MIRROR ], [ dark_selector, DARK_MIRROR ] ].each do |sel, mapping|
      mapping.each do |css_name, field|
        next unless wanted[field]

        ScssDeclarations.find(text, selector: sel, name: css_name).each { |decl| changes[decl] = wanted[field] }
      end
    end
    ScssDeclarations.replace(text, changes)
  end

  def rewrite_pattern_size(wanted)
    text = backgrounds_scss.first
    return text unless wanted["pattern_size"]

    decls = ScssDeclarations.find(text, selector: selector, name: "--zer0-bg-pattern-size")
    ScssDeclarations.replace(text, decls.to_h { |d| [ d, wanted["pattern_size"] ] })
  end

  # `skins: <name>: colors: {primary, secondary, accent}` — rewritten one line
  # at a time inside the skin's block so the comments around it survive.
  def rewrite_background_colors(wanted)
    text = backgrounds_yml.first
    lines = text.lines
    range = skin_block_range(lines) or return text
    { "primary" => "bg_primary", "secondary" => "bg_secondary", "accent" => "bg_accent" }.each do |key, field|
      next unless wanted[field]

      index = range.find { |i| lines[i].match?(/\A\s{6}#{key}\s*:/) }
      next unless index

      lines[index] = lines[index].sub(COLOR_LINE) { "#{$1}\"#{wanted[field]}\"#{$3}#{$4}" }
    end
    lines.join
  end

  # `      primary: "#e8f4f8"   # hero` — the value is a quoted or bare hex, or
  # anything up to a ` #` comment.
  COLOR_LINE = /\A(\s{6}[a-z]+\s*:[ \t]*)("#\h{6}"|#\h{6}|[^\n]*?)([ \t]+#.*)?(\r?\n)?\z/

  def background_colors
    lines = backgrounds_yml.first.lines
    range = skin_block_range(lines) or return {}
    %w[primary secondary accent].to_h do |key|
      line = range.map { |i| lines[i] }.find { |l| l.match?(/\A\s{6}#{key}\s*:/) }
      [ key, line && line.match(COLOR_LINE)[2].strip.delete('"') ]
    end
  end

  # The line range of `  <name>:` under the top-level `skins:` block.
  def skin_block_range(lines)
    skins = BlockRewriter.block_range(lines, "skins") or return nil
    start = skins.find { |i| lines[i].match?(/\A  #{Regexp.escape(name)}\s*:/) } or return nil
    stop = start + 1
    stop += 1 while stop <= skins.end && !lines[stop].match?(/\A  \S/)
    start...stop
  end

  # The arguments of one `zer0-skin-palette(...)` call: positional values and
  # `$keyword: value` pairs, each with its range inside the args text.
  class ArgList
    Arg = Struct.new(:keyword, :value, :range)

    def initialize(text)
      @args = split(text)
    end

    def positional(i)
      @args.reject(&:keyword)[i]&.value
    end

    def positional_range(i)
      @args.reject(&:keyword)[i]&.range
    end

    def keyword(name)
      @args.find { |a| a.keyword == name }&.value
    end

    def keyword_range(name)
      @args.find { |a| a.keyword == name }&.range
    end

    private

    def split(text)
      args = []
      depth = 0
      quote = nil
      start = 0
      i = 0
      while i <= text.length
        c = text[i]
        if quote
          quote = nil if c == quote
        elsif c == '"' || c == "'"
          quote = c
        elsif c == "("
          depth += 1
        elsif c == ")"
          depth -= 1
        elsif (c == "," && depth.zero?) || c.nil?
          args << arg(text, start, i)
          start = i + 1
        end
        i += 1
      end
      args.compact
    end

    def arg(text, from, to)
      raw = text[from...to]
      return nil if raw.strip.empty?

      lead = raw[/\A\s*/].length
      body = raw[lead..].rstrip
      if (m = body.match(/\A\$([\w-]+)\s*:\s*/))
        value_start = from + lead + m[0].length
        value = body[m[0].length..]
        Arg.new(m[1], value, value_start...(value_start + value.length))
      else
        Arg.new(nil, body, (from + lead)...(from + lead + body.length))
      end
    end
  end
end
