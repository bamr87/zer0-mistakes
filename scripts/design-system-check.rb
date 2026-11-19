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
#      `_sass/` must be declared somewhere (tokens, includes, or JS). So must a
#      reference WITH a fallback when it names a design-token family — the
#      first segment after `--zer0-` of any name `_sass/tokens/` declares
#      (`radius`, `color`, `motion`, …). There a fallback only hides a typo:
#      `var(--zer0-radius-md, 0.5rem)` rendered its fallback for months because
#      the scale has no `-md` step (#390). Component hooks outside those
#      families (`--zer0-navbar-max-width`, `--zer0-cookie-banner-inset`) are
#      opt-in by design and keep their fallbacks. KNOWN_GAPS lists the family
#      references that predate the rule; it may only shrink.
#   4. Radius-literal audit: a radius declaration in `_sass/` (`border-radius`,
#      `border-*-radius`, or a custom property named `*radius*`) may not spell
#      out a value the `--zer0-radius-*` scale already names — `0.375rem` is
#      `var(--zer0-radius)`. The scale is read from `_sass/tokens/_radius.scss`;
#      values inside `var()` (Bootstrap's `--bs-border-radius*` and fallbacks)
#      are not literals. A deliberate literal carries an `// off-scale: <why>`
#      comment on the same line (#390).
#
#   ruby scripts/design-system-check.rb        # exit 1 + report on drift
#
# Runs in the `core` test suite (test/test_core.sh); test/test_core_checks.sh
# plants a literal and an undeclared token to prove both audits can fail.
# Plain Ruby, no gems.
# ---------------------------------------------------------------------------

# The partials are UTF-8 (em dashes in comments). Under a US-ASCII locale the
# regex scans raised "invalid byte sequence" instead of reporting anything.
Encoding.default_external = Encoding::UTF_8

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

# Family = the first segment after `--zer0-`: `--zer0-radius-lg` is `radius`.
def family(token)
  token.sub('--zer0-', '').split('-').first
end

families = Dir.glob(File.join(ROOT, '_sass/tokens/*.scss'))
              .flat_map { |f| File.read(f).scan(/(--zer0-[\w-]+)\s*:/).flatten }
              .map { |t| family(t) }.uniq

# Design-token-family references that predated the fallback rule (#390). Each
# renders its fallback today; fixing one changes what renders, so each is its
# own change. Remove an entry when its reference is fixed — the check fails on
# an entry that is no longer needed, so this list can only shrink.
KNOWN_GAPS = {
  '--zer0-color-text-muted' => 'author byline (_author.scss); --zer0-color-ink-muted is the declared token with the same value',
  '--zer0-motion-duration' => 'page-feedback fades (_page-feedback.scss) run on the 180ms fallback; the nearest token, -base, is 200ms',
  '--zer0-sidebar-rail-width' => 'docs sidebar rail (_docs-layout.scss) lives only in its 2.25rem fallback',
  '--zer0-sidebar-toc-rail-width' => 'docs TOC rail (_docs-layout.scss) lives only in its 2.25rem fallback'
}.freeze

gaps_seen = []
Dir.glob(File.join(ROOT, '_sass/**/*.scss')).sort.each do |f|
  File.read(f).scan(/var\(\s*(--zer0-[\w-]+)\s*([,)])/).uniq.each do |token, after|
    next if declared.include?(token)

    rel = f.sub("#{ROOT}/", '')
    if after == ')'
      failures << "#{rel}: references #{token} with no fallback, but it is never declared"
    elsif families.include?(family(token))
      if KNOWN_GAPS.key?(token)
        gaps_seen << token
      else
        failures << "#{rel}: references #{token} behind a fallback, but the --zer0-#{family(token)}-* " \
                    'token family declares no such token — the fallback is hiding a typo'
      end
    end
  end
end
(KNOWN_GAPS.keys - gaps_seen).each do |token|
  failures << "KNOWN_GAPS lists #{token}, but no _sass/ fallback reference to an undeclared #{token} remains — remove the entry"
end

# --- 4. radius-literal audit ------------------------------------------------
RADIUS_TOKENS = '_sass/tokens/_radius.scss'
OFF_SCALE = '// off-scale:'
RADIUS_DECL = /(?:\A|[\s{;])(border(?:-(?:top|bottom)-(?:left|right)|-(?:start|end)-(?:start|end))?-radius|--[\w-]*radius[\w-]*)\s*:\s*([^;{}]*)/.freeze
LENGTH = /\A(-?\d*\.?\d+)(rem|em|px|%)\z/.freeze

# `0.25rem`, `.25rem` and `0.250rem` are one length.
def length_key(value)
  m = value.match(LENGTH)
  m && "#{m[1].to_f}#{m[2]}"
end

# Drop every var(...) group, innermost first: a value read from a custom
# property (`var(--bs-border-radius)`, `var(--x, 0.5rem)`) is not a literal.
def without_vars(value)
  v = value.dup
  v = v.gsub(/var\([^()]*\)/, ' ') while v.match?(/var\([^()]*\)/)
  v
end

# The code on each source line: /* */ blocks (which may span lines) and //
# line comments removed, one entry per line so line numbers hold. A `/*` inside
# a `//` comment (`see _sass/tokens/*`) does not open a block.
def code_lines(src)
  in_block = false
  src.each_line.map do |line|
    code = +''
    rest = line
    until rest.empty?
      if in_block
        close = rest.index('*/')
        break unless close

        rest = rest[(close + 2)..-1]
        in_block = false
        next
      end
      open = rest.index('/*')
      slashes = rest.index('//')
      if slashes && (open.nil? || slashes < open)
        code << rest[0...slashes]
        break
      elsif open
        code << rest[0...open]
        rest = rest[(open + 2)..-1]
        in_block = true
      else
        code << rest
        break
      end
    end
    code
  end
end

scale = declarations(strip(read(RADIUS_TOKENS), scss: true)).each_with_object({}) do |(name, value), h|
  key = length_key(value)
  h[key] ||= name if key
end

Dir.glob(File.join(ROOT, '_sass/**/*.scss')).sort.each do |f|
  rel = f.sub("#{ROOT}/", '')
  next if rel.start_with?('_sass/tokens/') # the scale's own definitions

  src = File.read(f)
  raw = src.lines
  code_lines(src).each_with_index do |code, i|
    next if raw[i].include?(OFF_SCALE)

    code.scan(RADIUS_DECL).each do |prop, value|
      without_vars(value).split(%r{[\s,/*+()]+}).uniq.each do |part|
        token = scale[length_key(part)]
        next unless token

        failures << "#{rel}:#{i + 1}: #{prop}: #{value.strip} spells out #{part} — use var(#{token}), " \
                    "or keep the literal with `#{OFF_SCALE} <why>` on the line"
      end
    end
  end
end

# --- report -----------------------------------------------------------------
if failures.empty?
  puts "design-system-check: OK — #{PAIRS.size} token file pairs, #{css_skins.size} skins, no dangling tokens, " \
       'no on-scale radius literals'
else
  warn "design-system-check: #{failures.size} problem(s) — token drift (_sass/tokens vs _design-system/tokens), " \
       'dangling tokens or on-scale radius literals:'
  failures.each { |f| warn "  - #{f}" }
  warn 'Fix them (token drift: _design-system/SYNC.md; tokens and radii: docs/ui/design-tokens.md), ' \
       'then re-run: ruby scripts/design-system-check.rb'
  exit 1
end
