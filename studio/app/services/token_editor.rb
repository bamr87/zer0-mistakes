# Feature: ZER0-088
# frozen_string_literal: true

# Edits one token file and its CSS mirror together.
#
# A token is a `--zer0-*` (or `$sass`) declaration in the Sass source; its
# mirror is the declaration of the same name in the paired CSS file — matched
# one to one when the name appears once there, by light/dark scope when it
# appears twice, and reported as missing otherwise. A save rewrites both
# files by byte-range splice (ScssDeclarations), the source first; if the
# mirror cannot be written the source is put back, and the design-system
# parity script runs afterwards so the page shows whether the pair still
# agrees.
class TokenEditor
  class Invalid < StandardError; end

  Token = Struct.new(:id, :name, :selector, :value, :mirror_value, :decl, :mirror_decl, keyword_init: true) do
    def mirror_missing?
      mirror_decl.nil?
    end
  end

  attr_reader :slug, :scss_rel, :css_rel, :theme

  def self.all(theme: ThemeRoot)
    DesignSystem.slugs.map { |slug| new(slug, theme: theme) }
  end

  def initialize(slug, theme: ThemeRoot)
    @slug = slug.to_s
    @scss_rel = DesignSystem.scss_for(@slug)
    raise ConfinedPath::NotFound, "#{slug} is not a token file" unless @scss_rel

    @css_rel = DesignSystem::PAIRS.fetch(@scss_rel)
    @theme = theme
  end

  def title
    slug.tr("-", " ").capitalize
  end

  def scss
    @scss ||= theme.confined.read(scss_rel)
  end

  def css
    @css ||= theme.confined.read(css_rel)
  end

  def base_digest
    scss.last
  end

  def tokens
    @tokens ||= begin
      css_decls = ScssDeclarations.parse(css.first).select { |d| d.kind != :include }
      seen = Hash.new(0)
      ScssDeclarations.parse(scss.first).select { |d| d.kind != :include }.map do |decl|
        n = seen[decl.name]
        seen[decl.name] += 1
        mirror = mirror_for(decl, css_decls)
        Token.new(id: "#{decl.name}@#{n}", name: decl.name, selector: decl.selector, value: decl.value,
                  mirror_value: mirror&.value, decl: decl, mirror_decl: mirror)
      end
    end
  end

  # The texts a save would write, without writing.
  def preview(changes)
    scss_changes = {}
    css_changes = {}
    changes.each do |id, value|
      token = tokens.find { |t| t.id == id.to_s } or raise Invalid, "unknown token #{id}"
      value = value.to_s.strip
      raise Invalid, "#{token.name} cannot be empty" if value.empty?
      raise Invalid, "#{token.name}: a value cannot contain ; { } or a newline" if value.match?(/[;{}\r\n]/)
      next if value == token.value

      scss_changes[token.decl] = value
      css_changes[token.mirror_decl] = value if token.mirror_decl
    end
    { scss: ScssDeclarations.replace(scss.first, scss_changes), css: ScssDeclarations.replace(css.first, css_changes) }
  rescue ScssDeclarations::ParseError => e
    raise Invalid, e.message
  end

  def diff(changes)
    texts = preview(changes)
    UnifiedDiff.of(scss.first, texts[:scss], scss_rel) + UnifiedDiff.of(css.first, texts[:css], css_rel)
  end

  # Returns the parity script's result (ScriptRunner::Result with output).
  def update(changes, base_digest:)
    AtomicWrite.check_base!(scss_rel, base_digest, self.base_digest)
    texts = preview(changes)
    scss_path = theme.confined.writable!(scss_rel)
    css_path = theme.confined.writable!(css_rel)
    AtomicWrite.replace(scss_path, original: scss.first, text: texts[:scss])
    begin
      AtomicWrite.replace(css_path, original: css.first, text: texts[:css])
    rescue AtomicWrite::Error
      AtomicWrite.replace(scss_path, original: texts[:scss], text: scss.first)
      raise
    end
    reset!
    ScriptRunner.capture("design_system_check", theme: theme.path)
  end

  private

  def reset!
    @scss = @css = @tokens = nil
  end

  def mirror_for(decl, css_decls)
    candidates = css_decls.select { |d| d.name == decl.name }
    return candidates.first if candidates.size <= 1

    dark = decl.selector.include?("dark")
    candidates.find { |d| d.selector.include?("dark") == dark } || candidates.first
  end
end
