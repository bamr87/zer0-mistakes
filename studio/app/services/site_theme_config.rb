# frozen_string_literal: true

# The theme keys of a consumer site's _config.yml, edited one line at a time
# (BlockRewriter) so the site's comments, alignment and every other key stay
# byte for byte: the skin, the colour-mode default and lock, the appearance
# panel, user overrides, the `theme_background` block and the hex values of
# the `theme_color` block.
class SiteThemeConfig
  class Invalid < StandardError; end

  CONFIG = "_config.yml"
  SCALARS = {
    "theme_skin" => :skin,
    "color_mode_default" => %w[auto light dark],
    "color_mode_lock" => :bool,
    "appearance_panel" => :bool,
    "user_overrides" => :bool
  }.freeze
  BACKGROUND = {
    "enabled" => :bool,
    "gradient_opacity" => :number,
    "texture_opacity" => :number,
    "pattern_opacity" => :number,
    "blend_mode" => %w[overlay multiply screen soft-light hard-light normal]
  }.freeze
  COLOR_KEY = /\A[a-z][a-z0-9_-]{0,31}\z/

  attr_reader :site

  def initialize(site)
    @site = site
  end

  def config
    @config ||= site.confined.read(CONFIG)
  end

  def base_digest
    config.last
  end

  # Raw values as the file holds them (strings; nil when absent).
  def current
    text = config.first
    values = {}
    SCALARS.each_key { |key| values[key] = unquote(BlockRewriter.scalar(text, key)) }
    values["theme_background"] = BACKGROUND.keys.to_h { |key| [ key, unquote(BlockRewriter.nested_scalar(text, "theme_background", key)) ] }
    values["theme_color"] = color_values(text)
    values
  end

  def preview(params)
    text = config.first
    scalars, background, colors = clean(params)
    scalars.each { |key, value| text = BlockRewriter.replace_scalar(text, key, value) }
    background.each { |key, value| text = BlockRewriter.replace_nested_scalar(text, "theme_background", key, value) }
    colors.each { |key, value| text = BlockRewriter.replace_nested_scalar(text, "theme_color", key, value) }
    text
  rescue BlockRewriter::Error => e
    raise Invalid, e.message
  end

  def diff(params)
    UnifiedDiff.of(config.first, preview(params), "#{site.name}/#{CONFIG}")
  end

  def update(params, base_digest:)
    AtomicWrite.check_base!(CONFIG, base_digest, self.base_digest)
    text = preview(params)
    AtomicWrite.replace(site.confined.writable!(CONFIG), original: config.first, text: text)
    @config = nil
    text
  end

  private

  # [scalars, background, colors] as YAML value text.
  def clean(params)
    params = params.to_h.transform_keys(&:to_s)
    scalars = {}
    SCALARS.each do |key, kind|
      next unless params.key?(key)

      scalars[key] = yaml_value(key, kind, params[key])
    end
    background = {}
    (params["theme_background"] || {}).to_h.each do |key, value|
      kind = BACKGROUND[key.to_s] or next
      background[key.to_s] = yaml_value(key, kind, value)
    end
    colors = {}
    (params["theme_color"] || {}).to_h.each do |key, value|
      key = key.to_s
      raise Invalid, "#{key} is not a colour key" unless key.match?(COLOR_KEY)

      colors[key] = yaml_value(key, :hex, value)
    end
    [ scalars, background, colors ]
  end

  def yaml_value(key, kind, value)
    value = value.to_s.strip
    case kind
    when :bool
      raise Invalid, "#{key} must be true or false" unless %w[true false].include?(value)

      value
    when :number
      raise Invalid, "#{key} must be a number" unless value.match?(/\A\d+(\.\d+)?\z/)

      value
    when :skin
      raise Invalid, "#{key} must be a skin name" unless value.match?(SkinEditor::NAME)

      %("#{value}")
    when :hex
      value = value.downcase
      raise Invalid, "#{key} must be a #rrggbb colour" unless ContrastCheck.hex?(value)

      %("#{value}")
    when Array
      raise Invalid, "#{key} must be one of #{kind.join(', ')}" unless kind.include?(value)

      value
    end
  end

  def color_values(text)
    lines = text.lines
    range = BlockRewriter.block_range(lines, "theme_color") or return {}
    lines[range].drop(1).filter_map do |line|
      m = line.match(/\A  ([a-z][a-z0-9_-]*)\s*:\s*("?#?\h{6}"?)/) or next
      [ m[1], unquote(m[2]) ]
    end.to_h
  end

  def unquote(value)
    return nil if value.nil?

    value.to_s.strip.delete_prefix('"').delete_suffix('"').delete_prefix("'").delete_suffix("'")
  end
end
