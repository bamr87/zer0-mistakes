# frozen_string_literal: true

# Line surgery on a hand-maintained YAML file (a site's _config.yml, the
# theme's data files). Writing a whole document back through a YAML dumper
# would strip every comment and reorder every key, so each edit touches one
# line: a top-level scalar, a scalar nested one level inside a block, or a
# whole top-level block. Column alignment (`key   : value`) and a trailing
# `# comment` survive; a missing key is appended where it belongs.
#
# Generalised from zer0-image-generator's SiteConfigEditor.
module BlockRewriter
  class Error < StandardError; end

  module_function

  # The raw value text of a top-level scalar, or nil.
  def scalar(text, key)
    line = text.lines.find { |l| l.match?(scalar_re(key, 0)) }
    line && line.match(scalar_re(key, 0))[:value].strip
  end

  # The raw value text of `block_key: { key: … }`, or nil.
  def nested_scalar(text, block_key, key)
    lines = text.lines
    range = block_range(lines, block_key) or return nil
    line = lines[range].find { |l| l.match?(scalar_re(key, 1)) }
    line && line.match(scalar_re(key, 1))[:value].strip
  end

  # Rewrite the value of a top-level scalar, keeping its alignment and comment;
  # append `key: value` when the file has no such line.
  def replace_scalar(text, key, value)
    value = value.to_s
    refuse_newlines!(value)
    lines = text.lines
    index = lines.index { |l| l.match?(scalar_re(key, 0)) }
    if index
      lines[index] = rewrite_line(lines[index], key, 0, value)
      lines.join
    else
      append(text, "#{key}: #{value}\n")
    end
  end

  # Rewrite one scalar inside a top-level block; create the key (or the block)
  # when absent.
  def replace_nested_scalar(text, block_key, key, value)
    value = value.to_s
    refuse_newlines!(value)
    lines = text.lines
    range = block_range(lines, block_key)
    return append(text, "#{block_key}:\n  #{key}: #{value}\n") unless range

    index = (range.to_a).find { |i| lines[i].match?(scalar_re(key, 1)) }
    if index
      lines[index] = rewrite_line(lines[index], key, 1, value)
    else
      lines.insert(range.begin + 1, "  #{key}: #{value}\n")
    end
    lines.join
  end

  # Replace the whole top-level block (its header to the next top-level key)
  # with `block_yaml`, or append it. Comments inside the old block are lost —
  # prefer replace_nested_scalar when the keys are known.
  def replace_block(text, key, block_yaml)
    lines = text.lines
    block_yaml = "#{block_yaml}\n" unless block_yaml.end_with?("\n")
    range = block_range(lines, key)
    return append(text, block_yaml) unless range

    (lines[0...range.begin] + [ block_yaml ] + lines[(range.end + 1)..]).join
  end

  # Line indexes of a top-level block: the header line through its last
  # indented line. A line in column zero — the next key, or a comment between
  # blocks — ends it; trailing blank lines are left out.
  def block_range(lines, key)
    start = lines.index { |l| l.match?(/\A#{Regexp.escape(key)}\s*:\s*(#.*)?$/) }
    return nil unless start

    stop = start + 1
    stop += 1 while stop < lines.length && (lines[stop].strip.empty? || lines[stop].start_with?(" ", "\t"))
    stop -= 1 while stop - 1 > start && lines[stop - 1].strip.empty?
    start..(stop - 1)
  end

  # A non-blank, non-comment line that starts in column zero begins a new
  # top-level key.
  def top_level_key?(line)
    return false if line.strip.empty?
    return false if line.lstrip.start_with?("#")

    line == line.lstrip && line.include?(":")
  end

  # The value runs to a ` #` comment or the end of the line, so a quoted hex
  # colour (`"#0077b6"`) is a value and not a comment.
  def scalar_re(key, depth)
    indent = depth.zero? ? "" : " {#{depth * 2}}"
    /\A(?<prefix>#{indent}#{Regexp.escape(key)}\s*:[ \t]*)(?<value>[^\n]*?)(?<comment>[ \t]+#[^\n]*)?[ \t]*(?<eol>\r?\n)?\z/
  end

  def rewrite_line(line, key, depth, value)
    m = line.match(scalar_re(key, depth))
    "#{m[:prefix]}#{value}#{m[:comment]}#{m[:eol]}"
  end

  def append(text, chunk)
    sep = text.empty? || text.end_with?("\n") ? "" : "\n"
    "#{text}#{sep}#{chunk}"
  end

  def refuse_newlines!(value)
    raise Error, "a value cannot span lines" if value.include?("\n") || value.include?("\r")
  end
end
