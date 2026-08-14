#!/usr/bin/env ruby
# Feature: ZER0-081
# frozen_string_literal: true

# ---------------------------------------------------------------------------
# design-system-check — token parity between the theme and its Claude Design
# mirror.
#
# The `--zer0-*` design tokens live twice on purpose:
#   - `_sass/tokens/*.scss`         — the source of truth the theme compiles
#   - `_design-system/tokens/*.css` — the mirror pushed to the Claude Design
#                                     project (see _design-system/SYNC.md)
#
# This check keeps the two in lockstep so the design system can be built from
# either side without silent drift:
#
#   1. Per file pair: the sets of `--zer0-*` names must match, and every value
#      must resolve to the same string. `var(--x, fallback)` wrappers are
#      resolved against the mirror's concrete `--bs-*`/`--bd-*` primitives, so
#      the theme's alias form and the mirror's self-contained form compare
#      equal.
#   2. Skins: `_sass/theme/_skins.scss` and `tokens/skins.css` must declare the
#      same skin names, and each mirror skin's brand hex must appear in the
#      matching SCSS block.
#   3. Dangling-token audit: any fallback-less `var(--zer0-…)` reference in
#      `_sass/` must be declared somewhere (tokens, includes, or JS).
#
#   ruby scripts/design-system-check.rb        # exit 1 + report on drift
#
# Runs in the `core` test suite (test/test_core.sh). Plain Ruby, no gems.
# ---------------------------------------------------------------------------

ROOT = File.expand_path('..', __dir__)

PAIRS = {
  '_sass/tokens/_color.scss'       => '_design-system/tokens/colors.css',
  '_sass/tokens/_spacing.scss'     => '_design-system/tokens/spacing.css',
  '_sass/tokens/_radius.scss'      => '_design-system/tokens/radius.css',
  '_sass/tokens/_typography.scss'  => '_design-system/tokens/typography.css',
  '_sass/tokens/_shadow.scss'      => '_design-system/tokens/shadows.css',
  '_sass/tokens/_motion.scss'      => '_design-system/tokens/motion.css',
  '_sass/tokens/_breakpoints.scss' => '_design-system/tokens/breakpoints.css',
  '_sass/tokens/_layers.scss'      => '_design-system/tokens/layers.css'
}.freeze

SKIN_SCSS = '_sass/theme/_skins.scss'
SKIN_CSS  = '_design-system/tokens/skins.css'

def read(rel)
  path = File.join(ROOT, rel)
  abort "design-system-check: missing file #{rel}" unless File.file?(path)
  File.read(path)
end

