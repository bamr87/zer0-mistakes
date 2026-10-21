# frozen_string_literal: true

# Where the theme's design tokens live, twice: the Sass source under
# _sass/tokens/ and the plain-CSS mirror under _design-system/tokens/ that
# ships without Jekyll. The pairs are the ones scripts/design-system-check.rb
# compares; TokenEditor writes both halves of a pair together and the doctor
# runs the script afterwards, so a mapping drift between this table and the
# script's surfaces as a parity failure rather than a silent half-edit.
module DesignSystem
  PAIRS = {
    "_sass/tokens/_color.scss" => "_design-system/tokens/colors.css",
    "_sass/tokens/_spacing.scss" => "_design-system/tokens/spacing.css",
    "_sass/tokens/_radius.scss" => "_design-system/tokens/radius.css",
    "_sass/tokens/_typography.scss" => "_design-system/tokens/typography.css",
    "_sass/tokens/_shadow.scss" => "_design-system/tokens/shadows.css",
    "_sass/tokens/_motion.scss" => "_design-system/tokens/motion.css",
    "_sass/tokens/_breakpoints.scss" => "_design-system/tokens/breakpoints.css",
    "_sass/tokens/_layers.scss" => "_design-system/tokens/layers.css"
  }.freeze

  SKIN_SCSS = "_sass/theme/_skins.scss"
  SKIN_CSS = "_design-system/tokens/skins.css"
  BACKGROUNDS_SCSS = "_sass/theme/_backgrounds.scss"
  SKINS_DATA = "_data/theme_skins.yml"
  BACKGROUNDS_DATA = "_data/theme_backgrounds.yml"
  CHECK_SCRIPT = "scripts/design-system-check.rb"

  module_function

  # "_sass/tokens/_color.scss" → "color"
  def slug(scss_rel)
    File.basename(scss_rel, ".scss").delete_prefix("_")
  end

  def scss_for(slug)
    PAIRS.keys.find { |rel| slug(rel) == slug.to_s }
  end

  def slugs
    PAIRS.keys.map { |rel| slug(rel) }
  end
end
