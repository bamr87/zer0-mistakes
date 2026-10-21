# frozen_string_literal: true

# WCAG 2.1 relative luminance and contrast ratio, in plain Ruby, for the rule
# _sass/theme/_skins.scss states: a skin's light-mode link colour must reach
# AA (4.5:1) on white, and its dark-mode link colour AA on Bootstrap's dark
# body (#212529).
module ContrastCheck
  LIGHT_BG = "#ffffff"
  DARK_BG = "#212529"
  AA = 4.5
  AA_LARGE = 3.0

  Result = Struct.new(:rule, :fg, :bg, :ratio, :minimum, keyword_init: true) do
    def pass?
      ratio >= minimum
    end
  end

  module_function

  def hex?(value)
    value.to_s.match?(/\A#\h{6}\z/)
  end

  def rgb(hex)
    raise ArgumentError, "#{hex.inspect} is not #rrggbb" unless hex?(hex)

    hex[1..].scan(/../).map { |pair| pair.to_i(16) }
  end

  # "111, 168, 220" — the form the skin mixin's $brand-rgb argument takes.
  def rgb_triplet(hex)
    rgb(hex).join(", ")
  end

  def luminance(hex)
    r, g, b = rgb(hex).map do |c|
      c /= 255.0
      c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055)**2.4
    end
    0.2126 * r + 0.7152 * g + 0.0722 * b
  end

  def ratio(fg, bg)
    l1 = luminance(fg)
    l2 = luminance(bg)
    hi, lo = [ l1, l2 ].max, [ l1, l2 ].min
    ((hi + 0.05) / (lo + 0.05)).round(2)
  end

  # The checks for one skin palette (a Hash with string keys as SkinEditor
  # reads it): the two link rules, plus the brand on white as the 3:1 rule for
  # UI components, informational.
  def skin(palette)
    rules = [
      [ "link-light on white (AA text)", palette["link_light"], LIGHT_BG, AA ],
      [ "link-light-hover on white (AA text)", palette["link_light_hover"], LIGHT_BG, AA ],
      [ "link-dark on #212529 (AA text)", palette["link_dark"], DARK_BG, AA ],
      [ "link-dark-hover on #212529 (AA text)", palette["link_dark_hover"], DARK_BG, AA ],
      [ "brand on white (UI component, 3:1)", palette["brand"], LIGHT_BG, AA_LARGE ]
    ]
    rules.filter_map do |rule, fg, bg, minimum|
      next unless hex?(fg)

      Result.new(rule: rule, fg: fg, bg: bg, ratio: ratio(fg, bg), minimum: minimum)
    end
  end
end
