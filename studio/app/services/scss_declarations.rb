# frozen_string_literal: true

# A small reader for the theme's token and skin stylesheets: it finds every
# `--zer0-*: value;` custom property (and `$var: value;`) with the selector it
# sits in, and every `@include zer0-skin-palette(args)` call, each with the
# byte range of its value in the original text. An edit is a splice of that
# range, so comments, blank lines and hand formatting around it survive
# byte for byte.
#
# It is not a Sass parser. Comments are blanked to spaces first (so every
# offset still points into the original), then one pass follows quoted
# strings, `#{}` interpolation, parentheses and nested braces — enough for
# _sass/tokens/*, _sass/theme/_skins.scss, _sass/theme/_backgrounds.scss and
# their CSS mirrors under _design-system/tokens/. Anything it cannot follow
# raises ParseError, and the caller falls back to a raw-text edit.
module ScssDeclarations
  class ParseError < StandardError; end

  Decl = Struct.new(:kind, :selector, :name, :value, :range, keyword_init: true) do
    def key
      "#{selector}|#{name}"
    end
  end

  INCLUDE = "zer0-skin-palette"

  module_function

  def parse(text)
    Scanner.new(text).decls
  end

  # The declarations in `text` matching the selector (exact, whitespace
  # normalised) and name.
  def find(text, selector:, name:)
    want = normalize(selector)
    parse(text).select { |d| d.name == name && normalize(d.selector) == want }
  end

  # Splice new values in; `changes` maps a Decl to its replacement text.
  # Ranges never overlap, so applying from the end keeps the others valid.
  def replace(text, changes)
    out = text.dup
    changes.sort_by { |decl, _| -decl.range.begin }.each do |decl, value|
      forbidden = decl.kind == :include ? /[;{}]/ : /[;{}\r\n]/
      raise ParseError, "a value cannot contain ; { } or a newline" if value.match?(forbidden)

      out[decl.range] = value
    end
    out
  end

  def normalize(selector)
    selector.to_s.gsub(/\s+/, " ").strip
  end

  # The same text with every `//` and `/* */` comment replaced by spaces of
  # the same length, quoted strings left alone.
  def blank_comments(text)
    out = text.dup
    i = 0
    n = text.length
    while i < n
      c = text[i]
      if c == '"' || c == "'"
        j = i + 1
        j += 1 while j < n && !(text[j] == c && text[j - 1] != "\\")
        i = j + 1
      elsif c == "/" && text[i + 1] == "/"
        j = text.index("\n", i) || n
        out[i...j] = " " * (j - i)
        i = j
      elsif c == "/" && text[i + 1] == "*"
        j = text.index("*/", i + 2) or raise ParseError, "unterminated comment"
        j += 2
        out[i...j] = " " * (j - i)
        i = j
      else
        i += 1
      end
    end
    out
  end

  # One pass over the comment-blanked text. Statements end at `;`, `{` (a
  # block opens: the statement is its selector) or `}` (a block closes).
  class Scanner
    attr_reader :decls

    def initialize(text)
      @text = text
      @clean = ScssDeclarations.blank_comments(text)
      @decls = []
      @stack = []
      scan
    end

    private

    def scan
      i = 0
      n = @clean.length
      start = 0
      while i < n
        c = @clean[i]
        if c == '"' || c == "'"
          i = string_end(i)
        elsif c == "#" && @clean[i + 1] == "{"
          i = interpolation_end(i)
        elsif c == "("
          i = paren_end(i)
        elsif c == "{"
          @stack << @clean[start...i]
          i += 1
          start = i
        elsif c == "}"
          raise ParseError, "unbalanced }" if @stack.empty?

          @stack.pop
          i += 1
          start = i
        elsif c == ";"
          statement(start, i)
          i += 1
          start = i
        else
          i += 1
        end
      end
      raise ParseError, "unbalanced {" unless @stack.empty?
    end

    def statement(from, to)
      raw = @clean[from...to]
      lead = raw[/\A\s*/].length
      body = raw[lead..]
      stmt_start = from + lead
      selector = @stack.map(&:strip).reject(&:empty?).join(" ")

      if (m = body.match(/\A(--[\w-]+|\$[\w-]+)\s*:\s*/))
        value_start = stmt_start + m[0].length
        length = body[m[0].length..].rstrip.length
        @decls << Decl.new(kind: body.start_with?("--") ? :property : :variable, selector: selector,
                           name: m[1], value: @text[value_start, length], range: value_start...(value_start + length))
      elsif (m = body.match(/\A@include\s+#{Regexp.escape(INCLUDE)}\s*\(/))
        open = stmt_start + m[0].length - 1
        close = paren_end(open) - 1
        @decls << Decl.new(kind: :include, selector: selector, name: INCLUDE, value: @text[(open + 1)...close],
                           range: (open + 1)...close)
      end
    end

    def string_end(i)
      quote = @clean[i]
      j = i + 1
      while j < @clean.length
        return j + 1 if @clean[j] == quote && @clean[j - 1] != "\\"

        j += 1
      end
      raise ParseError, "unterminated string"
    end

    def interpolation_end(i)
      depth = 0
      j = i + 1
      while j < @clean.length
        case @clean[j]
        when "{" then depth += 1
        when "}"
          depth -= 1
          return j + 1 if depth.zero?
        when '"', "'" then j = string_end(j) - 1
        end
        j += 1
      end
      raise ParseError, "unterminated interpolation"
    end

    def paren_end(i)
      depth = 0
      j = i
      while j < @clean.length
        case @clean[j]
        when "(" then depth += 1
        when ")"
          depth -= 1
          return j + 1 if depth.zero?
        when '"', "'" then j = string_end(j) - 1
        when "#"
          j = interpolation_end(j) - 1 if @clean[j + 1] == "{"
        end
        j += 1
      end
      raise ParseError, "unterminated ("
    end
  end
end