# Strip /* */ blocks, // line comments, and everything from the first @media on
# (motion files re-declare durations under prefers-reduced-motion).
def strip(text, scss:)
  t = text.split('@media', 2).first
  t = t.gsub(%r{/\*.*?\*/}m, '')
  t = t.gsub(%r{(?:^|\s)//.*$}, '') if scss
  t
end

# { '--zer0-foo' => 'raw value', ... } from declaration-position matches.
def declarations(text)
  text.scan(/(--zer0-[\w-]+)\s*:\s*([^;]+);/).each_with_object({}) do |(k, v), h|
    h[k] ||= v.strip.gsub(/\s+/, ' ')
  end
end

# All custom properties (any prefix) declared in the mirror's colors.css light
# scope — the concrete primitives var() chains resolve against.
def primitives
  light = read(SKIN_CSS.sub('skins', 'colors')).split('[data-bs-theme="dark"]', 2).first
  strip(light, scss: false).scan(/(--[\w-]+)\s*:\s*([^;]+);/)
                           .each_with_object({}) { |(k, v), h| h[k] ||= v.strip.gsub(/\s+/, ' ') }
end

# Resolve a value that is entirely a var() wrapper: prefer the primitive's
# concrete value, else the wrapper's own fallback. Inner var() references in
# composite values (color-mix, rgba) are left as-is and compared literally.
def resolve(value, prims, depth = 0)
  v = value.strip.gsub(/\s+/, ' ')
  return v if depth > 6

  m = v.match(/\Avar\((--[\w-]+)(?:\s*,\s*(.+))?\)\z/)
  return v unless m

  name, fallback = m[1], m[2]
  if prims.key?(name)
    resolve(prims[name], prims, depth + 1)
  elsif fallback
    resolve(fallback, prims, depth + 1)
  else
    v
  end
end

failures = []
prims = primitives

# --- 1. token parity per file pair -----------------------------------------
PAIRS.each do |scss_rel, css_rel|
  scss = declarations(strip(read(scss_rel), scss: true))
  css  = declarations(strip(read(css_rel),  scss: false))

  (scss.keys - css.keys).each { |k| failures << "#{css_rel}: missing #{k} (declared in #{scss_rel})" }
  (css.keys - scss.keys).each { |k| failures << "#{scss_rel}: missing #{k} (declared in #{css_rel})" }

  (scss.keys & css.keys).each do |k|
    a = resolve(scss[k], prims)
    b = resolve(css[k], prims)
    failures << "#{k}: theme resolves to `#{a}` but mirror to `#{b}`" unless a == b
  end
end

# Both motion files must keep the reduced-motion guard.
[PAIRS.key('_design-system/tokens/motion.css'), '_design-system/tokens/motion.css'].each do |rel|
  failures << "#{rel}: lost its prefers-reduced-motion guard" unless read(rel).include?('prefers-reduced-motion')
end

# --- 2. skins: same names, same brand hex ----------------------------------
scss_skins_src = read(SKIN_SCSS)
css_skins_src  = read(SKIN_CSS)
scss_skins = scss_skins_src.scan(/\[data-theme-skin="(\w+)"\]/).flatten.uniq.sort
css_skins  = css_skins_src.scan(/\[data-theme-skin="(\w+)"\]/).flatten.uniq.sort
unless scss_skins == css_skins
  failures << "skins differ: theme has #{scss_skins.join(', ')} but mirror has #{css_skins.join(', ')}"
end

(scss_skins & css_skins).each do |skin|
  block = css_skins_src[/\[data-theme-skin="#{skin}"\]\s*\{.*?\}/m].to_s
  hex = block[/--zer0-color-primary:\s*(#\h+)/, 1]
  next unless hex

  scss_block = scss_skins_src[/\[data-theme-skin="#{skin}"\]\s*\{.*?\}/m].to_s
  unless scss_block.downcase.include?(hex.downcase)
    failures << "skin #{skin}: mirror brand #{hex} not found in #{SKIN_SCSS}"
  end
end

# --- 3. dangling-token audit ------------------------------------------------
declared = Dir.glob(File.join(ROOT, '_sass/**/*.scss'))
              .flat_map { |f| File.read(f).scan(/(--zer0-[\w-]+)\s*:/) }.flatten
declared += Dir.glob(File.join(ROOT, '{_includes,_layouts}/**/*.html'))
               .flat_map { |f| File.read(f).scan(/(--zer0-[\w-]+)\s*:/) }.flatten
declared += Dir.glob(File.join(ROOT, 'assets/js/**/*.js')).flat_map do |f|
  src = File.read(f)
  src.scan(/setProperty\(\s*['"](--zer0-[\w-]+)/).flatten +
    src.scan(/['"`](--zer0-[\w-]+)['"`:]/).flatten
end
declared = declared.uniq

Dir.glob(File.join(ROOT, '_sass/**/*.scss')).sort.each do |f|
  File.read(f).scan(/var\(\s*(--zer0-[\w-]+)\s*\)/).flatten.uniq.each do |token|
    next if declared.include?(token)

    failures << "#{f.sub("#{ROOT}/", '')}: references #{token} with no fallback, but it is never declared"
  end
end

# --- report -----------------------------------------------------------------
if failures.empty?
  puts "design-system-check: OK — #{PAIRS.size} token file pairs, #{css_skins.size} skins, no dangling tokens"
else
  warn "design-system-check: #{failures.size} problem(s) — theme (_sass/tokens) and mirror (_design-system/tokens) have drifted:"
  failures.each { |f| warn "  - #{f}" }
  warn 'Fix the drift (see _design-system/SYNC.md), then re-run: ruby scripts/design-system-check.rb'
  exit 1
end
